/**
 * Supabase Helper Utilities
 *
 * Common database operations and query helpers to keep code DRY
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generic function to fetch data with error handling
 */
export async function fetchData<T>(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  options?: {
    select?: string
    orderBy?: { column: string; ascending?: boolean }
    dateRange?: { from: Date; to: Date }
    limit?: number
  }
): Promise<T[]> {
  let query = supabase
    .from(table)
    .select(options?.select || '*')
    .eq('user_id', userId)

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? false,
    })
  }

  if (options?.dateRange) {
    query = query
      .gte('date', options.dateRange.from.toISOString().split('T')[0])
      .lte('date', options.dateRange.to.toISOString().split('T')[0])
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Error fetching from ${table}:`, error)
    throw new Error(`Failed to fetch ${table}: ${error.message}`)
  }

  return (data as T[]) || []
}

/**
 * Generic function to insert data with error handling
 */
export async function insertData<T>(
  supabase: SupabaseClient,
  table: string,
  data: Partial<T>,
  select = '*'
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select(select)
    .single()

  if (error) {
    console.error(`Error inserting into ${table}:`, error)

    // Handle common errors
    if (error.code === '23503') {
      throw new Error('Invalid foreign key reference')
    }
    if (error.code === '23505') {
      throw new Error('Duplicate entry')
    }

    throw new Error(`Failed to insert into ${table}: ${error.message}`)
  }

  return result as T
}

/**
 * Generic function to update data with error handling
 */
export async function updateData<T>(
  supabase: SupabaseClient,
  table: string,
  id: number | string,
  userId: string,
  data: Partial<T>,
  select = '*'
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select(select)
    .single()

  if (error) {
    console.error(`Error updating ${table}:`, error)
    throw new Error(`Failed to update ${table}: ${error.message}`)
  }

  if (!result) {
    throw new Error(`${table} not found or unauthorized`)
  }

  return result as T
}

/**
 * Generic function to delete data with error handling
 */
export async function deleteData(
  supabase: SupabaseClient,
  table: string,
  id: number | string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error(`Error deleting from ${table}:`, error)
    throw new Error(`Failed to delete from ${table}: ${error.message}`)
  }
}

/**
 * Generic function to bulk delete data
 */
export async function bulkDelete(
  supabase: SupabaseClient,
  table: string,
  ids: (number | string)[],
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .in('id', ids.map((id) => Number(id)))
    .eq('user_id', userId)

  if (error) {
    console.error(`Error bulk deleting from ${table}:`, error)
    throw new Error(`Failed to bulk delete from ${table}: ${error.message}`)
  }
}

/**
 * Generic function to bulk update data
 */
export async function bulkUpdate<T>(
  supabase: SupabaseClient,
  table: string,
  ids: (number | string)[],
  userId: string,
  changes: Partial<T>
): Promise<void> {
  const updateData = {
    ...changes,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from(table)
    .update(updateData)
    .in('id', ids.map((id) => Number(id)))
    .eq('user_id', userId)

  if (error) {
    console.error(`Error bulk updating ${table}:`, error)
    throw new Error(`Failed to bulk update ${table}: ${error.message}`)
  }
}

/**
 * Check if a record exists
 */
export async function recordExists(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  conditions: Record<string, any>
): Promise<boolean> {
  let query = supabase
    .from(table)
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  // Add additional conditions
  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { data, error } = await query

  if (error) {
    console.error(`Error checking existence in ${table}:`, error)
    return false
  }

  return (data?.length ?? 0) > 0
}

/**
 * Format date to ISO string for database storage
 */
export function formatDateForDB(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString().split('T')[0]
  }
  return date.toISOString().split('T')[0]
}

/**
 * Add timestamps to data
 */
export function addTimestamps<T extends Record<string, any>>(
  data: T,
  isUpdate = false
): T & { created_at?: string; updated_at: string } {
  const timestamp = new Date().toISOString()

  if (isUpdate) {
    return {
      ...data,
      updated_at: timestamp,
    }
  }

  return {
    ...data,
    created_at: timestamp,
    updated_at: timestamp,
  }
}
