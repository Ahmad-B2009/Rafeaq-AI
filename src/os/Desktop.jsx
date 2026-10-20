// src/os/Desktop.jsx
// طبقة سطح المكتب خلف النوافذ: الشعار، البحث، أيقونات التطبيقات، والودجات.
import { useEffect, useState } from 'react'
import { Icon, AppIcon } from './icons'
import { DESKTOP_ICONS, QUICK_TOOLS, getApp } from './apps'
import { readSummary } from './osStorage'
import SearchBox from './SearchBox'

const timeFmt = new Intl.DateTimeFormat('ar-LY-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: false })
const dateFmt = new Intl.DateTimeFormat('ar-LY-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function useSummary(tick) {
  const [s, setS] = useState({ tasksOpen: 0, tasksTotal: 0, notes: 0, books: 0 })
  useEffect(() => {
    let live = true
    const load = () => readSummary().then((v) => live && setS(v))
    load()
    const t = setInterval(load, 5000)
    window.addEventListener('focus', load)
    return () => {
      live = false
      clearInterval(t)
      window.removeEventListener('focus', load)
    }
  }, [tick])
  return s
}

export default function Desktop({ now, logo, sel, setSel, mobile, onOpen, onTile, onCloseStart, winCount }) {
  const summary = useSummary(winCount)
  const touchOpen = (e, id) => (mobile || e.pointerType === 'touch') && onOpen(id)

  return (
    <div className="ros-layer">
      <header className="ros-topbar">
        <div className="ros-brand">
          <img src={logo} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <div>
            <strong><span>AI</span> رفيق</strong>
            <small>معك نحو مستقبل أفضل</small>
          </div>
        </div>
        <SearchBox onOpen={onOpen} />
      </header>

      <div className="ros-icons">
        {DESKTOP_ICONS.map(getApp).map((a) => (
          <button
            key={a.id}
            className={`ros-icon ${sel === a.id ? 'sel' : ''}`}
            onPointerDown={(e) => {
              e.stopPropagation()
              setSel(a.id)
              onCloseStart()
            }}
            onPointerUp={(e) => touchOpen(e, a.id)}
            onClick={(e) => e.detail === 0 && onOpen(a.id)}
            onDoubleClick={() => onOpen(a.id)}
            onKeyDown={(e) => e.key === 'Enter' && onOpen(a.id)}
            aria-label={`فتح ${a.title}`}
          >
            <AppIcon app={a} size={mobile ? 60 : 56} />
            <span className="ros-icon-label">{a.title}</span>
          </button>
        ))}
      </div>

      <aside className="ros-widgets" aria-label="ودجات">
        <section className="ros-card ros-clock-card">
          <div>
            <strong>{timeFmt.format(now)}</strong>
            <small>{dateFmt.format(now)}</small>
          </div>
          <Icon name="calendar" size={26} />
        </section>

        <section className="ros-card ros-sum-card">
          <h4>ملخص اليوم</h4>
          <ul>
            <li><b>{summary.tasksOpen}</b><span>{summary.tasksTotal ? `مهمة متبقية من ${summary.tasksTotal}` : 'لا توجد مهام بعد'}</span></li>
            <li><b>{summary.notes}</b><span>ملاحظة محفوظة</span></li>
            <li><b>{summary.books}</b><span>كتاب في مكتبتي</span></li>
          </ul>
        </section>

        <section className="ros-card ros-quick">
          <h4>أدوات سريعة</h4>
          <div className="ros-quick-grid">
            {QUICK_TOOLS.map(getApp).map((a) => (
              <button key={a.id} className="ros-qtool" onClick={() => onOpen(a.id)}>
                <AppIcon app={a} size={34} />
                <span>{a.title}</span>
              </button>
            ))}
            <button className="ros-qtool" onClick={onTile}>
              <span className="ros-aicon ros-aicon-plain" style={{ width: 34, height: 34, borderRadius: 10 }}><Icon name="grid" size={18} /></span>
              <span>ترتيب النوافذ</span>
            </button>
          </div>
        </section>
      </aside>
    </div>
  )
}
