import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { completeRecipe } from '../lib/ai'
import { useUserStore } from '../store/useUserStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { useRoomStore } from '../store/useRoomStore'
import { StepCard } from '../components/StepCard'
import { ErrorToast } from '../components/ErrorToast'
import { XPToast } from '../components/XPToast'

export const Together: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile } = useUserStore()
  const { activeRecipe, setActiveRecipe } = useRecipeStore()
  const room = useRoomStore()
  
  const [inputCode, setInputCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [xpToast, setXpToast] = useState({ show: false, xp: 0 })
  const [emojiFloat, setEmojiFloat] = useState<string | null>(null)
  
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    if (room.roomCode && activeRecipe && profile) {
      const ch = supabase.channel(`room:${room.roomCode}`, {
        config: { broadcast: { self: true } }
      })
      
      ch.on('broadcast', { event: 'step_update' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          room.updatePartner({ name: payload.name, step: payload.step })
        }
      })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setEmojiFloat(payload.emoji)
          setTimeout(() => setEmojiFloat(null), 2000)
        }
      })
      .on('broadcast', { event: 'ready' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          room.setPartnerReady(true)
        }
      })
      .subscribe()
      
      setChannel(ch)
      
      return () => {
        supabase.removeChannel(ch)
      }
    }
  }, [room.roomCode, activeRecipe, profile])

  const handleCreateRoom = async () => {
    if (!activeRecipe || !user) return setError('Please select a recipe first from Home or anywhere else.')
    setLoading(true)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { error } = await supabase.from('cook_rooms').insert({
      room_code: code,
      recipe_json: activeRecipe,
      created_by: user.id,
      participants: [user.id]
    })
    setLoading(false)
    if (error) setError(error.message)
    else room.setRoom(code)
  }

  const handleJoinRoom = async () => {
    if (!inputCode || !user) return
    setLoading(true)
    const { data: rm, error } = await supabase.from('cook_rooms').select('*').eq('room_code', inputCode.toUpperCase()).single()
    if (error || !rm) {
      setError('Room not found or invalid code')
      setLoading(false)
      return
    }
    
    const parts = rm.participants || []
    if (!parts.includes(user.id)) {
      await supabase.from('cook_rooms').update({ participants: [...parts, user.id] }).eq('id', rm.id)
    }
    
    setActiveRecipe(rm.recipe_json)
    room.setRoom(rm.room_code)
    setLoading(false)
  }

  const handleNextStep = () => {
    const next = useRecipeStore.getState().currentStep + 1
    useRecipeStore.setState({ currentStep: next })
    room.setPartnerReady(false)
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'step_update',
        payload: { userId: user?.id, name: profile?.name, step: next }
      })
    }
  }

  const handlePrevStep = () => {
    const prev = Math.max(0, useRecipeStore.getState().currentStep - 1)
    useRecipeStore.setState({ currentStep: prev })
    room.setPartnerReady(false)
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'step_update',
        payload: { userId: user?.id, name: profile?.name, step: prev }
      })
    }
  }
  
  const handleReady = () => {
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'ready',
        payload: { userId: user?.id }
      })
    }
  }

  const handleReaction = (emoji: string) => {
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { userId: user?.id, emoji }
      })
    }
    setEmojiFloat(emoji)
    setTimeout(() => setEmojiFloat(null), 2000)
  }

  const handleDone = async () => {
    if (!user || !activeRecipe) return
    await completeRecipe({
      userId: user.id,
      recipeName: activeRecipe.name,
      feature: activeRecipe.feature || 'together'
    })
    setXpToast({ show: true, xp: 75 }) // custom logic per spec
    if (channel) {
      await supabase.from('cook_rooms').update({ status: 'done' }).eq('room_code', room.roomCode)
    }
    setTimeout(() => {
      room.setRoom(null)
      navigate('/home')
    }, 4000)
  }

  if (room.roomCode && activeRecipe) {
    const currentStepIndex = useRecipeStore.getState().currentStep
    const totalSteps = activeRecipe.steps.length

    return (
      <div className="min-h-screen bg-[var(--color-cream)] p-6 pb-24 relative overflow-hidden">
        {emojiFloat && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl animate-bounce z-50 pointer-events-none drop-shadow-xl" key={Date.now()}>
            {emojiFloat}
          </div>
        )}
        <XPToast show={xpToast.show} xp={xpToast.xp} message={`You cooked together! +${xpToast.xp} XP 🎉`} onClose={() => setXpToast({ show: false, xp: 0 })} />
        
        <div className="flex justify-between items-center mb-6 pt-4">
          <button onClick={() => room.setRoom(null)} className="font-bold text-gray-500 text-sm bg-white px-4 py-2 rounded-full border border-[var(--color-border)] shadow-sm">Leave Room</button>
          <div className="bg-orange-100 text-[var(--color-saffron)] font-mono font-bold px-4 py-2 rounded-full border border-orange-200">
            {room.roomCode}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-3xl border border-[var(--color-border)] shadow-sm">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-[var(--color-charcoal)] text-white rounded-full flex items-center justify-center font-bold text-xl mb-1 shadow-inner">
              {(profile?.name || 'Y')[0].toUpperCase()}
            </div>
            <span className="text-xs font-bold w-16 text-center text-[var(--color-charcoal)] truncate">You</span>
            <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 rounded-full">Step {currentStepIndex + 1}</span>
          </div>
          
          <div className="flex-1 flex flex-col items-center px-4">
            <span className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Reactions</span>
            <div className="flex gap-1.5 bg-gray-50 p-2 rounded-2xl border border-gray-100">
              {['👍', '🔥', '😅', '✅'].map(e => (
                <button key={e} onClick={() => handleReaction(e)} className="text-xl bg-white p-2 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transform hover:scale-110 transition-all">
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center relative">
            {room.partnerReady && (
              <div className="absolute -top-1 -right-1 bg-[var(--color-green)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 border-2 border-white shadow-sm">
                Ready!
              </div>
            )}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mb-1 border-2 transition-colors ${room.partnerName ? 'bg-indigo-50 text-indigo-500 border-indigo-200 shadow-inner' : 'bg-gray-50 text-gray-300 border-dashed border-gray-300'}`}>
              {room.partnerName ? room.partnerName[0].toUpperCase() : '?'}
            </div>
            <span className="text-xs font-bold w-16 text-center text-[var(--color-charcoal)] truncate">{room.partnerName || 'Waiting...'}</span>
            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-50 px-2 rounded-full">
              {room.partnerName ? `Step ${room.partnerStep + 1}` : '---'}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <StepCard
            stepNumber={currentStepIndex + 1}
            totalSteps={totalSteps}
            text={activeRecipe.steps[currentStepIndex]}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            onDone={handleDone}
          />
        </div>

        {!room.partnerReady && currentStepIndex < totalSteps - 1 && room.partnerName && (
          <button onClick={handleReady} className="w-full mt-4 border-2 border-[var(--color-green)] bg-white text-[var(--color-green)] font-bold py-4 rounded-xl shadow-sm hover:bg-green-50 transition-colors">
            {room.partnerName.split(' ')[0]} is waiting — I'm Ready ✅
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] p-6 pb-24 flex flex-col items-center justify-center -mt-10">
      <ErrorToast show={!!error} message={error} onClose={() => setError('')} />
      
      <div className="absolute top-6 left-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm border border-[var(--color-border)]"><ArrowLeft size={20} /></button>
      </div>

      <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 border border-indigo-100 shadow-inner">
        <Users size={40} className="text-indigo-500" />
      </div>

      <h1 className="font-['Playfair_Display'] text-3xl font-bold mb-2 text-[var(--color-charcoal)] text-center">Cook Together</h1>
      <p className="text-gray-500 text-center mb-10 w-4/5 font-medium">Sync your cooking steps in real-time with family or friends.</p>

      {activeRecipe ? (
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="w-full max-w-sm bg-[var(--color-charcoal)] text-white font-bold py-4 rounded-xl shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all text-lg mb-8"
        >
          {loading ? 'Starting...' : 'Start Cooking Together 🍳'}
        </button>
      ) : (
        <div className="w-full max-w-sm bg-orange-50 text-orange-800 p-4 rounded-xl border border-orange-200 mb-8 font-medium text-sm text-center">
          Open a recipe from Home or Cookbook then tap "Together" to create a room.
        </div>
      )}

      <div className="relative flex items-center py-2 w-full max-w-sm">
        <div className="flex-grow border-t border-[var(--color-border)]"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">or Join</span>
        <div className="flex-grow border-t border-[var(--color-border)]"></div>
      </div>

      <div className="w-full max-w-sm mt-6 bg-white p-6 rounded-3xl border border-[var(--color-border)] shadow-sm">
        <label className="block text-sm font-bold text-[var(--color-charcoal)] mb-3 text-center">Enter Room Code</label>
        <input 
          type="text" 
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          maxLength={6}
          placeholder="ABCDEF"
          className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--color-border)] focus:outline-none focus:border-indigo-500 font-mono text-center text-3xl uppercase tracking-[0.3em] font-bold mb-6 bg-gray-50 text-[var(--color-charcoal)] placeholder:text-gray-300"
        />
        <button
          onClick={handleJoinRoom}
          disabled={inputCode.length < 5 || loading}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 flex justify-center items-center gap-2"
        >
          {loading ? 'Joining...' : 'Join Room \u2192'}
        </button>
      </div>
    </div>
  )
}
