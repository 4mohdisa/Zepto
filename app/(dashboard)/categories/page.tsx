'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Search, Tag, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { CategoryDialog } from './_components/category-dialog'
import { ConfirmationDialog } from '@/components/dialogs/confirmation-dialog'
import {
  pageContainer,
  pageContent,
  pageHeading,
  bodyText,
  flexBetween,
  primaryButton,
  gridCols2,
} from '@/lib/styles'
import { cn } from '@/lib/utils'
import { usePageView } from '@/hooks/use-page-view'

interface Category {
  id: number
  name: string
  is_default: boolean
  user_id: string | null
  usage_count: number
}

// KPI Card Component
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ElementType
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
      </div>
    </div>
  )
}

// Skeleton loader for categories list
function CategoriesSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  usePageView('categories')
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Filter categories by search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate KPIs
  const totalCategories = categories.length
  const defaultCategories = categories.filter((c) => c.is_default).length
  const customCategories = categories.filter((c) => !c.is_default).length
  const mostUsedCategory = categories.reduce(
    (max, cat) => (cat.usage_count > max.usage_count ? cat : max),
    categories[0] || null
  )

  // Handle edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsEditOpen(true)
  }

  // Handle delete
  const handleDelete = (category: Category) => {
    setDeletingCategory(category)
    setIsDeleteOpen(true)
  }

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return

    try {
      const response = await fetch(`/api/categories?id=${deletingCategory.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'CATEGORY_IN_USE') {
          toast.error('Category is in use. Reassign transactions first.')
        } else {
          toast.error(data.error || 'Failed to delete category')
        }
        return
      }

      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error) {
      toast.error('Failed to delete category')
    } finally {
      setIsDeleteOpen(false)
      setDeletingCategory(null)
    }
  }

  return (
    <div className={pageContainer}>
      <div className={pageContent}>
        {/* Header */}
        <div className={`${flexBetween} mb-4 sm:mb-6`}>
          <div>
            <h1 className={pageHeading}>Categories</h1>
            <p className={`${bodyText} mt-1`}>
              Manage your transaction categories
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className={primaryButton}
          >
            Create Category
          </Button>
        </div>

        {/* KPI Cards */}
        <div className={`${gridCols2} sm:grid-cols-4 mb-6`}>
          <KPICard
            title="Total Categories"
            value={totalCategories}
            icon={Tag}
          />
          <KPICard
            title="Default Categories"
            value={defaultCategories}
            subtitle="Built-in"
            icon={FolderOpen}
          />
          <KPICard
            title="Custom Categories"
            value={customCategories}
            subtitle="Created by you"
            icon={Tag}
          />
          <KPICard
            title="Most Used"
            value={mostUsedCategory?.name || '-'}
            subtitle={mostUsedCategory ? `${mostUsedCategory.usage_count} transactions` : 'No data'}
            icon={Tag}
          />
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white h-9 sm:h-10"
            />
          </div>
        </div>

        {/* Categories List */}
        {loading ? (
          <CategoriesSkeleton />
        ) : filteredCategories.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 w-28">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 w-32 text-right">
                      Usage
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 py-3 px-4 w-14"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow
                      key={category.id}
                      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                    >
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10 flex items-center justify-center">
                            <Tag className="h-4 w-4 text-[#635BFF]" />
                          </div>
                          <span className="font-medium text-sm text-gray-900">
                            {category.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge
                          variant={category.is_default ? 'secondary' : 'outline'}
                          className={cn(
                            'text-xs font-medium rounded-md px-2 py-1',
                            category.is_default
                              ? 'bg-gray-100 text-gray-700 border-gray-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          )}
                        >
                          {category.is_default ? 'Default' : 'Custom'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right text-sm text-gray-600">
                        {category.usage_count} transaction
                        {category.usage_count !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              data-dropdown
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!category.is_default && (
                              <DropdownMenuItem
                                onClick={() => handleEdit(category)}
                              >
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(category)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10">
              <Tag className="h-8 w-8 text-[#635BFF]" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">
              {searchQuery ? 'No categories found' : 'No categories yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first category to organize transactions'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                size="sm"
                className={primaryButton}
              >
                Create Category
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CategoryDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
        onSuccess={fetchCategories}
      />

      {/* Edit Dialog */}
      <CategoryDialog
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setEditingCategory(null)
        }}
        mode="edit"
        initialName={editingCategory?.name || ''}
        categoryId={editingCategory?.id}
        onSuccess={fetchCategories}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setDeletingCategory(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description={
          deletingCategory
            ? `Are you sure you want to delete "${deletingCategory.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this category?'
        }
      />
    </div>
  )
}
