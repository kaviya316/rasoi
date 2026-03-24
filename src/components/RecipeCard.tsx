import React from 'react'
import { Clock, IndianRupee, Heart, BookmarkPlus } from 'lucide-react'

export interface RecipeCardProps {
  name: string
  emoji: string
  time_mins?: number
  cost_inr?: number
  health_badge?: string
  why_for_mood?: string
  waste_tip?: string
  urgency?: number
  onClick?: () => void
  onSave?: (e: React.MouseEvent) => void
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  name, emoji, time_mins, cost_inr, health_badge, why_for_mood, waste_tip, urgency, onClick, onSave
}) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-[var(--color-border)] cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden flex flex-col gap-3"
    >
      {(urgency === 1) && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
          High Urgency
        </div>
      )}
      
      <div className="flex gap-4 items-start">
        <div className="text-5xl bg-orange-50 w-20 h-20 rounded-xl flex items-center justify-center shrink-0">
          {emoji}
        </div>
        <div className="flex-1 pt-1">
          <h3 className="font-['Playfair_Display'] text-xl font-bold leading-tight mb-2 text-[var(--color-charcoal)]">{name}</h3>
          
          <div className="flex flex-wrap gap-2">
            {time_mins && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                <Clock size={12} /> {time_mins}m
              </span>
            )}
            {cost_inr && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md">
                <IndianRupee size={12} /> {cost_inr}
              </span>
            )}
            {health_badge && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-saffron)] bg-orange-50 px-2 py-1 rounded-md">
                <Heart size={12} /> {health_badge}
              </span>
            )}
          </div>
        </div>
      </div>

      {why_for_mood && (
        <div className="bg-teal-50 text-teal-800 text-xs px-3 py-2 rounded-lg mt-1 font-medium pb-2 pt-2 text-left">
          \u2728 {why_for_mood}
        </div>
      )}

      {waste_tip && (
        <div className="bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-lg mt-1 font-medium border border-amber-100 text-left">
          \u267B\uFE0F {waste_tip}
        </div>
      )}

      {onSave && (
        <button 
          onClick={onSave}
          className="absolute bottom-4 right-4 text-gray-400 hover:text-[var(--color-saffron)]"
        >
          <BookmarkPlus size={20} />
        </button>
      )}
    </div>
  )
}
