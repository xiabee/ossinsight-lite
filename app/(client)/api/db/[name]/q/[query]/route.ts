import { handleDbQuery } from '@/app/(client)/api/db/handler';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET transport with the SQL encoded into the path (base64url).
 *
 * Some CDN distributions forward neither POST bodies nor query strings;
 * the URL path is always forwarded, so widgets stay functional behind them.
 */
export async function GET (req: NextRequest, { params: { name, query } }: any) {
  let sql: string;
  try {
    const b64 = String(query).replace(/-/g, '+').replace(/_/g, '/');
    sql = Buffer.from(b64, 'base64').toString('utf8');
  } catch (e) {
    return new NextResponse(null, { status: 400 });
  }
  if (!sql) {
    return new NextResponse(null, { status: 400 });
  }
  return handleDbQuery(req, name, sql);
}

export const dynamic = 'force-dynamic';
