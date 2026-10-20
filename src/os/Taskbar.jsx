// src/os/Taskbar.jsx
// شريط المهام: ابدأ + بحث (يسار)، تطبيقات (وسط)، حالة النظام والوقت (يمين).
import { useEffect, useState } from 'react'
import { Icon, AppIcon } from './icons'
import { PINNED, getApp, resolveApp } from './apps'

const timeFmt = new Intl.DateTimeFormat('ar-LY-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: false })
const dateFmt = new Intl.DateTimeFormat('ar-LY-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// حالة النظام الحقيقية: الاتصال بالإنترنت + البطارية (إن كان المتصفح يدعمها)
function useSystemStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [battery, setBattery] = useState(null)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    let bat = null
    let alive = true
    const read = () => bat && alive && setBattery({ level: Math.round(bat.level * 100), charging: bat.charging })
    if (navigator.getBattery) {
      navigator.getBattery().then((b) => {
        bat = b
        read()
        b.addEventListener('levelchange', read)
        b.addEventListener('chargingchange', read)
      }).catch(() => {})
    }
    return () => {
      alive = false
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      if (bat) {
        bat.removeEventListener('levelchange', read)
        bat.removeEventListener('chargingchange', read)
      }
    }
  }, [])
  return { online, battery }
}

export default function Taskbar({ wins, focus, mobile, now, startOpen, logo, onStart, onOpen, onTaskClick, onShowDesktop }) {
  const { online, battery } = useSystemStatus()
  const byId = new Map(wins.map((w) => [w.id, w]))

  // الأيقونات الثابتة + أي نافذة مفتوحة ليست ضمنها
  const pinned = PINNED.map(getApp).filter(Boolean)
  const extra = wins.map((w) => getApp(w.app)).filter((a) => a && !PINNED.includes(a.id))
  const items = [...pinned, ...extra]

  return (
    <nav className="ros-taskbar" aria-label="شريط المهام">
      <div className="ros-tb-left">
        <button className={`ros-orb ${startOpen ? 'on' : ''}`} onClick={onStart} aria-label="قائمة ابدأ" aria-expanded={startOpen}>
          <img src={logo} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="ros-orb-fallback">ر</span>
        </button>
        {!mobile && (
          <button className="ros-tb-search" onClick={onStart} aria-label="ابحث هنا">
            <Icon name="search" size={17} />
            <span>ابحث هنا...</span>
          </button>
        )}
      </div>

      <div className="ros-tasks-strip">
        {items.map((a) => {
          const real = resolveApp(a.id)
          const win = a.alias ? null : byId.get(real.app.id)
          const active = !!win && win.state !== 'min' && focus === win.id
          return (
            <button
              key={a.id}
              className={`ros-tbtn ${active ? 'active' : ''} ${win ? 'running' : ''}`}
              onClick={() => (win ? onTaskClick(win) : onOpen(a.id))}
              title={a.title}
              aria-label={a.title}
            >
              <AppIcon app={a} size={mobile ? 34 : 36} />
            </button>
          )
        })}
      </div>

      <div className="ros-tray">
        {!mobile && (
          <>
            <Icon name="chevronUp" size={16} className="ros-tray-ic" />
            <span className="ros-tray-ic" title={online ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت'}>
              <Icon name={online ? 'wifi' : 'wifiOff'} size={18} />
            </span>
            {battery && (
              <span className="ros-tray-ic ros-bat" title={`البطارية ${battery.level}%${battery.charging ? ' (تشحن)' : ''}`}>
                <Icon name="battery" size={19} />
                <small>{battery.level}%</small>
              </span>
            )}
          </>
        )}
        <div className="ros-clock" title={dateFmt.format(now)}>
          <strong>{timeFmt.format(now)}</strong>
          {!mobile && <small>{dateFmt.format(now)}</small>}
        </div>
        {!mobile && <button className="ros-showdesk" onClick={onShowDesktop} aria-label="إظهار سطح المكتب" title="إظهار سطح المكتب" />}
      </div>
    </nav>
  )
}
