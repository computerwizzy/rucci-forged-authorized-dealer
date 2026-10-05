import { NextRequest, NextResponse } from 'next/server';
import { getWheels } from '@/lib/scraper';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const wheels = await getWheels();
  const wheel = wheels.find(w => w.slug === slug);
  if (!wheel) {
    return NextResponse.json({ error: 'Wheel not found' }, { status: 404 });
  }
  return NextResponse.json({ wheel });
}
