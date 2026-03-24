import { supabase } from "./supabase"

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ""
}

const BASE = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : "http://localhost:54321/functions/v1"

export async function callAI(feature: string, payload: object) {
  const token = await getToken()
  await fetch(`${BASE}/ai-recipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ feature, ...payload }) // flatten payload logically
  })
  
  // Wait! The Edge Function expects req.json() to have { feature, payload }
  // So let's send exactly that:
  const actualBody = JSON.stringify({ feature, payload })
  
  const res2 = await fetch(`${BASE}/ai-recipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: actualBody
  })

  if (!res2.ok) throw new Error("AI request failed")
  return res2.json()
}

export async function completeRecipe(payload: {
  userId: string
  recipeName: string
  feature: string
  wasteSaved?: boolean
}) {
  const token = await getToken()
  const res = await fetch(`${BASE}/complete-recipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error("Complete recipe request failed")
  return res.json()
}
