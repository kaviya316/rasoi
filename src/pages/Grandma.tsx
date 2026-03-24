import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { callAI } from '../lib/ai'
import { useUserStore } from '../store/useUserStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { LoadingKitchen } from '../components/LoadingKitchen'
import { ErrorToast } from '../components/ErrorToast'
import { PenLine, Search, Heart } from 'lucide-react'

const STATES = ['Maharashtra', 'Tamil Nadu', 'Karnataka', 'Gujarat', 'Punjab', 'Kerala', 'West Bengal', 'Rajasthan', 'Other']
const LANGUAGES = ['Hindi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Gujarati', 'Other']

export const Grandma: React.FC = () => {
  const [tab, setTab] = useState<'add' | 'discover'>('add')
  const { user, profile } = useUserStore()
  const navigate = useNavigate()
  const { setActiveRecipe } = useRecipeStore()
  
  // Add Tab State
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('Hindi')
  const [state, setState] = useState(profile?.city || 'Maharashtra') // Fallback
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<any>(null)
  const [isPublic, setIsPublic] = useState(false)

  // Discover Tab State
  const [publicRecipes, setPublicRecipes] = useState<any[]>([])
  const [filterState, setFilterState] = useState('All')

  useEffect(() => {
    if (tab === 'discover') fetchPublic()
  }, [tab, filterState])

  const fetchPublic = async () => {
    let q = supabase.from('family_recipes').select('*').eq('is_public', true).order('upvotes', { ascending: false })
    if (filterState !== 'All') q = q.eq('state', filterState)
    const { data } = await q
    if (data) setPublicRecipes(data)
  }

  const handlePreserve = async () => {
    if (!text.trim() || !user) return
    setLoading(true)
    setError('')
    try {
      const res = await callAI('grandma', { text, language, state })
      if (res.name) {
        setPreview(res)
      } else {
        throw new Error('Could not structure recipe')
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!preview || !user) return
    setLoading(true)
    try {
      const { error: insError } = await supabase.from('family_recipes').insert({
        user_id: user.id,
        recipe_json: preview,
        original_input: text,
        language,
        state,
        is_public: isPublic
      })
      if (insError) throw insError
      setText('')
      setPreview(null)
      setTab('discover')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const handleUpvote = async (id: string, current: number) => {
    await supabase.from('family_recipes').update({ upvotes: current + 1 }).eq('id', id)
    fetchPublic()
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] pb-24 flex flex-col">
      <ErrorToast show={!!error} message={error} onClose={() => setError('')} />
      
      {/* Tabs */}
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-[var(--color-border)] rounded-b-3xl sticky top-0 z-10 flex gap-4">
        <button 
          onClick={() => setTab('add')}
          className={`flex-1 py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-colors ${tab === 'add' ? 'bg-[var(--color-charcoal)] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <PenLine size={18} /> Add Recipe
        </button>
        <button 
          onClick={() => setTab('discover')}
          className={`flex-1 py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-colors ${tab === 'discover' ? 'bg-[var(--color-charcoal)] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <Search size={18} /> Discover
        </button>
      </div>

      <div className="flex-1 p-6">
        {tab === 'add' ? (
          loading ? <div className="mt-20"><LoadingKitchen /></div> :
          preview ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)] mb-6">
                <h2 className="font-['Playfair_Display'] text-2xl font-bold mb-2 text-[var(--color-charcoal)] leading-tight">{preview.name}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-orange-50 text-[var(--color-saffron)] text-xs font-bold px-2 py-1 rounded-md">{preview.region}, {preview.state}</span>
                  {preview.era && <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">Era: {preview.era}</span>}
                </div>
                <p className="text-sm italic text-gray-600 mb-6 border-l-2 border-[var(--color-turmeric)] pl-3">"{preview.story}"</p>
                
                <h4 className="font-bold text-sm mb-2 text-[var(--color-charcoal)]">Ingredients mapped via AI</h4>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-6">
                  {preview.ingredients?.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                </ul>
              </div>

              <div className="mb-6 bg-white p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[var(--color-charcoal)] text-sm">Community Sharing</p>
                  <p className="text-xs text-gray-500">Allow others to discover this</p>
                </div>
                <label className="relative flex cursor-pointer items-center">
                  <input type="checkbox" className="sr-only" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                  <div className={`w-11 h-6 bg-gray-200 rounded-full transition-colors ${isPublic ? 'bg-[var(--color-green)]' : ''}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isPublic ? 'translate-x-5' : ''}`}></div>
                </label>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPreview(null)} className="flex-1 py-4 font-bold bg-white border border-[var(--color-border)] rounded-xl text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={handleSave} className="flex-[2] flex items-center justify-center py-4 font-bold bg-[var(--color-saffron)] text-white rounded-xl shadow-md shadow-orange-200 hover:bg-orange-600">Save Recipe 👵</button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in">
              <h1 className="font-['Playfair_Display'] text-3xl font-bold mb-6 text-[var(--color-charcoal)]">Preserve a Memory</h1>
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-600 mb-2">Original Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full p-4 rounded-xl border border-[var(--color-border)] bg-white font-medium focus:outline-none focus:border-[var(--color-saffron)]">
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-600 mb-2">State / Region</label>
                <select value={state} onChange={e => setState(e.target.value)} className="w-full p-4 rounded-xl border border-[var(--color-border)] bg-white font-medium focus:outline-none focus:border-[var(--color-saffron)]">
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-600 mb-2">Type the recipe as you remember it</label>
                <textarea 
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Amma used to take two fistfuls of rice..."
                  className="w-full h-40 p-4 rounded-xl border border-[var(--color-border)] bg-white font-medium focus:outline-none focus:border-[var(--color-saffron)] resize-none"
                />
              </div>

              <button 
                onClick={handlePreserve}
                disabled={!text.trim()}
                className="w-full bg-[var(--color-charcoal)] text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all text-lg shadow-lg flex justify-center gap-2 hover:bg-gray-800"
              >
                Structure Recipe ✨
              </button>
            </div>
          )
        ) : (
          <div className="animate-in fade-in">
            <div className="mb-6 flex overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar gap-2 hide-scrollbar">
              <button 
                onClick={() => setFilterState('All')}
                className={`flex-none px-4 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${filterState === 'All' ? 'bg-[var(--color-saffron)] text-white shadow-sm' : 'bg-white border text-gray-600 border-[var(--color-border)]'}`}
              >
                All Regions
              </button>
              {STATES.map(s => (
                <button
                  key={s}
                  onClick={() => setFilterState(s)}
                  className={`flex-none px-4 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${filterState === s ? 'bg-[var(--color-saffron)] text-white shadow-sm' : 'bg-white border text-gray-600 border-[var(--color-border)]'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {publicRecipes.map(r => (
                <div key={r.id} className="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-2">
                      <h3 className="font-['Playfair_Display'] text-xl font-bold leading-tight text-[var(--color-charcoal)]">{r.recipe_json.name}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{r.state} • {r.language}</p>
                    </div>
                    <button 
                      onClick={() => handleUpvote(r.id, r.upvotes)}
                      className="flex flex-col items-center justify-center min-w-12 h-12 rounded-xl bg-gray-50 text-[var(--color-saffron)] hover:bg-orange-50 transition-colors border border-[var(--color-border)] shrink-0"
                    >
                      <Heart size={16} fill="currentColor" />
                      <span className="text-[10px] font-bold mt-0.5">{r.upvotes}</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">"{r.recipe_json.story}"</p>
                  
                  <button 
                    onClick={() => {
                      setActiveRecipe({
                        name: r.recipe_json.name,
                        emoji: '👵',
                        steps: r.recipe_json.steps,
                        feature: 'grandma',
                        ingredients: r.recipe_json.ingredients
                      })
                      navigate('/recipe')
                    }}
                    className="w-full py-3 bg-[var(--color-cream)] text-[var(--color-charcoal)] font-bold rounded-xl text-sm border border-[var(--color-border)] hover:border-[var(--color-saffron)] transition-colors"
                  >
                    View Recipe
                  </button>
                </div>
              ))}
              {publicRecipes.length === 0 && (
                <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 font-medium">
                  No recipes found. Be the first to add one!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
