"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse the string value to a Date object for the Calendar
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    try {
      return parseISO(value)
    } catch {
      return undefined
    }
  }, [value])

  // Handle date selection - convert Date to yyyy-MM-dd string
  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      if (date) {
        // Format as yyyy-MM-dd for the form/API
        const formatted = format(date, "yyyy-MM-dd")
        onChange(formatted)
      } else {
        onChange("")
      }
      setOpen(false)
    },
    [onChange]
  )

  // Clear the date
  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange("")
    },
    [onChange]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9 sm:h-10",
            "bg-white border-gray-200 shadow-sm",
            "hover:border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
          <span className="flex-1 truncate">
            {value ? format(parseISO(value), "MMM d, yyyy") : placeholder}
          </span>
          {value && (
            <X
              className="h-4 w-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-white" 
        align="start"
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerProps {
  from: string
  to: string
  onFromChange: (date: string) => void
  onToChange: (date: string) => void
  fromPlaceholder?: string
  toPlaceholder?: string
  disabled?: boolean
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  fromPlaceholder = "Start date",
  toPlaceholder = "End date",
  disabled = false,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <DatePicker
        value={from}
        onChange={onFromChange}
        placeholder={fromPlaceholder}
        disabled={disabled}
        className="w-full sm:w-[150px]"
      />
      <span className="text-gray-400 text-sm">to</span>
      <DatePicker
        value={to}
        onChange={onToChange}
        placeholder={toPlaceholder}
        disabled={disabled}
        className="w-full sm:w-[150px]"
      />
    </div>
  )
}
