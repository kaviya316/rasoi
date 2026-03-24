import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store/useUserStore'
import { ChefHat } from 'lucide-react'
import { ErrorToast } from '../components/ErrorToast'

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const { setUser } = useUserStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        checkProfile(session.user.id)
      }
    })
  }, [])

  const checkProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (profile && !profile.onboarded) {
      navigate('/onboard')
    } else {
      navigate('/home')
    }
  }

  const handleSendOtp = async () => {
    if (phone.length !== 10) return setError('Please enter a valid 10-digit number')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`
    })
    setLoading(false)
    if (error) setError(error.message)
    else setStep('otp')
  }

  const handleVerifyOtp = async () => {
    const token = otp.join('')
    if (token.length !== 6) return setError('Please enter 6-digit OTP')
    
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token,
      type: 'sms'
    })
    setLoading(false)
    
    if (error) {
      setError(error.message)
    } else if (data.session) {
      setUser(data.session.user)
      checkProfile(data.session.user.id)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex flex-col min-h-screen p-6 bg-[var(--color-cream)]">
      <ErrorToast show={!!error} message={error} onClose={() => setError('')} />
      
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <div className="w-24 h-24 bg-[var(--color-saffron)] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-200">
          <ChefHat size={48} color="white" />
        </div>
        <h1 className="font-['Playfair_Display'] text-4xl font-bold mb-2 text-[var(--color-charcoal)]">Rasoi</h1>
        <p className="text-gray-600 font-medium mb-12">Your AI-powered Indian kitchen</p>

        {step === 'phone' ? (
          <div className="w-full max-w-sm">
            <div className="relative mb-4">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-500 font-bold border-r border-gray-200 pr-2">
                <span>\ud83c\uddee\ud83c\uddf3</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\\D/g, '').slice(0, 10))}
                className="w-full pl-24 pr-4 py-4 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-saffron)] bg-white text-lg tracking-wide font-bold"
                placeholder="00000 00000"
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading || phone.length !== 10}
              className="w-full bg-[var(--color-saffron)] text-white font-bold py-4 rounded-xl shadow-md shadow-orange-200 hover:bg-orange-600 disabled:opacity-50 transition-all text-lg mb-6"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            
            <div className="relative flex items-center py-5">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">or continue with</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-700 font-bold py-4 rounded-xl border-2 border-[var(--color-border)] hover:bg-gray-50 flex items-center justify-center gap-3 transition-all"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="google" />
              Google
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center">
            <h2 className="font-bold text-xl mb-2 text-[var(--color-charcoal)]">Enter Verification Code</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">We've sent a 6-digit code to +91 {phone}</p>
            
            <div className="flex gap-2 mb-8 w-full justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 bg-white border-2 border-[var(--color-border)] rounded-xl text-center text-2xl font-bold focus:outline-none focus:border-[var(--color-saffron)] focus:ring-1 focus:ring-[var(--color-saffron)] transition-all"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-[var(--color-saffron)] text-white font-bold py-4 rounded-xl shadow-md shadow-orange-200 hover:bg-orange-600 disabled:opacity-50 transition-all text-lg mb-4"
            >
              {loading ? 'Verifying...' : 'Verify & Enter'}
            </button>

            <button onClick={() => setStep('phone')} className="text-[var(--color-saffron)] font-bold text-sm">
              Wait, I need to change my number
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
