import React, { useState, useEffect } from 'react'
import { Volume2, VolumeX, CheckCircle2 } from 'lucide-react'

interface StepCardProps {
  stepNumber: number
  totalSteps: number
  text: string
  onNext: () => void
  onPrev: () => void
  onDone?: () => void
}

export const StepCard: React.FC<StepCardProps> = ({ stepNumber, totalSteps, text, onNext, onPrev, onDone }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const isLast = stepNumber === totalSteps

  const timeMatch = text.match(/(\\d+)\\s*(min|minute|minutes)/i)
  const timerMins = timeMatch ? parseInt(timeMatch[1]) : null

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      if (!isPlaying) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.onend = () => setIsPlaying(false)
        setIsPlaying(true)
        window.speechSynthesis.speak(utterance)
      } else {
        setIsPlaying(false)
      }
    }
  }

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
        <div 
          className="h-full bg-[var(--color-saffron)] transition-all duration-300"
          style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex justify-between items-start mb-6 mt-2">
        <span className="text-sm font-bold tracking-wider text-gray-500 uppercase">
          Step {stepNumber} of {totalSteps}
        </span>
        <button onClick={handleSpeak} className="text-[var(--color-saffron)] p-2 bg-orange-50 rounded-full">
          {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <h2 className="font-['Playfair_Display'] text-2xl leading-relaxed text-[var(--color-charcoal)]">
          {text}
        </h2>
        
        {timerMins && (
          <div className="mt-8 bg-[var(--color-cream)] p-4 rounded-xl flex items-center justify-between border border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="text-2xl">\u23F3</div>
              <div>
                <p className="font-bold text-sm">Suggested Timer</p>
                <p className="text-xs text-gray-500">{timerMins} minutes</p>
              </div>
            </div>
            <button className="bg-[var(--color-charcoal)] text-white px-4 py-2 rounded-lg text-sm font-bold">
              Start
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100">
        <button 
          onClick={onPrev}
          disabled={stepNumber === 1}
          className="flex-1 py-4 font-bold rounded-xl bg-gray-50 text-gray-600 disabled:opacity-50"
        >
          Previous
        </button>
        {isLast && onDone ? (
          <button 
            onClick={onDone}
            className="flex-1 py-4 font-bold rounded-xl bg-[var(--color-green)] text-white flex items-center justify-center gap-2 shadow-md shadow-green-200"
          >
            <CheckCircle2 size={20} /> Done!
          </button>
        ) : (
          <button 
            onClick={onNext}
            className="flex-1 py-4 font-bold rounded-xl bg-[var(--color-saffron)] text-white shadow-md shadow-orange-200"
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  )
}
