'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-200/50 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#635BFF] to-[#0A2540]">
              Zepto
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            <Link href="/#features" className="px-3 py-2 text-[15px] text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-50">
              Features
            </Link>
            <Link href="/#pricing" className="px-3 py-2 text-[15px] text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-50">
              Pricing
            </Link>
            <Link href="/help" className="px-3 py-2 text-[15px] text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-50">
              Help
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex lg:items-center lg:space-x-3">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-[15px] text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-[#635BFF] hover:bg-[#5851EA] text-white text-[15px] shadow-sm">
                Get started →
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden rounded-md p-2 text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="space-y-1 px-4 pb-4 pt-2">
            <Link
              href="/#features"
              className="block rounded-md px-3 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="block rounded-md px-3 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/help"
              className="block rounded-md px-3 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Help
            </Link>
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full text-[15px]">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-[#635BFF] hover:bg-[#5851EA] text-white text-[15px]">
                  Get started →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

