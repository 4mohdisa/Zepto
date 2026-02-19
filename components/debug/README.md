# Zepto Debug System

A comprehensive debugging and logging system for the Zepto application.

## Features

- **Enhanced Debug Panel**: A floating debug console with multiple tabs
- **Centralized Logging**: Consistent logging across the application
- **System Checks**: Automated checks for authentication, database, and RLS policies
- **Log Export**: Export logs for troubleshooting
- **Environment Aware**: Automatically shown in development, opt-in for production

## Components

### 1. DebugProvider

Wraps the application and provides debug context to all children.

```tsx
import { DebugProvider } from '@/components/debug'

function App() {
  return (
    <DebugProvider>
      <YourApp />
    </DebugProvider>
  )
}
```

### 2. EnhancedDebugPanel

The main debug UI that appears as a floating panel.

**Tabs:**
- **Overview**: System status, authentication state, environment info
- **Logs**: Real-time application logs with filtering
- **Auth**: JWT details, user info, debug mode toggle
- **Database**: Connection info, quick query tests

### 3. useDebugLogger Hook

For component-level logging:

```tsx
import { useDebugLogger } from '@/components/debug'

function MyComponent() {
  const logger = useDebugLogger('MyComponent')
  
  useEffect(() => {
    logger.info('Component mounted')
    logger.debug('Debug info', { someData: true })
    
    try {
      // some operation
      logger.success('Operation completed')
    } catch (err) {
      logger.error('Operation failed', err)
    }
  }, [])
  
  return <div>...</div>
}
```

### 4. useDebug Hook

For accessing the full debug context:

```tsx
import { useDebug } from '@/components/debug'

function MyComponent() {
  const { addLog, logs, clearLogs, exportLogs, isDebugMode } = useDebug()
  
  // Use the debug functions
  
  return <div>...</div>
}
```

## Usage

### Enabling Debug Mode

**Development**: Debug panel is always available.

**Production**: Add `?debug=true` to URL or run in console:
```javascript
localStorage.setItem('zeptodebug', 'true')
```

### System Checks

The debug panel can run automated checks for:
1. **Authentication**: Verifies user is signed in
2. **JWT Claims**: Decodes and validates JWT token
3. **Supabase Connection**: Tests API connectivity
4. **Database Access**: Verifies RLS policies allow data access
5. **RLS Policies**: Tests INSERT policy enforcement

### Log Levels

- `debug`: Detailed information for debugging
- `info`: General information
- `success`: Successful operations
- `warn`: Warning messages
- `error`: Error messages

### Exporting Logs

Click the download button in the Logs tab to export all logs as a text file.

## Integration Guide

### Adding Debug Logging to a Component

```tsx
'use client'

import { useDebugLogger } from '@/components/debug'

export function TransactionForm() {
  const logger = useDebugLogger('TransactionForm')
  
  const handleSubmit = async (data: FormData) => {
    logger.info('Submitting transaction', { name: data.name })
    
    try {
      const result = await createTransaction(data)
      logger.success('Transaction created', { id: result.id })
    } catch (err) {
      logger.error('Failed to create transaction', err)
      throw err
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### Adding Debug Logging to a Hook

```tsx
import { useDebugLogger } from '@/components/debug'

export function useTransactions() {
  const logger = useDebugLogger('useTransactions')
  
  useEffect(() => {
    logger.info('Fetching transactions')
    
    fetchTransactions()
      .then(data => {
        logger.success('Transactions fetched', { count: data.length })
      })
      .catch(err => {
        logger.error('Failed to fetch transactions', err)
      })
  }, [])
}
```

### Adding Debug Logging to Services

```tsx
import { useDebug } from '@/components/debug'

class TransactionService {
  constructor(private debug = useDebug()) {}
  
  async create(data: TransactionData) {
    this.debug.addLog('info', 'TransactionService', 'Creating transaction', data)
    
    try {
      const result = await this.supabase.from('transactions').insert(data)
      this.debug.addLog('success', 'TransactionService', 'Transaction created', { id: result.id })
      return result
    } catch (err) {
      this.debug.addLog('error', 'TransactionService', 'Create failed', err)
      throw err
    }
  }
}
```

## Best Practices

1. **Use appropriate log levels**: Don't use `error` for expected conditions
2. **Include context**: Add relevant data to help with debugging
3. **Sanitize sensitive data**: Don't log passwords, tokens, or PII
4. **Keep log messages concise**: Detailed data goes in the details parameter
5. **Use component names**: Makes it easy to filter logs by source

## Troubleshooting

### Debug panel not showing
- Check if `NODE_ENV` is development
- Or enable via `localStorage.setItem('zeptodebug', 'true')`

### Logs not appearing
- Ensure component is wrapped in `DebugProvider`
- Check if log level filter is hiding them

### System checks failing
- Check Authentication: Ensure user is signed in
- Check JWT Claims: Verify Clerk session token has `role: "authenticated"`
- Check RLS: Verify Supabase RLS policies are properly configured
