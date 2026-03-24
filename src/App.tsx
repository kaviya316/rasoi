import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useUserStore } from './store/useUserStore'

import { Login } from './pages/Login'
import { Onboard } from './pages/Onboard'
import { Home } from './pages/Home'
import { Mood } from './pages/Mood'
import { Budget } from './pages/Budget'
import { Rescue } from './pages/Rescue'
import { Global } from './pages/Global'
import { Grandma } from './pages/Grandma'
import { Together } from './pages/Together'
import { Recipe } from './pages/Recipe'
import { Profile } from './pages/Profile'

import { BottomNav } from './components/BottomNav'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUserStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const hideNavPaths = ['/', '/login', '/onboard']
  const hideNav = hideNavPaths.includes(location.pathname)

  return (
    <div className="relative min-h-screen">
      {children}
      {!hideNav && <BottomNav />}
    </div>
  )
}

const AppRoutes = () => {
  const { setUser, setProfile } = useUserStore()

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session) {
        supabase.from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data)
          })
      }
    })
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboard" element={<ProtectedRoute><Onboard /></ProtectedRoute>} />
      
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/mood" element={<ProtectedRoute><Mood /></ProtectedRoute>} />
      <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
      <Route path="/rescue" element={<ProtectedRoute><Rescue /></ProtectedRoute>} />
      <Route path="/global" element={<ProtectedRoute><Global /></ProtectedRoute>} />
      <Route path="/grandma" element={<ProtectedRoute><Grandma /></ProtectedRoute>} />
      <Route path="/together" element={<ProtectedRoute><Together /></ProtectedRoute>} />
      <Route path="/recipe" element={<ProtectedRoute><Recipe /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <AppRoutes />
      </Layout>
    </BrowserRouter>
  )
}

export default App
