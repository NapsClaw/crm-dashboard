import { NextRequest, NextResponse } from 'next/server';
import { getKPIs, getFunnel, getLeadsPerDay } from '@/lib/queries';
import type { Agent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const agent = (req.nextUrl.searchParams.get('agent') || 'all') as Agent;
  
  try {
    const [kpis, funnel, leadsPerDay] = await Promise.all([
      getKPIs(agent),
      getFunnel(agent),
      getLeadsPerDay(agent),
    ]);
    
    return NextResponse.json({
      kpis,
      funnel,
      leadsPerDay,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
