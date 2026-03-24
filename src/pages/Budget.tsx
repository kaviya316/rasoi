import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { callAI } from '../lib/ai'
import { useUserStore } from '../store/useUserStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { LoadingKitchen } from '../components/LoadingKitchen'
import { ErrorToast } from '../components/ErrorToast'

export const Budget: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useUserStore()
  const { setActiveRecipe } = useRecipeStore()
  
  const [budget, setBudget] = useState(150)
  const [city, setCity] = useState(profile?.city || '')
  const [useExisting, setUseExisting] = useState(false)
  const [existingItems, setExistingItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const addItem = () => {
    if (newItem.trim() && !existingItems.includes(newItem.trim())) {
      setExistingItems([...existingItems, newItem.trim()])
      setNewItem('')
    }
  }

  const handleFindRecipe = async () => {
    if (!profile) return
    setLoading(true)
    setError('')
    try {
      const res = await callAI('budget', { 
        budget,
        city,
        health: profile.health,
        existing_items: useExisting ? existingItems : []
      })
      if (res.recipes) {
        setResults(res.recipes)
      } else {
        throw new Error('No recipes returned')
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    }
    setLoading(false)
  }

  const handleSelectRecipe = (recipe: any) => {
    setActiveRecipe(recipe)
    navigate('/recipe')
  }

  if (loading) return <div className="h-screen bg-[var(--color-cream)]"><LoadingKitchen /></div>

  if (results.length > 0) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] p-6 pb-24">
        <div className="flex items-center gap-4 mb-4 pt-4">
          <button onClick={() => setResults([])} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20} /></button>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold">Budget Meals \ud83d\udcb8</h1>
        </div>
        
        <div className="flex flex-col gap-6 mt-6">
          {results.map((r, i) => (
            <div 
              key={i} 
              onClick={() => handleSelectRecipe(r)}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border)] cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 mb-4 border-b border-dashed border-gray-200 pb-4">
                <div className="text-4xl">{r.emoji}</div>
                <div>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold leading-tight mb-1">{r.name}</h3>
                  <p className="text-xs text-green-700 font-bold bg-green-50 inline-block px-2 py-1 rounded">Total: ₹{r.total_cost_inr}</p>
                </div>
              </div>

              <div className="font-mono text-sm mb-4 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                {r.ingredients_with_price?.map((ing: any, idx: number) => (
                  <div key={idx} className="flex justify-between border-b border-dashed border-gray-200 last:border-0 py-1">
                    <span>{ing.item} <span className="text-gray-400 text-xs">({ing.qty})</span></span>
                    <span className="font-bold">₹{ing.price_inr}</span>
                  </div>
                ))}
              </div>

              {r.save_tip && (
                <div className="bg-green-50 text-green-800 text-xs px-3 py-2 rounded-lg font-medium border border-green-100">
                  💡 {r.save_tip}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] p-6 pb-24">
      <ErrorToast show={!!error} message={error} onClose={() => setError('')} />
      
      <div className="flex items-center gap-4 mb-8 pt-4">
        <button onClick={() => navigate('/home')} className="p-2 bg-white rounded-full shadow-sm border border-[var(--color-border)]"><ArrowLeft size={20} /></button>
      </div>

      <h1 className="font-['Playfair_Display'] text-3xl font-bold mb-8 text-[var(--color-charcoal)] leading-tight">
        What's your budget today?
      </h1>

      <div className="bg-white rounded-3xl p-8 mb-6 shadow-sm border border-[var(--color-border)] text-center">
        <div className="text-6xl font-bold text-[var(--color-charcoal)] mb-6 font-['DM_Sans'] tracking-tighter">
          ₹{budget}
        </div>
        <input 
          type="range" 
          min="50" 
          max="500" 
          step="10" 
          value={budget} 
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full accent-[var(--color-saffron)] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 font-bold mt-2">
          <span>₹50</span>
          <span>₹500</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-[var(--color-charcoal)] mb-2">Shopping City</label>
        <input 
          type="text" 
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full p-4 rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-saffron)] bg-white font-medium"
        />
      </div>

      <div className="mb-8">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input type="checkbox" checked={useExisting} onChange={(e) => setUseExisting(e.target.checked)} className="sr-only" />
            <div className={`block w-14 h-8 rounded-full transition-colors ${useExisting ? 'bg-[var(--color-green)]' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${useExisting ? 'translate-x-6' : ''}`}></div>
          </div>
          <span className="font-bold text-[var(--color-charcoal)]">Use what I already have</span>
        </label>

        {useExisting && (
          <div className="animate-in fade-in slide-in-from-top-2 mt-4 bg-white p-4 rounded-xl border border-[var(--color-border)]">
            <div className="flex gap-2 mb-3">
              <input 
                type="text" value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder="e.g. Potatoes, Rice..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-saffron)]"
              />
              <button onClick={addItem} className="bg-[var(--color-charcoal)] text-white p-2 rounded-lg"><Plus size={20}/></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {existingItems.map((item, idx) => (
                <div key={idx} className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-2">
                  {item} <button onClick={() => setExistingItems(is => is.filter(i => i !== item))} className="text-gray-400 hover:text-red-500">&times;</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleFindRecipe}
        className="w-full bg-[var(--color-saffron)] text-white font-bold py-4 rounded-xl transition-all text-lg shadow-lg shadow-orange-200"
      >
        Find Recipes 💸
      </button>
    </div>
  )
}
