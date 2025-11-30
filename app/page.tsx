import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LandingNavbar } from '@/components/app/landing/navbar'
import { LandingFooter } from '@/components/app/landing/footer'
import { PricingSection } from '@/components/app/landing/pricing-section'
import { testimonials } from '@/data/testimonials'
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
  title: 'Zepto - Save $847/Month with AI-Powered Finance Tracking',
  description: 'Join 10,000+ professionals saving an average of $847/month with intelligent expense tracking. 14-day free trial. No credit card required. Money-back guarantee.',
  keywords: 'save money, expense tracker, financial freedom, budget app, reduce spending, AI finance, recurring expenses, subscription tracker, wealth building, smart budgeting',
  authors: [{ name: 'Zepto' }],
  openGraph: {
    title: 'Zepto - Save $847/Month with AI-Powered Finance Tracking',
    description: 'The premium finance platform that helps high-performers save money through intelligent insights. 14-day free trial + money-back guarantee.',
    type: 'website',
    url: 'https://zepto.app',
    siteName: 'Zepto',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zepto - Save $847/Month with AI Finance Tracking',
    description: '10,000+ professionals trust Zepto to save money. Start your free 14-day trial today.',
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
              Trusted by 10,000+ finance-conscious professionals
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 mb-8">
              Build wealth through{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#635BFF] to-[#00D4FF]">
                intelligent tracking
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              The premium financial management platform that helps high-performers save an average of <span className="font-semibold text-gray-900">$847/month</span> through smart insights and automated tracking.
            </p>

            {/* Value Props */}
            <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>14-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Setup in under 5 minutes</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
              <Link href="/sign-up">
                <Button size="lg" className="bg-[#635BFF] hover:bg-[#5851EA] text-white text-base px-10 py-7 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold">
                  Start Your Free Trial →
                </Button>
              </Link>
              <Link href="/#features">
                <Button size="lg" variant="outline" className="text-gray-700 border-2 border-gray-300 text-base px-10 py-7 rounded-full hover:bg-gray-50 transition-all font-semibold">
                  See How It Works
                </Button>
              </Link>
            </div>

            <p className="text-sm text-gray-500 mb-16">
              Start your 14-day free trial. No credit card required. Cancel anytime.
            </p>

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

      {/* Trust Signals Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">10K+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">$50M+</div>
              <div className="text-sm text-gray-600">Tracked Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">$847</div>
              <div className="text-sm text-gray-600">Avg. Monthly Savings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Banner */}
      <section className="py-12 bg-gradient-to-r from-[#635BFF] to-blue-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-[#635BFF] flex items-center justify-center text-xs font-semibold text-gray-700">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-white/90 text-sm font-medium">+10,000 users</span>
              </div>
              <p className="text-white text-lg font-semibold">Join thousands of professionals already saving with Zepto</p>
            </div>
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-[#635BFF] hover:bg-gray-100 px-8 py-6 rounded-full shadow-lg font-semibold transition-all">
                Start Free Trial →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Grid Overview */}
      <section id="features" className="py-32 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-blue-100 text-[#635BFF] rounded-full text-sm font-semibold mb-6">
              PROVEN RESULTS
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Save more. Stress less.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our users report an average of <span className="font-semibold text-gray-900">$847 in monthly savings</span> within their first 90 days.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Feature 1 */}
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-3xl border-2 border-[#635BFF]/20 bg-gradient-to-br from-blue-50 to-indigo-50 p-10 hover:border-[#635BFF]/40 transition-all">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-4">
                  <TrendingUp className="h-3 w-3" />
                  Saves avg. $847/month
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#635BFF] text-white mb-6">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  AI-powered spending insights
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-lg">
                  Discover hidden spending patterns and get personalized recommendations to reduce expenses. Our AI identifies an average of <span className="font-semibold text-gray-900">6-8 actionable savings opportunities</span> per month.
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
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 hover:shadow-xl hover:border-green-200 transition-all group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white mb-6 group-hover:scale-110 transition-transform">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Never miss a subscription
              </h3>
              <p className="text-gray-600 mb-4">
                Track all recurring bills and subscriptions automatically. Eliminate wasteful spending.
              </p>
              <p className="text-sm text-green-600 font-semibold">Avg. savings: $127/month</p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 hover:shadow-xl hover:border-orange-200 transition-all group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-white mb-6 group-hover:scale-110 transition-transform">
                <PieChart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Smart categorization
              </h3>
              <p className="text-gray-600 mb-4">
                Automatically categorize transactions and spot budget overruns before they happen.
              </p>
              <p className="text-sm text-orange-600 font-semibold">99.2% accuracy rate</p>
            </div>

            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-10 hover:border-purple-300 transition-all">
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Enterprise-grade security
                </h3>
                <p className="text-lg text-gray-600 mb-6 max-w-lg">
                  Bank-level 256-bit encryption. SOC 2 Type II certified. Your financial data is protected with the same security used by Fortune 500 companies.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>End-to-end encryption</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>SOC 2 certified</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>GDPR compliant</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 hover:shadow-xl hover:border-blue-200 transition-all group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 text-white mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Real-time sync
              </h3>
              <p className="text-gray-600 mb-4">
                Access your data instantly across all devices. No delays, no loading screens.
              </p>
              <p className="text-sm text-blue-600 font-semibold">99.9% uptime SLA</p>
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
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="flex-shrink-0 w-96 p-6 bg-white border-gray-200 shadow-md">
                  <p className="text-gray-700 mb-4 italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200">
                      <Image
                        src={testimonial.photoUrl}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="font-semibold text-gray-900">~ {testimonial.name}</p>
                  </div>
                </Card>
              ))}

              {/* Duplicate set for seamless loop */}
              {testimonials.map((testimonial) => (
                <Card key={`duplicate-${testimonial.id}`} className="flex-shrink-0 w-96 p-6 bg-white border-gray-200 shadow-md">
                  <p className="text-gray-700 mb-4 italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200">
                      <Image
                        src={testimonial.photoUrl}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="font-semibold text-gray-900">~ {testimonial.name}</p>
                  </div>
                </Card>
              ))}
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
              We&apos;re actively working on native mobile apps for iOS and Android. Track your spending anywhere, anytime.
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

      {/* Guarantee Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border-2 border-green-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              100% Risk-Free Guarantee
            </h3>
            <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
              Try Zepto Pro risk-free for 14 days. If you don&apos;t see real savings opportunities in your first two weeks, we&apos;ll refund you 100% — no questions asked.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-blue-600 via-[#635BFF] to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-6">
            ⚡ LIMITED TIME OFFER
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Start saving money today
          </h2>
          <p className="text-xl md:text-2xl text-white/95 mb-4 max-w-3xl mx-auto font-medium">
            Join 10,000+ professionals already saving an average of <span className="text-yellow-300">$847/month</span>
          </p>
          <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto">
            Every day you wait is money left on the table. Our users typically identify $200-400 in savings in their first week alone.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-[#635BFF] hover:bg-gray-100 text-lg px-12 py-8 rounded-full shadow-2xl font-bold hover:scale-105 transition-all">
                Start Your Free Trial →
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-white/90 font-medium">
              ✓ No credit card required • ✓ 14-day free trial • ✓ Setup in 5 minutes
            </p>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-[#635BFF] flex items-center justify-center text-xs font-semibold text-gray-700">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>423 people signed up this week</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Objection Handling */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about Zepto
            </p>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How quickly will I see results?
              </h3>
              <p className="text-gray-600">
                Most users identify their first savings opportunity within 24 hours of signing up. Our AI analyzes your spending patterns and typically finds 6-8 actionable insights in the first week. The average user saves $847/month after 90 days of using Zepto.
              </p>
            </Card>

            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Is my financial data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use bank-level 256-bit encryption and are SOC 2 Type II certified. Your data is encrypted end-to-end, and we never sell or share your information with third parties. The same security standards used by Fortune 500 companies.
              </p>
            </Card>

            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What if Zepto doesn&apos;t work for me?
              </h3>
              <p className="text-gray-600">
                We offer a 14-day money-back guarantee, no questions asked. If you don&apos;t see real savings opportunities in your first two weeks, we&apos;ll refund you 100%. That said, 94% of our Pro users report significant value in their first month.
              </p>
            </Card>

            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How is this different from other finance apps?
              </h3>
              <p className="text-gray-600">
                Unlike basic trackers, Zepto uses AI to provide actionable savings recommendations, not just data. We don&apos;t just show you where your money goes — we help you optimize it. Plus, our focus on recurring transactions helps identify &quot;silent&quot; expenses that drain $100-300/month on average.
              </p>
            </Card>

            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! There&apos;s no long-term commitment. You can cancel your Pro subscription anytime with one click. No fees, no penalties, no hassles. We&apos;re confident in our value — our retention rate speaks for itself at 89%.
              </p>
            </Card>

            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Do I need to connect my bank account?
              </h3>
              <p className="text-gray-600">
                No. While many users find it convenient, you can manually enter all transactions. Our AI-powered categorization and insights work great either way. The choice is yours based on your comfort level.
              </p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">Still have questions?</p>
            <Link href="/help">
              <Button variant="outline" size="lg" className="rounded-full border-2 border-gray-300 hover:border-[#635BFF] hover:text-[#635BFF] transition-all">
                Visit Help Center
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
