'use client'

import { useEffect, useMemo } from 'react'
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

import { transactionTypes, TransactionType } from "@/data/transactiontypes"
import { frequencies, FrequencyType } from "@/data/frequencies"
import { useCategories } from "@/hooks/use-categories"
import { accountTypes, AccountType } from "@/data/account-types"
import { BaseDialogProps, TransactionFormValues, transactionSchema } from '../shared/transaction-schema'
import { useAuth } from '@/context/auth-context'

import { InputField, TextareaField, SelectField, DatePickerField } from '../shared/form-fields'
import { LoadingButton } from '../shared/loading-button'
import { FormErrorSummary } from '../shared/form-error-summary'
import { useTransactionSubmit } from './hooks/use-transaction-submit'

interface TransactionDialogProps extends Omit<BaseDialogProps, 'mode'> {
  initialData?: Partial<TransactionFormValues>
  mode: 'create' | 'edit'
  onSubmit?: (data: TransactionFormValues) => void
  createTransaction?: (data: Partial<any>) => Promise<any>
  updateTransaction?: (id: number | string, data: Partial<any>) => Promise<void>
}

const DEFAULT_VALUES: TransactionFormValues = {
  name: "",
  description: "",
  amount: 0,
  type: "Expense" as TransactionType,
  account_type: "Cash" as AccountType,
  category_id: "",
  date: new Date(),
  recurring_frequency: "Never" as FrequencyType,
}

export function TransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
  createTransaction,
  updateTransaction
}: TransactionDialogProps) {
  const { user } = useAuth()
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialData },
  })

  // Reset form when initialData changes or dialog opens
  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({ ...DEFAULT_VALUES, ...initialData })
    }
  }, [form, initialData, isOpen])

  const { handleSubmit, isSubmitting } = useTransactionSubmit({
    userId: user?.id,
    categories,
    categoriesLoading,
    categoriesError,
    mode,
    onSuccess: () => {
      form.reset()
      onClose()
    },
    onSubmitCallback: onSubmit,
    createTransaction,
    updateTransaction
  })

  // Memoize select options
  const typeOptions = useMemo(() => 
    transactionTypes.map(t => ({ value: t.value, label: t.label })), 
  [])
  
  const accountTypeOptions = useMemo(() => 
    accountTypes.map(t => ({ value: t.value, label: t.label })), 
  [])
  
  const categoryOptions = useMemo(() => 
    categories?.map(c => ({ value: String(c.id), label: c.name })) || [],
  [categories])
  
  const frequencyOptions = useMemo(() => [
    { value: "Never", label: "One-time Transaction" },
    ...frequencies.map(f => ({ value: f.value, label: f.label }))
  ], [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-white border-gray-200 shadow-2xl">
        {/* Enhanced Header */}
        <DialogHeader className="space-y-3 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#635BFF] to-blue-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Create Transaction' : 'Edit Transaction'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {mode === 'create'
                  ? 'Add a new transaction to your financial records.'
                  : 'Make changes to your transaction details.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
            <FormErrorSummary errors={form.formState.errors} />

            {/* Transaction Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Details</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Name and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  control={form.control}
                  name="name"
                  label="Transaction Name"
                  placeholder="e.g., Grocery Shopping"
                />
                <InputField
                  control={form.control}
                  name="amount"
                  label="Amount"
                  placeholder="0.00"
                  type="number"
                />
              </div>

              {/* Date, Type, and Account Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DatePickerField
                  control={form.control}
                  name="date"
                  label="Date"
                />
                <SelectField
                  control={form.control}
                  name="type"
                  label="Type"
                  placeholder="Select type"
                  options={typeOptions}
                />
                <SelectField
                  control={form.control}
                  name="account_type"
                  label="Account"
                  placeholder="Select account"
                  options={accountTypeOptions}
                />
              </div>
            </div>

            {/* Categorization Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categorization</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Category and Recurring Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  control={form.control}
                  name="category_id"
                  label="Category"
                  placeholder="Select category"
                  options={categoryOptions}
                />
                <SelectField
                  control={form.control}
                  name="recurring_frequency"
                  label="Recurring Frequency"
                  placeholder="One-time transaction"
                  options={frequencyOptions}
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Additional Information</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Description */}
              <TextareaField
                control={form.control}
                name="description"
                label="Description (Optional)"
                placeholder="Add notes, tags, or any additional details..."
              />
            </div>

            {/* Enhanced Footer */}
            <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText={mode === 'create' ? 'Creating...' : 'Saving...'}
                className="w-full sm:w-auto bg-[#635BFF] hover:bg-[#5851EA] text-white shadow-md hover:shadow-lg transition-all"
              >
                {mode === 'create' ? 'Create Transaction' : 'Save Changes'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}