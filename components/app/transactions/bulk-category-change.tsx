import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categories } from "@/data/categories"

interface BulkCategoryChangeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (categoryId: number) => void
  selectedCount: number
}

export function BulkCategoryChangeDialog({ isOpen, onClose, onSave, selectedCount }: BulkCategoryChangeDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const handleSave = () => {
    if (selectedCategory) {
      onSave(parseInt(selectedCategory))
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Change Category for Selected Transactions</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select a new category for {selectedCount} transaction(s).
          </DialogDescription>
        </DialogHeader>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="bg-surface border-border hover:bg-hover-surface transition-colors">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border shadow-xl">
            {categories.map((category) => (
              <SelectItem 
                key={category.id} 
                value={category.id.toString()}
                className="hover:bg-hover-surface focus:bg-hover-surface"
              >
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedCategory}
            className="gradient-primary hover:gradient-primary-hover"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

