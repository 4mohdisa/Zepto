# 🔐 Clerk JWT Template Setup for Supabase Integration

## 📋 Overview

This guide will walk you through configuring the Clerk JWT template that enables your Supabase database to recognize authenticated users. **This is required for categories to load and RLS policies to work.**

---

## ⚠️ Why This is Required

Your Supabase database uses **Row Level Security (RLS)** policies that check for `role: "authenticated"` in the JWT token. Without this JWT template, Supabase will deny access to:
- ❌ Categories table
- ❌ Transactions table
- ❌ Recurring transactions table
- ❌ Any data protected by RLS policies

**Symptoms of missing JWT template:**
- Category dropdown is empty
- "Category 0 not found" errors
- Console errors: 401 Unauthorized or 403 Forbidden
- Data not loading from Supabase

---

## 🚀 Step-by-Step Setup

### **Step 1: Access Clerk Dashboard**

1. Go to: https://dashboard.clerk.com
2. Sign in to your account
3. Select your **Zepto** application from the list

---

### **Step 2: Navigate to JWT Templates**

1. In the left sidebar, click **Configure**
2. Click **Sessions**
3. Scroll down to find **JWT Templates** section
4. Click **+ New template** button

![Clerk JWT Templates Location](https://i.imgur.com/placeholder.png)

---

### **Step 3: Select Supabase Template**

You have two options:

#### **Option A: Use Pre-built Supabase Template (Recommended)**
1. In the template selection screen, find and click **Supabase**
2. This will auto-populate with recommended settings
3. Clerk will automatically include the `role: "authenticated"` claim

#### **Option B: Create Custom Template**
1. Click **Blank template**
2. You'll need to manually add all claims (instructions below)

---

### **Step 4: Configure Template Settings**

#### **Template Name:**
```
supabase
```
**IMPORTANT**: The name MUST be exactly `supabase` (lowercase) because your code references it:
```typescript
await getToken({ template: 'supabase' })
```

---

#### **Claims Configuration:**

Click on the **Claims** tab and add the following JSON:

```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated"
}
```

**Explanation of each claim:**

| Claim | Value | Purpose |
|-------|-------|---------|
| `sub` | `{{user.id}}` | Clerk user ID (subject) - used for RLS user identification |
| `email` | `{{user.primary_email_address}}` | User's email address |
| `role` | `"authenticated"` | **CRITICAL** - Tells Supabase this is an authenticated user |

---

#### **Token Lifetime:**

Leave as default or set:
- **Lifetime**: 3600 seconds (1 hour)
- **Clock skew**: 5 seconds (default)

---

### **Step 5: Save the Template**

1. Review your configuration:
   - ✅ Name: `supabase`
   - ✅ Claims include `role: "authenticated"`
2. Click **Save** button (bottom right)
3. You should see a success message

---

### **Step 6: Verify JWT Template is Active**

1. Go to **Configure** → **Sessions** → **JWT Templates**
2. Confirm you see your `supabase` template in the list
3. Check that it shows as **Active**

---

## 🧪 Testing Your JWT Template

### **Method 1: Browser DevTools**

1. **Open your app** in the browser
2. **Open DevTools** (F12 or Ctrl+Shift+I)
3. Go to **Network** tab
4. **Navigate to** Transactions page
5. **Look for Supabase requests** (to *.supabase.co)
6. **Click on a request** → **Headers** tab
7. **Find** `Authorization: Bearer <long-token>`
8. **Copy the token** (everything after "Bearer ")

### **Method 2: Decode the Token**

1. Go to: https://jwt.io
2. Paste your token in the **Encoded** section
3. Look at the **Decoded** payload (right side)
4. **Verify it contains**:

```json
{
  "sub": "user_abc123xyz",
  "email": "your-email@gmail.com",
  "role": "authenticated",
  "iat": 1234567890,
  "exp": 1234567890,
  ...
}
```

✅ **Success**: If you see `"role": "authenticated"`, your JWT template is working!

❌ **Problem**: If `role` is missing, go back and verify your template configuration.

---

### **Method 3: Test Category Loading**

1. **Restart your dev server**:
```bash
# Stop current server (Ctrl+C)
rm -rf .next
npm run dev
```

2. **Clear browser cache**:
   - Chrome: `Ctrl+Shift+Delete` → Clear cached images and files
   - Or use **Incognito/Private mode**

3. **Go to Transactions page**
4. **Click "Add Transaction"**
5. **Check Category dropdown**:
   - ✅ **Working**: Shows 14 default categories
   - ❌ **Not Working**: Empty or shows error

---

## 🐛 Troubleshooting

### **Problem 1: Token doesn't include "role: authenticated"**

**Solution:**
1. Go back to Clerk Dashboard → JWT Templates
2. Edit your `supabase` template
3. Verify Claims JSON includes: `"role": "authenticated"`
4. Save and test again

---

### **Problem 2: Categories still not loading**

**Check these in order:**

1. **Template name is correct:**
   - Must be exactly `supabase` (lowercase)

2. **Template is saved and active:**
   - Clerk Dashboard → JWT Templates → See `supabase` template

3. **Browser cache cleared:**
   ```bash
   # Clear cache or use incognito mode
   ```

4. **Supabase has default categories:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT COUNT(*) FROM categories WHERE is_default = TRUE;
   -- Should return 14
   ```

5. **RLS policies exist:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'categories';
   -- Should show "Anyone can view default categories" policy
   ```

---

### **Problem 3: "Token verification failed" errors**

**Possible causes:**
- JWT template not saved properly
- Clerk and Supabase project IDs don't match
- Token expired (refresh the page)

**Solution:**
1. Sign out completely from your app
2. Sign back in
3. Try again

---

## 📚 Additional Configuration (Optional)

### **Add Custom Claims (Optional)**

You can add more claims if needed:

```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated",
  "name": "{{user.first_name}} {{user.last_name}}",
  "username": "{{user.username}}",
  "created_at": "{{user.created_at}}"
}
```

### **Restrict Token Audience (Optional)**

For extra security, you can set the audience:

1. In JWT template editor
2. Find **Audience** field
3. Add: `https://your-supabase-project.supabase.co`

---

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] JWT template named `supabase` exists in Clerk
- [ ] Template includes `"role": "authenticated"` claim
- [ ] Template is saved and active
- [ ] Token decoded at jwt.io shows the correct role
- [ ] Category dropdown shows 14 default categories
- [ ] Can create transactions without "Category 0" error
- [ ] Browser console shows no 401/403 errors
- [ ] Dev server restarted and browser cache cleared

---

## 🎯 Expected Result

After completing this setup:

✅ **JWT Token includes `role: "authenticated"`**
✅ **Supabase RLS policies recognize your user**
✅ **Categories load in the dropdown**
✅ **Transactions can be created**
✅ **All data loads correctly**

---

## 🆘 Still Need Help?

### **Get Your Current Token:**
```javascript
// In browser console (DevTools)
await window.$clerk.session.getToken({ template: 'supabase' })
```

### **Check Clerk Logs:**
1. Clerk Dashboard → Logs
2. Look for JWT token generation logs
3. Check for any errors

### **Check Supabase Logs:**
1. Supabase Dashboard → Logs
2. Look for authentication errors
3. Check RLS policy denials

---

## 📝 Quick Reference

**Template Name:** `supabase`

**Required Claim:**
```json
"role": "authenticated"
```

**Full Template:**
```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated"
}
```

**Code Reference:**
```typescript
// This line in your code requires the template to be named "supabase"
const token = await getToken({ template: 'supabase' })
```

---

## 🎉 Success!

Once you see categories loading in the dropdown, your JWT template is correctly configured! You can now:

- ✅ Create transactions
- ✅ View categories
- ✅ Access all Supabase data
- ✅ RLS policies working correctly

---

**Last Updated:** December 2025
**For:** Zepto Financial Management App
**Auth:** Clerk + Supabase Integration
