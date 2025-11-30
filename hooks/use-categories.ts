import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

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

  useEffect(() => {
    const supabase = createClient()
    
    async function fetchCategories() {
      try {
        setLoading(true)
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('No active session found')
        }

        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true })
        
        if (error) throw error
        
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
  }, [])

  return { categories, loading, error }
}
