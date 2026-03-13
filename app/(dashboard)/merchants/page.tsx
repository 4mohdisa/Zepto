'use client'

import { useState } from 'react'
import { useMerchants, Merchant, invalidateMerchantsCache } from '@/hooks/use-merchants'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Store, ArrowUpDown, Calendar, Hash, AlertCircle, Database, Wrench, Server, Loader2, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { pageContainer, pageContent, pageHeading, bodyText, gridCols2, primaryButton, secondaryButton } from '@/lib/styles'
import { usePageView } from '@/hooks/use-page-view'
import { MerchantDialog } from './_components/merchant-dialog'
import { ConfirmationDialog } from '@/components/dialogs/confirmation-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Skeleton loader for merchants list
function MerchantsSkeleton() {
  return (
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
  )
}

const MERCHANTS_SETUP_SQL = `-- Create merchants table with TEXT user_id for Clerk compatibility
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

CREATE INDEX idx_merchants_user_id ON merchants(user_id);
CREATE INDEX idx_merchants_user_count ON merchants(user_id, transaction_count DESC);

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own merchants" ON merchants 
    FOR SELECT USING (user_id = auth.uid()::text);

-- Function to auto-create merchants on transaction insert
CREATE OR REPLACE FUNCTION upsert_merchant_on_transaction()
RETURNS TRIGGER AS $$
DECLARE normalized TEXT;
BEGIN
    normalized := lower(trim(regexp_replace(NEW.name, '\\s+', ' ', 'g')));
    IF length(normalized) = 0 THEN RETURN NEW; END IF;
    INSERT INTO merchants (user_id, merchant_name, normalized_name, transaction_count, last_used_at)
    VALUES (NEW.user_id, NEW.name, normalized, 1, NEW.date)
    ON CONFLICT (user_id, normalized_name)
    DO UPDATE SET
        transaction_count = merchants.transaction_count + 1,
        last_used_at = GREATEST(merchants.last_used_at, EXCLUDED.last_used_at),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_upsert_merchant_on_transaction ON transactions;
CREATE TRIGGER tr_upsert_merchant_on_transaction
    AFTER INSERT ON transactions FOR EACH ROW
    EXECUTE FUNCTION upsert_merchant_on_transaction();

GRANT ALL ON merchants TO anon, authenticated;`

const SCHEMA_FIX_SQL = `-- Fix RLS policies to use Clerk user ID from JWT
-- The issue: auth.uid() returns a UUID, but we store Clerk IDs (user_xxx)
-- The fix: Use requesting_user_id() which reads auth.jwt() ->> 'sub'

DROP POLICY IF EXISTS "Users can view own merchants" ON merchants;
DROP POLICY IF EXISTS "Users can insert own merchants" ON merchants;
DROP POLICY IF EXISTS "Users can update own merchants" ON merchants;
DROP POLICY IF EXISTS "Users can delete own merchants" ON merchants;

-- Update the helper function to return Clerk ID from JWT
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN auth.jwt() ->> 'sub';  -- Clerk stores user ID in 'sub' claim
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Recreate policies with correct function
CREATE POLICY "Users can view own merchants" ON merchants 
    FOR SELECT USING (requesting_user_id() = user_id);
CREATE POLICY "Users can insert own merchants" ON merchants 
    FOR INSERT WITH CHECK (requesting_user_id() = user_id);
CREATE POLICY "Users can update own merchants" ON merchants 
    FOR UPDATE USING (requesting_user_id() = user_id);
CREATE POLICY "Users can delete own merchants" ON merchants 
    FOR DELETE USING (requesting_user_id() = user_id);`

export default function MerchantsPage() {
  usePageView('merchants')
  
  const { 
    loading, 
    error, 
    filteredMerchants, 
    merchants,
    searchQuery, 
    setSearchQuery,
    refetch,
    runBackfill,
    backfillStatus,
    isBackfilling,
    lastFetchDuration,
    cacheMetadata
  } = useMerchants()
  
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null)
  const [deletingMerchant, setDeletingMerchant] = useState<Merchant | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Check if we're refreshing while having cached data
  const isRefreshing = cacheMetadata.isFetching && filteredMerchants.length > 0
  
  const handleBackfill = async () => {
    try {
      await runBackfill()
      toast.success('Merchants imported successfully')
    } catch (err: any) {
      toast.error(err.message || 'Import failed')
    }
  }

  const handleCreateSuccess = () => {
    invalidateMerchantsCache()
    refetch()
  }

  const handleEditClick = (merchant: Merchant) => {
    setEditingMerchant(merchant)
    setIsEditOpen(true)
  }

  const handleEditSuccess = () => {
    invalidateMerchantsCache()
    refetch()
    setEditingMerchant(null)
  }

  const handleDeleteClick = (merchant: Merchant) => {
    setDeletingMerchant(merchant)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingMerchant) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/merchants?id=${deletingMerchant.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete merchant')
        return
      }

      toast.success('Merchant deleted successfully')
      invalidateMerchantsCache()
      refetch()
      setIsDeleteOpen(false)
      setDeletingMerchant(null)
    } catch (error) {
      toast.error('Failed to delete merchant')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderErrorState = () => {
    if (!error) return null

    // API Route Missing
    if (error.code === 'API_ROUTE_MISSING') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Server className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">API Route Not Found</h3>
              <p className="text-red-700 text-sm mt-1">{error.message}</p>
              <p className="text-xs text-red-600 mt-2">
                The /api/merchants endpoint is not accessible. Try restarting the dev server.
              </p>
              <Button 
                onClick={refetch} 
                variant="outline" 
                size="sm" 
                className="mt-3 border-red-300 text-red-800 hover:bg-red-100"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Table Missing
    if (error.code === 'TABLE_MISSING') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-900">Merchants Table Not Found</h3>
              <p className="text-amber-700 text-sm mt-1">{error.message}</p>
              
              <div className="mt-4 bg-amber-100/50 rounded-md p-3">
                <p className="text-xs font-medium text-amber-800 mb-2">Run this SQL in Supabase:</p>
                <pre className="text-xs text-amber-900 overflow-x-auto whitespace-pre-wrap font-mono bg-amber-100 p-2 rounded">
                  {MERCHANTS_SETUP_SQL}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-200"
                  onClick={() => navigator.clipboard.writeText(MERCHANTS_SETUP_SQL)}
                >
                  Copy SQL
                </Button>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={refetch} 
                  variant="outline" 
                  size="sm" 
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                  Retry After Setup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Schema Mismatch
    if (error.code === 'SCHEMA_MISMATCH') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Wrench className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Schema Mismatch</h3>
              <p className="text-red-700 text-sm mt-1">{error.message}</p>
              {error.details && (
                <p className="text-xs text-red-600 mt-1 font-mono">{error.details}</p>
              )}
              
              <div className="mt-4 bg-red-100/50 rounded-md p-3">
                <p className="text-xs font-medium text-red-800 mb-2">Run this SQL to fix:</p>
                <pre className="text-xs text-red-900 overflow-x-auto whitespace-pre-wrap font-mono bg-red-100 p-2 rounded">
                  {SCHEMA_FIX_SQL}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-red-400 text-red-800 hover:bg-red-200"
                  onClick={() => navigator.clipboard.writeText(SCHEMA_FIX_SQL)}
                >
                  Copy Fix SQL
                </Button>
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

    // Permission Denied
    if (error.code === 'PERMISSION_DENIED') {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-900">Permission Denied</h3>
              <p className="text-orange-700 text-sm mt-1">{error.message}</p>
              {error.details && (
                <p className="text-xs text-orange-600 mt-1">{error.details}</p>
              )}
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

    // Unknown/Other errors
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900">Error Loading Merchants</h3>
            <p className="text-gray-700 text-sm mt-1">{error.message}</p>
            {error.code && (
              <p className="text-xs text-gray-500 mt-1">Code: {error.code}</p>
            )}
            {error.details && (
              <p className="text-xs text-gray-500 mt-1 font-mono">{error.details}</p>
            )}
            <Button 
              onClick={refetch} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={pageContainer}>
      <div className={pageContent}>
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className={pageHeading}>Merchants</h1>
            <p className={`${bodyText} mt-1`}>
              Frequently used merchants from your transactions
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className={primaryButton}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create merchant
          </Button>
        </div>

        {/* Error State */}
        {renderErrorState()}

        {/* Loading State - Only show when no cached data */}
        {loading && filteredMerchants.length === 0 && !error && <MerchantsSkeleton />}

        {/* Stats Summary - Show above search/table when merchants exist */}
        {merchants.length > 0 && !error && (
          <div className={`mb-6 ${gridCols2} sm:grid-cols-3`}>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Merchants</p>
              <p className="text-2xl font-semibold text-gray-900">{merchants.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {merchants.reduce((sum, m) => sum + m.transaction_count, 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Most Used</p>
              <p className="text-lg font-medium text-gray-900 truncate">
                {merchants[0]?.display_name || merchants[0]?.merchant_name || '-'}
              </p>
            </div>
          </div>
        )}

        {/* Refreshing Indicator - when we have data but are revalidating */}
        {isRefreshing && (
          <div className="mb-4 flex items-center justify-end">
            <span className="text-xs text-[#635BFF] flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Refreshing merchants...
            </span>
          </div>
        )}

        {/* Search - Show when merchants exist */}
        {merchants.length > 0 && !error && (
          <div className="mb-6 flex gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search merchants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              title="Refresh"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        )}

        {/* Empty State - No merchants yet */}
        {!loading && !error && filteredMerchants.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10">
              <Store className="h-8 w-8 text-[#635BFF]" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">
              {searchQuery ? 'No merchants found' : merchants.length === 0 ? 'No merchants found in database' : 'All merchants filtered out'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery 
                ? 'Try adjusting your search'
                : backfillStatus?.hasTransactions 
                  ? `Found ${backfillStatus.transactionsCount} transactions but no merchants. Click import to create them.`
                  : merchants.length === 0 
                    ? 'No merchants found for your account. Add transactions or run backfill.'
                    : 'Merchants will appear here as you add transactions'
              }
            </p>
            

            {!searchQuery && backfillStatus?.needsBackfill && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">
                  Found {backfillStatus.transactionsCount} transactions that can be imported
                </p>
                <Button 
                  onClick={() => runBackfill()} 
                  disabled={isBackfilling}
                  className={primaryButton}
                >
                  {isBackfilling ? 'Importing...' : 'Import from Transactions'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Merchants List */}
        {(filteredMerchants.length > 0) && !error && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-fade-in">
            <div className="divide-y divide-gray-100">
              {filteredMerchants.map((merchant, index) => (
                <div 
                  key={merchant.id}
                  className={cn(
                    "p-4 flex items-center justify-between hover:bg-gray-50/80 transition-all duration-200"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Icon */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Store className="h-5 w-5 text-[#635BFF]" />
                    </div>
                    
                    {/* Merchant Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {merchant.display_name || merchant.merchant_name}
                        </h3>
                        {/* Classification badge for non-merchants */}
                        {merchant.classification && merchant.classification !== 'merchant' && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider",
                            merchant.classification === 'payment_processor' && "bg-orange-100 text-orange-700",
                            merchant.classification === 'marketplace' && "bg-purple-100 text-purple-700",
                            merchant.classification === 'bank_transfer' && "bg-blue-100 text-blue-700",
                            merchant.classification === 'noise' && "bg-gray-100 text-gray-500",
                            merchant.classification === 'unknown' && "bg-gray-100 text-gray-500"
                          )}>
                            {merchant.classification === 'payment_processor' ? 'Processor' : 
                             merchant.classification === 'bank_transfer' ? 'Transfer' :
                             merchant.classification}
                          </span>
                        )}
                      </div>
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

                  {/* Actions */}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(merchant)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(merchant)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Merchant Dialog */}
        <MerchantDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          mode="create"
          onSuccess={handleCreateSuccess}
        />

        {/* Edit Merchant Dialog */}
        <MerchantDialog
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false)
            setEditingMerchant(null)
          }}
          mode="edit"
          initialName={editingMerchant?.merchant_name || ''}
          merchantId={editingMerchant?.id}
          onSuccess={handleEditSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false)
            setDeletingMerchant(null)
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Merchant"
          description={`Are you sure you want to delete "${deletingMerchant?.merchant_name || ''}"? This action cannot be undone.`}
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
        />
      </div>
    </div>
  )
}
