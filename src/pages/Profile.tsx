import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store/useUserStore'
import { LogOut, ChevronRight, Settings, Bookmark, Users, Flame, Info, ChefHat } from 'lucide-react'

const BADGES = [
  { id: 'Zero Waste Warrior', emoji: '\u267B\uFE0F', desc: 'Rescue 10 times' },
  { id: 'Budget Boss', emoji: '\uD83D\uDCB8', desc: 'Cook 5 budget meals' },
  { id: 'Memory Keeper', emoji: '\uD83D\uDC75', desc: 'Save 3 family recipes' },
  { id: 'Globe Trotter', emoji: '\uD83C\uDF0D', desc: 'Indianize 5 global dishes' },
  { id: 'Streak Legend', emoji: '\uD83D\uDD25', desc: '7-day streak' },
  { id: 'Century Chef', emoji: '\uD83C\uDFC6', desc: 'Cook 100 times' },
]

export const Profile: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, setProfile, setUser } = useUserStore()
  
  const [stats, setStats] = useState({ totalRecipes: 0, rescued: 0, savedInr: 0 })
  const [earnedBadges, setEarnedBadges] = useState<any[]>([])
  const [cookbook, setCookbook] = useState<any[]>([])
  const [family, setFamily] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return
    
    // Stats
    const { count: totalRecipes } = await supabase.from('cook_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const { count: rescued } = await supabase.from('cook_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('waste_saved', true)
    
    const { data: saved } = await supabase.from('saved_recipes').select('cost_inr').eq('user_id', user.id)
    const savedInr = saved?.reduce((acc, curr) => acc + (curr.cost_inr || 0), 0) || 0

    setStats({ totalRecipes: totalRecipes || 0, rescued: rescued || 0, savedInr })

    // Badges
    const { data: badges } = await supabase.from('badges').select('*').eq('user_id', user.id)
    setEarnedBadges(badges || [])

    // Cookbook
    const { data: cb } = await supabase.from('saved_recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
    setCookbook(cb || [])

    // Family
    const { data: fam } = await supabase.from('family_recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
    setFamily(fam || [])
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    navigate('/login')
  }

  const getNextLevelXP = () => {
    const xp = profile?.xp || 0
    if (xp < 200) return 200
    if (xp < 500) return 500
    if (xp < 1000) return 1000
    if (xp < 2000) return 2000
    return 5000
  }

  const nextXP = getNextLevelXP()
  const progressPct = Math.min(100, ((profile?.xp || 0) / nextXP) * 100)

  return (
    <div className="min-h-screen bg-[var(--color-cream)] pb-24">
      
      {/* Top Section */}
      <div className="bg-[var(--color-charcoal)] text-white p-6 pt-12 pb-8 rounded-b-[40px] shadow-lg relative">
        <button className="absolute top-6 right-6 text-gray-400 hover:text-white"><Settings size={24} /></button>
        
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 bg-[var(--color-saffron)] rounded-full flex items-center justify-center font-bold text-3xl shadow-lg shadow-orange-500/30 border-2 border-white/10">
            {profile?.name?.[0]?.toUpperCase() || 'Y'}
          </div>
          <div>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold mb-1">{profile?.name || 'Chef'}</h1>
            <p className="text-gray-400 text-sm font-medium flex items-center gap-1">\uD83D\uDCCD {profile?.city || 'India'}</p>
          </div>
        </div>

        <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-sm border border-white/10">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-[var(--color-turmeric)] flex items-center gap-2"><ChefHat size={16}/> {profile?.level || 'Chai Maker'}</span>
            <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full text-orange-200 gap-1 flex items-center"><Flame size={14}/> {profile?.streak_days || 0} Day Streak</span>
          </div>
          <div className="w-full bg-black/40 h-2.5 rounded-full mb-2 overflow-hidden shadow-inner flex border border-white/5">
            <div className="bg-gradient-to-r from-[var(--color-turmeric)] to-[var(--color-saffron)] h-full rounded-full transition-all" style={{ width: `${progressPct}%` }}></div>
          </div>
          <p className="text-right text-xs text-gray-400 font-bold tracking-wider">{profile?.xp || 0} / {nextXP} XP</p>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Row */}
        <div className="flex gap-3 mb-8 -mt-2">
          <div className="flex-1 bg-white p-4 rounded-3xl border border-[var(--color-border)] shadow-sm text-center">
            <div className="text-3xl font-bold text-[var(--color-charcoal)] mb-1 font-['DM_Sans'] tracking-tight">{stats.totalRecipes}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cooked</div>
          </div>
          <div className="flex-1 bg-white p-4 rounded-3xl border border-[var(--color-border)] shadow-sm text-center">
            <div className="text-3xl font-bold text-[var(--color-green)] mb-1 font-['DM_Sans'] tracking-tight">{stats.rescued}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rescued</div>
          </div>
          <div className="flex-1 bg-white p-4 rounded-3xl border border-[var(--color-border)] shadow-sm text-center">
            <div className="text-3xl font-bold text-[var(--color-saffron)] mb-1 font-['DM_Sans'] tracking-tighter">₹{stats.savedInr}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saved</div>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h2 className="font-['Playfair_Display'] text-xl font-bold mb-4 text-[var(--color-charcoal)] flex justify-between items-center">
            Awards <span className="text-xs font-bold text-[var(--color-saffron)] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full font-['DM_Sans'] uppercase tracking-wider">{earnedBadges.length} / 6 Earned</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {BADGES.map(b => {
              const earned = earnedBadges.find(eb => eb.name === b.id)
              return (
                <div key={b.id} className={`flex flex-col items-center p-4 rounded-2xl border ${earned ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 grayscale'}`}>
                  <span className="text-3xl mb-2">{earned ? b.emoji : '\uD83D\uDD12'}</span>
                  <span className="text-[10px] font-bold text-center leading-tight mt-1 text-[var(--color-charcoal)] uppercase tracking-wide">{b.id}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sections */}
        <div className="bg-white rounded-[32px] border border-[var(--color-border)] overflow-hidden shadow-sm mb-6">
          <button onClick={() => navigate('/home')} className="w-full flex items-center justify-between p-5 border-b border-dashed border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100"><Bookmark size={20}/></div>
              <div className="text-left">
                <p className="font-bold text-[var(--color-charcoal)]">My Cookbook</p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-0.5">{cookbook.length} saved recipes</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" />
          </button>
          
          <button onClick={() => navigate('/grandma')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-dashed border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100"><Users size={20}/></div>
              <div className="text-left">
                <p className="font-bold text-[var(--color-charcoal)]">Family Recipes</p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-0.5">{family.length} preserved</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" />
          </button>

          <button onClick={() => navigate('/onboard')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center shrink-0 border border-gray-200"><Info size={20}/></div>
              <div className="text-left">
                <p className="font-bold text-[var(--color-charcoal)]">Update Preferences</p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-0.5">Dietary & Location</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" />
          </button>
        </div>

        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-bold bg-white rounded-2xl border border-red-100 hover:bg-red-50 transition-colors shadow-sm">
          <LogOut size={20} /> Sign Out
        </button>

      </div>
    </div>
  )
}
