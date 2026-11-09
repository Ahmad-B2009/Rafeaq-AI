// src/lib/notebookStorage.js
// نظام التخزين المحلي الآمن لدفاتر رفيق AI (Rafeeq Notebook Storage)
// تخزين محلي 100% على جهاز الطالب:
// 1. الدفاتر والملاحظات والمحادثات في localStorage لسرعة الوصول والاسترجاع.
// 2. الملفات الكبيرة والمقاطع والنصوص المستخرجة في IndexedDB (قاعدة rafeaq_db).
// خصوصية تامة: لا يتم رفع أي مستندات أو محادثات شخصية إلى خوادم خارجية أو قواعد بيانات سحابية.

const NOTEBOOKS_KEY = 'rafeaq_notebooks_v2'
const ACTIVE_NOTEBOOK_KEY = 'rafeaq_active_notebook_id_v2'
const DB_NAME = 'rafeaq_db'
const DB_VERSION = 1

function uid(prefix = 'nb') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/* ==================== IndexedDB Helper ==================== */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      ;['meta', 'files', 'texts'].forEach((name) => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' })
      })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbAction(storeName, mode, callback) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const req = callback(store)
    tx.oncomplete = () => resolve(req?.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export const idbPut = (store, val) => idbAction(store, 'readwrite', (s) => s.put(val))
export const idbGet = (store, id) => idbAction(store, 'readonly', (s) => s.get(id))
export const idbDel = (store, id) => idbAction(store, 'readwrite', (s) => s.delete(id))
export const idbAll = (store) => idbAction(store, 'readonly', (s) => s.getAll())

/* ==================== إدارة الدفاتر ==================== */
export function listNotebooks() {
  try {
    const raw = localStorage.getItem(NOTEBOOKS_KEY)
    if (!raw) {
      // دفتر افتراضي ترحيبي
      const defaultNb = {
        id: 'nb_general_welcome',
        title: 'دفتري الأول',
        description: 'دفتر دراسي لمصادري ومستنداتي التعليمية',
        color: '#7955C8',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [], // مصفوفة معرفات المصادر
        messages: [],
        artifacts: [], // ملخصات، بطاقات، اختبارات
      }
      localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify([defaultNb]))
      return [defaultNb]
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : []
  } catch {
    return []
  }
}

export function saveNotebooks(notebooks) {
  try {
    localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(notebooks))
    return true
  } catch (e) {
    console.error('Failed to save notebooks:', e)
    return false
  }
}

export function getActiveNotebookId() {
  return localStorage.getItem(ACTIVE_NOTEBOOK_KEY) || 'nb_general_welcome'
}

export function setActiveNotebookId(id) {
  localStorage.setItem(ACTIVE_NOTEBOOK_KEY, id)
}

export function createNotebook(title = 'دفتر جديد', description = '') {
  const notebooks = listNotebooks()
  const newNb = {
    id: uid('nb'),
    title: title.trim() || 'دفتر دراسي',
    description: description.trim(),
    color: '#7955C8',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sources: [],
    messages: [],
    artifacts: [],
  }
  notebooks.unshift(newNb)
  saveNotebooks(notebooks)
  setActiveNotebookId(newNb.id)
  return newNb
}

export function updateNotebook(id, updates) {
  const notebooks = listNotebooks()
  const idx = notebooks.findIndex((nb) => nb.id === id)
  if (idx === -1) return null
  notebooks[idx] = {
    ...notebooks[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveNotebooks(notebooks)
  return notebooks[idx]
}

export function deleteNotebook(id) {
  const notebooks = listNotebooks()
  const filtered = notebooks.filter((nb) => nb.id !== id)
  saveNotebooks(filtered)
  if (getActiveNotebookId() === id) {
    if (filtered.length > 0) {
      setActiveNotebookId(filtered[0].id)
    } else {
      createNotebook('دفتر دراسي جديد')
    }
  }
  return true
}

/* ==================== إدارة المصادر داخل الدفتر ==================== */
export async function addSourceToNotebook(notebookId, sourceMeta, chunks = [], blob = null) {
  const srcId = sourceMeta.id || uid('src')
  const recordMeta = {
    id: srcId,
    notebookId,
    title: sourceMeta.title || sourceMeta.name || 'مصدر غير معنون',
    type: sourceMeta.type || 'text',
    size: sourceMeta.size || 0,
    pageCount: sourceMeta.pageCount || 1,
    status: sourceMeta.status || 'ready', // 'ready' | 'processing' | 'failed'
    errorMessage: sourceMeta.errorMessage || null,
    createdAt: new Date().toISOString(),
  }

  // 1. حفظ في IndexedDB
  await idbPut('meta', recordMeta)
  if (chunks && chunks.length > 0) {
    await idbPut('texts', { id: srcId, chunks })
  }
  if (blob) {
    try {
      await idbPut('files', { id: srcId, blob })
    } catch {
      /* ignore if blob cannot be persisted */
    }
  }

  // 2. تحديث الدفتر في localStorage
  const notebooks = listNotebooks()
  const nb = notebooks.find((n) => n.id === notebookId)
  if (nb) {
    if (!Array.isArray(nb.sources)) nb.sources = []
    if (!nb.sources.includes(srcId)) {
      nb.sources.push(srcId)
      nb.updatedAt = new Date().toISOString()
      saveNotebooks(notebooks)
    }
  }

  return recordMeta
}

export async function removeSourceFromNotebook(notebookId, sourceId) {
  // إزالة من الدفتر
  const notebooks = listNotebooks()
  const nb = notebooks.find((n) => n.id === notebookId)
  if (nb && Array.isArray(nb.sources)) {
    nb.sources = nb.sources.filter((s) => s !== sourceId)
    nb.updatedAt = new Date().toISOString()
    saveNotebooks(notebooks)
  }

  // تحقق إن كان المصدر مرتبطاً بدفاتر أخرى قبل حذفه نهائياً من IndexedDB
  const isUsedElsewhere = notebooks.some((n) => n.id !== notebookId && Array.isArray(n.sources) && n.sources.includes(sourceId))
  if (!isUsedElsewhere) {
    try {
      await idbDel('meta', sourceId)
      await idbDel('texts', sourceId)
      await idbDel('files', sourceId)
    } catch {
      /* ignore */
    }
  }

  return true
}

export async function getNotebookSources(notebookId) {
  const notebooks = listNotebooks()
  const nb = notebooks.find((n) => n.id === notebookId)
  if (!nb || !Array.isArray(nb.sources) || !nb.sources.length) return []

  const sources = []
  for (const srcId of nb.sources) {
    const meta = await idbGet('meta', srcId)
    if (meta) {
      sources.push(meta)
    }
  }
  return sources
}

export async function getSourceChunks(sourceId) {
  const record = await idbGet('texts', sourceId)
  return record?.chunks || []
}

/* ==================== إدارة المخرجات والملاحظات (Artifacts) ==================== */
export function saveNotebookArtifact(notebookId, artifact) {
  const notebooks = listNotebooks()
  const nb = notebooks.find((n) => n.id === notebookId)
  if (!nb) return null
  if (!Array.isArray(nb.artifacts)) nb.artifacts = []

  const item = {
    id: artifact.id || uid('art'),
    type: artifact.type || 'note', // 'note' | 'summary' | 'quiz' | 'flashcards' | 'glossary' | 'concept_map'
    title: artifact.title || 'مخرج دراسي',
    content: artifact.content,
    citations: artifact.citations || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const existingIdx = nb.artifacts.findIndex((a) => a.id === item.id)
  if (existingIdx !== -1) {
    nb.artifacts[existingIdx] = { ...nb.artifacts[existingIdx], ...item, updatedAt: new Date().toISOString() }
  } else {
    nb.artifacts.unshift(item)
  }

  nb.updatedAt = new Date().toISOString()
  saveNotebooks(notebooks)
  return item
}

export function deleteNotebookArtifact(notebookId, artifactId) {
  const notebooks = listNotebooks()
  const nb = notebooks.find((n) => n.id === notebookId)
  if (!nb || !Array.isArray(nb.artifacts)) return false
  nb.artifacts = nb.artifacts.filter((a) => a.id !== artifactId)
  nb.updatedAt = new Date().toISOString()
  saveNotebooks(notebooks)
  return true
}

/* ==================== محادثات الدفتر ==================== */
export function saveNotebookMessages(notebookId, messages) {
  const notebooks = listNotebooks()
  const nb = notebooks.find((n) => n.id === notebookId)
  if (!nb) return false
  nb.messages = Array.isArray(messages) ? messages.slice(-50) : []
  nb.updatedAt = new Date().toISOString()
  saveNotebooks(notebooks)
  return true
}
