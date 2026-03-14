"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface Category {
  id: number
  name: string
}

interface CategoryComboboxProps {
  options: Category[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  showAllOption?: boolean
  allOptionLabel?: string
}

export function CategoryCombobox({
  options,
  value,
  onChange,
  placeholder = "Select category...",
  disabled = false,
  showAllOption = false,
  allOptionLabel = "All Categories",
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Find the selected category name for display
  const selectedCategory = React.useMemo(() => {
    if (!value || value === "all") return null
    return options.find((category) => category.id.toString() === value)
  }, [value, options])

  // Add "All" option if enabled
  const displayOptions = React.useMemo(() => {
    if (!showAllOption) return options
    return [{ id: "all" as any, name: allOptionLabel }, ...options]
  }, [options, showAllOption, allOptionLabel])

  // Filter categories based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return displayOptions
    const query = searchQuery.toLowerCase()
    return displayOptions.filter((category) =>
      category.name.toLowerCase().includes(query)
    )
  }, [displayOptions, searchQuery])

  const handleSelect = React.useCallback(
    (categoryId: string) => {
      onChange(categoryId)
      setOpen(false)
      setSearchQuery("")
    },
    [onChange]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-9 sm:h-10 px-3",
            "bg-white border-gray-200 shadow-sm",
            "hover:border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary",
            "text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selectedCategory?.name || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 bg-white" 
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Search input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          {/* Category list - scrollable to show all 16+ categories */}
          <div className="max-h-[300px] overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No categories found.
              </div>
            ) : (
              filteredOptions.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleSelect(category.id.toString())}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-sm outline-none",
                    "hover:bg-gray-100 focus:bg-gray-100",
                    value === category.id.toString() && "bg-gray-50"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === category.id.toString()
                        ? "opacity-100 text-[#635BFF]"
                        : "opacity-0"
                    )}
                  />
                  <span className="truncate">{category.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
