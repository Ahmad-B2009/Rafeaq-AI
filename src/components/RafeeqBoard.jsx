import { useCallback, useEffect, useRef, useState } from 'react'
import './RafeeqBoard.css'

const COLORS = ['#20263A', '#477BFF', '#9465E8', '#18A58C', '#E45E86', '#E59B35']
const DEMO_LESSON = [
  { text: '2س + 4 = 10', spoken: 'لدينا معادلة بسيطة. هدفنا أن نعرف قيمة السين، وسنحافظ على توازن الطرفين في كل خطوة.' },
  { text: '2س = 10 − 4', spoken: 'أولًا نطرح أربعة من الطرفين، حتى يبقى التوازن محفوظًا.' },
  { text: '2س = 6', spoken: 'عشرة ناقص أربعة يساوي ستة.' },
  { text: 'س = 6 ÷ 2', spoken: 'الآن نقسم الطرفين على اثنين، لأن السين مضروبة في اثنين.' },
  { text: 'س = 3', spoken: 'إذن قيمة السين تساوي ثلاثة. ويمكننا التعويض للتأكد من الحل.' },
]
const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`

function Icon({ name }) {
  const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    pen: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m14.5 7.5 3 3"/></>,
    marker: <><path d="m5 19 3.5-.7L19 7.8 16.2 5 5 16.2 5 19Z"/><path d="m14.8 6.4 2.8 2.8"/></>,
    eraser: <><path d="m4 14 8-9a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-6 6H9l-5-5Z"/><path d="m9 19 6-6"/></>,
    undo: <><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/></>,
    redo: <><path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h2"/></>,
    text: <><path d="M4 6V4h16v2"/><path d="M12 4v16"/><path d="M8 20h8"/></>,
    line: <path d="M4 18 20 6"/>,
    square: <rect x="5" y="5" width="14" height="14" rx="1"/>,
    circle: <circle cx="12" cy="12" r="7"/>,
    speak: <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6"/><path d="M18 6a9 9 0 0 1 0 12"/></>,
    stop: <rect x="6" y="6" width="12" height="12" rx="2"/>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    fullscreen: <><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"/></>,
    clear: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 10v6m4-6v6"/></>,
    save: <><path d="M5 3h12l4 4v14H3V3h2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/></>,
  }
  return <svg {...common}>{paths[name] || paths.pen}</svg>
}


function drawItem(ctx, item, width, height) {
  // تجاهل أي عنصر رسم غير صالح
  if (!ctx || !item || typeof item !== 'object') return

  ctx.save()

  try {
    ctx.strokeStyle = item.color || '#20263A'
    ctx.fillStyle = item.color || '#20263A'
    ctx.lineWidth = item.size || 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (item.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
    }

    if (item.type === 'text') {
      if (
        typeof item.text !== 'string' ||
        !Number.isFinite(item.x) ||
        !Number.isFinite(item.y)
      ) return

      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.font = `500 ${item.fontSize || 30}px system-ui, sans-serif`
      ctx.fillText(item.text, item.x * width, item.y * height)

    } else if (item.type === 'path' && Array.isArray(item.points) && item.points.length) {
      const points = item.points.filter(
        p => p &&
          Number.isFinite(p.x) &&
          Number.isFinite(p.y)
      )

      if (!points.length) return

      ctx.beginPath()
      ctx.moveTo(points[0].x * width, points[0].y * height)

      points.slice(1).forEach(p => {
        ctx.lineTo(p.x * width, p.y * height)
      })

      if (points.length === 1) {
        ctx.lineTo(
          points[0].x * width + 0.1,
          points[0].y * height + 0.1
        )
      }

      ctx.stroke()

    } else if (item.type === 'shape') {
      if (
        !Number.isFinite(item.x) ||
        !Number.isFinite(item.y)
      ) return

      const x = item.x * width
      const y = item.y * height
      const w = (Number.isFinite(item.w) ? item.w : 0) * width
      const h = (Number.isFinite(item.h) ? item.h : 0) * height

      if (item.shape === 'line') {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + w, y + h)
        ctx.stroke()
      }

      if (item.shape === 'rect') {
        ctx.strokeRect(x, y, w, h)
      }

      if (item.shape === 'circle') {
        ctx.beginPath()
        ctx.ellipse(
          x + w / 2,
          y + h / 2,
          Math.abs(w / 2),
          Math.abs(h / 2),
          0,
          0,
          Math.PI * 2
        )
        ctx.stroke()
      }
    }
  } finally {
    ctx.restore()
  }
}


export default function RafeeqBoard({ onToast = () => {}, onExit }) {
  const canvasRef = useRef(null)
  const hostRef = useRef(null)
  const drawingRef = useRef(null)
  const speechRef = useRef(null)
  const lessonTimerRef = useRef(null)
  const [strokes, setStrokes] = useState([])
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(3)
  const [isTeaching, setIsTeaching] = useState(false)
  const [lessonStep, setLessonStep] = useState(-1)
  const [topic, setTopic] = useState('')
  const [teacher, setTeacher] = useState('سراج')
  const [showTopic, setShowTopic] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [lessonNote, setLessonNote] = useState('اختر موضوعًا أو ابدأ بالرسم على السبورة.')
  const [voiceAvailable, setVoiceAvailable] = useState(typeof window !== 'undefined' && 'speechSynthesis' in window)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return
    const rect = host.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)
    strokes.forEach(item => drawItem(ctx, item, rect.width, rect.height))
    if (drawingRef.current) drawItem(ctx, drawingRef.current, rect.width, rect.height)
  }, [strokes])

  useEffect(() => {
    redraw()
    const host = hostRef.current
    if (!host) return undefined
    const observer = new ResizeObserver(redraw)
    observer.observe(host)
    return () => observer.disconnect()
  }, [redraw, expanded])

  useEffect(() => () => {
    window.speechSynthesis?.cancel?.()
    if (lessonTimerRef.current) window.clearTimeout(lessonTimerRef.current)
  }, [])

  const stopLesson = useCallback(() => {
    if (lessonTimerRef.current) window.clearTimeout(lessonTimerRef.current)
    lessonTimerRef.current = null
    window.speechSynthesis?.cancel?.()
    setIsTeaching(false)
  }, [])

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      setVoiceAvailable(false)
      setLessonNote('الصوت غير مدعوم في هذا المتصفح. يمكنك استخدام السبورة يدويًا.')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ar-LY'
    utterance.rate = 0.92
    speechRef.current = utterance
    utterance.onstart = () => setIsTeaching(true)
    utterance.onend = () => { if (!lessonTimerRef.current) setIsTeaching(false) }
    window.speechSynthesis.speak(utterance)
  }

  function startDemo() {
    stopLesson()
    setStrokes(previous => previous.filter(item => item.source !== 'teacher'))
    setLessonStep(-1)
    setIsTeaching(true)
    setLessonNote(`يشرح ${teacher} مثالًا تجريبيًا. النموذج الذكي غير مربوط في هذه النسخة.`)
    let index = 0
    const next = () => {
      if (index >= DEMO_LESSON.length) {
        lessonTimerRef.current = null
        setIsTeaching(false)
        setLessonNote('انتهى المثال التجريبي. يمكنك متابعة الرسم أو كتابة موضوع آخر.')
        return
      }
      const step = DEMO_LESSON[index]
      const item = { id: id(), type: 'text', text: step.text, x: 0.88, y: 0.2 + index * 0.14, color: index === DEMO_LESSON.length - 1 ? '#18A58C' : color, size, fontSize: 32, source: 'teacher' }
      setStrokes(previous => [...previous, item])
      setLessonStep(index)
      setLessonNote(step.spoken)
      speak(step.spoken)
      index += 1
      lessonTimerRef.current = window.setTimeout(next, Math.max(3600, step.spoken.length * 65))
    }
    next()
  }

  function pointFromEvent(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) }
  }

  function onPointerDown(event) {
    if (isTeaching) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const p = pointFromEvent(event)
    if (tool === 'text') {
      const text = window.prompt('اكتب النص الذي تريد إضافته إلى السبورة:')
      if (text?.trim()) setStrokes(previous => [...previous, { id: id(), type: 'text', text: text.trim(), x: p.x, y: p.y, color, fontSize: Math.max(18, size * 8) }])
      setTool('pen')
      return
    }
    if (['line', 'rect', 'circle'].includes(tool)) {
      drawingRef.current = { id: id(), type: 'shape', shape: tool, x: p.x, y: p.y, w: 0, h: 0, color, size }
    } else {
      drawingRef.current = { id: id(), type: 'path', points: [p], color, size: tool === 'marker' ? size * 3 : size, tool: tool === 'eraser' ? 'eraser' : 'pen' }
    }
    redraw()
  }

  function onPointerMove(event) {
    if (!drawingRef.current) return
    const p = pointFromEvent(event)
    const current = drawingRef.current
    if (current.type === 'shape') drawingRef.current = { ...current, w: p.x - current.x, h: p.y - current.y }
    else drawingRef.current = { ...current, points: [...current.points, p] }
    redraw()
  }

  function onPointerUp() {
    if (!drawingRef.current) return
    setStrokes(previous => [...previous, drawingRef.current])
    drawingRef.current = null
    redraw()
  }

  function clearBoard() {
    if (window.confirm('هل تريد مسح كل ما على السبورة؟')) {
      stopLesson()
      setStrokes([])
      drawingRef.current = null
      setLessonStep(-1)
      setLessonNote('السبورة نظيفة وجاهزة.')
    }
  }

  function saveBoard() {
    try {
      const saved = JSON.parse(localStorage.getItem('rafeaq_whiteboard_sessions_v1') || '[]')
      const session = { id: id(), title: topic.trim() || 'سبورة رفيق', teacher, strokes, updatedAt: Date.now() }
      localStorage.setItem('rafeaq_whiteboard_sessions_v1', JSON.stringify([session, ...saved].slice(0, 12)))
      onToast('تم حفظ السبورة على هذا الجهاز ✓')
    } catch { onToast('تعذر حفظ السبورة على هذا الجهاز.') }
  }

  const tools = [
    ['pen', 'قلم'], ['marker', 'تمييز'], ['eraser', 'ممحاة'], ['text', 'نص'], ['line', 'خط'], ['rect', 'مستطيل'], ['circle', 'دائرة'],
  ]

  return (
    <section className={`rb-root ${expanded ? 'rb-expanded' : 'rb-embedded'} ${isTeaching ? 'rb-speaking' : ''}`} dir="rtl">
      <div className="rb-edge rb-edge-a" aria-hidden="true" />
      <div className="rb-edge rb-edge-b" aria-hidden="true" />
      <header className="rb-topbar">
        <div className="rb-brand">
          <div className={`rb-teacher-mark ${isTeaching ? 'is-speaking' : ''}`}><span>ر</span></div>
          <div><strong>سبورة رفيق</strong><small>{teacher} · أستاذ الذكاء الاصطناعي</small></div>
        </div>
        <div className="rb-live-state"><span className={isTeaching ? 'rb-dot live' : 'rb-dot'} />{isTeaching ? 'الأستاذ يشرح الآن' : 'السبورة جاهزة'}</div>
        <div className="rb-top-actions">
          <button className="rb-quiet-btn" onClick={saveBoard} title="حفظ السبورة"><Icon name="save" /><span>حفظ</span></button>
          <button className="rb-quiet-btn" onClick={() => setShowTopic(v => !v)} title="موضوع الدرس"><span>موضوع الدرس</span></button>
          <button className="rb-quiet-btn" onClick={() => setExpanded(v => !v)} title={expanded ? 'تصغير مساحة السبورة' : 'تكبير مساحة السبورة'}><Icon name="fullscreen" /></button>
          <button className="rb-quiet-btn rb-exit-btn" onClick={() => onExit ? onExit() : setExpanded(false)} title="العودة"><Icon name="close" /><span>عودة</span></button>
        </div>
      </header>

      {showTopic && <form className="rb-topic-panel" onSubmit={e => { e.preventDefault(); setShowTopic(false); setLessonNote(topic.trim() ? `موضوع الدرس: ${topic.trim()}. الشرح بالذكاء الاصطناعي يحتاج ربط النموذج.` : 'اكتب موضوعًا للدرس.'); }}>
        <label htmlFor="rb-topic-input">موضوع الدرس</label><input id="rb-topic-input" value={topic} onChange={e => setTopic(e.target.value)} placeholder="مثال: حل معادلة من الدرجة الأولى" /><label htmlFor="rb-teacher-select">الأستاذ</label><select id="rb-teacher-select" value={teacher} onChange={e => setTeacher(e.target.value)}><option>سراج</option><option>أثير</option><option>مدار</option></select><button type="submit">تطبيق</button>
      </form>}

      <main className="rb-workspace">
        <div className="rb-canvas-frame">
          <div className="rb-canvas-label"><span>مساحة الشرح</span><span>{isTeaching ? '● شرح صوتي نشط' : 'ارسم أو اكتب بحرية'}</span></div>
          <div ref={hostRef} className="rb-canvas-host">
            <canvas ref={canvasRef} className="rb-canvas" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} style={{ touchAction: 'none', cursor: tool === 'text' ? 'text' : 'crosshair' }} aria-label="السبورة البيضاء التفاعلية" />
            {strokes.length === 0 && <div className="rb-empty-hint" aria-hidden="true"><span>ابدأ من هنا</span><small>اكتب وارسم على المساحة البيضاء</small></div>}
          </div>
          <div className="rb-bottom-tools">
            <div className="rb-tool-group" aria-label="أدوات الرسم">{tools.map(([key, label]) => <button key={key} className={`rb-tool-btn ${tool === key ? 'active' : ''}`} onClick={() => setTool(key)} title={label}><Icon name={key === 'marker' ? 'marker' : key === 'eraser' ? 'eraser' : key === 'text' ? 'text' : key === 'line' ? 'line' : key === 'rect' ? 'square' : key === 'circle' ? 'circle' : 'pen'} /><span>{label}</span></button>)}</div>
            <div className="rb-tool-separator" />
            <div className="rb-color-row" aria-label="ألوان القلم">{COLORS.map(c => <button key={c} className={`rb-color-dot ${color === c ? 'selected' : ''}`} style={{ '--swatch': c }} onClick={() => setColor(c)} aria-label={`اختيار اللون ${c}`} />)}</div>
            <label className="rb-size-control">السُمك <input type="range" min="2" max="10" value={size} onChange={e => setSize(Number(e.target.value))} /><span>{size}</span></label>
            <div className="rb-tool-separator rb-hide-small" />
            <button className="rb-tool-btn rb-undo" onClick={() => setStrokes(s => s.slice(0, -1))} disabled={!strokes.length} title="تراجع"><Icon name="undo" /><span>تراجع</span></button>
            <button className="rb-tool-btn rb-clear" onClick={clearBoard} title="مسح السبورة"><Icon name="clear" /><span>مسح</span></button>
          </div>
        </div>
      </main>

      <footer className="rb-teaching-bar">
        <div className="rb-teacher-status"><div className={`rb-mini-avatar ${isTeaching ? 'is-speaking' : ''}`}>ر</div><div><strong>{isTeaching ? `${teacher} يشرح لك…` : `معك ${teacher}`}</strong><span>{lessonNote}</span></div></div>
        <div className="rb-lesson-actions">
          <button className="rb-ask-btn" onClick={() => { setShowTopic(true); setTimeout(() => document.getElementById('rb-topic-input')?.focus(), 50) }}>＋ <span>موضوع جديد</span></button>
          {!isTeaching ? <button className="rb-start-btn" onClick={startDemo}><Icon name="speak" /><span>جرّب شرحًا صوتيًا</span></button> : <button className="rb-stop-btn" onClick={stopLesson}><Icon name="stop" /><span>إيقاف الشرح</span></button>}
        </div>
      </footer>
      {!voiceAvailable && <div className="rb-voice-warning">الصوت غير متاح في هذا المتصفح.</div>}
      <div className="rb-footnote">الشرح الصوتي الحالي مثال تجريبي محلي؛ ربط نموذج ذكاء اصطناعي لتوليد الشرح والرسم الحقيقي خطوة مستقلة.</div>
    </section>
  )
}
