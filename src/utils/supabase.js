import { createClient } from "@supabase/supabase-js"

let _client = null

const getClient = () => {
  if (_client) return _client
  const url = process.env.GATSBY_SUPABASE_URL
  const key = process.env.GATSBY_SUPABASE_ANON_KEY
  if (!url || !key) return null
  _client = createClient(url, key)
  return _client
}

export const incrementViewCount = async slug => {
  if (typeof window === "undefined") return
  const client = getClient()
  if (!client) return

  const sessionKey = `viewed_${slug}`
  if (sessionStorage.getItem(sessionKey)) return
  sessionStorage.setItem(sessionKey, "1")

  const { data } = await client
    .from("page_views")
    .select("view_count")
    .eq("slug", slug)
    .single()

  if (data) {
    await client
      .from("page_views")
      .update({ view_count: data.view_count + 1 })
      .eq("slug", slug)
  } else {
    await client
      .from("page_views")
      .insert({ slug, view_count: 1 })
  }
}

export const getTopPosts = async (limit = 5) => {
  const client = getClient()
  if (!client) return { data: [], error: null }

  const { data, error } = await client
    .from("page_views")
    .select("slug, view_count")
    .order("view_count", { ascending: false })
    .limit(limit)
  return { data: data || [], error }
}
