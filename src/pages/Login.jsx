import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'RafeaqAIBot'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Login() {
  const nav = useNavigate()
  const [method, setMethod] = useState('telegram')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState('phone')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [serverCode, setServerCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const refs = useRef([])
  const fullPhone = '+218' + phone.replace(/\D/g, '')
  const isValid = phone.replace(/\D/g, '').length >= 9

  useEffect(() => {
    if (timer === 0) return
    const t = setTimeout(() => setTimer(timer - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  useEffect(() => {
    if (method !== 'google' || !GOOGLE_CLIENT_ID) return
    if (document.getElementById('g-sdk')) return
    const s = document.createElement('script')
    s.id = 'g-sdk'
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (r) => {
            try {
              const p = JSON.parse(atob(r.credential.split('.')[1]))
              localStorage.setItem('rafeaq_user', p.email)
              localStorage.setItem('rafeaq_name', p.name)
              localStorage.setItem('rafeaq_token', 'google_' + p.sub)
              nav('/dashboard')
            } catch {}
          }
        })
        const el = document.getElementById('googleBtn')
        if (el) window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', width: 360, text: 'continue_with' })
      } catch {}
    }
    document.body.appendChild(s)
  }, [method, nav])

  async function sendCode(isResend=false) {
    const clean = phone.replace(/\D/g,'')
    if (clean.length < 9) { setError('رقم الهاتف لازم 9 ارقام - مثال: 912345678'); return }
    setError(''); setLoading(true)
    const c = Math.floor(100000 + Math.random() * 900000).toString()
    setServerCode(c)
    try {
      const res = await fetch('/api/send-code', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code:c, phone:fullPhone, attempt: isResend?2:1 }) })
      const d = await res.json()
      if (!d.success) { setError(d.message); if(d.needStart){ setLoading(false); return } }
      setStep('code'); setTimer(60); setCode(['','','','','','']); setTimeout(()=>refs.current[0]?.focus(),250)
    } catch { setStep('code'); setTimer(60) }
    setLoading(false)
  }

  function onCodeChange(v,i){
    const val = v.replace(/\D/g,'').slice(-1)
    const next=[...code]; next[i]=val; setCode(next)
    if(val && i<5) refs.current[i+1]?.focus()
    const full=next.join(''); if(full.length===6) verify(full)
  }

  function verify(full){
    if(full===serverCode){ localStorage.setItem('rafeaq_user',fullPhone); localStorage.setItem('rafeaq_token','tg_'+Date.now()); nav('/dashboard') }
    else if(full.length===6) setError('الكود غير صحيح، تأكد من الكود في تيليجرام')
  }

  return (
    <div className="min-h-screen w-full flex bg-[#fcfcf9] text-zinc-900" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif}`}</style>
      <div className="hidden lg:flex w-[46%] bg-[#0a0a0a] text-white relative flex-col justify-between p-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#229ED9] rounded-full blur-[120px] opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-extrabold">ر</div><span className="font-bold text-[18px]">Rafeaq AI</span></div>
          <div className="mt-28"><h1 className="text-[42px] font-extrabold leading-[0.95]">مساعدك الذكي<br/>لادارة اعمالك.</h1><p className="mt-5 text-[15px] leading-7 text-white/60 max-w-[380px]">رفيق يجمع بين تيليجرام وذكاء اصطناعي متكامل.</p></div>
        </div>
        <div className="relative z-10 text-[11px] text-white/30">© 2026 Rafeaq AI</div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-[32px] border border-zinc-200/80 shadow-[0_20px_80px_rgba(0,0,0,0.06)] p-7 md:p-8">
            <h2 className="text-[26px] font-extrabold">مرحبا بعودتك</h2>
            <p className="text-[13px] text-zinc-500 mt-2">سجل دخولك للوصول الى لوحة التحكم</p>
            <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-full">
              <button onClick={()=>setMethod('telegram')} className={`h-[44px] rounded-full text-[13px] font-bold transition-all ${method==='telegram'?'bg-zinc-900 text-white shadow-lg':'text-zinc-500'}`}>تيليجرام</button>
              <button onClick={()=>setMethod('google')} className={`h-[44px] rounded-full text-[13px] font-bold transition-all ${method==='google'?'bg-zinc-900 text-white shadow-lg':'text-zinc-500'}`}>Gmail</button>
            </div>
            {method==='google'?(
              <div className="mt-8"><div id="googleBtn" className="flex justify-center mt-6 min-h-[44px]" /></div>
            ): step==='phone'?(
              <div className="mt-8">
                <label className="text-[11px] font-bold text-zinc-700">رقم تيليجرام</label>
                <div className="mt-3 flex gap-2">
                  <div className="h-[56px] px-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center text-[13px] font-bold">🇱🇾 +218</div>
                  <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,9))} placeholder="91 234 5678" className="flex-1 h-[56px] rounded-2xl border border-zinc-200 px-4 text-[16px] outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10" autoFocus />
                </div>
                {error && <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-[12px] text-red-700 whitespace-pre-line">{error}</div>}
                <button onClick={()=>sendCode(false)} disabled={!isValid||loading} className="mt-5 w-full h-[56px] rounded-full bg-zinc-900 text-white font-bold text-[14px] disabled:opacity-30">{loading?'جاري الارسال...':'ارسال كود التحقق'}</button>
              </div>
            ):(
              <div className="mt-8">
                <div className="flex items-center justify-between"><span className="text-[11px] font-bold">ادخل الكود</span><span className="text-[11px] px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">{fullPhone}</span></div>
                {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-700">{error}</div>}
                <div className="mt-5 flex gap-2 justify-between" dir="ltr">
                  {code.map((c,i)=>(<input key={i} ref={el=>refs.current[i]=el} value={c} onChange={e=>onCodeChange(e.target.value,i)} onKeyDown={e=>{if(e.key==='Backspace'&&!code[i]&&i>0) refs.current[i-1]?.focus()}} className="w-[52px] h-[60px] rounded-2xl border border-zinc-200 text-center text-[22px] font-bold outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10" />))}
                </div>
                <button onClick={()=>verify(code.join(''))} className="mt-6 w-full h-[52px] rounded-full bg-zinc-900 text-white font-bold">تأكيد الدخول</button>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={()=>setStep('phone')} className="h-[44px] rounded-full border border-zinc-200 text-[12px]">تعديل الرقم</button>
                  <button onClick={()=>sendCode(true)} disabled={timer>0} className="h-[44px] rounded-full border border-zinc-200 text-[12px] disabled:opacity-40">{timer>0?`اعادة بعد ${timer}s`:'اعادة الارسال'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}