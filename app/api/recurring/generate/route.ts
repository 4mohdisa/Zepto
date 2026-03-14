import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { TransactionService } from '@/features/transactions/services'
import { trackServerEvent, EVENT_RECURRING_GENERATED } from '@/lib/analytics/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Validates the cron secret from the Authorization header.
 * Vercel automatically sends CRON_SECRET as "Authorization: Bearer <secret>"
 * when the CRON_SECRET environment variable is set in the project.
 */
function validateCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    console.error('[API /recurring/generate] CRON_SECRET not configured')
    return false
  }
  
  // Vercel sends the secret in the Authorization header as "Bearer <secret>"
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return false
  
  const token = parts[1]
  return token === cronSecret
}

/**
 * Fetches all unique user IDs from the recurring_transactions table
 * who have active recurring transactions that might be due
 */
async function getActiveUserIds(supabase: SupabaseClient): Promise<string[]> {
  const today = new Date().toISOString().split('T')[0]
  
  // Get users with recurring transactions that:
  // 1. Have started (start_date <= today)
  // 2. Have not ended (end_date is null OR end_date >= today)
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('user_id')
    .lte('start_date', today)
    .or(`end_date.is.null,end_date.gte.${today}`)
  
  if (error) {
    console.error('[API /recurring/generate] Error fetching active users:', error)
    return []
  }
  
  // Deduplicate user IDs
  const rows = (data || []) as { user_id: string }[]
  const uniqueUserIds = [...new Set(rows.map(row => row.user_id))]
  return uniqueUserIds
}

/**
 * Generates due transactions for a single user
 */
async function generateForUser(
  userId: string, 
  service: TransactionService
): Promise<{ userId: string; created: number; error?: string }> {
  try {
    const createdTransactions = await service.generateDueTransactions(userId)
    
    // Track analytics (fire and forget)
    if (createdTransactions.length > 0) {
      trackServerEvent(EVENT_RECURRING_GENERATED, userId, {
        count: createdTransactions.length,
        success: true,
        source: 'cron'
      }).catch(() => { /* ignore analytics errors */ })
    }
    
    return {
      userId,
      created: createdTransactions.length
    }
  } catch (error: any) {
    console.error(`[API /recurring/generate] Error generating for user ${userId}:`, error)
    return {
      userId,
      created: 0,
      error: error?.message || 'Unknown error'
    }
  }
}

/**
 * POST handler - supports both cron job and manual authenticated requests
 */
export async function POST(request: NextRequest) {
  try {
    // Check if this is a cron request (authenticated by secret)
    const isCronRequest = validateCronSecret(request)
    
    // Create service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
    
    let results: { userId: string; created: number; error?: string }[] = []
    let totalCreated = 0
    
    if (isCronRequest) {
      // CRON MODE: Generate for all active users
      console.log('[API /recurring/generate] Running in CRON mode - generating for all users')
      
      const userIds = await getActiveUserIds(supabase)
      
      if (userIds.length === 0) {
        return NextResponse.json({
          success: true,
          mode: 'cron',
          message: 'No active recurring transactions found',
          totalCreated: 0,
          usersProcessed: 0
        })
      }
      
      // Process each user
      const service = new TransactionService(supabase)
      
      for (const userId of userIds) {
        const result = await generateForUser(userId, service)
        results.push(result)
        totalCreated += result.created
      }
      
      const errors = results.filter(r => r.error)
      
      return NextResponse.json({
        success: true,
        mode: 'cron',
        totalCreated,
        usersProcessed: userIds.length,
        errors: errors.length > 0 ? errors : undefined
      })
      
    } else {
      // USER MODE: Authenticate with Clerk and generate for single user
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_MISSING' },
          { status: 401 }
        )
      }
      
      const service = new TransactionService(supabase)
      const createdTransactions = await service.generateDueTransactions(userId)
      
      // Track analytics (fire and forget)
      trackServerEvent(EVENT_RECURRING_GENERATED, userId, {
        count: createdTransactions.length,
        success: true,
        source: 'manual'
      }).catch(() => { /* ignore analytics errors */ })
      
      return NextResponse.json({
        success: true,
        mode: 'user',
        created: createdTransactions.length,
        transactions: createdTransactions.map(t => ({
          id: t.id,
          name: t.name,
          amount: t.amount,
          date: t.date,
          type: t.type
        }))
      })
    }
    
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

/**
 * GET handler - supports both cron job and manual authenticated requests
 */
export async function GET(request: NextRequest) {
  try {
    // Check if this is a cron request (authenticated by secret)
    const isCronRequest = validateCronSecret(request)
    
    // Create service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
    
    let results: { userId: string; created: number; error?: string }[] = []
    let totalCreated = 0
    
    if (isCronRequest) {
      // CRON MODE: Generate for all active users
      console.log('[API /recurring/generate] Running in CRON mode - generating for all users')
      
      const userIds = await getActiveUserIds(supabase)
      
      if (userIds.length === 0) {
        return NextResponse.json({
          success: true,
          mode: 'cron',
          message: 'No active recurring transactions found',
          totalCreated: 0,
          usersProcessed: 0
        })
      }
      
      // Process each user
      const service = new TransactionService(supabase)
      
      for (const userId of userIds) {
        const result = await generateForUser(userId, service)
        results.push(result)
        totalCreated += result.created
      }
      
      const errors = results.filter(r => r.error)
      
      return NextResponse.json({
        success: true,
        mode: 'cron',
        totalCreated,
        usersProcessed: userIds.length,
        errors: errors.length > 0 ? errors : undefined
      })
      
    } else {
      // USER MODE: Authenticate with Clerk and generate for single user
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_MISSING' },
          { status: 401 }
        )
      }
      
      const service = new TransactionService(supabase)
      const createdTransactions = await service.generateDueTransactions(userId)
      
      return NextResponse.json({
        success: true,
        mode: 'user',
        created: createdTransactions.length,
        transactions: createdTransactions.map(t => ({
          id: t.id,
          name: t.name,
          amount: t.amount,
          date: t.date,
          type: t.type
        }))
      })
    }
    
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
