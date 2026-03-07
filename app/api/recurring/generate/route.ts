import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { TransactionService } from '@/features/transactions/services'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    // Create service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Create service instance
    const service = new TransactionService(supabase)

    // Generate due transactions
    const createdTransactions = await service.generateDueTransactions(userId)

    return NextResponse.json({
      success: true,
      created: createdTransactions.length,
      transactions: createdTransactions.map(t => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        date: t.date,
        type: t.type
      }))
    })

  } catch (error: any) {
    console.error('[API /recurring/generate] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate recurring transactions',
        details: error?.message || String(error)
      },
      { status: 500 }
    )
  }
}

// Also support GET for simple triggering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    // Create service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Create service instance
    const service = new TransactionService(supabase)

    // Generate due transactions
    const createdTransactions = await service.generateDueTransactions(userId)

    return NextResponse.json({
      success: true,
      created: createdTransactions.length,
      transactions: createdTransactions.map(t => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        date: t.date,
        type: t.type
      }))
    })

  } catch (error: any) {
    console.error('[API /recurring/generate] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate recurring transactions',
        details: error?.message || String(error)
      },
      { status: 500 }
    )
  }
}
