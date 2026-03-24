import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: CORS })

  const { userId, recipeName, feature, wasteSaved } = await req.json()

  const XP_MAP: Record<string, number> = {
    mood: 50, budget: 40, rescue: 30,
    global: 60, grandma: 100
  }
  const xp = XP_MAP[feature] ?? 50

  // 1. Insert cook history
  await supabase.from("cook_history").insert({
    user_id: userId, recipe_name: recipeName,
    feature, xp_earned: xp, waste_saved: wasteSaved ?? false
  })

  // 2. Get profile
  const { data: p } = await supabase
    .from("profiles").select("*")
    .eq("user_id", userId).single()

  // 3. Calculate streak
  const lastDate   = p.last_cooked_at ? new Date(p.last_cooked_at) : null
  const yesterday  = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const consecutive = lastDate?.toDateString() === yesterday.toDateString()
  const newStreak  = consecutive ? (p.streak_days ?? 0) + 1 : 1

  // 4. Calculate level
  const newXp = (p.xp ?? 0) + xp
  const level =
    newXp < 200  ? "Chai Maker"         :
    newXp < 500  ? "Tawa Cook"          :
    newXp < 1000 ? "Pressure Cooker Pro":
    newXp < 2000 ? "Home Chef"          : "Rasoi Master"

  // 5. Update profile
  await supabase.from("profiles").update({
    xp: newXp, level,
    streak_days: newStreak,
    last_cooked_at: new Date().toISOString()
  }).eq("user_id", userId)

  // 6. Badge checks
  const { data: existing } = await supabase
    .from("badges").select("name").eq("user_id", userId)
  const has  = (n: string) => existing?.some(b => b.name === n)
  const give = (n: string, e: string) =>
    supabase.from("badges").insert({ user_id: userId, name: n, emoji: e })

  const { count: wc } = await supabase.from("cook_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId).eq("waste_saved", true)
  const { count: bc } = await supabase.from("cook_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId).eq("feature", "budget")
  const { count: gc } = await supabase.from("family_recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
  const { count: gl } = await supabase.from("cook_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId).eq("feature", "global")
  const { count: tc } = await supabase.from("cook_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if (!has("Zero Waste Warrior")  && (wc  ?? 0) >= 10) give("Zero Waste Warrior",  "♻️")
  if (!has("Budget Boss")         && (bc  ?? 0) >= 5)  give("Budget Boss",         "💸")
  if (!has("Memory Keeper")       && (gc  ?? 0) >= 3)  give("Memory Keeper",       "👵")
  if (!has("Globe Trotter")       && (gl  ?? 0) >= 5)  give("Globe Trotter",       "🌍")
  if (!has("Streak Legend")       && newStreak  >= 7)  give("Streak Legend",       "🔥")
  if (!has("Century Chef")        && (tc  ?? 0) >= 100) give("Century Chef",       "🏆")

  return new Response(
    JSON.stringify({ xp, newXp, level, streak: newStreak }),
    { headers: { ...CORS, "Content-Type": "application/json" } }
  )
})
