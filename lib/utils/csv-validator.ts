/**
 * CSV Import Validation and Duplicate Detection
 */

import { createHash } from 'crypto';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

export interface CSVTransaction {
  date: string;
  name: string;
  description: string;
  amount: number;
  type?: 'Income' | 'Expense';
  category?: string;
  account_type?: string;
  rawData: Record<string, string>;
}

export interface ValidatedCSVResult {
  valid: boolean;
  transactions: CSVTransaction[];
  errors: ValidationError[];
  duplicates: CSVTransaction[];
}

// Generate unique hash for duplicate detection
export function generateTransactionHash(transaction: CSVTransaction): string {
  const hashData = `${transaction.date}|${transaction.name}|${transaction.amount}|${transaction.type}`;
  return createHash('md5').update(hashData).digest('hex');
}

// Client-side hash generation (for browser)
export function generateTransactionHashClient(transaction: CSVTransaction): string {
  const hashData = `${transaction.date}|${transaction.name}|${transaction.amount}|${transaction.type}`;
  let hash = 0;
  for (let i = 0; i < hashData.length; i++) {
    const char = hashData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Validate date format (YYYY-MM-DD)
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  
  // Check format
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  // Check if valid date
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

// Validate amount
export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && !isNaN(amount) && amount > 0;
}

// Validate transaction type
export function isValidType(type: string): boolean {
  return type === 'Income' || type === 'Expense';
}

// Validate a single transaction
export function validateTransaction(
  transaction: CSVTransaction,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Date validation
  if (!transaction.date) {
    errors.push({
      row: rowIndex,
      field: 'date',
      message: 'Date is required',
      value: '',
    });
  } else if (!isValidDate(transaction.date)) {
    errors.push({
      row: rowIndex,
      field: 'date',
      message: 'Invalid date format. Use YYYY-MM-DD',
      value: transaction.date,
    });
  }

  // Name/Merchant validation
  if (!transaction.name || transaction.name.trim().length === 0) {
    errors.push({
      row: rowIndex,
      field: 'name',
      message: 'Merchant name is required',
      value: transaction.name || '',
    });
  }

  // Amount validation
  if (!isValidAmount(transaction.amount)) {
    errors.push({
      row: rowIndex,
      field: 'amount',
      message: 'Amount must be a positive number',
      value: String(transaction.amount),
    });
  }

  // Type validation
  if (transaction.type && !isValidType(transaction.type)) {
    errors.push({
      row: rowIndex,
      field: 'type',
      message: 'Type must be Income or Expense',
      value: transaction.type,
    });
  }

  return errors;
}

// Detect duplicates within the CSV itself
export function detectInternalDuplicates(transactions: CSVTransaction[]): {
  unique: CSVTransaction[];
  duplicates: CSVTransaction[];
} {
  const seen = new Set<string>();
  const unique: CSVTransaction[] = [];
  const duplicates: CSVTransaction[] = [];

  transactions.forEach((t) => {
    const hash = generateTransactionHashClient(t);
    if (seen.has(hash)) {
      duplicates.push(t);
    } else {
      seen.add(hash);
      unique.push(t);
    }
  });

  return { unique, duplicates };
}

// Check against existing transactions (requires API call)
export async function checkExistingDuplicates(
  transactions: CSVTransaction[],
  checkFn: (hash: string) => Promise<boolean>
): Promise<{ unique: CSVTransaction[]; duplicates: CSVTransaction[] }> {
  const unique: CSVTransaction[] = [];
  const duplicates: CSVTransaction[] = [];

  for (const t of transactions) {
    const hash = generateTransactionHashClient(t);
    const exists = await checkFn(hash);
    if (exists) {
      duplicates.push(t);
    } else {
      unique.push(t);
    }
  }

  return { unique, duplicates };
}

// Main validation function
export function validateCSVImport(
  transactions: CSVTransaction[],
  existingHashes?: Set<string>
): ValidatedCSVResult {
  const errors: ValidationError[] = [];
  const validTransactions: CSVTransaction[] = [];
  const duplicateTransactions: CSVTransaction[] = [];

  // Check for internal duplicates first
  const { unique, duplicates: internalDups } = detectInternalDuplicates(transactions);
  
  // Mark internal duplicates
  internalDups.forEach((dup) => duplicateTransactions.push(dup));

  // Validate each unique transaction
  unique.forEach((transaction, index) => {
    const rowErrors = validateTransaction(transaction, index + 1);
    
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      // Check against existing hashes if provided
      if (existingHashes) {
        const hash = generateTransactionHashClient(transaction);
        if (existingHashes.has(hash)) {
          duplicateTransactions.push(transaction);
        } else {
          validTransactions.push(transaction);
        }
      } else {
        validTransactions.push(transaction);
      }
    }
  });

  return {
    valid: errors.length === 0,
    transactions: validTransactions,
    errors,
    duplicates: duplicateTransactions,
  };
}

// Format validation summary
export function formatValidationSummary(result: ValidatedCSVResult): string {
  const parts: string[] = [];
  
  if (result.transactions.length > 0) {
    parts.push(`${result.transactions.length} valid transactions`);
  }
  
  if (result.errors.length > 0) {
    const uniqueRows = new Set(result.errors.map((e) => e.row)).size;
    parts.push(`${uniqueRows} rows with errors`);
  }
  
  if (result.duplicates.length > 0) {
    parts.push(`${result.duplicates.length} duplicates detected`);
  }
  
  return parts.join(', ') || 'No valid transactions found';
}
