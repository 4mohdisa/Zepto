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

import { transactionTypes } from "@/data/transactiontypes"
import { frequencies, FrequencyType } from "@/data/frequencies"
import { accountTypes } from "@/data/account-types"
import { useCategories } from "@/hooks/use-categories"
import { useAuth } from '@/context/auth-context'
import { BaseDialogProps, RecurringTransactionFormValues, recurringTransactionSchema } from '../shared/transaction-schema'

import { InputField, TextareaField, SelectField, DatePickerField } from '../shared/form-fields'
import { LoadingButton } from '../shared/loading-button'
import { FormErrorSummary } from '../shared/form-error-summary'
import { useRecurringTransactionSubmit } from './hooks/use-recurring-transaction-submit'

interface RecurringTransactionDialogProps extends BaseDialogProps {
  onSubmit?: (data: RecurringTransactionFormValues) => void
  onRefresh?: () => void
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
}

export function RecurringTransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  onRefresh,
  initialData,
  mode,
}: RecurringTransactionDialogProps) {
  const { user } = useAuth()
  const { categories } = useCategories()

  const form = useForm<RecurringTransactionFormValues>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialData },
  })

  // Reset form when initialData changes or dialog opens
  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({ ...DEFAULT_VALUES, ...initialData })
    }
  }, [form, initialData, isOpen])

  const { handleSubmit, isSubmitting } = useRecurringTransactionSubmit({
    userId: user?.id,
    mode,
    initialDataId: initialData?.id,
    onSuccess: onClose,
    onSubmitCallback: onSubmit,
    onRefresh
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
  
  const frequencyOptions = useMemo(() => 
    frequencies.map(f => ({ value: f.value, label: f.label })), 
  [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-white border-gray-200 shadow-2xl">
        {/* Enhanced Header */}
        <DialogHeader className="space-y-3 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Create Recurring Transaction' : 'Edit Recurring Transaction'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {mode === 'create' 
                  ? 'Set up a recurring transaction that repeats automatically.'
                  : 'Update your recurring transaction schedule and details.'}
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
                  placeholder="e.g., Monthly Rent"
                />
                <InputField
                  control={form.control}
                  name="amount"
                  label="Amount"
                  placeholder="0.00"
                  type="number"
                />
              </div>

              {/* Type and Account Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Schedule Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recurrence Schedule</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Start Date and Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePickerField
                  control={form.control}
                  name="start_date"
                  label="Start Date"
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

              {/* End Date */}
              <div className="space-y-2">
                <DatePickerField
                  control={form.control}
                  name="end_date"
                  label="End Date (Optional)"
                  placeholder="Leave empty for no end date"
                  disableFuture={false}
                  minDate={form.getValues('start_date')}
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  If no end date is set, the transaction will continue indefinitely
                </p>
              </div>
            </div>

            {/* Categorization Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categorization</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Category */}
              <SelectField
                control={form.control}
                name="category_id"
                label="Category"
                placeholder="Select category"
                options={categoryOptions}
              />
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
                placeholder="Add notes, reminders, or any additional details..."
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
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                {mode === 'create' ? 'Create Recurring Transaction' : 'Save Changes'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}