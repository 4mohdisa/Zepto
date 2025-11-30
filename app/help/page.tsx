'use client'

import { useState } from 'react'
import { LandingNavbar } from '@/components/app/landing/navbar'
import { LandingFooter } from '@/components/app/landing/footer'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  HelpCircle, 
  CreditCard, 
  Repeat, 
  PieChart, 
  Settings, 
  Shield, 
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  BookOpen,
  Send
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  icon: React.ReactNode
  items: FAQItem[]
}

const faqCategories: FAQCategory[] = [
  {
    title: 'Getting Started',
    icon: <BookOpen className="h-5 w-5" />,
    items: [
      {
        question: 'How do I create an account?',
        answer: 'Click the "Get Started" button on the homepage and fill in your email, name, and password. You can also sign up using Google authentication for a faster setup.'
      },
      {
        question: 'Is Zepto free to use?',
        answer: 'Yes, Zepto is completely free to use. All features are available at no cost, with no hidden fees or premium tiers.'
      },
      {
        question: 'What devices can I use Zepto on?',
        answer: 'Zepto is a web application that works on any device with a modern browser, including desktop computers, tablets, and smartphones.'
      }
    ]
  },
  {
    title: 'Transactions',
    icon: <CreditCard className="h-5 w-5" />,
    items: [
      {
        question: 'How do I add a transaction?',
        answer: 'Navigate to the Transactions page and click the "Add Transaction" button. Fill in the details including amount, category, date, and type (income or expense).'
      },
      {
        question: 'Can I edit or delete transactions?',
        answer: 'Yes, you can edit or delete any transaction by clicking on the action buttons in the transactions table. Changes are saved immediately.'
      },
      {
        question: 'What account types are supported?',
        answer: 'Zepto supports Cash, Bank, and Credit Card account types. You can categorize each transaction by the account it belongs to.'
      }
    ]
  },
  {
    title: 'Recurring Transactions',
    icon: <Repeat className="h-5 w-5" />,
    items: [
      {
        question: 'What are recurring transactions?',
        answer: 'Recurring transactions are regular payments or income that happen on a schedule, like rent, subscriptions, or salary. Zepto automatically predicts upcoming occurrences.'
      },
      {
        question: 'What frequencies are available?',
        answer: 'We support Daily, Weekly, Bi-Weekly, Tri-Weekly, Monthly, Bi-Monthly, Quarterly, Semi-Annually, and Annually frequencies.'
      },
      {
        question: 'How do I set an end date for recurring transactions?',
        answer: 'When creating or editing a recurring transaction, you can optionally set an end date. The transaction will stop generating predictions after this date.'
      }
    ]
  },
  {
    title: 'Categories',
    icon: <PieChart className="h-5 w-5" />,
    items: [
      {
        question: 'Can I create custom categories?',
        answer: 'Yes, you can create, edit, and delete custom categories from the Categories page. Each category can have a custom name and color.'
      },
      {
        question: 'How do categories help with tracking?',
        answer: 'Categories help you organize transactions and see spending patterns. The dashboard shows breakdowns by category so you can identify where your money goes.'
      }
    ]
  },
  {
    title: 'Account & Settings',
    icon: <Settings className="h-5 w-5" />,
    items: [
      {
        question: 'How do I change my password?',
        answer: 'Go to Settings and look for the password change option. You can also use the "Forgot Password" link on the sign-in page to reset your password via email.'
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, you can delete your account from the Settings page. This will permanently remove all your data. This action cannot be undone.'
      },
      {
        question: 'How do I export my data?',
        answer: 'You can export your transactions data in CSV format from the Transactions page using the export functionality.'
      }
    ]
  },
  {
    title: 'Security & Privacy',
    icon: <Shield className="h-5 w-5" />,
    items: [
      {
        question: 'Is my financial data secure?',
        answer: 'Yes, we use industry-standard encryption for all data transmission and storage. Your data is stored securely with row-level security ensuring only you can access it.'
      },
      {
        question: 'Do you have access to my bank accounts?',
        answer: 'No, Zepto never requests or stores your bank login credentials. All financial data is manually entered by you.'
      },
      {
        question: 'Who can see my data?',
        answer: 'Only you can see your financial data. We do not share your personal information with third parties except as described in our Privacy Policy.'
      }
    ]
  }
]

function FAQAccordion({ category }: { category: FAQCategory }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Card className="p-6 bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
          {category.icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
      </div>
      <div className="space-y-3">
        {category.items.map((item, index) => (
          <div key={index} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex items-center justify-between w-full text-left py-2 group"
            >
              <span className="text-gray-700 font-medium pr-4 group-hover:text-gray-900">{item.question}</span>
              {openIndex === index ? (
                <ChevronUp className="h-4 w-4 text-[#635BFF] flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              )}
            </button>
            {openIndex === index && (
              <p className="text-gray-600 text-sm pb-2 pr-8 mt-2">{item.answer}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    supportType: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(
      item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0)

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success('Message sent successfully!', {
      description: "We'll get back to you within 24 hours."
    })
    
    // Reset form
    setContactForm({
      name: '',
      email: '',
      subject: '',
      supportType: '',
      message: ''
    })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#635BFF] shadow-lg">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Help Center
          </h1>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Find answers to common questions about using Zepto for your personal finance management.
          </p>
          
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg border-gray-300 bg-white focus:border-[#635BFF] focus:ring-[#635BFF] shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* FAQ Grid */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {searchQuery && filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No results found for &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-gray-500 mt-2">Try a different search term or browse the categories below.</p>
              <Button 
                variant="outline" 
                className="mt-4 border-gray-300 hover:bg-gray-100"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(searchQuery ? filteredCategories : faqCategories).map((category, index) => (
                <FAQAccordion key={index} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Still need help?
            </h2>
            <p className="text-lg text-gray-600">
              Send us a message and we'll get back to you within 24 hours.
            </p>
          </div>

          <Card className="p-8 border-gray-200 bg-white shadow-lg">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-900">
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    required
                    className="border-gray-300 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-900">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    required
                    className="border-gray-300 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="supportType" className="text-sm font-medium text-gray-900">
                  Support Type
                </label>
                <Select
                  value={contactForm.supportType}
                  onValueChange={(value) => setContactForm({...contactForm, supportType: value})}
                  required
                >
                  <SelectTrigger className="border-gray-300 bg-white">
                    <SelectValue placeholder="Select a support type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="account">Account & Billing</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="security">Security Concern</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-gray-900">
                  Subject
                </label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Brief description of your issue"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  required
                  className="border-gray-300 bg-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-gray-900">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Please describe your issue or question in detail..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  required
                  rows={6}
                  className="border-gray-300 bg-white resize-none"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#635BFF] hover:bg-[#5851EA] text-white shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Alternative Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Other ways to reach us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-white border-gray-200 text-center hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Send us an email directly for any inquiries or support needs.
              </p>
              <a 
                href="mailto:support@zepto.app"
                className="text-[#635BFF] hover:text-[#5851EA] font-medium text-sm"
              >
                support@zepto.app
              </a>
            </Card>

            <Card className="p-6 bg-white border-gray-200 text-center hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600 mb-4">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Join our community to connect with other users and share tips.
              </p>
              <a 
                href="#"
                className="text-[#635BFF] hover:text-[#5851EA] font-medium text-sm"
              >
                Join Community
              </a>
            </Card>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
