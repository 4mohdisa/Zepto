# Zepto - Personal Finance Management

![Zepto Logo](public/Zepto.svg)

Zepto is a comprehensive financial application that helps users manage their finances by tracking income, expenses, and bank balances in one convenient place. Built with modern web technologies like Next.js 15, React 18, TypeScript, and Tailwind CSS, it provides a robust and user-friendly experience for personal finance management.

---

## Key Features

### Transaction Management
Add individual transactions with details like amount, category, date, and account type. Each transaction can be categorized, edited, or deleted as needed.

### Recurring Transactions
Set up recurring transactions with customizable frequencies (Daily, Weekly, Bi-Weekly, Monthly, Quarterly, Annually, etc.) for regular expenses or income like rent, subscriptions, or salary payments.

### Upcoming Transactions Prediction
The application automatically predicts future transactions based on recurring payment patterns, helping users plan ahead for expenses and income. Predictions are calculated in-memory for optimal performance.

### Dashboard Analytics
View financial metrics at a glance including total income, expenses, net balance, and top spending categories with interactive charts.

### Responsive UI
A clean, modern dark interface built with Tailwind CSS and Radix UI components that works seamlessly across desktop and mobile devices.

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | Next.js | 15.0.3 |
| **UI Library** | React | 18.3.1 |
| **Language** | TypeScript | 5.7.2 |
| **Styling** | Tailwind CSS | 3.4.15 |
| **UI Components** | Radix UI / Shadcn | v1.x-2.x |
| **Form Management** | React Hook Form | 7.54.0 |
| **Validation** | Zod | 3.23.8 |
| **Database** | Supabase (PostgreSQL) | 2.47.10 |
| **Authentication** | Supabase Auth | SSR 0.5.2 |
| **Data Visualization** | Recharts | 2.14.1 |
| **Table Management** | TanStack Table | 8.20.5 |
| **Date Utilities** | date-fns | 4.1.0 |
| **Icons** | Lucide React | 0.468.0 |
| **Notifications** | Sonner | 1.7.0 |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/zepto.git
cd zepto
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Add your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
zepto/
├── app/                      # Next.js App Router
│   ├── (dashboard)/          # Protected dashboard pages
│   │   ├── dashboard/        # Main dashboard
│   │   ├── transactions/     # Transactions page
│   │   └── recurring-transactions/  # Recurring transactions
│   ├── sign-in/              # Authentication pages
│   ├── sign-up/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── services/             # Business logic services
│   └── types/                # TypeScript type definitions
├── components/
│   ├── app/                  # Application components
│   │   ├── charts/           # Chart components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── dialogs/          # Dialog components
│   │   ├── layout/           # Layout (sidebar, header)
│   │   ├── shared/           # Shared form fields
│   │   └── transactions/     # Transaction tables & columns
│   └── ui/                   # Shadcn UI components
├── hooks/                    # Custom React hooks
├── utils/                    # Utility functions
│   ├── supabase/             # Supabase client
│   ├── frequency-utils.ts    # Date/frequency calculations
│   └── predict-transactions.ts
└── public/                   # Static assets
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Database Schema

Zepto uses 4 core tables:

- **profiles** - User accounts
- **categories** - Transaction categories
- **transactions** - All actual transactions
- **recurring_transactions** - Templates for recurring transactions

---

## Deployment

Zepto can be deployed on any platform that supports Next.js applications.

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project to [Vercel](https://vercel.com/import)
3. Set the required environment variables
4. Deploy

---

## Future Enhancements

- [ ] **Document Transaction Extraction** - Extract transaction details from financial documents
- [ ] **Budget Planning** - Set and track budgets for different expense categories
- [ ] **Financial Insights** - AI-powered analysis of spending patterns
- [ ] **Export/Import** - Export transactions to CSV/PDF

---

## License

MIT

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
