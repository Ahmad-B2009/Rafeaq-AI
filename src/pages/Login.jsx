import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const STAGES = [
  [0, 'نتحقق من حسابك...'],
  [25, 'نجهز مكتبتك...'],
  [50, 'نفتح دفتر رفيق...'],
  [75, 'نرتب مساحتك الدراسية...'],
  [95, 'خلاص، تقريباً وصلنا!'],
]

const FEATURES = [
  { icon: '✦', title: 'رفيق AI', text: 'اسأل أي سؤال دراسي وخذ شرحاً بسيطاً خطوة بخطوة.' },
  { icon: '❖', title: 'دفتر رفيق', text: 'اختر كتبك كمصادر، ورفيق يجاوب من داخلها مع رقم الصفحة.' },
  { icon: '▤', title: 'مكتبة على جهازك', text: 'نزّل كتبك مرة وحدة واقرأها بدون إنترنت.' },
  { icon: '◷', title: 'مؤقت الدراسة', text: 'جلسات تركيز تساعدك تخلص أكثر في وقت أقل.' },
]

function decodeJwt(token) {
  const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(part.padEnd(Math.ceil(part.length / 4) * 4, '='))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

export default function Login() {
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [shake, setShake] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [progress, setProgress] = useState(0)
  const [googleReady, setGoogleReady] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [capsOn, setCapsOn] = useState(false)
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [featureIndex, setFeatureIndex] = useState(0)

  const timerRef = useRef(null)
  const passRef = useRef(null)

  /* ---------- دخول تلقائي لو الجلسة موجودة ---------- */
  useEffect(() => {
    const token = localStorage.getItem('rafeaq_token')
    const user = localStorage.getItem('rafeaq_user')
    if (token && user && !sessionStorage.getItem('just_logged_out')) {
      nav('/dashboard')
    }
  }, [nav])

  /* ---------- حالة الاتصال ---------- */
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  /* ---------- تبديل المميزات ---------- */
  useEffect(() => {
    const t = window.setInterval(() => setFeatureIndex((i) => (i + 1) % FEATURES.length), 3800)
    return () => window.clearInterval(t)
  }, [])

  /* ---------- تنظيف المؤقت عند الخروج من الصفحة ---------- */
  useEffect(() => () => window.clearInterval(timerRef.current), [])

  /* ---------- Google ---------- */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const init = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (r) => {
            try {
              const p = decodeJwt(r.credential)
              startLoading(p.email, p.name, 'google_' + p.sub, p.picture, p.email, 'gmail')
            } catch {
              fail('general', 'تعذر تسجيل الدخول بـ Google، حاول مرة ثانية.')
            }
          },
        })
        setGoogleReady(true)
      } catch (e) {
        console.error('Google init error:', e)
      }
    }

    if (window.google?.accounts?.id) {
      init()
      return
    }

    // لا نكرر إضافة السكربت لو كان موجوداً
    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      document.body.appendChild(script)
    }
    script.addEventListener('load', init)
    return () => script.removeEventListener('load', init)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function fail(field, message) {
    setErrors({ [field]: message })
    setShake((s) => s + 1)
  }

  /* ---------- شاشة التحميل (7 ثواني) ---------- */
  function startLoading(userId, name, tokenParam, picture, email, method) {
    if (timerRef.current) return
    setDisplayName(name || userId || '')
    setShowSplash(true)
    setProgress(0)
    let cur = 0

    timerRef.current = window.setInterval(() => {
      cur += 1.43
      if (cur > 100) cur = 100
      setProgress(cur)

      if (cur >= 100) {
        window.clearInterval(timerRef.current)
        timerRef.current = null

        sessionStorage.removeItem('just_logged_out')
        localStorage.setItem('rafeaq_user', userId)
        localStorage.setItem('rafeaq_name', name)
        localStorage.setItem('rafeaq_token', tokenParam || 'user_' + Date.now())
        localStorage.setItem('rafeaq_login_time', Date.now().toString())

        if (email) {
          fetch('/api/users/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, token: tokenParam, method, picture }),
          }).catch(() => {})
        }
        nav('/dashboard')
      }
    }, 100)
  }

  function loginWithGoogle() {
    setErrors({})
    if (!GOOGLE_CLIENT_ID) {
      console.error('VITE_GOOGLE_CLIENT_ID غير مضاف في إعدادات المشروع (Vercel)')
      fail('general', 'تسجيل الدخول بـ Google غير متاح حالياً.')
      return
    }
    if (!googleReady) {
      fail('general', 'جاري تجهيز Google... حاول بعد ثانية.')
      return
    }
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed?.() || n.isSkippedMoment?.()) {
        fail('general', 'نافذة Google ما ظهرت. تأكد أنك ما مانع النوافذ المنبثقة ثم حاول مرة ثانية.')
      }
    })
  }

  async function handleLogin() {
    if (loading) return
    const u = username.trim()
    const p = password.trim()

    if (!u && !p) return fail('general', 'اكتب المعرف والرمز')
    if (!u) return fail('username', 'اكتب المعرف')
    if (u.length < 3) return fail('username', 'المعرف قصير - 3 حروف على الأقل')
    if (!p) return fail('password', 'اكتب الرمز')
    if (p.length < 3) return fail('password', 'الرمز قصير - 3 حروف على الأقل')

    setErrors({})
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    startLoading(u, u, 'user_' + Date.now(), null, u, 'normal')
  }

  const stage = [...STAGES].reverse().find(([from]) => progress >= from)?.[1]
  const secondsLeft = Math.max(0, Math.ceil((100 - progress) / 14.3))
  const feature = FEATURES[featureIndex]

  const styles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

      :root {
        --bg: #F4F2FF; --ink: #1D1A45; --muted: #6F6C94;
        --brand: #6D5EF5; --brand2: #A15CF6; --cyan: #1FC8E3; --mint: #2DD4A0; --coral: #FF8A5B;
        --soft: #ECE9FF; --line: rgba(109,94,245,.14);
        --grad: linear-gradient(135deg, #6D5EF5 0%, #A15CF6 48%, #1FC8E3 100%);
      }
      * { font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif; }
      body { background: var(--bg); }
      button, input { font: inherit; }
      ::selection { background: var(--brand); color: #fff; }

      .bg-stage {
        position: fixed; inset: 0; z-index: -1; overflow: hidden;
        background:
          radial-gradient(900px 520px at 85% -10%, rgba(161,92,246,.25), transparent 60%),
          radial-gradient(800px 540px at -10% 25%, rgba(31,200,227,.22), transparent 60%),
          radial-gradient(700px 500px at 60% 110%, rgba(255,138,91,.18), transparent 60%),
          var(--bg);
      }
      .bg-stage::after {
        content: ''; position: absolute; inset: 0; opacity: .5;
        background-image: radial-gradient(rgba(109,94,245,.12) 1px, transparent 1px);
        background-size: 26px 26px;
        mask-image: linear-gradient(to bottom, #000, transparent 75%);
      }
      .glass {
        background: rgba(255,255,255,.78);
        backdrop-filter: blur(18px) saturate(160%);
        border: 1px solid var(--line);
        box-shadow: 0 20px 60px rgba(109,94,245,.14);
      }
      .aurora-card { background: var(--grad); background-size: 200% 200%; animation: flow 12s ease infinite; box-shadow: 0 24px 60px rgba(109,94,245,.32); }
      @keyframes flow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      .blob { position: absolute; border-radius: 999px; filter: blur(46px); pointer-events: none; }
      .blob-a { width: 280px; height: 280px; background: #fff; top: -100px; left: -70px; opacity: .22; animation: drift 9s ease-in-out infinite; }
      .blob-b { width: 320px; height: 320px; background: var(--coral); bottom: -160px; right: 20%; opacity: .38; animation: drift 11s ease-in-out infinite reverse; }
      @keyframes drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,22px) scale(1.12); } }
      .float { animation: float 4.5s ease-in-out infinite; }
      @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      .gtext { background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }

      .btn-grad {
        position: relative; overflow: hidden; color: #fff; background: var(--grad); background-size: 160% 160%;
        box-shadow: 0 8px 22px rgba(109,94,245,.35); transition: transform .2s, box-shadow .2s;
      }
      .btn-grad:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(109,94,245,.45); }
      .btn-grad::after {
        content: ''; position: absolute; top: 0; left: -80%; width: 50%; height: 100%;
        background: linear-gradient(100deg, transparent, rgba(255,255,255,.45), transparent);
        transform: skewX(-20deg); transition: left .6s;
      }
      .btn-grad:hover::after { left: 140%; }
      .btn-grad:disabled { opacity: .55; transform: none; cursor: not-allowed; }

      .field {
        width: 100%; height: 54px; border-radius: 16px; border: 1.5px solid var(--line);
        background: rgba(255,255,255,.9); padding: 0 16px 0 46px; font-size: 13px; outline: none; text-align: right;
        transition: border-color .2s, box-shadow .2s, background .2s;
      }
      .field:focus { border-color: var(--brand); background: #fff; box-shadow: 0 0 0 4px rgba(109,94,245,.13); }
      .field.bad { border-color: #F04438; box-shadow: 0 0 0 4px rgba(240,68,56,.1); }

      .ring { background: conic-gradient(var(--brand) var(--deg), #E7E3FF 0); }
      .pulse-ring { animation: ring 1.8s ease-out infinite; }
      @keyframes ring { 0% { box-shadow: 0 0 0 0 rgba(45,212,160,.55); } 100% { box-shadow: 0 0 0 10px rgba(45,212,160,0); } }

      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
    `}</style>
  )

  /* ============================== شاشة التحميل ============================== */
  if (showSplash) {
    return (
      <div dir="rtl" className="relative flex min-h-screen w-full items-center justify-center p-4 text-[var(--ink)]">
        {styles}
        <div className="bg-stage" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass w-full max-w-[420px] rounded-[30px] p-8 text-center"
        >
          <div className="ring mx-auto grid h-[132px] w-[132px] place-items-center rounded-full" style={{ '--deg': `${progress * 3.6}deg` }}>
            <div className="grid h-[114px] w-[114px] place-items-center rounded-full bg-white">
              <div className="btn-grad float grid h-[76px] w-[76px] place-items-center rounded-[22px]">
                <span className="text-[34px] font-black">ر</span>
              </div>
            </div>
          </div>

          <h2 className="mt-6 text-[21px] font-bold">
            مرحباً {displayName ? <span className="gtext">{displayName}</span> : ''} 👋
          </h2>

          <AnimatePresence mode="wait">
            <motion.p
              key={stage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-2 text-[13px] text-[var(--muted)]"
            >
              {stage}
            </motion.p>
          </AnimatePresence>

          <div className="mt-8">
            <div className="h-[7px] overflow-hidden rounded-full bg-[var(--soft)]">
              <div className="h-full rounded-full transition-all" style={{ width: progress + '%', background: 'var(--grad)' }} />
            </div>
            <div className="mt-3 flex justify-between text-[11px]">
              <span className="text-[var(--muted)]">
                {secondsLeft > 0 ? `${secondsLeft} ثواني وندخلوك...` : 'ندخلوك الآن...'}
              </span>
              <span className="font-bold text-[var(--brand)]">{Math.round(progress)}%</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  /* ============================== شاشة الدخول ============================== */
  return (
    <div dir="rtl" className="relative min-h-screen w-full text-[var(--ink)]">
      {styles}
      <div className="bg-stage" />

      {!online && (
        <div className="fixed inset-x-0 top-0 z-50 bg-[#FFF3E8] py-2 text-center text-[11px] font-semibold text-[#B45309]">
          لا يوجد اتصال بالإنترنت — تحقق من الشبكة ثم حاول مرة ثانية
        </div>
      )}

      <div className="mx-auto grid min-h-screen max-w-[1180px] items-center gap-6 p-4 lg:grid-cols-[1fr_1.05fr] lg:p-8">
        {/* ----- نموذج الدخول ----- */}
        <motion.div
          key={shake}
          initial={{ opacity: 0, y: 18 }}
          animate={shake ? { opacity: 1, y: 0, x: [0, -9, 9, -6, 6, 0] } : { opacity: 1, y: 0 }}
          transition={{ duration: shake ? 0.45 : 0.5 }}
          className="glass order-2 mx-auto w-full max-w-[440px] rounded-[30px] p-6 sm:p-8 lg:order-1"
        >
          <div className="flex items-center gap-3">
            <div className="btn-grad grid h-12 w-12 place-items-center rounded-[15px]">
              <span className="text-[20px] font-bold">ر</span>
            </div>
            <div>
              <div className="gtext text-[19px] font-bold">رفيق</div>
              <div className="text-[10px] text-[var(--muted)]">مساعدك الدراسي</div>
            </div>
          </div>

          <h1 className="mt-6 text-[24px] font-bold">مرحباً بك 👋</h1>
          <p className="mt-1 text-[12px] text-[var(--muted)]">سجّل دخولك للوصول إلى حسابك</p>

          <button
            onClick={loginWithGoogle}
            className="mt-6 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[16px] border border-[var(--line)] bg-white text-[13px] font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-[0_12px_28px_rgba(109,94,245,.16)]"
          >
            <svg width="19" height="19" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            تسجيل الدخول عبر Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--line)]" />
            <span className="px-2 text-[11px] text-[var(--muted)]">أو</span>
            <div className="h-px flex-1 bg-[var(--line)]" />
          </div>

          <div className="space-y-3">
            <div>
              <div className="relative">
                <input
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors({}) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') passRef.current?.focus() }}
                  placeholder="البريد الإلكتروني أو المعرف"
                  autoComplete="username"
                  autoFocus
                  className={`field ${errors.username ? 'bad' : ''}`}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] opacity-60">✉️</span>
              </div>
              {errors.username && <p className="mt-1.5 px-1 text-[11px] text-[#D92D20]">{errors.username}</p>}
            </div>

            <div>
              <div className="relative">
                <input
                  ref={passRef}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({}) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
                  onKeyUp={(e) => setCapsOn(e.getModifierState?.('CapsLock') || false)}
                  type={showPass ? 'text' : 'password'}
                  placeholder="كلمة المرور"
                  autoComplete="current-password"
                  className={`field ${errors.password ? 'bad' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[15px] opacity-70 transition hover:bg-[var(--soft)] hover:opacity-100"
                  title={showPass ? 'إخفاء' : 'إظهار'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 px-1 text-[11px] text-[#D92D20]">{errors.password}</p>}
              {capsOn && <p className="mt-1.5 px-1 text-[11px] text-[#B45309]">⚠ زر Caps Lock مفعّل</p>}
            </div>

            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-[14px] border border-[#F6CFCF] bg-[#FFF5F5] p-3 text-center text-[12px] text-[#B42318]">
                    {errors.general}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={handleLogin} disabled={loading} className="btn-grad mt-2 h-[54px] w-full rounded-[16px] text-[14px] font-bold">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  جاري التحقق...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </div>

          <p className="mt-5 text-center text-[10px] text-[var(--muted)]">تعلّم أذكى .. لمستقبل أفضل</p>
        </motion.div>

        {/* ----- الواجهة التعريفية ----- */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="aurora-card relative order-1 overflow-hidden rounded-[32px] p-6 text-white sm:p-8 lg:order-2 lg:min-h-[560px] lg:p-10"
        >
          <div className="blob blob-a" />
          <div className="blob blob-b" />

          <div className="relative flex h-full flex-col justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] backdrop-blur">
                <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-[#63FFC0]" />
                منصة رفيق التعليمية
              </div>
              <h2 className="mt-5 text-[26px] font-bold leading-[1.4] sm:text-[34px]">
                دراستك صارت
                <br />
                أسهل وأذكى ✨
              </h2>
              <p className="mt-3 max-w-[460px] text-[12px] leading-6 text-white/80 sm:text-[13px]">
                مساعد دراسي يفهمك، مكتبة كتب على جهازك، ودفتر ذكي يجاوب من داخل مصادرك.
              </p>
            </div>

            <div className="hidden gap-3 sm:grid">
              <AnimatePresence mode="wait">
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center gap-4 rounded-[22px] border border-white/25 bg-white/15 p-4 backdrop-blur-md"
                >
                  <div className="float grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-white text-[24px] font-bold text-[var(--brand)]">
                    {feature.icon}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold">{feature.title}</div>
                    <div className="mt-1 text-[11px] leading-5 text-white/80">{feature.text}</div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-1.5">
                {FEATURES.map((f, i) => (
                  <button
                    key={f.title}
                    onClick={() => setFeatureIndex(i)}
                    aria-label={f.title}
                    className={`h-1.5 rounded-full transition-all ${i === featureIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
