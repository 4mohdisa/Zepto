/**
 * Merchant Classification Service
 * 
 * Uses AI-assisted classification with deterministic fallback.
 * Caches results to avoid repeated AI calls for the same raw strings.
 * 
 * Safety principles:
 * - AI assists but doesn't control critical decisions
 * - Fallback rules are deterministic and auditable
 * - Low confidence = keep safer (don't over-merge)
 * - All classifications are cached for observability
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Classification result interface
export interface MerchantClassification {
  rawName: string;
  canonicalName: string;
  displayName: string;
  classification: 'merchant' | 'payment_processor' | 'marketplace' | 'bank_transfer' | 'unknown' | 'noise';
  confidence: number; // 0-1
  normalizedKey: string;
  metadata?: {
    brandRoot?: string;
    locationSuffix?: string;
    processorHint?: string;
    storeType?: string;
  };
}

// Cache entry from database
interface ClassificationCache {
  raw_name: string;
  canonical_name: string;
  display_name: string;
  classification: string;
  confidence: number;
  normalized_key: string;
  metadata: any;
  created_at: string;
  use_count: number;
}

/**
 * Classify a merchant name using AI with caching and fallback
 */
export async function classifyMerchant(
  rawName: string,
  options: { useCache?: boolean; skipAI?: boolean } = {}
): Promise<MerchantClassification> {
  const { useCache = true, skipAI = false } = options;

  // 1. Check cache first
  if (useCache) {
    const cached = await getCachedClassification(rawName);
    if (cached) {
      return cached;
    }
  }

  // 2. Try deterministic fallback first (fast, reliable, no API cost)
  const fallbackResult = applyFallbackRules(rawName);
  
  // If fallback has high confidence, use it directly
  if (fallbackResult.confidence >= 0.9) {
    if (useCache) {
      await cacheClassification(fallbackResult);
    }
    return fallbackResult;
  }

  // 3. Try AI classification if not skipped
  if (!skipAI && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    try {
      const aiResult = await classifyWithAI(rawName, fallbackResult);
      
      // Merge AI insights with fallback (AI suggests, fallback validates)
      const merged = mergeClassifications(fallbackResult, aiResult);
      
      if (useCache) {
        await cacheClassification(merged);
      }
      return merged;
    } catch (error) {
      console.warn('AI classification failed, using fallback:', error);
      // Continue to return fallback on AI failure
    }
  }

  // 4. Return fallback result (always works)
  if (useCache) {
    await cacheClassification(fallbackResult);
  }
  return fallbackResult;
}

/**
 * Batch classify multiple merchant names efficiently
 */
export async function classifyMerchantsBatch(
  rawNames: string[],
  options: { useCache?: boolean; skipAI?: boolean } = {}
): Promise<Map<string, MerchantClassification>> {
  const { useCache = true, skipAI = false } = options;
  const results = new Map<string, MerchantClassification>();
  const uncached: string[] = [];

  // 1. Check cache for all names
  if (useCache) {
    for (const name of rawNames) {
      const cached = await getCachedClassification(name);
      if (cached) {
        results.set(name, cached);
      } else {
        uncached.push(name);
      }
    }
  } else {
    uncached.push(...rawNames);
  }

  if (uncached.length === 0) {
    return results;
  }

  // 2. Apply fallback rules to all uncached
  const fallbackResults = new Map<string, MerchantClassification>();
  const needsAI: string[] = [];

  for (const name of uncached) {
    const fallback = applyFallbackRules(name);
    fallbackResults.set(name, fallback);
    
    if (fallback.confidence < 0.9 && !skipAI) {
      needsAI.push(name);
    }
  }

  // 3. Batch AI classification for uncertain cases
  if (needsAI.length > 0 && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    try {
      const aiResults = await classifyBatchWithAI(needsAI);
      
      for (const [name, aiResult] of aiResults) {
        const fallback = fallbackResults.get(name)!;
        const merged = mergeClassifications(fallback, aiResult);
        results.set(name, merged);
        
        if (useCache) {
          await cacheClassification(merged);
        }
      }
    } catch (error) {
      console.warn('Batch AI classification failed:', error);
      // Use fallback for all
      for (const name of needsAI) {
        const fallback = fallbackResults.get(name)!;
        results.set(name, fallback);
        if (useCache) {
          await cacheClassification(fallback);
        }
      }
    }
  }

  // 4. Add high-confidence fallback results
  for (const [name, fallback] of fallbackResults) {
    if (!results.has(name)) {
      results.set(name, fallback);
      if (useCache) {
        await cacheClassification(fallback);
      }
    }
  }

  return results;
}

/**
 * Deterministic fallback rules for merchant normalization
 * Fast, reliable, works offline, no API costs
 */
function applyFallbackRules(rawName: string): MerchantClassification {
  const original = rawName.trim();
  
  // Start with basic normalization
  let cleaned = original
    .replace(/\s+/g, ' ')
    .trim();

  // Rule 1: Detect obvious payment processors / noise (high confidence)
  const processorPatterns = [
    { pattern: /^PP?\*\d+/i, type: 'payment_processor', name: 'PayPal' },
    { pattern: /^PAYPAL\s*[*\s]/i, type: 'payment_processor', name: 'PayPal' },
    { pattern: /^ZLR\*/i, type: 'payment_processor', name: 'Zelle' },
    { pattern: /^VENMO\s*[*\s]/i, type: 'payment_processor', name: 'Venmo' },
    { pattern: /^SQ\s*[*\s]/i, type: 'payment_processor', name: 'Square' },
    { pattern: /^TST\s*[*\s]/i, type: 'payment_processor', name: 'Toast' },
    { pattern: /^SP\s*[*\s]\d+/i, type: 'payment_processor', name: 'Payment Processor' },
    { pattern: /^[A-Z]{2,3}\*[A-Z0-9]{4,}/i, type: 'payment_processor', name: null }, // Generic pattern
    { pattern: /^\d{4,}\*\w+/i, type: 'noise', name: null },
    { pattern: /^TRANSFER\s+/i, type: 'bank_transfer', name: null },
    { pattern: /^DIRECT\s+DEBIT/i, type: 'bank_transfer', name: null },
    { pattern: /^BPAY/i, type: 'bank_transfer', name: 'BPay' },
    { pattern: /^ATM\s+/i, type: 'bank_transfer', name: 'ATM Withdrawal' },
  ];

  for (const rule of processorPatterns) {
    if (rule.pattern.test(cleaned)) {
      // Try to extract actual merchant after processor code
      const afterCode = cleaned.replace(/^[^*]*\*\s*/, '').trim();
      let actualMerchant = afterCode && afterCode !== cleaned ? afterCode : null;
      
      // If we found a merchant name after the processor code
      if (actualMerchant && actualMerchant.length > 2 && !/^\d+$/.test(actualMerchant)) {
        const displayName = toTitleCase(actualMerchant);
        return {
          rawName: original,
          canonicalName: actualMerchant.toUpperCase(),
          displayName,
          classification: 'merchant',
          confidence: 0.75,
          normalizedKey: generateNormalizedKey(actualMerchant),
          metadata: { processorHint: rule.name || 'unknown' }
        };
      }

      // Pure processor/noise entry
      return {
        rawName: original,
        canonicalName: rule.name ? rule.name.toUpperCase() : 'PAYMENT_PROCESSOR',
        displayName: rule.name || 'Payment Processor',
        classification: rule.type as any,
        confidence: rule.name ? 0.9 : 0.7,
        normalizedKey: generateNormalizedKey(rule.name || cleaned),
        metadata: { processorHint: rule.name || 'unknown' }
      };
    }
  }

  // Rule 2: Extract brand from "BRAND Location" patterns
  const locationPatterns = [
    // OTR Blair, OTR Thorngate, etc.
    { pattern: /^(OTR)\s+\w+/i, brand: 'OTR', type: 'petrol_station' },
    { pattern: /^(7-ELEVEN|7 ELEVEN|SEVEN ELEVEN)\s+/i, brand: '7-Eleven', type: 'convenience_store' },
    { pattern: /^(COLES)\s+(EXPRESS|LOCAL|ONLINE)/i, brand: 'Coles', type: 'supermarket' },
    { pattern: /^(WOOLWORTHS)\s+(METRO|PETROL|ONLINE)/i, brand: 'Woolworths', type: 'supermarket' },
    { pattern: /^(ALDI)\s+\w+/i, brand: 'Aldi', type: 'supermarket' },
    { pattern: /^(IGA)\s+\w+/i, brand: 'IGA', type: 'supermarket' },
    { pattern: /^(MCDONALD'S?|MCDONALDS?)\s+/i, brand: "McDonald's", type: 'fast_food' },
    { pattern: /^(KFC)\s+/i, brand: 'KFC', type: 'fast_food' },
    { pattern: /^(HUNGRY JACKS?)\s+/i, brand: 'Hungry Jacks', type: 'fast_food' },
    { pattern: /^(SUBWAY)\s+/i, brand: 'Subway', type: 'fast_food' },
    { pattern: /^(DOMINO'S?|DOMINOS?)\s+/i, brand: "Domino's", type: 'fast_food' },
    { pattern: /^(BP)\s+/i, brand: 'BP', type: 'petrol_station' },
    { pattern: /^(SHELL)\s+/i, brand: 'Shell', type: 'petrol_station' },
    { pattern: /^(CALTEX)\s+/i, brand: 'Caltex', type: 'petrol_station' },
    { pattern: /^(UNITI?|UNITED)\s+/i, brand: 'United', type: 'petrol_station' },
    { pattern: /^(AMAZON)\s+/i, brand: 'Amazon', type: 'marketplace' },
    { pattern: /^(UBER\s*EATS?)\s*/i, brand: 'Uber Eats', type: 'food_delivery' },
    { pattern: /^(DOORDASH)\s*/i, brand: 'DoorDash', type: 'food_delivery' },
    { pattern: /^(MENULOG)\s*/i, brand: 'Menulog', type: 'food_delivery' },
    { pattern: /^(SPOTIFY)\s*/i, brand: 'Spotify', type: 'subscription' },
    { pattern: /^(NETFLIX)\s*/i, brand: 'Netflix', type: 'subscription' },
  ];

  for (const rule of locationPatterns) {
    const match = cleaned.match(rule.pattern);
    if (match) {
      const brandRoot = match[1];
      const locationSuffix = cleaned.substring(brandRoot.length).trim();
      
      return {
        rawName: original,
        canonicalName: rule.brand.toUpperCase(),
        displayName: rule.brand,
        classification: rule.type === 'marketplace' ? 'marketplace' : 'merchant',
        confidence: 0.95,
        normalizedKey: generateNormalizedKey(rule.brand),
        metadata: {
          brandRoot: rule.brand,
          locationSuffix: locationSuffix || undefined,
          storeType: rule.type
        }
      };
    }
  }

  // Rule 3: Handle common suffixes that indicate location/store number
  const suffixPatterns = [
    { pattern: /\s+#?\d+$/i, removable: true }, // "Store #123" or "Store 123"
    { pattern: /\s+-?\s*#\d+$/i, removable: true }, // "Store-#123"
    { pattern: /\s+-\s*\w+$/i, removable: false }, // "Store - Location" (keep)
    { pattern: /\s+\(\w+\)$/i, removable: false }, // "Store (Location)" (keep but clean)
  ];

  let brandCandidate = cleaned;
  let hasRemovableSuffix = false;

  for (const rule of suffixPatterns) {
    const match = brandCandidate.match(rule.pattern);
    if (match && rule.removable) {
      brandCandidate = brandCandidate.substring(0, match.index).trim();
      hasRemovableSuffix = true;
    }
  }

  // If we removed a suffix and have a reasonable brand name
  if (hasRemovableSuffix && brandCandidate.length >= 2) {
    return {
      rawName: original,
      canonicalName: brandCandidate.toUpperCase(),
      displayName: toTitleCase(brandCandidate),
      classification: 'merchant',
      confidence: 0.85,
      normalizedKey: generateNormalizedKey(brandCandidate),
      metadata: { brandRoot: brandCandidate }
    };
  }

  // Rule 4: Clean up common noise words at start/end
  const noisePrefixes = ['THE ', 'A ', 'AN '];
  const noiseSuffixes = [' LTD', ' LIMITED', ' PTY', ' INC', ' LLC', ' CORP', ' STORE', ' SHOP'];
  
  let cleanedForDisplay = cleaned;
  
  for (const prefix of noisePrefixes) {
    if (cleanedForDisplay.toUpperCase().startsWith(prefix)) {
      cleanedForDisplay = cleanedForDisplay.substring(prefix.length);
    }
  }
  
  for (const suffix of noiseSuffixes) {
    if (cleanedForDisplay.toUpperCase().endsWith(suffix)) {
      cleanedForDisplay = cleanedForDisplay.substring(0, cleanedForDisplay.length - suffix.length);
    }
  }

  cleanedForDisplay = cleanedForDisplay.trim();

  // Default: return cleaned version with medium confidence
  return {
    rawName: original,
    canonicalName: cleanedForDisplay.toUpperCase(),
    displayName: toTitleCase(cleanedForDisplay),
    classification: 'merchant',
    confidence: 0.6,
    normalizedKey: generateNormalizedKey(cleanedForDisplay),
    metadata: {}
  };
}

/**
 * AI-assisted classification for complex cases
 */
async function classifyWithAI(
  rawName: string,
  fallbackResult: MerchantClassification
): Promise<Partial<MerchantClassification>> {
  const prompt = `Analyze this merchant/payment string and extract the canonical merchant name.

Rules:
1. If it's a payment processor code (like "PP*1234CODE"), identify the actual merchant after the code
2. If it's a franchise with location (like "OTR Blair"), return just the brand "OTR"
3. If it's clearly noise or unidentifiable, mark as "unknown"
4. Return the clean, human-readable display name
5. Confidence should be 0.0-1.0 based on certainty

Respond with JSON only:
{
  "canonicalName": "uppercase canonical name",
  "displayName": "Title Case Display Name",
  "classification": "merchant|payment_processor|marketplace|bank_transfer|unknown|noise",
  "confidence": 0.85,
  "brandRoot": "optional brand if different from display"
}

Input: "${rawName}"`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a merchant name classifier. Extract clean merchant names from raw transaction strings.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 200,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty AI response');
  }

  const parsed = JSON.parse(content);
  
  return {
    canonicalName: parsed.canonicalName?.toUpperCase() || fallbackResult.canonicalName,
    displayName: parsed.displayName || fallbackResult.displayName,
    classification: parsed.classification || fallbackResult.classification,
    confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
    normalizedKey: generateNormalizedKey(parsed.canonicalName || parsed.displayName || rawName),
    metadata: parsed.brandRoot ? { brandRoot: parsed.brandRoot } : fallbackResult.metadata
  };
}

/**
 * Batch AI classification
 */
async function classifyBatchWithAI(
  rawNames: string[]
): Promise<Map<string, MerchantClassification>> {
  const items = rawNames.map((name, i) => `${i + 1}. "${name}"`).join('\n');
  
  const prompt = `Analyze these merchant/payment strings and extract canonical merchant names.

For each item, determine:
- canonicalName: UPPERCASE canonical name
- displayName: Title Case Display Name  
- classification: merchant|payment_processor|marketplace|bank_transfer|unknown|noise
- confidence: 0.0-1.0 based on certainty

Special handling:
- Payment processor codes like "PP*1234CODE" → extract merchant after *, or classify as payment_processor
- Franchise locations like "OTR Blair" → brand "OTR", location "Blair"
- If unclear or noise → low confidence, classification "unknown"

Respond with JSON array in same order:
[
  {"canonicalName": "...", "displayName": "...", "classification": "...", "confidence": 0.9},
  ...
]

Items:\n${items}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a merchant name classifier. Extract clean merchant names from raw transaction strings.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 2000,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty AI response');
  }

  const parsed = JSON.parse(content);
  const results = Array.isArray(parsed) ? parsed : parsed.results || [];
  
  const classifications = new Map<string, MerchantClassification>();
  
  for (let i = 0; i < rawNames.length && i < results.length; i++) {
    const r = results[i];
    const rawName = rawNames[i];
    
    classifications.set(rawName, {
      rawName,
      canonicalName: r.canonicalName?.toUpperCase() || rawName.toUpperCase(),
      displayName: r.displayName || toTitleCase(rawName),
      classification: r.classification || 'unknown',
      confidence: Math.max(0, Math.min(1, r.confidence || 0.5)),
      normalizedKey: generateNormalizedKey(r.canonicalName || r.displayName || rawName),
      metadata: r.brandRoot ? { brandRoot: r.brandRoot } : {}
    });
  }

  return classifications;
}

/**
 * Merge fallback and AI results, applying safety rules
 */
function mergeClassifications(
  fallback: MerchantClassification,
  ai: Partial<MerchantClassification>
): MerchantClassification {
  // Safety: If AI confidence is low, prefer fallback
  const aiConfidence = ai.confidence || 0;
  
  if (aiConfidence < 0.6) {
    // AI is uncertain - use fallback but maybe take display name if cleaner
    return {
      ...fallback,
      displayName: ai.displayName && ai.displayName.length > 2 
        ? ai.displayName 
        : fallback.displayName,
      confidence: Math.min(fallback.confidence, 0.6)
    };
  }

  // AI has reasonable confidence
  // But apply safety: don't merge if fallback detected different classification
  if (fallback.classification === 'noise' || fallback.classification === 'payment_processor') {
    if (ai.classification === 'merchant' && aiConfidence < 0.8) {
      // Fallback says processor, AI says merchant but not confident - be conservative
      return fallback;
    }
  }

  // Use AI result with fallback as backup
  return {
    rawName: fallback.rawName,
    canonicalName: ai.canonicalName || fallback.canonicalName,
    displayName: ai.displayName || fallback.displayName,
    classification: ai.classification || fallback.classification,
    confidence: aiConfidence,
    normalizedKey: ai.normalizedKey || fallback.normalizedKey,
    metadata: { ...fallback.metadata, ...(ai.metadata || {}) }
  };
}

/**
 * Generate normalized key for grouping
 */
function generateNormalizedKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .substring(0, 100);
}

/**
 * Convert to Title Case
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get cached classification from database
 */
async function getCachedClassification(rawName: string): Promise<MerchantClassification | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await supabase
      .from('merchant_classification_cache')
      .select('*')
      .eq('raw_name', rawName)
      .single();

    if (error || !data) {
      return null;
    }

    const cache = data as ClassificationCache;
    
    // Increment use count
    await supabase
      .from('merchant_classification_cache')
      .update({ use_count: (cache.use_count || 0) + 1 })
      .eq('raw_name', rawName);

    return {
      rawName: cache.raw_name,
      canonicalName: cache.canonical_name,
      displayName: cache.display_name,
      classification: cache.classification as any,
      confidence: cache.confidence,
      normalizedKey: cache.normalized_key,
      metadata: cache.metadata || {}
    };
  } catch (error) {
    console.warn('Cache lookup failed:', error);
    return null;
  }
}

/**
 * Cache classification result
 */
async function cacheClassification(result: MerchantClassification): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    await supabase
      .from('merchant_classification_cache')
      .upsert({
        raw_name: result.rawName,
        canonical_name: result.canonicalName,
        display_name: result.displayName,
        classification: result.classification,
        confidence: result.confidence,
        normalized_key: result.normalizedKey,
        metadata: result.metadata || {},
        created_at: new Date().toISOString(),
        use_count: 1
      }, {
        onConflict: 'raw_name'
      });
  } catch (error) {
    // Non-fatal: cache failures shouldn't break classification
    console.warn('Cache write failed:', error);
  }
}

/**
 * Get classification stats for observability
 */
export async function getClassificationStats(): Promise<{
  totalCached: number;
  byClassification: Record<string, number>;
  avgConfidence: number;
  highConfidence: number;
  lowConfidence: number;
}> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await supabase
      .from('merchant_classification_cache')
      .select('classification, confidence');

    if (error || !data) {
      return {
        totalCached: 0,
        byClassification: {},
        avgConfidence: 0,
        highConfidence: 0,
        lowConfidence: 0
      };
    }

    const byClassification: Record<string, number> = {};
    let totalConfidence = 0;
    let highConfidence = 0;
    let lowConfidence = 0;

    for (const row of data) {
      byClassification[row.classification] = (byClassification[row.classification] || 0) + 1;
      totalConfidence += row.confidence;
      if (row.confidence >= 0.8) highConfidence++;
      if (row.confidence < 0.6) lowConfidence++;
    }

    return {
      totalCached: data.length,
      byClassification,
      avgConfidence: data.length > 0 ? totalConfidence / data.length : 0,
      highConfidence,
      lowConfidence
    };
  } catch (error) {
    console.warn('Stats query failed:', error);
    return {
      totalCached: 0,
      byClassification: {},
      avgConfidence: 0,
      highConfidence: 0,
      lowConfidence: 0
    };
  }
}
