# Testing Cheat Sheet - Quick Reference

## 🚀 Quick Smoke Test (5 minutes)
Run these after every deployment:

1. **Sign In** → Dashboard loads without errors
2. **Add Income** ($5000) → Income KPI shows $5000
3. **Add Expense** ($100) → Expense KPI shows $100
4. **Check Net Balance** → Shows $4900
5. **Add Account Balance** (Savings: $10000) → Balance card updates
6. **Sign Out** → Redirects to home page

---

## 🎯 Critical Test Scenarios

### Scenario 1: Basic Transaction Flow
```
1. Sign in as test user
2. Add Transaction: Income - Salary $5000
3. Add Transaction: Expense - Rent $1500
4. Add Transaction: Expense - Food $500
5. Verify:
   - Income KPI: $5000
   - Expense KPI: $2000
   - Net Balance: $3000
   - Top Category: Housing or Food
```

### Scenario 2: Balance Reconciliation
```
1. Add Savings Balance: $10000
2. Check Account Balance Card:
   - Expected: $0 (no transactions)
   - Actual: $10000
   - Difference: +$10000
3. Add Income: $5000 to Savings
4. Check again:
   - Expected: $5000
   - Difference: +$5000
5. Add Expense: $2000 from Savings
6. Check again:
   - Expected: $3000
   - Difference: +$7000
```

### Scenario 3: Date Range Filtering
```
1. Add transaction: Jan 15, $1000
2. Add transaction: Feb 15, $2000
3. Set date filter to January only
4. Verify only $1000 transaction shown
5. Switch to February
6. Verify only $2000 transaction shown
7. Switch to "All Time"
8. Verify both transactions shown
```

### Scenario 4: Bulk Operations
```
1. Create 5 test transactions
2. Select all using checkboxes
3. Bulk delete
4. Verify all removed
5. Undo if available
```

### Scenario 5: CSV Import
```
1. Create test.csv:
   Date,Name,Amount,Type
   2024-01-01,Grocery,50.00,Expense
   2024-01-02,Salary,5000.00,Income
2. Upload via Upload dialog
3. Map columns
4. Import
5. Verify 2 new transactions created
```

---

## 🔒 Security Tests (Must Pass)

### Test A: Data Isolation
```
User A Setup:
1. Sign up as user_a@test.com
2. Add transaction: "User A Secret" $100
3. Note the transaction ID

User B Test:
1. Sign up as user_b@test.com
2. Try to access User A's transaction URL
3. Expected: 403 Forbidden or "Not Found"
4. Verify User B can't see User A's data in any view
```

### Test B: SQL Injection Prevention
```
1. Try entering in Name field: "'; DROP TABLE transactions; --"
2. Expected: Saved as literal text, no SQL error
3. Verify table still exists
```

### Test C: XSS Prevention
```
1. Try entering: <script>alert('hack')</script>
2. Expected: Saved as text, no alert popup
3. Verify script tags are escaped in UI
```

---

## 📊 Data Integrity Tests

### Test: Calculations
```
Income Transactions:
- Salary: $5000
- Freelance: $1000
- Gift: $200
Total Expected: $6200

Expense Transactions:
- Rent: $1500
- Food: $600
- Transport: $400
Total Expected: $2500

Net Expected: $3700
```

### Test: Decimal Handling
```
Add transactions with:
- $100.50
- $99.99
- $0.01
Verify totals calculate correctly with 2 decimal places
```

---

## 🐛 Common Bug Patterns to Check

| Bug Pattern | How to Test |
|-------------|-------------|
| **Income shows $0** | Check transaction.type = 'Income' (case sensitive) |
| **Charts not updating** | Add transaction → Check if refresh() called |
| **Date filter wrong** | Add transaction on last day of month → Check visibility |
| **Category not saving** | Create with category → Edit → Verify category persists |
| **Balance not persisting** | Add balance → Refresh page → Check if still there |
| **Pagination broken** | Create 51 transactions → Check page 2 |
| **Mobile layout broken** | Open on phone → Check all cards visible |

---

## 📝 Test Data Template

### Sample Transactions to Create
```javascript
// Copy this to browser console for quick testing
const testTransactions = [
  { name: "Salary", amount: 5000, type: "Income", category: "Income", account: "Checking", date: "2024-01-01" },
  { name: "Rent", amount: 1500, type: "Expense", category: "Housing", account: "Checking", date: "2024-01-05" },
  { name: "Groceries", amount: 300, type: "Expense", category: "Food", account: "Credit Card", date: "2024-01-10" },
  { name: "Freelance", amount: 1000, type: "Income", category: "Income", account: "Savings", date: "2024-01-15" },
  { name: "Gas", amount: 50, type: "Expense", category: "Transport", account: "Credit Card", date: "2024-01-20" },
  { name: "Dinner", amount: 80, type: "Expense", category: "Food", account: "Cash", date: "2024-01-25" },
];
```

### Expected Results After Test Data
| Metric | Expected Value |
|--------|----------------|
| Total Income | $6,000 |
| Total Expenses | $1,930 |
| Net Balance | $4,070 |
| Transaction Count | 6 |
| Top Category | Housing ($1,500) |
| Avg Expense | $482.50 |

---

## 🎨 UI/UX Quick Checks

### Visual
- [ ] All text readable (no truncation)
- [ ] Currency formatted correctly ($1,234.56)
- [ ] Dates formatted consistently (MMM DD, YYYY)
- [ ] Charts have proper legends
- [ ] Loading states visible

### Interaction
- [ ] Buttons have hover effects
- [ ] Forms validate on blur
- [ ] Modal closes on backdrop click
- [ ] Escape key closes modals
- [ ] Tab order is logical

### Mobile
- [ ] Touch targets > 44px
- [ ] No horizontal scroll
- [ ] Cards stack vertically
- [ ] Font size readable

---

## ⚡ Performance Benchmarks

| Action | Target Time |
|--------|-------------|
| Page Load | < 2 seconds |
| Login | < 1 second |
| Add Transaction | < 500ms |
| Filter Results | < 500ms |
| Chart Render | < 1 second |
| CSV Import (100 rows) | < 3 seconds |

---

## 🚨 When to Stop Testing

**STOP if you find:**
- ❌ Security breach (can see other user's data)
- ❌ Data loss (transactions disappear)
- ❌ Cannot sign in/out
- ❌ Cannot add basic transaction
- ❌ Calculations are wrong

**Continue if:**
- ⚠️ Minor UI glitches
- ⚠️ Non-critical features broken
- ⚠️ Edge case issues

---

## ✅ Sign-Off Checklist

Before marking testing complete:

- [ ] All Critical tests pass
- [ ] All Security tests pass
- [ ] No console errors
- [ ] Mobile responsive verified
- [ ] Performance targets met
- [ ] Data integrity verified
- [ ] Browser compatibility checked (Chrome, Firefox, Safari)

---

*Quick Reference for Manual Testing*
*Use with TESTING_GUIDE.md for full details*
