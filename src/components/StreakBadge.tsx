import React from 'react'

interface StreakBadgeProps {
  days: number
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ days }) => {
  if (days === 0) return null

  return (
    <div className="flex items-center gap-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-600 px-3 py-1 rounded-full border border-orange-200 shadow-sm font-bold text-sm">
      <span className="text-base">\uD83D\uDD25</span> {days} {days === 1 ? 'day' : 'days'}
    </div>
  )
}
