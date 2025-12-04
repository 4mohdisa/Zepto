'use client'

import { format } from "date-fns"
import { CalendarIcon } from 'lucide-react'
import { Control, FieldPath, FieldValues } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
}

interface InputFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  type?: 'text' | 'number' | 'email' | 'password'
}

export function InputField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = 'text'
}: InputFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              value={field.value ?? ''}
              onChange={type === 'number' 
                ? (e) => field.onChange(parseFloat(e.target.value) || 0)
                : field.onChange
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface TextareaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  className?: string
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  className
}: TextareaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              className={`resize-none ${className || ''}`}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  options: SelectOption[]
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options
}: SelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface DatePickerFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  disableFuture?: boolean
  disablePast?: boolean
  minDate?: Date
}

export function DatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Pick a date",
  disableFuture = true,
  minDate = new Date("1900-01-01")
}: DatePickerFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className="w-full h-10 px-3 text-left font-normal flex justify-between items-center"
                >
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                  )}
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={(date) => date && field.onChange(date)}
                disabled={(date) =>
                  (disableFuture && date > new Date()) || date < minDate
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
