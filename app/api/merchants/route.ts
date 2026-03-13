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

// Check if error is about missing column
function isMissingColumnError(error: any): boolean {
  const message = error?.message || '';
  const code = error?.code || '';
  return (
    code === '42703' || // PostgreSQL undefined_column
    message.includes('column') && message.includes('does not exist') ||
    message.includes('display_name') ||
    message.includes('canonical_name') ||
    message.includes('classification') ||
    message.includes('confidence')
  );
}

// Check if error is about missing table
function isTableMissingError(error: any): boolean {
  const message = error?.message || '';
  const code = error?.code || '';
  return (
    code === '42P01' || 
    message.includes('relation') && message.includes('does not exist')
  );
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
    
    // Try with new columns first (migration 017)
    let result = await supabase
      .from('merchants')
      .select(`
        id,
        user_id,
        merchant_name,
        normalized_name,
        display_name,
        canonical_name,
        classification,
        confidence,
        transaction_count,
        last_used_at,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('transaction_count', { ascending: false })
      .order('last_used_at', { ascending: false })
      .limit(100);

    // If columns are missing, fall back to basic columns
    if (result.error && isMissingColumnError(result.error)) {
      console.warn('[API /merchants] Migration 017 columns missing, falling back to basic columns');
      
      const fallbackResult = await supabase
        .from('merchants')
        .select(`
          id,
          user_id,
          merchant_name,
          normalized_name,
          transaction_count,
          last_used_at,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('transaction_count', { ascending: false })
        .order('last_used_at', { ascending: false })
        .limit(100);
      
      if (!fallbackResult.error) {
        // Add empty new fields for compatibility
        const data = (fallbackResult.data || []).map(m => ({
          ...m,
          display_name: null,
          canonical_name: null,
          classification: null,
          confidence: null
        }));
        
        // Return data with warning
        return NextResponse.json({
          merchants: data,
          count: data.length,
          warning: 'Migration 017 not applied. Run db/migrations/017_add_merchant_classification.sql for enhanced merchant features.',
          code: 'MIGRATION_017_MISSING'
        });
      }
      
      // Use fallback error for further processing
      result = fallbackResult;
    }

    if (result.error) {
      console.error('[API /merchants] Query error:', result.error);
      
      // Check for specific PostgreSQL error codes
      const pgError = result.error as any;
      const errorCode = pgError?.code || '';
      const errorMessage = pgError?.message || '';
      
      // Table doesn't exist
      if (isTableMissingError(result.error)) {
        return NextResponse.json({
          error: 'Merchants table does not exist',
          code: 'TABLE_MISSING',
          sqlHint: 'Run migration 011_add_merchants_table.sql first',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      
      // Migration 017 columns missing
      if (isMissingColumnError(result.error)) {
        return NextResponse.json({
          error: 'Migration 017 required: Merchant classification columns missing',
          code: 'SCHEMA_MISMATCH',
          details: errorMessage,
          sqlHint: 'Run db/migrations/017_add_merchant_classification.sql',
          timestamp: new Date().toISOString()
        }, { status: 400 });
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
      merchants: result.data || [],
      count: result.data?.length || 0,
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

// POST /api/merchants - Create a new merchant
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_MISSING' }, { status: 401 });
    }

    const body = await request.json();
    const { merchant_name } = body;

    // Validation
    if (!merchant_name || typeof merchant_name !== 'string' || merchant_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Merchant name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const trimmedName = merchant_name.trim();
    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: 'Merchant name must be 100 characters or less', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Normalize the name
    const normalizedResult = await supabase.rpc('normalize_merchant_name', {
      input: trimmedName
    });
    
    const normalizedName = normalizedResult.data || trimmedName.toLowerCase().trim().replace(/\s+/g, ' ');

    // Check for duplicate normalized name for this user
    const { data: existing, error: checkError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', userId)
      .eq('normalized_name', normalizedName)
      .limit(1);

    if (checkError) {
      console.error('[API /merchants] Duplicate check error:', checkError);
      return NextResponse.json(
        { error: 'Failed to validate merchant name', code: 'VALIDATION_ERROR' },
        { status: 500 }
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'A merchant with this name already exists', code: 'DUPLICATE_NAME' },
        { status: 409 }
      );
    }

    // Create the merchant
    const { data, error } = await supabase
      .from('merchants')
      .insert({
        user_id: userId,
        merchant_name: trimmedName,
        normalized_name: normalizedName,
        transaction_count: 0,
        last_used_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[API /merchants] Create error:', error);
      return NextResponse.json(
        { error: 'Failed to create merchant', code: 'CREATE_ERROR', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ merchant: data, success: true });

  } catch (error: any) {
    console.error('[API /merchants] POST error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message
    }, { status: 500 });
  }
}

// PATCH /api/merchants - Update a merchant
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_MISSING' }, { status: 401 });
    }

    const body = await request.json();
    const { id, merchant_name } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Merchant ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!merchant_name || typeof merchant_name !== 'string' || merchant_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Merchant name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const trimmedName = merchant_name.trim();
    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: 'Merchant name must be 100 characters or less', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Check if merchant belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Merchant not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Normalize the new name
    const normalizedResult = await supabase.rpc('normalize_merchant_name', {
      input: trimmedName
    });
    
    const normalizedName = normalizedResult.data || trimmedName.toLowerCase().trim().replace(/\s+/g, ' ');

    // Check for duplicate (excluding current merchant)
    const { data: duplicate, error: dupError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', userId)
      .eq('normalized_name', normalizedName)
      .neq('id', id)
      .limit(1);

    if (dupError) {
      console.error('[API /merchants] Duplicate check error:', dupError);
      return NextResponse.json(
        { error: 'Failed to validate merchant name', code: 'VALIDATION_ERROR' },
        { status: 500 }
      );
    }

    if (duplicate && duplicate.length > 0) {
      return NextResponse.json(
        { error: 'A merchant with this name already exists', code: 'DUPLICATE_NAME' },
        { status: 409 }
      );
    }

    // Update the merchant
    const { data, error } = await supabase
      .from('merchants')
      .update({
        merchant_name: trimmedName,
        normalized_name: normalizedName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[API /merchants] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update merchant', code: 'UPDATE_ERROR', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ merchant: data, success: true });

  } catch (error: any) {
    console.error('[API /merchants] PATCH error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message
    }, { status: 500 });
  }
}

// DELETE /api/merchants - Delete a merchant
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_MISSING' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Merchant ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Check if merchant belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Merchant not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the merchant
    const { error } = await supabase
      .from('merchants')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[API /merchants] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete merchant', code: 'DELETE_ERROR', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted: true });

  } catch (error: any) {
    console.error('[API /merchants] DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message
    }, { status: 500 });
  }
}
