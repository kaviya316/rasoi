import { create } from 'zustand'

export interface Recipe {
  name: string
  emoji: string
  description?: string
  time_mins?: number
  difficulty?: string
  why_for_mood?: string
  ingredients?: string[]
  ingredients_with_price?: { item: string, qty: string, price_inr: number }[]
  total_cost_inr?: number
  save_tip?: string
  uses?: string[]
  waste_tip?: string
  safety_note?: string
  urgency?: number
  steps: string[]
  cost_inr?: number
  health_badge?: string
  feature?: string
}

interface RecipeStore {
  recipes: Recipe[]
  activeRecipe: Recipe | null
  currentStep: number
  setRecipes: (r: Recipe[]) => void
  setActiveRecipe: (r: Recipe | null) => void
  nextStep: () => void
  prevStep: () => void
  resetSteps: () => void
}

export const useRecipeStore = create<RecipeStore>((set) => ({
  recipes: [],
  activeRecipe: null,
  currentStep: 0,
  setRecipes: (recipes) => set({ recipes }),
  setActiveRecipe: (activeRecipe) => {
    if (activeRecipe) {
      localStorage.setItem("active_recipe", JSON.stringify(activeRecipe))
    } else {
      localStorage.removeItem("active_recipe")
    }
    set({ activeRecipe, currentStep: 0 })
  },
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
  resetSteps: () => set({ currentStep: 0 }),
}))
