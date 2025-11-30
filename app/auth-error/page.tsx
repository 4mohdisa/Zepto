import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md border-border shadow-2xl bg-white">
        <CardHeader className="space-y-4">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Image src="/logo.png" alt="Zepto" width={56} height={56} className="object-contain" />
            <h1 className="text-3xl font-bold text-foreground">
              Zepto
            </h1>
          </div>
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-center text-foreground">Authentication Error</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            We encountered an issue while trying to authenticate your account
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="p-4 border border-border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">
              Error code: <span className="font-mono text-destructive">{code || 'unknown'}</span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild className="gradient-primary hover:gradient-primary-hover transition-all shadow-lg">
            <Link href="/sign-in">
              <Home className="mr-2 h-4 w-4" />
              Return to Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}