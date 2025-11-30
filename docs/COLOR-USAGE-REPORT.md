# Zepto Color Usage Report

Generated: November 29, 2025

## Overview

This report analyzes the color usage across the Zepto project, identifying theme colors, hardcoded colors, and providing recommendations for consistency.

---

## 1. Theme Color System

### CSS Variables (globals.css)

The project uses a comprehensive HSL-based CSS variable system for theming:

#### Light Mode (`:root`)

| Variable | HSL Value | Purpose |
|----------|-----------|---------|
| `--background` | `0 0% 100%` | Page background (white) |
| `--foreground` | `222.2 84% 4.9%` | Primary text (dark blue-gray) |
| `--card` | `0 0% 100%` | Card background (white) |
| `--card-foreground` | `222.2 84% 4.9%` | Card text |
| `--popover` | `0 0% 100%` | Popover background |
| `--popover-foreground` | `222.2 84% 4.9%` | Popover text |
| `--primary` | `221.2 83.2% 53.3%` | Primary brand color (blue) |
| `--primary-foreground` | `210 40% 98%` | Text on primary |
| `--secondary` | `210 40% 96.1%` | Secondary background (light gray-blue) |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | Secondary text |
| `--muted` | `210 40% 96.1%` | Muted background |
| `--muted-foreground` | `215.4 16.3% 44%` | Muted text (gray) |
| `--accent` | `210 40% 96.1%` | Accent background |
| `--accent-foreground` | `222.2 47.4% 11.2%` | Accent text |
| `--destructive` | `0 72% 51%` | Destructive/error (red) |
| `--destructive-foreground` | `210 40% 98%` | Text on destructive |
| `--border` | `214.3 31.8% 91.4%` | Border color |
| `--input` | `214.3 31.8% 91.4%` | Input border |
| `--ring` | `221.2 83.2% 53.3%` | Focus ring (blue) |

#### Chart Colors (Light Mode)

| Variable | HSL Value | Approximate Color |
|----------|-----------|-------------------|
| `--chart-1` | `221.2 83.2% 53.3%` | Blue |
| `--chart-2` | `212 95% 68%` | Light Blue |
| `--chart-3` | `216 92% 60%` | Sky Blue |
| `--chart-4` | `210 98% 78%` | Pale Blue |
| `--chart-5` | `212 97% 87%` | Very Light Blue |

#### Dark Mode (`.dark`)

| Variable | HSL Value | Purpose |
|----------|-----------|---------|
| `--background` | `0 0% 4%` | Page background (near black) |
| `--foreground` | `0 0% 98%` | Primary text (white) |
| `--card` | `0 0% 9.5%` | Card background (dark gray) |
| `--muted` | `0 0% 15%` | Muted background |
| `--muted-foreground` | `0 0% 53.3%` | Muted text (gray) |
| `--border` | `0 0% 15%` | Border color |
| `--chart-1` to `--chart-6` | `0 0% 53.3%` | All gray (⚠️ Issue) |

#### Sidebar Colors

| Variable | Light Mode | Dark Mode |
|----------|------------|-----------|
| `--sidebar-background` | `0 0% 98%` | `0 0% 9.5%` |
| `--sidebar-foreground` | `240 5.3% 26.1%` | `0 0% 98%` |
| `--sidebar-primary` | `240 5.9% 10%` | `0 0% 4%` |
| `--sidebar-accent` | `240 4.8% 95.9%` | `0 0% 15%` |
| `--sidebar-border` | `220 13% 91%` | `0 0% 15%` |
| `--sidebar-ring` | `217.2 91.2% 59.8%` | `221.2 83.2% 53.3%` |

---

## 2. Hardcoded Colors (Non-Theme)

### ⚠️ Files Using Hardcoded Tailwind Colors

These files use direct Tailwind color classes instead of theme variables:

#### Auth Pages

| File | Colors Used | Context |
|------|-------------|---------|
| `app/sign-in/page.tsx` | `bg-gray-100`, `text-gray-500` | Page background, icon color |
| `app/sign-up/page.tsx` | `bg-gray-100`, `text-gray-500` | Page background, icon color |
| `app/reset-password/page.tsx` | `bg-gray-100`, `text-gray-500` | Page background, icon color |
| `app/forgot-password/page.tsx` | `bg-gray-100`, `bg-green-50`, `text-green-800` | Page background, success message |
| `app/auth-error/page.tsx` | `text-blue-500` | Link color |

#### Dashboard Components

| File | Colors Used | Context |
|------|-------------|---------|
| `components/app/dashboard/metrics-cards.tsx` | `text-green-400`, `bg-green-500/10`, `text-red-400`, `bg-red-500/10`, `text-blue-400`, `bg-blue-500/10`, `text-purple-400`, `bg-purple-500/10` | Income/expense/balance indicators |
| `app/(dashboard)/dashboard/_components/dashboard-header.tsx` | `bg-blue-600`, `hover:bg-blue-700` | Add transaction button |

#### Transaction Components

| File | Colors Used | Context |
|------|-------------|---------|
| `components/app/transactions/_columns/transaction-columns.tsx` | `bg-red-500/10`, `text-red-400`, `border-red-500/20`, `bg-green-500/10`, `text-green-400`, `border-green-500/20` | Expense/income badges |
| `components/app/transactions/upcoming-table.tsx` | `bg-green-100`, `text-green-800` | Income badge |

#### UI Components

| File | Colors Used | Context |
|------|-------------|---------|
| `components/ui/loading-skeleton.tsx` | `bg-gray-300`, `bg-gray-700`, `text-gray-400` | Skeleton loading states |
| `components/ui/error-boundary.tsx` | `bg-red-100`, `text-red-600`, `bg-gray-50`, `text-gray-600` | Error display |

---

## 3. Theme Color Usage (Correct)

### Files Using Theme Variables Correctly

| File | Theme Colors Used |
|------|-------------------|
| `components/ui/button.tsx` | `bg-primary`, `bg-secondary`, `bg-destructive`, `text-primary-foreground` |
| `components/ui/card.tsx` | `bg-card`, `text-card-foreground` |
| `components/ui/badge.tsx` | `bg-primary`, `bg-secondary`, `bg-destructive`, `bg-muted` |
| `components/ui/input.tsx` | `border-input`, `text-foreground`, `text-muted-foreground` |
| `components/ui/dialog.tsx` | `bg-background`, `text-foreground` |
| `components/ui/dropdown-menu.tsx` | `bg-popover`, `text-popover-foreground`, `bg-accent` |
| `components/ui/table.tsx` | `bg-muted`, `border-border` |
| `components/ui/calendar.tsx` | `bg-primary`, `text-primary-foreground`, `bg-accent` |
| `components/app/transactions/table.tsx` | `bg-card`, `text-muted-foreground`, `bg-muted` |
| `components/app/charts/pie-donut-chart.tsx` | `hsl(var(--chart-1))` through `hsl(var(--chart-6))` |
| `components/app/charts/bar-chart-multiple.tsx` | `hsl(var(--muted-foreground))` |
| `components/app/charts/line-chart.tsx` | `hsl(var(--chart-1))` |

---

## 4. Issues & Recommendations

### 🔴 Critical Issues

1. **Dark Mode Chart Colors Are All Gray**
   - Location: `app/globals.css` (lines 91-96)
   - Issue: All chart colors (`--chart-1` to `--chart-6`) are set to `0 0% 53.3%` (gray)
   - Impact: Charts lose visual distinction in dark mode
   - **Recommendation**: Define distinct colors for dark mode charts

2. **Inconsistent Auth Page Backgrounds**
   - Files: `sign-in`, `sign-up`, `reset-password`, `forgot-password`
   - Issue: Using `bg-gray-100` instead of `bg-background` or `bg-muted`
   - Impact: Won't adapt to dark mode properly
   - **Recommendation**: Replace with `bg-muted` or `bg-background`

### 🟡 Medium Issues

3. **Hardcoded Semantic Colors**
   - Files: `metrics-cards.tsx`, `transaction-columns.tsx`
   - Issue: Using `text-green-400`, `text-red-400` for income/expense
   - Impact: Not customizable via theme
   - **Recommendation**: Create semantic CSS variables:
     ```css
     --success: 142 76% 36%;
     --success-foreground: 0 0% 100%;
     --warning: 38 92% 50%;
     --warning-foreground: 0 0% 100%;
     ```

4. **Dashboard Header Button**
   - File: `dashboard-header.tsx`
   - Issue: Using `bg-blue-600` instead of `bg-primary`
   - **Recommendation**: Replace with `bg-primary hover:bg-primary/90`

### 🟢 Minor Issues

5. **Loading Skeleton Colors**
   - File: `loading-skeleton.tsx`
   - Issue: Using `bg-gray-300 dark:bg-gray-700`
   - **Recommendation**: Replace with `bg-muted`

6. **Error Boundary Colors**
   - File: `error-boundary.tsx`
   - Issue: Using `bg-red-100`, `text-red-600`
   - **Recommendation**: Use `bg-destructive/10`, `text-destructive`

---

## 5. Proposed Semantic Color Additions

Add these to `globals.css` for better semantic color support:

```css
:root {
  /* Existing variables... */
  
  /* Semantic colors */
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
  --info: 199 89% 48%;
  --info-foreground: 0 0% 100%;
}

.dark {
  /* Existing variables... */
  
  /* Semantic colors */
  --success: 142 71% 45%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
  --info: 199 89% 48%;
  --info-foreground: 0 0% 100%;
  
  /* Fix chart colors */
  --chart-1: 221.2 83.2% 53.3%;
  --chart-2: 160 84% 39%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
  --chart-6: 200 95% 50%;
}
```

---

## 6. Summary Statistics

| Category | Count |
|----------|-------|
| Total theme CSS variables | 34 |
| Files using theme colors correctly | 25+ |
| Files with hardcoded colors | 11 |
| Critical issues | 2 |
| Medium issues | 2 |
| Minor issues | 2 |

---

## 7. Action Items

### Priority 1 (High)
- [ ] Fix dark mode chart colors in `globals.css`
- [ ] Replace `bg-gray-100` with `bg-muted` in auth pages

### Priority 2 (Medium)
- [ ] Add semantic color variables (`--success`, `--warning`, `--info`)
- [ ] Update `metrics-cards.tsx` to use semantic colors
- [ ] Update `transaction-columns.tsx` to use semantic colors
- [ ] Fix dashboard header button color

### Priority 3 (Low)
- [ ] Update `loading-skeleton.tsx` to use theme colors
- [ ] Update `error-boundary.tsx` to use theme colors
- [ ] Update `upcoming-table.tsx` badge colors

---

*Report generated by analyzing all `.tsx` and `.ts` files in the project.*
