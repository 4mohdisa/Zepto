"use client"

interface WelcomeBannerProps {
  userName: string
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        Hi, {userName}
      </h1>
      <p className="text-sm text-gray-600 mt-1">
        Here's what's happening with your finances today.
      </p>
    </div>
  )
}
