import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store/useUserStore'
import { ErrorToast } from '../components/ErrorToast'

const CITIES = ['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Other']
const HEALTH_CONDITIONS = [
  { id: 'diabetic', label: 'Diabetic', emoji: '\\uD83E\\uDE7A' },
  { id: 'post-workout', label: 'Post-workout', emoji: '\\uD83D\\uDCAA' },
  { id: 'sick', label: 'Sick', emoji: '\\uD83E\\uDD12' },
  { id: 'pregnant', label: 'Pregnant', emoji: '\\uD83E\\uDD30' },
  { id: 'vegan', label: 'Vegan', emoji: '\\uD83C\\uDF31' },
  { id: 'none', label: 'None', emoji: '\\u2728' },
]
const SKILLS = [
  { id: 'beginner', label: 'Beginner', desc: 'I can make chai', emoji: '\\uD83E\\uDD44' },
  { id: 'home_cook', label: 'Home Cook', desc: 'I cook daily meals', emoji: '\\uD83C\\uDF73' },
  { id: 'confident', label: 'Confident', desc: 'I try new recipes', emoji: '\\uD83D\\uDC68\\u200D\\uD83C\\uDF73' },
]

export const Onboard: React.FC = () => {
  const [step, setStep] = useState(1)
  const [city, setCity] = useState('')
  const [health, setHealth] = useState<string[]>([])
  const [skill, setSkill] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const user = useUserStore(s => s.user)
  const setProfile = useUserStore(s => s.setProfile)
  const navigate = useNavigate()

  const toggleHealth = (id: string) => {
    if (id === 'none') return setHealth(['none'])
    setHealth(prev => {
      const next = prev.filter(h => h !== 'none')
      if (next.includes(id)) return next.filter(h => h !== id)
      return [...next, id]
    })
  }

  const handleComplete = async () => {
    if (!user) return setError('Not logged in')
    setLoading(true)
    const updates = {
      city,
      health: health.includes('none') ? [] : health,
      skill,
      onboarded: true
    }
    
    const { error } = await supabase.from('profiles').update(updates).eq('user_id', user.id)
    
    if (error) {
      setLoading(false)
      return setError(error.message)
    }

    // Fetch full profile and store it
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (profile) setProfile(profile)
    
    setLoading(false)
    navigate('/home')
  }

  return (
    <div className="flex flex-col min-h-screen p-6 bg-[var(--color-cream)]">
      <ErrorToast show={!!error} message={error} onClose={() => setError('')} />
      
      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mb-8 pt-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-[var(--color-saffron)]' : i < step ? 'w-4 bg-[var(--color-turmeric)]' : 'w-4 bg-[var(--color-border)]'}`} />
        ))}
      </div>

      <div className="flex-1 max-w-[400px] w-full mx-auto">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="font-['Playfair_Display'] text-3xl font-bold mb-8 text-[var(--color-charcoal)]">What city are you in?</h1>
            <div className="flex flex-wrap gap-3">
              {CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`px-5 py-3 rounded-full font-bold border-2 transition-all ${
                    city === c 
                      ? 'bg-[var(--color-saffron)] text-white border-[var(--color-saffron)] shadow-md' 
                      : 'bg-white text-gray-600 border-[var(--color-border)] hover:border-[var(--color-saffron)]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="font-['Playfair_Display'] text-3xl font-bold mb-2 text-[var(--color-charcoal)]">Health conditions to keep in mind?</h1>
            <p className="text-gray-500 mb-8 font-medium">Select all that apply</p>
            <div className="flex flex-wrap gap-3">
              {HEALTH_CONDITIONS.map(h => {
                const isSelected = health.includes(h.id)
                return (
                  <button
                    key={h.id}
                    onClick={() => toggleHealth(h.id)}
                    className={`px-5 py-3 rounded-full font-bold border-2 transition-all flex items-center gap-2 ${
                      isSelected 
                        ? 'bg-[var(--color-green)] text-white border-[var(--color-green)] shadow-md' 
                        : 'bg-white text-gray-600 border-[var(--color-border)] hover:border-[var(--color-green)]'
                    }`}
                  >
                    <span>{h.emoji}</span> {h.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="font-['Playfair_Display'] text-3xl font-bold mb-8 text-[var(--color-charcoal)]">Your cooking skill?</h1>
            <div className="flex flex-col gap-4">
              {SKILLS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSkill(s.id)}
                  className={`flex items-center gap-5 p-5 rounded-2xl font-bold border-2 transition-all text-left ${
                    skill === s.id 
                      ? 'bg-[var(--color-turmeric)] text-white border-[var(--color-turmeric)] shadow-md scale-[1.02]' 
                      : 'bg-white text-gray-700 border-[var(--color-border)] hover:border-[var(--color-turmeric)]'
                  }`}
                >
                  <span className="text-4xl">{s.emoji}</span>
                  <div>
                    <div className={skill === s.id ? 'text-white text-lg' : 'text-[var(--color-charcoal)] text-lg'}>{s.label}</div>
                    <div className={`text-sm tracking-wide font-medium mt-1 ${skill === s.id ? 'text-orange-50' : 'text-gray-500'}`}>{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pb-4 max-w-[400px] w-full mx-auto">
        {step < 3 ? (
          <button 
            onClick={() => setStep(s => s + 1)}
            disabled={(step === 1 && !city) || (step === 2 && health.length === 0)}
            className="w-full bg-[var(--color-charcoal)] text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:bg-gray-300 transition-all text-lg shadow-xl shadow-gray-200"
          >
            Continue
          </button>
        ) : (
          <button 
            onClick={handleComplete}
            disabled={!skill || loading}
            className="w-full bg-[var(--color-saffron)] text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all text-lg shadow-xl shadow-orange-200 hover:bg-orange-600"
          >
            {loading ? 'Setting up kitchen...' : "Let's Cook!"}
          </button>
        )}
      </div>
    </div>
  )
}
