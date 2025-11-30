'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="py-32 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Choose your plan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with our free plan or unlock premium features with Pro
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button 
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                isYearly 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-600'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="relative overflow-hidden border-2 border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all">
            <div className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Free</h3>
                <div className="mb-4">
                  <span className="text-6xl font-bold text-gray-900">$0</span>
                  <span className="text-xl text-gray-600">/{isYearly ? 'year' : 'month'}</span>
                </div>
                <p className="text-gray-600 text-sm">Perfect for getting started</p>
              </div>
              
              <Link href="/sign-up" className="block mb-8">
                <Button size="lg" variant="outline" className="w-full text-base py-6 rounded-full border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all">
                  Get started free
                </Button>
              </Link>
              
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-900 mb-4">What's included:</p>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-gray-400" />
                  </div>
                  <span className="text-gray-600 text-sm">Up to 100 transactions per month</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-gray-400" />
                  </div>
                  <span className="text-gray-600 text-sm">Basic analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-gray-400" />
                  </div>
                  <span className="text-gray-600 text-sm">5 custom categories</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-gray-400" />
                  </div>
                  <span className="text-gray-600 text-sm">Manual transaction entry</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-gray-400" />
                  </div>
                  <span className="text-gray-600 text-sm">Data export (CSV)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="relative overflow-hidden border-2 border-[#635BFF] bg-white shadow-2xl">
            <div className="absolute top-4 right-4">
              <div className="bg-gradient-to-r from-[#635BFF] to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Popular
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#635BFF] to-[#00D4FF] opacity-10 rounded-full -mr-16 -mt-16" />
            
            <div className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro</h3>
                <div className="mb-2">
                  <span className="text-6xl font-bold text-gray-900">
                    ${isYearly ? '60' : '6'}
                  </span>
                  <span className="text-xl text-gray-600">/{isYearly ? 'year' : 'month'}</span>
                </div>
                {isYearly ? (
                  <>
                    <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold mb-2">
                      Save $12 (17% off)
                    </div>
                    <p className="text-sm text-gray-600">Billed annually</p>
                  </>
                ) : (
                  <p className="text-sm text-[#635BFF] font-medium">or save with yearly</p>
                )}
              </div>
              
              <Link href="/sign-up" className="block mb-8">
                <Button size="lg" className="w-full bg-[#635BFF] hover:bg-[#5851EA] text-white text-base py-6 rounded-full shadow-lg transition-all">
                  Start Pro trial →
                </Button>
              </Link>
              
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-900 mb-4">Everything in Free, plus:</p>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#635BFF] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">Unlimited transactions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#635BFF] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">Advanced analytics & charts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#635BFF] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">Unlimited custom categories</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#635BFF] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">Recurring transactions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#635BFF] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">CSV import & export</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#635BFF] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#635BFF] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">Early access to new features</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <p className="text-center text-sm text-gray-600 mt-12">
          All plans include bank-level security • Cancel anytime • No hidden fees
        </p>
      </div>
    </section>
  )
}

