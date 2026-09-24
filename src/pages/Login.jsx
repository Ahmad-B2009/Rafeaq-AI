import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'RafeaqAIBot'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Login() {
  const nav = useNavigate()
  const [method, setMethod] = useState('gmail')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState('phone')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [serverCode, setServerCode] = useState('')
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
    if (method !== 'gmail' || !GOOGLE_CLIENT_ID) return
    const initialiseGoogle = () => {
      try {
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => {
          try {
            const payload = r.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
            const p = JSON.parse(decodeURIComponent(escape(atob(payload))))
            const token = 'google_' + p.sub
            localStorage.setItem('rafeaq_user', p.email); 
            localStorage.setItem('rafeaq_name', p.name)
            localStorage.setItem('rafeaq_token', token);
            localStorage.setItem('rafeaq_login_time', Date.now().toString());
            localStorage.setItem('rafeaq_remember', 'true');
            // حفظ في السحابة المجانية (Supabase / Vercel KV / JSON)
            fetch(`/api/users/save`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: p.email, name: p.name, token, method: 'gmail', picture: p.picture })
            }).catch(()=>{})
            nav('/dashboard')
          } catch { setError('تعذر إكمال تسجيل الدخول بحساب Google. حاول مرة أخرى.') }
        }})
        setGoogleReady(true)
      } catch { setError('تعذر تهيئة تسجيل الدخول بحساب Google.') }
    }
    if (window.google?.accounts?.id) { initialiseGoogle(); return }
    const old = document.getElementById('g-sdk')
    if (old) { old.addEventListener('load', initialiseGoogle, { once: true }); return }
    const s = document.createElement('script')
    s.id = 'g-sdk'; s.src = 'https://accounts.google.com/gsi/client'; s.async = true
    s.onload = initialiseGoogle; s.onerror = () => setError('تعذر تحميل خدمة Google.')
    document.body.appendChild(s)
  }, [method, nav])

  function loginWithGoogle() {
    setError('')
    if (!GOOGLE_CLIENT_ID) { setError('لم يتم إعداد Google Sign-In بعد.'); return }
    if (!googleReady || !window.google?.accounts?.id) { setError('يتم تجهيز Google… حاول بعد لحظات.'); return }
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) setError('لم تظهر نافذة Google.')
    })
  }

  async function sendCode(isResend=false) {
    const clean = phone.replace(/\D/g,'')
    if (clean.length < 9) { setError('رقم الهاتف لازم 9 أرقام'); return }
    setError(''); setLoading(true)
    const c = Math.floor(100000 + Math.random() * 900000).toString()
    setServerCode(c)
    try {
      const res = await fetch(`/api/send-code`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code:c, phone:fullPhone }) })
      const d = await res.json()
      // في وضع التطوير، نستخدم الكود مباشرة
      if (d.devCode) setServerCode(d.devCode)
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

  async function saveUserToDB(userData) {
    try {
      await fetch(`/api/users/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
    } catch {}
  }

  function verify(full){
    if(full===serverCode){
      const token = 'tg_'+Date.now()
      localStorage.setItem('rafeaq_user',fullPhone); 
      localStorage.setItem('rafeaq_token',token);
      localStorage.setItem('rafeaq_login_time', Date.now().toString());
      localStorage.setItem('rafeaq_remember', 'true');
      saveUserToDB({ phone: fullPhone, token, method: 'telegram', name: fullPhone })
      nav('/dashboard') 
    }
    else if(full.length===6) setError('الكود غير صحيح')
  }

  return (
    <div className="min-h-screen w-full flex bg-[#FBF7FF] text-zinc-900" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif}`}</style>
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-[28px] border border-[#EDE9FE] shadow-[0_16px_64px_rgba(139,92,246,0.08)] p-7 md:p-8">
            <div className="text-center">
              <h2 className="text-[24px] font-extrabold text-[#1E1B4B]">تسجيل الدخول</h2>
              <p className="text-[13px] text-[#8B8BA7] mt-2">اختر طريقة الدخول</p>
            </div>
            <div className="mt-8 space-y-3">
              <button onClick={()=>{setMethod('gmail'); setStep('phone'); setError('')}} className={`w-full h-[56px] rounded-full border text-[14px] font-bold flex items-center justify-center gap-3 transition-all ${method==='gmail' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]' : 'bg-white border-[#EDE9FE] text-[#1E1B4B]'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[14px] font-black ${method==='gmail' ? 'bg-white text-[#8B5CF6]' : 'bg-[#F5F0FF] text-[#8B5CF6]'}`}>G</span>
                متابعة باستخدام Gmail
              </button>
              <button onClick={()=>{setMethod('telegram'); setStep('phone'); setError('')}} className={`w-full h-[56px] rounded-full border text-[14px] font-bold flex items-center justify-center gap-3 transition-all ${method==='telegram' ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white border-[#E2E8F0] text-[#334155]'}`}>
                <span className="text-[16px]">✈</span>
                متابعة باستخدام تيليجرام
              </button>
            </div>
            <div className="my-6 h-[1px] bg-[#F3F0FF] w-full" />
            {method==='gmail' ? (
              <div>
                <button onClick={loginWithGoogle} disabled={!GOOGLE_CLIENT_ID} className="w-full h-[54px] rounded-2xl border border-[#DED7FE] bg-[#FAF9FF] hover:bg-white hover:border-[#8B5CF6] disabled:opacity-50 text-[#1E1B4B] font-bold text-[14px] flex items-center justify-center gap-3 transition">
                  <span className="w-7 h-7 rounded-full bg-white border flex items-center justify-center text-[#4285F4] font-black">G</span>
                  {googleReady ? 'المتابعة بحساب Google' : 'جاري تجهيز Google…'}
                </button>
                {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-[11px] text-red-700 text-center">{error}</div>}
              </div>
            ) : step==='phone' ? (
              <div>
                <label className="text-[11px] font-bold text-[#4C4A6B]">رقم تيليجرام</label>
                <div className="mt-2 flex gap-2">
                  <div className="h-[54px] px-4 rounded-2xl bg-[#F8F5FF] border border-[#EDE9FE] flex items-center text-[13px] font-bold text-[#6D6A8A]">🇱🇾 +218</div>
                  <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,9))} placeholder="912345678" className="flex-1 h-[54px] rounded-2xl border border-[#EDE9FE] px-4 text-[16px] outline-none focus:border-[#8B5CF6] bg-white" autoFocus />
                </div>
                {error && <div className="mt-3 rounded-2xl bg-red-50 border border-red-200 p-3 text-[12px] text-red-700 whitespace-pre-line">{error}</div>}
                <button onClick={()=>sendCode(false)} disabled={!isValid||loading} className="mt-4 w-full h-[54px] rounded-full bg-[#8B5CF6] text-white font-bold text-[14px] disabled:opacity-30">{loading?'جاري الإرسال...':'إرسال كود التحقق'}</button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#4C4A6B]">أدخل كود التحقق</span>
                  <span className="text-[11px] px-3 py-1 rounded-full bg-[#F5F0FF] border border-[#EDE9FE] text-[#6D5ACB]">{fullPhone}</span>
                </div>
                {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-700">{error}</div>}
                <div className="mt-5 flex gap-2 justify-between" dir="ltr">
                  {code.map((c,i)=>(<input key={i} ref={el=>refs.current[i]=el} value={c} onChange={e=>onCodeChange(e.target.value,i)} onKeyDown={e=>{if(e.key==='Backspace'&&!code[i]&&i>0) refs.current[i-1]?.focus()}} className="w-[50px] h-[56px] rounded-2xl border border-[#EDE9FE] text-center text-[20px] font-bold outline-none focus:border-[#8B5CF6] bg-white" />))}
                </div>
                <button onClick={()=>verify(code.join(''))} className="mt-5 w-full h-[52px] rounded-full bg-[#8B5CF6] text-white font-bold hover:bg-[#7C3AED]">تأكيد الدخول</button>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={()=>setStep('phone')} className="h-[44px] rounded-full border border-[#EDE9FE] text-[12px] text-[#6D6A8A]">تعديل الرقم</button>
                  <button onClick={()=>sendCode(true)} disabled={timer>0} className="h-[44px] rounded-full border border-[#EDE9FE] text-[12px] text-[#6D6A8A] disabled:opacity-40">{timer>0?`إعادة بعد ${timer}s`:'إعادة الإرسال'}</button>
                </div>
              </div>
            )}
          </div>
          <p className="mt-6 text-center text-[11px] text-[#9CA3AF]">© 2026 Rafeaq AI - مجاني 100% بدون لابتوب ثاني</p>
        </div>
      </div>
    </div>
  )
}