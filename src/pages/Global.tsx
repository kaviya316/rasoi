import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe2 } from 'lucide-react'
import { callAI } from '../lib/ai'
import { useUserStore } from '../store/useUserStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { LoadingKitchen } from '../components/LoadingKitchen'
import { ErrorToast } from '../components/ErrorToast'

const CUISINES = [
  { id: 'italian', label: 'Italian', flag: '\\uD83C\\uDDEE\\uD83C\\uDDF9' },
  { id: 'thai', label: 'Thai', flag: '\\uD83C\\uDDF9\\uD83C\\uDDED' },
  { id: 'mexican', label: 'Mexican', flag: '\\uD83C\\uDDF2\\uD83C\\uDDFD' },
  { id: 'japanese', label: 'Japanese', flag: '\\uD83C\\uDDEF\\uD83C\\uDDF5' },
  { id: 'french', label: 'French', flag: '\\uD83C\\uDDEB\\uD83C\\uDDF7' },
  { id: 'american', label: 'American', flag: '\\uD83C\\uDDFA\\uD83C\\uDDF8' },
  { id: 'lebanese', label: 'Lebanese', flag: '\\uD83C\\uDDF1\\uD83C\\uDDE7' },
  { id: 'korean', label: 'Korean', flag: '\\uD83C\\uDDF0\\uD83C\\uDDF7' },
  { id: 'chinese', label: 'Chinese', flag: '\\uD83C\\uDDE8\\uD83C\\uDDF3' },
]

export const Global: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useUserStore()
  const { setActiveRecipe } = useRecipeStore()
  
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [dish, setDish] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleIndianize = async () => {
    if (!profile || !selectedCuisine || !dish.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await callAI('global', { 
        cuisine: CUISINES.find(c => c.id === selectedCuisine)?.label,
        dish,
        city: profile.city
      })
      if (res.indianized_name) {
        setResult(res)
      } else {
        throw new Error('Could not transform recipe')
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    }
    setLoading(false)
  }

  if (loading) return <div className="h-screen bg-[var(--color-cream)]"><LoadingKitchen /></div>

  if (result) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] p-6 pb-24">
        <div className="flex items-center gap-4 mb-4 pt-4">
          <button onClick={() => setResult(null)} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20} /></button>
          <span className="font-bold text-gray-500 uppercase tracking-widest text-xs">Transformed</span>
        </div>
        
        <h1 className="font-['Playfair_Display'] text-3xl font-bold mb-2 leading-tight">
          <span className="text-gray-400 line-through text-xl block mb-1">{result.original_name}</span>
          {result.indianized_name}
        </h1>

        <div className="bg-white p-4 rounded-xl border border-[var(--color-border)] mb-6 mt-4 shadow-sm flex items-center justify-between">
          <span className="font-bold text-gray-600 text-sm">Authenticity Maintained</span>
          <div className="w-1/2 bg-gray-200 rounded-full h-2">
            <div className="bg-[var(--color-turmeric)] h-2 rounded-full" style={{ width: `${result.authenticity_percent}%` }}></div>
          </div>
          <span className="font-bold text-[var(--color-saffron)] text-sm">{result.authenticity_percent}%</span>
        </div>

        <h3 className="font-bold mb-3 text-lg text-[var(--color-charcoal)]">Key Substitutions</h3>
        <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden mb-6">
          {result.substitutions.map((sub: any, i: number) => (
            <div key={i} className="p-4 border-b border-[var(--color-border)] last:border-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 line-through font-medium">{sub.original}</span>
                <span className="font-bold text-[var(--color-green)] text-lg">{sub.substitute}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1 font-medium">\uD83D\uDED2 {sub.where_to_buy}</p>
              <p className="text-xs text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded font-medium">\uD83D\uDC45 {sub.taste_note}</p>
            </div>
          ))}
        </div>

        {result.fun_fact && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-8">
            <p className="text-sm text-blue-800 font-medium">\uD83D\uDCA1 {result.fun_fact}</p>
          </div>
        )}

        <button
          onClick={() => {
            setActiveRecipe({
              name: result.indianized_name,
              emoji: '\\uD83C\\uDF0D',
              steps: result.steps || [],
            })
            navigate('/recipe')
          }}
          className="w-full bg-[var(--color-saffron)] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
        >
          View Recipe Steps \u2192
        </button>
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
        Cook global with Indian ingredients
      </h1>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {CUISINES.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCuisine(c.id)}
            className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
              selectedCuisine === c.id 
                ? 'bg-indigo-50 border-indigo-500 shadow-sm transform scale-105' 
                : 'bg-white border-[var(--color-border)] hover:border-indigo-300'
            }`}
          >
            <span className="text-3xl mb-1">{c.flag}</span>
            <span className="text-xs font-bold text-gray-700">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-[var(--color-charcoal)] mb-2">Which dish?</label>
        <input 
          type="text" 
          value={dish}
          onChange={(e) => setDish(e.target.value)}
          placeholder="e.g. Pasta carbonara, Pad thai..."
          className="w-full p-4 rounded-xl border border-[var(--color-border)] focus:outline-none focus:border-indigo-500 bg-white font-medium shadow-inner shadow-gray-50"
        />
      </div>

      <button
        onClick={handleIndianize}
        disabled={!selectedCuisine || !dish.trim()}
        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all text-lg shadow-lg shadow-indigo-200 flex justify-center items-center gap-2 hover:bg-indigo-700"
      >
        <Globe2 size={24} /> Indianize It
      </button>
    </div>
  )
}
