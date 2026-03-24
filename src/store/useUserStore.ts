import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  user_id: string
  name: string | null
  city: string | null
  health: string[]
  skill: string
  xp: number
  level: string
  streak_days: number
  last_cooked_at: string | null
  onboarded: boolean
  created_at: string
}

interface UserStore {
  user: User | null
  profile: Profile | null
  setUser: (u: User | null) => void
  setProfile: (p: Profile | null) => void
  updateXP: (xp: number, level: string) => void
  updateStreak: (streak: number) => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  updateXP: (xp, level) => set((state) => ({
    profile: state.profile ? { ...state.profile, xp, level } : null
  })),
  updateStreak: (streak) => set((state) => ({
    profile: state.profile ? { ...state.profile, streak_days: streak } : null
  })),
}))
