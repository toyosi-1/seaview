/**
 * Typed query helpers to work around @supabase/ssr Database inference issues.
 * These cast .single() results to the correct Row type.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Tables = Database['public']['Tables']
type TableName = keyof Tables

export async function getOne<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  column: string,
  value: string
): Promise<Tables[T]['Row'] | null> {
  const { data } = await (supabase.from(table as never) as never as {
    select: (q: string) => { eq: (c: string, v: string) => { single: () => Promise<{ data: Tables[T]['Row'] | null }> } }
  }).select('*').eq(column, value).single()
  return data ?? null
}
