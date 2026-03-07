import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper to create service role client (bypasses RLS)
function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('[API /merchants] Auth missing - no userId from Clerk');
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'AUTH_MISSING',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const supabase = getServiceClient();
    
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_count', { ascending: false })
      .order('last_used_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[API /merchants] Query error:', error);
      
      // Check for specific PostgreSQL error codes
      const pgError = error as any;
      const errorCode = pgError?.code || '';
      const errorMessage = pgError?.message || '';
      const errorDetails = pgError?.details || '';
      
      // Table doesn't exist
      if (errorCode === '42P01' || errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
        return NextResponse.json({
          error: 'Merchants table does not exist',
          code: 'TABLE_MISSING',
          sqlHint: 'Run the merchants migration SQL',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      
      // UUID type mismatch (user_id is UUID but we're sending string)
      if (errorCode === '22P02' || errorMessage.includes('invalid input syntax for type uuid')) {
        return NextResponse.json({
          error: 'Schema mismatch: user_id column is UUID, needs to be TEXT',
          code: 'SCHEMA_MISMATCH',
          details: errorMessage,
          sqlHint: 'ALTER TABLE merchants ALTER COLUMN user_id TYPE TEXT;',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
      
      // Permission denied
      if (errorCode === '42501' || errorMessage.includes('permission denied')) {
        return NextResponse.json({
          error: 'Permission denied accessing merchants table',
          code: 'PERMISSION_DENIED',
          details: errorMessage,
          timestamp: new Date().toISOString()
        }, { status: 403 });
      }
      
      // Unknown error
      return NextResponse.json({
        error: 'Database query failed',
        code: 'QUERY_ERROR',
        details: errorMessage,
        pgCode: errorCode,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({
      merchants: data || [],
      count: data?.length || 0,
    });

  } catch (error: any) {
    console.error('[API /merchants] Unhandled error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST to backfill merchants
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_MISSING' }, { status: 401 });
    }

    const supabase = getServiceClient();

    // Check if backfill function exists by trying to call it
    const { data, error } = await supabase.rpc('backfill_merchants_for_user', {
      target_user_id: userId
    });

    if (error) {
      console.error('[API /merchants] Backfill error:', error);
      
      if (error.message?.includes('function') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Backfill function not found. Run the migration SQL first.',
          code: 'FUNCTION_MISSING',
          details: error.message
        }, { status: 404 });
      }
      
      return NextResponse.json({
        error: 'Backfill failed',
        code: 'BACKFILL_ERROR',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      merchantsCreated: data || 0,
      userId: userId
    });

  } catch (error: any) {
    console.error('[API /merchants] POST error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message
    }, { status: 500 });
  }
}
