import { LandingNavbar } from '@/components/app/landing/navbar'
import { LandingFooter } from '@/components/app/landing/footer'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      {children}
      <LandingFooter />
    </div>
  )
}
