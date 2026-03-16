import { NextRequest, NextResponse } from 'next/server';
import { getKanbanLeads } from '@/lib/queries';
import type { Agent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const agent = (req.nextUrl.searchParams.get('agent') || 'all') as Agent;
  
  try {
    const leads = await getKanbanLeads(agent);
    return NextResponse.json({ leads, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Kanban API error:', error);
    return NextResponse.json({ error: 'Failed to fetch kanban data' }, { status: 500 });
  }
}
