import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { callAI } from '../lib/ai'
import { useUserStore } from '../store/useUserStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { MoodChip } from '../components/MoodChip'
import { RecipeCard } from '../components/RecipeCard'
import { LoadingKitchen } from '../components/LoadingKitchen'
import { ErrorToast } from '../components/ErrorToast'

const MOODS = [
  { id: 'stressed', label: 'Stressed', emoji: '😓' },
  { id: 'workout', label: 'Post-workout', emoji: '💪' },
  { id: 'lazy', label: 'Lazy Sunday', emoji: '😴' },
  { id: 'celebrating', label: 'Celebrating', emoji: '🎉' },
  { id: 'impress', label: 'Want to impress', emoji: '😍' },
  { id: 'sick', label: 'Feeling sick', emoji: '🤒' },
  { id: 'hungry', label: 'Just hungry', emoji: '😐' },
  { id: 'comfort', label: 'Need comfort', emoji: '❤️' },
]

export const Mood: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useUserStore()
  const { setActiveRecipe } = useRecipeStore()
  
  const [selectedMood, setSelectedMood] = useState('')
  const [extraText, setExtraText] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleFindRecipe = async () => {
    if (!profile) return
    setLoading(true)
    setError('')
    try {
      const res = await callAI('mood', { 
        mood: MOODS.find(m => m.id === selectedMood)?.label, 
        extra: extraText,
        city: profile.city,
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

  const handleSelectRecipe = (recipe: any) => {
    setActiveRecipe(recipe)
    navigate('/recipe')
  }

  if (loading) {
    return <div className="h-screen bg-[var(--color-cream)]"><LoadingKitchen /></div>
  }

  if (results.length > 0) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] p-6 pb-24">
        <div className="flex items-center gap-4 mb-8 pt-4">
          <button onClick={() => setResults([])} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20} /></button>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold">Your Mood Kitchen</h1>
        </div>
        <div className="flex flex-col gap-4">
          {results.map((r, i) => (
            <RecipeCard key={i} {...r} onClick={() => handleSelectRecipe(r)} />
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
        How are you feeling right now?
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {MOODS.map(m => (
          <MoodChip 
            key={m.id} 
            emoji={m.emoji} 
            label={m.label} 
            selected={selectedMood === m.id}
            onClick={() => setSelectedMood(m.id)}
          />
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-[var(--color-charcoal)] mb-2">Anything specific?</label>
        <input 
          type="text" 
          value={extraText}
          onChange={(e) => setExtraText(e.target.value)}
          placeholder="rainy day, feeding guests, late night..."
          className="w-full p-4 rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-saffron)] bg-white text-[var(--color-charcoal)] font-medium placeholder:text-gray-400"
        />
      </div>

      <button
        onClick={handleFindRecipe}
        disabled={!selectedMood}
        className="w-full bg-[var(--color-saffron)] text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all text-lg shadow-lg shadow-orange-200"
      >
        Find My Recipe 🍳
      </button>
    </div>
  )
}
