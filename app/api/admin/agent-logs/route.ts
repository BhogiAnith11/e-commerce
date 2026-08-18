import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentActionLog from '@/models/AgentActionLog';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const toolName = searchParams.get('tool_name');
    const confirmedOnly = searchParams.get('confirmed') === 'true';

    await connectDB();

    const filter: Record<string, unknown> = {};
    if (toolName && toolName !== 'all') {
      filter.toolName = toolName;
    }
    if (confirmedOnly) {
      filter.confirmedByUser = true;
    }

    const logs = await AgentActionLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('GET /api/admin/agent-logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch agent logs' }, { status: 500 });
  }
}
