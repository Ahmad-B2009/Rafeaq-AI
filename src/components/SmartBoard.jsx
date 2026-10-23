// src/components/SmartBoard.jsx
// سبورة رفيق: سبورة بيضاء بملء الشاشة، أستاذ ذكاء اصطناعي يشرح ويرسم بالتدريج،
// وأضواء مموجة على الحواف أثناء كلامه، وشريط أدوات مستطيل أسفل السبورة.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../os/icons'
import { speak, pauseVoice, resumeVoice, voiceAvailable } from '../lib/boardVoice'

// مساحة السبورة الافتراضية: أفقية 16:9 على اللابتوب، وطولية على الهاتف حتى لا يصغر الخط
let VW = 1600
let VH = 900
function pickBoardSize() {
  const w = window.innerWidth
  const h = window.innerHeight
  if (w < 700 && h > w) {
    return { w: 900, h: Math.max(900, Math.min(1500, Math.round((900 * (h - 300)) / Math.max(300, w - 12)))) }
  }
  return { w: 1600, h: 900 }
}
const STORE = 'rafeaq_smartboard_v1'
const DAY_KEY = 'rafeaq_smartboard_day_v1'
const DAILY_LESSONS = 10

const TEACHERS = [
  { id: 'siraj', name: 'سراج', subject: 'الرياضيات', color: '#477BFF', color2: '#7DD3FC', pitch: 0.95, rate: 0.95 },
  { id: 'atheer', name: 'أثير', subject: 'الكيمياء', color: '#9465E8', color2: '#F0ABFC', pitch: 1.15, rate: 0.98 },
  { id: 'madar', name: 'مدار', subject: 'الفيزياء', color: '#13A995', color2: '#86EFAC', pitch: 1.0, rate: 0.92 },
  { id: 'rafeeq', name: 'رفيق', subject: 'مواد عامة', color: '#EA7A2F', color2: '#FDE68A', pitch: 1.05, rate: 0.95 },
]

const COLORS = ['#26304A', '#2563EB', '#DC2626', '#16A34A', '#9333EA', '#EA580C']

const TOOLS = [
  ['pen', 'قلم', 'pen'],
  ['marker', 'ماركر', 'marker'],
  ['eraser', 'ممحاة', 'eraser'],
  ['line', 'خط', 'line'],
  ['arrow', 'سهم', 'arrowTool'],
  ['rect', 'مستطيل', 'rect'],
  ['circle', 'دائرة', 'circle'],
  ['text', 'نص', 'text'],
]

const SAMPLES = ['اشرح لي حل معادلة من الدرجة الأولى', 'ما أجزاء الخلية النباتية؟', 'اشرح قانون نيوتن الثاني']

// درس تجريبي مدمج: لتجربة الأضواء والرسم والصوت بدون خادم
const DEMO = {
  title: 'حل المعادلة: 2س + 4 = 10',
  steps: [
    { say: 'سنحل معادلة من الدرجة الأولى خطوة بخطوة. هدفنا أن نعرف قيمة المجهول.', draw: [
      { t: 'text', x: 800, y: 130, s: 52, c: '#2563EB', text: 'حل معادلة من الدرجة الأولى' },
      { t: 'line', x1: 480, y1: 175, x2: 1120, y2: 175, c: '#2563EB' },
    ] },
    { say: 'المعادلة هي اثنان س زائد أربعة يساوي عشرة.', draw: [
      { t: 'text', x: 800, y: 300, s: 60, c: '#26304A', text: '2س + 4 = 10' },
    ] },
    { say: 'نطرح أربعة من الطرفين حتى تبقى الحدود التي فيها س وحدها.', draw: [
      { t: 'text', x: 800, y: 430, s: 60, c: '#26304A', text: '2س = 10 − 4' },
      { t: 'arrow', x1: 1010, y1: 330, x2: 1010, y2: 395, c: '#DC2626' },
    ] },
    { say: 'عشرة ناقص أربعة يساوي ستة.', draw: [
      { t: 'text', x: 800, y: 560, s: 60, c: '#26304A', text: '2س = 6' },
    ] },
    { say: 'نقسم الطرفين على اثنين، فنحصل على قيمة س.', draw: [
      { t: 'text', x: 800, y: 690, s: 64, c: '#16A34A', text: 'س = 3' },
      { t: 'rect', x: 650, y: 630, w: 300, h: 110, c: '#16A34A' },
    ] },
    { say: 'للتأكد نعوّض: اثنان في ثلاثة زائد أربعة يساوي عشرة. الحل صحيح!', draw: [
      { t: 'text', x: 800, y: 810, s: 40, c: '#9333EA', text: '2 × 3 + 4 = 10 ✓' },
    ] },
  ],
}

/* ---------------------------- الصور على السبورة ---------------------------- */
const IMG_CACHE = new Map()
let onImgLoad = null
function getImg(src) {
  let im = IMG_CACHE.get(src)
  if (!im) {
    im = new Image()
    im.onload = () => onImgLoad?.()
    im.src = src
    IMG_CACHE.set(src, im)
  }
  return im
}

// يصغّر الصورة المختارة (حد أقصى 1000px) ويحوّلها JPEG لتخفيف الحجم قبل إرسالها وحفظها
function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error('اختر ملف صورة صالحاً.'))
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const k = Math.min(1, 1000 / Math.max(im.width, im.height))
      const w = Math.max(1, Math.round(im.width * k))
      const h = Math.max(1, Math.round(im.height * k))
      const cv = document.createElement('canvas')
      cv.width = w
      cv.height = h
      const cx = cv.getContext('2d')
      cx.fillStyle = '#fff'
      cx.fillRect(0, 0, w, h)
      cx.drawImage(im, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve({ src: cv.toDataURL('image/jpeg', 0.78), w, h })
    }
    im.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('تعذرت قراءة الصورة.'))
    }
    im.src = url
  })
}

/* ---------------------------- الرسم ---------------------------- */
const hasArabic = (t) => /[\u0600-\u06FF]/.test(t)

function partialPath(ctx, pts, p) {
  const lens = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    lens.push(l)
    total += l
  }
  let left = total * p
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) {
    const l = lens[i - 1]
    if (left >= l) {
      ctx.lineTo(pts[i][0], pts[i][1])
      left -= l
    } else {
      const k = l ? left / l : 0
      ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k)
      break
    }
  }
  ctx.stroke()
}

function drawObj(ctx, o, p = 1) {
  ctx.save()
  ctx.strokeStyle = o.c
  ctx.fillStyle = o.c
  ctx.lineWidth = o.t === 'free' ? o.w || 5 : o.lw || 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = o.a ?? 1
  switch (o.t) {
    case 'free': {
      const pts = o.pts
      if (!pts.length) break
      if (pts.length === 1) {
        ctx.beginPath()
        ctx.arc(pts[0][0], pts[0][1], (o.w || 5) / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
      ctx.stroke()
      break
    }
    case 'line':
      partialPath(ctx, [[o.x1, o.y1], [o.x2, o.y2]], p)
      break
    case 'arrow': {
      partialPath(ctx, [[o.x1, o.y1], [o.x2, o.y2]], Math.min(1, p / 0.85))
      if (p > 0.85) {
        const k = (p - 0.85) / 0.15
        const a = Math.atan2(o.y2 - o.y1, o.x2 - o.x1)
        const h = 26 * k
        ctx.beginPath()
        ctx.moveTo(o.x2 - h * Math.cos(a - 0.45), o.y2 - h * Math.sin(a - 0.45))
        ctx.lineTo(o.x2, o.y2)
        ctx.lineTo(o.x2 - h * Math.cos(a + 0.45), o.y2 - h * Math.sin(a + 0.45))
        ctx.stroke()
      }
      break
    }
    case 'rect':
      partialPath(ctx, [[o.x, o.y], [o.x + o.w, o.y], [o.x + o.w, o.y + o.h], [o.x, o.y + o.h], [o.x, o.y]], p)
      break
    case 'circle':
      ctx.beginPath()
      ctx.arc(o.x, o.y, o.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p)
      ctx.stroke()
      break
    case 'poly':
      partialPath(ctx, o.pts, p)
      break
    case 'img': {
      const im = getImg(o.src)
      if (im.complete && im.naturalWidth) {
        ctx.globalAlpha = Math.min(1, p * 2)
        ctx.drawImage(im, o.x, o.y, o.w, o.h)
        ctx.globalAlpha = 1
        ctx.strokeStyle = '#d8d3f2'
        ctx.lineWidth = 3
        ctx.strokeRect(o.x, o.y, o.w, o.h)
      }
      break
    }
    case 'text': {
      const text = o.text.slice(0, Math.max(1, Math.ceil(o.text.length * p)))
      ctx.font = `700 ${o.s || 40}px Tajawal, "Segoe UI", system-ui, sans-serif`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.direction = hasArabic(o.text) ? 'rtl' : 'ltr'
      ctx.fillText(text, o.x, o.y)
      break
    }
    default:
  }
  ctx.restore()
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ---------------------------- الحصة اليومية للسبورة ---------------------------- */
function lessonsLeft() {
  try {
    const d = JSON.parse(localStorage.getItem(DAY_KEY) || 'null')
    const today = new Date().toISOString().slice(0, 10)
    return d?.day === today ? Math.max(0, DAILY_LESSONS - d.n) : DAILY_LESSONS
  } catch {
    return DAILY_LESSONS
  }
}
function useLesson() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const d = JSON.parse(localStorage.getItem(DAY_KEY) || 'null')
    localStorage.setItem(DAY_KEY, JSON.stringify({ day: today, n: d?.day === today ? d.n + 1 : 1 }))
  } catch { /* ignore */ }
}

/* ---------------------------- المكوّن ---------------------------- */
export default function SmartBoard({ fullscreen = false, onClose = null }) {
  useState(() => { const d = pickBoardSize(); VW = d.w; VH = d.h; return d })
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const layout = useRef({ w: 800, h: 450, k: 0.5, ox: 0, oy: 0, dpr: 1 })
  const objectsRef = useRef([])
  const redoRef = useRef([])
  const animRef = useRef(null)
  const liveRef = useRef(null)
  const runId = useRef(0)
  const pausedRef = useRef(false)
  const speechRef = useRef(null)
  const levelTarget = useRef(0.35)
  const rafRef = useRef(0)
  const recRef = useRef(null)

  const [teacherId, setTeacherId] = useState(() => localStorage.getItem('rafeaq_smartboard_teacher') || 'siraj')
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(5)
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | teaching | paused | done
  const [lesson, setLesson] = useState(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [caption, setCaption] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [error, setError] = useState('')
  const [hist, setHist] = useState({ u: 0, r: 0 })
  const [textBox, setTextBox] = useState(null)
  const [isFull, setIsFull] = useState(false)
  const [listening, setListening] = useState(false)

  const teacher = useMemo(() => TEACHERS.find((t) => t.id === teacherId) || TEACHERS[0], [teacherId])
  const teacherRef = useRef(teacher)
  teacherRef.current = teacher
  const voiceRef = useRef(voiceOn)
  voiceRef.current = voiceOn
  const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

  /* ---------- رسم ---------- */
  const redraw = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const { w, h, k, ox, oy, dpr } = layout.current
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy)
    objectsRef.current.forEach((o) => drawObj(ctx, o))
    if (animRef.current) drawObj(ctx, animRef.current.item, animRef.current.p)
    if (liveRef.current) drawObj(ctx, liveRef.current)
    void w
    void h
  }, [])

  const schedule = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      redraw()
    })
  }, [redraw])

  const sync = useCallback(() => {
    setHist({ u: objectsRef.current.length, r: redoRef.current.length })
    try {
      const json = JSON.stringify({ objects: objectsRef.current, w: VW, h: VH })
      if (json.length < 1_500_000) localStorage.setItem(STORE, json)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null')
      if (Array.isArray(saved?.objects) && (saved.w || 1600) === VW && (saved.h || 900) === VH) objectsRef.current = saved.objects
    } catch { /* ignore */ }
    setHist({ u: objectsRef.current.length, r: 0 })
    const stage = stageRef.current
    const c = canvasRef.current
    const fit = () => {
      const r = stage.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const k = Math.min(r.width / VW, r.height / VH)
      layout.current = { w: r.width, h: r.height, k, ox: (r.width - VW * k) / 2, oy: (r.height - VH * k) / 2, dpr }
      c.width = Math.round(r.width * dpr)
      c.height = Math.round(r.height * dpr)
      c.style.width = `${r.width}px`
      c.style.height = `${r.height}px`
      redraw()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(stage)
    const onFs = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      ro.disconnect()
      document.removeEventListener('fullscreenchange', onFs)
      runId.current += 1
      speechRef.current?.cancel()
      recRef.current?.stop?.()
      cancelAnimationFrame(rafRef.current)
    }
  }, [redraw])

  useEffect(() => {
    onImgLoad = schedule
    return () => { onImgLoad = null }
  }, [schedule])

  /* ---------- أضواء الحواف: تتحرك مع الكلام ---------- */
  const pulse = useCallback((v) => { levelTarget.current = Math.max(levelTarget.current, v) }, [])
  useEffect(() => {
    const el = stageRef.current
    if (!el) return undefined
    if (!speaking) {
      el.style.setProperty('--lvl', '0.2')
      return undefined
    }
    let lvl = 0.3
    let raf = 0
    const loop = () => {
      levelTarget.current = 0.35 + (levelTarget.current - 0.35) * 0.92 + (Math.random() - 0.5) * 0.07
      lvl += (levelTarget.current - lvl) * 0.22
      el.style.setProperty('--lvl', Math.min(1, Math.max(0.15, lvl)).toFixed(3))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [speaking])

  /* ---------- محرك الشرح ---------- */
  const pSleep = async (ms, id) => {
    let el = 0
    while (el < ms) {
      await sleep(100)
      if (runId.current !== id) return
      if (!pausedRef.current) el += 100
    }
  }

  const animateItem = async (item, ms, id) => {
    let el = 0
    let last = performance.now()
    animRef.current = { item, p: 0 }
    while (el < ms) {
      await new Promise(requestAnimationFrame)
      if (runId.current !== id) { animRef.current = null; return false }
      const now = performance.now()
      if (!pausedRef.current) el += now - last
      last = now
      animRef.current = { item, p: Math.min(1, el / ms) }
      redraw()
    }
    animRef.current = null
    objectsRef.current.push(item)
    redoRef.current = []
    redraw()
    sync()
    return true
  }

  const play = async (data, from = 0) => {
    const id = ++runId.current
    pausedRef.current = false
    setStatus('teaching')
    setError('')
    for (let i = from; i < data.steps.length; i++) {
      if (runId.current !== id) return
      const st = data.steps[i]
      setStepIdx(i)
      setCaption(st.say)
      const est = Math.min(14000, Math.max(1800, st.say.length * 62))
      setSpeaking(true)
      let sp = null
      if (voiceRef.current && voiceAvailable()) {
        sp = speak(st.say, { teacher: teacherRef.current, onLevel: pulse })
        speechRef.current = sp
      }
      const per = Math.min(2400, Math.max(700, (est / Math.max(1, st.draw.length)) * 0.8))
      const drawing = (async () => {
        for (const it of st.draw) {
          if (!(await animateItem({ ...it, lw: 5 }, per, id))) return
        }
      })()
      await Promise.all([drawing, sp ? sp.done : pSleep(est * 0.8, id), pSleep(Math.min(est * 0.5, 2500), id)])
      if (runId.current !== id) return
      setSpeaking(false)
      await pSleep(350, id)
    }
    if (runId.current === id) {
      setStatus('done')
      setCaption('')
    }
  }

  const stop = useCallback(() => {
    runId.current += 1
    pausedRef.current = false
    speechRef.current?.cancel()
    animRef.current = null
    setSpeaking(false)
    setCaption('')
    setStatus((s) => (s === 'loading' ? s : 'idle'))
    schedule()
  }, [schedule])

  const togglePause = () => {
    if (status === 'teaching') {
      pausedRef.current = true
      pauseVoice()
      setStatus('paused')
    } else if (status === 'paused') {
      pausedRef.current = false
      resumeVoice()
      setStatus('teaching')
    }
  }

  const clearBoard = useCallback(() => {
    stop()
    objectsRef.current = []
    redoRef.current = []
    setLesson(null)
    setStepIdx(0)
    setStatus('idle')
    redraw()
    sync()
  }, [stop, redraw, sync])

  // الدروس المكتوبة بإحداثيات 1600×900 (الدرس التجريبي) تُحوَّل إلى مساحة الهاتف الطولية
  const fitLesson = (data) => {
    if (VW === 1600) return data
    const k = VW / 1600
    const mx = (v) => Math.round(v * k)
    const map = (o) => {
      switch (o.t) {
        case 'text': return { ...o, x: mx(o.x), y: o.y + 90 }
        case 'line': case 'arrow': return { ...o, x1: mx(o.x1), x2: mx(o.x2), y1: o.y1 + 90, y2: o.y2 + 90 }
        case 'rect': return { ...o, x: mx(o.x), w: mx(o.w), y: o.y + 90 }
        case 'circle': return { ...o, x: mx(o.x), y: o.y + 90, r: Math.round(o.r * k) }
        case 'poly': return { ...o, pts: o.pts.map(([x, y]) => [mx(x), y + 90]) }
        default: return o
      }
    }
    return { ...data, steps: data.steps.map((st) => ({ ...st, draw: (st.draw || []).map(map) })) }
  }

  const startLesson = (rawData, keep = []) => {
    stop()
    const data = rawData === DEMO ? fitLesson(rawData) : rawData
    objectsRef.current = [...keep]
    redoRef.current = []
    sync()
    redraw()
    setLesson(data)
    play(data, 0)
  }

  const ask = async (text, opts = {}) => {
    const topic = (text ?? question).trim()
    if (topic.length < 2) {
      setError('اكتب سؤالك أو اسم الدرس أولاً.')
      return
    }
    if (lessonsLeft() <= 0) {
      setError('انتهت دروس السبورة لهذا اليوم، تتجدد غداً.')
      return
    }
    stop()
    setError('')
    setStatus('loading')
    // آخر صورة موضوعة على السبورة تُرسل مع السؤال ليشرحها الأستاذ
    const img = opts.img || [...objectsRef.current].reverse().find((o) => o.t === 'img')
    try {
      const token = localStorage.getItem('rafeaq_token')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          message: topic,
          topic,
          mode: 'board',
          board: { w: VW, h: VH },
          role: 'student',
          ...(img ? { images: [img.src] } : {}),
          teacher: { name: teacherRef.current.name, subject: teacherRef.current.subject },
          student: {
            name: localStorage.getItem('rafeaq_name') || '',
            class: localStorage.getItem('rafeaq_student_class') || '',
            section: localStorage.getItem('rafeaq_student_section') || '',
          },
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) throw new Error(data?.error || `HTTP ${res.status}`)
      if (data.type !== 'board' || !data.steps?.length) throw new Error(data.reply || 'تعذر تجهيز الشرح، حاول مرة أخرى.')
      useLesson()
      setQuestion('')
      startLesson(data, img ? [img] : [])
    } catch (e) {
      setStatus('idle')
      setError(
        /HTTP 404|Failed to fetch|NetworkError/i.test(e.message)
          ? 'تعذر الوصول إلى خادم رفيق. على جهازك شغّل الموقع عبر Vercel، أو جرّب الدرس التجريبي.'
          : e.message,
      )
    }
  }

  /* ---------- الرسم بالقلم ---------- */
  const toVirtual = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    const { k, ox, oy } = layout.current
    return [(e.clientX - r.left - ox) / k, (e.clientY - r.top - oy) / k]
  }

  const commit = (obj) => {
    objectsRef.current.push(obj)
    redoRef.current = []
    sync()
  }

  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    const [x, y] = toVirtual(e)
    if (tool === 'text') {
      const r = canvasRef.current.getBoundingClientRect()
      setTextBox({ x, y, sx: e.clientX - r.left, sy: e.clientY - r.top, value: '' })
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    const w = tool === 'eraser' ? size * 3 + 10 : tool === 'marker' ? size * 2.4 + 8 : size
    if (tool === 'pen' || tool === 'marker' || tool === 'eraser') {
      liveRef.current = { t: 'free', pts: [[x, y]], c: tool === 'eraser' ? '#FFFFFF' : color, w, a: tool === 'marker' ? 0.35 : 1 }
    } else {
      liveRef.current = { t: tool, x1: x, y1: y, x2: x, y2: y, x, y, w: 0, h: 0, r: 0, c: color, lw: size, _s: [x, y] }
    }
    schedule()
  }

  const onMove = (e) => {
    const o = liveRef.current
    if (!o) return
    const [x, y] = toVirtual(e)
    if (o.t === 'free') o.pts.push([x, y])
    else {
      const [sx, sy] = o._s
      if (o.t === 'line' || o.t === 'arrow') { o.x2 = x; o.y2 = y }
      if (o.t === 'rect') { o.x = Math.min(sx, x); o.y = Math.min(sy, y); o.w = Math.abs(x - sx); o.h = Math.abs(y - sy) }
      if (o.t === 'circle') { o.x = sx; o.y = sy; o.r = Math.hypot(x - sx, y - sy) }
    }
    schedule()
  }

  const onUp = () => {
    const o = liveRef.current
    if (!o) return
    liveRef.current = null
    if (o.t !== 'free') {
      // في المستطيل w/h أبعاد، أما سُمك الخط فيُخزَّن في lw
      const { _s, ...rest } = o
      commit(rest)
    } else commit(o)
    redraw()
  }

  const submitText = () => {
    if (textBox?.value.trim()) {
      commit({ t: 'text', x: textBox.x, y: textBox.y, s: 22 + size * 2.5, c: color, text: textBox.value.trim() })
      redraw()
    }
    setTextBox(null)
  }

  const undo = () => {
    const o = objectsRef.current.pop()
    if (o) redoRef.current.push(o)
    redraw()
    sync()
  }
  const redo = () => {
    const o = redoRef.current.pop()
    if (o) objectsRef.current.push(o)
    redraw()
    sync()
  }

  useEffect(() => {
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else rootRef.current?.requestFullscreen?.().catch(() => {})
  }

  const fileRef = useRef(null)
  const pickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const { src, w, h } = await readImageFile(file)
      // الصورة في الجانب الأيسر من السبورة، والأستاذ يكتب في الجانب الأيمن
      const box = VW < VH ? { x: 40, y: 110, w: VW - 80, h: Math.round(VH * 0.38) } : { x: 40, y: 110, w: 640, h: 680 }
      const k = Math.min(box.w / w, box.h / h)
      const img = { t: 'img', src, w: Math.round(w * k), h: Math.round(h * k), x: box.x + Math.round((box.w - w * k) / 2), y: box.y + Math.round((box.h - h * k) / 2) }
      stop()
      objectsRef.current = objectsRef.current.filter((o) => o.t !== 'img')
      objectsRef.current.push(img)
      redoRef.current = []
      redraw()
      sync()
      ask(question.trim() || 'اشرح لي ما في هذه الصورة بالتفصيل وحلّ السؤال إن كان فيها سؤال', { img })
    } catch (err) {
      setError(err.message)
    }
  }

  const listen = () => {
    if (!SR) return
    if (listening) { recRef.current?.stop(); return }
    const r = new SR()
    r.lang = 'ar'
    r.interimResults = false
    r.onresult = (ev) => setQuestion(ev.results[0][0].transcript)
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    recRef.current = r
    setListening(true)
    r.start()
  }

  const busy = status === 'loading'
  const teaching = status === 'teaching' || status === 'paused'
  const empty = hist.u === 0 && !teaching && !busy

  return (
    <div ref={rootRef} dir="rtl" className={`sb-root ${fullscreen ? 'sb-fixed' : ''}`}>
      <style>{CSS}</style>

      <div ref={stageRef} className={`sb-stage ${speaking ? 'speaking' : ''}`} style={{ '--c1': teacher.color, '--c2': teacher.color2 }}>
        <canvas
          ref={canvasRef}
          className={`sb-canvas ${tool === 'text' ? 'is-text' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />

        <div className="sb-glow" aria-hidden="true">
          <i className="sb-edge top" />
          <i className="sb-edge bottom" />
          <i className="sb-edge left" />
          <i className="sb-edge right" />
        </div>

        <div className="sb-teacher">
          <span className="sb-avatar" style={{ background: teacher.color }}>{teacher.name.charAt(0)}</span>
          <div>
            <strong>الأستاذ {teacher.name}</strong>
            <small>{busy ? 'يجهّز الشرح...' : speaking ? 'يتكلم الآن' : teaching ? 'يشرح' : teacher.subject}</small>
          </div>
        </div>

        {lesson && <div className="sb-title">{lesson.title}{teaching || status === 'done' ? ` • ${Math.min(stepIdx + 1, lesson.steps.length)}/${lesson.steps.length}` : ''}</div>}

        {(fullscreen && onClose) && <button className="sb-x" onClick={onClose} aria-label="إغلاق السبورة"><Icon name="close" size={18} /></button>}

        {empty && (
          <div className="sb-empty">
            <h2>سبورة رفيق</h2>
            <p>اكتب سؤالك في الشريط بالأسفل وسيشرحه الأستاذ بصوته ويرسم لك على السبورة.</p>
            <div className="sb-samples">
              {SAMPLES.map((s) => <button key={s} onClick={() => ask(s)}>{s}</button>)}
              <button className="demo" onClick={() => startLesson(DEMO)}>جرّب درساً تجريبياً</button>
            </div>
          </div>
        )}

        {busy && <div className="sb-toast">الأستاذ {teacher.name} يجهّز الشرح على السبورة...</div>}
        {error && <div className="sb-toast err" role="alert">{error}<button onClick={() => setError('')} aria-label="إخفاء">✕</button></div>}
        {caption && <div className="sb-caption">{caption}</div>}

        {textBox && (
          <input
            autoFocus
            className="sb-textin"
            style={{ left: textBox.sx, top: textBox.sy, color }}
            value={textBox.value}
            placeholder="اكتب ثم Enter"
            onChange={(e) => setTextBox({ ...textBox, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitText()
              if (e.key === 'Escape') setTextBox(null)
            }}
            onBlur={submitText}
          />
        )}
      </div>

      {/* ===== شريط الأدوات أسفل السبورة ===== */}
      <div className="sb-bar">
        <div className="sb-ask">
          <select value={teacherId} onChange={(e) => { setTeacherId(e.target.value); localStorage.setItem('rafeaq_smartboard_teacher', e.target.value) }} aria-label="اختيار الأستاذ">
            {TEACHERS.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}
          </select>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !busy && ask()}
            placeholder="اسأل الأستاذ: اشرح لي..."
            aria-label="سؤالك للأستاذ"
          />
          {SR && (
            <button className={`sb-b ${listening ? 'on' : ''}`} onClick={listen} aria-label="إملاء صوتي" title="إملاء صوتي"><Icon name="mic" size={18} /></button>
          )}
          <button className="sb-go" onClick={() => ask()} disabled={busy}>{busy ? '...' : 'اشرح'}<Icon name="send" size={16} /></button>
        </div>

        <span className="sb-sep" />

        <div className="sb-group" role="toolbar" aria-label="أدوات الرسم">
          {TOOLS.map(([id, label, icon]) => (
            <button key={id} className={`sb-b ${tool === id ? 'on' : ''}`} onClick={() => setTool(id)} aria-pressed={tool === id} title={label} aria-label={label}>
              <Icon name={icon} size={19} />
            </button>
          ))}
        </div>

        <span className="sb-sep" />

        <div className="sb-group" aria-label="الألوان">
          {COLORS.map((c) => (
            <button key={c} className={`sb-sw ${color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen') }} aria-label={`لون ${c}`} />
          ))}
          <input type="range" min="2" max="24" value={size} onChange={(e) => setSize(Number(e.target.value))} className="sb-range" aria-label="سمك القلم" />
        </div>

        <span className="sb-sep" />

        <div className="sb-group">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
          <button className="sb-b" onClick={() => fileRef.current?.click()} disabled={busy} title="إضافة صورة وشرحها" aria-label="إضافة صورة وشرحها"><Icon name="image" size={19} /></button>
          <button className="sb-b" onClick={undo} disabled={!hist.u} title="تراجع" aria-label="تراجع"><Icon name="undo" size={18} /></button>
          <button className="sb-b" onClick={redo} disabled={!hist.r} title="إعادة" aria-label="إعادة"><Icon name="redo" size={18} /></button>
          <button className="sb-b" onClick={clearBoard} disabled={!hist.u && !lesson} title="مسح السبورة" aria-label="مسح السبورة"><Icon name="trash" size={18} /></button>
        </div>

        <span className="sb-sep" />

        <div className="sb-group">
          {teaching && (
            <>
              <button className="sb-b" onClick={togglePause} title={status === 'paused' ? 'متابعة' : 'إيقاف مؤقت'} aria-label="إيقاف مؤقت"><Icon name={status === 'paused' ? 'play' : 'pause'} size={18} /></button>
              <button className="sb-b" onClick={stop} title="إيقاف الشرح" aria-label="إيقاف الشرح"><Icon name="stop" size={17} /></button>
            </>
          )}
          {lesson && !teaching && !busy && (
            <button className="sb-b" onClick={() => startLesson(lesson)} title="إعادة الشرح" aria-label="إعادة الشرح"><Icon name="replay" size={18} /></button>
          )}
          <button className={`sb-b ${voiceOn ? 'on' : ''}`} onClick={() => { setVoiceOn((v) => !v); speechRef.current?.cancel() }} title={voiceOn ? 'كتم الصوت' : 'تشغيل الصوت'} aria-label="الصوت"><Icon name={voiceOn ? 'volume' : 'volumeOff'} size={19} /></button>
          <button className="sb-b" onClick={toggleFull} title="ملء الشاشة" aria-label="ملء الشاشة"><Icon name={isFull ? 'shrink' : 'expand'} size={18} /></button>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- التنسيق ---------------------------- */
const CSS = `
.sb-root { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; gap: 10px; background: #f1eefc; box-sizing: border-box; font-family: Tajawal, 'IBM Plex Sans Arabic', system-ui, sans-serif; color: #26304a; }
.sb-root *, .sb-root *::before, .sb-root *::after { box-sizing: border-box; font-family: inherit; }
.sb-fixed { position: fixed; inset: 0; z-index: 60; }
.sb-stage { --lvl: .2; position: relative; flex: 1; min-height: 0; border-radius: 22px; background: #fff; overflow: hidden; box-shadow: 0 10px 34px rgba(70,60,170,.16), inset 0 0 0 1px #e6e1fa; }
.sb-canvas { position: absolute; inset: 0; display: block; touch-action: none; cursor: crosshair; }
.sb-canvas.is-text { cursor: text; }

.sb-glow { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .6s ease; border-radius: inherit; overflow: hidden; }
.sb-stage.speaking .sb-glow { opacity: 1; }
.sb-stage::after { content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0; transition: opacity .6s; box-shadow: inset 0 0 calc(24px + var(--lvl) * 60px) color-mix(in srgb, var(--c1) 38%, transparent); }
.sb-stage.speaking::after { opacity: 1; }
.sb-edge { position: absolute; display: block; filter: blur(8px); }
.sb-edge.top, .sb-edge.bottom { left: -40px; right: -40px; height: calc(14px + var(--lvl) * 40px);
  background: radial-gradient(ellipse 100px 100% at 50% 0, var(--c1), transparent 72%) 0 0 / 280px 100% repeat-x, radial-gradient(ellipse 70px 100% at 50% 0, var(--c2), transparent 72%) 0 0 / 190px 100% repeat-x;
  animation: sb-slide 3.4s linear infinite; }
.sb-edge.top { top: -10px; }
.sb-edge.bottom { bottom: -10px; transform: scaleY(-1); animation-direction: reverse; }
.sb-edge.left, .sb-edge.right { top: -40px; bottom: -40px; width: calc(14px + var(--lvl) * 40px);
  background: radial-gradient(ellipse 100% 100px at 0 50%, var(--c1), transparent 72%) 0 0 / 100% 280px repeat-y, radial-gradient(ellipse 100% 70px at 0 50%, var(--c2), transparent 72%) 0 0 / 100% 190px repeat-y;
  animation: sb-slide-v 3.8s linear infinite; }
.sb-edge.left { left: -10px; }
.sb-edge.right { right: -10px; transform: scaleX(-1); animation-direction: reverse; }
@keyframes sb-slide { from { background-position: 0 0, 0 0; } to { background-position: 280px 0, -190px 0; } }
@keyframes sb-slide-v { from { background-position: 0 0, 0 0; } to { background-position: 0 280px, 0 -190px; } }

.sb-teacher { position: absolute; top: 14px; right: 16px; display: flex; align-items: center; gap: 10px; padding: 6px 14px 6px 8px; border-radius: 999px; background: rgba(255,255,255,.92); box-shadow: 0 4px 16px rgba(70,60,170,.16); pointer-events: none; }
.sb-teacher strong { display: block; font-size: 13px; }
.sb-teacher small { display: block; font-size: 11px; color: #7a76a8; }
.sb-avatar { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 16px; }
.sb-title { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); max-width: 46%; padding: 6px 16px; border-radius: 999px; background: rgba(255,255,255,.92); box-shadow: 0 4px 16px rgba(70,60,170,.14); font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
.sb-x { position: absolute; top: 14px; left: 16px; width: 38px; height: 38px; border: 0; border-radius: 50%; background: rgba(255,255,255,.95); color: #26304a; box-shadow: 0 4px 16px rgba(70,60,170,.2); display: grid; place-items: center; cursor: pointer; }
.sb-caption { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); width: min(86%, 900px); padding: 12px 20px; border-radius: 16px; background: rgba(38,48,74,.88); color: #fff; font-size: 16px; line-height: 1.7; text-align: center; pointer-events: none; }
.sb-toast { position: absolute; left: 50%; top: 70px; transform: translateX(-50%); max-width: 88%; padding: 10px 18px; border-radius: 14px; background: #ece8ff; color: #4b3fc4; font-size: 14px; box-shadow: 0 6px 20px rgba(70,60,170,.2); display: flex; gap: 12px; align-items: center; }
.sb-toast.err { background: #fff0ef; color: #b3261e; }
.sb-toast button { border: 0; background: transparent; color: inherit; cursor: pointer; font-size: 14px; }
.sb-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; pointer-events: none; color: #5b5890; }
.sb-empty h2 { margin: 0 0 8px; font-size: clamp(26px, 4vw, 40px); color: #3f3a8f; }
.sb-empty p { margin: 0 0 18px; max-width: 460px; font-size: 15px; line-height: 1.8; }
.sb-samples { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 720px; pointer-events: auto; }
.sb-samples button { padding: 9px 16px; border-radius: 999px; border: 1px solid #ddd7f7; background: #f7f5ff; color: #4b3fc4; font-size: 13px; cursor: pointer; }
.sb-samples button:hover { background: #ece8ff; }
.sb-samples button.demo { background: #4b3fc4; color: #fff; border-color: #4b3fc4; }
.sb-textin { position: absolute; transform: translate(-50%, -50%); min-width: 160px; padding: 6px 10px; border: 2px dashed #9b8cff; border-radius: 10px; background: rgba(255,255,255,.96); font-size: 20px; font-weight: 700; outline: 0; }

.sb-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px 12px; padding: 10px 14px; border-radius: 20px; background: #fff; border: 1px solid #e3defa; box-shadow: 0 8px 26px rgba(70,60,170,.12); }
.sb-ask { flex: 1 1 380px; min-width: 0; display: flex; align-items: center; gap: 8px; }
.sb-ask select { height: 40px; padding: 0 10px; border: 1px solid #ddd7f7; border-radius: 12px; background: #f7f5ff; color: #3f3a8f; font-size: 13px; max-width: 150px; }
.sb-ask input { flex: 1; min-width: 0; height: 40px; padding: 0 14px; border: 1px solid #ddd7f7; border-radius: 12px; background: #fff; font-size: 14px; outline: 0; }
.sb-ask input:focus, .sb-ask select:focus { border-color: #6d5ef5; box-shadow: 0 0 0 3px rgba(109,94,245,.18); }
.sb-go { height: 40px; padding: 0 16px; display: inline-flex; align-items: center; gap: 8px; border: 0; border-radius: 12px; background: linear-gradient(135deg, #7c6cff, #5b47e8); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; }
.sb-go:disabled { opacity: .6; cursor: wait; }
.sb-sep { width: 1px; height: 28px; background: #e3defa; }
.sb-group { display: flex; align-items: center; gap: 6px; }
.sb-b { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 12px; background: transparent; color: #3f3a8f; cursor: pointer; transition: background .12s; }
.sb-b:hover:not(:disabled) { background: #f1edff; }
.sb-b.on { background: #e7e2ff; border-color: #b9aeff; color: #4b3fc4; }
.sb-b:disabled { opacity: .35; cursor: not-allowed; }
.sb-sw { width: 24px; height: 24px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 0 1px #d8d3f2; cursor: pointer; padding: 0; }
.sb-sw.on { box-shadow: 0 0 0 2px #4b3fc4; }
.sb-range { width: 84px; accent-color: #6d5ef5; }
@media (max-width: 767px) {
  .sb-root { padding: 6px; gap: 6px; }
  .sb-sep { display: none; }
  .sb-bar { padding: 8px; justify-content: flex-start; overflow-x: auto; }
  .sb-ask { flex-basis: 100%; }
  .sb-title { display: none; }
  .sb-caption { font-size: 14px; padding: 10px 14px; bottom: 12px; }
  .sb-group { flex: none; }
}
@media (prefers-reduced-motion: reduce) { .sb-edge { animation: none; } }
`
