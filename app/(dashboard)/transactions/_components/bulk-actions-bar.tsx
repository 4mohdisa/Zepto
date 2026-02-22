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
import { categories } from '@/data/categories'

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
      <div className="flex items-center gap-4 px-4 py-3 bg-primary/5 border rounded-lg">
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCategoryDialog(true)}
          >
            <Tag className="h-4 w-4 mr-1" />
            Change Category
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="ml-auto"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transactions</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} transactions? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
            <DialogDescription>
              Select a new category for {selectedCount} transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCategoryDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeCategory}
              disabled={!selectedCategory || isLoading}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
