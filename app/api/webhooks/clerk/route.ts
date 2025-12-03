import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Clerk Webhook Handler
 * Syncs user data from Clerk to Supabase profiles table
 *
 * Handles the following events:
 * - user.created: Creates a new profile in Supabase
 * - user.updated: Updates existing profile
 * - user.deleted: Deletes profile (cascades to related data via FK constraints)
 */
export async function POST(req: NextRequest) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET environment variable')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // Check if headers are present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    )
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create Svix webhook instance
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the webhook signature
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 400 }
    )
  }

  // Initialize Supabase Admin client (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin access
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Handle the event based on type
  const eventType = evt.type

  try {
    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name } = evt.data

        // Create user profile in Supabase
        const { error } = await supabase.from('profiles').insert({
          id: id, // Clerk user ID
          email: email_addresses[0]?.email_address || '',
          name: first_name && last_name ? `${first_name} ${last_name}`.trim() : first_name || last_name || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) {
          console.error('Error creating profile:', error)
          return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
          )
        }

        console.log(`✅ Created profile for user ${id}`)
        break
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name } = evt.data

        // Update user profile in Supabase
        const { error } = await supabase
          .from('profiles')
          .update({
            email: email_addresses[0]?.email_address || '',
            name: first_name && last_name ? `${first_name} ${last_name}`.trim() : first_name || last_name || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        if (error) {
          console.error('Error updating profile:', error)
          return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
          )
        }

        console.log(`✅ Updated profile for user ${id}`)
        break
      }

      case 'user.deleted': {
        const { id } = evt.data

        if (!id) {
          return NextResponse.json(
            { error: 'User ID not found' },
            { status: 400 }
          )
        }

        // Delete user profile from Supabase
        // This will cascade delete all related data (transactions, recurring_transactions)
        // due to ON DELETE CASCADE constraints in the schema
        const { error } = await supabase.from('profiles').delete().eq('id', id)

        if (error) {
          console.error('Error deleting profile:', error)
          return NextResponse.json(
            { error: 'Failed to delete profile' },
            { status: 500 }
          )
        }

        console.log(`✅ Deleted profile for user ${id}`)
        break
      }

      default:
        // Log unhandled event types
        console.log(`ℹ️ Unhandled webhook event type: ${eventType}`)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
