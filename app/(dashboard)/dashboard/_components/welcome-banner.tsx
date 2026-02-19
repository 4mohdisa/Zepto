"use client"

interface WelcomeBannerProps {
  userName: string
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
        {greeting()}, {userName}
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Here's an overview of your finances.
      </p>
    </div>
  )
}
