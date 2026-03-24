import React from 'react'

export const LoadingKitchen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[50vh]">
      <div className="relative w-32 h-32 mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-bounce">
          <path d="M20,50 Q50,90 80,50 Z" fill="var(--color-saffron)" />
          <path d="M10,50 L90,50" stroke="var(--color-charcoal)" strokeWidth="6" strokeLinecap="round" />
          <path d="M30,50 L30,40" stroke="var(--color-charcoal)" strokeWidth="4" />
          <path d="M50,50 L50,30" stroke="var(--color-charcoal)" strokeWidth="4" />
          <path d="M70,50 L70,35" stroke="var(--color-charcoal)" strokeWidth="4" />
          <circle cx="30" cy="20" r="4" fill="var(--color-turmeric)" className="animate-ping" style={{ animationDelay: '0ms' }} />
          <circle cx="50" cy="10" r="6" fill="var(--color-turmeric)" className="animate-ping" style={{ animationDelay: '300ms' }} />
          <circle cx="70" cy="15" r="5" fill="var(--color-turmeric)" className="animate-ping" style={{ animationDelay: '600ms' }} />
        </svg>
      </div>
      <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--color-charcoal)] mb-2">
        Rasoi is cooking...
      </h3>
      <p className="text-gray-500 font-['DM_Sans']">Crafting your perfect Indian recipe.</p>
    </div>
  )
}
