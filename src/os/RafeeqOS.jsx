// src/os/RafeeqOS.jsx
// Rafeeq OS — المرحلة الأولى: سطح المكتب + شريط المهام + قائمة Start + نظام النوافذ.
// التطبيقات الحالية (رفيق AI، دفتر رفيق، المكتبة، الملاحظات، المؤقت) تُعرض من Dashboard نفسه داخل نوافذ.
import { Component, memo, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Window from './Window'
import BoardApp from './apps/BoardApp'
import TasksApp from './apps/TasksApp'
import SettingsApp from './apps/SettingsApp'
import { APPS, getApp } from './apps'
import { reducer, initState, serialize } from './wm'
import { loadOS, saveOS, readProfile, searchAll, readSubjects } from './osStorage'
import './os.css'

const TOKEN_KEY = 'rafeaq_token'
const timeFmt = new Intl.DateTimeFormat('ar-LY-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('ar-LY-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })

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

const AppView = memo(function AppView({ appId, payload, open, osRef, wallpaper }) {
  const app = getApp(appId)
  if (!app) return null
  if (app.kind === 'dash') return <Dashboard embedded forcedTab={app.tab} launch={payload} onNavigate={open} />
  if (app.kind === 'tasks') return <TasksApp />
  if (app.kind === 'board') return <BoardApp />
  if (app.kind === 'settings') return <SettingsApp osRef={osRef} wallpaper={wallpaper} />
  return null
})

/* ---------- قائمة Start ---------- */
function StartMenu({ recents, profile, subjects, onOpen, onClose, onLogout, onClassic, onTile }) {
  const [q, setQ] = useState('')
  const [groups, setGroups] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!q.trim()) {
      setGroups([])
      return undefined
    }
    let live = true
    const t = setTimeout(async () => {
      const g = await searchAll(q)
      if (live) setGroups(g)
    }, 150)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [q])

  const first = groups[0]?.items[0]
  const recentApps = recents.map(getApp).filter(Boolean).slice(0, 4)

  const Item = ({ glyph, label, onClick, grad }) => (
    <button className="ros-sitem" onClick={onClick}>
      <span className="ros-sglyph" style={grad ? { background: grad } : undefined}>{glyph}</span>
      <span>{label}</span>
    </button>
  )

  return (
    <div className="ros-start" role="menu" aria-label="قائمة Start" onPointerDown={(e) => e.stopPropagation()}>
      <div className="ros-start-cols">
        <div className="ros-start-main">
          {q.trim() ? (
            groups.length === 0 ? (
              <p className="ros-empty">لا توجد نتائج مطابقة.</p>
            ) : (
              groups.map((g) => (
                <div key={g.title}>
                  <div className="ros-sgroup">{g.title}</div>
                  {g.items.map((it) => (
                    <Item key={it.key} glyph={it.glyph} label={it.label} onClick={() => onOpen(it.open.app, it.open.payload)} />
                  ))}
                </div>
              ))
            )
          ) : (
            <>
              {recentApps.length > 0 && (
                <>
                  <div className="ros-sgroup">المستخدمة مؤخراً</div>
                  {recentApps.map((a) => <Item key={`r${a.id}`} glyph={a.glyph} grad={a.grad} label={a.title} onClick={() => onOpen(a.id)} />)}
                </>
              )}
              <div className="ros-sgroup">كل التطبيقات</div>
              {APPS.map((a) => <Item key={a.id} glyph={a.glyph} grad={a.grad} label={a.title} onClick={() => onOpen(a.id)} />)}
            </>
          )}
        </div>

        <aside className="ros-start-side">
          <div className="ros-user">
            <span className="ros-avatar">{(profile.name || 'ط').trim().charAt(0)}</span>
            <div>
              <strong>{profile.name}</strong>
              <small>{profile.class || 'طالب'}{profile.section ? ` • ${profile.section}` : ''}</small>
            </div>
          </div>

          {recents[0] && getApp(recents[0]) && (
            <button className="ros-slink" onClick={() => onOpen(recents[0])}>↺ متابعة: {getApp(recents[0]).title}</button>
          )}
          {subjects.length > 0 && (
            <>
              <div className="ros-sgroup light">المواد الدراسية</div>
              {subjects.slice(0, 6).map((s) => (
                <button key={s} className="ros-slink" onClick={() => onOpen('books', { query: s, view: 'site' })}>🎓 {s}</button>
              ))}
            </>
          )}
          <div className="ros-sgrow" />
          <button className="ros-slink" onClick={() => onOpen('settings')}>⚙ الإعدادات</button>
          <button className="ros-slink" onClick={onTile}>▦ ترتيب النوافذ</button>
          <button className="ros-slink" onClick={onClassic}>⇄ النسخة الكلاسيكية</button>
          <button className="ros-slink danger" onClick={onLogout}>⎋ تسجيل الخروج</button>
        </aside>
      </div>

      <div className="ros-start-search">
        <span aria-hidden="true">⌕</span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && first) onOpen(first.open.app, first.open.payload)
            if (e.key === 'Escape') onClose()
          }}
          placeholder="ابحث في التطبيقات والكتب والملاحظات والمواد..."
          aria-label="بحث"
        />
      </div>
    </div>
  )
}

/* ---------- النظام ---------- */
export default function RafeeqOS() {
  const nav = useNavigate()
  const mobile = useMedia('(max-width: 767px)')
  const taskbarH = mobile ? 52 : 42

  // لا دخول بدون تسجيل دخول (نفس شرط Dashboard)
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) nav('/login', { replace: true })
  }, [nav])

  const [prefs, setPrefs] = useState(loadOS)
  const [st, dispatch] = useReducer(reducer, undefined, () => initState(loadOS().windows, APPS.map((a) => a.id)))
  const [area, setArea] = useState(() => ({ w: window.innerWidth, h: window.innerHeight - 42 }))
  const [startOpen, setStartOpen] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [profile, setProfile] = useState(readProfile)
  const [sel, setSel] = useState(null)
  const [ctx, setCtx] = useState(null)
  const [snap, setSnap] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [note, setNote] = useState('')
  const noteTimer = useRef(null)
  const lastPointer = useRef('mouse')
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
    const app = getApp(id)
    if (!app) return // مثل 'home' القادمة من Dashboard: لا شيء يُفتح
    dispatch({ type: 'open', app, area: areaRef.current, payload: payload ? { ...payload, nonce: Date.now() } : undefined })
    setPrefs((p) => ({ ...p, recents: [id, ...p.recents.filter((x) => x !== id)].slice(0, 6) }))
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
  const startBtn = useRef(null)
  useEffect(() => {
    if (!startOpen) return undefined
    readSubjects().then(setSubjects)
    setProfile(readProfile())
    const onDown = (e) => {
      if (e.target.closest('.ros-start') || e.target.closest('.ros-orb')) return
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
          if (e.target.closest('.ros-win') || e.target.closest('.ros-icon')) return
          e.preventDefault()
          setCtx({ x: e.clientX, y: e.clientY })
        }}
      >
        <div className="ros-icons">
          {APPS.map((a) => (
            <button
              key={a.id}
              className={`ros-icon ${sel === a.id ? 'sel' : ''}`}
              onPointerDown={(e) => {
                e.stopPropagation()
                lastPointer.current = e.pointerType
                setSel(a.id)
                setStartOpen(false)
              }}
              onClick={() => (mobile || lastPointer.current === 'touch') && openApp(a.id)}
              onDoubleClick={() => openApp(a.id)}
              onKeyDown={(e) => e.key === 'Enter' && openApp(a.id)}
              aria-label={`فتح ${a.title}`}
            >
              <span className="ros-icon-img" style={{ background: a.grad }}>{a.glyph}</span>
              <span className="ros-icon-label">{a.title}</span>
            </button>
          ))}
        </div>

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
                <AppView appId={w.app} payload={w.payload} open={openApp} osRef={osRef} wallpaper={prefs.wallpaper} />
              </AppBoundary>
            </Window>
          )
        })}

        {snap && <div className={`ros-snap ros-snap-${snap}`} aria-hidden="true" />}
      </div>

      {/* ===== قائمة Start ===== */}
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
      <nav className="ros-taskbar" aria-label="شريط المهام">
        <button ref={startBtn} className={`ros-orb ${startOpen ? 'on' : ''}`} onClick={() => setStartOpen((v) => !v)} aria-label="قائمة Start" aria-expanded={startOpen}>
          <img src="/logo.png" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="ros-orb-fallback">ر</span>
        </button>

        <div className="ros-tasks-strip">
          {st.wins.map((w) => {
            const app = getApp(w.app)
            const active = st.focus === w.id && w.state !== 'min'
            return (
              <button
                key={w.id}
                className={`ros-tbtn ${active ? 'active' : ''} ${w.state === 'min' ? 'min' : ''}`}
                onClick={() => onTaskbarClick(w)}
                title={app.title}
                aria-label={app.title}
              >
                <span className="ros-tglyph" style={{ background: app.grad }}>{app.glyph}</span>
                <span className="ros-tlabel">{app.title}</span>
              </button>
            )
          })}
        </div>

        <div className="ros-tray">
          {mobile && (
            <button className="ros-tbtn ros-homebtn" onClick={() => dispatch({ type: 'minAll' })} aria-label="سطح المكتب">⌂</button>
          )}
          <div className="ros-clock" title={dateFmt.format(now)}>
            <strong>{timeFmt.format(now)}</strong>
            {!mobile && <small>{dateFmt.format(now)}</small>}
          </div>
          {!mobile && <button className="ros-showdesk" onClick={() => dispatch({ type: 'minAll' })} aria-label="إظهار سطح المكتب" title="إظهار سطح المكتب" />}
        </div>
      </nav>

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
