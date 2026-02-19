import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/utils/supabase/client';

export interface Category {
  id: number;
  name: string;
  user_id?: string | number | null;
  icon?: string | null;
  color?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  description?: string | null;
  is_default?: boolean | null;
}

/**
 * useCategories Hook
 * 
 * Fetches categories from Supabase with Clerk authentication.
 * Includes default categories (is_default = true) and user-specific categories.
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = useSupabaseClient() // Use authenticated client

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)

        // Fetch all categories (default categories + user-specific categories)
        // RLS policies will handle filtering based on Clerk JWT token
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true })

        if (error) {
          console.error('Error fetching categories:', error)
          throw error
        }

        setCategories(data || [])
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'))
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [supabase])

  return { categories, loading, error }
}
