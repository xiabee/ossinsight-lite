import { handleDbQuery } from '@/app/(client)/api/db/handler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET (req: NextRequest, { params: { name } }: any) {
  const sql = new URL(req.url).searchParams.get('sql');
  if (!sql) {
    // 422 lets the client distinguish "GET query params were stripped
    // somewhere along the way" from an SQL execution failure (400).
    return NextResponse.json({
      message: 'Missing `sql` query parameter',
    }, { status: 422 });
  }
  return handleDbQuery(req, name, sql);
}

export async function POST (req: NextRequest, { params: { name } }: any) {
  return handleDbQuery(req, name, await req.text());
}

export const dynamic = 'force-dynamic';
