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
      <DialogContent className="sm:max-w-[600px] bg-card border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === 'create' ? 'Create Recurring Transaction' : 'Edit Recurring Transaction'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === 'create' 
              ? 'Add a new recurring transaction to your records.'
              : 'Make changes to your recurring transaction here.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormErrorSummary errors={form.formState.errors} />

            {/* Name and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Transaction name"
              />
              <InputField
                control={form.control}
                name="amount"
                label="Amount"
                placeholder="0.00"
                type="number"
              />
            </div>

            {/* Start Date, Type, and Account Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DatePickerField
                control={form.control}
                name="start_date"
                label="Start Date"
                disableFuture={false}
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
                label="Account Type"
                placeholder="Select account type"
                options={accountTypeOptions}
              />
            </div>

            {/* Category and Frequency */}
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
                name="frequency"
                label="Frequency"
                placeholder="Select frequency"
                options={frequencyOptions}
              />
            </div>

            {/* End Date */}
            <DatePickerField
              control={form.control}
              name="end_date"
              label="End Date (Optional)"
              placeholder="Pick an end date"
              disableFuture={false}
              minDate={form.getValues('start_date')}
            />

            {/* Description */}
            <TextareaField
              control={form.control}
              name="description"
              label="Description"
              placeholder="Add any additional details..."
            />

            {/* Footer */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Processing..."
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