/**
 * Merchant Reprocess API
 * 
 * Reprocesses existing merchants using AI-assisted classification.
 * Safe to run multiple times - idempotent and non-destructive.
 * 
 * Endpoints:
 * - POST /api/merchants/reprocess - Reprocess merchants for current user
 *   Body: { dryRun?: boolean, useAI?: boolean, batchSize?: number }
 * 
 * - GET /api/merchants/reprocess/stats - Get classification statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { 
  classifyMerchantsBatch, 
  getClassificationStats,
  MerchantClassification 
} from '@/lib/merchants/classifier';
import { debugLogger } from '@/lib/utils/debug-logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ReprocessRequest {
  dryRun?: boolean;
  useAI?: boolean;
  batchSize?: number;
}

interface ReprocessResult {
  processed: number;
  merged: number;
  newClassifications: number;
  avgConfidence: number;
  aiClassifications: number;
  fallbackClassifications: number;
  lowConfidenceWarnings: string[];
}

// Helper to create service client
function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

// POST /api/merchants/reprocess - Reprocess merchants
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      );
    }

    const body: ReprocessRequest = await request.json().catch(() => ({}));
    const { 
      dryRun = false, 
      useAI = true,
      batchSize = 100 
    } = body;

    debugLogger.info('merchants-reprocess', 'Starting reprocess', {
      userId: userId.slice(0, 10) + '...',
      dryRun,
      useAI,
      batchSize
    });

    const supabase = getServiceClient();

    // Step 1: Get all unique merchant names from transactions via RPC
    const { data: txData, error: txError } = await supabase.rpc('get_unique_merchant_names', {
      p_user_id: userId
    });

    if (txError) {
      debugLogger.error('merchants-reprocess', 'Failed to fetch transactions', {
        error: txError.message,
        code: txError.code
      });
      return NextResponse.json({
        error: 'Failed to fetch transactions',
        code: 'FETCH_ERROR',
        details: txError.message
      }, { status: 500 });
    }

    const uniqueNames: string[] = txData?.map((t: { name: string }) => t.name) || [];
    
    if (uniqueNames.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No merchant names found in transactions',
        processed: 0,
        durationMs: Date.now() - startTime
      });
    }

    debugLogger.info('merchants-reprocess', `Found ${uniqueNames.length} unique merchant names`);

    // Step 2: Classify merchant names (with AI if enabled)
    let classifications: Map<string, MerchantClassification>;
    let aiClassCount = 0;
    let fallbackClassCount = 0;

    if (useAI) {
      // Batch classify with AI assistance
      classifications = await classifyMerchantsBatch(uniqueNames, { useCache: true });
      
      // Count AI vs fallback
      for (const [, classification] of classifications) {
        if (classification.confidence >= 0.9) {
          // High confidence usually indicates deterministic rules
          fallbackClassCount++;
        } else {
          aiClassCount++;
        }
      }
    } else {
      // Use deterministic fallback only
      const { classifyMerchant } = await import('@/lib/merchants/classifier');
      classifications = new Map();
      
      for (const name of uniqueNames) {
        const classification = await classifyMerchant(name, { 
          useCache: true, 
          skipAI: true 
        });
        classifications.set(name, classification);
        fallbackClassCount++;
      }
    }

    // Step 3: Track low confidence for reporting
    const lowConfidenceWarnings: string[] = [];
    for (const [name, classification] of classifications) {
      if (classification.confidence < 0.5) {
        lowConfidenceWarnings.push(`${name} (${classification.classification}, ${classification.confidence.toFixed(2)})`);
      }
    }

    // Step 4: Apply classifications (or dry run)
    let processed = 0;
    let merged = 0;
    let newClassifications = 0;
    let totalConfidence = 0;

    if (!dryRun) {
      // Process in batches
      for (let i = 0; i < uniqueNames.length; i += batchSize) {
        const batch = uniqueNames.slice(i, i + batchSize);
        
        for (const name of batch) {
          const txInfo = txData?.find((t: { name: string; cnt: number; last_date: string }) => t.name === name);
          if (!txInfo) continue;

          const classification = classifications.get(name);
          if (!classification) continue;

          processed++;
          totalConfidence += classification.confidence;

          // Check for existing merchant with same canonical name
          const { data: existing } = await supabase
            .from('merchants')
            .select('id, raw_names, transaction_count')
            .eq('user_id', userId)
            .eq('canonical_name', classification.canonicalName)
            .maybeSingle();

          if (existing && existing.id) {
            // This is a merge
            if (existing.raw_names && !existing.raw_names.includes(name)) {
              merged++;
            }
          } else {
            newClassifications++;
          }

          // Use the safe merge function
          await supabase.rpc('safe_merge_merchants', {
            p_user_id: userId,
            p_canonical_name: classification.canonicalName,
            p_display_name: classification.displayName,
            p_classification: classification.classification,
            p_confidence: classification.confidence,
            p_raw_name: name,
            p_transaction_count: txInfo.cnt,
            p_last_used_at: txInfo.last_date
          });
        }
      }

      // Step 5: Clean up orphaned merchants (superseded by canonical grouping)
      const { data: cleanupResult } = await supabase.rpc('cleanup_merged_merchants', {
        target_user_id: userId
      });

      debugLogger.info('merchants-reprocess', 'Cleanup completed', {
        removed: cleanupResult || 0
      });
    } else {
      // Dry run - just count what would happen
      for (const [name, classification] of classifications) {
        processed++;
        totalConfidence += classification.confidence;
        newClassifications++;
      }
    }

    const result: ReprocessResult = {
      processed,
      merged,
      newClassifications,
      avgConfidence: processed > 0 ? totalConfidence / processed : 0,
      aiClassifications: aiClassCount,
      fallbackClassifications: fallbackClassCount,
      lowConfidenceWarnings: lowConfidenceWarnings.slice(0, 20) // Limit reporting
    };

    const durationMs = Date.now() - startTime;

    debugLogger.info('merchants-reprocess', 'Reprocess complete', {
      ...result,
      durationMs
    });

    return NextResponse.json({
      success: true,
      dryRun,
      ...result,
      totalUniqueNames: uniqueNames.length,
      durationMs
    });

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    debugLogger.error('merchants-reprocess', 'Unexpected error', {
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

// GET /api/merchants/reprocess/stats - Get classification statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      );
    }

    const supabase = getServiceClient();

    // Get classification cache stats
    const cacheStats = await getClassificationStats();

    // Get merchant stats for this user
    const { data: merchantStats, error: statsError } = await supabase
      .from('merchants')
      .select('classification, confidence, transaction_count')
      .eq('user_id', userId);

    if (statsError) {
      return NextResponse.json({
        error: 'Failed to fetch merchant stats',
        code: 'STATS_ERROR',
        details: statsError.message
      }, { status: 500 });
    }

    // Aggregate stats
    const byClassification: Record<string, number> = {};
    let totalConfidence = 0;
    let highConfidence = 0;
    let lowConfidence = 0;
    let totalTransactions = 0;

    for (const m of (merchantStats || [])) {
      byClassification[m.classification || 'unknown'] = 
        (byClassification[m.classification || 'unknown'] || 0) + 1;
      
      const conf = m.confidence || 0;
      totalConfidence += conf;
      if (conf >= 0.8) highConfidence++;
      if (conf < 0.5) lowConfidence++;
      
      totalTransactions += m.transaction_count || 0;
    }

    const merchantCount = merchantStats?.length || 0;

    return NextResponse.json({
      cacheStats,
      merchants: {
        total: merchantCount,
        totalTransactions,
        byClassification,
        avgConfidence: merchantCount > 0 ? (totalConfidence / merchantCount).toFixed(2) : 0,
        highConfidence,
        lowConfidence
      }
    });

  } catch (error: any) {
    console.error('[API /merchants/reprocess/stats] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error.message
    }, { status: 500 });
  }
}
