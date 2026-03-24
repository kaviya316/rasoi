import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, IndianRupee, Heart, BookmarkPlus, Users, X, ChefHat } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { completeRecipe } from '../lib/ai'
import { useUserStore } from '../store/useUserStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { StepCard } from '../components/StepCard'
import { XPToast } from '../components/XPToast'

export const Recipe: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { activeRecipe, currentStep, nextStep, prevStep, resetSteps } = useRecipeStore()
  
  const [cookMode, setCookMode] = useState(false)
  const [servings, setServings] = useState(1)
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const [xpToast, setXpToast] = useState({ show: false, xp: 0, newLevel: null as any })

  if (!activeRecipe) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] p-6 flex flex-col items-center justify-center pb-24">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--color-border)]">
          <ChefHat size={40} className="text-gray-300" />
        </div>
        <h2 className="font-['Playfair_Display'] font-bold text-2xl text-[var(--color-charcoal)] mb-2">No active recipe</h2>
        <p className="text-gray-500 mb-8 text-center font-medium px-4">Discover a recipe from Mood, Budget, or Rescue to start cooking!</p>
        <button onClick={() => navigate('/home')} className="bg-[var(--color-charcoal)] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-gray-200">Back to Home</button>
      </div>
    )
  }

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const handleSave = async () => {
    if (!user) return
    await supabase.from('saved_recipes').insert({
      user_id: user.id,
      recipe_json: activeRecipe,
      feature: activeRecipe.feature || 'manual',
      cost_inr: activeRecipe.cost_inr || activeRecipe.total_cost_inr || 0
    })
    alert('Saved to your Cookbook! 📚')
  }

  const handleCookDone = async () => {
    if (!user) return
    const res = await completeRecipe({
      userId: user.id,
      recipeName: activeRecipe.name,
      feature: activeRecipe.feature || 'manual',
      wasteSaved: !!activeRecipe.waste_tip
    })
    setXpToast({ show: true, xp: res.xp, newLevel: res.level })
    setTimeout(() => {
      setCookMode(false)
      resetSteps()
      navigate('/home') // navigate back to home on successful finish
    }, 4000)
  }

  const handleCookTogether = () => {
    navigate('/together')
  }

  const extractQuantity = (itemStr: string) => {
    return itemStr.replace(/^\s*(\d*\.?\d+|\d+\/\d+)(.*?)$/, (match, numstr, rest) => {
      let num = parseFloat(numstr);
      if(numstr.includes('/')) {
        const parts = numstr.split('/');
        num = parseInt(parts[0]) / parseInt(parts[1]);
      }
      if (isNaN(num)) return match;
      return `${(num * servings).toFixed(1).replace(/\.0$/, '')}${rest}`
    })
  }

  const ingredientsList = activeRecipe.ingredients || 
    (activeRecipe.ingredients_with_price ? activeRecipe.ingredients_with_price.map((i: any) => `${i.qty} ${i.item}`) : [])

  if (cookMode) {
    return (
      <div className="min-h-screen bg-[var(--color-charcoal)] p-6 flex flex-col">
        <XPToast show={xpToast.show} xp={xpToast.xp} message={xpToast.newLevel ? `Level up! You are now a ${xpToast.newLevel} \uD83D\uDD25` : undefined} onClose={() => setXpToast({ show: false, xp: 0, newLevel: null })} />
        
        <div className="flex justify-between items-center mb-6 pt-4 text-white">
          <button onClick={() => setCookMode(false)} className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition-colors"><X size={20} /></button>
          <span className="font-bold text-sm truncate max-w-[200px] font-['Playfair_Display'] tracking-wide">{activeRecipe.name}</span>
          <div className="w-11"></div>
        </div>

        <div className="flex-1 pb-[env(safe-area-inset-bottom)] relative z-10">
          <StepCard
            stepNumber={currentStep + 1}
            totalSteps={activeRecipe.steps.length}
            text={activeRecipe.steps[currentStep]}
            onNext={nextStep}
            onPrev={prevStep}
            onDone={handleCookDone}
          />
        </div>
      </div>
    )
  }

  const checkedCount = Object.values(checkedItems).filter(Boolean).length

  return (
    <div className="min-h-screen bg-[var(--color-cream)] pb-32">
      <XPToast show={xpToast.show} xp={xpToast.xp} onClose={() => setXpToast({ show: false, xp: 0, newLevel: null })} />
      
      {/* Hero */}
      <div className="bg-white rounded-b-[40px] p-6 shadow-sm border-b border-[var(--color-border)] pt-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <button onClick={() => navigate(-1)} className="absolute top-10 left-6 p-2 bg-white rounded-full border border-[var(--color-border)] shadow-sm hover:bg-gray-50 z-10"><ArrowLeft size={20} /></button>
        
        <div className="flex flex-col items-center mt-6">
          <div className="text-7xl bg-orange-50 w-28 h-28 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-orange-100">
            {activeRecipe.emoji}
          </div>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[var(--color-charcoal)] text-center w-full leading-tight mb-5">
            {activeRecipe.name}
          </h1>
          
          <div className="flex flex-wrap gap-2 justify-center pb-4">
            {activeRecipe.time_mins && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                <Clock size={14} /> {activeRecipe.time_mins} mins
              </span>
            )}
            {(activeRecipe.cost_inr || activeRecipe.total_cost_inr) && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                <IndianRupee size={14} /> {activeRecipe.cost_inr || activeRecipe.total_cost_inr}
              </span>
            )}
            {activeRecipe.health_badge && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-saffron)] bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                <Heart size={14} /> {activeRecipe.health_badge}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeRecipe.why_for_mood && (
          <div className="bg-teal-50 border border-teal-100 text-teal-800 p-5 rounded-2xl mb-6 font-medium text-sm leading-relaxed shadow-[0_4px_12px_rgba(20,184,166,0.05)]">
            \u2728 <strong className="font-bold border-b border-teal-200 pb-0.5">Perfect for your mood</strong><br/>
            <span className="inline-block mt-2">{activeRecipe.why_for_mood}</span>
          </div>
        )}

        {/* Ingredients Checklist */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-4 px-1">
            <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--color-charcoal)]">Ingredients</h2>
            <div className="text-xs font-bold text-[var(--color-saffron)] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full uppercase tracking-wider">{checkedCount} / {ingredientsList.length} \u2713</div>
          </div>

          <div className="bg-white rounded-[24px] border border-[var(--color-border)] p-2.5 shadow-sm">
            {ingredientsList.map((item: string, idx: number) => {
              const checked = checkedItems[idx]
              return (
                <div 
                  key={idx} 
                  onClick={() => toggleCheck(idx)}
                  className={`flex items-start gap-4 p-3.5 rounded-[16px] cursor-pointer transition-all duration-200 ${checked ? 'opacity-60 bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 border-2 ${checked ? 'border-[var(--color-saffron)] bg-[var(--color-saffron)] shadow-sm' : 'border-gray-300'}`}>
                    {checked && <span className="text-white text-[10px] font-bold">\u2714\uFE0F</span>}
                  </div>
                  <span className={`font-medium text-[15px] pt-0.5 ${checked ? 'line-through text-gray-500' : 'text-[var(--color-charcoal)]'}`}>
                    {extractQuantity(item)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button onClick={handleSave} className="flex-1 bg-white border border-[var(--color-border)] py-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-[var(--color-saffron)] hover:border-[var(--color-saffron)] transition-colors shadow-sm">
            <BookmarkPlus size={24} />
            <span className="text-xs font-bold uppercase tracking-wider mt-1">Save</span>
          </button>
          <button onClick={handleCookTogether} className="flex-1 bg-white border border-[var(--color-border)] py-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-indigo-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm">
            <Users size={24} />
            <span className="text-xs font-bold uppercase tracking-wider mt-1">Together</span>
          </button>
          <div className="flex-1 bg-[var(--color-charcoal)] py-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg shadow-gray-300">
            <div className="flex gap-4 items-center">
              <button onClick={() => setServings(s => Math.max(1, s - 1))} className="text-[var(--color-turmeric)] font-bold text-xl px-2 hover:scale-110 transition-transform">-</button>
              <span className="text-[15px] font-bold text-white mb-0.5 w-6 text-center">{servings}x</span>
              <button onClick={() => setServings(s => s + 1)} className="text-[var(--color-turmeric)] font-bold text-xl px-2 hover:scale-110 transition-transform">+</button>
            </div>
            <span className="text-[10px] font-bold text-gray-400 border-t border-gray-700 uppercase tracking-widest pt-1 px-4">Servings</span>
          </div>
        </div>

      </div>

      <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-6 z-30 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <button 
          onClick={() => setCookMode(true)}
          className="w-full bg-[var(--color-saffron)] text-white font-bold py-5 rounded-2xl shadow-xl shadow-orange-200 flex justify-center items-center gap-3 text-lg pointer-events-auto hover:bg-orange-600 hover:scale-[1.02] transition-all"
        >
          <ChefHat size={24} /> Start Cooking \u2192
        </button>
      </div>
    </div>
  )
}
