import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { callAI } from '../lib/ai'
import { useUserStore } from '../store/useUserStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { LoadingKitchen } from '../components/LoadingKitchen'
import { ErrorToast } from '../components/ErrorToast'
import { RecipeCard } from '../components/RecipeCard'

const QUICK_ADD = ['Rice', 'Dal', 'Roti', 'Eggs', 'Bread', 'Sabzi', 'Pasta', 'Milk']

interface FridgeItem {
  id: string
  name: string
  cooked_at: string
}

export const Rescue: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useUserStore()
  const { setActiveRecipe } = useRecipeStore()
  
  const [items, setItems] = useState<FridgeItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleAddItem = (name: string) => {
    if (!name.trim()) return
    setItems([{ id: Date.now().toString(), name: name.trim(), cooked_at: new Date().toISOString().split('T')[0] }, ...items])
    setNewItem('')
  }

  const handleUpdateDate = (id: string, date: string) => {
    setItems(items.map(i => i.id === id ? { ...i, cooked_at: date } : i))
  }

  const handleRemove = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const getUrgency = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24))
    if (diff >= 2) return { color: 'bg-red-500', label: 'urgent' }
    if (diff === 1) return { color: 'bg-yellow-400', label: 'use soon' }
    return { color: 'bg-green-500', label: 'fresh' }
  }

  const handleRescue = async () => {
    if (!profile || items.length === 0) return
    setLoading(true)
    setError('')
    try {
      const res = await callAI('rescue', { 
        items: items.map(i => ({ name: i.name, cooked_at: i.cooked_at })),
        health: profile.health 
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

  if (loading) return <div className="h-screen bg-[var(--color-cream)]"><LoadingKitchen /></div>

  if (results.length > 0) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] p-6 pb-24">
        <div className="flex items-center gap-4 mb-4 pt-4">
          <button onClick={() => setResults([])} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20} /></button>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold">Food Rescued \ud83e\uddbe</h1>
        </div>
        <div className="flex flex-col gap-4 mt-6">
          {results.map((r, i) => (
            <div key={i}>
              <RecipeCard {...r} onClick={() => { setActiveRecipe(r); navigate('/recipe') }} />
              {r.safety_note && (
                <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-lg font-medium">
                  {r.safety_note}
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
      
      <div className="flex items-center gap-4 mb-6 pt-4">
        <button onClick={() => navigate('/home')} className="p-2 bg-white rounded-full shadow-sm border border-[var(--color-border)]"><ArrowLeft size={20} /></button>
      </div>

      <h1 className="font-['Playfair_Display'] text-3xl font-bold mb-8 text-[var(--color-charcoal)] leading-tight">
        What's in your fridge?
      </h1>

      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem(newItem)}
          placeholder="e.g. Rice, Dal..."
          className="flex-1 p-4 rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-saffron)] bg-white font-medium shadow-inner shadow-gray-50"
        />
        <button onClick={() => handleAddItem(newItem)} className="bg-[var(--color-charcoal)] text-white px-5 rounded-xl font-bold hover:bg-gray-800 transition-colors"><Plus /></button>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {QUICK_ADD.map(q => (
            <button 
              key={q} 
              onClick={() => handleAddItem(q)}
              className="bg-white border border-[var(--color-border)] text-gray-600 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm hover:border-[var(--color-saffron)] hover:text-[var(--color-saffron)] transition-colors"
            >
              + {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {items.map(item => {
          const urgency = getUrgency(item.cooked_at)
          return (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shadow-inner ${urgency.color}`} />
                <span className="font-bold text-[var(--color-charcoal)]">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="date" 
                  value={item.cooked_at}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleUpdateDate(item.id, e.target.value)}
                  className="text-xs text-gray-500 font-bold bg-gray-50 p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400"
                />
                <button onClick={() => handleRemove(item.id)} className="text-gray-400 hover:text-red-500 text-xl font-bold">&times;</button>
              </div>
            </div>
          )
        })}
      </div>

      {items.length > 0 && (
        <button
          onClick={handleRescue}
          disabled={items.length === 0}
          className="w-full bg-[var(--color-saffron)] text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all text-lg shadow-lg shadow-orange-200 flex justify-center items-center gap-2 hover:bg-orange-600 animate-in slide-in-from-bottom-4"
        >
          Rescue My Food \ud83d\udd50
        </button>
      )}
    </div>
  )
}
