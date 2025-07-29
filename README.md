# Ledgerly - Personal Finance Management

![Ledgerly Cover Image](https://tinyurl.com/2yz7aqtc)

![Ledgerly Logo](public/logo.svg)

Ledgerly is a comprehensive financial application that helps users manage their finances by tracking income, expenses, and bank balances in one convenient place. Built with modern web technologies like Next.js, React, TypeScript, and Tailwind CSS, it provides a robust and user-friendly experience for personal finance management.

## Key Features

### Transaction Management
Users can add individual transactions with details like amount, category, and date to keep track of their spending and income. Each transaction can be categorized, edited, or deleted as needed.

### Recurring Transactions
The app automatically generates transactions based on customized schedules for regular expenses or income like rent, subscriptions, or salary payments. This feature helps forecast future financial status.

### Monthly Balance Tracking
Users can record their bank balance at the beginning of each month to monitor financial progress and reconcile accounts, providing insights into saving patterns and spending habits.

### Upcoming Transactions Prediction
The application predicts future transactions based on recurring payment patterns, helping users plan ahead for expenses and income.

### Responsive UI
Featuring a clean, intuitive interface built with Tailwind CSS and Radix UI components that works across desktop and mobile devices.

## Tech Stack

- **Frontend Framework**: React 18 with Next.js 14
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS with Shadcn/UI components
- **State Management**: Redux Toolkit with React Redux
- **Form Management**: React Hook Form with Zod validation
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Data Visualization**: Recharts
- **Table Management**: TanStack Table
- **Date Handling**: date-fns
- **AI Capabilities**: LlamaIndex and OpenAI integrations

## Getting Started

First, clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/ledgerly.git
cd ledgerly
npm install
```

Set up your environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
├── app/                  # Next.js app directory structure
│   ├── (auth)/           # Authentication related pages
│   ├── (dashboard)/      # Main application pages
│   ├── api/              # API endpoints
│   └── types/            # TypeScript type definitions
├── components/           # React components
│   ├── app/              # Application-specific components
│   │   ├── tables/       # Table components
│   │   └── transaction-dialogs/ # Transaction dialog components
│   └── ui/               # Reusable UI components
├── context/              # React context providers
├── hooks/                # Custom React hooks
├── public/               # Static assets
├── utils/                # Utility functions
└── styles/               # Global CSS styles
```

## Development Workflow

### Available Scripts

- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Deployment

Ledgerly can be deployed on any platform that supports Next.js applications. For the simplest setup, we recommend using Vercel:

1. Push your code to a GitHub repository
2. Import the project to [Vercel](https://vercel.com/import)
3. Set the required environment variables
4. Deploy

## Future Enhancements

- **Document Transaction Extraction**: Extract transaction details directly from financial documents
- **Budget Planning**: Set and track budgets for different expense categories
- **Financial Insights**: AI-powered analysis of spending patterns
- **Investment Tracking**: Monitor investment portfolio performance

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
