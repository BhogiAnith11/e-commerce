import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import AgentActionLog from '@/models/AgentActionLog';

/**
 * GET /api/agent/logs
 * Returns the agent action audit log for the authenticated user.
 * TDD §9: every agent tool call is logged and reviewable.
 *
 * Query params:
 *   - session_id: filter by session
 *   - tool_name: filter by specific tool
 *   - confirmed: "true" | "false" — filter by user confirmation
 *   - page, limit: pagination
 */
export async function GET(req) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);

    const sessionId = searchParams.get('session_id');
    const toolName = searchParams.get('tool_name');
    const confirmed = searchParams.get('confirmed');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    await connectDB();

    const filter = { userId };
    if (sessionId) filter.sessionId = sessionId;
    if (toolName) filter.toolName = toolName;
    if (confirmed !== null && confirmed !== undefined) {
      filter.confirmedByUser = confirmed === 'true';
    }

    const [logs, total] = await Promise.all([
      AgentActionLog.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AgentActionLog.countDocuments(filter),
    ]);

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/agent/logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch agent logs' }, { status: 500 });
  }
}
