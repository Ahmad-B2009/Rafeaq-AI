
import { useCallback, useEffect, useRef, useState } from 'react'

const BOARD_STORAGE = 'rafeaq_whiteboard_sessions_v1'
const TEACHER_STORAGE = 'rafeaq_whiteboard_teachers_v1'

const DEFAULT_TEACHERS = [
  {
    id: 'siraj',
    name: 'سراج',
    subject: 'الرياضيات',
    color: '#477BFF',
    glow: 'rgba(71,123,255,.20)',
    voice: 'هادئ وواضح',
    character: 'blue',
  },
  {
    id: 'atheer',
    name: 'أثير',
    subject: 'الكيمياء',
    color: '#9465E8',
    glow: 'rgba(148,101,232,.20)',
    voice: 'فضولي وتجريبي',
    character: 'violet',
  },
  {
    id: 'madar',
    name: 'مدار',
    subject: 'الفيزياء',
    color: '#13A995',
    glow: 'rgba(19,169,149,.20)',
    voice: 'عملي ومتدرج',
    character: 'teal',
  },
]

const CHARACTERS = [
  { id: 'blue', name: 'الأزرق', color: '#477BFF' },
  { id: 'violet', name: 'البنفسجي', color: '#9465E8' },
  { id: 'teal', name: 'التركوازي', color: '#13A995' },
  { id: 'orange', name: 'البرتقالي', color: '#E89546' },
  { id: 'rose', name: 'الوردي', color: '#DE638C' },
]

const DEMO_STEPS = [
  {
    equation: '2x + 4 = 10',
    explanation: 'نريد إيجاد قيمة x، لذلك سنعزلها في أحد طرفي المعادلة.',
  },
  {
    equation: '2x = 10 − 4',
    explanation: 'نطرح 4 من الطرفين حتى نحافظ على توازن المعادلة.',
  },
  {
    equation: '2x = 6',
    explanation: 'نحسب الطرح: 10 − 4 يساوي 6.',
  },
  {
    equation: 'x = 6 ÷ 2',
    explanation: 'نقسم الطرفين على 2 للتخلص من معامل x.',
  },
  {
    equation: 'x = 3',
    explanation: 'إذن الحل هو x = 3. يمكننا التعويض للتأكد من صحة النتيجة.',
  },
]

function makeId() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return value ?? fallback
  } catch {
    return fallback
  }
}

function loadBoards() {
  const value = readStorage(BOARD_STORAGE, [])
  return Array.isArray(value) ? value : []
}

function loadTeachers() {
  const saved = readStorage(TEACHER_STORAGE, null)

  if (!Array.isArray(saved) || !saved.length) {
    return DEFAULT_TEACHERS
  }

  // دمج المعلمين المحفوظين مع الشخصيات الافتراضية.
  return [
    ...DEFAULT_TEACHERS.filter(
      (base) => !saved.some((item) => item.id === base.id),
    ),
    ...saved,
  ]
}

function drawStroke(ctx, stroke, width, height) {
  if (!stroke) return

  if (stroke.type === 'text') {
    const text = stroke.text.slice(0, stroke.reveal ?? stroke.text.length)
    if (!text) return

    ctx.save()
    ctx.fillStyle = stroke.color || '#26304A'
    ctx.textBaseline = 'middle'
    ctx.direction = stroke.direction || 'ltr'
    ctx.textAlign = stroke.align || 'left'
    ctx.font = stroke.math
      ? `500 ${stroke.size || 30}px "Cambria Math", Georgia, serif`
      : `italic 500 ${stroke.size || 30}px "Comic Sans MS", cursive`
    ctx.fillText(text, (stroke.x || 0) * width, (stroke.y || 0) * height)
    ctx.restore()
    return
  }

  const points = stroke.points || []
  if (!points.length) return

  ctx.save()
  ctx.globalCompositeOperation =
    stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
  ctx.strokeStyle = stroke.color || '#26304A'
  ctx.lineWidth = Math.max(
    stroke.tool === 'eraser' ? 18 : 1.5,
    (stroke.width || 3) * (width / 900),
  )
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x * width, points[0].y * height)

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * width, points[i].y * height)
  }

  if (points.length === 1) {
    ctx.lineTo(
      points[0].x * width + 0.5,
      points[0].y * height + 0.5,
    )
  }

  ctx.stroke()
  ctx.restore()
}

function BoardCanvas({
  strokes,
  currentStroke,
  teacher,
  mathMode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  const canvasRef = useRef(null)
  const wrapperRef = useRef(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const rect = wrapper.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    strokes.forEach((stroke) => {
      drawStroke(
        ctx,
        stroke.type === 'text' ? { ...stroke, math: mathMode } : stroke,
        rect.width,
        rect.height,
      )
    })

    if (currentStroke) {
      drawStroke(ctx, currentStroke, rect.width, rect.height)
    }
  }, [strokes, currentStroke, mathMode])

  useEffect(() => {
    redraw()

    const wrapper = wrapperRef.current
    if (!wrapper) return

    const observer = new ResizeObserver(redraw)
    observer.observe(wrapper)

    return () => observer.disconnect()
  }, [redraw])

  return (
    <div
      ref={wrapperRef}
      className="relative h-[54vh] min-h-[320px] overflow-hidden rounded-[22px] border bg-white sm:h-[60vh] sm:min-h-[420px]"
      style={{
        borderColor: `${teacher.color}55`,
        boxShadow: `0 8px 32px ${teacher.glow}`,
        backgroundImage:
          'radial-gradient(#DDE3EF 0.75px, transparent 0.75px)',
        backgroundSize: '22px 22px',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] text-slate-500">
        <span style={{ color: teacher.color }}>●</span>
        {' '}دفتر السبورة · مساحة تفاعلية
      </div>
    </div>
  )
}

function TeacherAvatar({ teacher, size = 'normal' }) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-2xl ${
        size === 'large' ? 'h-14 w-14' : 'h-11 w-11'
      }`}
      style={{
        color: teacher.color,
        background: `${teacher.color}12`,
        border: `1px solid ${teacher.color}35`,
      }}
    >
      <svg viewBox="0 0 40 40" width="29" height="29" fill="none">
        <rect
          x="6"
          y="7"
          width="28"
          height="25"
          rx="9"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="15" cy="18" r="2.2" fill="currentColor" />
        <circle cx="25" cy="18" r="2.2" fill="currentColor" />
        <path
          d="M14 25 Q20 30 26 25"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20 3 V7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function ActionButton({ children, onClick, active, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-3 py-2.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
          : active
            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

export default function RafeeqBoard({ onToast = () => {} }) {
  const [boards, setBoards] = useState(loadBoards)
  const [teachers, setTeachers] = useState(loadTeachers)

  const [boardId, setBoardId] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [showSessionPicker, setShowSessionPicker] = useState(true)
  const [showTeacherCreator, setShowTeacherCreator] = useState(false)

  const [teacherId, setTeacherId] = useState('siraj')
  const [mode, setMode] = useState('guided')
  const [tool, setTool] = useState('pen')
  const [penColor, setPenColor] = useState('#26304A')
  const [strokes, setStrokes] = useState([])
  const [currentStroke, setCurrentStroke] = useState(null)
  const [topic, setTopic] = useState('')
  const [isTeaching, setIsTeaching] = useState(false)
  const [stepIndex, setStepIndex] = useState(-1)
  const [stepNotes, setStepNotes] = useState([])
  const [mathMode, setMathMode] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)

  const [newTeacherName, setNewTeacherName] = useState('')
  const [newTeacherSubject, setNewTeacherSubject] = useState('')
  const [newTeacherVoice, setNewTeacherVoice] = useState('هادئ وواضح')
  const [newTeacherCharacter, setNewTeacherCharacter] = useState('violet')

  const pointerActive = useRef(false)
  const currentStrokeRef = useRef(null)
  const animationRef = useRef(null)

  const currentTeacher =
    teachers.find((teacher) => teacher.id === teacherId) || teachers[0]

  useEffect(() => {
    try {
      localStorage.setItem(BOARD_STORAGE, JSON.stringify(boards.slice(0, 12)))
    } catch {
      onToast('تعذر حفظ بعض الجلسات محليًا.')
    }
  }, [boards])

  useEffect(() => {
    try {
      localStorage.setItem(TEACHER_STORAGE, JSON.stringify(teachers))
    } catch {
      onToast('تعذر حفظ قائمة المعلمين محليًا.')
    }
  }, [teachers])

  useEffect(() => {
    if (!sessionReady || !boardId) return

    const snapshot = {
      id: boardId,
      title: topic.trim() || `سبورة ${new Date().toLocaleDateString('ar-LY')}`,
      teacherId,
      mode,
      strokes,
      stepNotes,
      mathMode,
      updatedAt: Date.now(),
    }

    setBoards((previous) => {
      const exists = previous.some((item) => item.id === boardId)

      return exists
        ? previous.map((item) => item.id === boardId ? snapshot : item)
        : [snapshot, ...previous].slice(0, 12)
    })
  }, [
    sessionReady,
    boardId,
    topic,
    teacherId,
    mode,
    strokes,
    stepNotes,
    mathMode,
  ])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        window.clearTimeout(animationRef.current)
      }

      window.speechSynthesis?.cancel?.()
    }
  }, [])

  function stopTeaching() {
    if (animationRef.current) {
      window.clearTimeout(animationRef.current)
    }

    animationRef.current = null
    setIsTeaching(false)
    window.speechSynthesis?.cancel?.()
  }

  function speak(text) {
    if (!voiceOn || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ar-LY'
    utterance.rate = 0.92

    window.speechSynthesis.speak(utterance)
  }

  function startNewBoard() {
    stopTeaching()

    const id = makeId()
    setBoardId(id)
    setStrokes([])
    setCurrentStroke(null)
    currentStrokeRef.current = null
    setMode('guided')
    setTopic('')
    setStepIndex(-1)
    setStepNotes([])
    setMathMode(false)
    setIsTeaching(false)
    setSessionReady(true)
    setShowSessionPicker(false)

    // لا نغيّر المعلم؛ السبورة الجديدة تستخدم المعلم المختار.
  }

  function continueBoard(board) {
    if (!board) return startNewBoard()

    stopTeaching()
    setBoardId(board.id)
    setTopic(board.title || '')
    setTeacherId(board.teacherId || 'siraj')
    setMode(board.mode || 'guided')
    setStrokes(board.strokes || [])
    setStepNotes(board.stepNotes || [])
    setMathMode(Boolean(board.mathMode))
    setStepIndex(-1)
    setCurrentStroke(null)
    currentStrokeRef.current = null
    setIsTeaching(false)
    setSessionReady(true)
    setShowSessionPicker(false)
  }

  function saveCurrentBoard() {
    const id = boardId || makeId()

    const current = {
      id,
      title: topic.trim() || `سبورة ${new Date().toLocaleDateString('ar-LY')}`,
      teacherId,
      mode,
      strokes,
      stepNotes,
      mathMode,
      updatedAt: Date.now(),
    }

    setBoardId(id)
    setBoards((previous) => [
      current,
      ...previous.filter((item) => item.id !== id),
    ].slice(0, 12))

    setSessionReady(true)
    onToast('تم حفظ جلسة السبورة على هذا الجهاز ✓')
  }

  function createTeacher(event) {
    event.preventDefault()

    if (!newTeacherName.trim() || !newTeacherSubject.trim()) {
      onToast('اكتب اسم المعلم والتخصص أولًا.')
      return
    }

    const character = CHARACTERS.find(
      (item) => item.id === newTeacherCharacter,
    ) || CHARACTERS[1]

    const teacher = {
      id: makeId(),
      name: newTeacherName.trim(),
      subject: newTeacherSubject.trim(),
      voice: newTeacherVoice,
      character: character.id,
      color: character.color,
      glow: `${character.color}25`,
    }

    setTeachers((previous) => [...previous, teacher])
    setTeacherId(teacher.id)
    setNewTeacherName('')
    setNewTeacherSubject('')
    setNewTeacherVoice('هادئ وواضح')
    setNewTeacherCharacter('violet')
    setShowTeacherCreator(false)

    onToast('تم إنشاء المعلم واختياره بنجاح.')
  }

  function startDemoLesson() {
    if (mode === 'free' && !topic.trim()) {
      onToast('اكتب ما تريد استكشافه أولًا، أو ارسم مباشرة على السبورة.')
      return
    }

    stopTeaching()
    setStrokes((current) => current.filter((stroke) => stroke.source !== 'teacher'))
    setStepNotes([])
    setStepIndex(-1)
    setIsTeaching(true)

    const steps = teacherId === 'siraj'
      ? DEMO_STEPS
      : [
          {
            equation: teacherId === 'atheer' ? 'A + B → AB' : 'F = m × a',
            explanation: teacherId === 'atheer'
              ? 'هذا مثال توضيحي مبسط لاتحاد مادتين في تفاعل كيميائي.'
              : 'هذا مثال توضيحي لقانون نيوتن الثاني: القوة تساوي الكتلة مضروبة في التسارع.',
          },
          {
            equation: teacherId === 'atheer'
              ? 'المتفاعلات → النواتج'
              : 'm = F ÷ a',
            explanation: teacherId === 'atheer'
              ? 'نقرأ المعادلة من المتفاعلات إلى النواتج، ثم نتحقق من تفاصيل التفاعل من مصدر موثوق.'
              : 'يمكن إعادة ترتيب العلاقة لإيجاد الكتلة عندما نعرف القوة والتسارع.',
          },
        ]

    const drawStep = (index) => {
      if (index >= steps.length) {
        setIsTeaching(false)
        animationRef.current = null
        onToast('انتهى الشرح التجريبي. جرّب الكتابة على السبورة بنفسك.')
        return
      }

      const step = steps[index]
      const y = 0.24 + index * Math.min(0.13, 0.58 / steps.length)

      const item = {
        id: makeId(),
        type: 'text',
        text: step.equation,
        x: 0.09,
        y,
        color: currentTeacher.color,
        size: 32,
        reveal: 0,
        source: 'teacher',
        align: 'left',
        math: false,
      }

      setStrokes((current) => [...current, item])
      setStepIndex(index)
      setStepNotes((current) => [...current, step.explanation])
      speak(step.explanation)

      let shown = 0

      const revealNext = () => {
        shown += 1

        setStrokes((current) => current.map((stroke) =>
          stroke.id === item.id
            ? { ...stroke, reveal: shown }
            : stroke,
        ))

        if (shown < step.equation.length) {
          animationRef.current = window.setTimeout(revealNext, 75)
        } else {
          animationRef.current = window.setTimeout(
            () => drawStep(index + 1),
            950,
          )
        }
      }

      animationRef.current = window.setTimeout(revealNext, 100)
    }

    drawStep(0)
  }

  function handlePointerDown(event) {
    if (!sessionReady || isTeaching) return

    const rect = event.currentTarget.getBoundingClientRect()
    const point = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    }

    pointerActive.current = true
    event.currentTarget.setPointerCapture?.(event.pointerId)

    const stroke = {
      id: makeId(),
      type: 'path',
      points: [point],
      color: penColor,
      width: tool === 'eraser' ? 22 : 3.2,
      tool,
      source: 'user',
    }

    currentStrokeRef.current = stroke
    setCurrentStroke(stroke)
  }

  function handlePointerMove(event) {
    if (!pointerActive.current || !currentStrokeRef.current) return

    const rect = event.currentTarget.getBoundingClientRect()
    const point = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    }

    const next = {
      ...currentStrokeRef.current,
      points: [...currentStrokeRef.current.points, point],
    }

    currentStrokeRef.current = next
    setCurrentStroke(next)
  }

  function handlePointerUp() {
    if (!pointerActive.current) return

    pointerActive.current = false
    const completed = currentStrokeRef.current

    if (completed) {
      setStrokes((previous) => [...previous, completed])
    }

    currentStrokeRef.current = null
    setCurrentStroke(null)
  }

  function undo() {
    setStrokes((current) => current.slice(0, -1))
  }

  function clearBoard() {
    if (!window.confirm('هل تريد مسح محتوى السبورة؟')) return

    stopTeaching()
    setStrokes([])
    setCurrentStroke(null)
    currentStrokeRef.current = null
    setStepNotes([])
    setStepIndex(-1)
  }

  function formatMath() {
    setMathMode((current) => !current)

    onToast(
      mathMode
        ? 'عادت الكتابة إلى النمط اليدوي.'
        : 'تم تفعيل الخط الرياضي المرتب.',
    )
  }

  function addTeacherQuestion() {
    if (!topic.trim()) {
      onToast('اكتب سؤالك أولًا.')
      return
    }

    onToast(
      'هذا نموذج تجريبي: الشرح الحالي يستخدم أمثلة محلية، ولا يوجد اتصال فعلي بنموذج AI بعد.',
    )
  }

  return (
    <section
      dir="rtl"
      className="mx-auto max-w-[1400px] space-y-5 pb-8 text-slate-800"
    >
      {/* رأس الصفحة */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div
          className="pointer-events-none absolute -left-12 -top-20 h-56 w-56 rounded-full blur-3xl"
          style={{ background: currentTeacher.glow }}
        />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <TeacherAvatar teacher={currentTeacher} size="large" />

            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: currentTeacher.color }}
                />
                مساحة تعليمية تفاعلية
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                سبورة رفيق
              </h1>

              <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
                اكتب، ارسم، وتابع خطوات الشرح مع المعلم الذي تختاره.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveCurrentBoard}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold hover:bg-slate-50"
            >
              حفظ الجلسة
            </button>

            <button
              type="button"
              onClick={() => {
                stopTeaching()
                setShowSessionPicker(true)
              }}
              className="rounded-xl px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5"
              style={{ background: currentTeacher.color }}
            >
              + سبورة جديدة
            </button>
          </div>
        </div>
      </header>

      {/* مساحة العمل */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <main className="min-w-0 space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">مساحة العمل</h2>
                <p className="mt-1 text-[10px] text-slate-500">
                  {isTeaching
                    ? 'المعلم يشرح ويكتب الآن…'
                    : 'السبورة جاهزة للكتابة والرسم.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <ActionButton
                  active={mode === 'free'}
                  onClick={() => setMode('free')}
                >
                  الوضع الحر
                </ActionButton>

                <ActionButton
                  active={mode === 'guided'}
                  onClick={() => setMode('guided')}
                >
                  التعلم المنظم
                </ActionButton>
              </div>
            </div>

            <div className="my-4 h-px bg-slate-100" />

            <div className="flex flex-wrap gap-2">
              <ActionButton
                active={tool === 'pen' && penColor === '#26304A'}
                onClick={() => {
                  setTool('pen')
                  setPenColor('#26304A')
                }}
              >
                ✎ قلم
              </ActionButton>

              <ActionButton
                active={tool === 'pen' && penColor === '#E15D83'}
                onClick={() => {
                  setTool('pen')
                  setPenColor('#E15D83')
                }}
              >
                <span className="text-rose-600">●</span> وردي
              </ActionButton>

              <ActionButton
                active={tool === 'pen' && penColor === '#477BFF'}
                onClick={() => {
                  setTool('pen')
                  setPenColor('#477BFF')
                }}
              >
                <span className="text-blue-600">●</span> أزرق
              </ActionButton>

              <ActionButton
                active={tool === 'eraser'}
                onClick={() => setTool('eraser')}
              >
                ⌫ ممحاة
              </ActionButton>

              <ActionButton
                onClick={undo}
                disabled={!strokes.length}
              >
                ↶ تراجع
              </ActionButton>

              <ActionButton danger onClick={clearBoard}>
                مسح الكل
              </ActionButton>

              <ActionButton active={mathMode} onClick={formatMath}>
                ∑ {mathMode ? 'عودة للخط اليدوي' : 'تنسيق رياضي'}
              </ActionButton>
            </div>
          </div>

          <BoardCanvas
            strokes={strokes}
            currentStroke={currentStroke}
            teacher={currentTeacher}
            mathMode={mathMode}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />

          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <label
              htmlFor="rafeaq-topic"
              className="mb-2 block text-xs font-bold"
            >
              ماذا تريد أن تشرح؟
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="rafeaq-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !isTeaching) {
                    startDemoLesson()
                  }
                }}
                placeholder="اكتب موضوع الدرس أو سؤالك…"
                className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs outline-none transition focus:border-indigo-300 focus:bg-white"
              />

              <button
                type="button"
                onClick={startDemoLesson}
                disabled={isTeaching}
                className="h-12 rounded-xl px-5 text-xs font-bold text-white transition disabled:opacity-40"
                style={{ background: currentTeacher.color }}
              >
                {isTeaching ? 'جاري الشرح…' : '▶ ابدأ الشرح التجريبي'}
              </button>

              <button
                type="button"
                onClick={stopTeaching}
                disabled={!isTeaching}
                className="h-12 rounded-xl border border-slate-200 px-5 text-xs font-semibold disabled:opacity-40"
              >
                إيقاف
              </button>
            </div>

            <p className="mt-3 text-[10px] leading-6 text-slate-500">
              {mode === 'free'
                ? 'الوضع الحر: ارسم واكتب بحرية. إرسال السؤال إلى نموذج AI غير مفعّل في هذه النسخة.'
                : 'التعلم المنظم: يعرض مثالًا توضيحيًا مكتوبًا تدريجيًا مع شرح صوتي اختياري.'}
            </p>
          </div>

          {stepNotes.length > 0 && (
            <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold">خطوات الشرح</h2>
                  <p className="mt-1 text-[10px] text-slate-500">
                    تابع كل خطوة أثناء ظهورها على السبورة.
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={voiceOn}
                    onChange={(event) => setVoiceOn(event.target.checked)}
                    className="accent-indigo-600"
                  />
                  تشغيل الصوت
                </label>
              </div>

              <div className="space-y-2">
                {stepNotes.map((note, index) => (
                  <div
                    key={`${index}-${note}`}
                    className="rounded-xl border p-3 text-xs leading-7"
                    style={{
                      borderColor: index === stepIndex
                        ? `${currentTeacher.color}77`
                        : '#E8ECF3',
                      background: index === stepIndex
                        ? `${currentTeacher.color}09`
                        : '#FFFFFF',
                    }}
                  >
                    <span
                      className="ml-2 font-bold"
                      style={{ color: currentTeacher.color }}
                    >
                      {index + 1}.
                    </span>
                    {note}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* المعلمون */}
        <aside className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold">المعلمون</h2>
                <p className="mt-1 text-[10px] text-slate-500">
                  اختر المعلم الذي يناسب درسك.
                </p>
              </div>

              <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
                {teachers.length}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  type="button"
                  onClick={() => {
                    stopTeaching()
                    setTeacherId(teacher.id)
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition hover:-translate-y-0.5"
                  style={{
                    borderColor: teacher.id === teacherId
                      ? `${teacher.color}77`
                      : '#E8ECF3',
                    background: teacher.id === teacherId
                      ? `${teacher.color}08`
                      : '#FFFFFF',
                  }}
                >
                  <TeacherAvatar teacher={teacher} />

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold">
                      {teacher.name}
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      {teacher.subject}
                    </span>
                    <span className="mt-1 block text-[9px] text-slate-400">
                      {teacher.voice}
                    </span>
                  </span>

                  {teacher.id === teacherId && (
                    <span
                      className="text-sm"
                      style={{ color: teacher.color }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowTeacherCreator(true)}
              className="mt-3 w-full rounded-xl border border-dashed border-slate-300 px-3 py-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              + إنشاء معلم جديد
            </button>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold">عن السبورة</h2>

            <div className="mt-3 space-y-3 text-[11px] leading-6 text-slate-500">
              <p>• الرسم والأقلام والممحاة تعمل على جهازك مباشرة.</p>
              <p>• الشرح التجريبي يُكتب تدريجيًا ويمكن نطقه صوتيًا.</p>
              <p>• الجلسات والمعلمون المضافون يُحفظون محليًا في المتصفح.</p>
              <p>• يمكنك استكمال الجلسات المحفوظة أو إنشاء جلسة جديدة.</p>
              <p>• هذه النسخة لا تتصل بنموذج ذكاء اصطناعي فعلي حتى الآن.</p>
            </div>
          </div>

          <div
            className="rounded-[18px] border p-4 text-[10px] leading-6"
            style={{
              borderColor: `${currentTeacher.color}33`,
              background: `${currentTeacher.color}08`,
              color: '#596579',
            }}
          >
            <div className="mb-1 font-bold" style={{ color: currentTeacher.color }}>
              المعلم الحالي: {currentTeacher.name}
            </div>
            ستتغير لمسات الواجهة وإضاءة السبورة حسب المعلم المختار.
          </div>
        </aside>
      </div>

      {/* اختيار المعلم أولًا ثم فتح السبورة */}
      {showSessionPicker && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-[560px] rounded-[26px] border border-white bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-5">
              <span className="text-[10px] font-bold text-indigo-600">
                RAFEEQ BOARD
              </span>

              <h2 className="mt-2 text-xl font-bold">
                اختر معلمك أولًا
              </h2>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                اختر الشخصية التي سترافقك في الجلسة، ثم افتح سبورة جديدة أو تابع جلسة سابقة.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  type="button"
                  onClick={() => setTeacherId(teacher.id)}
                  className="flex items-center gap-3 rounded-2xl border p-3 text-right transition sm:flex-col sm:items-start"
                  style={{
                    borderColor: teacher.id === teacherId
                      ? `${teacher.color}99`
                      : '#E8ECF3',
                    background: teacher.id === teacherId
                      ? `${teacher.color}09`
                      : '#FFFFFF',
                  }}
                >
                  <TeacherAvatar teacher={teacher} />

                  <span>
                    <span className="block text-xs font-bold">
                      {teacher.name}
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      {teacher.subject}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSessionPicker(false)
                setShowTeacherCreator(true)
              }}
              className="mt-3 w-full rounded-xl border border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              + إنشاء معلم أو اختيار شخصية جديدة
            </button>

            {boards.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-3 text-xs font-bold">الجلسات السابقة</h3>

                <div className="max-h-44 space-y-2 overflow-y-auto">
                  {boards.slice(0, 5).map((board) => (
                    <button
                      key={board.id}
                      type="button"
                      onClick={() => continueBoard(board)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-right transition hover:bg-slate-100"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">
                          {board.title}
                        </span>
                        <span className="mt-1 block text-[9px] text-slate-500">
                          {new Date(board.updatedAt).toLocaleString('ar-LY')}
                        </span>
                      </span>

                      <span className="shrink-0 text-[10px] font-semibold text-indigo-600">
                        متابعة ←
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={startNewBoard}
              className="mt-5 h-12 w-full rounded-xl text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              style={{ background: currentTeacher.color }}
            >
              فتح سبورة مع {currentTeacher.name} ←
            </button>
          </div>
        </div>
      )}

      {/* إنشاء معلم واختيار شخصية جاهزة */}
      {showTeacherCreator && (
        <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={createTeacher}
            className="my-auto w-full max-w-[480px] rounded-[26px] border border-white bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">إنشاء معلم جديد</h2>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  اختر شخصية جاهزة وحدد اسم المعلم وتخصصه.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowTeacherCreator(false)
                  if (!sessionReady) setShowSessionPicker(true)
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500"
              >
                إغلاق
              </button>
            </div>

            <label className="mt-5 block text-xs font-semibold">
              اسم المعلم
            </label>

            <input
              required
              value={newTeacherName}
              onChange={(event) => setNewTeacherName(event.target.value)}
              placeholder="مثال: نور"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-indigo-300"
            />

            <label className="mt-4 block text-xs font-semibold">
              التخصص
            </label>

            <input
              required
              value={newTeacherSubject}
              onChange={(event) => setNewTeacherSubject(event.target.value)}
              placeholder="مثال: الأحياء"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-indigo-300"
            />

            <label className="mt-4 block text-xs font-semibold">
              أسلوب المعلم
            </label>

            <select
              value={newTeacherVoice}
              onChange={(event) => setNewTeacherVoice(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-300"
            >
              <option>هادئ وواضح</option>
              <option>فضولي وتجريبي</option>
              <option>عملي ومتدرج</option>
              <option>مختصر ومباشر</option>
              <option>مفصل وصبور</option>
            </select>

            <label className="mt-5 block text-xs font-semibold">
              اختر شخصية جاهزة
            </label>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {CHARACTERS.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  onClick={() => setNewTeacherCharacter(character.id)}
                  className="flex flex-col items-center gap-2 rounded-xl border p-2"
                  style={{
                    borderColor: newTeacherCharacter === character.id
                      ? character.color
                      : '#E8ECF3',
                    background: newTeacherCharacter === character.id
                      ? `${character.color}10`
                      : '#FFFFFF',
                  }}
                >
                  <span
                    className="h-7 w-7 rounded-full"
                    style={{
                      background: `${character.color}22`,
                      border: `2px solid ${character.color}`,
                    }}
                  />
                  <span className="text-[9px] text-slate-600">
                    {character.name}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="mt-6 h-12 w-full rounded-xl bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              إنشاء المعلم واختياره
            </button>
          </form>
        </div>
      )}
    </section>
  )
}
