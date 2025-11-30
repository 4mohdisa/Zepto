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
  mode = 'create'
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
    onSubmitCallback: onSubmit
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
      <DialogContent className="sm:max-w-[600px] bg-card border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === 'create' ? 'Create Transaction' : 'Edit Transaction'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === 'create'
              ? 'Add a new transaction to your records.'
              : 'Make changes to your transaction here.'}
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
                label="Account Type"
                placeholder="Select account type"
                options={accountTypeOptions}
              />
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
                label="Frequency"
                placeholder="Select frequency"
                options={frequencyOptions}
              />
            </div>

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
                {mode === 'create' ? 'Create Transaction' : 'Save Changes'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}