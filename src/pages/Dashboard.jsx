import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import QuizCard from '../components/QuizCard'
import FlashcardDeck from '../components/FlashcardDeck'
import SmartBoard from '../components/SmartBoard'

/* ============================== الثوابت ============================== */
const DAILY_LIMIT = 25
const SOURCE_PAGE = 'https://www.al-amgaad.com/2021/08/allbooks.html'
const MAX_IMAGES = 3
const ACCEPT_FILES = '.pdf,.docx,.txt,.md,.csv,.json,.srt,.vtt,.html,.htm'
const STORAGE = {
  user: 'rafeaq_user',
  name: 'rafeaq_name',
  token: 'rafeaq_token',
  messages: 'rafeaq_student_messages',
  notes: 'rafeaq_student_notes',
  chances: 'rafeaq_student_chances',
  chanceDate: 'rafeaq_student_chance_date',
  nbMessages: 'rafeaq_notebook_messages',
  nbSelected: 'rafeaq_notebook_selected',
  catalog: 'rafeaq_books_catalog',
  profile: 'rafeaq_profile',
  study: 'rafeaq_study_log',
}

/* ============ ثيم النافذة (فاتح) عند تشغيل Dashboard داخل Rafeeq OS ============
   كل القواعد محصورة تحت .dash-embed حتى لا تتسرب إلى الواجهة الخارجية. */
const EMBED_CSS = `
  .dash-embed {
    --bg: #F7F6FF; --ink: #24214F; --muted: #6E6A99; --brand: #6D5EF5; --brand2: #A36BFF;
    --cyan: #2DB7DD; --mint: #22C7A0; --coral: #FF9F7A; --soft: #F1EFFF; --line: #E2DEF8;
    --grad: linear-gradient(125deg, #6D5EF5 0%, #9B6BFF 55%, #4FB4F0 100%);
    background: var(--bg); color: var(--ink); color-scheme: light;
  }
  .dash-embed, .dash-embed * { font-family: 'IBM Plex Sans Arabic', 'Tajawal', system-ui, sans-serif; }
  .dash-embed :focus-visible { outline: 2px solid rgba(109, 94, 245, .8); outline-offset: 2px; }
  .dash-embed ::selection { background: #6D5EF5; color: #fff; }
  .dash-embed .thin-scroll { scrollbar-width: thin; scrollbar-color: #CFC9F5 transparent; }
  .dash-embed .thin-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .dash-embed .thin-scroll::-webkit-scrollbar-thumb { background: #CFC9F5; border-radius: 999px; }
  .dash-embed .glass { background: rgba(255,255,255,.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid var(--line); box-shadow: 0 6px 22px rgba(109,94,245,.08); }
  .dash-embed .dash-embed-head { box-shadow: 0 2px 10px rgba(109,94,245,.06); }
  .dash-embed .aurora-card { background: linear-gradient(118deg, #7B6CFF 0%, #9E7BFF 50%, #5CB6F2 100%); background-size: 200% 200%; animation: dflow 15s ease infinite; border: 1px solid rgba(255,255,255,.5); box-shadow: 0 14px 36px rgba(109,94,245,.25); color: #fff; }
  @keyframes dflow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  .dash-embed .blob { position: absolute; border-radius: 999px; filter: blur(48px); opacity: .35; pointer-events: none; }
  .dash-embed .blob-a { width: 220px; height: 220px; background: #fff; top: -80px; left: -50px; opacity: .25; animation: ddrift 9s ease-in-out infinite; }
  .dash-embed .blob-b { width: 240px; height: 240px; background: #4FB4F0; bottom: -130px; right: 25%; opacity: .3; animation: ddrift 11s ease-in-out infinite reverse; }
  @keyframes ddrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(26px,18px) scale(1.1); } }
  .dash-embed .float { animation: dfloat 4.5s ease-in-out infinite; }
  @keyframes dfloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  .dash-embed .gtext { background: linear-gradient(110deg, #5B4BE0, #8B5CF6 55%, #2AA8D8); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .dash-embed .btn-grad { position: relative; overflow: hidden; color: #fff; background: var(--grad); background-size: 160% 160%; border: 1px solid rgba(255,255,255,.35); box-shadow: 0 6px 18px rgba(109,94,245,.28); transition: transform .2s, box-shadow .2s, filter .2s; }
  .dash-embed .btn-grad:hover { transform: translateY(-1px); filter: brightness(1.06); box-shadow: 0 10px 24px rgba(109,94,245,.34); }
  .dash-embed .btn-grad:disabled { opacity: .45; transform: none; box-shadow: none; cursor: not-allowed; }
  .dash-embed .btn-soft { background: #EFEBFF; color: #4B3FC4; border: 1px solid #DDD7FA; transition: background .2s, transform .2s; }
  .dash-embed .btn-soft:hover { background: #E4DEFF; transform: translateY(-1px); }
  .dash-embed .card-hover { transition: transform .25s, box-shadow .25s, border-color .25s; }
  .dash-embed .card-hover:hover { transform: translateY(-2px); border-color: #B9AEFF; box-shadow: 0 12px 28px rgba(109,94,245,.16); }
  .dash-embed .nav-active { background: #EDE9FF; color: #4B3FC4; border: 1px solid #CFC7FF; }
  .dash-embed .pulse-ring { animation: dring 1.8s ease-out infinite; }
  @keyframes dring { 0% { box-shadow: 0 0 0 0 rgba(34,199,160,.45); } 100% { box-shadow: 0 0 0 9px rgba(34,199,160,0); } }
  .dash-embed .shimmer { background: linear-gradient(90deg, #EFEBFF 25%, #F8F6FF 50%, #EFEBFF 75%); background-size: 200% 100%; animation: dshim 1.4s infinite; }
  @keyframes dshim { to { background-position: -200% 0; } }
  .dash-embed .timer-ring { background: conic-gradient(var(--brand) var(--deg), #E6E1FB 0); }
  .dash-embed .typing-dot { width: 6px; height: 6px; border-radius: 999px; background: #8B7BFF; animation: dbounce 1.1s infinite ease-in-out; }
  .dash-embed .typing-dot:nth-child(2) { animation-delay: .15s; }
  .dash-embed .typing-dot:nth-child(3) { animation-delay: .3s; }
  @keyframes dbounce { 0%,80%,100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-5px); opacity: 1; } }
  .dash-embed input::placeholder, .dash-embed textarea::placeholder { color: #A29ECB; opacity: 1; }
  @media (prefers-reduced-motion: reduce) { .dash-embed *, .dash-embed *::before, .dash-embed *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
`

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
let dbPromise = null

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('rafeaq_db', 1)
      req.onupgradeneeded = () => {
        const db = req.result
        ;['meta', 'files', 'texts'].forEach((name) => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' })
        })
      }
      req.onsuccess = () => {
        const db = req.result
        db.onversionchange = () => {
          db.close()
          dbPromise = null
        }
        resolve(db)
      }
      req.onerror = () => {
        dbPromise = null
        reject(req.error)
      }
    })
  }
  return dbPromise
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
function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayKey() {
  return dateKey(new Date())
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

function hashStr(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h.toString(16)
}

function authHeaders() {
  const token = localStorage.getItem(STORAGE.token)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)
  } catch {
    /* ignore */
  }
}

// يصغّر الصورة ويضغطها قبل الإرسال (أسرع وأخف على الخادم)
function imageToDataUrl(file, maxSide = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('BAD_IMAGE'))
    }
    img.src = url
  })
}

/* ============================== استخراج النص من الملفات (دفتر رفيق) ============================== */
function chunkText(raw, size = 1100) {
  const paras = String(raw || '')
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const chunks = []
  let cur = ''

  for (const p of paras) {
    if (cur && (cur + ' ' + p).length > size) {
      chunks.push(cur)
      cur = ''
    }
    if (p.length > size) {
      for (let i = 0; i < p.length; i += size) chunks.push(p.slice(i, i + size))
    } else {
      cur = cur ? `${cur} ${p}` : p
    }
  }
  if (cur) chunks.push(cur)

  return chunks.filter((t) => t.length > 20).map((text, i) => ({ page: null, part: i + 1, text }))
}

async function extractPdfText(blob, onProgress) {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker

  const pdf = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise
  const chunks = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    // NFKC يحوّل أشكال الحروف العربية "المعروضة" (ﻷ ﺑ ...) إلى حروف عادية فيصبح البحث ممكناً
    const text = content.items
      .map((item) => item.str)
      .join(' ')
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim()

    for (let i = 0; i < text.length; i += 1100) {
      const piece = text.slice(i, i + 1200)
      if (piece.length > 40) chunks.push({ page: p, text: piece })
    }
    onProgress?.(Math.round((p / pdf.numPages) * 100))
  }

  return chunks
}

// قراءة ملفات Word (.docx) بدون أي مكتبة خارجية: الملف عبارة عن ZIP نفك منه word/document.xml
async function extractDocxText(file) {
  if (typeof DecompressionStream === 'undefined') throw new Error('NO_DECOMPRESS')

  const buf = await file.arrayBuffer()
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)

  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('BAD_DOCX')

  const count = view.getUint16(eocd + 10, true)
  let p = view.getUint32(eocd + 16, true)
  const dec = new TextDecoder()

  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break

    const method = view.getUint16(p + 10, true)
    const csize = view.getUint32(p + 20, true)
    const nameLen = view.getUint16(p + 28, true)
    const extraLen = view.getUint16(p + 30, true)
    const commLen = view.getUint16(p + 32, true)
    const local = view.getUint32(p + 42, true)
    const fname = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen))
    p += 46 + nameLen + extraLen + commLen

    if (fname !== 'word/document.xml') continue

    const lNameLen = view.getUint16(local + 26, true)
    const lExtraLen = view.getUint16(local + 28, true)
    const start = local + 30 + lNameLen + lExtraLen
    const raw = bytes.subarray(start, start + csize)

    let xmlBytes = raw
    if (method === 8) {
      const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      xmlBytes = new Uint8Array(await new Response(stream).arrayBuffer())
    }

    return dec
      .decode(xmlBytes)
      .replace(/<\/w:p>/g, '\n')
      .replace(/<w:tab\/>/g, ' ')
      .replace(/<w:br\/>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
  }

  throw new Error('BAD_DOCX')
}

async function extractAnyText(file, onProgress) {
  const name = (file.name || '').toLowerCase()

  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdfText(file, onProgress)
  }
  if (name.endsWith('.docx')) {
    onProgress?.(30)
    const text = await extractDocxText(file)
    onProgress?.(100)
    return chunkText(text)
  }
  if (/\.html?$/.test(name)) {
    const html = await file.text()
    onProgress?.(100)
    return chunkText(
      html
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
    )
  }
  if (/\.(txt|md|csv|json|srt|vtt|log)$/.test(name) || (file.type || '').startsWith('text/')) {
    const text = await file.text()
    onProgress?.(100)
    return chunkText(text)
  }

  throw new Error('UNSUPPORTED')
}

function explainError(error, fileName = '') {
  const msg = String(error?.message || error || '')
  if (msg === 'UNSUPPORTED')
    return 'نوع الملف غير مدعوم. المدعوم: PDF و Word (docx) و TXT و MD و CSV و HTML.'
  if (msg === 'BAD_DOCX' || msg === 'NO_DECOMPRESS')
    return 'تعذر قراءة ملف Word. جرّب حفظه كـ PDF أو TXT ثم ارفعه.'
  if (error?.name === 'QuotaExceededError') return 'مساحة جهازك ممتلئة، احذف بعض الكتب وحاول مرة ثانية.'
  if (/import|module|resolve|dynamically/i.test(msg))
    return 'مكتبة قراءة PDF غير مثبتة. شغّل في الطرفية: npm i pdfjs-dist ثم أعد تشغيل Vite.'
  return `تعذر قراءة ${fileName ? `"${fileName}"` : 'الملف'}.`
}

/* ============================== البحث داخل المصادر ============================== */
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
  const q = [...new Set(tokenize(question))]
  if (!q.length) return spreadChunks(pool, k)

  return pool
    .map((chunk) => {
      const n = normalizeAr(chunk.text)
      let score = 0
      // includes بدل مطابقة الكلمة كاملة: يلتقط التصريفات واللواحق (الجهد، جهدان، بالجهد ...)
      q.forEach((w) => n.includes(w) && (score += 1))
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

/* ============================== عرض النص المنسق ============================== */
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.length > 4 && p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.length > 2 && p.startsWith('`') && p.endsWith('`'))
      return (
        <code key={i} dir="ltr" className="rounded bg-[var(--soft)] px-1 text-[11px]">
          {p.slice(1, -1)}
        </code>
      )
    return p
  })
}

function RichText({ text }) {
  const lines = String(text || '').split('\n')
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const t = line.trim()
        if (!t) return <div key={i} className="h-1.5" />

        const h = t.match(/^#{1,4}\s+(.*)/)
        if (h)
          return (
            <div key={i} className="mt-1 text-[13px] font-bold">
              {renderInline(h[1])}
            </div>
          )

        const li = t.match(/^([-*•]|\d+[.)])\s+(.*)/)
        if (li)
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 font-semibold text-[var(--brand)]">{/^\d/.test(li[1]) ? li[1] : '•'}</span>
              <span>{renderInline(li[2])}</span>
            </div>
          )

        return <div key={i}>{renderInline(t)}</div>
      })}
    </div>
  )
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

function Modal({ title, onClose, children }) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#1D1A45]/40 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="thin-scroll max-h-[88vh] w-full max-w-[460px] overflow-y-auto rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-[0_30px_80px_rgba(109,94,245,.3)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold">{title}</h2>
          <button onClick={onClose} className="btn-soft grid h-8 w-8 place-items-center rounded-full text-[12px]">✕</button>
        </div>
        <div className="mt-4">{children}</div>
      </motion.div>
    </motion.div>
  )
}

function ImageTools({ onGallery, onCamera, disabled }) {
  return (
    <>
      <button type="button" onClick={onGallery} disabled={disabled} title="إضافة صورة" className="btn-soft grid h-9 w-9 shrink-0 place-items-center rounded-full disabled:opacity-40">🖼</button>
      <button type="button" onClick={onCamera} disabled={disabled} title="التقاط بالكاميرا" className="btn-soft grid h-9 w-9 shrink-0 place-items-center rounded-full disabled:opacity-40">📷</button>
    </>
  )
}

function ImagePreviews({ images, onRemove }) {
  if (!images.length) return null
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {images.map((img) => (
        <div key={img.id} className="relative">
          <img src={img.dataUrl} alt="" className="h-16 w-16 rounded-[12px] border border-[var(--line)] object-cover" />
          <button
            type="button"
            onClick={() => onRemove(img.id)}
            className="absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#F04438] text-[9px] text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-full px-4 text-[11px] font-semibold ${active ? 'btn-grad' : 'btn-soft'}`}
    >
      {children}
    </button>
  )
}

function UserContent({ m }) {
  return (
    <>
      {m.images?.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {m.images.map((src, i) => (
            <img key={i} src={src} alt="" className="h-20 w-20 rounded-[10px] object-cover" />
          ))}
        </div>
      )}
      {!m.images?.length && m.imageCount > 0 && <div className="mb-1 text-[10px] opacity-80">📎 {m.imageCount} صورة</div>}
      {m.text}
    </>
  )
}

function AssistantActions({ text, onSave, onNotion, onToast }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      onToast('تم النسخ ✓')
    } catch {
      onToast('تعذر النسخ.')
    }
  }

  function speak() {
    if (!('speechSynthesis' in window)) {
      onToast('المتصفح لا يدعم القراءة الصوتية.')
      return
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      return
    }
    const utter = new SpeechSynthesisUtterance(String(text).replace(/[*#`]/g, ''))
    utter.lang = 'ar-SA'
    window.speechSynthesis.speak(utter)
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2 border-t border-[var(--line)] pt-2">
      <button onClick={onSave} className="btn-soft rounded-full px-2.5 py-1 text-[9px]">حفظ في ملاحظاتي</button>
      <button onClick={onNotion} className="btn-soft rounded-full px-2.5 py-1 text-[9px]">إلى Notion</button>
      <button onClick={copy} className="btn-soft rounded-full px-2.5 py-1 text-[9px]">نسخ</button>
      <button onClick={speak} className="btn-soft rounded-full px-2.5 py-1 text-[9px]">🔊 استماع</button>
    </div>
  )
}

/* ============================== الصفحة ============================== */
export default function Dashboard({ embedded = false, forcedTab = null, launch = null, onNavigate = null } = {}) {
  const nav = useNavigate()

  const [tab, setTab] = useState(forcedTab || 'home')
  const [study, setStudy] = useState(null) // { data, topic } نافذة الاختبار / البطاقات
  const [setup, setSetup] = useState(null) // 'quiz' | 'flashcards' نافذة إعداد الاختبار أو البطاقات
  const [setupForm, setSetupForm] = useState({ topic: '', count: 10, difficulty: 'same' })
  const [setupLoading, setSetupLoading] = useState(false)
  const [user, setUser] = useState('الطالب')
  const [studentClass, setStudentClass] = useState('')
  const [studentSection, setStudentSection] = useState('')
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

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
  const [booksView, setBooksView] = useState('site') // site | web | mine
  const [catalog, setCatalog] = useState(() => readLS(STORAGE.catalog, { at: 0, books: [] }).books)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [visible, setVisible] = useState(24)
  const [library, setLibrary] = useState([])
  const [downloads, setDownloads] = useState({}) // id -> progress %
  const [indexing, setIndexing] = useState({}) // id -> progress %
  const [uploading, setUploading] = useState({}) // id -> { name, progress }
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  /* دفتر رفيق */
  const [nbSelected, setNbSelected] = useState(() => readLS(STORAGE.nbSelected, []))
  const [nbMessages, setNbMessages] = useState(() => readLS(STORAGE.nbMessages, []))
  const [nbInput, setNbInput] = useState('')
  const [nbLoading, setNbLoading] = useState(false)
  const nbBoxRef = useRef(null)
  const chatBoxRef = useRef(null)

  /* الصور */
  const [aiImages, setAiImages] = useState([])
  const [nbImages, setNbImages] = useState([])
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)
  const imgTargetRef = useRef('ai')

  /* Notion */
  const [notion, setNotion] = useState({ connected: false, workspace: '', loading: true })
  const [notionError, setNotionError] = useState('')

  /* القوائم والإعدادات */
  const [menu, setMenu] = useState(null) // user | settings | notion | paste | cite
  const [form, setForm] = useState({ name: '', class: '', section: '' })
  const [pasteForm, setPasteForm] = useState({ title: '', text: '' })
  const [citeView, setCiteView] = useState(null)
  const [storageInfo, setStorageInfo] = useState(null)
  const [linkInput, setLinkInput] = useState('')

  /* سجل الدراسة */
  const [studyLog, setStudyLog] = useState(() => readLS(STORAGE.study, {}))

  useEffect(() => {
    if (menu !== 'settings') return
    navigator.storage?.estimate?.()
      .then((e) => setStorageInfo({ usage: e.usage || 0, quota: e.quota || 0 }))
      .catch(() => {})
  }, [menu])

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  const [pomoMode, setPomoMode] = useState('study')
  const [pomoRunning, setPomoRunning] = useState(false)
  const [pomoTime, setPomoTime] = useState(25 * 60)
  const pomoDoneRef = useRef(false)

  // الإصلاح: المؤقت القديم كان يمسح الإشعار الجديد قبل وقته إذا ظهر إشعاران متتاليان
  function showToast(text) {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 3600)
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
    const p = readLS(STORAGE.profile, null)
    if (!p) return
    if (p.name) setUser(p.name)
    if (p.class !== undefined) setStudentClass(p.class)
    if (p.section !== undefined) setStudentSection(p.section)
  }, [])

  useEffect(() => {
    if (localStorage.getItem(STORAGE.chanceDate) !== todayKey()) {
      setChances(DAILY_LIMIT)
      localStorage.setItem(STORAGE.chanceDate, todayKey())
      writeLS(STORAGE.chances, DAILY_LIMIT)
    }
  }, [])

  // نحتفظ بآخر رسائل فقط حتى لا تمتلئ مساحة localStorage فيتوقف الحفظ بصمت
  // (الصور والاختبارات الكاملة لا تُحفظ هنا؛ الاختبار يُحفظ بزر "حفظ على جهازي" داخل نافذته)
  useEffect(() => { writeLS(STORAGE.messages, messages.slice(-80).map(({ images, quiz, ...m }) => (images?.length ? { ...m, imageCount: images.length } : m))) }, [messages])
  useEffect(() => { writeLS(STORAGE.notes, notes) }, [notes])
  useEffect(() => { writeLS(STORAGE.nbMessages, nbMessages.slice(-60).map(({ images, ...m }) => (images?.length ? { ...m, imageCount: images.length } : m))) }, [nbMessages])
  useEffect(() => { writeLS(STORAGE.nbSelected, nbSelected) }, [nbSelected])
  useEffect(() => { writeLS(STORAGE.study, studyLog) }, [studyLog])

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

  // عند انتهاء الجلسة: صوت + إشعار + تسجيل الدقائق في سجل الدراسة
  useEffect(() => {
    if (pomoTime !== 0 || pomoDoneRef.current) return
    pomoDoneRef.current = true
    beep()

    if (pomoMode === 'break') {
      showToast('انتهت الراحة، يلا نكمل 💪')
    } else {
      const mins = pomoMode === 'deep' ? 50 : 25
      setStudyLog((c) => ({ ...c, [todayKey()]: (c[todayKey()] || 0) + mins }))
      showToast(`أحسنت! أنجزت ${mins} دقيقة تركيز ✓`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomoTime, pomoMode])

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

  /* ---------- التمرير داخل صندوق المحادثة فقط (بدل scrollIntoView الذي كان يحرك الصفحة كلها) ---------- */
  function scrollBox(ref, smooth = true) {
    const el = ref.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }

  useEffect(() => {
    if (tab === 'ai') scrollBox(chatBoxRef)
  }, [messages, aiLoading, tab])

  useEffect(() => {
    if (tab === 'notebook') scrollBox(nbBoxRef)
  }, [nbMessages, nbLoading, tab])

  // عند تبديل التبويب ينتظر العنصر حتى ينتهي أنيميشن الخروج ثم ينزل لآخر رسالة
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (tab === 'ai') scrollBox(chatBoxRef, false)
      if (tab === 'notebook') scrollBox(nbBoxRef, false)
    }, 380)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  /* ---------- مكتبة الجهاز ---------- */
  async function loadLibrary() {
    try {
      const items = (await dbAll('meta')).sort((a, b) => b.addedAt - a.addedAt)
      setLibrary(items)
      // نزيل من المصادر المحددة أي كتاب لم يعد موجوداً أو غير مجهز
      setNbSelected((c) =>
        c.filter((id) => id.startsWith('note:') || items.some((b) => b.id === id && b.indexed))
      )
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
    if (tab === 'books') loadCatalog()
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
        source: 'al-amgaad.com',
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

      const chunks = await extractAnyText(
        Object.assign(file.blob, { name: `${book.title}.pdf` }), // الكتب المحمّلة من الموقع كلها PDF
        (p) => setIndexing((c) => ({ ...c, [book.id]: p }))
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
      showToast(explainError(error, book.title))
    } finally {
      setIndexing((c) => {
        const next = { ...c }
        delete next[book.id]
        return next
      })
    }
  }

  /* ---------- رفع المستندات (جديد: مثل NotebookLM) ---------- */
  async function addFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return

    for (const file of files) {
      const id = `f${hashStr(`${file.name}|${file.size}|${file.lastModified}`)}`

      try {
        if (await dbGet('meta', id)) {
          showToast(`"${file.name}" موجود في مكتبتك مسبقاً.`)
          continue
        }
      } catch {
        /* نكمل */
      }

      setUploading((c) => ({ ...c, [id]: { name: file.name, progress: 0 } }))

      try {
        const chunks = await extractAnyText(file, (p) =>
          setUploading((c) => (c[id] ? { ...c, [id]: { ...c[id], progress: p } } : c))
        )

        if (!chunks.length) {
          showToast(`"${file.name}" لا يحتوي نصاً قابلاً للقراءة (ربما صور ممسوحة).`)
          continue
        }

        await navigator.storage?.persist?.()
        await dbPut('files', { id, blob: file })
        await dbPut('texts', { id, chunks })
        await dbPut('meta', {
          id,
          title: file.name.replace(/\.[^.]+$/, '') || 'مستند',
          subject: '',
          grade: '',
          source: 'رفع من جهازك',
          size: file.size,
          type: file.type || 'application/octet-stream',
          addedAt: Date.now(),
          indexed: true,
        })

        await loadLibrary()
        setNbSelected((c) => (c.includes(id) ? c : [...c, id]))
        showToast(`تمت إضافة "${file.name}" كمصدر ✓`)
      } catch (error) {
        console.error('Upload error:', error)
        showToast(explainError(error, file.name))
      } finally {
        setUploading((c) => {
          const next = { ...c }
          delete next[id]
          return next
        })
      }
    }
  }

  function onPickFiles(e) {
    addFiles(e.target.files)
    e.target.value = ''
  }

  function onDropFiles(e) {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer?.files)
  }

  async function savePastedText() {
    const text = pasteForm.text.trim()
    if (text.length < 30) {
      showToast('النص قصير جداً. الصق فقرة أو أكثر.')
      return
    }

    const title = pasteForm.title.trim() || `نص ${formatDate()}`
    const id = `p${hashStr(`${title}|${Date.now()}`)}`

    try {
      const chunks = chunkText(text)
      if (!chunks.length) {
        showToast('لم أستطع قراءة النص.')
        return
      }
      const blob = new Blob([text], { type: 'text/plain' })
      await dbPut('files', { id, blob })
      await dbPut('texts', { id, chunks })
      await dbPut('meta', {
        id,
        title,
        subject: '',
        grade: '',
        source: 'نص ملصوق',
        size: blob.size,
        type: 'text/plain',
        addedAt: Date.now(),
        indexed: true,
      })
      await loadLibrary()
      setNbSelected((c) => [...c, id])
      setPasteForm({ title: '', text: '' })
      setMenu(null)
      showToast('تمت إضافة النص كمصدر ✓')
    } catch (error) {
      console.error('Paste error:', error)
      showToast(explainError(error, title))
    }
  }

  /* ---------- الصور (معرض / كاميرا) ---------- */
  function openImagePicker(target, camera = false) {
    imgTargetRef.current = target
    ;(camera ? cameraRef : galleryRef).current?.click()
  }

  async function onPickImages(e) {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
    e.target.value = ''
    if (!files.length) return

    const target = imgTargetRef.current
    const setter = target === 'nb' ? setNbImages : setAiImages
    const room = MAX_IMAGES - (target === 'nb' ? nbImages.length : aiImages.length)

    if (room <= 0) {
      showToast(`الحد الأقصى ${MAX_IMAGES} صور في الرسالة الواحدة.`)
      return
    }

    try {
      const urls = await Promise.all(files.slice(0, room).map((f) => imageToDataUrl(f)))
      setter((c) => [...c, ...urls.map((dataUrl) => ({ id: uid(), dataUrl }))].slice(0, MAX_IMAGES))
      if (files.length > room) showToast(`أُضيفت ${room} فقط (الحد الأقصى ${MAX_IMAGES}).`)
    } catch {
      showToast('تعذر قراءة الصورة.')
    }
  }

  /* ---------- استدعاء الذكاء الاصطناعي ---------- */
  async function callAI({ message, mode, context, history, images }) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        message,
        mode,
        role: 'student',
        context,
        history,
        ...(images?.length ? { images } : {}),
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

    // الخادم يرجع كائن اختبار / بطاقات كما هو (type: quiz | flashcards)
    if (data?.type === 'quiz' || data?.type === 'flashcards') return data

    const reply = data?.reply || data?.text
    if (!reply) throw new Error('EMPTY_AI_RESPONSE')
    return reply
  }

  // طلب مخصص لنافذة الاختبار (إضافة أسئلة / بطاقات): نفس المصادقة ويخصم رسالة من العدّاد
  async function requestStudy(extra) {
    if (chances <= 0) throw new Error('انتهت رسائلك اليوم، ستتجدد غداً.')
    setChances((c) => Math.max(0, c - 1))
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          role: 'student',
          student: { name: user, class: studentClass, section: studentSection },
          ...extra,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) throw new Error(data?.error || `HTTP ${res.status}`)
      return data
    } catch (e) {
      setChances((c) => Math.min(DAILY_LIMIT, c + 1))
      throw e
    }
  }

  function openSetup(kind) {
    setSetup(kind)
  }

  async function startStudy() {
    const kind = setup
    const topic = setupForm.topic.trim()
    if (topic.length < 2) {
      showToast('اكتب اسم الدرس أو الموضوع أولاً.')
      return
    }
    setSetupLoading(true)
    try {
      const data = await requestStudy({
        message: topic,
        topic,
        mode: kind,
        count: setupForm.count,
        difficulty: setupForm.difficulty,
        focus: 'all',
      })
      if (data.type !== 'quiz' && data.type !== 'flashcards') throw new Error(data.reply || 'تعذر الإنشاء، حاول مرة أخرى.')
      const isQuiz = data.type === 'quiz'
      setMessages((current) => [
        ...current,
        {
          id: uid(),
          role: 'assistant',
          text: isQuiz
            ? `جهّزت لك اختباراً من ${data.questions.length} سؤالاً في «${topic}» ✅`
            : `جهّزت لك ${data.cards.length} بطاقة مراجعة في «${topic}» ✅`,
          quiz: data,
          quizTopic: topic,
        },
      ])
      setSetup(null)
      setStudy({ data, topic })
    } catch (e) {
      showToast(e.message && e.message.length < 90 ? e.message : 'تعذر الإنشاء، حاول مرة أخرى.')
    } finally {
      setSetupLoading(false)
    }
  }

  function toHistory(list, n) {
    return list
      .filter((m) => !m.error && m.text)
      .slice(-n)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text.slice(0, 1500) }))
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
    const imgs = aiImages
    const question = (customMessage ?? input).trim() || (imgs.length ? 'اقرأ هذه الصورة واشرح ما فيها.' : '')

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

    const history = toHistory(messages, 8)

    setMessages((current) => [
      ...current,
      { id: uid(), role: 'user', text: question, images: imgs.map((i) => i.dataUrl) },
    ])
    setInput('')
    setAiImages([])
    setAiLoading(true)
    setChances((current) => Math.max(0, current - 1))

    try {
      const result = await callAI({ message: question, mode, history, images: imgs.map((i) => i.dataUrl) })

      if (typeof result === 'object') {
        // اختبار أو بطاقات: نفتح النافذة مباشرة ونترك رسالة قصيرة مع زر لإعادة الفتح
        const isQuiz = result.type === 'quiz'
        setMessages((current) => [
          ...current,
          {
            id: uid(),
            role: 'assistant',
            text: isQuiz
              ? `جهّزت لك اختباراً من ${result.questions.length} سؤالاً ✅`
              : `جهّزت لك ${result.cards.length} بطاقة مراجعة ✅`,
            quiz: result,
            quizTopic: question,
          },
        ])
        setStudy({ data: result, topic: question })
      } else {
        setMessages((current) => [...current, { id: uid(), role: 'assistant', text: result }])
      }
    } catch (error) {
      console.error('Rafeeq AI error:', error)
      // لا نخصم رسالة من الطالب إذا فشل الخادم
      setChances((current) => Math.min(DAILY_LIMIT, current + 1))

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

  function pushNb(message) {
    setNbMessages((c) => [...c, { id: uid(), ...message }])
  }

  async function askNotebook(customQuestion = null) {
    const imgs = nbImages
    const question = (customQuestion ?? nbInput).trim() || (imgs.length ? 'اقرأ هذه الصورة واربطها بمصادري إن أمكن.' : '')
    if (!question || nbLoading) return

    // إذا لم يحدد الطالب شيئاً نستخدم كل المصادر الجاهزة تلقائياً
    const readyBooks = library.filter((b) => b.indexed).map((b) => b.id)
    const ids = nbSelected.length ? nbSelected : readyBooks

    if (!ids.length && !imgs.length) {
      pushNb({ role: 'user', text: question })
      pushNb({
        role: 'assistant',
        error: true,
        text: 'ما عندي مصادر أقرأ منها بعد. اضغط "＋ رفع مستند" وارفع PDF أو Word أو نص، أو الصق نصاً، أو نزّل كتاباً من "كتب ودروس" ثم اضغط "تجهيز للدفتر".',
      })
      setNbInput('')
      return
    }

    if (chances <= 0) {
      pushNb({ role: 'user', text: question })
      pushNb({ role: 'assistant', error: true, text: 'انتهت رسائلك اليوم، ستتجدد غداً.' })
      setNbInput('')
      return
    }

    pushNb({ role: 'user', text: question, images: imgs.map((i) => i.dataUrl) })
    const history = toHistory(nbMessages, 4)
    setNbInput('')
    setNbImages([])
    setNbLoading(true)
    setChances((c) => Math.max(0, c - 1))
    const refund = () => setChances((c) => Math.min(DAILY_LIMIT, c + 1))

    try {
      const pool = []

      for (const id of ids) {
        if (id.startsWith('note:')) {
          const note = notes.find((n) => `note:${n.id}` === id)
          if (note) pool.push({ title: `ملاحظة: ${note.title}`, page: null, text: String(note.content).slice(0, 1500) })
          continue
        }
        const book = library.find((b) => b.id === id)
        const record = await dbGet('texts', id)
        record?.chunks?.forEach((ch) =>
          pool.push({ title: book?.title || 'مصدر', page: ch.page ?? null, text: ch.text })
        )
      }

      if (!pool.length && !imgs.length) throw new Error('NO_TEXT')

      const isTask = Object.values(nbTasks).includes(question)
      const picked = isTask ? spreadChunks(pool, 8) : topChunks(question, pool, 6)

      if (!picked.length && !imgs.length) {
        refund()
        pushNb({
          role: 'assistant',
          text: 'لم أجد في المصادر المحددة ما يتعلق بسؤالك. جرّب صياغة مختلفة أو أضف مصدراً آخر.',
        })
        return
      }

      const context = picked.map((p, i) => ({ n: i + 1, title: p.title, page: p.page, text: p.text }))
      const reply = await callAI({ message: question, mode: 'notebook', context, history, images: imgs.map((i) => i.dataUrl) })

      pushNb({
        role: 'assistant',
        text: reply,
        cites: context.map(({ n, title, page, text }) => ({ n, title, page, text: text.slice(0, 450) })),
      })
    } catch (error) {
      console.error('Notebook error:', error)
      refund()
      pushNb({
        role: 'assistant',
        error: true,
        text: 'تعذر الحصول على إجابة من دفتر رفيق. تأكد أن المصادر مجهزة وأن الخادم يعمل.',
      })
    } finally {
      setNbLoading(false)
    }
  }

  function toggleSource(id) {
    setNbSelected((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  }

  function toggleAllSources() {
    const readyIds = library.filter((b) => b.indexed).map((b) => b.id)
    const allOn = readyIds.length > 0 && readyIds.every((id) => nbSelected.includes(id))
    setNbSelected(allOn ? [] : [...new Set([...nbSelected, ...readyIds])])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function connectNotion() {
    setNotionError('')
    try {
      const res = await fetch('/api/notion/auth-url', { headers: authHeaders() })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.url) throw new Error(data?.error || `الخادم رد بالرمز ${res.status}`)
      window.location.href = data.url
    } catch (error) {
      setNotionError(error.message || 'تعذر الاتصال بالخادم')
      setMenu('notion')
    }
  }

  function openNotionSite() {
    window.open('https://www.notion.so/', '_blank', 'noopener')
  }

  async function disconnectNotion() {
    if (!window.confirm('فصل الربط مع Notion؟')) return
    await fetch('/api/notion/disconnect', { method: 'DELETE', headers: authHeaders() }).catch(() => null)
    setNotion({ connected: false, workspace: '', loading: false })
  }

  async function exportToNotion(title, content) {
    // بدون ربط: ننسخ المحتوى ونفتح موقع Notion الرسمي ليلصقه المستخدم
    if (!notion.connected) {
      openNotionSite()
      try {
        await navigator.clipboard.writeText(`# ${title}\n\n${content}`)
        showToast('نُسخ المحتوى ✓ الصقه في صفحة جديدة داخل Notion (Ctrl+V)')
      } catch {
        showToast('تم فتح Notion. انسخ النص يدوياً والصقه هناك.')
      }
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

  /* ---------- الإعدادات ---------- */
  function openSettings() {
    setForm({ name: user === 'الطالب' ? '' : user, class: studentClass, section: studentSection })
    setMenu('settings')
  }

  function saveProfile() {
    const name = form.name.trim() || 'الطالب'
    const cls = form.class.trim()
    const sec = form.section.trim()
    setUser(name)
    setStudentClass(cls)
    setStudentSection(sec)
    writeLS(STORAGE.profile, { name, class: cls, section: sec })
    localStorage.setItem('rafeaq_student_class', cls)
    localStorage.setItem('rafeaq_student_section', sec)
    setMenu(null)
    showToast('تم حفظ الإعدادات ✓')
  }

  function wipeChatsAndNotes() {
    if (!window.confirm('حذف كل المحادثات والملاحظات من هذا الجهاز؟')) return
    setMessages([])
    setNbMessages([])
    setNotes([])
    showToast('تم الحذف')
  }

  async function wipeLibrary() {
    if (!window.confirm('حذف كل الكتب والمستندات المحفوظة من جهازك؟')) return
    await Promise.all(library.flatMap((b) => [dbDel('files', b.id), dbDel('meta', b.id), dbDel('texts', b.id)]))
    setNbSelected([])
    await loadLibrary()
    showToast('تم حذف الكتب من جهازك')
  }

  function addBookByLink() {
    const url = linkInput.trim()
    try {
      new URL(url)
    } catch {
      showToast('الرابط غير صحيح.')
      return
    }
    let title = 'كتاب'
    try {
      title = decodeURIComponent(url.split('?')[0].split('/').pop() || 'كتاب')
        .replace(/\.pdf$/i, '')
        .replace(/[-_+]+/g, ' ')
    } catch { /* ignore */ }
    setLinkInput('')
    downloadBook({ id: `u${hashStr(url)}`, title: title || 'كتاب', url, subject: '', grade: '' })
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
    setNbSelected((c) => c.filter((x) => x !== `note:${id}`))
  }

  function resetTimer(mode = pomoMode) {
    pomoDoneRef.current = false
    setPomoRunning(false)
    setPomoTime(mode === 'study' ? 25 * 60 : mode === 'deep' ? 50 * 60 : 5 * 60)
  }

  function changeTimerMode(mode) {
    setPomoMode(mode)
    resetTimer(mode)
  }

  function goTo(nextTab) {
    // داخل نافذة في Rafeeq OS: كل تبويب تطبيق مستقل، فنفتحه في نافذته بدل تبديل هذه النافذة
    if (embedded && onNavigate && nextTab !== tab) {
      onNavigate(nextTab)
      return
    }
    setTab(nextTab)
    if (!embedded) window.scrollTo({ top: 0, behavior: 'smooth' })
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

  /* ---------- نشاط الدراسة ---------- */
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        const key = dateKey(d)
        return {
          key,
          label: new Intl.DateTimeFormat('ar-LY', { weekday: 'short' }).format(d),
          mins: studyLog[key] || 0,
        }
      }),
    [studyLog]
  )

  const streak = useMemo(() => {
    let n = 0
    const d = new Date()
    if (!studyLog[dateKey(d)]) d.setDate(d.getDate() - 1)
    while (studyLog[dateKey(d)] > 0) {
      n += 1
      d.setDate(d.getDate() - 1)
    }
    return n
  }, [studyLog])

  const todayMins = studyLog[todayKey()] || 0

  // ارتفاع النافذة الفعلي: يملأ صندوق المحادثة المساحة المتاحة بدل ارتفاع ثابت (مهم للهاتف)
  const rootRef = useRef(null)
  const [boxH, setBoxH] = useState(0)
  useEffect(() => {
    if (!embedded) return undefined
    const el = rootRef.current?.parentElement
    if (!el) return undefined
    const read = () => setBoxH(el.clientHeight)
    read()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null
    ro?.observe(el)
    window.addEventListener('resize', read)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', read)
    }
  }, [embedded])

  // وضع النافذة: تبويب ثابت + استقبال أوامر الفتح من Rafeeq OS (بحث / عرض المكتبة)
  useEffect(() => {
    if (embedded && forcedTab) setTab(forcedTab)
  }, [embedded, forcedTab])

  useEffect(() => {
    if (!embedded || !launch) return
    if (launch.view) setBooksView(launch.view)
    if (typeof launch.query === 'string') setSearch(launch.query)
    if (launch.pickImage) {
      showToast('اختر صورة لتحليلها من زر الإرفاق في المحادثة.')
      window.setTimeout(() => galleryRef.current?.click(), 60)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, launch?.nonce])

  const navigation = [
    { id: 'home', label: 'الرئيسية', icon: '⌂' },
    { id: 'ai', label: 'رفيق AI', icon: '✦' },
    { id: 'notebook', label: 'دفتر رفيق', icon: '❖' },
    { id: 'board', label: 'سبورة رفيق', icon: '▱' },
    { id: 'books', label: 'كتب ودروس', icon: '▤' },
    { id: 'notes', label: 'ملاحظاتي', icon: '▢' },
    { id: 'timer', label: 'مؤقت الدراسة', icon: '◷' },
  ]

  const readySources = library.filter((b) => b.indexed)
  const uploadingList = Object.entries(uploading)

  /* ============================== الواجهة ============================== */
  return (
    <div ref={rootRef} dir="rtl" className={embedded ? 'dash-embed relative min-h-full overflow-x-hidden text-[var(--ink)]' : 'relative min-h-screen overflow-x-hidden text-[var(--ink)]'}>
      {embedded && <style>{EMBED_CSS}</style>}
      {!embedded && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

        :root {
          color-scheme: dark;
          --bg: #070B16;
          --ink: #F2F5FF;
          --muted: #9AA8C7;
          --brand: #6684FF;
          --brand2: #A36BFF;
          --cyan: #45D7F5;
          --mint: #62E8BC;
          --coral: #FFAD86;
          --soft: #121B31;
          --line: rgba(133, 157, 224, .19);
          --grad: linear-gradient(125deg, #496DFF 0%, #8058ED 52%, #2DBBDE 100%);
        }

        * { font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif; }
        html { scroll-behavior: smooth; background: var(--bg); }
        body { background: var(--bg); color: var(--ink); }
        button, input, textarea, select { font: inherit; }
        button { -webkit-tap-highlight-color: transparent; }
        :focus-visible { outline: 2px solid rgba(89, 160, 255, .9); outline-offset: 3px; }
        ::selection { background: #536FFF; color: white; }

        .thin-scroll { scrollbar-width: thin; scrollbar-color: #354773 transparent; }
        .thin-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .thin-scroll::-webkit-scrollbar-thumb { background: #354773; border-radius: 999px; }

        .bg-stage {
          position: fixed; inset: 0; z-index: -1; overflow: hidden;
          background:
            radial-gradient(900px 540px at 90% -10%, rgba(86, 94, 255, .22), transparent 62%),
            radial-gradient(780px 560px at -10% 25%, rgba(34, 177, 222, .13), transparent 62%),
            radial-gradient(720px 520px at 55% 115%, rgba(131, 72, 235, .14), transparent 62%),
            var(--bg);
        }
        .bg-stage::after {
          content: ''; position: absolute; inset: 0; opacity: .24;
          background-image: radial-gradient(rgba(146, 170, 255, .4) .7px, transparent .7px);
          background-size: 28px 28px;
          mask-image: linear-gradient(to bottom, #000, transparent 78%);
        }

        .glass {
          background: rgba(13, 21, 40, .78);
          backdrop-filter: blur(22px) saturate(135%);
          -webkit-backdrop-filter: blur(22px) saturate(135%);
          border: 1px solid var(--line);
          box-shadow: 0 14px 42px rgba(0, 0, 0, .19), inset 0 1px 0 rgba(255,255,255,.025);
        }

        .aurora-card {
          background: linear-gradient(118deg, #172A58 0%, #35296D 48%, #124B66 100%);
          background-size: 200% 200%; animation: flow 15s ease infinite;
          border: 1px solid rgba(150, 174, 255, .24);
          box-shadow: 0 26px 70px rgba(0, 0, 0, .26), inset 0 1px 0 rgba(255,255,255,.08);
        }
        @keyframes flow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

        .blob { position: absolute; border-radius: 999px; filter: blur(52px); opacity: .42; pointer-events: none; }
        .blob-a { width: 260px; height: 260px; background: #607BFF; top: -90px; left: -60px; opacity: .2; animation: drift 9s ease-in-out infinite; }
        .blob-b { width: 300px; height: 300px; background: #2CBCE0; bottom: -150px; right: 25%; opacity: .18; animation: drift 11s ease-in-out infinite reverse; }
        @keyframes drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,22px) scale(1.12); } }

        .float { animation: float 4.5s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .gtext { background: linear-gradient(110deg, #E5ECFF, #AFC3FF 48%, #7CE8F5); -webkit-background-clip: text; background-clip: text; color: transparent; }

        .btn-grad {
          position: relative; overflow: hidden; color: #fff; background: var(--grad); background-size: 160% 160%;
          border: 1px solid rgba(194, 211, 255, .2);
          box-shadow: 0 8px 24px rgba(50, 78, 190, .27); transition: transform .2s, box-shadow .2s, filter .2s;
        }
        .btn-grad:hover { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 14px 32px rgba(50, 78, 190, .36); }
        .btn-grad::after {
          content: ''; position: absolute; top: 0; left: -80%; width: 50%; height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.3), transparent);
          transform: skewX(-20deg); transition: left .6s; pointer-events: none;
        }
        .btn-grad:hover::after { left: 140%; }
        .btn-grad:disabled { opacity: .42; transform: none; box-shadow: none; cursor: not-allowed; }

        .btn-soft { background: #17233F; color: #C8D5FF; border: 1px solid rgba(133,157,224,.2); transition: background .2s, transform .2s; }
        .btn-soft:hover { background: #202F54; transform: translateY(-1px); }
        .card-hover { transition: transform .25s, box-shadow .25s, border-color .25s, background .25s; }
        .card-hover:hover { transform: translateY(-3px); border-color: rgba(109, 145, 255, .46); background-color: rgba(23, 35, 65, .9); box-shadow: 0 18px 44px rgba(0,0,0,.23); }
        .nav-active { background: linear-gradient(135deg, rgba(74,109,255,.28), rgba(128,88,237,.25)); color: #fff; border: 1px solid rgba(132,159,255,.28); box-shadow: inset 0 0 22px rgba(81,111,255,.09), 0 8px 20px rgba(0,0,0,.15); }

        .pulse-ring { animation: ring 1.8s ease-out infinite; }
        @keyframes ring { 0% { box-shadow: 0 0 0 0 rgba(98,232,188,.45); } 100% { box-shadow: 0 0 0 10px rgba(98,232,188,0); } }
        .shimmer { background: linear-gradient(90deg, #121B31 25%, #1B2948 50%, #121B31 75%); background-size: 200% 100%; animation: shim 1.4s infinite; }
        @keyframes shim { to { background-position: -200% 0; } }
        .timer-ring { background: conic-gradient(var(--brand) var(--deg), #1C2A49 0); }
        .typing-dot { width: 6px; height: 6px; border-radius: 999px; background: #7F9AFF; animation: bounce 1.1s infinite ease-in-out; }
        .typing-dot:nth-child(2) { animation-delay: .15s; }
        .typing-dot:nth-child(3) { animation-delay: .3s; }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-5px); opacity: 1; } }

        /* Keep the original utility classes and all page logic, but tune light surfaces for the PS5-inspired dark UI. */
        [class~="bg-white"], [class*="bg-white/"] { background-color: rgba(17, 27, 49, .92) !important; }
        [class*="bg-[var(--soft)]"] { background-color: #111B31 !important; }
        [class*="border-[var(--line)]"] { border-color: var(--line) !important; }
        [class*="text-[var(--muted)]"] { color: var(--muted) !important; }
        [class~="text-black"], [class~="text-gray-900"], [class~="text-slate-900"] { color: var(--ink) !important; }
        [class*="focus:bg-white"]:focus { background-color: #17233F !important; }
        input, textarea, select { color: var(--ink); }
        input::placeholder, textarea::placeholder { color: #7181A5; opacity: 1; }
        input[type="file"] { color: var(--muted); }
        ::-webkit-calendar-picker-indicator { filter: invert(.8); }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        }
      `}</style>}

      {!embedded && <div className="bg-stage" />}

      {/* حقل رفع الملفات المشترك */}
      <input ref={fileRef} type="file" multiple accept={ACCEPT_FILES} onChange={onPickFiles} className="hidden" />
      <input ref={galleryRef} type="file" multiple accept="image/*" onChange={onPickImages} className="hidden" />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPickImages} className="hidden" />

      {/* ============ الشريط الجانبي ============ */}
      {!embedded && <aside className="glass fixed right-0 top-0 z-40 hidden h-screen w-[256px] flex-col border-y-0 border-r-0 lg:flex">
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

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button onClick={openSettings} className="btn-soft h-9 rounded-[11px] text-[11px]">⚙ الإعدادات</button>
            <button onClick={logout} className="h-9 rounded-[11px] border border-[#F6CFCF] bg-[#FFF5F5] text-[11px] text-[#C23B3B] transition hover:bg-[#FFEAEA]">
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>}

      <main className={embedded ? '' : 'lg:mr-[256px]'}>
        {/* ============ الشريط العلوي ============ */}
        <header className={`glass sticky top-0 z-40 border-x-0 border-t-0 ${embedded ? 'dash-embed-head' : ''} ${embedded && tab === 'ai' ? 'hidden' : ''}`}>
          <div className="flex h-[64px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                onClick={() => goTo('home')}
                className={`btn-grad grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${embedded ? 'hidden' : 'lg:hidden'}`}
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
                onClick={() => setMenu('notion')}
                className="btn-soft flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold"
                title="Notion"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${notion.connected ? 'pulse-ring bg-[var(--mint)]' : 'bg-[#C5C1E6]'}`} />
                <span>{notion.connected ? 'Notion متصل' : 'Notion'}</span>
              </button>

              <div className={`hidden text-left text-[10px] leading-4 text-[var(--muted)] ${embedded ? '' : 'md:block'}`}>{formatDate()}</div>

              <div className={embedded ? 'hidden' : 'relative'}>
                <button
                  onClick={() => setMenu(menu === 'user' ? null : 'user')}
                  className="btn-grad grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold"
                  title="حسابي"
                >
                  {getInitials(user)}
                </button>

                <AnimatePresence>
                  {menu === 'user' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute left-0 top-12 z-50 w-[230px] rounded-[18px] border border-[var(--line)] bg-white p-2 shadow-[0_20px_50px_rgba(109,94,245,.22)]"
                    >
                      <div className="px-3 py-2">
                        <div className="truncate text-[12px] font-bold">{user}</div>
                        <div className="truncate text-[9px] text-[var(--muted)]">
                          {studentClass || 'طالب'}{studentSection ? ` • ${studentSection}` : ''}
                        </div>
                      </div>
                      <div className="my-1 h-px bg-[var(--line)]" />
                      {[
                        ['⚙', 'الإعدادات', openSettings],
                        ['N', 'Notion', () => setMenu('notion')],
                      ].map(([icon, label, fn]) => (
                        <button key={label} onClick={fn} className="flex h-10 w-full items-center gap-3 rounded-[11px] px-3 text-right text-[12px] hover:bg-[var(--soft)]">
                          <span className="w-4 text-center">{icon}</span>{label}
                        </button>
                      ))}
                      <div className="my-1 h-px bg-[var(--line)]" />
                      <button onClick={logout} className="flex h-10 w-full items-center gap-3 rounded-[11px] px-3 text-right text-[12px] text-[#C23B3B] hover:bg-[#FFF1F1]">
                        <span className="w-4 text-center">⎋</span>تسجيل الخروج
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <div className={embedded ? 'mx-auto max-w-[1240px] px-2 py-2 pb-4 sm:px-4' : 'mx-auto max-w-[1240px] px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-8'}>
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
                        ارفع مستنداتك أو حمّل كتبك على جهازك، وخلّي دفتر رفيق يقرأها معاك ويجاوب من داخلها،
                        وصدّر ملخصاتك إلى Notion بضغطة وحدة.
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
                      { id: 'books', title: 'مكتبتي', value: library.length, caption: 'مصدر على جهازك', icon: '▤', tone: 'var(--cyan)' },
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

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        {[
                          { icon: '✦', t: 'شرح درس', d: 'فهم الفكرة خطوة بخطوة', fn: () => { goTo('ai'); setInput('اشرح لي هذا الدرس بطريقة بسيطة') } },
                          { icon: '▱', t: 'سبورة رفيق', d: 'اكتب وارسم مع الأستاذ', fn: () => goTo('board') },
                          { icon: '＋', t: 'ارفع مستنداً', d: 'PDF أو Word أو نص', fn: () => { goTo('notebook'); window.setTimeout(() => fileRef.current?.click(), 400) } },
                          { icon: '❖', t: 'اسأل كتبك', d: 'إجابات من داخل مصادرك', fn: () => goTo('notebook') },
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

                    <div className="space-y-4">
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

                      <div className="glass rounded-[22px] p-5">
                        <div className="flex items-center justify-between">
                          <div className="text-[13px] font-bold">نشاط الدراسة</div>
                          <div className="rounded-full bg-[#FFF1EA] px-2.5 py-1 text-[9px] font-bold text-[var(--coral)]">
                            🔥 {streak} {streak === 1 ? 'يوم متتالي' : 'أيام متتالية'}
                          </div>
                        </div>

                        <div className="mt-4 flex h-[70px] items-end gap-1.5">
                          {weekDays.map((d) => (
                            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                              <div className="flex h-[52px] w-full items-end rounded-[8px] bg-[var(--soft)]">
                                <div
                                  className="w-full rounded-[8px] transition-all"
                                  style={{
                                    height: d.mins ? `${Math.max(14, Math.min(100, (d.mins / 60) * 100))}%` : '0%',
                                    background: 'var(--grad)',
                                  }}
                                  title={`${d.mins} دقيقة`}
                                />
                              </div>
                              <div className="text-[8px] text-[var(--muted)]">{d.label}</div>
                            </div>
                          ))}
                        </div>

                        <p className="mt-3 text-[9px] leading-5 text-[var(--muted)]">
                          اليوم: {todayMins} دقيقة تركيز. أكمل جلسة في المؤقت لتُسجَّل هنا تلقائياً.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ================= سبورة رفيق ================= */}
              {tab === 'board' && <SmartBoard fullscreen onClose={embedded ? null : () => goTo('home')} />}

              {/* ================= رفيق AI ================= */}
              {tab === 'ai' && (
                <section className="mx-auto max-w-[920px]">
                  <div className="glass overflow-hidden rounded-[24px]">
                    <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2 sm:gap-3 sm:px-5 sm:py-3">
                      <div className="flex items-center gap-3">
                        <div className="btn-grad grid h-10 w-10 place-items-center rounded-full">✦</div>
                        <div>
                          <div className="text-[13px] font-bold">رفيق AI</div>
                          <div className="text-[9px] text-[var(--muted)]">مساعد دراسي • {chances} رسالة متبقية</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => openSetup('quiz')} className="btn-grad rounded-full px-3.5 py-1.5 text-[10px] font-semibold">
                          📝 اختبار
                        </button>
                        <button onClick={() => openSetup('flashcards')} className="btn-grad rounded-full px-3.5 py-1.5 text-[10px] font-semibold">
                          🗂 بطاقات
                        </button>
                        <button onClick={clearChat} className="btn-soft rounded-full px-3 py-1.5 text-[9px]">
                          مسح المحادثة
                        </button>
                      </div>
                    </div>

                    <div ref={chatBoxRef} style={embedded && boxH ? { height: Math.max(240, boxH - 250) } : undefined} className={`thin-scroll overflow-y-auto bg-white/40 p-3 sm:p-6 ${embedded ? '' : 'h-[58vh] min-h-[430px]'}`}>
                      {messages.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center text-center ${embedded ? 'min-h-full' : 'min-h-[420px]'}`}>
                          <div className="btn-grad float grid h-16 w-16 place-items-center rounded-[22px] text-[23px]">✦</div>
                          <h2 className="mt-5 text-[19px] font-bold">شن تبي نراجع معاك؟</h2>
                          <p className="mt-2 max-w-[450px] text-[11px] leading-6 text-[var(--muted)]">
                            اسأل عن درس أو اطلب شرحاً أو أسئلة مراجعة. رفيق لا يستبدل كتبك ومصادر المدرسة.
                          </p>

                          <div className="mt-6 grid w-full max-w-[600px] gap-2 sm:grid-cols-2">
                            {[
                              ['اشرح لي درساً بطريقة بسيطة', () => sendMessage('اشرح لي درساً بطريقة بسيطة', 'study')],
                              ['📝 اختبرني في درس', () => openSetup('quiz')],
                              ['لخص أهم النقاط للمراجعة', () => sendMessage('لخص أهم النقاط للمراجعة', 'study')],
                              ['🗂 أنشئ لي بطاقات مراجعة', () => openSetup('flashcards')],
                            ].map(([label, fn]) => (
                              <button
                                key={label}
                                onClick={fn}
                                className="card-hover rounded-[14px] border border-[var(--line)] bg-white p-3 text-right text-[10px]"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                              <div
                                className={`max-w-[88%] rounded-[18px] px-4 py-3 text-[12px] leading-7 sm:max-w-[76%] ${
                                  message.role === 'user'
                                    ? 'btn-grad whitespace-pre-wrap rounded-tl-[5px] !shadow-none'
                                    : message.error
                                      ? 'rounded-tr-[5px] border border-[#F6CFCF] bg-[#FFF5F5] text-[#9B3A3A]'
                                      : 'rounded-tr-[5px] border border-[var(--line)] bg-white shadow-[0_4px_14px_rgba(109,94,245,.07)]'
                                }`}
                              >
                                {message.role === 'assistant' ? <RichText text={message.text} /> : <UserContent m={message} />}

                                {message.quiz && (
                                  <button
                                    onClick={() => setStudy({ data: message.quiz, topic: message.quizTopic })}
                                    className="btn-grad mt-3 h-9 rounded-full px-5 text-[10px] font-semibold"
                                  >
                                    فتح {message.quiz.type === 'quiz' ? 'الاختبار' : 'البطاقات'}
                                  </button>
                                )}

                                {message.role === 'assistant' && !message.error && (
                                  <AssistantActions
                                    text={message.text}
                                    onSave={() => saveToNotes(message.text, 'رفيق')}
                                    onNotion={() => exportToNotion('رد من رفيق', message.text)}
                                    onToast={showToast}
                                  />
                                )}
                              </div>
                            </div>
                          ))}

                          {aiLoading && (
                            <div className="flex justify-end">
                              <div className="flex items-center gap-2 rounded-[16px] border border-[var(--line)] bg-white px-4 py-3 text-[10px] text-[var(--muted)]">
                                <span className="flex gap-1"><i className="typing-dot" /><i className="typing-dot" /><i className="typing-dot" /></span>
                                رفيق يجهز الإجابة...
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[var(--line)] bg-white/70 p-3 sm:p-4">
                      <ImagePreviews images={aiImages} onRemove={(id) => setAiImages((c) => c.filter((x) => x.id !== id))} />
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

                        <ImageTools onGallery={() => openImagePicker('ai')} onCamera={() => openImagePicker('ai', true)} disabled={aiLoading} />

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
                          disabled={(!input.trim() && !aiImages.length) || aiLoading || chances <= 0}
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
                    text="ارفع مستنداتك أو اختر كتبك وملاحظاتك كمصادر، واسأل. الإجابات تُبنى من داخل مصادرك فقط مع ذكر المصدر والصفحة."
                    right={
                      <div className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] backdrop-blur">
                        {nbSelected.length} مصدر محدد
                      </div>
                    }
                  />

                  <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
                    {/* المصادر */}
                    <div
                      className={`glass rounded-[22px] p-4 transition lg:sticky lg:top-[80px] lg:self-start ${
                        dragOver ? 'ring-2 ring-[var(--brand)]' : ''
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDropFiles}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[12px] font-bold">المصادر</div>
                        {readySources.length + notes.length > 1 && (
                          <button onClick={toggleAllSources} className="text-[9px] font-semibold text-[var(--brand)]">
                            تحديد / إلغاء الكل
                          </button>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button onClick={() => fileRef.current?.click()} className="btn-grad h-9 rounded-full text-[10px] font-semibold">
                          ＋ رفع مستند
                        </button>
                        <button
                          onClick={() => setMenu('paste')}
                          className="btn-soft h-9 rounded-full text-[10px] font-semibold"
                        >
                          ✎ لصق نص
                        </button>
                      </div>

                      <div
                        className={`mt-2 rounded-[12px] border-2 border-dashed px-3 py-2 text-center text-[9px] leading-5 transition ${
                          dragOver ? 'border-[var(--brand)] bg-[var(--soft)] text-[var(--brand)]' : 'border-[var(--line)] text-[var(--muted)]'
                        }`}
                      >
                        أو اسحب الملفات وأفلتها هنا<br />PDF • Word • TXT • MD • HTML
                      </div>

                      <div className="thin-scroll mt-3 max-h-[46vh] space-y-2 overflow-y-auto pl-1">
                        {uploadingList.map(([id, u]) => (
                          <div key={id} className="rounded-[14px] border border-[var(--line)] bg-white/70 p-3">
                            <div className="line-clamp-1 text-[11px] font-semibold">{u.name}</div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--soft)]">
                              <div className="h-full rounded-full transition-all" style={{ width: `${u.progress || 6}%`, background: 'var(--grad)' }} />
                            </div>
                            <div className="mt-1 text-[8px] text-[var(--muted)]">جاري قراءة الملف... {u.progress}%</div>
                          </div>
                        ))}

                        {library.length === 0 && notes.length === 0 && uploadingList.length === 0 && (
                          <p className="rounded-[12px] bg-[var(--soft)] p-3 text-[10px] leading-5 text-[var(--muted)]">
                            لا توجد مصادر بعد. ارفع مستنداً، أو نزّل كتاباً من قسم "كتب ودروس"، أو أضف ملاحظة.
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
                              <div className="mt-0.5 text-[8px] text-[var(--muted)]">{book.source || ''} • {formatSize(book.size)}</div>

                              {book.indexed ? (
                                <div className="mt-2 flex gap-1.5">
                                  <button
                                    onClick={() => toggleSource(book.id)}
                                    className={`h-7 flex-1 rounded-full text-[9px] font-semibold ${on ? 'btn-grad' : 'btn-soft'}`}
                                  >
                                    {on ? 'محدد ✓' : 'تحديد كمصدر'}
                                  </button>
                                  <button
                                    onClick={() => removeBook(book)}
                                    title="حذف"
                                    className="h-7 w-7 rounded-full border border-[#F6CFCF] bg-[#FFF5F5] text-[10px] text-[#B34A4A]"
                                  >
                                    ✕
                                  </button>
                                </div>
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

                      {readySources.length === 0 && library.length > 0 && (
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

                      <div ref={nbBoxRef} className="thin-scroll h-[50vh] min-h-[380px] overflow-y-auto bg-white/40 p-4">
                        {nbMessages.length === 0 ? (
                          <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
                            <div className="btn-grad float grid h-16 w-16 place-items-center rounded-[22px] text-[24px]">❖</div>
                            <h2 className="mt-5 text-[18px] font-bold">اسأل مصادرك</h2>
                            <p className="mt-2 max-w-[400px] text-[11px] leading-6 text-[var(--muted)]">
                              ارفع مستنداً أو حدّد مصدراً من القائمة ثم اكتب سؤالك، أو اضغط على ملخص / اختبار قصير.
                              إن لم تحدد شيئاً سيستخدم رفيق كل مصادرك الجاهزة.
                            </p>
                            <button onClick={() => fileRef.current?.click()} className="btn-grad mt-5 h-10 rounded-full px-6 text-[11px] font-semibold">
                              ＋ ارفع أول مستند
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {nbMessages.map((m) => (
                              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                <div
                                  className={`max-w-[92%] rounded-[18px] px-4 py-3 text-[12px] leading-7 sm:max-w-[80%] ${
                                    m.role === 'user'
                                      ? 'btn-grad whitespace-pre-wrap rounded-tl-[5px] !shadow-none'
                                      : m.error
                                        ? 'rounded-tr-[5px] border border-[#F6CFCF] bg-[#FFF5F5] text-[#9B3A3A]'
                                        : 'rounded-tr-[5px] border border-[var(--line)] bg-white shadow-[0_4px_14px_rgba(109,94,245,.07)]'
                                  }`}
                                >
                                  {m.role === 'assistant' ? <RichText text={m.text} /> : <UserContent m={m} />}

                                  {m.cites?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--line)] pt-2">
                                      {m.cites.map((c) => (
                                        <button
                                          key={c.n}
                                          onClick={() => { setCiteView(c); setMenu('cite') }}
                                          className="rounded-full bg-[var(--soft)] px-2 py-0.5 text-[8px] text-[var(--brand)] transition hover:bg-[#E1DCFF]"
                                          title="اضغط لعرض المقطع"
                                        >
                                          [{c.n}] {c.title.slice(0, 22)}{c.page ? ` • ص${c.page}` : ''}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {m.role === 'assistant' && !m.error && (
                                    <AssistantActions
                                      text={m.text}
                                      onSave={() => saveToNotes(m.text)}
                                      onNotion={() => exportToNotion('دفتر رفيق', m.text)}
                                      onToast={showToast}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}

                            {nbLoading && (
                              <div className="flex justify-end">
                                <div className="shimmer h-10 w-48 rounded-[16px]" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-[var(--line)] bg-white/70 p-3">
                        <ImagePreviews images={nbImages} onRemove={(id) => setNbImages((c) => c.filter((x) => x.id !== id))} />
                        <div className="flex items-end gap-2 rounded-[18px] border border-[var(--line)] bg-white p-2 transition focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_4px_rgba(109,94,245,.12)]">
                          <ImageTools onGallery={() => openImagePicker('nb')} onCamera={() => openImagePicker('nb', true)} disabled={nbLoading} />
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
                            placeholder="اسأل عن شي في مصادرك..."
                            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-[12px] leading-5 outline-none"
                          />
                          <button
                            onClick={() => askNotebook()}
                            disabled={(!nbInput.trim() && !nbImages.length) || nbLoading || chances <= 0}
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
                    text="الكتب من موقع الأمجاد. عند التنزيل يُحفظ الكتاب على جهازك أنت (وليس على خوادمنا) وتجده في مكتبتك. ويمكنك أيضاً رفع مستنداتك الخاصة."
                    right={
                      <div className="flex gap-1 rounded-full border border-white/30 bg-white/15 p-1 backdrop-blur">
                        {[['site', 'كتب الموقع'], ['web', 'الموقع الأصلي'], ['mine', `مكتبتي (${library.length})`]].map(([id, label]) => (
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

                  <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[18px] p-3 text-[10px] leading-5 text-[var(--muted)]">
                    <span className="min-w-[220px] flex-1">
                      📚 المصدر: موقع الأمجاد — الحقوق محفوظة لأصحابها. الكتب تُعرض من الموقع الأصلي، وعند التنزيل تُحفظ نسخة في مكتبتك على جهازك للاستخدام الشخصي.
                    </span>
                    <a href={SOURCE_PAGE} target="_blank" rel="noreferrer" className="btn-soft rounded-full px-3 py-1.5 font-semibold">
                      فتح الموقع الأصلي ↗
                    </a>
                  </div>

                  {booksView === 'web' && (
                    <div className="space-y-3">
                      <div className="glass flex flex-wrap items-center gap-2 rounded-[18px] p-3">
                        <input
                          dir="ltr"
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          placeholder="الصق رابط كتاب PDF من الموقع لحفظه في مكتبتك..."
                          className="h-10 min-w-[200px] flex-1 rounded-full bg-[var(--soft)] px-4 text-[11px] outline-none focus:bg-white focus:shadow-[0_0_0_4px_rgba(109,94,245,.12)]"
                        />
                        <button onClick={addBookByLink} disabled={!linkInput.trim()} className="btn-grad h-10 rounded-full px-5 text-[11px] font-semibold">
                          حفظ في مكتبتي
                        </button>
                      </div>

                      <div className="glass overflow-hidden rounded-[22px]">
                        <iframe src={SOURCE_PAGE} title="موقع الأمجاد" referrerPolicy="no-referrer" className="h-[70vh] w-full bg-white" />
                      </div>

                      <p className="text-[10px] leading-5 text-[var(--muted)]">
                        تصفح الموقع من الأعلى، وعندما تجد الكتاب انسخ رابطه (كليك يمين ← نسخ عنوان الرابط) والصقه في الخانة ليُحفظ في مكتبتك. إذا ظهرت الصفحة فارغة فالموقع يمنع عرضه داخل المواقع الأخرى، فافتحه من زر "فتح الموقع الأصلي".
                      </p>
                    </div>
                  )}

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

                  {booksView === 'mine' && (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => fileRef.current?.click()} className="btn-grad h-10 rounded-full px-5 text-[11px] font-semibold">
                          ＋ رفع مستند من جهازك
                        </button>
                        <button onClick={() => setMenu('paste')} className="btn-soft h-10 rounded-full px-5 text-[11px] font-semibold">
                          ✎ لصق نص
                        </button>
                      </div>

                      {filteredLibrary.length === 0 ? (
                        <EmptyState
                          icon="▤"
                          title="مكتبتك فارغة"
                          text="نزّل كتباً من تبويب كتب الموقع أو ارفع مستنداتك الخاصة وستظهر هنا. كل شيء محفوظ على جهازك ولا يحتاج إنترنت لفتحه."
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
                                    {book.source ? ` • ${book.source}` : ''}
                                    {book.indexed ? ' • جاهز للدفتر ❖' : ''}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex items-center gap-2">
                                <button onClick={() => openBook(book)} className="btn-grad h-9 flex-1 rounded-full text-[10px] font-semibold">
                                  فتح
                                </button>
                                <button
                                  onClick={() => {
                                    goTo('notebook')
                                    if (!book.indexed) indexBook(book)
                                    else setNbSelected((c) => (c.includes(book.id) ? c : [...c, book.id]))
                                  }}
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
                      )}
                    </>
                  )}
                </section>
              )}

              {/* ================= الملاحظات ================= */}
              {tab === 'notes' && (
                <section className="mx-auto max-w-[1000px] space-y-4">
                  <div className="glass rounded-[24px] p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h1 className="text-[19px] font-bold">ملاحظاتي</h1>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">محفوظة محلياً في هذا المتصفح، ويمكنك تصديرها إلى Notion أو استخدامها كمصدر في دفتر رفيق.</p>
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

                    <p className="mt-5 text-[10px] text-[var(--muted)]">
                      تركيزك اليوم: <strong className="text-[var(--ink)]">{todayMins} دقيقة</strong> • 🔥 {streak} {streak === 1 ? 'يوم' : 'أيام'} متتالية
                    </p>
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
      {!embedded && <nav className="glass fixed bottom-0 left-0 right-0 z-50 border-x-0 border-b-0 px-2 py-2 lg:hidden">
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
      </nav>}

      {/* ============ إغلاق قائمة المستخدم ============ */}
      {menu === 'user' && <div className="fixed inset-0 z-[35]" onClick={() => setMenu(null)} />}

      <AnimatePresence>
        {menu === 'settings' && (
          <Modal key="settings" title="إعدادات الحساب" onClose={() => setMenu(null)}>
            <div className="space-y-3">
              {[
                ['name', 'الاسم', 'اسمك كما تريد أن يظهر'],
                ['class', 'الصف', 'مثال: الصف التاسع'],
                ['section', 'الشعبة', 'مثال: شعبة 2'],
              ].map(([key, label, ph]) => (
                <label key={key} className="block">
                  <span className="text-[10px] font-semibold text-[var(--muted)]">{label}</span>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={ph}
                    className="mt-1 h-11 w-full rounded-[13px] border border-[var(--line)] bg-[var(--soft)] px-3 text-[12px] outline-none focus:border-[var(--brand)] focus:bg-white"
                  />
                </label>
              ))}

              <button onClick={saveProfile} className="btn-grad h-11 w-full rounded-full text-[12px] font-semibold">حفظ التغييرات</button>
            </div>

            <div className="mt-5 rounded-[16px] bg-[var(--soft)] p-4">
              <div className="text-[11px] font-bold">التخزين على جهازك</div>
              <div className="mt-1 text-[10px] text-[var(--muted)]">
                {library.length} مصدر{storageInfo ? ` • ${formatSize(storageInfo.usage)} مستخدم من ${formatSize(storageInfo.quota)}` : ''}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={wipeChatsAndNotes} className="rounded-full border border-[#F6CFCF] bg-white px-3 py-1.5 text-[10px] text-[#B34A4A]">حذف المحادثات والملاحظات</button>
                <button onClick={wipeLibrary} className="rounded-full border border-[#F6CFCF] bg-white px-3 py-1.5 text-[10px] text-[#B34A4A]">حذف كل الكتب</button>
              </div>
            </div>

            <button onClick={logout} className="mt-4 h-11 w-full rounded-full border border-[#F6CFCF] bg-[#FFF5F5] text-[12px] font-semibold text-[#C23B3B]">
              تسجيل الخروج
            </button>
          </Modal>
        )}

        {menu === 'notion' && (
          <Modal key="notion" title="Notion" onClose={() => setMenu(null)}>
            <div className="rounded-[16px] bg-[var(--soft)] p-4 text-[11px] leading-6">
              {notion.connected ? (
                <>
                  <span className="pulse-ring ml-1.5 inline-block h-2 w-2 rounded-full bg-[var(--mint)]" />
                  متصل{notion.workspace ? ` بمساحة "${notion.workspace}"` : ''}. زر "إلى Notion" سيُنشئ صفحة جديدة تلقائياً.
                </>
              ) : (
                'غير متصل. يمكنك فتح Notion والتصدير يدوياً (نسخ ولصق)، أو ربط حسابك للتصدير التلقائي.'
              )}
            </div>

            {notionError && (
              <div className="mt-3 rounded-[14px] border border-[#F6CFCF] bg-[#FFF5F5] p-3 text-[10px] leading-5 text-[#9B3A3A]">
                تعذر بدء الربط التلقائي: {notionError}
                <br />
                الربط يحتاج إعداد Notion Integration في الخادم (NOTION_CLIENT_ID و NOTION_CLIENT_SECRET) وتسجيل ملف books-notion.cjs.
              </div>
            )}

            <div className="mt-4 grid gap-2">
              <button onClick={openNotionSite} className="btn-grad h-11 rounded-full text-[12px] font-semibold">فتح موقع Notion ↗</button>
              {notion.connected ? (
                <button onClick={disconnectNotion} className="h-11 rounded-full border border-[#F6CFCF] bg-[#FFF5F5] text-[12px] text-[#C23B3B]">فصل الربط</button>
              ) : (
                <button onClick={connectNotion} className="btn-soft h-11 rounded-full text-[12px] font-semibold">ربط حسابي (تصدير تلقائي)</button>
              )}
            </div>

            <p className="mt-3 text-[9px] leading-5 text-[var(--muted)]">
              بدون ربط: زر "إلى Notion" ينسخ المحتوى ويفتح Notion، وتلصقه في صفحة جديدة.
            </p>
          </Modal>
        )}

        {menu === 'paste' && (
          <Modal key="paste" title="لصق نص كمصدر" onClose={() => setMenu(null)}>
            <div className="space-y-3">
              <input
                value={pasteForm.title}
                onChange={(e) => setPasteForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="عنوان المصدر (اختياري)"
                className="h-11 w-full rounded-[13px] border border-[var(--line)] bg-[var(--soft)] px-3 text-[12px] outline-none focus:border-[var(--brand)] focus:bg-white"
              />
              <textarea
                value={pasteForm.text}
                onChange={(e) => setPasteForm((f) => ({ ...f, text: e.target.value }))}
                rows={9}
                placeholder="الصق هنا نص الدرس أو الملخص أو أي مقال تريد أن يقرأه رفيق..."
                className="w-full resize-none rounded-[13px] border border-[var(--line)] bg-[var(--soft)] p-3 text-[12px] leading-6 outline-none focus:border-[var(--brand)] focus:bg-white"
              />
              <button
                onClick={savePastedText}
                disabled={pasteForm.text.trim().length < 30}
                className="btn-grad h-11 w-full rounded-full text-[12px] font-semibold"
              >
                إضافة كمصدر
              </button>
            </div>
          </Modal>
        )}

        {setup && (
          <Modal key="setup" title={setup === 'quiz' ? 'اختبار جديد' : 'بطاقات مراجعة'} onClose={() => !setupLoading && setSetup(null)}>
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-semibold text-[var(--muted)]">الدرس أو الموضوع</span>
                <input
                  value={setupForm.topic}
                  onChange={(e) => setSetupForm((f) => ({ ...f, topic: e.target.value }))}
                  placeholder="مثال: المصفوفات والمحددات"
                  className="mt-1 h-11 w-full rounded-[13px] border border-[var(--line)] bg-[var(--soft)] px-3 text-[12px] outline-none focus:border-[var(--brand)] focus:bg-white"
                />
              </label>

              <div>
                <div className="mb-1.5 text-[10px] font-semibold text-[var(--muted)]">
                  {setup === 'quiz' ? 'عدد الأسئلة' : 'عدد البطاقات'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 20].map((n) => (
                    <Chip key={n} active={setupForm.count === n} onClick={() => setSetupForm((f) => ({ ...f, count: n }))}>{n}</Chip>
                  ))}
                </div>
              </div>

              {setup === 'quiz' && (
                <div>
                  <div className="mb-1.5 text-[10px] font-semibold text-[var(--muted)]">الصعوبة</div>
                  <div className="flex flex-wrap gap-2">
                    {[['easier', 'أسهل'], ['same', 'متوسطة'], ['harder', 'أصعب']].map(([id, label]) => (
                      <Chip key={id} active={setupForm.difficulty === id} onClick={() => setSetupForm((f) => ({ ...f, difficulty: id }))}>{label}</Chip>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={startStudy}
                disabled={setupLoading || setupForm.topic.trim().length < 2}
                className="btn-grad h-11 w-full rounded-full text-[12px] font-semibold"
              >
                {setupLoading ? 'جاري التجهيز...' : setup === 'quiz' ? 'ابدأ الاختبار' : 'أنشئ البطاقات'}
              </button>
            </div>
          </Modal>
        )}

        {menu === 'cite' && citeView && (
          <Modal key="cite" title={`المصدر [${citeView.n}]`} onClose={() => setMenu(null)}>
            <div className="text-[11px] font-bold">{citeView.title}</div>
            {citeView.page && <div className="mt-0.5 text-[9px] text-[var(--muted)]">صفحة {citeView.page}</div>}
            <p className="mt-3 whitespace-pre-wrap rounded-[14px] bg-[var(--soft)] p-3 text-[11px] leading-7">
              {citeView.text}
              {citeView.text?.length >= 450 ? '…' : ''}
            </p>
          </Modal>
        )}
      </AnimatePresence>

      {/* ============ نافذة الاختبار / البطاقات ============
          خارج motion.div عمداً: التحويلات داخله تُفسد position: fixed */}
      {study?.data?.type === 'quiz' && (
        <QuizCard data={study.data} topic={study.topic} request={requestStudy} onClose={() => setStudy(null)} />
      )}
      {study?.data?.type === 'flashcards' && (
        <FlashcardDeck data={study.data} onClose={() => setStudy(null)} />
      )}

      {/* ============ Toast ============ */}
      {/* الإصلاح: كان الإشعار يستخدم -translate-x-1/2 مع framer-motion، فيستبدل framer التحويل ويخرج الإشعار عن الشاشة فلا تظهر الرسائل.
          الآن حاوية ثابتة تتوسط الشاشة والإشعار داخلها. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 lg:bottom-8">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="btn-grad pointer-events-auto max-w-[92vw] rounded-full px-5 py-3 text-center text-[11px] font-semibold leading-5"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
