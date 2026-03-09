'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { primaryButton, secondaryButton } from '@/lib/styles'

interface CategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialName?: string
  categoryId?: number
  onSuccess: () => void
}

export function CategoryDialog({
  isOpen,
  onClose,
  mode,
  initialName = '',
  categoryId,
  onSuccess,
}: CategoryDialogProps) {
  const [name, setName] = useState(initialName)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset name when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Category name is required')
      return
    }

    if (trimmedName.length > 50) {
      toast.error('Category name must be 50 characters or less')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedName }),
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.code === 'DUPLICATE_NAME') {
            toast.error('A category with this name already exists')
          } else {
            toast.error(data.error || 'Failed to create category')
          }
          return
        }

        toast.success('Category created successfully')
      } else {
        // Edit mode
        if (!categoryId) return

        const response = await fetch('/api/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: categoryId, name: trimmedName }),
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.code === 'CANNOT_EDIT_DEFAULT') {
            toast.error('Default categories cannot be edited')
          } else if (data.code === 'DUPLICATE_NAME') {
            toast.error('A category with this name already exists')
          } else {
            toast.error(data.error || 'Failed to update category')
          }
          return
        }

        toast.success('Category updated successfully')
      }

      setName('')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create category' : 'Failed to update category')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create' ? 'Create Category' : 'Edit Category'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">
              Category Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Personal Care"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-sm"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/50 characters
            </p>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={secondaryButton}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={primaryButton}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : mode === 'create' ? (
                'Create'
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
