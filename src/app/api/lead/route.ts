import { NextRequest, NextResponse } from 'next/server';
import { getLeadDetail } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const agent = req.nextUrl.searchParams.get('agent') as 'sdr' | 'smm';
  
  if (!id || !agent) {
    return NextResponse.json({ error: 'Missing id or agent' }, { status: 400 });
  }
  
  try {
    const lead = await getLeadDetail(parseInt(id), agent);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Lead API error:', error);
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}
