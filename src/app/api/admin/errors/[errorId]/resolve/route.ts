import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { requireAuth } from '@/lib/auth/server';
import { resolveCriticalError, unresolveCriticalError } from '@/lib/db/critical-errors';
import { logger } from '@/lib/logging';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ errorId: string }> }
): Promise<NextResponse> {
  try {
    // Verify admin auth
    const user = await requireAuth();
    const isAdmin = await requireAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { errorId } = await params;
    const success = await resolveCriticalError(errorId, user.id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to resolve' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { errorId } = await params;
    logger.error('Failed to resolve error', { errorId, error });
    return NextResponse.json({ error: 'Failed to resolve' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ errorId: string }> }
): Promise<NextResponse> {
  try {
    // Verify admin auth
    const user = await requireAuth();
    const isAdmin = await requireAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { errorId } = await params;
    const success = await unresolveCriticalError(errorId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to unresolve' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { errorId } = await params;
    logger.error('Failed to unresolve error', { errorId, error });
    return NextResponse.json({ error: 'Failed to unresolve' }, { status: 500 });
  }
}