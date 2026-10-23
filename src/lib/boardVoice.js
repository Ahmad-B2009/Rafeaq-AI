// src/lib/boardVoice.js
// صوت أستاذ السبورة.
// الافتراضي: صوت المتصفح (speechSynthesis) باللغة العربية إن توفر على الجهاز.
// لربط نموذج صوتي لاحقاً (مثل TTS من خادم): استدعِ setVoiceProvider مرة واحدة عند بدء التطبيق:
//
//   setVoiceProvider(async (text, { teacher, signal, onLevel }) => {
//     const audio = new Audio(await fetchTtsUrl(text, teacher))   // رابط الصوت من نموذجك
//     signal.addEventListener('abort', () => audio.pause())
//     await audio.play()
//     await new Promise((done) => (audio.onended = done))          // انتهي عند انتهاء الصوت
//   })
//
// تستطيع استدعاء onLevel(0..1) أثناء التشغيل لتتحرك أضواء السبورة مع علو الصوت فعلياً.

let provider = null

export function setVoiceProvider(fn) {
  provider = typeof fn === 'function' ? fn : null
}

export function voiceAvailable() {
  return !!provider || (typeof window !== 'undefined' && 'speechSynthesis' in window)
}

// ينظف الرموز الاتجاهية قبل النطق
export function cleanForSpeech(text = '') {
  return String(text)
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/[=]/g, ' يساوي ')
    .replace(/[+]/g, ' زائد ')
    .replace(/[−-]/g, ' ناقص ')
    .replace(/[×*]/g, ' ضرب ')
    .replace(/[÷/]/g, ' قسمة ')
    .replace(/\s+/g, ' ')
    .trim()
}

function arabicVoice() {
  const list = window.speechSynthesis.getVoices?.() || []
  return list.find((v) => /^ar/i.test(v.lang)) || null
}

// يرجع { done: Promise, cancel() }. done يُحلّ عند انتهاء الكلام أو إلغائه أو تعذره.
export function speak(text, { teacher, onLevel } = {}) {
  const spoken = cleanForSpeech(text)
  const ctrl = new AbortController()
  let finished = false
  let cleanup = () => {}

  const done = new Promise((resolve) => {
    const finish = () => {
      if (finished) return
      finished = true
      cleanup()
      resolve()
    }
    ctrl.signal.addEventListener('abort', finish)

    if (provider) {
      provider(spoken, { teacher, signal: ctrl.signal, onLevel }).catch(() => {}).then(finish)
      return
    }

    if (!('speechSynthesis' in window) || !spoken) {
      finish()
      return
    }

    const synth = window.speechSynthesis
    synth.cancel()
    const u = new SpeechSynthesisUtterance(spoken)
    const v = arabicVoice()
    if (v) u.voice = v
    u.lang = v?.lang || 'ar-SA'
    u.rate = teacher?.rate || 0.95
    u.pitch = teacher?.pitch || 1
    // كل كلمة تنطق تعطي نبضة لأضواء السبورة
    u.onboundary = () => onLevel?.(0.55 + Math.random() * 0.45)
    u.onend = finish
    u.onerror = finish
    // بعض المتصفحات لا ترسل onend أبداً: مهلة أمان تقديرية
    const guard = setTimeout(finish, Math.max(3000, spoken.length * 140))
    cleanup = () => clearTimeout(guard)
    synth.speak(u)
  })

  return {
    done,
    cancel() {
      ctrl.abort()
      if (!provider) window.speechSynthesis?.cancel?.()
    },
  }
}

export function pauseVoice() {
  if (!provider) window.speechSynthesis?.pause?.()
}
export function resumeVoice() {
  if (!provider) window.speechSynthesis?.resume?.()
}
