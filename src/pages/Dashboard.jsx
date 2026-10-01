import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

/* ============================== الثوابت ============================== */
const DAILY_LIMIT = 25
const STORAGE = {
  user: 'rafeaq_user',
  name: 'rafeaq_name',
  token: 'rafeaq_token',
  messages: 'rafeaq_student_messages',
  notes: 'rafeaq_student_notes',
  chances: 'rafeaq_student_chances',
  chanceDate: 'rafeaq_student_chance_date',
  nbMessages: 'rafeaq_notebook_messages',
  catalog: 'rafeaq_books_catalog',
}

/* ============================== LocalStorage ============================== */
function readLS(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/* ============================== IndexedDB (تخزين الكتب على جهاز المستخدم) ============================== */
// meta: بيانات الكتاب | files: ملف الكتاب (Blob) | texts: النص المستخرج لدفتر رفيق
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('rafeaq_db', 1)
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

async function idb(store, mode, fn) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = fn(tx.objectStore(store))
    tx.oncomplete = () => resolve(req?.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

const dbPut = (store, value) => idb(store, 'readwrite', (s) => s.put(value))
const dbGet = (store, id) => idb(store, 'readonly', (s) => s.get(id))
const dbAll = (store) => idb(store, 'readonly', (s) => s.getAll())
const dbDel = (store, id) => idb(store, 'readwrite', (s) => s.delete(id))

/* ============================== أدوات عامة ============================== */
function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDate(value = new Date()) {
  return new Intl.DateTimeFormat('ar-LY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value)
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatSize(bytes = 0) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function getInitials(name = 'ط') {
  return name.trim().charAt(0) || 'ط'
}

function uid() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function authHeaders() {
  const token = localStorage.getItem(STORAGE.token)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/* ============================== استخراج النص + البحث (دفتر رفيق) ============================== */
async function extractPdfText(blob, onProgress) {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker

  const pdf = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise
  const chunks = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim()

    for (let i = 0; i < text.length; i += 1100) {
      const piece = text.slice(i, i + 1200)
      if (piece.length > 40) chunks.push({ page: p, text: piece })
    }
    onProgress?.(Math.round((p / pdf.numPages) * 100))
  }

  return chunks
}

function normalizeAr(s = '') {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
}

function tokenize(s) {
  return normalizeAr(s)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => (w.startsWith('ال') && w.length > 4 ? w.slice(2) : w))
    .filter((w) => w.length > 2)
}

function topChunks(question, pool, k = 6) {
  const q = new Set(tokenize(question))
  if (!q.size) return spreadChunks(pool, k)

  return pool
    .map((chunk) => {
      const words = new Set(tokenize(chunk.text))
      let score = 0
      q.forEach((w) => words.has(w) && (score += 1))
      return { chunk, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.chunk)
}

function spreadChunks(pool, k = 8) {
  if (pool.length <= k) return pool
  const step = pool.length / k
  return Array.from({ length: k }, (_, i) => pool[Math.floor(i * step)])
}

/* ============================== مكونات صغيرة ============================== */
function SectionHero({ eyebrow, title, text, right }) {
  return (
    <div className="aurora-card relative overflow-hidden rounded-[26px] p-6 text-white sm:p-8">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold text-white/75">{eyebrow}</div>
          <h1 className="mt-2 text-[26px] font-bold sm:text-[30px]">{title}</h1>
          {text && <p className="mt-2 max-w-[600px] text-[12px] leading-6 text-white/80">{text}</p>}
        </div>
        {right}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="glass rounded-[22px] border-dashed p-12 text-center">
      <div className="float mx-auto grid h-16 w-16 place-items-center rounded-[20px] bg-[var(--soft)] text-[26px]">
        {icon}
      </div>
      <div className="mt-4 text-[14px] font-bold">{title}</div>
      <p className="mx-auto mt-2 max-w-[440px] text-[11px] leading-6 text-[var(--muted)]">{text}</p>
    </div>
  )
}

/* ============================== الصفحة ============================== */
export default function Dashboard() {
  const nav = useNavigate()

  const [tab, setTab] = useState('home')
  const [user, setUser] = useState('الطالب')
  const [studentClass, setStudentClass] = useState('')
  const [studentSection, setStudentSection] = useState('')
  const [toast, setToast] = useState('')

  const [messages, setMessages] = useState(() => readLS(STORAGE.messages, []))
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [chances, setChances] = useState(() => {
    const savedDate = localStorage.getItem(STORAGE.chanceDate)
    return savedDate === todayKey() ? readLS(STORAGE.chances, DAILY_LIMIT) : DAILY_LIMIT
  })

  const [notes, setNotes] = useState(() => readLS(STORAGE.notes, []))
  const [noteInput, setNoteInput] = useState('')
  const [search, setSearch] = useState('')

  /* الكتب */
  const [booksView, setBooksView] = useState('site') // site | mine
  const [catalog, setCatalog] = useState(() => readLS(STORAGE.catalog, { at: 0, books: [] }).books)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [visible, setVisible] = useState(24)
  const [library, setLibrary] = useState([])
  const [downloads, setDownloads] = useState({}) // id -> progress %
  const [indexing, setIndexing] = useState({}) // id -> progress %

  /* دفتر رفيق */
  const [nbSelected, setNbSelected] = useState([])
  const [nbMessages, setNbMessages] = useState(() => readLS(STORAGE.nbMessages, []))
  const [nbInput, setNbInput] = useState('')
  const [nbLoading, setNbLoading] = useState(false)
  const nbBottomRef = useRef(null)

  /* Notion */
  const [notion, setNotion] = useState({ connected: false, workspace: '', loading: true })

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const bottomRef = useRef(null)

  const [pomoMode, setPomoMode] = useState('study')
  const [pomoRunning, setPomoRunning] = useState(false)
  const [pomoTime, setPomoTime] = useState(25 * 60)

  function showToast(text) {
    setToast(text)
    window.setTimeout(() => setToast(''), 3200)
  }

  /* ---------- المصادقة وبيانات الطالب ---------- */
  useEffect(() => {
    const token = localStorage.getItem(STORAGE.token)

    if (!token) {
      nav('/login', { replace: true })
      return
    }

    const rawUser =
      localStorage.getItem(STORAGE.user) ||
      localStorage.getItem(STORAGE.name) ||
      'الطالب'

    try {
      const parsed = JSON.parse(rawUser)
      if (typeof parsed === 'string') {
        setUser(parsed.split('@')[0] || 'الطالب')
      } else if (parsed?.name) {
        setUser(parsed.name)
        setStudentClass(parsed.class || parsed.grade || '')
        setStudentSection(parsed.section || '')
      }
    } catch {
      setUser(rawUser.split('@')[0] || 'الطالب')
    }

    const storedClass =
      localStorage.getItem('rafeaq_student_class') ||
      localStorage.getItem('student_class') ||
      ''
    const storedSection =
      localStorage.getItem('rafeaq_student_section') ||
      localStorage.getItem('student_section') ||
      ''

    if (storedClass) setStudentClass(storedClass)
    if (storedSection) setStudentSection(storedSection)
  }, [nav])

  useEffect(() => {
    if (localStorage.getItem(STORAGE.chanceDate) !== todayKey()) {
      setChances(DAILY_LIMIT)
      localStorage.setItem(STORAGE.chanceDate, todayKey())
      writeLS(STORAGE.chances, DAILY_LIMIT)
    }
  }, [])

  useEffect(() => { writeLS(STORAGE.messages, messages) }, [messages])
  useEffect(() => { writeLS(STORAGE.notes, notes) }, [notes])
  useEffect(() => { writeLS(STORAGE.nbMessages, nbMessages) }, [nbMessages])

  useEffect(() => {
    writeLS(STORAGE.chances, chances)
    localStorage.setItem(STORAGE.chanceDate, todayKey())
  }, [chances])

  /* ---------- المؤقت ---------- */
  useEffect(() => {
    if (!pomoRunning) return undefined

    const timer = window.setInterval(() => {
      setPomoTime((current) => {
        if (current <= 1) {
          setPomoRunning(false)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [pomoRunning])

  /* ---------- الإدخال الصوتي ---------- */
  useEffect(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      return undefined
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognition.lang = 'ar-LY'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      setInput((current) => `${current}${current ? ' ' : ''}${transcript}`)
      setIsListening(false)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition

    return () => {
      recognition.abort?.()
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    if (tab === 'ai') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiLoading, tab])

  useEffect(() => {
    if (tab === 'notebook') nbBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [nbMessages, nbLoading, tab])

  /* ---------- مكتبة الجهاز ---------- */
  async function loadLibrary() {
    try {
      const items = await dbAll('meta')
      setLibrary(items.sort((a, b) => b.addedAt - a.addedAt))
    } catch {
      setLibrary([])
    }
  }

  useEffect(() => { loadLibrary() }, [])

  /* ---------- كتالوج الموقع ---------- */
  async function loadCatalog(force = false) {
    const cached = readLS(STORAGE.catalog, { at: 0, books: [] })
    const fresh = Date.now() - cached.at < 6 * 3600 * 1000

    if (!force && fresh && cached.books.length) {
      setCatalog(cached.books)
      return
    }

    setCatalogLoading(true)
    setCatalogError('')

    try {
      const res = await fetch('/api/books/catalog', { headers: authHeaders() })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)

      const books = data?.books || []
      setCatalog(books)
      writeLS(STORAGE.catalog, { at: Date.now(), books })
    } catch (error) {
      console.error('Catalog error:', error)
      setCatalogError('تعذر جلب قائمة الكتب من الموقع الآن. حاول مرة ثانية بعد قليل.')
    } finally {
      setCatalogLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'books' || tab === 'notebook') loadCatalog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const libraryIds = useMemo(() => new Set(library.map((b) => b.id)), [library])

  async function downloadBook(book) {
    if (downloads[book.id] !== undefined || libraryIds.has(book.id)) return
    setDownloads((c) => ({ ...c, [book.id]: 0 }))

    try {
      const res = await fetch(`/api/books/download?url=${encodeURIComponent(book.url)}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const total = Number(res.headers.get('content-length')) || 0
      const reader = res.body.getReader()
      const parts = []
      let received = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        parts.push(value)
        received += value.length
        if (total) setDownloads((c) => ({ ...c, [book.id]: Math.round((received / total) * 100) }))
      }

      const blob = new Blob(parts, { type: res.headers.get('content-type') || 'application/pdf' })
      await navigator.storage?.persist?.()

      await dbPut('files', { id: book.id, blob })
      await dbPut('meta', {
        id: book.id,
        title: book.title,
        subject: book.subject || '',
        grade: book.grade || '',
        size: blob.size,
        type: blob.type,
        addedAt: Date.now(),
        indexed: false,
      })

      await loadLibrary()
      showToast('تم حفظ الكتاب في مكتبتك على جهازك ✓')
    } catch (error) {
      console.error('Download error:', error)
      showToast(
        error?.name === 'QuotaExceededError'
          ? 'مساحة جهازك ممتلئة، احذف بعض الكتب وحاول مرة ثانية.'
          : 'فشل تنزيل الكتاب. حاول مرة ثانية.'
      )
    } finally {
      setDownloads((c) => {
        const next = { ...c }
        delete next[book.id]
        return next
      })
    }
  }

  async function openBook(book) {
    const file = await dbGet('files', book.id)
    if (!file?.blob) {
      showToast('ملف الكتاب غير موجود على الجهاز.')
      return
    }
    const url = URL.createObjectURL(file.blob)
    window.open(url, '_blank', 'noopener')
    window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  async function removeBook(book) {
    if (!window.confirm(`حذف "${book.title}" من جهازك؟`)) return
    await Promise.all([dbDel('files', book.id), dbDel('meta', book.id), dbDel('texts', book.id)])
    setNbSelected((c) => c.filter((id) => id !== book.id))
    await loadLibrary()
  }

  async function indexBook(book) {
    if (indexing[book.id] !== undefined) return
    setIndexing((c) => ({ ...c, [book.id]: 0 }))

    try {
      const file = await dbGet('files', book.id)
      if (!file?.blob) throw new Error('NO_FILE')

      const chunks = await extractPdfText(file.blob, (p) =>
        setIndexing((c) => ({ ...c, [book.id]: p }))
      )

      if (!chunks.length) {
        showToast('هذا الكتاب صور ممسوحة (Scan) ولا يحتوي نصاً، لا يمكن لدفتر رفيق قراءته.')
        return
      }

      await dbPut('texts', { id: book.id, chunks })
      await dbPut('meta', { ...book, indexed: true })
      await loadLibrary()
      setNbSelected((c) => (c.includes(book.id) ? c : [...c, book.id]))
      showToast('تم تجهيز الكتاب لدفتر رفيق ✓')
    } catch (error) {
      console.error('Index error:', error)
      showToast('تعذر قراءة نص الكتاب.')
    } finally {
      setIndexing((c) => {
        const next = { ...c }
        delete next[book.id]
        return next
      })
    }
  }

  /* ---------- استدعاء الذكاء الاصطناعي ---------- */
  async function callAI({ message, mode, context }) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        message,
        mode,
        role: 'student',
        context,
        student: { name: user, class: studentClass, section: studentSection },
      }),
    })

    let data = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`)

    const reply = data?.reply || data?.text
    if (!reply) throw new Error('EMPTY_AI_RESPONSE')
    return reply
  }

  function toggleVoice() {
    const recognition = recognitionRef.current

    if (!recognition) {
      window.alert('المتصفح لا يدعم الإدخال الصوتي. جرّب Chrome أو Edge.')
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      return
    }

    try {
      recognition.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
    }
  }

  async function sendMessage(customMessage = null, mode = 'general') {
    const question = (customMessage ?? input).trim()

    if (!question || aiLoading) return

    if (chances <= 0) {
      setMessages((current) => [
        ...current,
        {
          id: uid(),
          role: 'assistant',
          text: 'انتهت رسائلك المجانية لهذا اليوم. ستتجدد الـ25 رسالة تلقائياً غداً.',
        },
      ])
      return
    }

    setMessages((current) => [...current, { id: uid(), role: 'user', text: question }])
    setInput('')
    setAiLoading(true)
    setChances((current) => Math.max(0, current - 1))

    try {
      const reply = await callAI({ message: question, mode })
      setMessages((current) => [...current, { id: uid(), role: 'assistant', text: reply }])
    } catch (error) {
      console.error('Rafeeq AI error:', error)

      setMessages((current) => [
        ...current,
        {
          id: uid(),
          role: 'assistant',
          error: true,
          text:
            'تعذر الاتصال برفيق حالياً. تأكد أن الخادم يعمل ثم حاول مرة ثانية. لم أضع إجابة وهمية حتى لا أعطيك معلومة غير موثوقة.',
        },
      ])
    } finally {
      setAiLoading(false)
    }
  }

  function clearChat() {
    if (!window.confirm('هل تريد حذف محادثة رفيق من هذا الجهاز؟')) return
    setMessages([])
  }

  /* ---------- دفتر رفيق ---------- */
  const nbTasks = {
    summary: 'لخّص المصادر المحددة في نقاط واضحة ومرتبة.',
    guide: 'اصنع دليل مذاكرة من المصادر: أهم المفاهيم، التعريفات، والقوانين.',
    quiz: 'اكتب 5 أسئلة اختيار من متعدد من المصادر مع الإجابات الصحيحة وشرح قصير.',
    cards: 'اصنع 8 بطاقات مراجعة (سؤال ← جواب) من المصادر.',
  }

  async function askNotebook(customQuestion = null) {
    const question = (customQuestion ?? nbInput).trim()
    if (!question || nbLoading) return

    if (!nbSelected.length) {
      showToast('اختر مصدراً واحداً على الأقل من اليسار.')
      return
    }

    if (chances <= 0) {
      showToast('انتهت رسائلك اليوم، ستتجدد غداً.')
      return
    }

    setNbMessages((c) => [...c, { id: uid(), role: 'user', text: question }])
    setNbInput('')
    setNbLoading(true)
    setChances((c) => Math.max(0, c - 1))

    try {
      const pool = []

      for (const id of nbSelected) {
        if (id.startsWith('note:')) {
          const note = notes.find((n) => `note:${n.id}` === id)
          if (note) pool.push({ title: `ملاحظة: ${note.title}`, page: null, text: note.content })
          continue
        }
        const book = library.find((b) => b.id === id)
        const record = await dbGet('texts', id)
        record?.chunks?.forEach((ch) => pool.push({ title: book?.title || 'كتاب', page: ch.page, text: ch.text }))
      }

      if (!pool.length) throw new Error('NO_TEXT')

      const isTask = Object.values(nbTasks).includes(question)
      const picked = isTask ? spreadChunks(pool, 8) : topChunks(question, pool, 6)

      if (!picked.length) {
        setNbMessages((c) => [
          ...c,
          {
            id: uid(),
            role: 'assistant',
            text: 'لم أجد في المصادر المحددة ما يتعلق بسؤالك. جرّب صياغة مختلفة أو أضف مصدراً آخر.',
          },
        ])
        return
      }

      const context = picked.map((p, i) => ({ n: i + 1, title: p.title, page: p.page, text: p.text }))
      const reply = await callAI({ message: question, mode: 'notebook', context })

      setNbMessages((c) => [
        ...c,
        {
          id: uid(),
          role: 'assistant',
          text: reply,
          cites: context.map(({ n, title, page }) => ({ n, title, page })),
        },
      ])
    } catch (error) {
      console.error('Notebook error:', error)
      setNbMessages((c) => [
        ...c,
        {
          id: uid(),
          role: 'assistant',
          error: true,
          text: 'تعذر الحصول على إجابة من دفتر رفيق. تأكد أن الكتب مجهزة وأن الخادم يعمل.',
        },
      ])
    } finally {
      setNbLoading(false)
    }
  }

  function toggleSource(id) {
    setNbSelected((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  }

  function saveToNotes(text, title = 'من دفتر رفيق') {
    setNotes((c) => [
      { id: uid(), title: `${title}: ${text.slice(0, 30)}`, content: text, date: formatDate() },
      ...c,
    ])
    showToast('تم الحفظ في ملاحظاتي ✓')
  }

  /* ---------- Notion ---------- */
  async function loadNotionStatus() {
    try {
      const res = await fetch('/api/notion/status', { headers: authHeaders() })
      const data = await res.json()
      setNotion({ connected: !!data.connected, workspace: data.workspace || '', loading: false })
    } catch {
      setNotion({ connected: false, workspace: '', loading: false })
    }
  }

  useEffect(() => {
    loadNotionStatus()
    const params = new URLSearchParams(window.location.search)
    if (params.get('notion') === 'connected') {
      showToast('تم ربط Notion بنجاح ✓')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function connectNotion() {
    try {
      const res = await fetch('/api/notion/auth-url', { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data?.error || 'NO_URL')
      window.location.href = data.url
    } catch {
      showToast('تعذر بدء الربط مع Notion. تأكد من إعدادات الخادم.')
    }
  }

  async function disconnectNotion() {
    if (!window.confirm('فصل الربط مع Notion؟')) return
    await fetch('/api/notion/disconnect', { method: 'DELETE', headers: authHeaders() }).catch(() => null)
    setNotion({ connected: false, workspace: '', loading: false })
  }

  async function exportToNotion(title, content) {
    if (!notion.connected) {
      showToast('اربط حسابك مع Notion أولاً.')
      return
    }
    try {
      const res = await fetch('/api/notion/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title, content }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      showToast('تم التصدير إلى Notion ✓')
      if (data?.url) window.open(data.url, '_blank', 'noopener')
    } catch (error) {
      showToast(error.message?.length < 90 ? error.message : 'فشل التصدير إلى Notion.')
    }
  }

  /* ---------- الملاحظات والمؤقت ---------- */
  function addNote() {
    const content = noteInput.trim()
    if (!content) return

    setNotes((current) => [
      { id: uid(), title: content.slice(0, 45), content, date: formatDate() },
      ...current,
    ])
    setNoteInput('')
  }

  function deleteNote(id) {
    setNotes((current) => current.filter((note) => note.id !== id))
  }

  function resetTimer(mode = pomoMode) {
    setPomoRunning(false)
    setPomoTime(mode === 'study' ? 25 * 60 : mode === 'deep' ? 50 * 60 : 5 * 60)
  }

  function changeTimerMode(mode) {
    setPomoMode(mode)
    resetTimer(mode)
  }

  function goTo(nextTab) {
    setTab(nextTab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function logout() {
    localStorage.removeItem(STORAGE.token)
    sessionStorage.setItem('just_logged_out', '1')
    nav('/login', { replace: true })
  }

  /* ---------- قوائم مفلترة ---------- */
  const grades = useMemo(
    () => [...new Set(catalog.map((b) => b.grade).filter(Boolean))],
    [catalog]
  )

  const filteredCatalog = useMemo(() => {
    const query = normalizeAr(search.trim())
    return catalog.filter((b) => {
      if (gradeFilter && b.grade !== gradeFilter) return false
      if (!query) return true
      return normalizeAr([b.title, b.subject, b.grade].filter(Boolean).join(' ')).includes(query)
    })
  }, [catalog, search, gradeFilter])

  const filteredLibrary = useMemo(() => {
    const query = normalizeAr(search.trim())
    if (!query) return library
    return library.filter((b) =>
      normalizeAr([b.title, b.subject, b.grade].filter(Boolean).join(' ')).includes(query)
    )
  }, [library, search])

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return notes
    return notes.filter((note) =>
      [note.title, note.content].filter(Boolean).join(' ').toLowerCase().includes(query)
    )
  }, [notes, search])

  const navigation = [
    { id: 'home', label: 'الرئيسية', icon: '⌂' },
    { id: 'ai', label: 'رفيق AI', icon: '✦' },
    { id: 'notebook', label: 'دفتر رفيق', icon: '❖' },
    { id: 'books', label: 'كتب ودروس', icon: '▤' },
    { id: 'notes', label: 'ملاحظاتي', icon: '▢' },
    { id: 'timer', label: 'مؤقت الدراسة', icon: '◷' },
  ]

  const nbIndexedBooks = library.filter((b) => b.indexed)

  /* ============================== الواجهة ============================== */
  return (
    <div dir="rtl" className="relative min-h-screen overflow-x-hidden text-[var(--ink)]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

        :root {
          --bg: #F4F2FF;
          --ink: #1D1A45;
          --muted: #6F6C94;
          --brand: #6D5EF5;
          --brand2: #A15CF6;
          --cyan: #1FC8E3;
          --mint: #2DD4A0;
          --coral: #FF8A5B;
          --soft: #ECE9FF;
          --line: rgba(109, 94, 245, .14);
          --grad: linear-gradient(135deg, #6D5EF5 0%, #A15CF6 48%, #1FC8E3 100%);
        }

        * { font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); }
        button, input, textarea, select { font: inherit; }
        ::selection { background: var(--brand); color: white; }

        .thin-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .thin-scroll::-webkit-scrollbar-thumb { background: #CFC9FF; border-radius: 999px; }

        .bg-stage {
          position: fixed; inset: 0; z-index: -1; overflow: hidden;
          background:
            radial-gradient(900px 500px at 85% -10%, rgba(161,92,246,.22), transparent 60%),
            radial-gradient(800px 520px at -10% 20%, rgba(31,200,227,.20), transparent 60%),
            radial-gradient(700px 500px at 60% 110%, rgba(255,138,91,.16), transparent 60%),
            var(--bg);
        }
        .bg-stage::after {
          content: ''; position: absolute; inset: 0; opacity: .5;
          background-image: radial-gradient(rgba(109,94,245,.12) 1px, transparent 1px);
          background-size: 26px 26px;
          mask-image: linear-gradient(to bottom, #000, transparent 70%);
        }

        .glass {
          background: rgba(255,255,255,.72);
          backdrop-filter: blur(18px) saturate(160%);
          border: 1px solid var(--line);
          box-shadow: 0 10px 40px rgba(109,94,245,.08);
        }

        .aurora-card { background: var(--grad); background-size: 200% 200%; animation: flow 12s ease infinite; box-shadow: 0 24px 60px rgba(109,94,245,.32); }
        @keyframes flow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

        .blob { position: absolute; border-radius: 999px; filter: blur(46px); opacity: .55; pointer-events: none; }
        .blob-a { width: 260px; height: 260px; background: #fff; top: -90px; left: -60px; opacity: .22; animation: drift 9s ease-in-out infinite; }
        .blob-b { width: 300px; height: 300px; background: var(--coral); bottom: -150px; right: 25%; opacity: .35; animation: drift 11s ease-in-out infinite reverse; }
        @keyframes drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,22px) scale(1.12); } }

        .float { animation: float 4.5s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

        .gtext { background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }

        .btn-grad {
          position: relative; overflow: hidden; color: #fff; background: var(--grad); background-size: 160% 160%;
          box-shadow: 0 8px 22px rgba(109,94,245,.35); transition: transform .2s, box-shadow .2s;
        }
        .btn-grad:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(109,94,245,.45); }
        .btn-grad::after {
          content: ''; position: absolute; top: 0; left: -80%; width: 50%; height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.45), transparent);
          transform: skewX(-20deg); transition: left .6s;
        }
        .btn-grad:hover::after { left: 140%; }
        .btn-grad:disabled { opacity: .4; transform: none; box-shadow: none; cursor: not-allowed; }

        .btn-soft { background: var(--soft); color: var(--brand); transition: background .2s, transform .2s; }
        .btn-soft:hover { background: #E1DCFF; transform: translateY(-1px); }

        .card-hover { transition: transform .25s, box-shadow .25s, border-color .25s; }
        .card-hover:hover { transform: translateY(-4px); border-color: rgba(109,94,245,.4); box-shadow: 0 18px 44px rgba(109,94,245,.18); }

        .nav-active { background: var(--grad); color: #fff; box-shadow: 0 8px 20px rgba(109,94,245,.35); }

        .pulse-ring { animation: ring 1.8s ease-out infinite; }
        @keyframes ring { 0% { box-shadow: 0 0 0 0 rgba(45,212,160,.55); } 100% { box-shadow: 0 0 0 10px rgba(45,212,160,0); } }

        .shimmer { background: linear-gradient(90deg, #ECE9FF 25%, #F8F6FF 50%, #ECE9FF 75%); background-size: 200% 100%; animation: shim 1.4s infinite; }
        @keyframes shim { to { background-position: -200% 0; } }

        .timer-ring { background: conic-gradient(var(--brand) var(--deg), #E7E3FF 0); }
      `}</style>

      <div className="bg-stage" />

      {/* ============ الشريط الجانبي ============ */}
      <aside className="glass fixed right-0 top-0 z-40 hidden h-screen w-[256px] flex-col border-y-0 border-r-0 lg:flex">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="btn-grad grid h-11 w-11 place-items-center rounded-[14px]">
              <span className="text-[18px] font-bold">ر</span>
            </div>
            <div>
              <div className="gtext text-[17px] font-bold">رفيق</div>
              <div className="text-[10px] text-[var(--muted)]">مساعدك الدراسي</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-2 px-3 text-[10px] font-bold tracking-wider text-[#A8A4CC]">المنصة</div>

            <div className="space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  className={`flex h-11 w-full items-center gap-3 rounded-[13px] px-3 text-right text-[13px] transition ${
                    tab === item.id
                      ? 'nav-active font-semibold'
                      : 'text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--brand)]'
                  }`}
                >
                  <span className="w-5 text-center text-[15px]">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'ai' && (
                    <span
                      className={`mr-auto rounded-full px-2 py-0.5 text-[9px] ${
                        tab === 'ai' ? 'bg-white/25 text-white' : 'bg-[var(--soft)] text-[var(--brand)]'
                      }`}
                    >
                      {chances}
                    </span>
                  )}
                  {item.id === 'notebook' && (
                    <span className="mr-auto rounded-full bg-[var(--coral)] px-2 py-0.5 text-[8px] font-bold text-white">
                      جديد
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-[16px] border border-[var(--line)] bg-white/70 p-3">
            <div className="flex items-center gap-2.5">
              <div className="btn-grad grid h-9 w-9 place-items-center rounded-full text-[12px] font-bold">
                {getInitials(user)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold">{user}</div>
                <div className="truncate text-[10px] text-[var(--muted)]">
                  {studentClass || 'طالب'}{studentSection ? ` • ${studentSection}` : ''}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--muted)]">
              <span>رسائل رفيق</span>
              <span className="font-semibold text-[var(--ink)]">{chances}/{DAILY_LIMIT}</span>
            </div>

            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--soft)]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(chances / DAILY_LIMIT) * 100}%`, background: 'var(--grad)' }}
              />
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-soft mt-2.5 h-9 w-full rounded-[11px] text-[11px]"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="lg:mr-[256px]">
        {/* ============ الشريط العلوي ============ */}
        <header className="glass sticky top-0 z-30 border-x-0 border-t-0">
          <div className="flex h-[64px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                onClick={() => goTo('home')}
                className="btn-grad grid h-9 w-9 shrink-0 place-items-center rounded-[11px] lg:hidden"
              >
                ر
              </button>

              <div className="relative max-w-[470px] flex-1">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--muted)]">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث في كتبك وملاحظاتك..."
                  className="h-10 w-full rounded-[12px] border border-transparent bg-[var(--soft)] pr-9 pl-3 text-[11px] outline-none transition focus:border-[var(--brand)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(109,94,245,.12)]"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => (notion.connected ? disconnectNotion() : connectNotion())}
                className="btn-soft hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold sm:flex"
                title={notion.connected ? `متصل بـ ${notion.workspace}` : 'ربط Notion'}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${notion.connected ? 'pulse-ring bg-[var(--mint)]' : 'bg-[#C5C1E6]'}`} />
                {notion.connected ? 'Notion متصل' : 'ربط Notion'}
              </button>

              <div className="hidden text-left text-[10px] leading-4 text-[var(--muted)] md:block">{formatDate()}</div>

              <div className="btn-grad grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold">
                {getInitials(user)}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1240px] px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* ================= الرئيسية ================= */}
              {tab === 'home' && (
                <section className="space-y-5">
                  <div className="aurora-card relative overflow-hidden rounded-[28px] p-6 text-white sm:p-8 lg:p-10">
                    <div className="blob blob-a" />
                    <div className="blob blob-b" />

                    <div className="relative max-w-[720px]">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] backdrop-blur">
                        <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-[#63FFC0]" />
                        مساحة الطالب
                      </div>

                      <h1 className="mt-5 text-[26px] font-bold leading-[1.35] sm:text-[34px]">
                        أهلاً {user} 👋
                        <br />
                        خلّينا نكمّل دراستك اليوم.
                      </h1>

                      <p className="mt-3 max-w-[560px] text-[12px] leading-6 text-white/80 sm:text-[13px]">
                        حمّل كتبك على جهازك، وخلّي دفتر رفيق يقرأها معاك ويجاوب من داخلها، وصدّر
                        ملخصاتك إلى Notion بضغطة وحدة.
                      </p>

                      <div className="mt-6 flex flex-wrap gap-2">
                        <button
                          onClick={() => goTo('notebook')}
                          className="h-11 rounded-full bg-white px-5 text-[12px] font-bold text-[var(--brand)] shadow-lg transition hover:-translate-y-0.5"
                        >
                          افتح دفتر رفيق ❖
                        </button>
                        <button
                          onClick={() => goTo('books')}
                          className="h-11 rounded-full border border-white/30 bg-white/15 px-5 text-[12px] backdrop-blur transition hover:bg-white/25"
                        >
                          تصفح الكتب
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      { id: 'ai', title: 'رفيق AI', value: `${chances}/${DAILY_LIMIT}`, caption: 'رسائل متبقية اليوم', icon: '✦', tone: 'var(--brand)' },
                      { id: 'books', title: 'مكتبتي', value: library.length, caption: 'كتاب على جهازك', icon: '▤', tone: 'var(--cyan)' },
                      { id: 'notes', title: 'ملاحظاتي', value: notes.length, caption: 'ملاحظة محفوظة', icon: '▢', tone: 'var(--coral)' },
                      { id: 'timer', title: 'مؤقت الدراسة', value: formatTime(pomoTime), caption: pomoRunning ? 'جلسة تعمل الآن' : 'جاهز للدراسة', icon: '◷', tone: 'var(--mint)' },
                    ].map((card) => (
                      <button
                        key={card.id}
                        onClick={() => goTo(card.id)}
                        className="glass card-hover rounded-[20px] p-4 text-right"
                      >
                        <div
                          className="grid h-10 w-10 place-items-center rounded-[12px] text-[15px] text-white"
                          style={{ background: card.tone }}
                        >
                          {card.icon}
                        </div>
                        <div className="mt-4 text-[12px] font-semibold">{card.title}</div>
                        <div className="mt-1 text-[21px] font-bold tracking-tight">{card.value}</div>
                        <div className="mt-0.5 text-[9px] text-[var(--muted)]">{card.caption}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
                    <div className="glass rounded-[22px] p-5">
                      <h2 className="text-[14px] font-bold">ابدأ بسرعة</h2>
                      <p className="mt-1 text-[10px] text-[var(--muted)]">أدوات مصممة للدراسة فقط</p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {[
                          { icon: '✦', t: 'شرح درس', d: 'فهم الفكرة خطوة بخطوة', fn: () => { goTo('ai'); setInput('اشرح لي هذا الدرس بطريقة بسيطة') } },
                          { icon: '❖', t: 'اسأل كتبك', d: 'إجابات من داخل كتبك', fn: () => goTo('notebook') },
                          { icon: '◷', t: 'جلسة دراسة', d: '25 دقيقة تركيز', fn: () => goTo('timer') },
                        ].map((a) => (
                          <button
                            key={a.t}
                            onClick={a.fn}
                            className="card-hover rounded-[15px] border border-[var(--line)] bg-white/70 p-4 text-right"
                          >
                            <div className="gtext text-[20px] font-bold">{a.icon}</div>
                            <div className="mt-3 text-[11px] font-semibold">{a.t}</div>
                            <div className="mt-1 text-[9px] text-[var(--muted)]">{a.d}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="glass rounded-[22px] p-5">
                      <div className="text-[13px] font-bold">حالتك اليوم</div>

                      <div className="mt-4 rounded-[15px] bg-[var(--soft)] p-4">
                        <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
                          <span>رسائل رفيق</span>
                          <strong className="text-[var(--ink)]">{chances} / {DAILY_LIMIT}</strong>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(chances / DAILY_LIMIT) * 100}%`, background: 'var(--grad)' }}
                          />
                        </div>
                        <p className="mt-3 text-[9px] leading-5 text-[var(--muted)]">
                          يتجدد الحد اليومي تلقائياً مع بداية يوم جديد.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ================= رفيق AI ================= */}
              {tab === 'ai' && (
                <section className="mx-auto max-w-[920px]">
                  <div className="glass overflow-hidden rounded-[24px]">
                    <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-3">
                        <div className="btn-grad grid h-10 w-10 place-items-center rounded-full">✦</div>
                        <div>
                          <div className="text-[13px] font-bold">رفيق AI</div>
                          <div className="text-[9px] text-[var(--muted)]">مساعد دراسي • {chances} رسالة متبقية</div>
                        </div>
                      </div>

                      <button onClick={clearChat} className="btn-soft rounded-full px-3 py-1.5 text-[9px]">
                        مسح المحادثة
                      </button>
                    </div>

                    <div className="thin-scroll h-[58vh] min-h-[430px] overflow-y-auto bg-white/40 p-4 sm:p-6">
                      {messages.length === 0 ? (
                        <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                          <div className="btn-grad float grid h-16 w-16 place-items-center rounded-[22px] text-[23px]">✦</div>
                          <h2 className="mt-5 text-[19px] font-bold">شن تبي نراجع معاك؟</h2>
                          <p className="mt-2 max-w-[450px] text-[11px] leading-6 text-[var(--muted)]">
                            اسأل عن درس أو اطلب شرحاً أو أسئلة مراجعة. رفيق لا يستبدل كتبك ومصادر المدرسة.
                          </p>

                          <div className="mt-6 grid w-full max-w-[600px] gap-2 sm:grid-cols-2">
                            {[
                              'اشرح لي درساً بطريقة بسيطة',
                              'اختبرني في الدرس الحالي',
                              'لخص أهم النقاط للمراجعة',
                              'أنشئ لي أسئلة اختيار من متعدد',
                            ].map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => sendMessage(suggestion, 'study')}
                                className="card-hover rounded-[14px] border border-[var(--line)] bg-white p-3 text-right text-[10px]"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                              <div
                                className={`max-w-[88%] whitespace-pre-wrap rounded-[18px] px-4 py-3 text-[12px] leading-7 sm:max-w-[76%] ${
                                  message.role === 'user'
                                    ? 'btn-grad rounded-tl-[5px] !shadow-none'
                                    : message.error
                                      ? 'rounded-tr-[5px] border border-[#F6CFCF] bg-[#FFF5F5] text-[#9B3A3A]'
                                      : 'rounded-tr-[5px] border border-[var(--line)] bg-white shadow-[0_4px_14px_rgba(109,94,245,.07)]'
                                }`}
                              >
                                {message.text}
                                {message.role === 'assistant' && !message.error && (
                                  <div className="mt-2 flex gap-2 border-t border-[var(--line)] pt-2">
                                    <button onClick={() => saveToNotes(message.text, 'رفيق')} className="btn-soft rounded-full px-2.5 py-1 text-[9px]">
                                      حفظ في ملاحظاتي
                                    </button>
                                    <button onClick={() => exportToNotion('رد من رفيق', message.text)} className="btn-soft rounded-full px-2.5 py-1 text-[9px]">
                                      إلى Notion
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {aiLoading && (
                            <div className="flex justify-end">
                              <div className="flex items-center gap-2 rounded-[16px] border border-[var(--line)] bg-white px-4 py-3 text-[10px] text-[var(--muted)]">
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--soft)] border-t-[var(--brand)]" />
                                رفيق يجهز الإجابة...
                              </div>
                            </div>
                          )}

                          <div ref={bottomRef} />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[var(--line)] bg-white/70 p-3 sm:p-4">
                      <div className="flex items-end gap-2 rounded-[18px] border border-[var(--line)] bg-white p-2 transition focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_4px_rgba(109,94,245,.12)]">
                        <button
                          onClick={toggleVoice}
                          title="إدخال صوتي"
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                            isListening ? 'animate-pulse bg-[#F04438] text-white' : 'btn-soft'
                          }`}
                        >
                          🎙
                        </button>

                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          rows={1}
                          placeholder={isListening ? 'تكلم الآن...' : 'اكتب سؤالك الدراسي هنا...'}
                          className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-[12px] leading-5 outline-none"
                        />

                        <button
                          onClick={() => sendMessage()}
                          disabled={!input.trim() || aiLoading || chances <= 0}
                          className="btn-grad grid h-9 w-9 shrink-0 place-items-center rounded-full"
                        >
                          ↑
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[8px] text-[var(--muted)]">
                        <span>Enter للإرسال • Shift + Enter لسطر جديد • {DAILY_LIMIT} رسالة يومياً</span>
                        <span>{chances}/{DAILY_LIMIT}</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ================= دفتر رفيق ================= */}
              {tab === 'notebook' && (
                <section className="space-y-4">
                  <SectionHero
                    eyebrow="❖ شبيه NotebookLM"
                    title="دفتر رفيق"
                    text="اختر كتبك وملاحظاتك كمصادر، واسأل. الإجابات تُبنى من داخل مصادرك فقط مع ذكر رقم الصفحة."
                    right={
                      <div className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] backdrop-blur">
                        {nbSelected.length} مصدر محدد
                      </div>
                    }
                  />

                  <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
                    {/* المصادر */}
                    <div className="glass rounded-[22px] p-4 lg:sticky lg:top-[80px] lg:self-start">
                      <div className="text-[12px] font-bold">المصادر</div>

                      <div className="thin-scroll mt-3 max-h-[52vh] space-y-2 overflow-y-auto pl-1">
                        {library.length === 0 && notes.length === 0 && (
                          <p className="rounded-[12px] bg-[var(--soft)] p-3 text-[10px] leading-5 text-[var(--muted)]">
                            لا توجد مصادر بعد. نزّل كتاباً من قسم "كتب ودروس" أو أضف ملاحظة.
                          </p>
                        )}

                        {library.map((book) => {
                          const prog = indexing[book.id]
                          const on = nbSelected.includes(book.id)
                          return (
                            <div
                              key={book.id}
                              className={`rounded-[14px] border p-3 transition ${
                                on ? 'border-[var(--brand)] bg-[var(--soft)]' : 'border-[var(--line)] bg-white/70'
                              }`}
                            >
                              <div className="line-clamp-2 text-[11px] font-semibold">{book.title}</div>

                              {book.indexed ? (
                                <button
                                  onClick={() => toggleSource(book.id)}
                                  className={`mt-2 h-7 w-full rounded-full text-[9px] font-semibold ${on ? 'btn-grad' : 'btn-soft'}`}
                                >
                                  {on ? 'محدد ✓' : 'تحديد كمصدر'}
                                </button>
                              ) : prog !== undefined ? (
                                <div className="mt-2">
                                  <div className="h-1.5 overflow-hidden rounded-full bg-white">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, background: 'var(--grad)' }} />
                                  </div>
                                  <div className="mt-1 text-[8px] text-[var(--muted)]">جاري قراءة الكتاب... {prog}%</div>
                                </div>
                              ) : (
                                <button onClick={() => indexBook(book)} className="btn-soft mt-2 h-7 w-full rounded-full text-[9px] font-semibold">
                                  تجهيز للدفتر
                                </button>
                              )}
                            </div>
                          )
                        })}

                        {notes.slice(0, 20).map((note) => {
                          const id = `note:${note.id}`
                          const on = nbSelected.includes(id)
                          return (
                            <button
                              key={id}
                              onClick={() => toggleSource(id)}
                              className={`w-full rounded-[14px] border p-3 text-right transition ${
                                on ? 'border-[var(--coral)] bg-[#FFF1EA]' : 'border-[var(--line)] bg-white/70'
                              }`}
                            >
                              <div className="text-[8px] text-[var(--coral)]">ملاحظة</div>
                              <div className="line-clamp-1 text-[11px] font-semibold">{note.title}</div>
                            </button>
                          )
                        })}
                      </div>

                      {nbIndexedBooks.length === 0 && library.length > 0 && (
                        <p className="mt-3 text-[9px] leading-5 text-[var(--muted)]">
                          اضغط "تجهيز للدفتر" ليقرأ رفيق نص الكتاب مرة وحدة ويحفظه على جهازك.
                        </p>
                      )}
                    </div>

                    {/* المحادثة */}
                    <div className="glass overflow-hidden rounded-[22px]">
                      <div className="flex flex-wrap gap-2 border-b border-[var(--line)] p-3">
                        {[
                          ['ملخص', nbTasks.summary],
                          ['دليل مذاكرة', nbTasks.guide],
                          ['اختبار قصير', nbTasks.quiz],
                          ['بطاقات مراجعة', nbTasks.cards],
                        ].map(([label, prompt]) => (
                          <button
                            key={label}
                            onClick={() => askNotebook(prompt)}
                            disabled={nbLoading}
                            className="btn-soft rounded-full px-3.5 py-1.5 text-[10px] font-semibold disabled:opacity-40"
                          >
                            {label}
                          </button>
                        ))}
                        {nbMessages.length > 0 && (
                          <button
                            onClick={() => window.confirm('مسح محادثة الدفتر؟') && setNbMessages([])}
                            className="mr-auto rounded-full px-3 py-1.5 text-[10px] text-[var(--muted)] hover:text-[var(--ink)]"
                          >
                            مسح
                          </button>
                        )}
                      </div>

                      <div className="thin-scroll h-[50vh] min-h-[380px] overflow-y-auto bg-white/40 p-4">
                        {nbMessages.length === 0 ? (
                          <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
                            <div className="btn-grad float grid h-16 w-16 place-items-center rounded-[22px] text-[24px]">❖</div>
                            <h2 className="mt-5 text-[18px] font-bold">اسأل مصادرك</h2>
                            <p className="mt-2 max-w-[400px] text-[11px] leading-6 text-[var(--muted)]">
                              حدّد مصدراً من اليمين ثم اكتب سؤالك، أو اضغط على ملخص / اختبار قصير.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {nbMessages.map((m) => (
                              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                <div
                                  className={`max-w-[92%] whitespace-pre-wrap rounded-[18px] px-4 py-3 text-[12px] leading-7 sm:max-w-[80%] ${
                                    m.role === 'user'
                                      ? 'btn-grad rounded-tl-[5px] !shadow-none'
                                      : m.error
                                        ? 'rounded-tr-[5px] border border-[#F6CFCF] bg-[#FFF5F5] text-[#9B3A3A]'
                                        : 'rounded-tr-[5px] border border-[var(--line)] bg-white shadow-[0_4px_14px_rgba(109,94,245,.07)]'
                                  }`}
                                >
                                  {m.text}

                                  {m.cites?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--line)] pt-2">
                                      {m.cites.map((c) => (
                                        <span key={c.n} className="rounded-full bg-[var(--soft)] px-2 py-0.5 text-[8px] text-[var(--brand)]">
                                          [{c.n}] {c.title.slice(0, 22)}{c.page ? ` • ص${c.page}` : ''}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {m.role === 'assistant' && !m.error && (
                                    <div className="mt-2 flex gap-2">
                                      <button onClick={() => saveToNotes(m.text)} className="btn-soft rounded-full px-2.5 py-1 text-[9px]">
                                        حفظ في ملاحظاتي
                                      </button>
                                      <button onClick={() => exportToNotion('دفتر رفيق', m.text)} className="btn-soft rounded-full px-2.5 py-1 text-[9px]">
                                        إلى Notion
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {nbLoading && (
                              <div className="flex justify-end">
                                <div className="shimmer h-10 w-48 rounded-[16px]" />
                              </div>
                            )}
                            <div ref={nbBottomRef} />
                          </div>
                        )}
                      </div>

                      <div className="border-t border-[var(--line)] bg-white/70 p-3">
                        <div className="flex items-end gap-2 rounded-[18px] border border-[var(--line)] bg-white p-2 transition focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_4px_rgba(109,94,245,.12)]">
                          <textarea
                            value={nbInput}
                            onChange={(e) => setNbInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                askNotebook()
                              }
                            }}
                            rows={1}
                            placeholder="اسأل عن شي في مصادرك المحددة..."
                            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-[12px] leading-5 outline-none"
                          />
                          <button
                            onClick={() => askNotebook()}
                            disabled={!nbInput.trim() || nbLoading || chances <= 0}
                            className="btn-grad grid h-9 w-9 shrink-0 place-items-center rounded-full"
                          >
                            ↑
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ================= الكتب ================= */}
              {tab === 'books' && (
                <section className="space-y-4">
                  <SectionHero
                    eyebrow="المحتوى الدراسي"
                    title="كتب ودروس"
                    text="الكتب من موقع الأمجاد. عند التنزيل يُحفظ الكتاب على جهازك أنت (وليس على خوادمنا) وتجده في مكتبتك."
                    right={
                      <div className="flex gap-1 rounded-full border border-white/30 bg-white/15 p-1 backdrop-blur">
                        {[['site', 'كتب الموقع'], ['mine', `مكتبتي (${library.length})`]].map(([id, label]) => (
                          <button
                            key={id}
                            onClick={() => { setBooksView(id); setVisible(24) }}
                            className={`rounded-full px-4 py-1.5 text-[10px] font-semibold transition ${
                              booksView === id ? 'bg-white text-[var(--brand)]' : 'text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    }
                  />

                  {booksView === 'site' && (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        {grades.length > 0 && (
                          <select
                            value={gradeFilter}
                            onChange={(e) => setGradeFilter(e.target.value)}
                            className="glass h-10 rounded-full px-4 text-[11px] outline-none"
                          >
                            <option value="">كل الصفوف</option>
                            {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                          </select>
                        )}
                        <button onClick={() => loadCatalog(true)} className="btn-soft h-10 rounded-full px-4 text-[11px] font-semibold">
                          ↻ تحديث القائمة
                        </button>
                        <span className="text-[10px] text-[var(--muted)]">{filteredCatalog.length} كتاب</span>
                      </div>

                      {catalogLoading && catalog.length === 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-[120px] rounded-[20px]" />)}
                        </div>
                      ) : catalogError && catalog.length === 0 ? (
                        <EmptyState icon="⚠" title="تعذر جلب الكتب" text={catalogError} />
                      ) : filteredCatalog.length === 0 ? (
                        <EmptyState icon="▤" title="لا توجد نتائج" text="جرّب كلمة بحث أخرى أو غيّر الصف." />
                      ) : (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredCatalog.slice(0, visible).map((book) => {
                              const progress = downloads[book.id]
                              const owned = libraryIds.has(book.id)
                              return (
                                <div key={book.id} className="glass card-hover rounded-[20px] p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="btn-grad grid h-12 w-12 shrink-0 place-items-center rounded-[14px] text-[19px]">📖</div>
                                    <div className="min-w-0 flex-1">
                                      <div className="line-clamp-2 text-[12px] font-bold">{book.title}</div>
                                      <div className="mt-1 text-[9px] text-[var(--muted)]">
                                        {book.subject || 'مادة دراسية'}{book.grade ? ` • ${book.grade}` : ''}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-4">
                                    {owned ? (
                                      <div className="h-9 rounded-full bg-[#E4FBF3] text-center text-[10px] font-semibold leading-9 text-[#0E8F66]">
                                        ✓ في مكتبتك
                                      </div>
                                    ) : progress !== undefined ? (
                                      <div>
                                        <div className="h-2 overflow-hidden rounded-full bg-[var(--soft)]">
                                          <div className="h-full rounded-full transition-all" style={{ width: `${progress || 8}%`, background: 'var(--grad)' }} />
                                        </div>
                                        <div className="mt-1 text-center text-[9px] text-[var(--muted)]">جاري التنزيل... {progress}%</div>
                                      </div>
                                    ) : (
                                      <button onClick={() => downloadBook(book)} className="btn-grad h-9 w-full rounded-full text-[10px] font-semibold">
                                        ⬇ تنزيل إلى مكتبتي
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {visible < filteredCatalog.length && (
                            <div className="text-center">
                              <button onClick={() => setVisible((v) => v + 24)} className="btn-soft h-10 rounded-full px-6 text-[11px] font-semibold">
                                عرض المزيد
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {booksView === 'mine' &&
                    (filteredLibrary.length === 0 ? (
                      <EmptyState
                        icon="▤"
                        title="مكتبتك فارغة"
                        text="نزّل كتباً من تبويب كتب الموقع وستظهر هنا. الكتب محفوظة على جهازك ولا تحتاج إنترنت لفتحها."
                      />
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredLibrary.map((book) => (
                          <div key={book.id} className="glass card-hover rounded-[20px] p-4">
                            <div className="flex items-start gap-3">
                              <div className="btn-grad grid h-12 w-12 shrink-0 place-items-center rounded-[14px] text-[19px]">📖</div>
                              <div className="min-w-0 flex-1">
                                <div className="line-clamp-2 text-[12px] font-bold">{book.title}</div>
                                <div className="mt-1 text-[9px] text-[var(--muted)]">
                                  {formatSize(book.size)}{book.subject ? ` • ${book.subject}` : ''}
                                  {book.indexed ? ' • جاهز للدفتر ❖' : ''}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                              <button onClick={() => openBook(book)} className="btn-grad h-9 flex-1 rounded-full text-[10px] font-semibold">
                                فتح الكتاب
                              </button>
                              <button
                                onClick={() => { goTo('notebook'); if (!book.indexed) indexBook(book); else setNbSelected((c) => (c.includes(book.id) ? c : [...c, book.id])) }}
                                className="btn-soft h-9 rounded-full px-3 text-[10px] font-semibold"
                              >
                                في الدفتر
                              </button>
                              <button onClick={() => removeBook(book)} className="h-9 rounded-full border border-[#F6CFCF] bg-[#FFF5F5] px-3 text-[10px] text-[#B34A4A]">
                                حذف
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                </section>
              )}

              {/* ================= الملاحظات ================= */}
              {tab === 'notes' && (
                <section className="mx-auto max-w-[1000px] space-y-4">
                  <div className="glass rounded-[24px] p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h1 className="text-[19px] font-bold">ملاحظاتي</h1>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">محفوظة محلياً في هذا المتصفح، ويمكنك تصديرها إلى Notion.</p>
                      </div>
                      {!notion.connected && (
                        <button onClick={connectNotion} className="btn-soft rounded-full px-4 py-2 text-[10px] font-semibold">
                          ربط Notion
                        </button>
                      )}
                    </div>

                    <div className="mt-5 rounded-[16px] border border-[var(--line)] bg-white/80 p-2 transition focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_4px_rgba(109,94,245,.12)]">
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        rows={4}
                        placeholder="اكتب ملاحظة، قانون، فكرة أو نقطة تريد الاحتفاظ بها..."
                        className="w-full resize-none bg-transparent p-2 text-[12px] leading-6 outline-none"
                      />
                      <div className="flex justify-end">
                        <button onClick={addNote} disabled={!noteInput.trim()} className="btn-grad h-9 rounded-full px-5 text-[10px] font-semibold">
                          حفظ الملاحظة
                        </button>
                      </div>
                    </div>
                  </div>

                  {filteredNotes.length === 0 ? (
                    <EmptyState icon="▢" title="لا توجد ملاحظات" text="اكتب أول ملاحظة من الأعلى." />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {filteredNotes.map((note) => (
                        <article key={note.id} className="glass card-hover rounded-[20px] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h2 className="line-clamp-1 text-[12px] font-bold">{note.title}</h2>
                            <span className="shrink-0 text-[8px] text-[var(--muted)]">{note.date}</span>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-[10px] leading-6 text-[var(--muted)]">{note.content}</p>
                          <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => exportToNotion(note.title, note.content)} className="btn-soft rounded-full px-3 py-1.5 text-[9px]">
                              إلى Notion
                            </button>
                            <button onClick={() => deleteNote(note.id)} className="rounded-full border border-[#F6CFCF] bg-[#FFF5F5] px-3 py-1.5 text-[9px] text-[#B34A4A]">
                              حذف
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ================= المؤقت ================= */}
              {tab === 'timer' && (
                <section className="mx-auto max-w-[620px] space-y-4">
                  <div className="glass rounded-[28px] p-6 text-center sm:p-9">
                    <div className="btn-soft inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-semibold">
                      <span className={`h-1.5 w-1.5 rounded-full ${pomoRunning ? 'pulse-ring bg-[var(--mint)]' : 'bg-[var(--brand)]'}`} />
                      {pomoMode === 'break' ? 'وقت الراحة' : pomoMode === 'deep' ? 'جلسة تركيز عميق' : 'جلسة دراسة'}
                    </div>

                    {(() => {
                      const total = pomoMode === 'study' ? 1500 : pomoMode === 'deep' ? 3000 : 300
                      const deg = Math.round(((total - pomoTime) / total) * 360)
                      return (
                        <div className="timer-ring mx-auto mt-8 grid h-[240px] w-[240px] place-items-center rounded-full" style={{ '--deg': `${deg}deg` }}>
                          <div className="grid h-[212px] w-[212px] place-items-center rounded-full bg-white">
                            <div className="gtext text-[58px] font-bold tabular-nums">{formatTime(pomoTime)}</div>
                          </div>
                        </div>
                      )
                    })()}

                    <p className="mt-5 text-[10px] text-[var(--muted)]">
                      {pomoMode === 'break' ? 'خذ راحة قصيرة ثم ارجع للدراسة' : 'ركز على مادة واحدة وتجنب المشتتات'}
                    </p>

                    <div className="mt-6 flex justify-center gap-3">
                      <button onClick={() => setPomoRunning((c) => !c)} className="btn-grad grid h-14 w-14 place-items-center rounded-full text-[18px]">
                        {pomoRunning ? 'Ⅱ' : '▶'}
                      </button>
                      <button onClick={() => resetTimer()} className="btn-soft grid h-14 w-14 place-items-center rounded-full text-[18px]">↺</button>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-2">
                      {[['study', '25 دقيقة'], ['break', '5 دقائق'], ['deep', '50 دقيقة']].map(([mode, label]) => (
                        <button
                          key={mode}
                          onClick={() => changeTimerMode(mode)}
                          className={`h-10 rounded-full text-[10px] font-semibold transition ${pomoMode === mode ? 'btn-grad' : 'btn-soft'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass rounded-[22px] p-5">
                    <div className="text-[12px] font-bold">طريقة بسيطة للاستفادة</div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {['اختر درساً واحداً.', 'ابدأ جلسة تركيز.', 'راجع ما تعلمته مع رفيق.'].map((t, i) => (
                        <div key={t} className="rounded-[14px] bg-[var(--soft)] p-3">
                          <div className="gtext text-[11px] font-bold">0{i + 1}</div>
                          <div className="mt-1 text-[9px] leading-5 text-[var(--muted)]">{t}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ============ التنقل السفلي (جوال) ============ */}
      <nav className="glass fixed bottom-0 left-0 right-0 z-50 border-x-0 border-b-0 px-2 py-2 lg:hidden">
        <div className="mx-auto flex max-w-[640px] gap-1 overflow-x-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              className={`min-w-[66px] flex-1 rounded-[12px] px-2 py-2 text-center transition ${
                tab === item.id ? 'nav-active' : 'text-[var(--muted)]'
              }`}
            >
              <div className="text-[14px]">{item.icon}</div>
              <div className="mt-0.5 text-[8px] font-semibold">{item.label}</div>
            </button>
          ))}
        </div>
      </nav>

      {/* ============ Toast ============ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="btn-grad fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-3 text-[11px] font-semibold lg:bottom-8"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
