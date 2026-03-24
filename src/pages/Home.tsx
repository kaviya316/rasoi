import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { callAI } from '../lib/ai'
import { useUserStore } from '../store/useUserStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { StreakBadge } from '../components/StreakBadge'
import { XPToast } from '../components/XPToast'
import { Smile, Clock, IndianRupee, Globe } from 'lucide-react'

export const Home: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile } = useUserStore()
  const { activeRecipe } = useRecipeStore()
  const [missions, setMissions] = useState<any[]>([])
  const [loadingMissions, setLoadingMissions] = useState(true)
  const [xpToast, setXpToast] = useState({ show: false, xp: 0 })

  const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'

  useEffect(() => {
    if (user && profile) {
      fetchMissions()
    }
  }, [user, profile])

  const fetchMissions = async () => {
    setLoadingMissions(true)
    const today = new Date().toISOString().split('T')[0]
    
    // Check existing missions
    const { data: existing } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', user!.id)
      .eq('mission_date', today)

    if (existing && existing.length > 0) {
      setMissions(existing)
      setLoadingMissions(false)
      return
    }

    try {
      const { data: history } = await supabase.from('cook_history').select('feature').eq('user_id', user!.id).limit(5)
      const res = await callAI('missions', { 
        city: profile!.city, 
        skill: profile!.skill, 
        history: history?.map(h => h.feature) || [] 
      })

      if (res.missions) {
        const newMissions = res.missions.map((m: any) => ({
          user_id: user!.id,
          text: m.text,
          xp_reward: m.xp,
          emoji: m.emoji,
          mission_date: today
        }))
        
        await supabase.from('missions').insert(newMissions)
        
        const { data: inserted } = await supabase
          .from('missions')
          .select('*')
          .eq('user_id', user!.id)
          .eq('mission_date', today)
        
        if (inserted) setMissions(inserted)
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingMissions(false)
  }

  const completeMission = async (mission: any) => {
    if (mission.completed) return
    
    setMissions(ms => ms.map(m => m.id === mission.id ? { ...m, completed: true } : m))
    setXpToast({ show: true, xp: mission.xp_reward })
    
    await supabase.from('missions').update({ completed: true }).eq('id', mission.id)
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] pb-24">
      <XPToast show={xpToast.show} xp={xpToast.xp} onClose={() => setXpToast({ show: false, xp: 0 })} />
      
      {/* Header */}
      <div className="bg-white rounded-b-3xl p-6 shadow-sm border-b border-[var(--color-border)] mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-gray-500 font-medium tracking-wide">Good {timeOfDay},</p>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--color-charcoal)]">
              {profile?.name?.split(' ')[0] || 'Chef'} 👋
            </h1>
          </div>
          <StreakBadge days={profile?.streak_days || 0} />
        </div>
        <div className="inline-block bg-[var(--color-turmeric)] text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
          {profile?.level || 'Chai Maker'}
        </div>
      </div>

      <div className="px-6">
        {/* Active Recipe Banner */}
        {activeRecipe && (
          <div 
            onClick={() => navigate('/recipe')}
            className="mb-8 bg-[var(--color-charcoal)] text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-gray-300 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeRecipe.emoji}</span>
              <div>
                <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-1">Continue Cooking</p>
                <p className="font-bold truncate max-w-[200px] text-[var(--color-cream)]">{activeRecipe.name}</p>
              </div>
            </div>
            <span className="font-bold text-[var(--color-saffron)] px-2">Resume →</span>
          </div>
        )}

        {/* Home Features Grid */}
        <h2 className="font-['Playfair_Display'] text-xl font-bold mb-4 text-[var(--color-charcoal)]">What's on the menu?</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div onClick={() => navigate('/mood')} className="cursor-pointer bg-gradient-to-br from-[#FF9557] to-[var(--color-saffron)] p-4 text-white rounded-2xl shadow-md h-32 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <Smile size={28} className="opacity-90" />
            <p className="font-bold text-lg leading-tight">How are you feeling?</p>
          </div>
          
          <div onClick={() => navigate('/rescue')} className="cursor-pointer bg-white border border-[var(--color-border)] p-4 rounded-2xl shadow-sm h-32 flex flex-col justify-between hover:border-[var(--color-saffron)] transition-colors">
            <Clock size={28} className="text-[#E07A5F]" />
            <p className="font-bold text-[var(--color-charcoal)] text-lg leading-tight">Rescue my leftovers</p>
          </div>
          
          <div onClick={() => navigate('/budget')} className="cursor-pointer bg-white border border-[var(--color-border)] p-4 rounded-2xl shadow-sm h-32 flex flex-col justify-between hover:border-[var(--color-saffron)] transition-colors">
            <IndianRupee size={28} className="text-[var(--color-green)]" />
            <p className="font-bold text-[var(--color-charcoal)] text-lg leading-tight">Cook under budget</p>
          </div>
          
          <div onClick={() => navigate('/global')} className="cursor-pointer bg-white border border-[var(--color-border)] p-4 rounded-2xl shadow-sm h-32 flex flex-col justify-between hover:border-[var(--color-saffron)] transition-colors">
            <Globe size={28} className="text-indigo-500" />
            <p className="font-bold text-[var(--color-charcoal)] text-lg leading-tight">Make it Indian</p>
          </div>
        </div>

        {/* Daily Missions */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="font-['Playfair_Display'] text-xl font-bold text-[var(--color-charcoal)]">Daily Missions</h2>
          <span className="text-[var(--color-saffron)] text-xs font-bold bg-orange-50 px-2 py-1 rounded">+{missions.reduce((acc, m) => !m.completed ? acc + m.xp_reward : acc, 0)} XP</span>
        </div>
        
        <div className="flex flex-col gap-3">
          {loadingMissions ? (
            <div className="animate-pulse flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-[var(--color-border)]"></div>)}
            </div>
          ) : (
            missions.map((m) => (
              <div 
                key={m.id}
                onClick={() => completeMission(m)}
                className={`flex items-center p-4 rounded-xl border ${m.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-[var(--color-border)] shadow-sm cursor-pointer hover:border-[var(--color-saffron)] transition-colors'}`}
              >
                <div className="text-2xl mr-4">{m.emoji}</div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${m.completed ? 'line-through text-gray-400' : 'text-[var(--color-charcoal)]'}`}>{m.text}</p>
                </div>
                <div className={`font-bold text-xs px-2 py-1 rounded ${m.completed ? 'text-gray-400' : 'text-[var(--color-turmeric)] bg-yellow-50'}`}>
                  {m.completed ? 'Done' : `+${m.xp_reward} XP`}
                </div>
                {!m.completed && (
                  <div className="ml-3 w-5 h-5 rounded border-2 border-[var(--color-border)]"></div>
                )}
                {m.completed && (
                  <div className="ml-3 text-[var(--color-green)]">✔️</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
