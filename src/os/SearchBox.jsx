// src/os/SearchBox.jsx
// بحث حقيقي في التطبيقات والكتب والملاحظات والمواد (من بيانات الجهاز فقط، بلا نتائج وهمية).
import { useEffect, useRef, useState } from 'react'
import { Icon, AppIcon } from './icons'
import { searchAll } from './osStorage'

export function useSearch(q) {
  const [groups, setGroups] = useState([])
  useEffect(() => {
    if (!q.trim()) {
      setGroups([])
      return undefined
    }
    let live = true
    const t = setTimeout(async () => {
      const g = await searchAll(q)
      if (live) setGroups(g)
    }, 140)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [q])
  return groups
}

export function ResultList({ groups, onPick }) {
  if (!groups.length) return <p className="ros-empty">لا توجد نتائج مطابقة.</p>
  return groups.map((g) => (
    <div key={g.title}>
      <div className="ros-sgroup">{g.title}</div>
      {g.items.map((it) => (
        <button key={it.key} className="ros-sitem" onClick={() => onPick(it)}>
          {it.icon ? <AppIcon app={it} size={28} /> : <span className="ros-sglyph">{it.glyph}</span>}
          <span className="ros-sname">{it.label}</span>
        </button>
      ))}
    </div>
  ))
}

// شريط البحث العلوي في سطح المكتب
export default function SearchBox({ onOpen }) {
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const groups = useSearch(q)
  const box = useRef(null)

  useEffect(() => {
    const down = (e) => {
      if (!box.current?.contains(e.target)) setFocus(false)
    }
    document.addEventListener('pointerdown', down)
    return () => document.removeEventListener('pointerdown', down)
  }, [])

  const pick = (it) => {
    onOpen(it.open.app, it.open.payload)
    setQ('')
    setFocus(false)
  }
  const first = groups[0]?.items[0]
  const show = focus && q.trim()

  return (
    <div className="ros-search" ref={box} onPointerDown={(e) => e.stopPropagation()}>
      <Icon name="search" size={18} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && first) pick(first)
          if (e.key === 'Escape') {
            setQ('')
            setFocus(false)
          }
        }}
        placeholder="ابحث عن أي شيء..."
        aria-label="بحث"
      />
      {show && (
        <div className="ros-search-pop" role="listbox">
          <ResultList groups={groups} onPick={pick} />
        </div>
      )}
    </div>
  )
}
