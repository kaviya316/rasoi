import React, { useEffect } from 'react'

interface XPToastProps {
  show: boolean
  xp?: number
  message?: string
  onClose: () => void
}

export const XPToast: React.FC<XPToastProps> = ({ show, xp, message, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  const displayText = message || `+${xp} XP \uD83D\uDD25`

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-[var(--color-turmeric)] text-white px-6 py-3 rounded-full shadow-lg font-bold text-lg flex items-center justify-center gap-2">
        {displayText}
      </div>
    </div>
  )
}
