// src/os/RafeeqOS.jsx
// Rafeeq OS — سطح مكتب + شريط مهام + قائمة ابدأ + نظام نوافذ (لابتوب / تابلت / هاتف).
// التطبيقات الحالية (رفيق AI، دفتر رفيق، المكتبة، السبورة، الملاحظات، المؤقت) تُعرض من Dashboard نفسه داخل نوافذ.
import { Component, memo, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Window from './Window'
import TasksApp from './apps/TasksApp'
import SettingsApp from './apps/SettingsApp'
import HomeApp from './apps/HomeApp'
import Desktop from './Desktop'
import StartMenu from './StartMenu'
import Taskbar from './Taskbar'
import { WINDOW_APPS, getApp, resolveApp } from './apps'
import { reducer, initState, serialize } from './wm'
import { loadOS, saveOS, readProfile, readSubjects } from './osStorage'
import './os.css'

const TOKEN_KEY = 'rafeaq_token'
const LOGO = '/logo.png'

/* ---------- أدوات ---------- */
function useMedia(query) {
  const [m, setM] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const h = () => setM(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [query])
  return m
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000)
    return () => clearInterval(t)
  }, [])
  return now
}

// خطأ داخل تطبيق واحد لا يجب أن يُسقط النظام كله
class AppBoundary extends Component {
  state = { err: null }
  static getDerivedStateFromError(err) {
    return { err }
  }
  componentDidCatch(err) {
    console.error('[Rafeeq OS] app crashed:', this.props.name, err)
  }
  render() {
    if (this.state.err) {
      return (
        <div className="ros-pad" dir="rtl">
          <p className="ros-empty">تعذر تشغيل «{this.props.name}». أغلق النافذة وافتحها من جديد.</p>
          <button className="ros-btn" onClick={() => this.setState({ err: null })}>إعادة المحاولة</button>
        </div>
      )
    }
    return this.props.children
  }
}

const AppView = memo(function AppView({ appId, payload, open, osRef, wallpaper, profile }) {
  const app = getApp(appId)
  if (!app) return null
  if (app.kind === 'dash') return <Dashboard embedded forcedTab={app.tab} launch={payload} onNavigate={open} />
  if (app.kind === 'home') return <HomeApp profile={profile} open={open} logo={LOGO} />
  if (app.kind === 'tasks') return <TasksApp />
  if (app.kind === 'settings') return <SettingsApp osRef={osRef} wallpaper={wallpaper} />
  return null
})

/* ---------- النظام ---------- */
export default function RafeeqOS() {
  const nav = useNavigate()
  const mobile = useMedia('(max-width: 767px)')
  const taskbarH = mobile ? 60 : 68

  // لا دخول بدون تسجيل دخول (نفس شرط Dashboard)
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) nav('/login', { replace: true })
  }, [nav])

  const [prefs, setPrefs] = useState(loadOS)
  const [st, dispatch] = useReducer(reducer, undefined, () => initState(loadOS().windows, WINDOW_APPS.map((a) => a.id)))
  const [area, setArea] = useState(() => ({ w: window.innerWidth, h: window.innerHeight - (window.innerWidth < 768 ? 60 : 68) }))
  const [startOpen, setStartOpen] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [profile, setProfile] = useState(readProfile)
  const [sel, setSel] = useState(null)
  const [ctx, setCtx] = useState(null)
  const [snap, setSnap] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [note, setNote] = useState('')
  const noteTimer = useRef(null)
  const now = useClock()

  const areaRef = useRef(area)
  areaRef.current = area

  useEffect(() => {
    const on = () => {
      const a = { w: window.innerWidth, h: window.innerHeight - taskbarH }
      setArea(a)
      dispatch({ type: 'clamp', area: a })
    }
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [taskbarH])

  const notify = useCallback((text) => {
    setNote(text)
    clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(''), 3200)
  }, [])

  const openApp = useCallback((id, payload) => {
    // الاختصارات (ملفاتي، تحليل الصور) تفتح تطبيقها الحقيقي بإعداد مسبق
    const r = resolveApp(id, payload)
    if (!r || !r.app) return // مثل 'home' القادمة من Dashboard داخل نافذة: لا شيء يُفتح
    const { app } = r
    dispatch({ type: 'open', app, area: areaRef.current, payload: r.payload ? { ...r.payload, nonce: Date.now() } : undefined })
    setPrefs((p) => ({ ...p, recents: [app.id, ...p.recents.filter((x) => x !== app.id)].slice(0, 6) }))
    setStartOpen(false)
    setCtx(null)
  }, [])

  // حفظ التفضيلات وحالة النوافذ (مع تأخير بسيط)
  useEffect(() => {
    const t = setTimeout(() => saveOS({ wallpaper: prefs.wallpaper, recents: prefs.recents, windows: serialize(st.wins) }), 250)
    return () => clearTimeout(t)
  }, [prefs, st.wins])

  // واجهة تستخدمها نافذة الإعدادات
  const osRef = useRef({})
  osRef.current = {
    setWallpaper: (id) => setPrefs((p) => ({ ...p, wallpaper: id })),
    saveProfile: (p) => {
      try {
        localStorage.setItem('rafeaq_profile', JSON.stringify(p))
        localStorage.setItem('rafeaq_student_class', p.class)
        localStorage.setItem('rafeaq_student_section', p.section)
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent('rafeeq:ls', { detail: { key: 'rafeaq_profile', src: 'os' } }))
      setProfile(p)
      notify('تم حفظ إعداداتك ✓')
    },
    tile: () => dispatch({ type: 'tile', area: areaRef.current }),
    closeAll: () => dispatch({ type: 'closeAll' }),
    classic: () => nav('/dashboard'),
    logout: () => {
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.setItem('just_logged_out', '1')
      nav('/login', { replace: true })
    },
  }

  /* ---------- قائمة Start: فتح وإغلاق ---------- */
  useEffect(() => {
    if (!startOpen) return undefined
    readSubjects().then(setSubjects)
    setProfile(readProfile())
    const onDown = (e) => {
      if (e.target.closest('.ros-start') || e.target.closest('.ros-orb') || e.target.closest('.ros-tb-search')) return
      setStartOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setStartOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [startOpen])

  useEffect(() => {
    if (!ctx) return undefined
    const close = () => setCtx(null)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [ctx])

  const topVisible = st.focus

  const onTaskbarClick = (w) => {
    if (w.state === 'min') dispatch({ type: 'focus', id: w.id })
    else if (st.focus === w.id) dispatch({ type: 'min', id: w.id })
    else dispatch({ type: 'focus', id: w.id })
  }

  const wallpaperClass = `ros-wp-${prefs.wallpaper}`

  // أول تشغيل على اللابتوب/التابلت: تفتح نافذة «الرئيسية» كما في التصميم
  const welcomed = useRef(false)
  useEffect(() => {
    if (welcomed.current) return
    welcomed.current = true
    if (prefs.fresh && !mobile && window.innerWidth >= 768) openApp('home')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`ros-root ${wallpaperClass} ${mobile ? 'ros-mobile' : ''} ${dragging ? 'ros-dragging' : ''}`}
      dir="rtl"
      style={{ '--tb': `${taskbarH}px` }}
    >
      {/* ===== سطح المكتب ===== */}
      <div
        className="ros-desktop"
        onPointerDown={() => {
          setSel(null)
          setStartOpen(false)
        }}
        onContextMenu={(e) => {
          if (e.target.closest('.ros-win') || e.target.closest('.ros-icon') || e.target.closest('.ros-search')) return
          e.preventDefault()
          setCtx({ x: e.clientX, y: e.clientY })
        }}
      >
        <Desktop
          now={now}
          logo={LOGO}
          sel={sel}
          setSel={setSel}
          mobile={mobile}
          onOpen={openApp}
          onTile={() => osRef.current.tile()}
          onCloseStart={() => setStartOpen(false)}
          winCount={st.wins.length}
        />

        {st.wins.map((w) => {
          const app = getApp(w.app)
          return (
            <Window
              key={w.id}
              win={w}
              app={app}
              active={topVisible === w.id}
              area={area}
              mobile={mobile}
              dispatch={dispatch}
              onSnapHint={setSnap}
              onDragging={setDragging}
            >
              <AppBoundary name={app.title}>
                <AppView appId={w.app} payload={w.payload} open={openApp} osRef={osRef} wallpaper={prefs.wallpaper} profile={profile} />
              </AppBoundary>
            </Window>
          )
        })}

        {snap && <div className={`ros-snap ros-snap-${snap}`} aria-hidden="true" />}
      </div>

      {/* ===== قائمة ابدأ ===== */}
      {startOpen && (
        <StartMenu
          recents={prefs.recents}
          profile={profile}
          subjects={subjects}
          onOpen={openApp}
          onClose={() => setStartOpen(false)}
          onTile={() => {
            osRef.current.tile()
            setStartOpen(false)
          }}
          onClassic={() => nav('/dashboard')}
          onLogout={() => osRef.current.logout()}
        />
      )}

      {/* ===== شريط المهام ===== */}
      <Taskbar
        wins={st.wins}
        focus={st.focus}
        mobile={mobile}
        now={now}
        startOpen={startOpen}
        logo={LOGO}
        onStart={() => setStartOpen((v) => !v)}
        onOpen={openApp}
        onTaskClick={onTaskbarClick}
        onShowDesktop={() => dispatch({ type: 'minAll' })}
      />

      {/* ===== قائمة سطح المكتب (كليك يمين) ===== */}
      {ctx && (
        <div className="ros-ctx" style={{ left: ctx.x, top: ctx.y }} onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => openApp('settings')}>تغيير الخلفية والإعدادات</button>
          <button onClick={() => { osRef.current.tile(); setCtx(null) }}>ترتيب النوافذ جنباً إلى جنب</button>
          <button onClick={() => { dispatch({ type: 'minAll' }); setCtx(null) }}>إظهار سطح المكتب</button>
        </div>
      )}

      {note && <div className="ros-bubble" role="status">{note}</div>}
    </div>
  )
}
