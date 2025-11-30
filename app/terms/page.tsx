import { LandingNavbar } from '@/components/app/landing/navbar'
import { LandingFooter } from '@/components/app/landing/footer'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#635BFF]/10">
              <FileText className="h-8 w-8 text-[#635BFF]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
            Terms of Service
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
            
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-6">
              By accessing or using Zepto, you agree to be bound by these Terms of Service and our Privacy Policy. 
              If you do not agree to these terms, please do not use our service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 mb-6">
              Zepto is a personal finance management application that allows users to track income, expenses, 
              recurring transactions, and analyze spending patterns. The service is provided &ldquo;as is&rdquo; and we 
              reserve the right to modify or discontinue features at any time.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">3. User Accounts</h2>
            <p className="text-gray-600 mb-4">When creating an account, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-600 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Upload malicious code or content</li>
              <li>Impersonate others or provide false information</li>
              <li>Use automated systems to access the service without permission</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">5. User Content</h2>
            <p className="text-gray-600 mb-6">
              You retain ownership of all financial data you enter into Zepto. By using our service, you grant 
              us a limited license to process this data solely for the purpose of providing our services to you. 
              We will not share your financial data with third parties except as described in our Privacy Policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-600 mb-6">
              The Zepto application, including its design, features, and content, is protected by copyright, 
              trademark, and other intellectual property laws. You may not copy, modify, distribute, or create 
              derivative works without our express written permission.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-gray-600 mb-6">
              Zepto is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee that the service 
              will be uninterrupted, error-free, or secure. We are not responsible for any financial decisions 
              you make based on information provided by our service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-600 mb-6">
              To the maximum extent permitted by law, Zepto and its affiliates shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including loss of profits, 
              data, or other intangible losses resulting from your use of the service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">9. Termination</h2>
            <p className="text-gray-600 mb-6">
              We may terminate or suspend your account at any time for violations of these terms or for any 
              other reason at our discretion. You may also delete your account at any time through the 
              application settings.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-600 mb-6">
              We reserve the right to modify these terms at any time. We will notify users of significant 
              changes via email or through the application. Continued use of the service after changes 
              constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">11. Governing Law</h2>
            <p className="text-gray-600 mb-6">
              These terms shall be governed by and construed in accordance with applicable laws, without 
              regard to conflict of law principles.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">12. Contact</h2>
            <p className="text-gray-600 mb-6">
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@zepto.app" className="text-[#635BFF] hover:underline">
                legal@zepto.app
              </a>
            </p>

          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
