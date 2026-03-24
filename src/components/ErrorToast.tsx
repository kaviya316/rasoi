import React, { useEffect } from 'react'

interface ErrorToastProps {
  show: boolean
  message: string
  onClose: () => void
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ show, message, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-[400px]">
      <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg font-medium text-sm flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span>\u26A0\uFE0F</span>
          <span className="leading-tight">{message}</span>
        </div>
        <button onClick={onClose} className="opacity-80 hover:opacity-100 ml-4">\u2715</button>
      </div>
    </div>
  )
}
