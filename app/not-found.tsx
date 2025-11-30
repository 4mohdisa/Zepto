'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/app/landing/navbar';
import { LandingFooter } from '@/components/app/landing/footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingNavbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-32">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
              <FileQuestion className="h-10 w-10 text-[#635BFF]" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-4">
              404
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
              The page you're looking for doesn't exist or has been moved. Let's get you back on track.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="bg-[#635BFF] hover:bg-[#5851EA] text-white text-base px-8 py-6 rounded-full shadow-lg">
                Go to Home
              </Button>
            </Link>
            <Link href="/help">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-full border-gray-300 hover:bg-gray-50">
                Get Help
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      <LandingFooter />
    </div>
  );
}
