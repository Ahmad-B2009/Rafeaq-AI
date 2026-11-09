import { useEffect, useMemo, useState } from 'react'
import { RafeeqIcon } from './RafeeqIcon.jsx'
import './AchievementSection.css'

const STORAGE_KEY = 'rafeaq_tasks_v1'
const PRIORITIES = [
  { id: 'high', label: 'عالية', color: 'bg-rose-100 text-rose-700' },
  { id: 'medium', label: 'متوسطة', color: 'bg-amber-100 text-amber-700' },
  { id: 'low', label: 'منخفضة', color: 'bg-sky-100 text-sky-700' },
]
const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'هذا الأسبوع' },
  { id: 'active', label: 'المتبقية' },
  { id: 'done', label: 'المنجزة' },
]

function localDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createTaskId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeTasks(value) {
  if (!Array.isArray(value)) return []
  return value.filter((task) => task && typeof task === 'object').map((task) => ({
    id: String(task.id || createTaskId()),
    text: typeof task.text === 'string' ? task.text : '',
    done: Boolean(task.done),
    priority: PRIORITIES.some((priority) => priority.id === task.priority) ? task.priority : 'medium',
    dueDate: typeof task.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) ? task.dueDate : '',
    category: typeof task.category === 'string' ? task.category : '',
  })).filter((task) => task.text.trim())
}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return { tasks: stored ? normalizeTasks(JSON.parse(stored)) : [], error: '' }
  } catch {
    return { tasks: [], error: 'تعذر قراءة المهام المحفوظة من هذا الجهاز.' }
  }
}

function emptyForm() {
  return { text: '', priority: 'medium', dueDate: '', category: '' }
}

export default function AchievementSection({ compact = false }) {
  const [initialState] = useState(loadTasks)
  const [tasks, setTasks] = useState(initialState.tasks)
  const [shouldPersist, setShouldPersist] = useState(!initialState.error)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [error, setError] = useState(initialState.error)

  function updateTasks(updater) {
    setShouldPersist(true)
    setTasks(updater)
  }

  useEffect(() => {
    if (!shouldPersist) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
      setError('')
    } catch {
      setError('تعذر حفظ المهام. تحقق من مساحة التخزين في المتصفح.')
    }
  }, [shouldPersist, tasks])

  useEffect(() => {
    function syncTasks(event) {
      if (event.key !== STORAGE_KEY) return
      try {
        updateTasks(event.newValue ? normalizeTasks(JSON.parse(event.newValue)) : [])
        setError('')
      } catch {
        setError('تعذر تحديث المهام من نافذة أخرى.')
      }
    }
    window.addEventListener('storage', syncTasks)
    return () => window.removeEventListener('storage', syncTasks)
  }, [])

  const today = localDateKey(new Date())
  const weekStartDate = new Date()
  weekStartDate.setHours(0, 0, 0, 0)
  weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay())
  const weekStart = localDateKey(weekStartDate)
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEnd = localDateKey(weekEndDate)

  const categories = useMemo(
    () => [...new Set(tasks.map((task) => task.category.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar')),
    [tasks],
  )
  const completed = tasks.filter((task) => task.done).length
  const pending = tasks.length - completed
  const dueToday = tasks.filter((task) => !task.done && task.dueDate === today).length
  const overdue = tasks.filter((task) => !task.done && task.dueDate && task.dueDate < today).length
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  const visibleTasks = tasks
    .filter((task) => {
      if (filter === 'today') return task.dueDate === today
      if (filter === 'week') return task.dueDate >= weekStart && task.dueDate <= weekEnd
      if (filter === 'active') return !task.done
      if (filter === 'done') return task.done
      return true
    })
    .filter((task) => categoryFilter === 'all' || task.category === categoryFilter)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (a.done !== b.done) return Number(a.done) - Number(b.done)
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority]
      return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31')
    })

  function resetForm() {
    setForm(emptyForm())
    setEditingId(null)
  }

  function submitTask(event) {
    event.preventDefault()
    const text = form.text.trim()
    if (!text) {
      setError('اكتب عنوان المهمة أولاً.')
      return
    }
    if (text.length > 180 || form.category.trim().length > 80) {
      setError('عنوان المهمة بحد أقصى 180 حرفاً، والتصنيف بحد أقصى 80 حرفاً.')
      return
    }

    if (editingId) {
      updateTasks((current) => current.map((task) => task.id === editingId
        ? { ...task, ...form, text, category: form.category.trim() }
        : task))
    } else {
        updateTasks((current) => [{
        id: createTaskId(),
        ...form,
        text,
        category: form.category.trim(),
        done: false,
      }, ...current])
    }
    setError('')
    resetForm()
  }

  function editTask(task) {
    setEditingId(task.id)
    setForm({
      text: task.text,
      priority: task.priority,
      dueDate: task.dueDate,
      category: task.category,
    })
  }

  const rootClass = `achievement-page ${compact ? 'achievement-page--compact space-y-4 overflow-y-auto p-2' : 'mx-auto max-w-[1080px] space-y-5'}`

  return (
    <section className={rootClass} dir="rtl" aria-labelledby="achievement-title">
      {!compact && (
        <header className="achievement-hero glass relative overflow-hidden rounded-[26px] p-6 sm:p-8">
          <div className="achievement-hero-glow" aria-hidden="true" />
          <div className="achievement-hero-content">
            <div className="flex items-center gap-3">
              <span className="achievement-hero-icon"><RafeeqIcon name="list" size={23} weight="duotone" /></span>
              <div>
                <span className="achievement-eyebrow">مساحة الإنجاز</span>
                <h1 id="achievement-title" className="text-[20px] font-black sm:text-[22px]">الإنجاز</h1>
                <p className="text-[11px] text-[var(--muted)]">خطّط بوضوح، أنجز بذكاء، وتابع تقدمك.</p>
              </div>
            </div>
            <span className="achievement-phase w-fit rounded-full bg-emerald-100 px-3 py-1 text-[9px] font-bold text-emerald-800">
              المرحلة الأولى · التنظيم الشخصي
            </span>
          </div>
        </header>
      )}

      <div className="achievement-stat-grid grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'كل المهام', value: tasks.length, icon: '▤', tone: 'indigo' },
          { label: 'المتبقية', value: pending, icon: '◷', tone: 'amber' },
          { label: 'موعدها اليوم', value: dueToday, icon: '◉', tone: 'sky' },
          { label: 'متأخرة', value: overdue, icon: '!', tone: 'rose' },
        ].map((stat) => (
          <div key={stat.label} className={`achievement-stat achievement-stat--${stat.tone}`}>
            <span className="achievement-stat-icon" aria-hidden="true">{stat.icon}</span>
            <div className="min-w-0">
              <div className="text-[9px] font-semibold opacity-80">{stat.label}</div>
              <div className="mt-1 text-[22px] font-black">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="achievement-content glass grid gap-5 rounded-[26px] p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,.65fr)]">
        <div className="achievement-main-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[14px] font-bold">{editingId ? 'تعديل المهمة' : 'أضف مهمة'}</h2>
              <p className="achievement-section-caption">{editingId ? 'حدّث تفاصيل المهمة ثم احفظ تغييراتك.' : 'رتّب خطوتك التالية في ثوانٍ.'}</p>
            </div>
            {editingId && <button type="button" onClick={resetForm} className="text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--ink)]">إلغاء التعديل</button>}
          </div>
          <form onSubmit={submitTask} className="achievement-form space-y-3">
            <label className="block">
              <span className="sr-only">عنوان المهمة</span>
              <input
                autoFocus={compact && Boolean(editingId)}
                value={form.text}
                onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
                maxLength={180}
                placeholder="مثال: مراجعة درس الاتزان الكيميائي"
                className="achievement-control w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2.5 text-[11px] text-[var(--ink)] outline-none focus:border-indigo-400"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[9px] font-semibold text-[var(--muted)]">الأولوية</span>
                <select
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                  className="achievement-control w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-[10px] text-[var(--ink)] outline-none"
                >
                  {PRIORITIES.map((priority) => <option key={priority.id} value={priority.id}>{priority.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[9px] font-semibold text-[var(--muted)]">موعد التنفيذ</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                  className="achievement-control w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-[10px] text-[var(--ink)] outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[9px] font-semibold text-[var(--muted)]">المادة أو المشروع</span>
                <input
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  maxLength={80}
                  placeholder="مثال: الأحياء"
                  className="achievement-control w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-[10px] text-[var(--ink)] outline-none focus:border-indigo-400"
                />
              </label>
            </div>
            <button type="submit" className="achievement-submit btn-grad flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-bold text-white">
              {editingId ? <RafeeqIcon name="check" size={15} /> : <RafeeqIcon name="plus" size={15} />}
              {editingId ? 'حفظ التعديلات' : 'إضافة المهمة'}
            </button>
          </form>

          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-[10px] leading-5 text-rose-800">{error}</p>}

          <div className="achievement-toolbar flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
            <div className="achievement-filters flex flex-wrap gap-1.5" role="tablist" aria-label="عرض المهام">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  onClick={() => setFilter(item.id)}
                  className={`achievement-filter rounded-full px-3 py-1.5 text-[9px] font-semibold ${filter === item.id ? 'bg-indigo-600 text-white' : 'bg-white/70 text-[var(--muted)] hover:bg-white'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {categories.length > 0 && (
              <select
                aria-label="تصفية حسب المادة أو المشروع"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="achievement-category-filter rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-[9px] text-[var(--ink)]"
              >
                <option value="all">كل التصنيفات</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            )}
          </div>

          {visibleTasks.length === 0 ? (
            <p className="achievement-empty rounded-2xl border border-dashed border-[var(--line)] bg-white/40 p-6 text-center text-[10px] leading-6 text-[var(--muted)]">
              {tasks.length ? 'لا توجد مهام في هذا العرض. جرّب تصنيفاً آخر.' : 'لا توجد مهام بعد. أضف أول مهمة لتبدأ خطتك.'}
            </p>
          ) : (
            <ul className="achievement-task-list space-y-2">
              {visibleTasks.map((task) => {
                const priority = PRIORITIES.find((item) => item.id === task.priority) || PRIORITIES[1]
                const isOverdue = !task.done && task.dueDate && task.dueDate < today
                return (
                  <li key={task.id} className={`achievement-task flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white/75 p-3 ${task.done ? 'achievement-task--done opacity-65' : ''}`}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => updateTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}
                      aria-label={task.done ? 'إعادة فتح المهمة' : 'إتمام المهمة'}
                      className="achievement-checkbox mt-1 h-4 w-4 accent-indigo-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`break-words text-[11px] font-semibold ${task.done ? 'text-[var(--muted)] line-through' : 'text-[var(--ink)]'}`}>{task.text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${priority.color}`}>{priority.label}</span>
                        {task.category && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] text-slate-600">{task.category}</span>}
                        {task.dueDate && <span className={`text-[8px] ${isOverdue ? 'font-bold text-rose-700' : 'text-[var(--muted)]'}`}>{isOverdue ? 'متأخرة · ' : 'الموعد · '}{task.dueDate}</span>}
                      </div>
                    </div>
                    <div className="achievement-task-actions flex shrink-0 gap-1">
                      <button type="button" onClick={() => editTask(task)} aria-label={`تعديل ${task.text}`} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-indigo-50 hover:text-indigo-700"><RafeeqIcon name="edit" size={16} /></button>
                      <button type="button" onClick={() => {
                        updateTasks((current) => current.filter((item) => item.id !== task.id))
                        if (editingId === task.id) resetForm()
                      }} aria-label={`حذف ${task.text}`} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-rose-50 hover:text-rose-700"><RafeeqIcon name="trash" size={16} /></button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <aside className="achievement-progress space-y-4 rounded-2xl border border-[var(--line)] bg-white/55 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[12px] font-bold">تقدمك</h3>
              <p className="mt-1 text-[9px] text-[var(--muted)]">يتحدث مع إتمام مهامك</p>
            </div>
            <span className="text-[22px] font-black text-indigo-700">{progress}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-label="نسبة المهام المكتملة"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-white/80 p-3">
              <div className="text-[18px] font-black text-emerald-700">{completed}</div>
              <div className="text-[8px] text-[var(--muted)]">منجزة</div>
            </div>
            <div className="rounded-xl bg-white/80 p-3">
              <div className="text-[18px] font-black text-amber-700">{pending}</div>
              <div className="text-[8px] text-[var(--muted)]">متبقية</div>
            </div>
          </div>
          <p className="text-[9px] leading-5 text-[var(--muted)]">
            تُحفظ مهامك على هذا الجهاز وتظهر أيضاً في تطبيق المهام داخل رفيق OS.
          </p>
        </aside>
      </div>
    </section>
  )
}
