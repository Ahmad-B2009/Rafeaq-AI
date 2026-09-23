import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'RafeaqAIBot'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Login() {
  const nav = useNavigate()
  const [method, setMethod] = useState('telegram')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState('phone') // phone | code
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [serverCode, setServerCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const inputsRef = useRef([])

  // Google
  useEffect(() => {
    if (method!== 'google' ||!GOOGLE_CLIENT_ID) return
    if (document.getElementById('google-sdk')) return
    const s = document.createElement('script')
    s.id = 'google-sdk'
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => {
          try {
            const p = JSON.parse(atob(res.credential.split('.')[1]))
            localStorage.setItem('rafeaq_user', p.email)
            localStorage.setItem('rafeaq_name', p.name)
            localStorage.setItem('rafeaq_token', 'google_' + p.sub)
            nav('/dashboard')
          } catch {}
        }
      })
      window.google?.accounts.id.renderButton(document.getElementById('googleBtn'), {
        theme: 'outline', size: 'large', shape: 'pill', width: 360, text: 'continue_with'
      })
    }
    document.body.appendChild(s)
  }, [method])

  // Timer إعادة الإرسال
  useEffect(() => {
    if (resendTimer === 0) return
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const validPhone = phone.replace(/\D/g, '').length >= 9

  async function sendCode(isResend = false) {
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 9) { setError('رقم ليبي لازم 9 أرقام - مثال 91xxxxxxxx'); return }
    setError(''); setLoading(true)
    const newCode = Math.floor(100000 + Math.random() * 900000).toString()
    setServerCode(newCode)

    try {
      const r = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode, phone: '+218' + clean, attempt: isResend? 2 : 1 })
      })
      const d = await r.json()
      if (!d.success) {
        setError(d.message)
        // لو ما لقاش chat_id، ما نمشوش للخطوة الجاية
        if (d.needStart) { setLoading(false); return }
      }
      setStep('code')
      setResendTimer(60)
      setCode(['', '', '', '', '', ''])
      setTimeout(() => inputsRef.current[0]?.focus(), 300)
      console.log('TEST CODE (لو البوت ما يخدمش):', newCode)
    } catch (e) {
      // لو السيرفر طايح، نمشو للكود باش ما نوقفوش المستخدم
      setStep('code')
      setResendTimer(60)
    }
    setLoading(false)
  }

  function checkCode(fullCode) {
    if (fullCode === serverCode) {
      localStorage.setItem('rafeaq_user', '+218' + phone)
      localStorage.setItem('rafeaq_token', 'tg_' + Date.now())
      nav('/dashboard')
    } else if (fullCode.length === 6) {
      setError('الكود غلط، جرب مرة تانية')
    }
  }

  return (
    <div className="min-h-screen flex bg-[#FAFAF8]" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');*{font-family:'Tajawal',sans-serif}`}</style>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w- bg-white rounded- border border-black/5 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
          <h1 className="text- font-[800]">مرحبا في رفيق 👋</h1>
          <p className="text- opacity-60 mt-1">ادخل باش تكمل مع مساعدك الذكي</p>

          <div className="flex mt-6 p-1 bg-[#F5F5F4] rounded-full">
            <button onClick={() => setMethod('telegram')} className={`flex-1 h- rounded-full text- font-bold transition-all ${method === 'telegram'? 'bg-[#229ED9] text-white shadow' : 'text-black/60'}`}>✈ تيليجرام</button>
            <button onClick={() => setMethod('google')} className={`flex-1 h- rounded-full text- font-bold transition-all ${method === 'google'? 'bg-black text-white shadow' : 'text-black/60'}`}>G جيميل</button>
          </div>

          {method === 'google'? (
            <div className="mt-8">
              {!GOOGLE_CLIENT_ID && <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-">⚠️ VITE_GOOGLE_CLIENT_ID مش موجود في Vercel Env</div>}
              <div id="googleBtn" className="flex justify-center mt-4 min-h-"></div>
              <p className="text- opacity-50 text-center mt-4">لازم تضيف https://rafeaq-ai.vercel.app في Google Cloud Console</p>
            </div>
          ) : step === 'phone'? (
            <div className="mt-8 space-y-4">
              <div>
                <label className="text- font-bold">رقم تيليجرام <span className="text-red-500">*</span></label>
                <div className="mt-2 flex gap-2">
                  <div className="h- px-4 rounded- border bg-[#FAFAF8] flex items-center text- font-bold">🇱🇾 +218</div>
                  <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="912345678" className="flex-1 h- rounded- border border-black/10 px-4 text- outline-none focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/20" autoFocus />
                </div>
              </div>
              {error && <div className="p-3 rounded- bg-red-50 border border-red-200 text- text-red-700 whitespace-pre-line leading-6">{error}</div>}
              <button onClick={() => sendCode(false)} disabled={!validPhone || loading} className="w-full h- rounded-full bg-[#229ED9] text-white font-bold disabled:opacity-30 hover:bg-[#1C8BC0] transition-all">
                {loading? 'جاري الإرسال...' : 'إرسال الكود ✈'}
              </button>
              <div className="p-3 rounded- bg-[#F0F9FF] border text-">💡 لازم تكون داير <b>/start</b> في <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" className="text-[#229ED9] underline">@{BOT_USERNAME}</a> ومشارك رقمك</div>
            </div>
          ) : (
            <div className="mt-8">
              <div className="flex justify-between"><span className="text- font-bold">كود من 6 أرقام</span><span className="text- bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded-full">+218{phone}</span></div>
              {error && <div className="mt-3 p-2 rounded- bg-red-50 text- text-red-600">{error}</div>}
              <div className="mt-4 flex gap-2 justify-center" dir="ltr">
                {code.map((c, i) => (
                  <input key={i} ref={el => inputsRef.current[i] = el} value={c} onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(-1)
                    const n = [...code]; n[i] = v; setCode(n)
                    if (v && i < 5) inputsRef.current[i + 1]?.focus()
                    const full = n.join(''); if (full.length === 6) checkCode(full)
                  }} onKeyDown={e => { if (e.key === 'Backspace' &&!code[i] && i > 0) inputsRef.current[i - 1]?.focus() }}
                    className="w- h- rounded- border text-center text- font-bold outline-none focus:border-[#229ED9] focus:ring-2 focus:ring-[#229ED9]/20" />
                ))}
              </div>
              <button onClick={() => checkCode(code.join(''))} className="w-full mt-6 h- rounded-full bg-black text-white font-bold">تأكيد ✓</button>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setStep('phone')} className="flex-1 h- rounded-full border text-">تعديل الرقم</button>
                <button onClick={() => sendCode(true)} disabled={resendTimer > 0} className="flex-1 h- rounded-full border text- disabled:opacity-40">
                  {resendTimer > 0? `إعادة بعد ${resendTimer}s` : 'إعادة الإرسال'}
                </button>
              </div>
              <div className="mt-3 text- opacity-40 text-center">كود التجربة: {serverCode}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}