import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Login() {
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [progress, setProgress] = useState(0)
  const [googleReady, setGoogleReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('rafeaq_token')
    const user = localStorage.getItem('rafeaq_user')
    if (token && user && !sessionStorage.getItem('just_logged_out')) {
      nav('/dashboard')
    }
  }, [nav])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const init = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (r) => {
            try {
              const base64 = r.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
              const json = decodeURIComponent(escape(atob(base64)))
              const p = JSON.parse(json)
              startLoading(p.email, p.name, 'google_' + p.sub, p.picture, p.email, 'gmail')
            } catch {
              setError('تعذر تسجيل الدخول بـ Google')
            }
          }
        })
        setGoogleReady(true)
      } catch {}
    }
    if (window.google && window.google.accounts && window.google.accounts.id) {
      init()
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = init
    document.body.appendChild(s)
  }, [])

  function startLoading(userId, name, tokenParam, picture, email, method) {
    setShowSplash(true)
    setProgress(0)
    let cur = 0
    const timer = setInterval(() => {
      cur += 1.43
      if (cur > 100) cur = 100
      setProgress(cur)
      if (cur >= 100) {
        clearInterval(timer)
        localStorage.setItem('rafeaq_user', userId)
        localStorage.setItem('rafeaq_name', name)
        localStorage.setItem('rafeaq_token', tokenParam || 'user_' + Date.now())
        localStorage.setItem('rafeaq_login_time', Date.now().toString())
        if (email) {
          fetch('/api/users/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, name: name, token: tokenParam, method: method, picture: picture })
          }).catch(() => {})
        }
        nav('/dashboard')
      }
    }, 100)
  }

  function loginWithGoogle() {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID مش مضاف في Vercel - ضيف VITE_GOOGLE_CLIENT_ID')
      return
    }
    if (!googleReady) {
      setError('جاري تجهيز Google... حاول ثانية')
      return
    }
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) {
        setError('نافذة Google ما طلعتش - تأكد انك مش مانع النوافذ المنبثقة')
      }
    })
  }

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setError('اكتب المعرف والرمز')
      return
    }
    if (username.trim().length < 3) {
      setError('المعرف قصير - 3 حروف على الأقل')
      return
    }
    if (password.trim().length < 3) {
      setError('الرمز قصير - 3 حروف على الأقل')
      return
    }
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    startLoading(username.trim(), username.trim(), 'user_' + Date.now(), null, username.trim(), 'normal')
  }

  if (showSplash) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F7FF] p-4" dir="rtl">
        <div className="w-full max-w-[400px] bg-white rounded-[24px] shadow-[0_20px_60px_rgba(124,107,255,0.15)] border border-[#F0F2F8] p-8 text-center">
          <div className="w-[80px] h-[80px] mx-auto rounded-[20px] bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center animate-pulse">
            <span className="text-white font-black text-[36px]">R</span>
          </div>
          <h2 className="mt-6 text-[20px] font-extrabold text-[#1E1B4B]">مرحبا {username} 👋</h2>
          <p className="mt-2 text-[13px] text-[#8B8BA7]">جاري تجهيز حسابك...</p>
          <div className="mt-8">
            <div className="w-full h-[6px] bg-[#F3F0FF] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-l from-[#8B5CF6] to-[#6366F1] rounded-full transition-all" style={{ width: progress + '%' }}></div>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-[11px] text-[#9CA3AF]">تحميل</span>
              <span className="text-[11px] font-bold text-[#7C6BFF]">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-2 text-[11px] text-[#9CA3AF]">
            <div className="w-4 h-4 border-2 border-[#E9E5FF] border-t-[#7C6BFF] rounded-full animate-spin"></div>
            7 ثواني وندخلوك...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col" dir="rtl">
      <div className="w-full h-[38vh] bg-[#F8F7FF] relative overflow-hidden flex items-center justify-center">
        <div className="absolute w-[200px] h-[200px] bg-[#EDE9FF] rounded-full left-[5%] top-[20%] opacity-60"></div>
        <div className="absolute w-[120px] h-[120px] bg-[#F3F0FF] rounded-full right-[10%] top-[10%]"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="w-[56px] h-[56px] bg-white rounded-[16px] shadow-sm flex items-center justify-center text-[20px]">📚</div>
          <div className="flex gap-1">
            <div className="w-[72px] h-[72px] bg-[#7C6BFF] rounded-[16px] shadow-[0_8px_20px_rgba(124,107,255,0.3)]"></div>
            <div className="w-[72px] h-[72px] bg-[#A78BFA] rounded-[16px] shadow-[0_8px_20px_rgba(124,107,255,0.2)] -mr-2"></div>
          </div>
          <div className="w-[56px] h-[56px] bg-white rounded-[16px] shadow-sm flex items-center justify-center text-[16px]">✨</div>
        </div>
        <p className="absolute bottom-6 text-[12px] text-[#8B8BA7]">تعلم اذكى .. لمستقبل افضل</p>
      </div>

      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 p-6 pb-10">
        <div className="max-w-[420px] mx-auto w-full">
          <h1 className="text-[22px] font-extrabold text-[#1E1B4B] text-right">مرحبا بك</h1>
          <p className="text-[12px] text-[#9CA3AF] mt-1 text-right">سجل دخولك للوصول إلى حسابك</p>

          <div className="mt-6">
            <button onClick={loginWithGoogle} className="w-full h-[52px] rounded-[14px] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] flex items-center justify-center gap-2 font-bold text-[13px] text-[#1E1B4B] shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              تسجيل الدخول عبر Google
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-[#E5E7EB]"></div>
            <span className="text-[11px] text-[#9CA3AF] px-2">أو</span>
            <div className="flex-1 h-[1px] bg-[#E5E7EB]"></div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="البريد الإلكتروني" className="w-full h-[52px] pr-4 pl-11 rounded-[14px] border border-[#F0F2F8] bg-[#FAFBFF] text-[13px] outline-none focus:border-[#7C6BFF] focus:bg-white text-right" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">✉️</span>
            </div>
            <div className="relative">
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="كلمة المرور" className="w-full h-[52px] pr-4 pl-11 rounded-[14px] border border-[#F0F2F8] bg-[#FAFBFF] text-[13px] outline-none focus:border-[#7C6BFF] focus:bg-white text-right" onKeyDown={e=>{ if(e.key==='Enter') handleLogin() }} />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">🔒</span>
            </div>

            {error && <div className="rounded-[12px] bg-red-50 border border-red-200 p-3 text-[12px] text-red-600 text-center">{error}</div>}

            <button onClick={handleLogin} disabled={loading} className="w-full h-[52px] rounded-[14px] bg-[#7C6BFF] hover:bg-[#6B5AE0] text-white font-bold text-[14px] shadow-[0_8px_20px_rgba(124,107,255,0.3)] disabled:opacity-50 mt-2">
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>

            <p className="text-[10px] text-[#9CA3AF] text-center mt-2">Google شغال + المعرف والرمز عاديات + Loading 7 ثواني</p>
          </div>
        </div>
      </div>
    </div>
  )
}