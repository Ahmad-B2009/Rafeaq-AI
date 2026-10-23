// src/os/StartMenu.jsx
// قائمة ابدأ: مستخدم + بحث + قائمة التطبيقات + أدوات النظام + تسجيل الخروج.
import { useEffect, useRef, useState } from 'react'
import { Icon, AppIcon } from './icons'
import { APPS, getApp } from './apps'
import { ResultList, useSearch } from './SearchBox'

export default function StartMenu({ recents, profile, subjects, onOpen, onClose, onLogout, onTile }) {
  const [q, setQ] = useState('')
  const groups = useSearch(q)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  const first = groups[0]?.items[0]
  const recentApps = recents.map(getApp).filter((a) => a && a.id !== 'home').slice(0, 3)

  const Row = ({ app }) => (
    <button className="ros-sitem" onClick={() => onOpen(app.id)}>
      <AppIcon app={app} size={30} />
      <span className="ros-sname">{app.title}</span>
      <Icon name="chevron" size={16} className="ros-schev" />
    </button>
  )

  return (
    <div className="ros-start" role="menu" aria-label="قائمة ابدأ" onPointerDown={(e) => e.stopPropagation()}>
      <div className="ros-user">
        <span className="ros-avatar">{(profile.name || 'ط').trim().charAt(0)}</span>
        <div>
          <strong>{profile.name}</strong>
          <small>{profile.class || 'طالب'}{profile.section ? ` • ${profile.section}` : ''}</small>
        </div>
      </div>

      <label className="ros-start-search">
        <Icon name="search" size={16} />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && first) onOpen(first.open.app, first.open.payload)
            if (e.key === 'Escape') onClose()
          }}
          placeholder="ابحث في التطبيقات والمحتوى..."
          aria-label="بحث في قائمة ابدأ"
        />
      </label>

      <div className="ros-start-list">
        {q.trim() ? (
          <ResultList groups={groups} onPick={(it) => onOpen(it.open.app, it.open.payload)} />
        ) : (
          <>
            {recentApps.length > 0 && (
              <>
                <div className="ros-sgroup">المستخدمة مؤخراً</div>
                {recentApps.map((a) => <Row key={`r${a.id}`} app={a} />)}
                <div className="ros-sgroup">كل التطبيقات</div>
              </>
            )}
            {APPS.map((a) => <Row key={a.id} app={a} />)}
            {subjects.length > 0 && (
              <>
                <div className="ros-sgroup">المواد الدراسية</div>
                <div className="ros-chips">
                  {subjects.slice(0, 6).map((s) => (
                    <button key={s} className="ros-chip" onClick={() => onOpen('books', { query: s, view: 'site' })}>{s}</button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="ros-start-foot">
        <button className="ros-slink" onClick={onTile}><Icon name="grid" size={16} /> ترتيب النوافذ</button>
      </div>
      <button className="ros-power" onClick={onLogout}>
        <Icon name="power" size={18} /> تسجيل الخروج
      </button>
    </div>
  )
}
