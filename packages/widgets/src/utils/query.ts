import { createCache } from './cache';

function base64UrlEncode (input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  bytes.forEach(b => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const { getCache, setCache } = createCache('db/sql');

export async function doDbSqlQuery (prop: { sql: string, db: string, force: boolean, use?: string }, signal?: AbortSignal): Promise<any> {
  let invalidCache;
  if (!prop.force) {
    const data = await getCache(prop.db, prop.sql, prop.use || '');
    if (data && (!isFinite(data.expired) || data.expired > Date.now())) {
      return data;
    }
    invalidCache = data;
  }

  // Preferred transport: GET with the SQL encoded in the path, which works
  // even behind CDNs that forbid POST and strip query strings. Falls back to
  // the plain GET query param, then to the classic POST body.
  const sqlPath = base64UrlEncode(prop.sql);
  let res = await fetch(`/api/db/${encodeURIComponent(prop.db)}/q/${sqlPath}`, { method: 'get', signal });
  if (res.status === 404) {
    // Older deployment without the path route: try the query-param variant.
    res = await fetch(`/api/db/${encodeURIComponent(prop.db)}?force=${prop.force}&use=${encodeURIComponent(prop.use ?? '')}&sql=${encodeURIComponent(prop.sql)}`, { method: 'get', signal });
  }
  // Retry via POST when the GET transports themselves are unavailable; a 400
  // means the SQL failed to execute, i.e. the transport worked.
  if ([403, 405, 422].includes(res.status)) {
    res = await fetch(`/api/db/${prop.db}?force=${prop.force}&use=${prop.use ?? ''}`, {
      method: 'post',
      body: prop.sql,
      signal,
    });
  }
  if (res.ok) {
    const data = await res.json();
    if (isFinite(data.ttl)) {
      data.expired = Date.now() + data.ttl * 1000;
    }
    await setCache(prop.db, prop.sql, prop.use || '', data);
    return data;
  } else {
    try {
      if (invalidCache) {
        return invalidCache;
      }
      const response = await res.json();
      return Promise.reject(new Error(response?.message ?? JSON.stringify(response)));
    } catch {
      return Promise.reject(new Error(`${res.status} ${res.statusText}`));
    }
  }
}
