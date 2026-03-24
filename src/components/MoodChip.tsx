import React from 'react'

interface MoodChipProps {
  emoji: string
  label: string
  selected?: boolean
  onClick?: () => void
}

export const MoodChip: React.FC<MoodChipProps> = ({ emoji, label, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 border-2 w-full aspect-square ${
        selected
          ? 'bg-[var(--color-saffron)] text-white border-[var(--color-saffron)] transform scale-105 shadow-md'
          : 'bg-white border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-saffron)]'
      }`}
    >
      <span className="text-4xl mb-2">{emoji}</span>
      <span className={`font-semibold text-sm text-center leading-tight ${selected ? 'text-white' : 'text-gray-700'}`}>{label}</span>
    </button>
  )
}
