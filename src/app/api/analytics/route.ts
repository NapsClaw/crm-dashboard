import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/queries';
import type { Agent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const agent = (req.nextUrl.searchParams.get('agent') || 'all') as Agent;
  
  try {
    const analytics = await getAnalytics(agent);
    return NextResponse.json({ ...analytics, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
