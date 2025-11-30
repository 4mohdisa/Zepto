# Zepto Color Theme (Stripe-Inspired)

A single theme. No dark/light toggle.
A soft dark modern interface with blue-purple accents, clean neutrals, and vibrant highlight colors.

---

## 1. Core Colors

### Background

- **Primary Background:** `#0F1117`
  - Smooth dark charcoal with a soft blue tint
  - Very professional, matches Stripe and linear style

- **Card Background:** `#1A1D24`
  - Slightly lifted from the background
  - Good for panels and graphs

- **Elevated Surface:** `#23272F`
  - Use for menus, popovers, modals, sidebars

---

## 2. Text Colors

- **Primary Text:** `#FFFFFF`
- **Secondary Text:** `#9BA1A6`
- **Muted Text:** `#6B7075`

Stripe uses similar soft greys.

---

## 3. Brand Accent Colors (Stripe Vibe)

These will be the primary colors of Zepto.

### Primary Accent

- **Zepto Blue:** `#4C7EF3`
  - (Close to Stripe's signature blue but a bit softer)

### Secondary Accent

- **Indigo Glow:** `#6D4CFF`
  - (Purple-blue gradient option)

### Optional Gradient

Use for hero section, buttons, highlights:

```css
linear-gradient(135deg, #4C7EF3 0%, #6D4CFF 100%)
```

Modern, clean, premium.

---

## 4. Semantic Colors (Finance Needs)

- **Success (Income):** `#2ECC71` (Stripe uses this too)
- **Warning (Upcoming Bills):** `#F5A623`
- **Destructive (Expenses, Errors):** `#E74C3C`

These colors work great on dark backgrounds and look good on charts.

---

## 5. Border and Divider Colors

- **Border:** `#2D3138`
- **Hover Surface:** `#1F2229`
- **Focus Ring:** `#4C7EF3` (primary accent)

---

## 6. Charts Palette (Professional, Stripe-style)

Use these for bar, line, pie charts. They look amazing on dark UI.

- `#4C7EF3` – Blue
- `#6D4CFF` – Indigo
- `#22B8CF` – Aqua
- `#F5A623` – Yellow
- `#2ECC71` – Green
- `#E74C3C` – Red

Charts will look clean and readable.

---

## 7. Components Usage

### Buttons

**Primary Button**
- Background: gradient (`#4C7EF3` → `#6D4CFF`)
- Text: `#FFFFFF`

**Secondary Button**
- Background: `#23272F`
- Border: `#2D3138`
- Text: `#FFFFFF`

### Inputs & Tables

- Background: `#1A1D24`
- Border: `#2D3138`
- Text: `#FFFFFF`
- Placeholder: `#6B7075`

### Sidebar

- Background: `#0F1117`
- Active Item: use the gradient border on the left or background: `#1A1D24`

---

## 8. Full Final Palette (Minimal List)

| Purpose          | Hex       |
| ---------------- | --------- |
| Background       | `#0F1117` |
| Card             | `#1A1D24` |
| Surface          | `#23272F` |
| Text Primary     | `#FFFFFF` |
| Text Secondary   | `#9BA1A6` |
| Text Muted       | `#6B7075` |
| Primary Accent   | `#4C7EF3` |
| Secondary Accent | `#6D4CFF` |
| Success          | `#2ECC71` |
| Warning          | `#F5A623` |
| Error            | `#E74C3C` |
| Border           | `#2D3138` |
| Hover Surface    | `#1F2229` |

---

## 9. Font

- ✔ **Title Font:** Inter (Bold or SemiBold)
- ✔ **Body Font:** Inter (Regular / Medium)

### Embed code in the `<head>` of your HTML

```html
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
</style>
```

### Inter: CSS class for a variable style

```css
// <weight>: Use a value from 100 to 900
// <uniquifier>: Use a unique and descriptive class name

.inter-<uniquifier> {
  font-family: "Inter", sans-serif;
  font-optical-sizing: auto;
  font-weight: <weight>;
  font-style: normal;
}
```