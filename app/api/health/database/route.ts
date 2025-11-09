import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

/**
 * Database health check endpoint
 * Tests Supabase connectivity
 */
export async function GET() {
  try {
    console.log('[HEALTH CHECK API] Testing database connection...');
    
    const supabase = await getSupabaseAdmin();
    
    // Try to query patients table (just count, no data)
    const { error, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[HEALTH CHECK API] Database query failed:', error);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database query failed',
          error: error.message 
        },
        { status: 500 }
      );
    }

    console.log('[HEALTH CHECK API] Database connected! Patient count:', count);

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      patientCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[HEALTH CHECK API] Exception:', errorMessage);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Database health check failed',
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
