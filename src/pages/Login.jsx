import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'RafeaqAIBot'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Login() {
  const nav = useNavigate()
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState('main')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const [googleReady, setGoogleReady] = useState(false)
  const refs = useRef([])
  const fullPhone = '+218' + phone.replace(/\D/g, '')
  const isValid = phone.replace(/\D/g, '').length >= 9

  useEffect(() => {
    const savedToken = localStorage.getItem('rafeaq_token')
    const savedUser = localStorage.getItem('rafeaq_user')
    if (savedToken && savedUser) nav('/dashboard')
  }, [nav])

  useEffect(() => {
    if (timer === 0) return
    const t = setTimeout(() => setTimer(timer - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const init = () => {
      try {
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => {
          try {
            const payload = r.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
            const p = JSON.parse(decodeURIComponent(escape(atob(payload))))
            const token = 'google_' + p.sub
            localStorage.setItem('rafeaq_user', p.email)
            localStorage.setItem('rafeaq_name', p.name)
            localStorage.setItem('rafeaq_token', token)
            localStorage.setItem('rafeaq_login_time', Date.now().toString())
            fetch(`/api/users/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: p.email, name: p.name, token, method: 'gmail', picture: p.picture }) }).catch(()=>{})
            nav('/dashboard')
          } catch { setError('تعذر تسجيل الدخول') }
        }})
        setGoogleReady(true)
      } catch {}
    }
    if (window.google?.accounts?.id) { init(); return }
    const s = document.createElement('script')
    s.id = 'g-sdk'; s.src = 'https://accounts.google.com/gsi/client'; s.async = true
    s.onload = init
    document.body.appendChild(s)
  }, [])

  function loginWithGoogle() {
    if (!GOOGLE_CLIENT_ID) { setError('Google غير مُعد'); return }
    if (!googleReady) { setError('جاري تجهيز Google...'); return }
    window.google.accounts.id.prompt((n) => { if (n.isNotDisplayed() || n.isSkippedMoment()) setError('لم تظهر نافذة Google') })
  }

  async function sendCode() {
    if (!isValid) { setError('رقم الهاتف لازم 9 أرقام'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch(`/api/send-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: fullPhone }) })
      const d = await res.json()
      if (!d.success) {
        setError(d.message || 'فشل ارسال الكود')
        setLoading(false)
        return
      }
      setView('code'); setTimer(60); setCode(['','','','','','']); setTimeout(()=>refs.current[0]?.focus(),250)
    } catch (e) {
      setError('تعذر ارسال الكود - تأكد من الاتصال')
    }
    setLoading(false)
  }

  function onCodeChange(v,i){
    const val = v.replace(/\D/g,'').slice(-1)
    const next=[...code]; next[i]=val; setCode(next)
    if(val && i<5) refs.current[i+1]?.focus()
    const full=next.join(''); if(full.length===6) verify(full)
  }

  async function verify(full){
    if (full.length !== 6) return
    setError(''); setLoading(true)
    try {
      const res = await fetch(`/api/verify-code`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ phone: fullPhone, code: full }) 
      })
      const d = await res.json()
      if (d.success) {
        const token = 'tg_'+Date.now()
        localStorage.setItem('rafeaq_user', fullPhone)
        localStorage.setItem('rafeaq_token', token)
        localStorage.setItem('rafeaq_login_time', Date.now().toString())
        try { await fetch(`/api/users/save`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone: fullPhone, token, method:'telegram', name: fullPhone }) }) } catch {}
        nav('/dashboard')
      } else {
        setError(d.message || 'الكود غير صحيح')
        setCode(['','','','','',''])
        refs.current[0]?.focus()
      }
    } catch {
      setError('تعذر التحقق - حاول مرة أخرى')
    }
    setLoading(false)
  }

  function handleEmailLogin(){
    setError('تسجيل الدخول بالإيميل قريبا - استخدم Google أو Telegram حاليا')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EEF2FF] p-4" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif}`}</style>
      <div className="w-full max-w-[1050px] bg-white rounded-[24px] shadow-[0_20px_80px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col lg:flex-row min-h-[640px]">
        
        <div className="lg:w-[48%] bg-[#F8F7FF] relative overflow-hidden flex flex-col items-center justify-between p-8 lg:p-10">
          <div className="absolute -left-20 top-[30%] w-[200px] h-[200px] bg-[#E9E7FF] rounded-full blur-[1px] opacity-60"></div>
          <div className="absolute -right-10 bottom-[20%] w-[280px] h-[280px] bg-[#EDE9FF] rounded-full opacity-70"></div>
          <div className="absolute left-[10%] bottom-[5%] w-[120px] h-[120px] bg-[#F3E8FF] rounded-full opacity-50"></div>
          <div className="relative z-10 w-full flex flex-col items-center">
            <div className="w-[72px] h-[72px] rounded-[18px] bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center shadow-[0_8px_24px_rgba(139,92,246,0.3)]">
              <span className="text-white font-black text-[38px] leading-none -mt-1">R</span>
            </div>
            <h1 className="mt-5 text-[32px] font-extrabold text-[#1E1B4B] tracking-tight">رفيق AI</h1>
            <p className="mt-2 text-[14px] text-[#8B8BA7] font-medium">مساعدك الذكي في رحلتك التعليمية</p>
            <div className="relative mt-10 w-[260px] h-[260px]">
              <div className="absolute -left-6 top-8 w-[48px] h-[48px] bg-white rounded-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center text-[22px]">🎓</div>
              <div className="absolute -right-4 top-4 w-[44px] h-[44px] bg-white rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center text-[18px]">📝</div>
              <div className="absolute -left-2 bottom-16 w-[42px] h-[42px] bg-white rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center text-[18px]">📖</div>
              <div className="absolute right-2 bottom-10 w-[46px] h-[46px] bg-white rounded-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center text-[18px]">✨</div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px]">
                <div className="w-[110px] h-[110px] mx-auto bg-white rounded-[32px] shadow-[0_12px_32px_rgba(139,92,246,0.15)] border border-[#EDE9FE] flex flex-col items-center justify-center relative">
                  <div className="w-[82px] h-[54px] bg-[#1E1B4B] rounded-[18px] flex items-center justify-center gap-3">
                    <div className="w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center"><div className="w-[12px] h-[12px] bg-[#1E1B4B] rounded-full mt-2"></div></div>
                    <div className="w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center"><div className="w-[12px] h-[12px] bg-[#1E1B4B] rounded-full mt-2"></div></div>
                  </div>
                  <div className="mt-2 w-[24px] h-[6px] bg-[#EDE9FE] rounded-full"></div>
                  <div className="absolute -top-3 left-6 w-[14px] h-[14px] bg-[#8B5CF6] rounded-full border-2 border-white"></div>
                  <div className="absolute -top-3 right-6 w-[14px] h-[14px] bg-[#8B5CF6] rounded-full border-2 border-white"></div>
                </div>
                <div className="w-[110px] h-[72px] mx-auto mt-3 bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] rounded-[8px] rotate-[-2deg] shadow-[0_8px_20px_rgba(139,92,246,0.3)] flex">
                  <div className="flex-1 bg-[#A78BFA] rounded-l-[8px] m-[3px] mr-0"></div>
                  <div className="flex-1 bg-[#7C3AED] rounded-r-[8px] m-[3px] ml-0"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-6 text-[12px] text-[#A5A3C0] font-medium">تعلم اذكى .. لمستقبل افضل</div>
        </div>

        <div className="lg:w-[52%] bg-white p-7 lg:p-12 flex flex-col justify-center">
          {view === 'main' && (
            <>
              <div className="text-right">
                <h2 className="text-[28px] font-extrabold text-[#1E1B4B]">مرحبا بك</h2>
                <p className="mt-2 text-[13px] text-[#8B8BA7]">سجل دخولك للوصول إلى حسابك</p>
              </div>
              <div className="mt-8 space-y-3">
                <button onClick={loginWithGoogle} className="w-full h-[48px] rounded-[12px] border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] flex items-center justify-center gap-3 text-[14px] font-bold text-[#1E1B4B] transition">
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  تسجيل الدخول عبر Google
                </button>
                <button onClick={()=>{ setView('phone'); setError('') }} className="w-full h-[48px] rounded-[12px] bg-[#2AABEE] hover:bg-[#229ED9] text-white flex items-center justify-center gap-2 text-[14px] font-bold shadow-[0_4px_12px_rgba(42,171,238,0.25)] transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.12.832.941z"/></svg>
                  تسجيل الدخول عبر Telegram
                </button>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-[1px] bg-[#E5E7EB]"></div>
                <span className="text-[12px] text-[#9CA3AF] px-2">أو</span>
                <div className="flex-1 h-[1px] bg-[#E5E7EB]"></div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                  <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full h-[48px] pr-11 pl-4 rounded-[12px] border border-[#E5E7EB] bg-white text-[14px] outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 transition" />
                </div>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                  <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="كلمة المرور" className="w-full h-[48px] pr-11 pl-4 rounded-[12px] border border-[#E5E7EB] bg-white text-[14px] outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 transition" />
                </div>
                {error && <div className="rounded-[12px] bg-red-50 border border-red-200 p-3 text-[12px] text-red-700 whitespace-pre-line">{error}</div>}
                <button onClick={handleEmailLogin} className="w-full h-[48px] rounded-[12px] bg-[#7C6BFF] hover:bg-[#6B5AE0] text-white font-bold text-[14px] shadow-[0_4px_16px_rgba(124,107,255,0.25)] transition">تسجيل الدخول</button>
              </div>
            </>
          )}

          {view === 'phone' && (
            <>
              <button onClick={()=>setView('main')} className="self-start text-[13px] text-[#8B8BA7] hover:text-[#1E1B4B] flex items-center gap-1 mb-6">→ العودة</button>
              <h2 className="text-[24px] font-extrabold text-[#1E1B4B]">تسجيل الدخول عبر تيليجرام</h2>
              <p className="mt-2 text-[13px] text-[#8B8BA7] leading-6">أدخل رقمك اللي شاركته مع البوت <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" className="text-[#2AABEE] font-bold underline">@{BOT_USERNAME}</a></p>
              <div className="mt-8">
                <label className="text-[11px] font-bold text-[#4C4A6B]">رقم الهاتف</label>
                <div className="mt-2 flex gap-2">
                  <div className="h-[48px] px-4 rounded-[12px] bg-[#F8F5FF] border border-[#EDE9FE] flex items-center text-[13px] font-bold text-[#6D6A8A]">🇱🇾 +218</div>
                  <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,9))} placeholder="912345678" className="flex-1 h-[48px] rounded-[12px] border border-[#E5E7EB] px-4 text-[16px] outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 bg-white" autoFocus />
                </div>
                {error && <div className="mt-3 rounded-[12px] bg-red-50 border border-red-200 p-3 text-[12px] text-red-700 whitespace-pre-line">{error}</div>}
                <button onClick={sendCode} disabled={!isValid||loading} className="mt-4 w-full h-[48px] rounded-[12px] bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold text-[14px] disabled:opacity-40 shadow-[0_4px_12px_rgba(42,171,238,0.25)] transition">
                  {loading?'جاري الإرسال...':'إرسال كود التحقق'}
                </button>
              </div>
            </>
          )}

          {view === 'code' && (
            <>
              <button onClick={()=>setView('phone')} className="self-start text-[13px] text-[#8B8BA7] hover:text-[#1E1B4B] flex items-center gap-1 mb-6">→ تعديل الرقم</button>
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-bold text-[#1E1B4B]">أدخل كود التحقق</h3>
                <span className="text-[11px] px-3 py-1 rounded-full bg-[#F5F0FF] border border-[#EDE9FE] text-[#6D5ACB] font-bold">{fullPhone}</span>
              </div>
              <p className="mt-3 text-[12px] text-[#6B7280]">تم ارسال الكود إلى تيليجرام <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" className="text-[#2AABEE] font-bold">@{BOT_USERNAME}</a></p>
              {error && <div className="mt-3 rounded-[12px] bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-700 whitespace-pre-line">{error}</div>}
              <div className="mt-6 flex gap-2 justify-between" dir="ltr">
                {code.map((c,i)=>(<input key={i} ref={el=>refs.current[i]=el} value={c} onChange={e=>onCodeChange(e.target.value,i)} onKeyDown={e=>{if(e.key==='Backspace'&&!code[i]&&i>0) refs.current[i-1]?.focus()}} className="w-[48px] h-[52px] rounded-[12px] border border-[#E5E7EB] text-center text-[20px] font-bold outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 bg-white" />))}
              </div>
              <button onClick={()=>verify(code.join(''))} disabled={loading} className="mt-6 w-full h-[48px] rounded-[12px] bg-[#7C6BFF] hover:bg-[#6B5AE0] text-white font-bold text-[14px] shadow-[0_4px_16px_rgba(124,107,255,0.25)] disabled:opacity-50">{loading?'جاري التحقق...':'تأكيد الدخول'}</button>
              <div className="mt-3 flex gap-2">
                <button onClick={()=>setView('phone')} className="flex-1 h-[44px] rounded-[12px] border border-[#E5E7EB] text-[12px] text-[#6D6A8A] hover:bg-[#FAFAFF]">تعديل الرقم</button>
                <button onClick={sendCode} disabled={timer>0} className="flex-1 h-[44px] rounded-[12px] border border-[#E5E7EB] text-[12px] text-[#6D6A8A] disabled:opacity-40 hover:bg-[#FAFAFF]">{timer>0?`إعادة بعد ${timer}s`:'إعادة الإرسال'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}