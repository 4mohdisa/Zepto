'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Tag, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { categories } from '@/constants/categories'
import { cn } from '@/lib/utils'

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  onDelete: () => Promise<void>
  onChangeCategory: (categoryId: string) => Promise<void>
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onChangeCategory,
}: BulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (selectedCount === 0) return null

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await onDelete()
      setShowDeleteDialog(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeCategory = async () => {
    if (!selectedCategory) return
    setIsLoading(true)
    try {
      await onChangeCategory(selectedCategory)
      setShowCategoryDialog(false)
      setSelectedCategory('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#635BFF]/5 border rounded-lg">
        <span className="text-xs sm:text-sm font-medium">
          {selectedCount} selected
        </span>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs sm:text-sm px-2 sm:px-3"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCategoryDialog(true)}
            className="h-8 text-xs sm:text-sm px-2 sm:px-3"
          >
            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Change Category</span>
            <span className="sm:hidden">Category</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="ml-auto h-8 text-xs sm:text-sm px-2 sm:px-3"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Transactions</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete {selectedCount} transactions? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Change Category</DialogTitle>
            <DialogDescription className="text-sm">
              Select a new category for {selectedCount} transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCategoryDialog(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeCategory}
              disabled={!selectedCategory || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
