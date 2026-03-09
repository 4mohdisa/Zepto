import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const { userId } = await auth()
  
  // If user is authenticated, go to dashboard
  if (userId) {
    redirect('/dashboard')
  }
  
  // Otherwise go to sign in
  redirect('/sign-in')
}
