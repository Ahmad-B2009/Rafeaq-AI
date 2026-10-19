// src/os/apps/TasksApp.jsx
// مهامي: إضافة، تعديل، حذف، إنجاز، وحفظ محلي.
import { useEffect, useState } from 'react'

const KEY = 'rafeaq_tasks_v1'

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export default function TasksApp() {
  const [tasks, setTasks] = useState(load)
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('all') // all | active | done
  const [editing, setEditing] = useState(null) // { id, text }

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(tasks))
    } catch {
      /* ignore */
    }
  }, [tasks])

  const add = () => {
    const t = text.trim()
    if (!t) return
    setTasks((c) => [{ id: `${Date.now()}${Math.random().toString(16).slice(2, 6)}`, text: t, done: false }, ...c])
    setText('')
  }
  const toggle = (id) => setTasks((c) => c.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const remove = (id) => setTasks((c) => c.filter((t) => t.id !== id))
  const commitEdit = () => {
    if (!editing) return
    const t = editing.text.trim()
    if (t) setTasks((c) => c.map((x) => (x.id === editing.id ? { ...x, text: t } : x)))
    setEditing(null)
  }

  const shown = tasks.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.done : !t.done))
  const left = tasks.filter((t) => !t.done).length

  return (
    <div className="ros-pad ros-tasks" dir="rtl">
      <div className="ros-row">
        <input
          className="ros-input"
          value={text}
          placeholder="أضف مهمة جديدة..."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          aria-label="مهمة جديدة"
        />
        <button className="ros-btn primary" onClick={add} disabled={!text.trim()}>إضافة</button>
      </div>

      <div className="ros-row ros-filters" role="tablist">
        {[['all', 'الكل'], ['active', 'المتبقية'], ['done', 'المنجزة']].map(([id, label]) => (
          <button key={id} className={`ros-chip ${filter === id ? 'on' : ''}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
        <span className="ros-muted">{left} متبقية</span>
      </div>

      {shown.length === 0 ? (
        <p className="ros-empty">{tasks.length === 0 ? 'لا توجد مهام بعد. أضف أول مهمة من الأعلى.' : 'لا توجد مهام في هذا التصنيف.'}</p>
      ) : (
        <ul className="ros-list">
          {shown.map((t) => (
            <li key={t.id} className={t.done ? 'done' : ''}>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} aria-label="تم الإنجاز" />
              {editing?.id === t.id ? (
                <input
                  className="ros-input"
                  autoFocus
                  value={editing.text}
                  onChange={(e) => setEditing({ id: t.id, text: e.target.value })}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit()
                    if (e.key === 'Escape') setEditing(null)
                  }}
                />
              ) : (
                <span className="ros-ttext" onDoubleClick={() => setEditing({ id: t.id, text: t.text })} title="انقر مرتين للتعديل">{t.text}</span>
              )}
              <button className="ros-mini" onClick={() => setEditing({ id: t.id, text: t.text })} aria-label="تعديل">✎</button>
              <button className="ros-mini danger" onClick={() => remove(t.id)} aria-label="حذف">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
