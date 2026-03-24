import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)
const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY")!
})

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
}

const SYSTEM = `You are Rasoi, a warm expert Indian cooking assistant.
You know hyperlocal ingredient names, city-wise cuisine differences 
(Chennai, Mumbai, Delhi, Bangalore, Hyderabad), seasonal produce 
availability, and budget cooking for Indian households.
YOU MUST ALWAYS respond in valid raw JSON only.
Zero markdown. Zero backticks. Zero explanation. Pure JSON only.`

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: CORS })

  try {
    const { feature, payload } = await req.json()
    const cacheKey = `${feature}:${JSON.stringify(payload)}`

    const { data: cached } = await supabase
      .from("ai_cache")
      .select("response_json")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (cached) {
      return new Response(JSON.stringify(cached.response_json), {
        headers: { ...CORS, "Content-Type": "application/json" }
      })
    }

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620", // updated to a valid model
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(feature, payload) }]
    })

    const text = msg.content
      .map((b: any) => b.type === "text" ? b.text : "")
      .join("")
    const json = JSON.parse(text)

    await supabase.from("ai_cache").upsert({
      cache_key: cacheKey,
      response_json: json,
      expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString()
    })

    return new Response(JSON.stringify(json), {
      headers: { ...CORS, "Content-Type": "application/json" }
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" }
    })
  }
})

function healthRules(health: string[]): string {
  if (!health?.length) return ""
  return [
    health.includes("diabetic")     ? "No high-sugar. Low-GI only." : "",
    health.includes("post-workout") ? "Minimum 25g protein per serving." : "",
    health.includes("sick")         ? "Only light easy-to-digest meals." : "",
    health.includes("pregnant")     ? "No raw fish, no papaya, mild spice." : "",
    health.includes("vegan")        ? "Strictly no meat, dairy, or eggs." : "",
  ].filter(Boolean).join(" ")
}

function buildPrompt(feature: string, p: any): string {
  const h = healthRules(p.health || [])

  const prompts: Record<string, string> = {

    mood: `
      User mood: "${p.mood}". Extra: "${p.extra || "none"}".
      City: ${p.city}. Health rules: ${h || "none"}.
      Return exactly this JSON:
      {
        "recipes": [
          {
            "name": "",
            "emoji": "",
            "description": "",
            "time_mins": 0,
            "difficulty": "Easy|Medium|Hard",
            "why_for_mood": "",
            "ingredients": ["qty item"],
            "steps": ["step text"],
            "cost_inr": 0,
            "health_badge": ""
          }
        ]
      }
      Return exactly 3 recipes.`,

    budget: `
      3 meals under ₹${p.budget} in ${p.city}. Health: ${h || "none"}.
      Return exactly this JSON:
      {
        "recipes": [
          {
            "name": "",
            "emoji": "",
            "ingredients_with_price": [
              { "item": "", "qty": "", "price_inr": 0 }
            ],
            "total_cost_inr": 0,
            "steps": ["step text"],
            "save_tip": ""
          }
        ]
      }`,

    rescue: `
      Leftovers: ${JSON.stringify(p.items)}. Health: ${h || "none"}.
      Suggest 3 recipes ranked by urgency, oldest ingredients first.
      Return exactly this JSON:
      {
        "recipes": [
          {
            "name": "",
            "emoji": "",
            "uses": ["ingredient names used"],
            "waste_tip": "",
            "steps": ["step text"],
            "time_mins": 0,
            "safety_note": "",
            "urgency": 1
          }
        ]
      }`,

    global: `
      Make "${p.dish}" (${p.cuisine} cuisine) cookable in ${p.city}, India.
      Swap every foreign ingredient for an Indian alternative.
      Return exactly this JSON:
      {
        "original_name": "",
        "indianized_name": "",
        "substitutions": [
          {
            "original": "",
            "substitute": "",
            "where_to_buy": "",
            "taste_note": ""
          }
        ],
        "steps": ["step text"],
        "authenticity_percent": 0,
        "fun_fact": ""
      }`,

    grandma: `
      Traditional Indian recipe in ${p.language || "Hindi"}: "${p.text}".
      Transcribe and structure it fully.
      Return exactly this JSON:
      {
        "name": "",
        "region": "",
        "state": "",
        "story": "",
        "ingredients": ["qty item"],
        "steps": ["step text"],
        "serving_tips": "",
        "preservation_tips": "",
        "era": ""
      }`,

    missions: `
      3 daily cooking missions for user in ${p.city}, skill: "${p.skill}".
      Recent features used: ${JSON.stringify(p.history || [])}.
      Return exactly this JSON:
      {
        "missions": [
          {
            "text": "",
            "xp": 0,
            "emoji": "",
            "difficulty": "Easy|Medium|Hard"
          }
        ]
      }`
  }

  return prompts[feature] || `Suggest a simple Indian recipe. Return JSON: 
    { "name":"","emoji":"","ingredients":[],"steps":[] }`
}
