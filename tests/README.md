# Automated Testing Suite

This directory contains automated tests for the Zepto application.

## Setup

### Prerequisites

```bash
# Install Python 3.9+
python3 --version

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

1. Copy the example file:
   ```bash
   cp tests/.env.test.example tests/.env.test
   ```

2. Fill in your credentials in `.env.test`:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key

   # Clerk
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Test Users (get these by creating test accounts and extracting session tokens)
   TEST_USER_A_TOKEN=user_a_session_token
   TEST_USER_A_ID=user_a_clerk_id

   TEST_USER_B_TOKEN=user_b_session_token
   TEST_USER_B_ID=user_b_clerk_id

   # Default test user for basic tests
   TEST_CLERK_TOKEN=default_test_user_token
   TEST_USER_ID=default_test_user_id
   ```

3. **Getting Test Tokens**:
   - Sign in to your application with test accounts
   - Open browser DevTools → Application → Cookies
   - Find the Clerk session token (usually `__session`)
   - Or use Clerk Dashboard to generate test tokens

## Test Structure

```
tests/
├── README.md                    # This file
├── requirements.txt             # Python dependencies
├── .env.test                    # Test environment variables (copy from .env.test.example)
├── .env.test.example            # Example environment configuration
├── test_transactions.py         # Transaction CRUD tests
├── test_recurring.py            # Recurring transaction tests
├── test_rls.py                  # Row Level Security tests
├── test_integration.py          # End-to-end integration tests
└── utils/
    ├── __init__.py
    ├── supabase_client.py       # Supabase test client with auth
    ├── clerk_client.py          # Clerk authentication helper
    └── helpers.py               # Test data factories and utilities
```

## Running Tests

### Run All Tests
```bash
python -m pytest tests/ -v
```

### Run Specific Test File
```bash
python -m pytest tests/test_transactions.py -v
```

### Run Specific Test Class
```bash
python -m pytest tests/test_transactions.py::TestTransactionCreate -v
```

### Run Specific Test Method
```bash
python -m pytest tests/test_transactions.py::TestTransactionCreate::test_create_valid_transaction -v
```

### Run Tests by Category
```bash
# Run only RLS tests
python -m pytest tests/test_rls.py -v

# Run only integration tests
python -m pytest tests/test_integration.py -v

# Run recurring transaction tests
python -m pytest tests/test_recurring.py -v
```

### Run with Coverage
```bash
python -m pytest tests/ --cov=. --cov-report=html
```

## Test Categories

### 1. Transaction Tests (`test_transactions.py`)
**Purpose**: Verify all transaction CRUD operations with authentication and RLS

Test Classes:
- `TestTransactionCreate`: Creating transactions with validation
- `TestTransactionRead`: Reading and filtering transactions
- `TestTransactionUpdate`: Updating existing transactions
- `TestTransactionDelete`: Deleting single and bulk transactions

Key Tests:
- Create valid transaction with all required fields
- Create transaction without user_id fails (RLS enforcement)
- Invalid category foreign key constraint
- Filter by type (Income/Expense)
- Bulk delete operations

### 2. Recurring Transaction Tests (`test_recurring.py`)
**Purpose**: Test recurring transaction lifecycle and frequency handling

Test Classes:
- `TestRecurringTransactionCreate`: Creating recurring patterns
- `TestRecurringTransactionRead`: Reading and filtering recurring transactions
- `TestRecurringTransactionUpdate`: Modifying recurring patterns
- `TestRecurringTransactionDelete`: Removing recurring transactions
- `TestRecurringTransactionGeneration`: Query logic for generating due transactions

Key Tests:
- All frequency types (Daily, Weekly, Monthly, Yearly)
- Recurring transactions with end dates
- Activate/deactivate recurring patterns
- Filter by frequency and active status
- Bulk operations on recurring transactions

### 3. RLS Policy Tests (`test_rls.py`)
**Purpose**: Verify Row Level Security isolation between users

Test Classes:
- `TestRLSIsolation`: Multi-user data isolation tests
- `TestJWTClaims`: JWT token validation tests

Key Tests:
- User cannot see other users' transactions
- User can only see own transactions (2 users, 2 transactions each)
- User cannot update other users' transactions
- User cannot delete other users' transactions
- Authenticated role claim verification
- Unauthenticated requests fail

### 4. Integration Tests (`test_integration.py`)
**Purpose**: End-to-end workflow testing and real-world scenarios

Test Classes:
- `TestCompleteUserWorkflow`: Full user journey from signup to transactions
- `TestDashboardDataFlow`: Dashboard aggregations and statistics
- `TestBulkOperations`: Performance testing with large datasets
- `TestErrorRecovery`: Error handling and edge cases
- `TestPerformanceScenarios`: Pagination and large dataset handling

Key Tests:
- New user creating first transaction
- Monthly budget workflow with recurring expenses
- Dashboard transaction summary calculations
- Category breakdown aggregations
- Bulk create 50 transactions
- Bulk update and delete operations
- Pagination with 100+ transactions
- Duplicate transaction handling
- Invalid category error handling

## Test Utilities

### `utils/supabase_client.py`
Provides authenticated Supabase client for tests:
- `SupabaseTestClient`: Client with optional Clerk token authentication
- `get_admin_client()`: Admin client that bypasses RLS for cleanup
- `cleanup_test_data()`: Helper to clean up test data

### `utils/clerk_client.py`
Clerk authentication helper:
- `ClerkTestClient`: Clerk API client for test user management
- `get_test_token()`: Factory function to get test tokens from environment
- `get_test_user_id()`: Factory function to get test user IDs
- `create_test_user()`: Create test users via Clerk API
- `delete_test_user()`: Clean up test users

### `utils/helpers.py`
Test data factories and utilities:
- `generate_test_transaction()`: Create transaction with defaults
- `generate_test_recurring_transaction()`: Create recurring transaction
- `generate_bulk_transactions()`: Create multiple transactions
- `calculate_date_range()`: Helper for date-based queries
- `assert_transaction_equals()`: Custom assertion for transaction comparison
- `TestDataFactory`: Factory class with auto-incrementing counters

## Continuous Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'

    - name: Install dependencies
      run: |
        pip install -r tests/requirements.txt

    - name: Run tests
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
      run: |
        python -m pytest tests/ -v --cov=.
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Mocking**: Use mocks for external services when appropriate
4. **Assertions**: Use descriptive assertion messages
5. **Fixtures**: Share common setup code using pytest fixtures

## Troubleshooting

### Tests Failing Locally

1. **Check environment variables**: Ensure `.env.test` is correctly configured
2. **Database state**: Ensure test database is clean
3. **Network**: Verify you can reach Supabase and Clerk APIs
4. **Permissions**: Check Supabase RLS policies are configured correctly

### Slow Tests

1. Use `pytest-xdist` for parallel execution:
   ```bash
   pip install pytest-xdist
   pytest -n auto tests/
   ```

2. Use database transactions for faster cleanup
3. Cache authentication tokens when possible
