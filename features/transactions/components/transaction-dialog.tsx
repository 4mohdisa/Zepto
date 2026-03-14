'use client'

import { useEffect, useRef, useState } from 'react'
import { invalidateMerchantsCache } from '@/hooks/use-merchants'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { dialogContent } from "@/lib/styles"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CategoryCombobox } from "@/components/ui/category-combobox"
import { DatePicker } from "@/components/ui/date-picker"
import { transactionTypes } from "@/constants/transactiontypes"
import { useCategories } from "@/hooks/use-categories"
import { useMerchants } from "@/hooks/use-merchants"
import { accountTypes } from "@/constants/account-types"
import { useAuth } from '@/providers'
import { useSupabaseClient } from '@/lib/supabase/client'
import { debugLogger } from '@/lib/utils/debug-logger'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { primaryButton, secondaryButton } from '@/lib/styles'
import { trackEvent, EVENT_TRANSACTION_CREATED, EVENT_TRANSACTION_UPDATED } from '@/lib/analytics'

// Simplified schema without recurring
const transactionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['Income', 'Expense']),
  account_type: z.string().min(1, 'Account is required'),
  category_id: z.string().min(1, 'Category is required'),
  merchant_id: z.string().optional(),
  description: z.string().optional(),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionDialogProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'create' | 'edit'
  initialData?: Partial<TransactionFormValues> & { id?: number }
  onSuccess?: () => void
}

// Helper to safely normalize initial data for the form
function normalizeInitialData(
  initialData: Partial<TransactionFormValues> & { id?: number } | undefined,
  mode: 'create' | 'edit'
): TransactionFormValues {
  if (!initialData || mode === 'create') {
    return {
      name: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'Expense',
      account_type: 'Checking',
      category_id: '',
      merchant_id: '',
      description: '',
    }
  }

  // For edit mode, carefully convert values to strings for form fields
  return {
    name: initialData.name || '',
    amount: typeof initialData.amount === 'number' ? initialData.amount : 0,
    date: initialData.date || format(new Date(), 'yyyy-MM-dd'),
    type: initialData.type || 'Expense',
    account_type: initialData.account_type || 'Checking',
    // Ensure category_id is always a string for the Select component
    category_id: initialData.category_id != null ? String(initialData.category_id) : '',
    // Ensure merchant_id is always a string or undefined (not null)
    merchant_id: initialData.merchant_id != null ? String(initialData.merchant_id) : '',
    description: initialData.description || '',
  }
}

export function TransactionDialog({
  isOpen,
  onClose,
  mode = 'create',
  initialData,
  onSuccess,
}: TransactionDialogProps) {
  const { user } = useAuth()
  const supabase = useSupabaseClient()
  const { categories, loading: categoriesLoading } = useCategories()
  const { merchants, loading: merchantsLoading } = useMerchants()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Track if we've reset for this dialog open session
  const hasResetRef = useRef(false)
  // Track the last initialData id we reset for
  const lastInitialDataIdRef = useRef<number | undefined>(undefined)
  // Track if data is ready (categories and merchants loaded)
  const isDataReady = !categoriesLoading && !merchantsLoading && categories && merchants

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      name: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'Expense',
      account_type: 'Checking',
      category_id: '',
      merchant_id: '',
      description: '',
    },
  })

  // Reset form when dialog opens or when editing a different transaction
  useEffect(() => {
    if (!isOpen) {
      // Reset the flag when dialog closes
      hasResetRef.current = false
      return
    }

    // Wait for categories and merchants to be loaded before resetting
    // This ensures Select components have their options before the form sets values
    if (!isDataReady) return

    // Only reset if we haven't for this open session, or if editing a different record
    const isDifferentRecord = initialData?.id !== lastInitialDataIdRef.current
    
    if (!hasResetRef.current || isDifferentRecord) {
      const normalized = normalizeInitialData(initialData, mode)
      form.reset(normalized)
      hasResetRef.current = true
      lastInitialDataIdRef.current = initialData?.id
    }
  }, [isOpen, initialData?.id, mode, isDataReady]) // Only depend on stable values, not the entire initialData object

  const handleSubmit = async (values: TransactionFormValues) => {
    if (!user?.id) {
      toast.error('Please sign in')
      return
    }

    setIsSubmitting(true)

    try {
      const categoryId = Number(values.category_id)
      const selectedCategory = categories?.find(c => c.id === categoryId)

      if (!selectedCategory) {
        throw new Error('Please select a valid category')
      }

      const merchantId = values.merchant_id ? values.merchant_id : null

      // IMPORTANT: Only include fields that exist in the transactions table schema
      // merchant_name column does NOT exist in the schema - only merchant_id
      const payload = {
        user_id: user.id,
        name: values.name,
        amount: values.amount,
        type: values.type,
        account_type: values.account_type,
        category_id: categoryId,
        category_name: selectedCategory.name,
        merchant_id: merchantId,
        // NOTE: merchant_name is intentionally omitted - it doesn't exist in the DB schema
        date: values.date,
        description: values.description || '',
        recurring_frequency: 'Never',
      }

      if (mode === 'edit' && initialData?.id) {
        // Update existing transaction
        debugLogger.info('transaction', 'Updating transaction', { id: initialData.id })
        
        const { error } = await supabase
          .from('transactions')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id)
          .eq('user_id', user.id)

        if (error) throw error
        
        // Track transaction updated
        trackEvent(EVENT_TRANSACTION_UPDATED, {
          transaction_id: initialData.id,
          type: values.type,
          has_category: !!values.category_id,
        })
        
        toast.success('Transaction updated')
      } else {
        // Create new transaction
        debugLogger.info('transaction', 'Creating transaction', { name: values.name })
        
        const { error } = await supabase
          .from('transactions')
          .insert(payload)

        if (error) throw error
        
        // Track transaction created
        trackEvent(EVENT_TRANSACTION_CREATED, {
          type: values.type,
          has_category: !!values.category_id,
          source: 'manual',
        })
        
        toast.success('Transaction created')
      }

      // Invalidate merchants cache so merchant data updates after mutation
      invalidateMerchantsCache(user.id)
      
      onSuccess?.()
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      toast.error(mode === 'edit' ? 'Failed to update' : 'Failed to create', {
        description: message,
      })
      debugLogger.error('transaction', mode === 'edit' ? 'Update failed' : 'Create failed', { error: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const errors = form.formState.errors

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${dialogContent} p-0 gap-0 overflow-hidden`}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create' ? 'Add Transaction' : 'Edit Transaction'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-4">
          {/* Row 1: Name + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Grocery"
                {...form.register('name')}
                className="h-9 text-sm"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-medium">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register('amount', { valueAsNumber: true })}
                className="h-9 text-sm"
              />
              {errors.amount && (
                <p className="text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Date + Type + Account */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-medium">Date</Label>
              <DatePicker
                id="date"
                value={form.watch('date')}
                onChange={(v) => form.setValue('date', v, { shouldDirty: true, shouldValidate: true })}
                placeholder="Select date"
                className="h-9 text-sm"
              />
              {errors.date && (
                <p className="text-xs text-red-500">{errors.date.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs font-medium">Type</Label>
              <Select 
                value={form.watch('type')} 
                onValueChange={(v) => form.setValue('type', v as 'Income' | 'Expense')}
              >
                <SelectTrigger id="type" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="account" className="text-xs font-medium">Account</Label>
              <Select 
                value={form.watch('account_type')} 
                onValueChange={(v) => form.setValue('account_type', v)}
              >
                <SelectTrigger id="account" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-medium">Category</Label>
            <CategoryCombobox
              options={categories || []}
              value={form.watch('category_id')}
              onChange={(v) => form.setValue('category_id', v, { shouldDirty: true, shouldValidate: true })}
              placeholder="Select category"
              disabled={categoriesLoading}
            />
            {errors.category_id && (
              <p className="text-xs text-red-500">{errors.category_id.message}</p>
            )}
          </div>

          {/* Row 3b: Merchant (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="merchant" className="text-xs font-medium text-muted-foreground">
              Merchant <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Controller
              name="merchant_id"
              control={form.control}
              render={({ field }) => (
                <Select 
                  value={field.value || 'none'} 
                  onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  disabled={merchantsLoading}
                >
                  <SelectTrigger id="merchant" className="h-9 text-sm">
                    <SelectValue placeholder="Select merchant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No merchant</SelectItem>
                    {merchants?.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.display_name || m.merchant_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {merchants?.length === 0 && !merchantsLoading && (
              <p className="text-xs text-muted-foreground">
                No merchants yet. Create merchants from the Merchants page.
              </p>
            )}
          </div>

          {/* Row 4: Description (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">
              Description <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="description"
              placeholder="Add notes..."
              {...form.register('description')}
              className="h-9 text-sm"
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className={secondaryButton}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className={primaryButton}
              disabled={isSubmitting || categoriesLoading || merchantsLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                mode === 'create' ? 'Create' : 'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TransactionDialog;
