
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Iridescence from '../components/Iridescence'
import ProfileCard from '../components/ProfileCard'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const LOADING_DURATION = 15000

const STAGES = [
  [0, 'نرتّب لك مساحة دراسة هادئة...'],
  [25, 'نجهّز أدواتك ومصادرك...'],
  [50, 'نفتح مساحتك التعليمية...'],
  [75, 'نضبط التفاصيل الصغيرة...'],
  [95, 'رفيق يجهّز مساحتك...'],
]

const FEATURES = [
  {
    icon: '✦',
    title: 'رفيق AI',
    text: 'اسأل أي سؤال دراسي وخذ شرحاً بسيطاً خطوة بخطوة.',
  },
  {
    icon: '❖',
    title: 'دفتر رفيق',
    text: 'استخدم كتبك كمصادر للمراجعة والتعلّم.',
  },
  {
    icon: '▤',
    title: 'مكتبة رفيق',
    text: 'اجمع كتبك ومصادرك في مساحة واحدة.',
  },
  {
    icon: '◷',
    title: 'مؤقت الدراسة',
    text: 'نظّم جلسات التركيز والدراسة.',
  },
]

function decodeJwt(token) {
  const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(part.padEnd(Math.ceil(part.length / 4) * 4, '='))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

function RafeeqLogo({ small = false }) {
  return (
    <div className={`rafeeq-logo ${small ? 'rafeeq-logo-small' : ''}`} aria-label="رفيق">
      <span className="rafeeq-logo-symbol">ر</span>
      <span className="rafeeq-logo-orbit" />
    </div>
  )
}

function LoginBackground() {
  return (
    <div className="login-background" aria-hidden="true">
      <Iridescence
        color={[0.48, 0.35, 0.85]}
        speed={0.45}
        amplitude={0.12}
        mouseReact={true}
        scale={1.1}
        detail={1.5}
        rotation={0}
        warp={0.15}
        hueShift={0.08}
        saturation={0.8}
        brightness={0.9}
        contrast={1.1}
      />
      <div className="login-background-overlay" />
    </div>
  )
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
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  )
  const [featureIndex, setFeatureIndex] = useState(0)

  const timerRef = useRef(null)
  const passRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('rafeaq_token')
    const user = localStorage.getItem('rafeaq_user')

    if (token && user && !sessionStorage.getItem('just_logged_out')) {
      startLoading(
        user,
        localStorage.getItem('rafeaq_name') || user,
        token,
        null,
        null,
        'returning'
      )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFeatureIndex((i) => (i + 1) % FEATURES.length)
    }, 3800)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    return () => window.clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const init = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (r) => {
            try {
              const p = decodeJwt(r.credential)

              startLoading(
                p.email,
                p.name,
                'google_' + p.sub,
                p.picture,
                p.email,
                'gmail'
              )
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

    let script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    )

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

  function startLoading(userId, name, tokenParam, picture, email, method) {
    if (timerRef.current) return

    setDisplayName(name || userId || '')
    setShowSplash(true)
    setProgress(0)

    const startedAt = Date.now()

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextProgress = Math.min(
        100,
        (elapsed / LOADING_DURATION) * 100
      )

      setProgress(nextProgress)

      if (nextProgress >= 100) {
        window.clearInterval(timerRef.current)
        timerRef.current = null

        sessionStorage.removeItem('just_logged_out')

        localStorage.setItem('rafeaq_user', userId)
        localStorage.setItem('rafeaq_name', name)
        localStorage.setItem(
          'rafeaq_token',
          tokenParam || 'user_' + Date.now()
        )
        localStorage.setItem('rafeaq_login_time', Date.now().toString())
        sessionStorage.setItem('rafeaq_skip_os_boot', '1')

        if (email) {
          fetch('/api/users/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              name,
              token: tokenParam,
              method,
              picture,
            }),
          }).catch(() => {})
        }

        nav('/dashboard')
      }
    }, 100)
  }

  function loginWithGoogle() {
    setErrors({})

    if (!GOOGLE_CLIENT_ID) {
      console.error(
        'VITE_GOOGLE_CLIENT_ID غير مضاف في إعدادات المشروع (Vercel)'
      )
      fail('general', 'تسجيل الدخول بـ Google غير متاح حالياً.')
      return
    }

    if (!googleReady) {
      fail('general', 'جاري تجهيز Google... حاول بعد ثانية.')
      return
    }

    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed?.() || n.isSkippedMoment?.()) {
        fail(
          'general',
          'نافذة Google ما ظهرت. تأكد أنك ما مانع النوافذ المنبثقة ثم حاول مرة ثانية.'
        )
      }
    })
  }

  async function handleLogin() {
    if (loading) return

    const u = username.trim()
    const p = password.trim()

    if (!u && !p) return fail('general', 'اكتب المعرف والرمز')
    if (!u) return fail('username', 'اكتب المعرف')
    if (u.length < 3) {
      return fail('username', 'المعرف قصير - 3 حروف على الأقل')
    }
    if (!p) return fail('password', 'اكتب الرمز')
    if (p.length < 3) {
      return fail('password', 'الرمز قصير - 3 حروف على الأقل')
    }

    setErrors({})
    setLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 800))

    setLoading(false)

    startLoading(
      u,
      u,
      'user_' + Date.now(),
      null,
      u,
      'normal'
    )
  }

  const stage =
    [...STAGES].reverse().find(([from]) => progress >= from)?.[1] ||
    STAGES[0][1]

  const feature = FEATURES[featureIndex]

  const styles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

      :root {
        --ink: #211a30;
        --muted: #766e88;
        --purple: #7855d9;
        --purple-dark: #5132a5;
        --cyan: #55d9e8;
        --pearl: #fbfaff;
        --line: rgba(111, 88, 161, .18);
        --soft: rgba(125, 100, 190, .09);
        --gradient: linear-gradient(120deg, #7957df 0%, #687cf1 52%, #50cddd 100%);
      }

      * { box-sizing: border-box; font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif; }
      body { margin: 0; background: var(--pearl); }
      button, input { font: inherit; }
      button { cursor: pointer; }
      ::selection { background: #7855d9; color: white; }

      .login-background {
        position: fixed; inset: 0; z-index: -2;
        overflow: hidden; background: #f9f7ff;
      }
      .login-background > div:first-child {
        position: absolute; inset: 0; width: 100%; height: 100%;
      }
      .login-background-overlay {
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse at 12% 12%, rgba(255,255,255,.74), transparent 48%),
          linear-gradient(135deg, rgba(250,248,255,.50), rgba(237,249,255,.40));
        pointer-events: none;
      }

      .glass {
        background: rgba(255,255,255,.82);
        backdrop-filter: blur(24px) saturate(145%);
        border: 1px solid rgba(255,255,255,.88);
        box-shadow: 0 28px 90px rgba(65,45,113,.14), 0 4px 18px rgba(72,59,110,.05);
      }

      .brand-gradient {
        background: var(--gradient);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .rafeeq-logo {
        position: relative; display: grid; place-items: center;
        width: 48px; height: 48px; flex: 0 0 auto;
        border-radius: 17px; color: white;
        background: var(--gradient);
        box-shadow: 0 8px 24px rgba(110,84,214,.28);
        isolation: isolate; overflow: hidden;
      }
      .rafeeq-logo::before {
        content: ''; position: absolute; inset: 1px; border-radius: 16px;
        border: 1px solid rgba(255,255,255,.45);
      }
      .rafeeq-logo::after {
        content: ''; position: absolute; width: 55px; height: 55px;
        right: -30px; top: -30px; border-radius: 50%;
        background: rgba(255,255,255,.24);
      }
      .rafeeq-logo-symbol {
        position: relative; z-index: 1; font-size: 29px;
        line-height: 1; font-weight: 700;
      }
      .rafeeq-logo-orbit {
        position: absolute; width: 15px; height: 15px;
        left: 6px; bottom: 6px; border-radius: 50%;
        border: 2px solid rgba(255,255,255,.8);
      }
      .rafeeq-logo-small { width: 76px; height: 76px; border-radius: 25px; }
      .rafeeq-logo-small .rafeeq-logo-symbol { font-size: 42px; }
      .rafeeq-logo-small .rafeeq-logo-orbit { width: 19px; height: 19px; }

      .btn-gradient {
        position: relative; overflow: hidden; color: white;
        background: var(--gradient);
        box-shadow: 0 9px 24px rgba(105,83,210,.25);
        transition: transform .2s, box-shadow .2s;
      }
      .btn-gradient:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 30px rgba(105,83,210,.34);
      }
      .btn-gradient:disabled { opacity: .55; transform: none; cursor: not-allowed; }

      .login-field {
        width: 100%; height: 54px; border-radius: 16px;
        border: 1px solid var(--line); background: rgba(255,255,255,.9);
        padding: 0 16px 0 48px; font-size: 13px; outline: none;
        text-align: right; color: var(--ink);
        transition: border-color .2s, box-shadow .2s;
      }
      .login-field:focus {
        border-color: var(--purple);
        box-shadow: 0 0 0 4px rgba(120,85,217,.11);
        background: white;
      }
      .login-field.bad { border-color: #e54865; }
      .login-error {
        border: 1px solid #f2c9d4; background: #fff4f7;
        color: #a7284a; border-radius: 13px; padding: 12px;
        text-align: center; font-size: 12px;
      }
      .online-dot {
        display: inline-block; width: 7px; height: 7px;
        border-radius: 50%; background: #35c99a;
        box-shadow: 0 0 0 4px rgba(53,201,154,.13);
      }
      .progress-ring {
        background: conic-gradient(var(--purple) var(--progress), rgba(124,103,177,.12) 0);
        box-shadow: 0 12px 34px rgba(99,72,176,.12);
      }
      .feature-panel {
        background: linear-gradient(145deg, rgba(73,49,136,.96), rgba(90,85,195,.93) 58%, rgba(50,156,181,.90));
        box-shadow: 0 28px 75px rgba(67,54,133,.24);
      }
      .feature-glow {
        position: absolute; width: 280px; height: 280px;
        border-radius: 50%; filter: blur(55px); pointer-events: none;
        background: rgba(100,221,242,.30); right: -100px; top: -120px;
      }
      .feature-glow-bottom {
        position: absolute; width: 250px; height: 250px;
        border-radius: 50%; filter: blur(55px); pointer-events: none;
        background: rgba(183,139,255,.32); left: -100px; bottom: -120px;
      }
      .feature-symbol {
        display: grid; place-items: center; width: 54px; height: 54px;
        flex-shrink: 0; border-radius: 17px; background: white;
        color: #6e55ca; font-size: 23px;
      }

      @keyframes softFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      .soft-float { animation: softFloat 4s ease-in-out infinite; }

      @media (max-width: 640px) {
        .login-background-overlay {
          background: linear-gradient(135deg, rgba(250,248,255,.78), rgba(237,249,255,.72));
        }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation: none !important; transition: none !important; }
      }
    `}</style>
  )

  if (showSplash) {
    return (
      <div dir="rtl" className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 text-[var(--ink)]">
        {styles}
        <LoginBackground />

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55 }}
          className="glass relative w-full max-w-[760px] overflow-hidden rounded-[32px] p-6 sm:p-9"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RafeeqLogo />
              <div>
                <div className="brand-gradient text-lg font-bold">رفيق AI</div>
                <div className="text-[11px] text-[var(--muted)]">مساحة التعلّم الخاصة بك</div>
              </div>
            </div>

            <span className="flex items-center gap-2 rounded-full border border-white bg-white/70 px-3 py-2 text-[10px] text-[var(--muted)]">
              <span className="online-dot" />
              جارٍ التجهيز
            </span>
          </div>

          <div className="mt-8 grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
            <div className="text-center">
              <div
                className="progress-ring mx-auto grid h-[142px] w-[142px] place-items-center rounded-full"
                style={{ '--progress': `${progress * 3.6}deg` }}
              >
                <div className="grid h-[122px] w-[122px] place-items-center rounded-full border border-white/90 bg-white/90">
                  <div className="soft-float">
                    <RafeeqLogo small />
                  </div>
                </div>
              </div>

              <h2 className="mt-6 text-xl font-bold">
                أهلاً بك في رفيق
              </h2>

              <AnimatePresence mode="wait">
                <motion.p
                  key={stage}
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2 min-h-6 text-sm text-[var(--muted)]"
                >
                  {stage}
                </motion.p>
              </AnimatePresence>

              <div className="mt-6">
                <div
                  className="h-2 overflow-hidden rounded-full bg-[rgba(124,103,177,.12)]"
                  role="progressbar"
                  aria-label="تجهيز مساحة رفيق"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-100"
                    style={{
                      width: `${progress}%`,
                      background: 'var(--gradient)',
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span>نجهّز تجربتك التعليمية</span>
                  <span className="font-bold text-[#7654d5]">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-sm font-semibold text-[var(--muted)]">
                حسابك
              </p>

              <ProfileCard
                name={displayName || 'طالب رفيق'}
                title="مساحة التعلّم الخاصة بك"
                handle=""
                status="جارٍ تجهيز مساحتك"
                statusColor="#55d9e8"
                showUserInfo={true}
                contactText=""
                theme="dark"
                radius={20}
                holo={0.75}
                glare={0.45}
                enableTilt={true}
                tiltStrength={8}
                parallax={5}
              />
            </div>
          </div>

          <div className="mt-7 border-t border-[var(--line)] pt-4 text-center text-[10px] text-[var(--muted)]">
            رفيق AI · تعلّمك في مساحة واحدة
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="relative min-h-screen w-full overflow-hidden text-[var(--ink)]">
      {styles}
      <LoginBackground />

      {!online && (
        <div className="fixed inset-x-0 top-0 z-50 bg-amber-50 py-2 text-center text-[11px] font-semibold text-amber-800">
          لا يوجد اتصال بالإنترنت — تحقق من الشبكة ثم حاول مرة ثانية
        </div>
      )}

      <div className="mx-auto grid min-h-screen max-w-[1180px] items-center gap-6 p-4 lg:grid-cols-[1fr_1.05fr] lg:p-8">
        <motion.div
          key={shake}
          initial={{ opacity: 0, y: 18 }}
          animate={
            shake
              ? { opacity: 1, y: 0, x: [0, -9, 9, -6, 6, 0] }
              : { opacity: 1, y: 0 }
          }
          transition={{ duration: shake ? 0.45 : 0.5 }}
          className="glass order-2 mx-auto w-full max-w-[440px] rounded-[30px] p-6 sm:p-8 lg:order-1"
        >
          <div className="flex items-center gap-3">
            <RafeeqLogo />
            <div>
              <div className="brand-gradient text-xl font-bold">رفيق AI</div>
              <div className="text-[11px] text-[var(--muted)]">مساعدك الدراسي</div>
            </div>
          </div>

          <h1 className="mt-7 text-2xl font-bold">مرحباً بك 👋</h1>
          <p className="mt-2 text-xs text-[var(--muted)]">
            سجّل دخولك للوصول إلى مساحتك التعليمية
          </p>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="mt-6 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--line)] bg-white/90 text-[13px] font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-[#8c75df]"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            تسجيل الدخول عبر Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--line)]" />
            <span className="text-[11px] text-[var(--muted)]">أو</span>
            <div className="h-px flex-1 bg-[var(--line)]" />
          </div>

          <div className="space-y-3">
            <div>
              <div className="relative">
                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (errors.username || errors.general) setErrors({})
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') passRef.current?.focus()
                  }}
                  placeholder="البريد الإلكتروني أو المعرف"
                  autoComplete="username"
                  autoFocus
                  className={`login-field ${errors.username ? 'bad' : ''}`}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60">
                  ✉
                </span>
              </div>
              {errors.username && (
                <p className="mt-1.5 px-1 text-[11px] text-rose-700">
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  ref={passRef}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password || errors.general) setErrors({})
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin()
                  }}
                  onKeyUp={(e) =>
                    setCapsOn(e.getModifierState?.('CapsLock') || false)
                  }
                  type={showPass ? 'text' : 'password'}
                  placeholder="كلمة المرور"
                  autoComplete="current-password"
                  className={`login-field ${errors.password ? 'bad' : ''}`}
                />

                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-sm opacity-70 transition hover:bg-[var(--soft)] hover:opacity-100"
                  title={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1.5 px-1 text-[11px] text-rose-700">
                  {errors.password}
                </p>
              )}

              {capsOn && (
                <p className="mt-1.5 px-1 text-[11px] text-amber-700">
                  ⚠ زر Caps Lock مفعّل
                </p>
              )}
            </div>

            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="login-error">{errors.general}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="btn-gradient mt-2 h-[54px] w-full rounded-2xl text-sm font-bold"
            >
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

          <div className="mt-6 border-t border-[var(--line)] pt-4 text-center text-[10px] text-[var(--muted)]">
            رفيق AI · مساحة تعلّم مصممة لأجلك
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="feature-panel relative order-1 flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[32px] p-6 text-white sm:p-8 lg:order-2 lg:min-h-[560px] lg:p-10"
        >
          <div className="feature-glow" />
          <div className="feature-glow-bottom" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-[10px] backdrop-blur">
              <span className="online-dot" />
              مساحة رفيق التعليمية
            </div>

            <h2 className="mt-6 text-[27px] font-bold leading-[1.5] sm:text-[36px]">
              عالمك الدراسي،
              <br />
              في مكان واحد.
            </h2>

            <p className="mt-3 max-w-[440px] text-[12px] leading-7 text-white/80 sm:text-[13px]">
              مساحة تجمع مساعدك الذكي وكتبك وملاحظاتك وأدوات الدراسة،
              بتجربة بسيطة تساعدك على التركيز والتعلّم.
            </p>
          </div>

          <div className="relative z-10 mt-8 hidden gap-3 sm:grid">
            <AnimatePresence mode="wait">
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4 rounded-[22px] border border-white/20 bg-white/10 p-4 backdrop-blur-md"
              >
                <div className="feature-symbol soft-float">{feature.icon}</div>
                <div>
                  <div className="text-sm font-bold">{feature.title}</div>
                  <div className="mt-1 text-[11px] leading-5 text-white/75">
                    {feature.text}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 pt-1">
              {FEATURES.map((f, i) => (
                <button
                  key={f.title}
                  type="button"
                  onClick={() => setFeatureIndex(i)}
                  aria-label={f.title}
                  aria-current={i === featureIndex ? 'true' : undefined}
                  className={`h-1.5 rounded-full transition-all ${
                    i === featureIndex
                      ? 'w-6 bg-white'
                      : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
