import { useState, useEffect } from 'react';

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
 * Fetches categories from the API.
 * Includes default categories (is_default = true) and user-specific categories.
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)

        // Fetch categories from API (uses service role, bypasses RLS issues)
        const response = await fetch('/api/categories')
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`)
        }
        const data = await response.json()
        setCategories(data.categories || [])
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
