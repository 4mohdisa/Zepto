'use client';

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-6">
          <FileQuestion className="h-8 w-8 text-gray-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          404
        </h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        
        <Link href="/dashboard">
          <Button className="bg-black hover:bg-gray-800 text-white">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
