'use client'

import { useEffect, useMemo, useRef } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Loader2 } from 'lucide-react'

import { transactionTypes } from "@/constants/transactiontypes"
import { frequencies, FrequencyType } from "@/constants/frequencies"
import { accountTypes, AccountType } from "@/constants/account-types"
import { useCategories } from "@/hooks/use-categories"
import { useMerchants } from "@/hooks/use-merchants"
import { useAuth } from '@/providers'
import { BaseDialogProps, RecurringTransactionFormValues, recurringTransactionSchema } from '@/components/shared/transaction-schema'
import { RecurringTransaction } from '@/types/transaction'
import { primaryButton, secondaryButton } from '@/lib/styles'

import { InputField, TextareaField, SelectField, DatePickerField } from '@/components/shared/form-fields'
import { LoadingButton } from '@/components/shared/loading-button'
import { FormErrorSummary } from '@/components/shared/form-error-summary'
import { useRecurringTransactionSubmit } from './hooks/use-recurring-transaction-submit'

interface RecurringTransactionDialogProps extends BaseDialogProps {
  onSubmit?: (data: RecurringTransactionFormValues) => void
  onRefresh?: () => void
  createRecurringTransaction?: (data: Partial<RecurringTransaction>) => Promise<RecurringTransaction>
  updateRecurringTransaction?: (id: number | string, data: Partial<RecurringTransaction>) => Promise<void>
}

const DEFAULT_VALUES: RecurringTransactionFormValues = {
  name: "",
  description: "",
  amount: 0,
  type: "Expense",
  account_type: "Cash",
  category_id: "",
  frequency: "Monthly" as FrequencyType,
  start_date: new Date(),
  // end_date is intentionally omitted from defaults - it's optional
}

// Helper to safely convert initialData to form values
function normalizeInitialData(
  initialData: Partial<RecurringTransactionFormValues> & { id?: number; category_id?: number | string | null } | undefined,
  mode: 'create' | 'edit',
  availableCategories: { id: number; name: string }[]
): RecurringTransactionFormValues {
  if (!initialData || mode === 'create') {
    // For create mode, use first available category if no default
    if (availableCategories.length > 0) {
      return {
        ...DEFAULT_VALUES,
        category_id: String(availableCategories[0].id)
      }
    }
    return DEFAULT_VALUES
  }

  // For edit mode, carefully merge with proper type conversions
  // Handle category_id conversion with fallback to first available category
  let categoryIdStr = DEFAULT_VALUES.category_id
  if (initialData.category_id != null) {
    categoryIdStr = String(initialData.category_id)
  } else if (availableCategories.length > 0) {
    categoryIdStr = String(availableCategories[0].id)
  }

  // Handle merchant_id - convert 'none' to undefined for form
  let merchantIdStr: string | undefined = undefined
  if (initialData.merchant_id && initialData.merchant_id !== 'none') {
    merchantIdStr = String(initialData.merchant_id)
  }

  // Handle start_date - only convert if valid
  let startDate = DEFAULT_VALUES.start_date
  if (initialData.start_date) {
    const parsed = initialData.start_date instanceof Date 
      ? initialData.start_date 
      : new Date(initialData.start_date)
    if (!isNaN(parsed.getTime())) {
      startDate = parsed
    }
  }

  // Handle end_date - preserve undefined if not set, only convert valid dates
  let endDate: Date | undefined = undefined
  if (initialData.end_date) {
    const parsed = initialData.end_date instanceof Date 
      ? initialData.end_date 
      : new Date(initialData.end_date)
    if (!isNaN(parsed.getTime())) {
      endDate = parsed
    }
  }

  return {
    name: initialData.name || DEFAULT_VALUES.name,
    description: initialData.description || DEFAULT_VALUES.description,
    amount: typeof initialData.amount === 'number' ? initialData.amount : DEFAULT_VALUES.amount,
    type: (initialData.type as 'Income' | 'Expense') || DEFAULT_VALUES.type,
    account_type: (initialData.account_type as AccountType) || DEFAULT_VALUES.account_type,
    // Ensure category_id is always a valid string for the form
    category_id: categoryIdStr,
    frequency: (initialData.frequency as FrequencyType) || DEFAULT_VALUES.frequency,
    // Handle date conversion - could be Date or string from API
    start_date: startDate,
    // end_date is optional - only set if provided, preserve undefined otherwise
    end_date: endDate,
    // merchant_id should be string for the form, undefined if none
    merchant_id: merchantIdStr,
  }
}

export function RecurringTransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  onRefresh,
  initialData,
  mode,
  createRecurringTransaction,
  updateRecurringTransaction
}: RecurringTransactionDialogProps) {
  const { user } = useAuth()
  const { categories, loading } = useCategories()
  const { merchants } = useMerchants()

  // Memoize select options - MUST be before effects that use them
  const typeOptions = useMemo(() => 
    transactionTypes.map(t => ({ value: t.value, label: t.label })), 
  [])
  
  const accountTypeOptions = useMemo(() => 
    accountTypes.map(t => ({ value: t.value, label: t.label })), 
  [])
  
  const categoryOptions = useMemo(() => 
    categories?.map(c => ({ value: String(c.id), label: c.name })) || [], 
    [categories])
  
  const frequencyOptions = useMemo(() => 
    frequencies.map(f => ({ value: f.value, label: f.label })), 
  [])
  
  const merchantOptions = useMemo(() => 
    merchants?.map(m => ({ 
      value: m.id, 
      label: m.merchant_name 
    })) || [], 
  [merchants])

  // Ensure options are populated before rendering form
  const isReady = !loading && categoryOptions.length > 0

  // Track if we've done initial reset for this dialog open
  const hasResetRef = useRef(false)
  // Track the last initialData id we reset for
  const lastInitialDataIdRef = useRef<number | undefined>(undefined)
  
  const form = useForm<RecurringTransactionFormValues>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: DEFAULT_VALUES,
    // Don't re-initialize when initialData changes, use reset instead
    resetOptions: {
      keepDirtyValues: false,
      keepErrors: false,
    },
  })
  
  // Reset form when dialog opens or when editing a different record
  useEffect(() => {
    if (!isOpen) {
      // Reset the flag when dialog closes
      hasResetRef.current = false
      return
    }
    
    // Wait for categories to be available
    if (!isReady) return
    
    // Only reset if we haven't for this open session, or if editing a different record
    const isDifferentRecord = initialData?.id !== lastInitialDataIdRef.current
    
    if (!hasResetRef.current || isDifferentRecord) {
      // categories is stable here since we've waited for loading to finish
      const categoryList = categories?.map(c => ({ id: c.id, name: c.name })) || []
      const normalized = normalizeInitialData(initialData, mode, categoryList)
      form.reset(normalized)
      hasResetRef.current = true
      lastInitialDataIdRef.current = initialData?.id
    }
  }, [isOpen, initialData?.id, loading, categoryOptions.length]) // Only depend on stable values

  const { handleSubmit, isSubmitting } = useRecurringTransactionSubmit({
    userId: user?.id,
    mode,
    initialDataId: initialData?.id,
    onSuccess: onClose,
    onSubmitCallback: onSubmit,
    onRefresh,
    createRecurringTransaction,
    updateRecurringTransaction
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border-gray-200">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'Create Recurring Transaction' : 'Edit Recurring Transaction'}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {mode === 'create' 
              ? 'Set up a transaction that repeats automatically'
              : 'Update your recurring transaction details'}
          </DialogDescription>
        </DialogHeader>

        {!isReady ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading form...</p>
          </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormErrorSummary errors={form.formState.errors} />

            {/* Transaction Details */}
            <div className="grid grid-cols-2 gap-3">
              <InputField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Monthly rent"
              />
              <InputField
                control={form.control}
                name="amount"
                label="Amount"
                placeholder="0.00"
                type="number"
              />
            </div>

            {/* Type and Category */}
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                control={form.control}
                name="type"
                label="Type"
                placeholder="Select type"
                options={typeOptions}
              />
              <SelectField
                control={form.control}
                name="category_id"
                label="Category"
                placeholder="Select category"
                options={categoryOptions}
              />
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-3">
              <DatePickerField
                control={form.control}
                name="start_date"
                label="Start date"
                disableFuture={false}
              />
              <SelectField
                control={form.control}
                name="frequency"
                label="Frequency"
                placeholder="How often?"
                options={frequencyOptions}
              />
            </div>

            {/* Optional fields in single column */}
            <div className="grid grid-cols-2 gap-3">
              <DatePickerField
                control={form.control}
                name="end_date"
                label="End date (optional)"
                placeholder="No end date"
                disableFuture={false}
                minDate={form.getValues('start_date')}
              />
              <SelectField
                control={form.control}
                name="account_type"
                label="Account"
                placeholder="Select account"
                options={accountTypeOptions}
              />
            </div>

            {/* Merchant (optional) */}
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                control={form.control}
                name="merchant_id"
                label="Merchant (optional)"
                placeholder="No merchant"
                options={[{ value: 'none', label: 'No merchant' }, ...merchantOptions]}
              />
            </div>

            {/* Description */}
            <TextareaField
              control={form.control}
              name="description"
              label="Description (optional)"
              placeholder="Add notes or details..."
              className="min-h-[60px]"
            />

            {/* Footer */}
            <DialogFooter className="flex gap-2 pt-4 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className={secondaryButton}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText={mode === 'create' ? 'Creating...' : 'Saving...'}
                className={primaryButton}
              >
                {mode === 'create' ? 'Create' : 'Save'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
