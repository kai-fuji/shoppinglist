// components/useSpeechRecognition.js - Web Speech API による音声認識フック
import { useRef, useState } from 'react'

export default function useSpeechRecognition({ onResult } = {}) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  const start = () => {
    if (typeof window === 'undefined') return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('お使いのブラウザは音声入力に対応していません。Chrome / Safariをお使いください。')
      return
    }

    const rec = new SR()
    rec.lang = 'ja-JP'
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      if (transcript && onResult) onResult(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)

    recRef.current = rec
    setListening(true)
    rec.start()
  }

  const stop = () => {
    try {
      recRef.current?.stop()
    } catch {}
    setListening(false)
  }

  return { listening, start, stop }
}
