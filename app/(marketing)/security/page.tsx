import { Lock, Shield, Server, Key, Eye, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function SecurityPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#635BFF]/10">
              <Lock className="h-8 w-8 text-[#635BFF]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
            Security & Disclaimer
          </h1>
          <p className="text-center text-gray-600 text-lg max-w-2xl mx-auto">
            Your financial data security is our top priority. Learn about the measures we take to protect your information.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How We Protect Your Data
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <Card className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600 mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">End-to-End Encryption</h3>
              <p className="text-gray-600">
                All data transmitted between your device and our servers is encrypted using TLS 1.3, 
                the latest security protocol.
              </p>
            </Card>

            <Card className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
                <Server className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Infrastructure</h3>
              <p className="text-gray-600">
                We use Supabase with enterprise-grade PostgreSQL databases, featuring encryption at rest 
                and automated backups.
              </p>
            </Card>

            <Card className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 mb-4">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Authentication</h3>
              <p className="text-gray-600">
                Industry-standard authentication with secure password hashing, session management, 
                and optional OAuth providers.
              </p>
            </Card>

            <Card className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 mb-4">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bank Access</h3>
              <p className="text-gray-600">
                We never request or store your bank login credentials. All financial data is manually 
                entered by you.
              </p>
            </Card>

            <Card className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 text-red-600 mb-4">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Isolation</h3>
              <p className="text-gray-600">
                Row-level security ensures your data is completely isolated. Only you can access 
                your financial information.
              </p>
            </Card>

            <Card className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-100 text-teal-600 mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Regular Audits</h3>
              <p className="text-gray-600">
                We regularly review our security practices and update our systems to address 
                emerging threats.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg prose-gray max-w-none">
            
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Disclaimer</h2>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Not Financial Advice</h3>
            <p className="text-gray-600 mb-6">
              Zepto is a personal finance tracking tool designed to help you organize and visualize your 
              financial data. The information, analytics, and insights provided by our application are for 
              informational purposes only and should not be considered financial, investment, tax, or legal advice.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">User Responsibility</h3>
            <p className="text-gray-600 mb-6">
              You are solely responsible for the accuracy of the financial data you enter into Zepto. 
              We do not verify the accuracy of user-entered information. Any financial decisions you make 
              based on the data or insights from our application are made at your own risk.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">No Guarantees</h3>
            <p className="text-gray-600 mb-6">
              While we strive to provide accurate calculations and reliable service, we cannot guarantee 
              that our application will be error-free or uninterrupted. We are not liable for any losses 
              or damages arising from the use of our service.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Consult Professionals</h3>
            <p className="text-gray-600 mb-6">
              For important financial decisions, we strongly recommend consulting with qualified financial 
              advisors, accountants, or other relevant professionals who can provide personalized advice 
              based on your specific situation.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Data Backup</h3>
            <p className="text-gray-600 mb-6">
              While we maintain regular backups of our systems, we recommend that you periodically export 
              your data for your own records. We are not responsible for any data loss that may occur.
            </p>

          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Report a Security Issue</h2>
          <p className="text-gray-600 mb-6">
            If you discover a security vulnerability, please report it responsibly to our security team.
          </p>
          <a 
            href="mailto:security@zepto.app" 
            className="inline-flex items-center px-6 py-3 bg-[#635BFF] text-white rounded-full hover:bg-[#5851EA] transition-colors"
          >
            Contact Security Team
          </a>
        </div>
      </section>
    </>
  )
}
