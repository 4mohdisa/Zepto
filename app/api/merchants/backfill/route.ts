import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { debugLogger } from '@/lib/utils/debug-logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface BackfillRequest {
  mode?: 'all' | 'since_last_backfill';
  limit?: number;
  dryRun?: boolean;
  useAI?: boolean;
}

interface MerchantCandidate {
  merchantName: string;
  normalizedName: string;
  count: number;
  lastUsedAt: string;
}

function normalizeMerchantName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '');
}

function cleanMerchantName(name: string, description?: string | null): string {
  // Remove common transaction noise
  let cleaned = name
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove common prefixes/suffixes
  cleaned = cleaned
    .replace(/^(purchase|payment|transfer|deposit|withdrawal)\s*[-:]?\s*/i, '')
    .replace(/\s*[-:]?\s*(payment|transaction|processed)$/i, '');
  
  return cleaned || name;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'AUTH_MISSING' 
      }, { status: 401 });
    }

    const body: BackfillRequest = await request.json().catch(() => ({}));
    const { 
      mode = 'all', 
      limit = 5000, 
      dryRun = false, 
      useAI = false 
    } = body;

    debugLogger.info('merchants-backfill', 'Starting backfill', { 
      userId: userId.slice(0, 10) + '...', 
      mode, 
      limit, 
      dryRun, 
      useAI 
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Step 1: Fetch transactions for this user
    const pageSize = 500;
    let allTransactions: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore && allTransactions.length < limit) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, name, description, date, amount')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .range(from, to);

      if (txError) {
        debugLogger.error('merchants-backfill', 'Failed to fetch transactions', { 
          error: txError.message,
          code: txError.code
        });
        return NextResponse.json({
          error: 'Failed to fetch transactions',
          code: 'FETCH_ERROR',
          details: txError.message
        }, { status: 500 });
      }

      if (!transactions || transactions.length === 0) {
        hasMore = false;
        break;
      }

      allTransactions.push(...transactions);
      page++;

      if (transactions.length < pageSize) {
        hasMore = false;
      }
    }

    debugLogger.info('merchants-backfill', `Fetched ${allTransactions.length} transactions`);

    if (allTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No transactions found for this user',
        transactionsProcessed: 0,
        merchantsCreated: 0,
        durationMs: Date.now() - startTime
      });
    }

    // Step 2: Aggregate merchant candidates
    const merchantMap = new Map<string, MerchantCandidate>();

    for (const tx of allTransactions) {
      const cleanedName = cleanMerchantName(tx.name, tx.description);
      const normalizedName = normalizeMerchantName(cleanedName);

      // Skip empty or too short names
      if (!normalizedName || normalizedName.length < 2) {
        continue;
      }

      const existing = merchantMap.get(normalizedName);
      if (existing) {
        existing.count++;
        // Keep the most recent date
        if (tx.date && new Date(tx.date) > new Date(existing.lastUsedAt)) {
          existing.lastUsedAt = tx.date;
        }
        // Keep the most common original name
        if (tx.name.length > existing.merchantName.length) {
          existing.merchantName = tx.name;
        }
      } else {
        merchantMap.set(normalizedName, {
          merchantName: tx.name,
          normalizedName,
          count: 1,
          lastUsedAt: tx.date || new Date().toISOString()
        });
      }
    }

    const candidates = Array.from(merchantMap.values());
    
    debugLogger.info('merchants-backfill', `Aggregated ${candidates.length} merchant candidates`);

    // Step 3: AI refinement (optional)
    if (useAI && candidates.length > 0) {
      // For now, skip AI to keep it simple and reliable
      // AI refinement can be added later as a separate enhancement
      debugLogger.info('merchants-backfill', 'AI refinement skipped (not implemented)');
    }

    // Step 4: Upsert into merchants table (or dry run)
    let merchantsCreated = 0;
    let merchantsUpdated = 0;

    if (!dryRun) {
      // Batch upserts
      const batchSize = 100;
      
      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        
        const upsertData = batch.map(candidate => ({
          user_id: userId,
          merchant_name: candidate.merchantName,
          normalized_name: candidate.normalizedName,
          transaction_count: candidate.count,
          last_used_at: candidate.lastUsedAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { data: upsertResult, error: upsertError } = await supabase
          .from('merchants')
          .upsert(upsertData, {
            onConflict: 'user_id,normalized_name',
            ignoreDuplicates: false
          })
          .select();

        if (upsertError) {
          debugLogger.error('merchants-backfill', 'Upsert failed', { 
            error: upsertError.message,
            code: upsertError.code,
            batchIndex: i
          });
          // Continue with next batch instead of failing entirely
          continue;
        }

        // Count actual creates vs updates
        // upsertResult contains only the rows that were inserted (creates)
        // Updated rows are not returned when ignoreDuplicates: false
        merchantsCreated += upsertResult?.length || 0;
        merchantsUpdated += batch.length - (upsertResult?.length || 0);
      }

      debugLogger.info('merchants-backfill', 'Backfill complete', { 
        merchantsCreated, 
        merchantsUpdated,
        durationMs: Date.now() - startTime 
      });
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      dryRun,
      transactionsProcessed: allTransactions.length,
      merchantsFound: candidates.length,
      merchantsCreated,
      merchantsUpdated,
      durationMs,
      sample: candidates.slice(0, 5).map(c => ({
        name: c.merchantName,
        normalized: c.normalizedName,
        count: c.count
      }))
    });

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    debugLogger.error('merchants-backfill', 'Unexpected error', { 
      error: error.message,
      stack: error.stack 
    });
    
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error.message,
      durationMs
    }, { status: 500 });
  }
}

// GET to check backfill status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Count transactions for this user
    const { count: txCount, error: txError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Count merchants for this user
    const { count: merchantCount, error: merchantError } = await supabase
      .from('merchants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return NextResponse.json({
      transactionsCount: txCount || 0,
      merchantsCount: merchantCount || 0,
      hasTransactions: (txCount || 0) > 0,
      hasMerchants: (merchantCount || 0) > 0,
      needsBackfill: (txCount || 0) > 0 && (merchantCount || 0) === 0
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
