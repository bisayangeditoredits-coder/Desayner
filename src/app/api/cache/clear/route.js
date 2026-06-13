import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request) {
  try {
    const { keys } = await request.json();
    if (Array.isArray(keys)) {
      for (const key of keys) {
        await redis.del(key);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
