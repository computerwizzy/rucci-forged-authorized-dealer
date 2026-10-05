import { NextRequest, NextResponse } from 'next/server';
import { getWheels } from '@/lib/scraper';

export async function GET(_req: NextRequest) {
  try {
    const wheels = await getWheels();
    return NextResponse.json({ wheels });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch wheels' }, { status: 500 });
  }
}
