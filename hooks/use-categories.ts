import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/utils/supabase/client';

export interface Category {
  id: number;
  name: string;
  user_id?: string | number | null; // Support string, number, and null for compatibility
  icon?: string | null;
  color?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  description?: string | null;
  is_default?: boolean | null;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = useSupabaseClient() // Use authenticated client

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        console.log('🔍 Fetching categories...')

        // Fetch all categories (default categories + user-specific categories)
        // RLS policies will handle filtering based on Clerk JWT token
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true })

        console.log('📊 Categories response:', { data, error })

        if (error) throw error

        console.log('✅ Categories loaded:', data?.length || 0)
        setCategories(data || [])
      } catch (err) {
        console.error('❌ Error fetching categories:', err)
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
