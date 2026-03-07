export type AccountType = 'Cash' | 'Savings' | 'Checking' | 'Credit Card' | 'Investment' | 'Other';

export const accountTypes = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Savings', label: 'Savings' },
  { value: 'Checking', label: 'Checking' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Investment', label: 'Investment' },
  { value: 'Other', label: 'Other' },
];

// Additional export for backward compatibility
export const accountTypesData = accountTypes;