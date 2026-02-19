# Function Analytics System

A comprehensive analytics system for tracking function performance, usage patterns, and error rates in real-time.

## Features

- **Real-time Tracking**: Monitor function calls as they happen
- **Performance Metrics**: Track duration, success rates, and error rates
- **Category Grouping**: Organize functions by category (e.g., Transactions, RecurringTransactions)
- **Visual Dashboard**: Beautiful charts and statistics in the debug panel
- **Export Data**: Export analytics as JSON for further analysis
- **Low Overhead**: Minimal performance impact when enabled

## Quick Start

The analytics system is automatically enabled when you wrap your app with `AnalyticsProvider` (already done in `app/layout.tsx`).

### Basic Usage

```tsx
import { useAnalytics } from '@/components/debug'

function MyComponent() {
  const { trackFunction } = useAnalytics()

  const handleCreate = async (data: any) => {
    return trackFunction(
      'createItem',           // Function name
      'Inventory',            // Category
      async () => {
        // Your actual function logic here
        const result = await api.create(data)
        return result
      },
      { itemName: data.name } // Optional metadata
    )
  }
}
```

### Using the Tracked Hook

For simpler cases, use the `useTrackedCallback` hook:

```tsx
import { useTrackedCallback } from '@/components/debug'

function MyComponent() {
  const handleSubmit = useTrackedCallback(
    async (formData: FormData) => {
      await submitForm(formData)
    },
    'submitForm',      // Function name
    'Forms',           // Category
    []                 // Dependencies
  )

  return <form onSubmit={handleSubmit}>...</form>
}
```

## Viewing Analytics

1. Open the **Debug Panel** (click "Debug" button in bottom right)
2. Click on the **"Analytics"** tab
3. See real-time statistics and performance metrics

### Dashboard Features

- **Overview Cards**: Total calls, success rate, average duration, error rate
- **Slowest Functions**: Identify performance bottlenecks
- **Error-Prone Functions**: Find functions with high error rates
- **Function Details**: Expand each function to see:
  - Success/error counts
  - Min/max/average duration
  - Recent calls with timestamps
  - Error messages

## API Reference

### `useAnalytics()`

Main hook for accessing analytics functionality.

```typescript
const {
  calls,                    // All tracked function calls
  stats,                    // Map of function statistics
  categoryStats,            // Statistics grouped by category
  trackFunction,            // Track a function call
  startTracking,            // Manual tracking start
  endTracking,              // Manual tracking end
  getFunctionStats,         // Get stats for specific function
  getCategoryStats,         // Get stats for category
  clearAnalytics,           // Clear all data
  exportAnalytics,          // Export as JSON string
  isAnalyticsEnabled,       // Check if enabled
  setAnalyticsEnabled       // Enable/disable
} = useAnalytics()
```

### `trackFunction<T>()`

Wraps a function to track its execution.

```typescript
const result = await trackFunction<T>(
  functionName: string,      // Name of the function
  category: string,          // Category for grouping
  fn: () => Promise<T> | T,  // The function to track
  metadata?: Record<string, any>  // Optional metadata
)
```

### `useTrackedCallback<T>()`

Hook version for callbacks.

```typescript
const trackedFn = useTrackedCallback<T>(
  callback: T,               // The callback function
  functionName: string,      // Name for tracking
  category: string,          // Category
  deps?: DependencyList     // React dependencies
)
```

## Integration Examples

### Transaction Hook

```typescript
// hooks/use-transactions.ts
const createTransaction = useCallback(async (data: Partial<Transaction>) => {
  return trackFunction(
    'createTransaction',
    'Transactions',
    async () => {
      // ... transaction logic
    },
    { transactionName: data.name, transactionType: data.type }
  )
}, [trackFunction])
```

### API Service

```typescript
// services/my-service.ts
class MyService {
  async fetchData() {
    const { trackFunction } = useAnalytics()
    
    return trackFunction(
      'MyService.fetchData',
      'API',
      async () => {
        const response = await fetch('/api/data')
        return response.json()
      }
    )
  }
}
```

### Event Handler

```tsx
// components/my-button.tsx
import { useTrackedCallback } from '@/components/debug'

export function MyButton() {
  const handleClick = useTrackedCallback(
    async () => {
      await processPayment()
    },
    'processPayment',
    'Payments'
  )

  return <button onClick={handleClick}>Pay</button>
}
```

## Data Structure

### FunctionCall

```typescript
interface FunctionCall {
  id: string              // Unique call ID
  functionName: string    // Function name
  category: string        // Category
  startTime: number       // Start timestamp (performance.now())
  endTime?: number        // End timestamp
  duration?: number       // Duration in milliseconds
  success: boolean        // Whether it succeeded
  error?: string          // Error message if failed
  metadata?: Record<string, any>  // Custom metadata
  timestamp: Date         // When it was called
}
```

### FunctionStats

```typescript
interface FunctionStats {
  functionName: string
  category: string
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  lastCalled: Date | null
  errorRate: number
  recentCalls: FunctionCall[]
}
```

## Performance Considerations

- Analytics are **disabled by default in production** (can be enabled via Debug Panel)
- Maximum **1000 calls** are stored (oldest are removed)
- Maximum **50 recent calls** per function are kept
- Tracking overhead is minimal (< 1ms per call)

## Disabling Analytics

### Temporarily

Click the "Disable Analytics" button in the Debug Panel's Analytics tab.

### Programmatically

```typescript
const { setAnalyticsEnabled } = useAnalytics()
setAnalyticsEnabled(false)
```

### For Specific Calls

Check if analytics is enabled before tracking:

```typescript
const { isAnalyticsEnabled } = useAnalytics()

if (isAnalyticsEnabled) {
  // Track expensive operations
  await trackFunction(...)
} else {
  // Just run without tracking
  await myFunction()
}
```

## Troubleshooting

### Analytics not showing

1. Check that `AnalyticsProvider` wraps your app (in `app/layout.tsx`)
2. Verify analytics is enabled in the Debug Panel
3. Make sure functions are actually being called

### Performance impact

If you notice slowdown:
1. Disable analytics in production
2. Reduce tracked functions
3. Clear analytics data periodically

### Missing data

- Analytics data is stored in memory only (lost on page refresh)
- Export data before refreshing if you need to keep it
