import { NextResponse } from 'next/server';
import { getCacheStats, clearBillsCache } from '@/lib/bills-cache';

// GET endpoint to view cache statistics
export async function GET() {
  try {
    const stats = getCacheStats();
    
    return NextResponse.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cache Stats] Error getting cache stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get cache stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear cache
export async function DELETE() {
  try {
    clearBillsCache();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cache Clear] Error clearing cache:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}