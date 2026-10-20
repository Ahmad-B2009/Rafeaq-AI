// src/os/osStorage.js
// تخزين تفضيلات Rafeeq OS + بحث شامل في بيانات التطبيق المتاحة فعلاً على الجهاز.

import { APPS } from './apps'

export const OS_KEY = 'rafeeq_os_v1'

// نفس المفاتيح التي يستخدمها Dashboard
const K = {
  notes: 'rafeaq_student_notes',
  catalog: 'rafeaq_books_catalog',
  profile: 'rafeaq_profile',
}

function readLS(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

export function loadOS() {
  const s = readLS(OS_KEY, {})
  // التصميم الجديد (ui: 2): من حفظ الخلفية القديمة الافتراضية «aero» ننتقل للخلفية الجديدة مرة واحدة
  const wallpaper = s.ui === 2 && s.wallpaper ? s.wallpaper : s.wallpaper && s.wallpaper !== 'aero' ? s.wallpaper : 'sunrise'
  return {
    wallpaper,
    recents: Array.isArray(s.recents) ? s.recents.slice(0, 6) : [],
    windows: Array.isArray(s.windows) ? s.windows : [],
    fresh: !Array.isArray(s.windows) || s.windows.length === 0,
  }
}

export function saveOS(data) {
  try {
    localStorage.setItem(OS_KEY, JSON.stringify({ ...data, ui: 2 }))
  } catch {
    /* ignore */
  }
}

// اسم الطالب: من إعدادات الحساب الدراسي أولاً، ثم من بيانات تسجيل الدخول (نفس منطق Dashboard)
function loginName() {
  try {
    const raw = localStorage.getItem('rafeaq_user') || localStorage.getItem('rafeaq_name')
    if (!raw) return ''
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'string') return parsed.split('@')[0]
      return parsed?.name || ''
    } catch {
      return String(raw).split('@')[0]
    }
  } catch {
    return ''
  }
}

export function readProfile() {
  const p = readLS(K.profile, null) || {}
  return {
    name: p.name || loginName() || 'الطالب',
    class: p.class || localStorage.getItem('rafeaq_student_class') || '',
    section: p.section || localStorage.getItem('rafeaq_student_section') || '',
  }
}

// أرقام حقيقية من بيانات الجهاز لودجت «ملخص اليوم»
export async function readSummary() {
  const tasks = readLS('rafeaq_tasks_v1', [])
  const list = Array.isArray(tasks) ? tasks : []
  const notes = readLS(K.notes, [])
  const lib = await readLibrary()
  return {
    tasksOpen: list.filter((t) => !t?.done).length,
    tasksTotal: list.length,
    notes: Array.isArray(notes) ? notes.length : 0,
    books: lib.length,
  }
}

export function normalizeAr(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
}

// قراءة مكتبة الجهاز (IndexedDB). نفس تعريف المخازن في Dashboard حتى لا نُنشئ قاعدة ناقصة.
function readLibrary() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('rafeaq_db', 1)
      req.onupgradeneeded = () => {
        const db = req.result
        ;['meta', 'files', 'texts'].forEach((name) => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' })
        })
      }
      req.onerror = () => resolve([])
      req.onsuccess = () => {
        const db = req.result
        try {
          const tx = db.transaction('meta', 'readonly')
          const all = tx.objectStore('meta').getAll()
          all.onsuccess = () => {
            db.close()
            resolve(all.result || [])
          }
          all.onerror = () => {
            db.close()
            resolve([])
          }
        } catch {
          db.close()
          resolve([])
        }
      }
    } catch {
      resolve([])
    }
  })
}

// المواد الدراسية المتاحة فعلاً (من قائمة الكتب المخزنة ومن مكتبة الجهاز)
export async function readSubjects() {
  const catalog = readLS(K.catalog, { books: [] }).books || []
  const lib = await readLibrary()
  const set = new Set()
  ;[...catalog, ...lib].forEach((b) => b?.subject && set.add(b.subject))
  return [...set].slice(0, 8)
}

// البحث الشامل: التطبيقات + كتبي + كتب الموقع (المخزنة) + الملاحظات + المواد
export async function searchAll(query) {
  const q = normalizeAr(query.trim())
  if (!q) return []
  const hit = (...parts) => normalizeAr(parts.filter(Boolean).join(' ')).includes(q)
  const groups = []

  const apps = APPS.filter((a) => hit(a.title, a.keywords)).slice(0, 6)
  if (apps.length) groups.push({ title: 'التطبيقات', items: apps.map((a) => ({ key: `app:${a.id}`, label: a.title, icon: a.icon, grad: a.grad, open: { app: a.id } })) })

  const lib = (await readLibrary()).filter((b) => hit(b.title, b.subject, b.grade)).slice(0, 5)
  if (lib.length) groups.push({ title: 'كتبي', items: lib.map((b) => ({ key: `lib:${b.id}`, label: b.title, glyph: '📖', open: { app: 'books', payload: { query: b.title, view: 'mine' } } })) })

  const catalog = (readLS(K.catalog, { books: [] }).books || []).filter((b) => hit(b.title, b.subject, b.grade)).slice(0, 5)
  if (catalog.length) groups.push({ title: 'كتب الموقع', items: catalog.map((b) => ({ key: `cat:${b.id}`, label: b.title, glyph: '📚', open: { app: 'books', payload: { query: b.title, view: 'site' } } })) })

  const notes = readLS(K.notes, []).filter((n) => hit(n.title, n.content)).slice(0, 5)
  if (notes.length) groups.push({ title: 'ملاحظاتي', items: notes.map((n) => ({ key: `note:${n.id}`, label: n.title, glyph: '▢', open: { app: 'notes', payload: { query: n.title } } })) })

  const subjects = (await readSubjects()).filter((s) => hit(s))
  if (subjects.length) groups.push({ title: 'المواد الدراسية', items: subjects.map((s) => ({ key: `sub:${s}`, label: s, glyph: '🎓', open: { app: 'books', payload: { query: s, view: 'site' } } })) })

  return groups
}
