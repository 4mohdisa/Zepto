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
                size="sm"
                className="border-gray-300"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText={mode === 'create' ? 'Creating...' : 'Saving...'}
                size="sm"
                className="bg-[#635BFF] hover:bg-[#5851EA] text-white"
              >
                {mode === 'create' ? 'Create' : 'Save'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
