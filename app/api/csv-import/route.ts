import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { generateTransactionHashClient } from '@/lib/utils/csv-validator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      );
    }

    // Parse JSON body
    const body = await request.json();
    const { transactions, validateOnly = false } = body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions provided', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Limit batch size
    if (transactions.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 transactions allowed per import', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's categories AND default categories (user_id is null) for ID lookup
    const [{ data: userCategories }, { data: defaultCategories }, { data: merchants }] = await Promise.all([
      supabase.from('categories').select('id, name').eq('user_id', userId),
      supabase.from('categories').select('id, name').is('user_id', null),
      supabase.from('merchants').select('id, merchant_name, normalized_name').eq('user_id', userId)
    ]);
    
    // Merge user and default categories (user categories take precedence)
    const categories = [...(defaultCategories || []), ...(userCategories || [])];

    // Build lookup maps
    const categoryMap = new Map<string, number>();
    for (const cat of (categories || [])) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    }

    const merchantMap = new Map<string, string>();
    for (const m of (merchants || [])) {
      merchantMap.set(m.merchant_name.toLowerCase(), m.id);
      merchantMap.set(m.normalized_name.toLowerCase(), m.id);
    }

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
        { error: 'Failed to check for duplicates', code: 'DUPLICATE_CHECK_ERROR', details: checkError.message },
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

    // Track categories that couldn't be matched for debugging
    const unmatchedCategories = new Set<string>();
    
    // Category name remapping: phantom names → real DB category names
    const categoryNameMap: Record<string, string> = {
      'restaurant': 'Food & Dining',
      'food': 'Food & Dining',
      'groceries': 'Food & Dining',
      'coffee': 'Food & Dining',
      'mezza': 'Food & Dining',
      'miscellaneous': 'Other Expense',
      'misc': 'Other Expense',
      'loan': 'Other Expense',
      'bank cost': 'Other Expense',
      'bank fees': 'Other Expense',
      'transport': 'Transportation',
      'utilities': 'Housing',
      'health': 'Healthcare',
      'subscription': 'Subscriptions',
      'subscriptions': 'Subscriptions',
    };

    // Prepare transactions with proper category_id and merchant_id lookup
    const transactionsToInsert = uniqueTransactions.map((t) => {
      let categoryName = t.category || 'Uncategorized';
      
      // Remap phantom category names to real DB category names
      const normalizedInputName = categoryName.toLowerCase().trim();
      if (categoryNameMap[normalizedInputName]) {
        categoryName = categoryNameMap[normalizedInputName];
      }
      
      // Use provided categoryId from AI/rule-based categorization if available
      // Otherwise fall back to name-based lookup with case-insensitive matching
      let categoryId: number | null = t.categoryId || null;
      
      if (categoryId === null) {
        // Case-insensitive exact match only (no fuzzy matching to avoid wrong assignments)
        const normalizedName = categoryName.toLowerCase().trim();
        categoryId = categoryMap.get(normalizedName) || null;
        
        // Log unmatched categories for debugging
        if (categoryId === null && categoryName !== 'Uncategorized') {
          unmatchedCategories.add(categoryName);
        }
      }
      
      // Try to find merchant by name or merchant_name field
      const merchantName = t.merchant || t.merchant_name || t.name;
      const merchantId = merchantMap.get(merchantName.toLowerCase().trim()) || null;

      // Final category name: use matched DB category name if found, otherwise remapped name
      const finalCategoryName = categoryId 
        ? (categories.find(c => c.id === categoryId)?.name || categoryName)
        : categoryName;

      return {
        user_id: userId,
        name: t.name,
        amount: t.amount,
        type: t.type || 'Expense',
        account_type: t.account_type || 'Checking',
        category_id: categoryId,
        category_name: finalCategoryName,
        merchant_id: merchantId,
        date: t.date,
        description: t.description || '',
        transaction_hash: generateTransactionHashClient(t),
        recurring_frequency: 'Never',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
    
    // Log unmatched categories for debugging
    if (unmatchedCategories.size > 0) {
      const availableCategories = (categories || []).map(c => c.name);
      console.warn('[CSV Import] Unmatched categories (will be null in DB):', {
        unmatched: Array.from(unmatchedCategories),
        availableCategories,
        suggestion: 'These categories were not found in the user\'s DB. Please check for typos or create the categories first.',
      });
    }

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
          code: 'IMPORT_ERROR',
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

  } catch (error: any) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Failed to process import', code: 'INTERNAL_ERROR', details: error?.message },
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
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
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
        { error: 'Failed to check duplicates', code: 'DUPLICATE_CHECK_ERROR', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: data?.map((t) => t.transaction_hash) || [],
    });

  } catch (error: any) {
    console.error('Check error:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates', code: 'INTERNAL_ERROR', details: error?.message },
      { status: 500 }
    );
  }
}
