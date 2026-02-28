import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if merchants table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'merchants')
      .single();

    if (tableError || !tableInfo) {
      return NextResponse.json(
        { 
          error: 'Merchants table not found',
          code: 'TABLE_MISSING',
          setupRequired: true
        },
        { status: 404 }
      );
    }

    // Fetch merchants for the user
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_count', { ascending: false })
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Merchants fetch error:', error);
      
      // Check for specific error types
      if (error.message?.includes('invalid input syntax for type uuid')) {
        return NextResponse.json(
          { 
            error: 'Schema mismatch: user_id column needs to be TEXT type',
            code: 'SCHEMA_MISMATCH',
            details: error.message
          },
          { status: 400 }
        );
      }
      
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        return NextResponse.json(
          { 
            error: 'Permission denied. Check RLS policies.',
            code: 'PERMISSION_DENIED'
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ merchants: data || [] });

  } catch (error: any) {
    console.error('Merchants API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST to backfill merchants for the current user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the backfill function
    const { data, error } = await supabase.rpc('backfill_merchants_for_user', {
      target_user_id: userId
    });

    if (error) {
      console.error('Backfill error:', error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      merchantsCreated: data 
    });

  } catch (error: any) {
    console.error('Backfill API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
