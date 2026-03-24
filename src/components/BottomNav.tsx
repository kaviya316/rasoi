import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ChefHat, BookHeart, Users, UserRound } from 'lucide-react'

export const BottomNav: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { label: 'Home', path: '/home', icon: <Home size={24} /> },
    { label: 'Cook', path: '/recipe', icon: <ChefHat size={24} /> },
    { label: 'Grandma', path: '/grandma', icon: <BookHeart size={24} /> },
    { label: 'Together', path: '/together', icon: <Users size={24} /> },
    { label: 'Profile', path: '/profile', icon: <UserRound size={24} /> },
  ]

  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/onboard') {
    return null
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[var(--color-border)] px-6 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex justify-between items-center z-40 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-[var(--color-saffron)]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {React.cloneElement(tab.icon, { color: isActive ? 'var(--color-saffron)' : 'currentColor' })}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
