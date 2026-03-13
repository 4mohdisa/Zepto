'use client'

import { useState, useEffect } from 'react'
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

interface MerchantDialogProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialName?: string
  merchantId?: string
  onSuccess: () => void
}

export function MerchantDialog({
  isOpen,
  onClose,
  mode,
  initialName = '',
  merchantId,
  onSuccess,
}: MerchantDialogProps) {
  const [name, setName] = useState(initialName)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset name when dialog opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setName(initialName)
    }
  }, [isOpen, initialName])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Merchant name is required')
      return
    }

    if (trimmedName.length > 100) {
      toast.error('Merchant name must be 100 characters or less')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        const response = await fetch('/api/merchants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant_name: trimmedName }),
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.code === 'DUPLICATE_NAME') {
            toast.error('A merchant with this name already exists')
          } else {
            toast.error(data.error || 'Failed to create merchant')
          }
          return
        }

        toast.success('Merchant created successfully')
      } else {
        // Edit mode
        if (!merchantId) return

        const response = await fetch('/api/merchants', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: merchantId, merchant_name: trimmedName }),
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.code === 'DUPLICATE_NAME') {
            toast.error('A merchant with this name already exists')
          } else if (data.code === 'NOT_FOUND') {
            toast.error('Merchant not found')
          } else {
            toast.error(data.error || 'Failed to update merchant')
          }
          return
        }

        toast.success('Merchant updated successfully')
      }

      setName('')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create merchant' : 'Failed to update merchant')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create' ? 'Create Merchant' : 'Edit Merchant'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="merchant-name" className="text-xs font-medium">
              Merchant Name
            </Label>
            <Input
              id="merchant-name"
              placeholder="e.g. Starbucks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-sm"
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/100 characters
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
