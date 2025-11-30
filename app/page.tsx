import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LandingNavbar } from '@/components/app/landing/navbar'
import { LandingFooter } from '@/components/app/landing/footer'
import { PricingSection } from '@/components/app/landing/pricing-section'
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Zap, 
  PieChart, 
  Calendar,
  ArrowRight,
  Repeat,
  DollarSign,
  LineChart,
  Sparkles,
  CreditCard,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Zepto - Personal Finance Manager | Track Expenses & Budget',
  description: 'Take control of your finances with Zepto. Track expenses, analyze spending patterns, manage recurring transactions, and make smarter financial decisions. Free personal finance manager.',
  keywords: 'personal finance, expense tracker, budget app, financial management, money tracker, spending analysis, recurring transactions, budget planner',
  authors: [{ name: 'Zepto' }],
  openGraph: {
    title: 'Zepto - Personal Finance Manager',
    description: 'Track expenses, analyze spending, and take control of your financial future with Zepto.',
    type: 'website',
    url: 'https://zepto.app',
    siteName: 'Zepto',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zepto - Personal Finance Manager',
    description: 'Track expenses, analyze spending, and take control of your financial future.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white pt-32 pb-24">
        {/* Gradient Mesh Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-white/80 px-4 py-1.5 text-sm text-gray-700 shadow-sm backdrop-blur-sm mb-8">
              <Sparkles className="mr-2 h-4 w-4 text-[#635BFF]" />
              Financial infrastructure for everyone
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 mb-8">
              Financial freedom,{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#635BFF] to-[#00D4FF]">
                simplified
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Zepto is the all-in-one platform to track, analyze, and optimize your personal finances. 
              Built for individuals who want complete control.
            </p>
            
            <div className="flex justify-center items-center mb-16">
              <Link href="/sign-up">
                <Button size="lg" className="bg-[#635BFF] hover:bg-[#5851EA] text-white text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                  Start now →
                </Button>
              </Link>
            </div>

            {/* Floating Dashboard Preview */}
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#635BFF]/20 to-[#00D4FF]/20 rounded-3xl blur-3xl" />
              <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                {/* Mock Browser Chrome */}
                <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 bg-gray-50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-500">
                      zepto.app/dashboard
                    </div>
                  </div>
                </div>
                
                {/* Mock Dashboard */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-6 border-gray-200 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Total Balance</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">$24,532</p>
                      <p className="text-xs text-green-600 mt-1">+12.5% this month</p>
                    </Card>
                    <Card className="p-6 border-gray-200 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Income</span>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">$8,420</p>
                      <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                    </Card>
                    <Card className="p-6 border-gray-200 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Expenses</span>
                        <CreditCard className="h-4 w-4 text-orange-500" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">$3,280</p>
                      <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                    </Card>
                  </div>
                  
                  {/* Chart Placeholder */}
                  <Card className="p-6 border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Spending Overview</h3>
                      <LineChart className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="h-48 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-end justify-around px-4 pb-4">
                      <div className="w-12 bg-gradient-to-t from-[#635BFF] to-[#635BFF]/50 rounded-t" style={{height: '60%'}} />
                      <div className="w-12 bg-gradient-to-t from-[#635BFF] to-[#635BFF]/50 rounded-t" style={{height: '80%'}} />
                      <div className="w-12 bg-gradient-to-t from-[#635BFF] to-[#635BFF]/50 rounded-t" style={{height: '45%'}} />
                      <div className="w-12 bg-gradient-to-t from-[#635BFF] to-[#635BFF]/50 rounded-t" style={{height: '90%'}} />
                      <div className="w-12 bg-gradient-to-t from-[#635BFF] to-[#635BFF]/50 rounded-t" style={{height: '70%'}} />
                      <div className="w-12 bg-gradient-to-t from-[#635BFF] to-[#635BFF]/50 rounded-t" style={{height: '55%'}} />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Overview */}
      <section id="features" className="py-32 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Built for modern finance
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your money, all in one place.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Feature 1 */}
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-10">
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#635BFF] text-white mb-6">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Powerful analytics at your fingertips
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-lg">
                  Visualize your spending patterns with interactive charts. Make data-driven decisions with real-time insights.
                </p>
              </div>
              {/* Decorative chart */}
              <div className="absolute bottom-0 right-0 w-2/3 h-2/3 opacity-20">
                <div className="grid grid-cols-8 gap-2 h-full items-end p-8">
                  {[60, 80, 45, 90, 70, 55, 85, 65].map((height, i) => (
                    <div 
                      key={i} 
                      className="bg-[#635BFF] rounded-t-lg"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Small Features */}
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 hover:shadow-xl transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white mb-6">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Recurring transactions
              </h3>
              <p className="text-gray-600">
                Automatically track subscriptions and recurring bills.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 hover:shadow-xl transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-white mb-6">
                <PieChart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Category tracking
              </h3>
              <p className="text-gray-600">
                Organize expenses by category for better insights.
              </p>
            </div>

            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-10">
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Bank-level security
                </h3>
                <p className="text-lg text-gray-600 max-w-lg">
                  Your data is encrypted end-to-end with industry-leading security standards. We never sell your data.
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 hover:shadow-xl transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 text-white mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Lightning fast
              </h3>
              <p className="text-gray-600">
                Optimized for speed with instant syncing across devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Individual Feature Sections */}
      
      {/* Feature 1: Smart Analytics */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700 mb-6">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Visualize your spending with powerful analytics
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Get deep insights into your financial habits with interactive charts and graphs. Track income vs expenses, analyze spending by category, and monitor your net balance over time.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Interactive charts with daily, weekly, and monthly views</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Category breakdown with pie charts and bar graphs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Net balance tracking to monitor financial health</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
              <Card className="relative p-8 border-gray-200 bg-white shadow-xl">
                <div className="h-64 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-end justify-around px-6 pb-6">
                  {[65, 85, 55, 95, 75, 60, 90, 70].map((height, i) => (
                    <div 
                      key={i} 
                      className="w-8 bg-gradient-to-t from-[#635BFF] to-[#635BFF]/60 rounded-t-lg transition-all hover:opacity-75"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Recurring Transactions */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl blur-2xl" />
              <Card className="relative p-8 border-gray-200 bg-white shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Repeat className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Netflix</p>
                        <p className="text-sm text-gray-600">Monthly</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">$15.99</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Rent</p>
                        <p className="text-sm text-gray-600">Monthly</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">$1,200</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Gym Membership</p>
                        <p className="text-sm text-gray-600">Monthly</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">$49.99</p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm text-green-700 mb-6">
                <Repeat className="mr-2 h-4 w-4" />
                Automation
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Never miss a recurring transaction
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Automatically track and predict recurring bills, subscriptions, and income. Set up once and let Zepto handle the rest.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Automatic tracking of subscriptions and bills</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Predict upcoming transactions with smart forecasting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Set custom frequencies: daily, weekly, monthly, yearly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Category Management */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm text-orange-700 mb-6">
                <PieChart className="mr-2 h-4 w-4" />
                Organization
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Organize expenses by category
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                See exactly where your money goes with detailed category breakdowns. Create custom categories or use our predefined ones.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Detailed category breakdown with pie charts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Custom categories tailored to your needs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Bulk categorization for quick organization</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl blur-2xl" />
              <Card className="relative p-8 border-gray-200 bg-white shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <PieChart className="h-8 w-8 text-blue-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Food & Dining</p>
                    <p className="text-2xl font-bold text-gray-900">$680</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <PieChart className="h-8 w-8 text-purple-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Transportation</p>
                    <p className="text-2xl font-bold text-gray-900">$340</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <PieChart className="h-8 w-8 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Entertainment</p>
                    <p className="text-2xl font-bold text-gray-900">$220</p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <PieChart className="h-8 w-8 text-orange-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Shopping</p>
                    <p className="text-2xl font-bold text-gray-900">$450</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted by users worldwide
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands who are already managing their finances smarter
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            <div className="text-center">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#635BFF] to-blue-600 mb-2">
                10K+
              </div>
              <p className="text-gray-600 text-sm">Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
                $50M+
              </div>
              <p className="text-gray-600 text-sm">Tracked Monthly</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 mb-2">
                500K+
              </div>
              <p className="text-gray-600 text-sm">Transactions</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                99.9%
              </div>
              <p className="text-gray-600 text-sm">Uptime</p>
            </div>
          </div>

          {/* Testimonials - Infinite Scroll */}
          <div className="relative overflow-hidden">
            <div className="flex gap-6 animate-scroll">
              {/* First set */}
              <Card className="flex-shrink-0 w-96 p-6 bg-white border-gray-200">
                <p className="text-gray-700 mb-4 italic">
                  "Zepto has completely transformed how I manage my finances. The analytics are incredibly helpful!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    SK
                  </div>
                  <p className="font-semibold text-gray-900">~ Sarah Kim</p>
                </div>
              </Card>

              <Card className="flex-shrink-0 w-96 p-6 bg-white border-gray-200">
                <p className="text-gray-700 mb-4 italic">
                  "Finally, a finance app that's both powerful and easy to use. The recurring transaction feature is a game-changer."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                    MJ
                  </div>
                  <p className="font-semibold text-gray-900">~ Michael Johnson</p>
                </div>
              </Card>

              <Card className="flex-shrink-0 w-96 p-6 bg-white border-gray-200">
                <p className="text-gray-700 mb-4 italic">
                  "Love the clean interface and detailed charts. Zepto makes financial tracking actually enjoyable!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                    EP
                  </div>
                  <p className="font-semibold text-gray-900">~ Emma Patel</p>
                </div>
              </Card>

              <Card className="flex-shrink-0 w-96 p-6 bg-white border-gray-200">
                <p className="text-gray-700 mb-4 italic">
                  "Best investment tracking tool I've used. The insights help me make better financial decisions every day."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-semibold text-sm">
                    AC
                  </div>
                  <p className="font-semibold text-gray-900">~ Alex Chen</p>
                </div>
              </Card>

              <Card className="flex-shrink-0 w-96 p-6 bg-white border-gray-200">
                <p className="text-gray-700 mb-4 italic">
                  "The categorization and expense tracking features are exactly what I needed. Highly recommend!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    JD
                  </div>
                  <p className="font-semibold text-gray-900">~ Jessica Davis</p>
                </div>
              </Card>

              {/* Duplicate set for seamless loop */}
              <Card className="flex-shrink-0 w-96 p-6 bg-white border-gray-200">
                <p className="text-gray-700 mb-4 italic">
                  "Zepto has completely transformed how I manage my finances. The analytics are incredibly helpful!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    SK
                  </div>
                  <p className="font-semibold text-gray-900">~ Sarah Kim</p>
                </div>
              </Card>

              <Card className="flex-shrink-0 w-96 p-6 bg-white border-gray-200">
                <p className="text-gray-700 mb-4 italic">
                  "Finally, a finance app that's both powerful and easy to use. The recurring transaction feature is a game-changer."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                    MJ
                  </div>
                  <p className="font-semibold text-gray-900">~ Michael Johnson</p>
                </div>
              </Card>

              <Card className="flex-shrink-0 w-96 p-6 bg-white border-gray-200">
                <p className="text-gray-700 mb-4 italic">
                  "Love the clean interface and detailed charts. Zepto makes financial tracking actually enjoyable!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                    EP
                  </div>
                  <p className="font-semibold text-gray-900">~ Emma Patel</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700 mb-6">
              <Sparkles className="mr-2 h-4 w-4" />
              Coming Soon
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Manage finances on the go
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're actively working on native mobile apps for iOS and Android. Track your spending anywhere, anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Mobile App Features */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Transaction Entry</h3>
                  <p className="text-gray-600">Add transactions in seconds with our intuitive mobile interface</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Receipt Scanning</h3>
                  <p className="text-gray-600">Snap photos of receipts and let AI extract transaction details automatically</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Notifications</h3>
                  <p className="text-gray-600">Get reminders for upcoming bills and insights about your spending habits</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Offline Support</h3>
                  <p className="text-gray-600">Track transactions even without internet, syncs automatically when online</p>
                </div>
              </div>
            </div>

            {/* Mock Phone Display */}
            <div className="relative">
              <div className="relative mx-auto max-w-sm">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#635BFF]/20 to-blue-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-white rounded-[2.5rem] overflow-hidden">
                    {/* Phone notch */}
                    <div className="bg-gray-900 h-6 rounded-b-3xl mx-auto w-40"></div>
                    
                    {/* Phone content */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-sm text-gray-600">Total Balance</p>
                          <p className="text-3xl font-bold text-gray-900">$5,240</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#635BFF] to-blue-600"></div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <ArrowUpCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">Salary</p>
                              <p className="text-xs text-gray-500">Income</p>
                            </div>
                          </div>
                          <p className="font-semibold text-green-600">+$3,500</p>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                              <ArrowDownCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">Groceries</p>
                              <p className="text-xs text-gray-500">Expense</p>
                            </div>
                          </div>
                          <p className="font-semibold text-red-600">-$127</p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <ArrowDownCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">Netflix</p>
                              <p className="text-xs text-gray-500">Subscription</p>
                            </div>
                          </div>
                          <p className="font-semibold text-blue-600">-$15.99</p>
                        </div>
                      </div>

                      <div className="pt-4">
                        <div className="bg-gradient-to-r from-[#635BFF] to-blue-600 text-white rounded-xl p-4 text-center font-semibold">
                          Add Transaction
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App Store Badges Placeholder */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-6">Stay tuned for the launch announcement</p>
            <div className="flex justify-center gap-4">
              <div className="px-6 py-3 bg-gray-100 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Coming to</p>
                    <p className="text-sm font-semibold text-gray-700">App Store</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-gray-100 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Coming to</p>
                    <p className="text-sm font-semibold text-gray-700">Google Play</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-blue-600 via-[#635BFF] to-purple-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
            Ready to get started?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join thousands of users who have taken control of their financial future with Zepto.
          </p>
          <div className="flex justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-[#635BFF] hover:bg-gray-100 text-base px-8 py-6 rounded-full shadow-lg font-semibold">
                Create your account →
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-white/80 mt-8">
            No credit card required • Free forever • Get started in 30 seconds
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
