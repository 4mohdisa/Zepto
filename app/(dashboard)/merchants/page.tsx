'use client'

import { useMerchants } from '@/hooks/use-merchants'
import { Input } from '@/components/ui/input'
import { Search, Store, ArrowUpDown, Calendar, Hash, AlertCircle, Database, Wrench } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function MerchantsPage() {
  const { 
    loading, 
    error, 
    errorType,
    filteredMerchants, 
    searchQuery, 
    setSearchQuery,
    refetch 
  } = useMerchants()

  const renderErrorState = () => {
    if (!error) return null

    // Table missing - show setup instructions
    if (errorType === 'TABLE_MISSING') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-900">Merchants table not found</h3>
              <p className="text-amber-700 text-sm mt-1">{error}</p>
              
              <div className="mt-4 bg-amber-100/50 rounded-md p-3">
                <p className="text-xs font-medium text-amber-800 mb-2">Run this SQL in Supabase:</p>
                <pre className="text-xs text-amber-900 overflow-x-auto whitespace-pre-wrap">
{`-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    merchant_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_merchant UNIQUE (user_id, normalized_name)
);

-- Indexes
CREATE INDEX idx_merchants_user_id ON merchants(user_id);
CREATE INDEX idx_merchants_user_count ON merchants(user_id, transaction_count DESC);

-- RLS
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own merchants" ON merchants FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own merchants" ON merchants FOR INSERT WITH CHECK (user_id = auth.uid()::text);
GRANT ALL ON merchants TO anon, authenticated;`}
                </pre>
              </div>
              
              <Button 
                onClick={refetch} 
                variant="outline" 
                size="sm" 
                className="mt-4 border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                Retry After Setup
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Schema mismatch - show fix instructions
    if (errorType === 'SCHEMA_MISMATCH') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Wrench className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Schema Mismatch: user_id is UUID</h3>
              <p className="text-red-700 text-sm mt-1">
                The merchants table has user_id as UUID type, but Clerk uses string IDs like &quot;user_xxx&quot;.
              </p>
              
              <div className="mt-4 bg-red-100/50 rounded-md p-3">
                <p className="text-xs font-medium text-red-800 mb-2">Run this SQL to fix:</p>
                <pre className="text-xs text-red-900 overflow-x-auto whitespace-pre-wrap">
{`-- Fix: Change user_id from UUID to TEXT
DROP POLICY IF EXISTS "Users can view own merchants" ON merchants;
DROP POLICY IF EXISTS "Users can insert own merchants" ON merchants;
DROP POLICY IF EXISTS "Users can update own merchants" ON merchants;
DROP POLICY IF EXISTS "Users can delete own merchants" ON merchants;

ALTER TABLE merchants ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

CREATE POLICY "Users can view own merchants" ON merchants FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own merchants" ON merchants FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update own merchants" ON merchants FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "Users can delete own merchants" ON merchants FOR DELETE USING (user_id = auth.uid()::text);`}
                </pre>
              </div>
              
              <Button 
                onClick={refetch} 
                variant="outline" 
                size="sm" 
                className="mt-4 border-red-300 text-red-800 hover:bg-red-100"
              >
                Retry After Fix
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Permission denied
    if (errorType === 'PERMISSION_DENIED') {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-900">Permission Denied</h3>
              <p className="text-orange-700 text-sm mt-1">{error}</p>
              <p className="text-xs text-orange-600 mt-2">
                RLS policies may be blocking access. Check that policies use auth.uid()::text for Clerk compatibility.
              </p>
              <Button 
                onClick={refetch} 
                variant="outline" 
                size="sm" 
                className="mt-3 border-orange-300 text-orange-800 hover:bg-orange-100"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Unknown error
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error loading merchants</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <Button 
              onClick={refetch} 
              variant="outline" 
              size="sm" 
              className="mt-2 border-red-300 text-red-800 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-[1400px]">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Merchants</h1>
          <p className="text-sm text-gray-600 mt-1">
            Frequently used merchants from your transactions
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search merchants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Error State with Diagnostics */}
        {renderErrorState()}

        {/* Loading State */}
        {loading && filteredMerchants.length === 0 && !error && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - No merchants yet */}
        {!loading && !error && filteredMerchants.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10">
              <Store className="h-8 w-8 text-[#635BFF]" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">
              {searchQuery ? 'No merchants found' : 'No merchants yet'}
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Merchants will appear here as you add transactions'
              }
            </p>
          </div>
        )}

        {/* Merchants List */}
        {!loading && !error && filteredMerchants.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-fade-in">
            <div className="divide-y divide-gray-100">
              {filteredMerchants.map((merchant, index) => (
                <div 
                  key={merchant.id}
                  className={cn(
                    "p-4 flex items-center justify-between hover:bg-gray-50/80 transition-all duration-200",
                    "opacity-0 animate-fade-in-up"
                  )}
                  style={{ animationDelay: `${Math.min(index * 50, 500)}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Icon */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Store className="h-5 w-5 text-[#635BFF]" />
                    </div>
                    
                    {/* Merchant Info */}
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {merchant.merchant_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {merchant.transaction_count} transaction{merchant.transaction_count !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Last used {format(new Date(merchant.last_used_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rank / Count indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {index < 3 && (
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0 && "bg-yellow-100 text-yellow-700",
                        index === 1 && "bg-gray-200 text-gray-700",
                        index === 2 && "bg-amber-100 text-amber-700"
                      )}>
                        {index + 1}
                      </div>
                    )}
                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {!loading && !error && filteredMerchants.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Merchants</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredMerchants.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredMerchants.reduce((sum, m) => sum + m.transaction_count, 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Most Used</p>
              <p className="text-lg font-medium text-gray-900 truncate">
                {filteredMerchants[0]?.merchant_name || '-'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
