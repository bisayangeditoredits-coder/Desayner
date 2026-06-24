import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const res = await fetch('http://colormind.io/list/');
    if (!res.ok) throw new Error('Failed to fetch models');
    const { result } = await res.json();
    return NextResponse.json(
      { models: result || ['default', 'ui'] },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch {
    return NextResponse.json({ models: ['default', 'ui'] });
  }
}
