import { LandingNavbar } from '@/components/app/landing/navbar'
import { LandingFooter } from '@/components/app/landing/footer'
import { Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#635BFF]/10">
              <Shield className="h-8 w-8 text-[#635BFF]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-center text-gray-600 text-lg">
            Last updated: November 29, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg prose-gray max-w-none">
            
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-6">
              Welcome to Zepto. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our 
              personal finance management application.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">2. Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong>Financial Data:</strong> Transaction details, categories, amounts, and dates that you manually enter.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our application.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>Provide and maintain our personal finance tracking services</li>
              <li>Generate insights and analytics about your spending patterns</li>
              <li>Send you important updates about your account</li>
              <li>Improve our application and develop new features</li>
              <li>Ensure the security of your account</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-600 mb-6">
              Your data is stored securely using industry-standard encryption. We use Supabase as our database 
              provider, which employs enterprise-grade security measures including encryption at rest and in transit. 
              We never store your bank credentials or have direct access to your bank accounts.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">5. Data Sharing</h2>
            <p className="text-gray-600 mb-4">We do not sell your personal data. We may share your information only:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>With service providers who assist in operating our application</li>
              <li>When required by law or to protect our legal rights</li>
              <li>With your explicit consent</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">7. Cookies</h2>
            <p className="text-gray-600 mb-6">
              We use essential cookies to maintain your session and preferences. We do not use tracking cookies 
              for advertising purposes.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-600 mb-6">
              We may update this privacy policy from time to time. We will notify you of any significant changes 
              by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">9. Contact Us</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about this privacy policy or our data practices, please contact us at{' '}
              <a href="mailto:privacy@zepto.app" className="text-[#635BFF] hover:underline">
                privacy@zepto.app
              </a>
            </p>

          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
