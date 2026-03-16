import { NextRequest, NextResponse } from 'next/server';
import { getFollowups } from '@/lib/queries';
import type { Agent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const agent = (req.nextUrl.searchParams.get('agent') || 'all') as Agent;
  const status = req.nextUrl.searchParams.get('status') || 'all';
  
  try {
    const followups = await getFollowups(agent, status);
    return NextResponse.json({ followups, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Followups API error:', error);
    return NextResponse.json({ error: 'Failed to fetch followups' }, { status: 500 });
  }
}
