import { renderHook, waitFor } from '@testing-library/react';
import { useAccountBalances } from '@/hooks/use-account-balances';

// Mock the hooks and dependencies
jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

jest.mock('@/utils/supabase/client', () => ({
  useSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({
            data: [
              { id: 1, account_type: 'Savings', current_balance: 10000 },
              { id: 2, account_type: 'Checking', current_balance: 5000 },
            ],
            error: null,
          }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
      delete: () => Promise.resolve({ error: null }),
    }),
    rpc: () => Promise.resolve({
      data: [
        { account_type: 'Savings', expected_balance: 8000, actual_balance: 10000, difference: 2000 },
        { account_type: 'Checking', expected_balance: 3000, actual_balance: 5000, difference: 2000 },
      ],
      error: null,
    }),
  }),
}));

describe('useAccountBalances', () => {
  it('should fetch balances on mount', async () => {
    const { result } = renderHook(() => useAccountBalances());

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check balances loaded
    expect(result.current.balances).toHaveLength(2);
    expect(result.current.balances[0].account_type).toBe('Savings');
  });

  it('should calculate totals correctly', async () => {
    const { result } = renderHook(() => useAccountBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check totals
    expect(result.current.totals.totalActual).toBe(15000);
    expect(result.current.totals.totalExpected).toBe(11000);
    expect(result.current.totals.totalDifference).toBe(4000);
  });

  it('should provide upsertBalance function', async () => {
    const { result } = renderHook(() => useAccountBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.upsertBalance).toBe('function');
  });

  it('should provide refresh function', async () => {
    const { result } = renderHook(() => useAccountBalances());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });
});
