# Test Suite Quickstart Guide

Get the automated test suite running in 5 minutes.

## Prerequisites

- Python 3.9 or higher installed
- Active Supabase project
- Active Clerk application
- Test user accounts created

## Step 1: Install Dependencies

```bash
cd tests
pip install -r requirements.txt
```

## Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.test.example .env.test

# Edit .env.test with your credentials
nano .env.test  # or use your preferred editor
```

### Required Configuration

```env
# Supabase (from Supabase Dashboard → Settings → API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
SUPABASE_SERVICE_KEY=eyJhbGc...your_service_role_key

# Clerk (from Clerk Dashboard → API Keys)
CLERK_SECRET_KEY=sk_test_...your_secret_key

# Test Users - Option A: Use existing test accounts
TEST_CLERK_TOKEN=your_test_user_session_token
TEST_USER_ID=user_2abc123xyz

# Test Users - Option B: For RLS tests (requires 2 users)
TEST_USER_A_TOKEN=user_a_session_token
TEST_USER_A_ID=user_a_clerk_id
TEST_USER_B_TOKEN=user_b_session_token
TEST_USER_B_ID=user_b_clerk_id
```

### Getting Test Tokens

**Method 1: Browser DevTools (Easiest)**
1. Sign in to your application with a test account
2. Open DevTools (F12)
3. Go to Application → Cookies
4. Find `__session` cookie - this is your Clerk session token
5. Copy the token value to `.env.test`

**Method 2: Clerk Dashboard**
1. Go to Clerk Dashboard → Users
2. Create test users or select existing ones
3. Copy user IDs directly
4. Generate session tokens using Clerk API

**Method 3: Programmatic (Advanced)**
See `utils/clerk_client.py` for creating users via API.

## Step 3: Run Tests

### Quick Test - Verify Setup
```bash
# Run a single simple test to verify everything works
python -m pytest tests/test_transactions.py::TestTransactionCreate::test_create_valid_transaction -v
```

Expected output:
```
tests/test_transactions.py::TestTransactionCreate::test_create_valid_transaction PASSED [100%]

============================== 1 passed in 2.34s ===============================
```

### Run All Tests
```bash
python -m pytest tests/ -v
```

### Run Tests by Category
```bash
# Transaction tests only
python -m pytest tests/test_transactions.py -v

# RLS security tests
python -m pytest tests/test_rls.py -v

# Integration tests
python -m pytest tests/test_integration.py -v

# Recurring transaction tests
python -m pytest tests/test_recurring.py -v
```

## Step 4: View Results

### Console Output
Tests will show:
- ✅ **PASSED**: Test succeeded
- ❌ **FAILED**: Test failed (check error details)
- ⚠️ **SKIPPED**: Test was skipped

### Coverage Report
```bash
# Generate HTML coverage report
python -m pytest tests/ --cov=. --cov-report=html

# Open in browser
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

## Common Issues & Solutions

### Issue: "ModuleNotFoundError: No module named 'supabase'"
**Solution**: Install dependencies
```bash
pip install -r requirements.txt
```

### Issue: "ValueError: Missing Supabase environment variables"
**Solution**: Check your `.env.test` file exists and has correct values
```bash
# Verify file exists
ls -la .env.test

# Check contents (don't commit this file!)
cat .env.test
```

### Issue: Tests fail with "new row violates row-level security policy"
**Solution**: Configure native Clerk integration
1. In Clerk Dashboard → JWT Templates → Default
2. Add claim: `role: "authenticated"`
3. In Supabase Dashboard → Authentication → Providers
4. Add Clerk as Third-Party Auth provider
5. Sign out and back in to get fresh session token

### Issue: "User not authenticated" errors
**Solution**: Verify session tokens are valid
1. Session tokens expire - generate new ones
2. Make sure you're using tokens from AFTER configuring native integration
3. Check that user IDs match between Clerk and test configuration

### Issue: Tests pass individually but fail when run together
**Solution**: Cleanup issue - check fixtures
```bash
# Run tests in verbose mode to see cleanup
python -m pytest tests/ -v -s

# Run tests with fresh database each time
python -m pytest tests/ --create-db
```

## Test Coverage Goals

- **Unit Tests**: ≥80% coverage
- **Integration Tests**: ≥70% coverage
- **RLS Security Tests**: 100% of policies tested
- **Critical Paths**: 100% coverage (auth, transactions, RLS)

## Next Steps

### For Development
1. Run tests before committing changes
2. Add tests for new features
3. Maintain coverage above thresholds

### For CI/CD
1. Set up GitHub Actions (see `tests/README.md`)
2. Run tests on every PR
3. Block merges if tests fail

### For Production
1. Create separate test database
2. Use dedicated test Clerk environment
3. Schedule regular test runs
4. Monitor test performance

## Test Suite Structure

```
tests/
├── QUICKSTART.md (this file)    # Quick setup guide
├── README.md                     # Detailed documentation
├── TESTING_GUIDE.md             # Manual testing checklist
├── requirements.txt              # Python dependencies
├── .env.test.example            # Environment template
├── .env.test                    # Your configuration (git-ignored)
│
├── test_transactions.py         # 20+ transaction CRUD tests
├── test_recurring.py            # 15+ recurring transaction tests
├── test_rls.py                  # 6+ security isolation tests
├── test_integration.py          # 10+ end-to-end workflow tests
│
└── utils/
    ├── supabase_client.py       # Authenticated Supabase client
    ├── clerk_client.py          # Clerk authentication helper
    └── helpers.py               # Test data factories
```

## Useful Commands Reference

```bash
# Run specific test file
pytest tests/test_transactions.py -v

# Run specific test class
pytest tests/test_transactions.py::TestTransactionCreate -v

# Run specific test method
pytest tests/test_transactions.py::TestTransactionCreate::test_create_valid_transaction -v

# Run with verbose output
pytest tests/ -v -s

# Run with coverage
pytest tests/ --cov=. --cov-report=term-missing

# Run tests in parallel (faster)
pip install pytest-xdist
pytest tests/ -n auto

# Run only failed tests from last run
pytest tests/ --lf

# Run tests matching pattern
pytest tests/ -k "transaction" -v
```

## Support

- **Documentation**: See `tests/README.md` for detailed information
- **Manual Testing**: See `TESTING_GUIDE.md` for manual test checklist
- **Issues**: Check existing issues or create new one
- **Supabase Docs**: https://supabase.com/docs
- **Clerk Docs**: https://clerk.com/docs
- **pytest Docs**: https://docs.pytest.org

---

**Total Tests**: 50+ automated tests covering authentication, CRUD operations, RLS policies, and integration workflows.

**Estimated Runtime**: ~30 seconds for full test suite (with proper setup).
