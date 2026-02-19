# Comprehensive Testing Guide - Zepto Finance App

## Table of Contents
1. [Authentication & Authorization](#1-authentication--authorization)
2. [Transactions](#2-transactions)
3. [Dashboard & Analytics](#3-dashboard--analytics)
4. [Account Balances](#4-account-balances)
5. [Categories](#5-categories)
6. [Recurring Transactions](#6-recurring-transactions)
7. [File Upload (CSV Import)](#7-file-upload-csv-import)
8. [RLS & Security](#8-rls--security)
9. [UI/UX](#9-uiux)
10. [Performance & Edge Cases](#10-performance--edge-cases)

---

## 1. Authentication & Authorization

### 1.1 Sign Up Flow
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| AUTH-001 | Valid email signup | 1. Click "Get Started"<br>2. Enter valid email<br>3. Enter password<br>4. Click Sign Up | Account created, redirected to dashboard |
| AUTH-002 | Weak password rejection | 1. Enter email<br>2. Enter "123" as password | Error: "Password must be at least 8 characters" |
| AUTH-003 | Duplicate email | 1. Sign up with existing email | Error: "Email already registered" |
| AUTH-004 | Invalid email format | 1. Enter "notanemail" | Error: "Invalid email format" |
| AUTH-005 | Email verification | 1. Sign up<br>2. Check email<br>3. Click verification link | Email verified, can access app |

### 1.2 Sign In Flow
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| AUTH-006 | Valid credentials | 1. Enter registered email<br>2. Enter correct password | Signed in, redirected to dashboard |
| AUTH-007 | Wrong password | 1. Enter registered email<br>2. Enter wrong password | Error: "Invalid credentials" |
| AUTH-008 | Non-existent user | 1. Enter unregistered email | Error: "User not found" |
| AUTH-009 | Password reset | 1. Click "Forgot password"<br>2. Enter email<br>3. Click reset link | Password reset email sent |

### 1.3 Session Management
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| AUTH-010 | Session persistence | 1. Sign in<br>2. Close browser<br>3. Reopen app | Still signed in (if "remember me") |
| AUTH-011 | Session timeout | 1. Sign in<br>2. Wait for timeout period | Redirected to sign-in |
| AUTH-012 | Manual sign out | 1. Click Sign Out | Signed out, redirected to home |
| AUTH-013 | Multiple tabs | 1. Sign in on Tab 1<br>2. Open Tab 2 | Both tabs show authenticated state |

### 1.4 Supabase RLS Integration
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| AUTH-014 | JWT token passed | 1. Sign in<br>2. Check Supabase requests | JWT token in Authorization header |
| AUTH-015 | RLS policy active | 1. Try to access another user's data | 403 Forbidden |

---

## 2. Transactions

### 2.1 Create Transaction
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TXN-001 | Create Income | 1. Click Add Transaction<br>2. Type: Income<br>3. Amount: 5000<br>4. Save | Transaction saved, Income KPI updates |
| TXN-002 | Create Expense | 1. Click Add Transaction<br>2. Type: Expense<br>3. Amount: 100<br>4. Save | Transaction saved, Expense KPI updates |
| TXN-003 | Required fields | 1. Click Save with empty fields | Validation errors shown |
| TXN-004 | Negative amount | 1. Enter amount: -100 | Error: "Amount must be positive" |
| TXN-005 | Zero amount | 1. Enter amount: 0 | Error: "Amount must be greater than 0" |
| TXN-006 | Very large amount | 1. Enter amount: 999999999.99 | Transaction saved successfully |
| TXN-007 | Special chars in name | 1. Enter name: "Test @#$%" | Saved with special characters |
| TXN-008 | Unicode name | 1. Enter name: "給料" (Japanese) | Saved correctly |
| TXN-009 | Long description | 1. Enter 1000 char description | Saved, truncated if needed |
| TXN-010 | Future date | 1. Set date: next month | Transaction saved with future date |
| TXN-011 | Past date | 1. Set date: last year | Transaction saved with past date |

### 2.2 Read/View Transactions
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TXN-012 | View all transactions | 1. Go to Transactions page | All user's transactions displayed |
| TXN-013 | Empty state | 1. New user with no transactions | "No transactions" message shown |
| TXN-014 | Pagination | 1. Have >50 transactions | Pagination controls appear |
| TXN-015 | Sort by date | 1. Click Date column header | Transactions sorted by date |
| TXN-016 | Sort by amount | 1. Click Amount column header | Transactions sorted by amount |

### 2.3 Update Transaction
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TXN-017 | Edit amount | 1. Click Edit<br>2. Change amount<br>3. Save | Amount updated, KPIs recalculated |
| TXN-018 | Edit type | 1. Change Expense → Income<br>2. Save | Type updated, Income/Expense KPIs update |
| TXN-019 | Edit category | 1. Change category<br>2. Save | Category updated, charts update |
| TXN-020 | Cancel edit | 1. Click Edit<br>2. Make changes<br>3. Cancel | No changes saved |

### 2.4 Delete Transaction
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TXN-021 | Delete single | 1. Click Delete<br>2. Confirm | Transaction removed, KPIs update |
| TXN-022 | Cancel delete | 1. Click Delete<br>2. Cancel | Transaction remains |
| TXN-023 | Bulk delete | 1. Select multiple<br>2. Click Bulk Delete | All selected deleted |

### 2.5 Filtering & Search
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TXN-024 | Filter by type Income | 1. Select Type: Income | Only Income transactions shown |
| TXN-025 | Filter by type Expense | 1. Select Type: Expense | Only Expense transactions shown |
| TXN-026 | Filter by date range | 1. Set date range: Jan 1-31 | Only Jan transactions shown |
| TXN-027 | Filter by category | 1. Select Category: Food | Only Food category shown |
| TXN-028 | Filter by account | 1. Select Account: Savings | Only Savings transactions shown |
| TXN-029 | Combined filters | 1. Type: Expense<br>2. Category: Food | Only Food expenses shown |
| TXN-030 | Search by name | 1. Search: "Grocery" | Matching transactions shown |
| TXN-031 | Search partial match | 1. Search: "Gro" | "Grocery" matches |
| TXN-032 | Clear filters | 1. Apply filters<br>2. Click Clear | All filters reset |

### 2.6 Bulk Operations
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TXN-033 | Bulk update category | 1. Select multiple<br>2. Change category | All selected updated |
| TXN-034 | Bulk update account | 1. Select multiple<br>2. Change account type | All selected updated |
| TXN-035 | Select all | 1. Click Select All checkbox | All transactions selected |

---

## 3. Dashboard & Analytics

### 3.1 Stats Overview Cards
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| DASH-001 | Income calculation | 1. Add Income: $5000<br>2. Add Income: $3000 | Income card shows $8000 |
| DASH-002 | Expense calculation | 1. Add Expense: $1000<br>2. Add Expense: $500 | Expense card shows $1500 |
| DASH-003 | Net balance | 1. Income: $5000<br>2. Expense: $3000 | Net shows $2000 |
| DASH-004 | Negative net | 1. Income: $1000<br>2. Expense: $3000 | Net shows -$2000 (red) |
| DASH-005 | Zero state | No transactions | All cards show $0 |
| DASH-006 | Top category | 1. Food: $500<br>2. Rent: $1000 | Top Category shows "Rent" |
| DASH-007 | Percentage change | Compare with previous month | Correct % shown with up/down arrow |

### 3.2 Charts
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| DASH-008 | Line chart renders | View dashboard | Daily income/expense line chart visible |
| DASH-009 | Pie chart renders | View dashboard | Category distribution pie chart visible |
| DASH-010 | Bar chart renders | View dashboard | Monthly comparison bar chart visible |
| DASH-011 | Chart with no data | New user, no transactions | "No data" or empty state |
| DASH-012 | Chart updates | Add new transaction | Chart updates within 2 seconds |
| DASH-013 | Hover tooltip | Hover over chart point | Tooltip shows date/amount |
| DASH-014 | Legend toggle | Click legend item | Series shown/hidden |

### 3.3 Date Range Filtering
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| DASH-015 | Current month default | Open dashboard | Shows current month data |
| DASH-016 | Change month | Select different month | Data updates to selected month |
| DASH-017 | Custom date range | Select Jan 1-15 | Only that range shown |
| DASH-018 | Year change | Select previous year | Previous year data shown |
| DASH-019 | Future date | Select future month | Empty or $0 shown |

### 3.4 Quick Stats
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| DASH-020 | Transaction count | Add 5 transactions | Count shows 5 |
| DASH-021 | Avg expense | Expenses: $100, $200 | Avg shows $150 |
| DASH-022 | Largest expense | Expenses: $50, $500, $100 | Shows $500 |
| DASH-023 | Savings rate | Income $5000, Exp $3000 | Rate shows 40% |

---

## 4. Account Balances

### 4.1 Add/Update Balance
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| BAL-001 | Add Savings balance | 1. Open Balance Dialog<br>2. Select Savings<br>3. Enter $10000<br>4. Save | Balance saved, appears in summary |
| BAL-002 | Update existing | 1. Select Savings again<br>2. Change to $15000 | Balance updated to $15000 |
| BAL-003 | Add Checking balance | Add $5000 to Checking | Checking balance shows $5000 |
| BAL-004 | Add Cash balance | Add $500 to Cash | Cash balance shows $500 |
| BAL-005 | Zero balance | Enter $0 | Saved as $0 |
| BAL-006 | Negative balance (debt) | Try entering -$1000 | Validation error or saved as negative |
| BAL-007 | Decimal balance | Enter $1000.50 | Saved with 2 decimals |
| BAL-008 | All account types | Add balance to each type | All types shown in summary |

### 4.2 Balance Summary Display
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| BAL-009 | Expected balance calc | No transactions for account | Expected shows $0 |
| BAL-010 | With income transactions | Add $5000 Income to Savings | Expected shows $5000 |
| BAL-011 | With expense transactions | Add $2000 Expense from Savings | Expected shows -$2000 |
| BAL-012 | Net expected | Income $5000 + Expense $2000 | Expected shows $3000 |
| BAL-013 | Difference calculation | Actual $10000, Expected $5000 | Difference shows +$5000 (green) |
| BAL-014 | Negative difference | Actual $3000, Expected $5000 | Difference shows -$2000 (red) |
| BAL-015 | Zero difference | Actual = Expected | Shows $0 (gray) |

### 4.3 Dashboard Balance Card
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| BAL-016 | Card displays | View dashboard | Account Balance card visible |
| BAL-017 | Lists all accounts | Have 3 balances | All 3 shown in card |
| BAL-018 | Total actual | Balances: $10k, $5k, $2k | Total shows $17k |
| BAL-019 | Auto-refresh | Add new balance | Card updates automatically |
| BAL-020 | Empty state | No balances | "No balances recorded" message |

---

## 5. Categories

### 5.1 Category Management
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| CAT-001 | View categories | Go to Categories | All categories listed |
| CAT-002 | Create category | 1. Click New<br>2. Enter name<br>3. Save | Category created |
| CAT-003 | Duplicate category | Create existing category name | Error: "Category already exists" |
| CAT-004 | Edit category | 1. Click Edit<br>2. Change name<br>3. Save | Name updated on all transactions |
| CAT-005 | Delete unused category | Delete category with no transactions | Category removed |
| CAT-006 | Delete used category | Try delete category with transactions | Error or set to Uncategorized |
| CAT-007 | Category color | Assign color to category | Color shown in charts |

### 5.2 Category Usage
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| CAT-008 | Assign category | Create transaction with category | Category saved with transaction |
| CAT-009 | Change category | Edit transaction, change category | New category reflected in charts |
| CAT-010 | Uncategorized | Create transaction without category | Shows as "Uncategorized" |
| CAT-011 | Category in pie chart | Have transactions in categories | Pie chart segments by category |

---

## 6. Recurring Transactions

### 6.1 Create Recurring
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| REC-001 | Monthly recurring | 1. Create recurring<br>2. Frequency: Monthly<br>3. Save | Recurring transaction created |
| REC-002 | Weekly recurring | Frequency: Weekly | Weekly schedule created |
| REC-003 | With end date | Set end date 6 months later | Stops generating after end date |
| REC-004 | No end date | Leave end date empty | Generates indefinitely |
| REC-005 | Generate instances | Create monthly recurring | Next 12 months generated |

### 6.2 Manage Recurring
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| REC-006 | View upcoming | Go to Recurring Transactions | Upcoming instances listed |
| REC-007 | Edit recurring | Change amount of recurring | All future instances updated |
| REC-008 | Delete recurring | Delete recurring transaction | Future instances removed |
| REC-009 | Skip instance | Skip one occurrence | That instance not created |
| REC-010 | Edit single instance | Edit one upcoming transaction | Only that instance changed |

### 6.3 Integration
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| REC-011 | Count in stats | Have recurring transactions | Included in dashboard totals |
| REC-012 | Future month view | View next month | Recurring transactions visible |

---

## 7. File Upload (CSV Import)

### 7.1 Upload Valid CSV
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| CSV-001 | Upload valid CSV | 1. Click Upload<br>2. Select valid CSV<br>3. Map columns<br>4. Import | Transactions imported |
| CSV-002 | Correct column mapping | Map: Date→date, Amount→amount, etc. | Data mapped correctly |
| CSV-003 | Auto-detect columns | Upload CSV with headers | Columns auto-detected |
| CSV-004 | Preview before import | Upload CSV | Preview of data shown |
| CSV-005 | Select/deselect rows | Uncheck some rows in preview | Only selected rows imported |

### 7.2 CSV Validation
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| CSV-006 | Invalid date format | CSV with dates like "not-a-date" | Error: "Invalid date format" |
| CSV-007 | Invalid amount | CSV with text in amount column | Error: "Invalid amount" |
| CSV-008 | Missing required columns | CSV without date column | Error: "Required column missing" |
| CSV-009 | Empty CSV | Upload empty file | Error: "File is empty" |
| CSV-010 | Wrong file type | Upload .xlsx or .pdf | Error: "Only CSV files allowed" |
| CSV-011 | Large CSV | Upload 10,000 row CSV | Progress indicator, successful import |
| CSV-012 | Duplicate detection | CSV with same transactions | Warning about duplicates |

### 7.3 Bank Format Support
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| CSV-013 | Chase format | Upload Chase CSV | Auto-detected, imported |
| CSV-014 | Bank of America | Upload BofA CSV | Auto-detected, imported |
| CSV-015 | Wells Fargo | Upload Wells Fargo CSV | Auto-detected, imported |
| CSV-016 | Custom format | Upload custom format | Manual column mapping works |

---

## 8. RLS & Security

### 8.1 Row Level Security
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| RLS-001 | User A can't see User B | Login as User A | Only User A's data visible |
| RLS-002 | Direct API access | Try to query Supabase directly without JWT | 401 Unauthorized |
| RLS-003 | Modify other user's data | Try to update another user's transaction | 403 Forbidden |
| RLS-004 | Delete other user's data | Try to delete another user's transaction | 403 Forbidden |

### 8.2 Data Isolation
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| RLS-005 | Transaction isolation | User A has 10 txns, User B has 5 | Each sees only their count |
| RLS-006 | Balance isolation | User A balance doesn't appear for User B | Separate balances |
| RLS-007 | Category isolation | User A's custom categories | Not visible to User B |

---

## 9. UI/UX

### 9.1 Responsive Design
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| UI-001 | Desktop view | View on 1920x1080 | Layout optimized for desktop |
| UI-002 | Tablet view | View on iPad (768px) | Layout adjusts to tablet |
| UI-003 | Mobile view | View on iPhone (375px) | Mobile layout, stacked cards |
| UI-004 | Sidebar collapse | Click hamburger menu | Sidebar collapses/expands |

### 9.2 Loading States
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| UI-005 | Skeleton loading | Open dashboard | Skeleton placeholders shown |
| UI-006 | Button loading | Click save | Button shows spinner, disabled |
| UI-007 | Table loading | Open transactions page | Loading spinner in table |

### 9.3 Error Handling
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| UI-008 | Network error | Disconnect internet | "Connection lost" message |
| UI-009 | Server error | Server returns 500 | Friendly error message |
| UI-010 | Timeout | Slow network | "Request timeout" message |
| UI-011 | Form validation | Submit empty form | Field-level error messages |

### 9.4 Accessibility
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| UI-012 | Keyboard navigation | Use Tab key | Can navigate all elements |
| UI-013 | Screen reader | Enable screen reader | Labels read correctly |
| UI-014 | Color contrast | Check text colors | WCAG AA compliant |
| UI-015 | Focus indicators | Tab through elements | Visible focus rings |

---

## 10. Performance & Edge Cases

### 10.1 Performance
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| PERF-001 | Large dataset | 10,000 transactions | Page loads < 3 seconds |
| PERF-002 | Chart rendering | 1000 data points | Chart renders < 2 seconds |
| PERF-003 | Filter performance | Filter 10,000 transactions | Results < 1 second |
| PERF-004 | Pagination | Navigate pages | < 500ms per page |

### 10.2 Edge Cases
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| EDGE-001 | Very long name | Name: 500 characters | Handled gracefully |
| EDGE-002 | Unicode emojis | Name: "🎉 Party 💰" | Saved correctly |
| EDGE-003 | Decimal precision | Amount: $100.999 | Rounded to $101.00 |
| EDGE-004 | Leap year date | Feb 29, 2024 | Accepted correctly |
| EDGE-005 | Year 2038+ | Date: Jan 1, 2050 | Accepted correctly |
| EDGE-006 | Concurrent edits | Edit same transaction in 2 tabs | Last write wins or conflict error |
| EDGE-007 | Rapid clicks | Click save 5 times quickly | Only 1 request sent |
| EDGE-008 | Browser back | Navigate away, click back | State preserved |

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Fresh test database
- [ ] Test user accounts created (User A, User B)
- [ ] Sample data loaded
- [ ] Browser DevTools open (Network tab)

### During Testing
- [ ] Test both positive and negative cases
- [ ] Check browser console for errors
- [ ] Verify network requests
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile device

### Post-Test
- [ ] Document any bugs found
- [ ] Screenshot UI issues
- [ ] Record performance metrics
- [ ] Update test cases based on findings

---

## Automation Opportunities

### High Priority (Critical Path)
1. AUTH-001 to AUTH-006 (Login/Signup)
2. TXN-001 to TXN-004 (Create Transaction)
3. DASH-001 to DASH-003 (Dashboard KPIs)
4. RLS-001 to RLS-003 (Security)

### Medium Priority (Common Flows)
1. TXN-017 to TXN-023 (Edit/Delete)
2. TXN-024 to TXN-032 (Filters)
3. BAL-001 to BAL-008 (Balance Management)
4. CSV-001 to CSV-005 (CSV Import)

### Low Priority (Edge Cases)
1. EDGE-001 to EDGE-008 (Edge cases)
2. UI-012 to UI-015 (Accessibility)
3. PERF-001 to PERF-004 (Performance)

---

*Last Updated: 2026-02-19*
*Total Test Cases: 119*
