import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { generateTransactionHashClient } from '@/utils/csv-validator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse JSON body
    const body = await request.json();
    const { transactions, validateOnly = false } = body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions provided' },
        { status: 400 }
      );
    }

    // Limit batch size
    if (transactions.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 transactions allowed per import' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing duplicates in database
    const hashes = transactions.map((t) => generateTransactionHashClient(t));
    
    const { data: existingTransactions, error: checkError } = await supabase
      .from('transactions')
      .select('transaction_hash')
      .in('transaction_hash', hashes)
      .eq('user_id', userId);

    if (checkError) {
      console.error('Duplicate check error:', checkError);
      return NextResponse.json(
        { error: 'Failed to check for duplicates' },
        { status: 500 }
      );
    }

    const existingHashes = new Set(existingTransactions?.map((t) => t.transaction_hash) || []);
    
    // Filter out duplicates
    const uniqueTransactions = transactions.filter((t) => {
      const hash = generateTransactionHashClient(t);
      return !existingHashes.has(hash);
    });

    const duplicatesCount = transactions.length - uniqueTransactions.length;

    // If validate only, return preview without inserting
    if (validateOnly) {
      return NextResponse.json({
        success: true,
        preview: true,
        total: transactions.length,
        valid: uniqueTransactions.length,
        duplicates: duplicatesCount,
        sample: uniqueTransactions.slice(0, 5),
      });
    }

    // Atomic insert - all or nothing
    if (uniqueTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        duplicates: duplicatesCount,
        message: 'No new transactions to import (all duplicates)',
      });
    }

    // Prepare transactions with hashes
    const transactionsToInsert = uniqueTransactions.map((t) => ({
      user_id: userId,
      name: t.name,
      amount: t.amount,
      type: t.type || 'Expense',
      account_type: t.account_type || 'Checking',
      category_name: t.category || 'Uncategorized',
      date: t.date,
      description: t.description || '',
      transaction_hash: generateTransactionHashClient(t),
      recurring_frequency: 'Never',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Atomic insert
    const { data: inserted, error: insertError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select('id');

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { 
          error: 'Failed to import transactions',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      imported: inserted?.length || 0,
      duplicates: duplicatesCount,
      duration: `${duration}ms`,
    });

  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Failed to process import' },
      { status: 500 }
    );
  }
}

// GET endpoint to check for existing duplicates
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hashes = searchParams.get('hashes')?.split(',') || [];

    if (hashes.length === 0) {
      return NextResponse.json({ exists: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('transactions')
      .select('transaction_hash')
      .in('transaction_hash', hashes)
      .eq('user_id', userId);

    if (error) {
      console.error('Check error:', error);
      return NextResponse.json(
        { error: 'Failed to check duplicates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: data?.map((t) => t.transaction_hash) || [],
    });

  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}
