/**
 * CSV Import Service
 * 
 * Handles parsing CSV files and using AI to categorize transactions
 */

import OpenAI from 'openai';
import { categories } from '@/data/categories';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side AI processing
});

export interface CSVTransaction {
  date: string;
  name: string; // Extracted merchant name (e.g., "McDonalds")
  description: string; // Full description (e.g., "MCDONALDS ENFIELD ENFIELD SA AU")
  amount: number;
  type?: 'Income' | 'Expense';
  category?: string;
  account_type?: string;
  rawData: Record<string, string>; // Original CSV row data
}

export interface ParsedCSVResult {
  transactions: CSVTransaction[];
  headers: string[];
  totalRows: number;
  skippedRows: number;
}

export interface CategorizedTransaction extends CSVTransaction {
  suggestedCategory: string;
  suggestedType: 'Income' | 'Expense';
  confidence: number;
}

// Common CSV column name mappings
const COLUMN_MAPPINGS: Record<string, string[]> = {
  date: ['date', 'transaction date', 'posting date', 'date posted', 'transaction_date', 'dateposted', 'trans date', 'value date'],
  description: ['description', 'transaction description', 'desc', 'payee', 'merchant', 'name', 'transaction', 'details', 'narrative', 'particulars'],
  amount: ['amount', 'transaction amount', 'amt', 'value', 'debit', 'credit', 'amount (£)', 'amount($)', 'transaction_amount'],
  type: ['type', 'transaction type', 'trans type', 'credit/debit', 'dr/cr', 'transaction_type'],
  category: ['category', 'cat', 'category name', 'spend category'],
};

/**
 * Detect the column mapping from CSV headers
 */
function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const [standardField, possibleNames] of Object.entries(COLUMN_MAPPINGS)) {
    const matchedHeader = headers.find(header => {
      const normalizedHeader = header.toLowerCase().trim();
      return possibleNames.some(name => normalizedHeader === name || normalizedHeader.includes(name));
    });
    
    if (matchedHeader) {
      mapping[standardField] = matchedHeader;
    }
  }
  
  return mapping;
}

/**
 * Parse amount from string, handling various formats
 */
function parseAmount(amountStr: string): { amount: number; isNegative: boolean } {
  // Remove currency symbols, commas, and spaces
  const cleaned = amountStr.replace(/[$£€,\s]/g, '').trim();
  
  // Check for negative indicators
  const isNegative = cleaned.startsWith('-') || cleaned.includes('(') || cleaned.includes(')');
  
  // Parse the number
  const numStr = cleaned.replace(/[\-\(\)]/g, '');
  const amount = parseFloat(numStr);
  
  return { amount: isNaN(amount) ? 0 : amount, isNegative };
}

/**
 * Detect if a row looks like data (not headers)
 * Returns true if the row contains actual transaction data
 */
function isDataRow(values: string[]): boolean {
  // Check for date patterns
  const datePattern = /\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}/;
  const hasDate = values.some(v => datePattern.test(v.trim()));
  
  // Check for amount patterns (numbers with optional currency symbols)
  const amountPattern = /[\$\£\€]?\s*[\-\(]?\d+[\.,]?\d*/;
  const hasAmount = values.some(v => amountPattern.test(v.trim()));
  
  // If it has both date-like and amount-like values, it's likely a data row
  return hasDate && hasAmount;
}

/**
 * Auto-detect CSV format based on data patterns
 */
function autoDetectFormat(firstDataRow: string[]): { dateIndex: number; amountIndex: number; descriptionIndex: number } {
  const values = firstDataRow.map(v => v.trim());
  
  let dateIndex = -1;
  let amountIndex = -1;
  let descriptionIndex = -1;
  
  // Find date column - look for date patterns
  const datePattern = /^(\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4})|(\d{4}-\d{2}-\d{2})/;
  for (let i = 0; i < values.length; i++) {
    if (datePattern.test(values[i])) {
      dateIndex = i;
      break;
    }
  }
  
  // Find amount column - look for numeric values with optional +/- or currency
  const amountPattern = /^[\+\-]?[\$\£\€]?\s*[\(\-]?\d+[\.,]?\d*\)?$/;
  for (let i = 0; i < values.length; i++) {
    if (amountPattern.test(values[i])) {
      amountIndex = i;
      break;
    }
  }
  
  // Find description column - longest text that's not date or amount
  let maxLength = 0;
  for (let i = 0; i < values.length; i++) {
    if (i !== dateIndex && i !== amountIndex) {
      const val = values[i].trim();
      // Description usually contains letters and is reasonably long
      if (/[a-zA-Z]/.test(val) && val.length > maxLength) {
        maxLength = val.length;
        descriptionIndex = i;
      }
    }
  }
  
  return { dateIndex, amountIndex, descriptionIndex };
}

/**
 * Parse CSV text into transactions
 */
export function parseCSV(csvText: string): ParsedCSVResult {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 1) {
    throw new Error('CSV file is empty');
  }
  
  // Detect delimiter from first line
  const delimiter = detectDelimiter(lines[0]);
  
  // Parse first line to check if it's headers or data
  const firstLineValues = parseCSVLine(lines[0], delimiter);
  const hasHeaders = !isDataRow(firstLineValues);
  
  let headers: string[];
  let dataStartIndex: number;
  let columnMapping: Record<string, string> = {};
  let format: { dateIndex: number; amountIndex: number; descriptionIndex: number } = { dateIndex: -1, amountIndex: -1, descriptionIndex: -1 };
  let useFormatIndices = false;
  
  if (hasHeaders) {
    // Traditional CSV with headers
    headers = firstLineValues;
    dataStartIndex = 1;
    columnMapping = detectColumnMapping(headers);
    
    // If column mapping failed, try to auto-detect from first data row
    if (!columnMapping.date || !columnMapping.description || !columnMapping.amount) {
      if (lines.length > 1) {
        const firstDataRow = parseCSVLine(lines[1], delimiter);
        format = autoDetectFormat(firstDataRow);
        if (format.dateIndex === -1 || format.amountIndex === -1 || format.descriptionIndex === -1) {
          throw new Error(
            `Could not detect required columns from headers: ${headers.join(', ')}. ` +
            `Please ensure your CSV has columns for date, description, and amount.`
          );
        }
        useFormatIndices = true;
      } else {
        throw new Error(
          `Could not detect required columns. Found headers: ${headers.join(', ')}. ` +
          `Required: date, description, amount.`
        );
      }
    }
  } else {
    // No headers - auto-detect format from first row
    headers = firstLineValues.map((_, i) => `Column ${i + 1}`);
    dataStartIndex = 0;
    format = autoDetectFormat(firstLineValues);
    
    if (format.dateIndex === -1 || format.amountIndex === -1 || format.descriptionIndex === -1) {
      throw new Error(
        `Could not auto-detect CSV format. First row: ${firstLineValues.join(', ')}. ` +
        `Please ensure your CSV contains dates, amounts, and descriptions.`
      );
    }
    
    useFormatIndices = true;
    
    // Create a pseudo column mapping
    columnMapping = {
      date: headers[format.dateIndex],
      description: headers[format.descriptionIndex],
      amount: headers[format.amountIndex],
    };
  }
  
  const transactions: CSVTransaction[] = [];
  let skippedRows = 0;
  
  // Parse data rows
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const values = parseCSVLine(line, delimiter);
      
      let date: string;
      let description: string;
      let amountStr: string;
      
      if (useFormatIndices) {
        // Use auto-detected indices
        date = values[format.dateIndex];
        description = values[format.descriptionIndex];
        amountStr = values[format.amountIndex];
      } else if (columnMapping.date && columnMapping.description && columnMapping.amount) {
        // Use header-based mapping
        const rawData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rawData[header] = values[index] || '';
        });
        date = rawData[columnMapping.date];
        description = rawData[columnMapping.description];
        amountStr = rawData[columnMapping.amount];
      } else {
        // Should not reach here, but just in case
        skippedRows++;
        continue;
      }
      
      // Skip rows with empty required fields
      if (!date || !description || !amountStr) {
        skippedRows++;
        continue;
      }
      
      // Validate date looks like a date
      if (!/\d/.test(date)) {
        skippedRows++;
        continue;
      }
      
      const { amount, isNegative } = parseAmount(amountStr);
      
      if (amount === 0) {
        skippedRows++;
        continue;
      }
      
      // Determine type from amount sign
      const type: 'Income' | 'Expense' = isNegative ? 'Expense' : 'Income';
      
      const normalizedDate = normalizeDate(date);
      
      // Validate normalized date
      if (!normalizedDate || normalizedDate === 'Invalid Date') {
        console.warn(`Invalid date format: ${date}`);
        skippedRows++;
        continue;
      }
      
      const trimmedDescription = description.trim();
      const merchantName = extractMerchantName(trimmedDescription);
      
      transactions.push({
        date: normalizedDate,
        name: merchantName,
        description: trimmedDescription,
        amount: Math.abs(amount),
        type,
        account_type: 'Checking',
        rawData: { date, description, amount: amountStr },
      });
    } catch (error) {
      console.warn(`Skipping row ${i + 1}:`, error);
      skippedRows++;
    }
  }
  
  if (transactions.length === 0) {
    throw new Error('No valid transactions could be parsed from the CSV file. Please check the format.');
  }
  
  return {
    transactions,
    headers,
    totalRows: lines.length - dataStartIndex,
    skippedRows,
  };
}

/**
 * Detect the delimiter used in the CSV/TSV file
 */
function detectDelimiter(firstLine: string): string {
  // Count occurrences of common delimiters
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  
  // If tabs are present and more common than commas, use tabs
  if (tabCount > 0 && tabCount >= commaCount) {
    return '\t';
  }
  
  // If semicolons are more common (European format), use semicolons
  if (semicolonCount > commaCount) {
    return ';';
  }
  
  // Default to comma
  return ',';
}

/**
 * Parse a single CSV/TSV line, handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Detect if date is likely DD/MM/YYYY vs MM/DD/YYYY
 * Heuristic: if first part > 12, it's definitely DD/MM
 */
function detectDateFormat(part1: string, part2: string): 'DD/MM/YYYY' | 'MM/DD/YYYY' {
  const num1 = parseInt(part1, 10);
  const num2 = parseInt(part2, 10);
  
  // If first part > 12, it must be day (DD/MM)
  if (num1 > 12) return 'DD/MM/YYYY';
  // If second part > 12, it must be day (MM/DD)
  if (num2 > 12) return 'MM/DD/YYYY';
  
  // Ambiguous - default to DD/MM/YYYY (common outside US)
  return 'DD/MM/YYYY';
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string {
  // Remove time component if present
  const dateOnly = dateStr.split(' ')[0].split('T')[0].trim();
  
  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = dateOnly.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = dateOnly.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, part1, part2, year] = slashMatch;
    const format = detectDateFormat(part1, part2);
    
    if (format === 'DD/MM/YYYY') {
      return `${year}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
    } else {
      return `${year}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
    }
  }
  
  // DD-MM-YYYY or MM-DD-YYYY
  const dashMatch = dateOnly.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, part1, part2, year] = dashMatch;
    const format = detectDateFormat(part1, part2);
    
    if (format === 'DD/MM/YYYY') {
      return `${year}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
    } else {
      return `${year}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
    }
  }
  
  // If no format matched, try parsing as is
  const date = new Date(dateOnly);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return dateOnly; // Return as-is if can't parse
}

/**
 * Use AI to categorize transactions
 */
export async function categorizeTransactionsWithAI(
  transactions: CSVTransaction[]
): Promise<CategorizedTransaction[]> {
  const categoryNames = categories.map(c => c.name);
  
  // Process in batches to avoid overwhelming the API
  const BATCH_SIZE = 20;
  const results: CategorizedTransaction[] = [];
  
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    
    const prompt = `Categorize these financial transactions into the following categories:
${categoryNames.join(', ')}

For each transaction, determine:
1. The most appropriate category from the list above
2. Whether it's Income or Expense
3. Confidence level (0-100)

Transactions to categorize:
${batch.map((t, idx) => `${idx + 1}. "${t.description}" - $${t.amount} ${t.type || 'unknown type'}`).join('\n')}

Return ONLY a JSON array in this exact format:
[
  {
    "index": 1,
    "category": "Category Name",
    "type": "Income" or "Expense",
    "confidence": 85
  }
]

Rules:
- Salary, wages, deposits = Income
- Purchases, bills, withdrawals = Expense
- Choose the most specific category that fits
- If unsure, use "Miscellaneous" with lower confidence`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.choices[0]?.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const categorizations = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      
      // Map AI results back to transactions
      for (let j = 0; j < batch.length; j++) {
        const aiResult = categorizations.find((c: any) => c.index === j + 1) || {
          category: 'Miscellaneous',
          type: batch[j].type || 'Expense',
          confidence: 50,
        };
        
        results.push({
          ...batch[j],
          suggestedCategory: aiResult.category,
          suggestedType: aiResult.type,
          confidence: aiResult.confidence,
        });
      }
    } catch (error: any) {
      console.error('AI categorization error for batch:', error);
      
      // Check for specific OpenAI errors
      if (error?.status === 429) {
        throw new Error('OpenAI API quota exceeded. Please check your plan and billing details, or disable AI categorization.');
      }
      if (error?.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your plan and billing details, or disable AI categorization.');
      }
      
      // Fallback: use existing category or Miscellaneous
      for (const transaction of batch) {
        results.push({
          ...transaction,
          suggestedCategory: transaction.category || 'Miscellaneous',
          suggestedType: transaction.type || 'Expense',
          confidence: 30,
        });
      }
    }
  }
  
  return results;
}

/**
 * Simple rule-based categorization fallback (no AI)
 */
export function categorizeWithRules(transactions: CSVTransaction[]): CategorizedTransaction[] {
  const keywordMap: Record<string, string[]> = {
    'Salary': ['salary', 'payroll', 'wage', 'employer', 'payrun'],
    'Food': ['restaurant', 'food', 'grocery', 'supermarket', 'cafe', 'coffee', 'lunch', 'dinner'],
    'Transport': ['uber', 'taxi', 'fuel', 'gas', 'parking', 'transport', 'train', 'bus'],
    'Entertainment': ['netflix', 'spotify', 'cinema', 'movie', 'game', 'entertainment'],
    'Utilities': ['electric', 'water', 'internet', 'phone', 'bill', 'utility'],
    'Shopping': ['amazon', 'ebay', 'shop', 'store', 'retail', 'purchase'],
    'Health': ['pharmacy', 'doctor', 'medical', 'health', 'gym', 'fitness'],
    'Housing': ['rent', 'mortgage', 'housing', 'property'],
    'Subscriptions': ['subscription', 'membership', 'monthly fee'],
    'Transfer': ['transfer', 'payment to', 'sent to'],
  };
  
  // More specific merchant-to-category mapping for Australian banks
  const merchantCategoryMap: Record<string, string> = {
    // Fast Food
    'mcdonalds': 'Food', 'kfc': 'Food', 'burger king': 'Food', 'subway': 'Food',
    'hungry jacks': 'Food', 'nandos': 'Food', 'dominos': 'Food', 'pizza hut': 'Food',
    'starbucks': 'Coffee', 'coffee club': 'Coffee', 'zambrero': 'Food',
    'guzman y gomez': 'Food', 'yiros house': 'Food', 'sumup': 'Food',
    
    // Supermarkets
    'woolworths': 'Groceries', 'woolies': 'Groceries', 'coles': 'Groceries',
    'aldi': 'Groceries', 'iga': 'Groceries', 'costco': 'Groceries',
    
    // Fuel
    'shell': 'Transport', 'bp': 'Transport', 'caltex': 'Transport',
    'united petroleum': 'Transport', 'puma energy': 'Transport', 'metro petroleum': 'Transport',
    
    // Rideshare
    'uber': 'Transport', 'uber eats': 'Food', 'didi': 'Transport', 'ola': 'Transport',
    
    // Subscriptions
    'netflix': 'Entertainment', 'spotify': 'Entertainment', 'apple': 'Subscriptions',
    'apple music': 'Subscriptions', 'youtube': 'Entertainment', 'disney+': 'Entertainment',
    'amazon prime': 'Entertainment', 'stan': 'Entertainment', 'binge': 'Entertainment',
    'kayo sports': 'Entertainment', 'foxtel': 'Entertainment',
    
    // Shopping
    'amazon': 'Shopping', 'ebay': 'Shopping', 'kmart': 'Shopping', 'big w': 'Shopping',
    'target': 'Shopping', 'myer': 'Shopping', 'david jones': 'Shopping',
    'jb hi-fi': 'Shopping', 'harvey norman': 'Shopping', 'the good guys': 'Shopping',
    'officeworks': 'Shopping', 'bunnings': 'Shopping',
    'chemist warehouse': 'Health', 'priceline': 'Health',
    
    // Food Delivery
    'menulog': 'Food', 'doordash': 'Food', 'deliveroo': 'Food',
    
    // Utilities
    'telstra': 'Utilities', 'optus': 'Utilities', 'vodafone': 'Utilities',
    'agl': 'Utilities', 'origin': 'Utilities', 'energy australia': 'Utilities',
    
    // Insurance
    'bupa': 'Health', 'medibank': 'Health', 'ahm': 'Health', 'nib': 'Health',
    
    // Gyms
    'anytime fitness': 'Health', 'goodlife': 'Health', 'fitness first': 'Health',
    'jetts': 'Health', 'snap fitness': 'Health', 'plus fitness': 'Health',
    
    // Cinema
    'event cinemas': 'Entertainment',
    
    // Public Transport
    'translink': 'Transport',
  };
  
  return transactions.map(transaction => {
    const desc = transaction.description.toLowerCase();
    let bestCategory = transaction.category || 'Miscellaneous';
    let maxMatches = 0;
    
    // First check for specific merchant mapping
    for (const [merchant, category] of Object.entries(merchantCategoryMap)) {
      if (desc.includes(merchant)) {
        bestCategory = category;
        maxMatches = 3; // High confidence for merchant match
        break;
      }
    }
    
    // If no merchant match, use keyword matching
    if (maxMatches === 0) {
      for (const [category, keywords] of Object.entries(keywordMap)) {
        const matches = keywords.filter(kw => desc.includes(kw)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          bestCategory = category;
        }
      }
    }
    
    // Check for income indicators
    const incomeIndicators = ['payrun', 'salary', 'wage', 'deposit', 'transfer in', 'received'];
    const isIncome = incomeIndicators.some(ind => desc.includes(ind));
    
    return {
      ...transaction,
      suggestedCategory: bestCategory,
      suggestedType: isIncome ? 'Income' : (transaction.type || 'Expense'),
      confidence: maxMatches > 0 ? 70 : 40,
    };
  });
}

/**
 * Extract merchant name from full description
 * Examples:
 *   "MCDONALDS ENFIELD ENFIELD SA AU" -> "McDonalds"
 *   "UBER EATS HELP.UBER.COM" -> "Uber Eats"
 *   "PAYPAL *NETFLIX 402-935-7733" -> "Netflix"
 */
export function extractMerchantName(description: string): string {
  if (!description) return 'Unknown';
  
  // Convert to lowercase for processing
  const lowerDesc = description.toLowerCase();
  
  // Common merchant patterns to extract
  const merchantPatterns: { pattern: RegExp; name: string }[] = [
    // Fast Food
    { pattern: /mcdonald['']?s/, name: 'McDonalds' },
    { pattern: /kfc/, name: 'KFC' },
    { pattern: /burger king/, name: 'Burger King' },
    { pattern: /subway/, name: 'Subway' },
    { pattern: /hungry jack['']?s/, name: 'Hungry Jacks' },
    { pattern: /nandos/, name: 'Nandos' },
    { pattern: /domino['']?s/, name: 'Dominos' },
    { pattern: /pizza hut/, name: 'Pizza Hut' },
    { pattern: /starbucks/, name: 'Starbucks' },
    { pattern: /coffee club/, name: 'Coffee Club' },
    { pattern: /zambrero/, name: 'Zambrero' },
    { pattern: /guzman.*gomez/, name: 'Guzman y Gomez' },
    { pattern: /sumup.*yiros|yiros house/, name: 'Yiros House' },
    
    // Supermarkets/Groceries
    { pattern: /woolworths|woolies/, name: 'Woolworths' },
    { pattern: /coles/, name: 'Coles' },
    { pattern: /aldi/, name: 'Aldi' },
    { pattern: /iga/, name: 'IGA' },
    { pattern: /costco/, name: 'Costco' },
    { pattern: /kmart/, name: 'Kmart' },
    { pattern: /big w/, name: 'Big W' },
    { pattern: /target/, name: 'Target' },
    
    // Fuel/Transport
    { pattern: /shell/, name: 'Shell' },
    { pattern: /bp\s|bp fuel/, name: 'BP' },
    { pattern: /caltex/, name: 'Caltex' },
    { pattern: /united\s|united fuel/, name: 'United Petroleum' },
    { pattern: /puma energy/, name: 'Puma Energy' },
    { pattern: /metro\s|metro fuel/, name: 'Metro Petroleum' },
    { pattern: /uber\s*eats/, name: 'Uber Eats' },
    { pattern: /uber/, name: 'Uber' },
    { pattern: /didi|di di/, name: 'Didi' },
    { pattern: /ola/, name: 'Ola' },
    { pattern: /translink|tap n go/, name: 'Public Transport' },
    
    // Entertainment/Subscriptions
    { pattern: /netflix/, name: 'Netflix' },
    { pattern: /spotify/, name: 'Spotify' },
    { pattern: /apple\s*com|apple\.com/, name: 'Apple' },
    { pattern: /apple music/, name: 'Apple Music' },
    { pattern: /youtube|google\s*youtube/, name: 'YouTube' },
    { pattern: /disney\+/, name: 'Disney+' },
    { pattern: /prime video|amazon prime/, name: 'Amazon Prime' },
    { pattern: /stan\./, name: 'Stan' },
    { pattern: /binge/, name: 'Binge' },
    { pattern: /kayos?\s*sports?/, name: 'Kayo Sports' },
    { pattern: /foxtel/, name: 'Foxtel' },
    { pattern: /event\s*cinema/, name: 'Event Cinemas' },
    
    // Shopping/Retail
    { pattern: /amazon/, name: 'Amazon' },
    { pattern: /ebay/, name: 'eBay' },
    { pattern: /paypal/, name: 'PayPal' },
    { pattern: /afterpay/, name: 'Afterpay' },
    { pattern: /zip\s*pay|zippay/, name: 'Zip Pay' },
    { pattern: /myer/, name: 'Myer' },
    { pattern: /david jones/, name: 'David Jones' },
    { pattern: /jb\s*hi-?fi/, name: 'JB Hi-Fi' },
    { pattern: /harvey norman/, name: 'Harvey Norman' },
    { pattern: /the good guys/, name: 'The Good Guys' },
    { pattern: /officeworks/, name: 'Officeworks' },
    { pattern: /bunnings/, name: 'Bunnings' },
    { pattern: /chemist warehouse/, name: 'Chemist Warehouse' },
    { pattern: /priceline/, name: 'Priceline' },
    
    // Food Delivery
    { pattern: /menulog/, name: 'Menulog' },
    { pattern: /doordash/, name: 'DoorDash' },
    { pattern: /deliveroo/, name: 'Deliveroo' },
    
    // Telco/Utilities
    { pattern: /telstra/, name: 'Telstra' },
    { pattern: /optus/, name: 'Optus' },
    { pattern: /vodafone/, name: 'Vodafone' },
    { pattern: /aapt|tpg|iiNet/, name: 'Internet Provider' },
    { pattern: /agl|origin|energy australia|red energy/, name: 'Energy Provider' },
    { pattern: /sydney water|yarra valley water/, name: 'Water Utility' },
    
    // Banking/Finance
    { pattern: /commbank|commonwealth bank/, name: 'Commonwealth Bank' },
    { pattern: /westpac/, name: 'Westpac' },
    { pattern: /nab|national australia bank/, name: 'NAB' },
    { pattern: /anz/, name: 'ANZ' },
    { pattern: /ing\s|ing bank/, name: 'ING' },
    { pattern: /macquarie/, name: 'Macquarie Bank' },
    { pattern: /suncorp/, name: 'Suncorp' },
    { pattern: /bendigo/, name: 'Bendigo Bank' },
    { pattern: /bankwest/, name: 'Bankwest' },
    { pattern: /st\.?\s*george/, name: 'St George Bank' },
    
    // Insurance
    { pattern: /bupa/, name: 'Bupa' },
    { pattern: /medibank/, name: 'Medibank' },
    { pattern: /ahm/, name: 'AHM' },
    { pattern: /nib/, name: 'NIB' },
    { pattern: /allianz/, name: 'Allianz' },
    { pattern: /qbe/, name: 'QBE' },
    { pattern: /racv|racq/, name: 'RACV' },
    
    // Income/Salary
    { pattern: /payrun|pay run/, name: 'Salary' },
    { pattern: /wage/, name: 'Wages' },
    { pattern: /salary/, name: 'Salary' },
    { pattern: /centrelink/, name: 'Centrelink' },
    { pattern: /ato.*refund|tax refund/, name: 'Tax Refund' },
    { pattern: /dividend/, name: 'Dividend' },
    { pattern: /interest/, name: 'Interest' },
    { pattern: /rent received/, name: 'Rental Income' },
    { pattern: /reimbursement/, name: 'Reimbursement' },
    
    // Gym/Health
    { pattern: /anytime fitness/, name: 'Anytime Fitness' },
    { pattern: /goodlife/, name: 'Goodlife Health Clubs' },
    { pattern: /fitness first/, name: 'Fitness First' },
    { pattern: /jetts/, name: 'Jetts Fitness' },
    { pattern: /snap fitness/, name: 'Snap Fitness' },
    { pattern: /plus fitness/, name: 'Plus Fitness' },
  ];
  
  // Try to match known merchant patterns
  for (const { pattern, name } of merchantPatterns) {
    if (pattern.test(lowerDesc)) {
      return name;
    }
  }
  
  // If no pattern matched, extract first word(s) as merchant name
  // Remove common suffixes/prefixes
  let cleaned = description
    .replace(/\s+(ENFIELD|ADELAIDE|AU|AUS|AUSTRALIA|NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\s+.*$/i, '')
    .replace(/\s+\d{4,}.*$/, '') // Remove numbers at end (postcodes, phone)
    .replace(/^\*+/, '') // Remove leading asterisks
    .replace(/\*+$/, '') // Remove trailing asterisks
    .replace(/PAYPAL\s*\*\s*/i, '') // Remove PAYPAL *
    .replace(/SQ\s*\*\s*/i, '') // Remove SQ * (Square payments)
    .replace(/SUMUP\s*\*\s*/i, '') // Remove SUMUP *
    .trim();
  
  // Take first 1-2 words as merchant name
  const words = cleaned.split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return 'Unknown';
  
  if (words.length === 1) {
    return capitalizeFirst(words[0]);
  }
  
  // If first word is short, take 2 words
  if (words[0].length <= 3 && words.length > 1) {
    return capitalizeFirst(`${words[0]} ${words[1]}`);
  }
  
  return capitalizeFirst(words[0]);
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Check if OpenAI API key is configured
 */
export function isAIAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
}
