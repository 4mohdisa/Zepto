import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { categories as defaultCategories } from '@/constants/categories'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// POST /api/categories/init - Initialize default categories for a new user
export async function POST(request: NextRequest) {
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

    // Check if user already has categories (default or custom)
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .or(`is_default.eq.true,user_id.eq.${userId}`)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing categories:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing categories', code: 'CHECK_ERROR' },
        { status: 500 }
      )
    }

    // If user already has categories, don't create duplicates
    if (existingCategories && existingCategories.length > 0) {
      return NextResponse.json(
        { message: 'Categories already initialized', initialized: false },
        { status: 200 }
      )
    }

    // Insert default categories
    // These are global defaults (is_default = true, user_id = null)
    const categoriesToInsert = defaultCategories.map(cat => ({
      name: cat.name,
      is_default: true,
      user_id: null,
    }))

    const { data, error } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .select()

    if (error) {
      console.error('Error creating default categories:', error)
      return NextResponse.json(
        { error: 'Failed to create default categories', code: 'CREATE_ERROR', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Default categories created successfully',
      initialized: true,
      count: data?.length || 0
    })
  } catch (error: any) {
    console.error('Categories init error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error.message },
      { status: 500 }
    )
  }
}
