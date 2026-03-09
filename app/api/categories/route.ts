import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { trackServerEvent, EVENT_CATEGORY_CREATED, EVENT_CATEGORY_DELETED } from '@/lib/analytics/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET /api/categories - List all categories for the user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Fetch categories (both default and user-specific)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${userId}`)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories', code: 'FETCH_ERROR', details: error.message },
        { status: 500 }
      )
    }

    // Get usage counts for each category
    const { data: transactions, error: usageError } = await supabase
      .from('transactions')
      .select('category_id')
      .eq('user_id', userId)
      .not('category_id', 'is', null)

    if (usageError) {
      console.error('Error fetching usage counts:', usageError)
    }

    // Create usage map by counting manually
    const usageMap = new Map()
    transactions?.forEach((tx: any) => {
      const current = usageMap.get(tx.category_id) || 0
      usageMap.set(tx.category_id, current + 1)
    })

    // Add usage counts to categories
    const categoriesWithUsage = data?.map(cat => ({
      ...cat,
      usage_count: usageMap.get(cat.id) || 0
    }))

    return NextResponse.json({ categories: categoriesWithUsage || [] })
  } catch (error: any) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: 'Category name must be 50 characters or less', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Check for duplicate name (case-insensitive) for this user
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .or(`is_default.eq.true,user_id.eq.${userId}`)
      .ilike('name', trimmedName)
      .limit(1)

    if (checkError) {
      console.error('Error checking duplicate:', checkError)
      return NextResponse.json(
        { error: 'Failed to validate category name', code: 'VALIDATION_ERROR' },
        { status: 500 }
      )
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'A category with this name already exists', code: 'DUPLICATE_NAME' },
        { status: 409 }
      )
    }

    // Create the category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: trimmedName,
        is_default: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json(
        { error: 'Failed to create category', code: 'CREATE_ERROR', details: error.message },
        { status: 500 }
      )
    }

    // Track analytics (fire and forget)
    trackServerEvent(EVENT_CATEGORY_CREATED, userId, {
      success: true
    }).catch(() => { /* ignore analytics errors */ })

    return NextResponse.json({ category: data, success: true })
  } catch (error: any) {
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/categories - Update a category
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, name } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: 'Category name must be 50 characters or less', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Check if category belongs to user (can't edit default categories)
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Category not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (existing.is_default) {
      return NextResponse.json(
        { error: 'Default categories cannot be edited', code: 'CANNOT_EDIT_DEFAULT' },
        { status: 403 }
      )
    }

    if (existing.user_id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to edit this category', code: 'UNAUTHORIZED' },
        { status: 403 }
      )
    }

    // Check for duplicate name
    const { data: duplicate, error: dupError } = await supabase
      .from('categories')
      .select('id')
      .or(`is_default.eq.true,user_id.eq.${userId}`)
      .ilike('name', trimmedName)
      .neq('id', id)
      .limit(1)

    if (dupError) {
      console.error('Error checking duplicate:', dupError)
      return NextResponse.json(
        { error: 'Failed to validate category name', code: 'VALIDATION_ERROR' },
        { status: 500 }
      )
    }

    if (duplicate && duplicate.length > 0) {
      return NextResponse.json(
        { error: 'A category with this name already exists', code: 'DUPLICATE_NAME' },
        { status: 409 }
      )
    }

    // Update the category
    const { data, error } = await supabase
      .from('categories')
      .update({ name: trimmedName, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return NextResponse.json(
        { error: 'Failed to update category', code: 'UPDATE_ERROR', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ category: data, success: true })
  } catch (error: any) {
    console.error('Categories PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/categories - Delete a category
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Check if category belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Category not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Allow deletion of both default and custom categories, but must verify ownership for non-default
    if (!existing.is_default && existing.user_id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this category', code: 'UNAUTHORIZED' },
        { status: 403 }
      )
    }

    // Check if category is in use
    const { data: txUsage, error: txError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('category_id', id)
      .limit(1)

    const { data: recurringUsage, error: recurringError } = await supabase
      .from('recurring_transactions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('category_id', id)
      .limit(1)

    const isInUse = (txUsage && txUsage.length > 0) || (recurringUsage && recurringUsage.length > 0)

    if (isInUse) {
      return NextResponse.json(
        { 
          error: 'Category is in use and cannot be deleted. Reassign transactions first.',
          code: 'CATEGORY_IN_USE',
          inUse: true
        },
        { status: 409 }
      )
    }

    // Delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return NextResponse.json(
        { error: 'Failed to delete category', code: 'DELETE_ERROR', details: error.message },
        { status: 500 }
      )
    }

    // Track analytics (fire and forget)
    trackServerEvent(EVENT_CATEGORY_DELETED, userId, {
      success: true
    }).catch(() => { /* ignore analytics errors */ })

    return NextResponse.json({ success: true, deleted: true })
  } catch (error: any) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error.message },
      { status: 500 }
    )
  }
}
