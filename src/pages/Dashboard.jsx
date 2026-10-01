import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DAILY_LIMIT = 25
const STORAGE = {
  user: 'rafeaq_user',
  name: 'rafeaq_name',
  token: 'rafeaq_token',
  messages: 'rafeaq_student_messages',
  notes: 'rafeaq_student_notes',
  chances: 'rafeaq_student_chances',
  chanceDate: 'rafeaq_student_chance_date',
  books: 'rafeaq_school_books',
}

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

function getInitials(name = 'ط') {
  return name.trim().charAt(0) || 'ط'
}

export default function Dashboard() {
  const nav = useNavigate()

  const [tab, setTab] = useState('home')
  const [user, setUser] = useState('الطالب')
  const [studentClass, setStudentClass] = useState('')
  const [studentSection, setStudentSection] = useState('')

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

  const [books, setBooks] = useState(() => readLS(STORAGE.books, []))

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const bottomRef = useRef(null)

  const [pomoMode, setPomoMode] = useState('study')
  const [pomoRunning, setPomoRunning] = useState(false)
  const [pomoTime, setPomoTime] = useState(25 * 60)

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

  useEffect(() => {
    writeLS(STORAGE.messages, messages)
  }, [messages])

  useEffect(() => {
    writeLS(STORAGE.notes, notes)
  }, [notes])

  useEffect(() => {
    writeLS(STORAGE.chances, chances)
    localStorage.setItem(STORAGE.chanceDate, todayKey())
  }, [chances])

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

  useEffect(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      return undefined
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

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
    if (tab === 'ai') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, aiLoading, tab])

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return books

    return books.filter((book) =>
      [book.name, book.title, book.subject, book.class, book.grade]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [books, search])

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return notes

    return notes.filter((note) =>
      [note.title, note.content].filter(Boolean).join(' ').toLowerCase().includes(query)
    )
  }, [notes, search])

  function goTo(nextTab) {
    setTab(nextTab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
          id: crypto.randomUUID?.() || Date.now(),
          role: 'assistant',
          text: 'انتهت رسائلك المجانية لهذا اليوم. ستتجدد الـ25 رسالة تلقائياً غداً.',
        },
      ])
      return
    }

    const userMessage = {
      id: crypto.randomUUID?.() || Date.now(),
      role: 'user',
      text: question,
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setAiLoading(true)
    setChances((current) => Math.max(0, current - 1))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          mode,
          role: 'student',
          student: {
            name: user,
            class: studentClass,
            section: studentSection,
          },
        }),
      })

      let data = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`)
      }

      const reply = data?.reply || data?.text

      if (!reply) {
        throw new Error('EMPTY_AI_RESPONSE')
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID?.() || Date.now() + 1,
          role: 'assistant',
          text: reply,
        },
      ])
    } catch (error) {
      console.error('Rafeeq AI error:', error)

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID?.() || Date.now() + 1,
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

  function addNote() {
    const content = noteInput.trim()
    if (!content) return

    const note = {
      id: crypto.randomUUID?.() || Date.now(),
      title: content.slice(0, 45),
      content,
      date: formatDate(),
    }

    setNotes((current) => [note, ...current])
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

  function logout() {
    localStorage.removeItem(STORAGE.token)
    sessionStorage.setItem('just_logged_out', '1')
    nav('/login', { replace: true })
  }

  const navigation = [
    { id: 'home', label: 'الرئيسية', icon: '⌂' },
    { id: 'ai', label: 'رفيق AI', icon: '✦' },
    { id: 'books', label: 'كتب ودروس', icon: '▤' },
    { id: 'notes', label: 'ملاحظاتي', icon: '▢' },
    { id: 'timer', label: 'مؤقت الدراسة', icon: '◷' },
  ]

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F8FA] text-[#17181B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

        * { font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif; }
        html { scroll-behavior: smooth; }
        button, input, textarea, select { font: inherit; }
        ::selection { background: #17181B; color: white; }
        .thin-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .thin-scroll::-webkit-scrollbar-thumb { background: #D7D9DE; border-radius: 999px; }
      `}</style>

      <aside className="hidden lg:flex fixed right-0 top-0 z-40 h-screen w-[248px] flex-col border-l border-[#E9EAED] bg-white">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#17181B] text-white shadow-sm">
              <span className="text-[17px] font-bold">ر</span>
            </div>
            <div>
              <div className="text-[15px] font-bold">رفيق</div>
              <div className="text-[10px] text-[#8A8D94]">مساعدك الدراسي</div>
            </div>
          </div>

          <div className="mt-9">
            <div className="mb-2 px-3 text-[10px] font-bold tracking-wider text-[#A0A3AA]">
              المنصة
            </div>

            <div className="space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  className={`flex h-10 w-full items-center gap-3 rounded-[11px] px-3 text-right text-[13px] transition ${
                    tab === item.id
                      ? 'bg-[#17181B] font-semibold text-white shadow-sm'
                      : 'text-[#656971] hover:bg-[#F3F4F6] hover:text-[#17181B]'
                  }`}
                >
                  <span className="w-5 text-center text-[15px]">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'ai' && (
                    <span
                      className={`mr-auto rounded-full px-2 py-0.5 text-[9px] ${
                        tab === 'ai'
                          ? 'bg-white/15 text-white'
                          : 'bg-[#F1F2F4] text-[#6D7077]'
                      }`}
                    >
                      {chances}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-[14px] border border-[#ECEDEF] bg-[#FAFAFB] p-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#17181B] text-[12px] font-bold text-white">
                {getInitials(user)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold">{user}</div>
                <div className="truncate text-[10px] text-[#8B8E95]">
                  {studentClass || 'طالب'}{studentSection ? ` • ${studentSection}` : ''}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-[#777A81]">
              <span>رسائل رفيق</span>
              <span className="font-semibold text-[#17181B]">{chances}/{DAILY_LIMIT}</span>
            </div>

            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E7E8EB]">
              <div
                className="h-full rounded-full bg-[#17181B] transition-all"
                style={{ width: `${(chances / DAILY_LIMIT) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-2.5 h-9 w-full rounded-[10px] border border-[#ECEDEF] text-[11px] text-[#777A81] transition hover:bg-[#F3F4F6] hover:text-[#17181B]"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="lg:mr-[248px]">
        <header className="sticky top-0 z-30 border-b border-[#E9EAED]/90 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[62px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                onClick={() => goTo('home')}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#17181B] text-white lg:hidden"
              >
                ر
              </button>

              <div className="relative max-w-[470px] flex-1">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#9699A0]">
                  ⌕
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث في كتبك وملاحظاتك..."
                  className="h-9 w-full rounded-[10px] border border-transparent bg-[#F2F3F5] pr-9 pl-3 text-[11px] outline-none transition focus:border-[#D9DBDF] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden rounded-full border border-[#E7E8EB] bg-white px-3 py-1.5 text-[10px] text-[#70737A] sm:block">
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#20A464]" />
                {chances} رسالة متبقية
              </div>

              <div className="hidden text-left text-[10px] leading-4 text-[#92959C] md:block">
                {formatDate()}
              </div>

              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#17181B] text-[11px] font-bold text-white">
                {getInitials(user)}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1240px] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-7 lg:pb-8">
          {tab === 'home' && (
            <section className="space-y-5">
              <div className="relative overflow-hidden rounded-[24px] bg-[#17181B] p-6 text-white sm:p-8 lg:p-10">
                <div className="absolute -left-16 -top-24 h-64 w-64 rounded-full bg-white/[0.05] blur-2xl" />
                <div className="absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-white/[0.04] blur-3xl" />

                <div className="relative max-w-[700px]">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] text-white/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#63E6A5]" />
                    مساحة الطالب
                  </div>

                  <h1 className="mt-5 text-[25px] font-bold leading-[1.35] sm:text-[31px]">
                    أهلاً {user} 👋
                    <br />
                    خلّينا نكمّل دراستك اليوم.
                  </h1>

                  <p className="mt-3 max-w-[560px] text-[12px] leading-6 text-white/55 sm:text-[13px]">
                    رفيق يساعدك في فهم دروسك، مراجعة المواد، وتنظيم وقتك. الكتب
                    والمحتوى الذي توفره المنصة هو المرجع الدراسي الأساسي.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      onClick={() => goTo('ai')}
                      className="h-10 rounded-full bg-white px-5 text-[12px] font-semibold text-[#17181B] transition hover:bg-[#F0F0F0]"
                    >
                      ابدأ مع رفيق AI
                    </button>
                    <button
                      onClick={() => goTo('books')}
                      className="h-10 rounded-full border border-white/10 bg-white/[0.07] px-5 text-[12px] text-white transition hover:bg-white/[0.12]"
                    >
                      تصفح الكتب
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  {
                    id: 'ai',
                    title: 'رفيق AI',
                    value: `${chances}/${DAILY_LIMIT}`,
                    caption: 'رسائل متبقية اليوم',
                    icon: '✦',
                  },
                  {
                    id: 'books',
                    title: 'الكتب والدروس',
                    value: books.length,
                    caption: 'مادة متاحة',
                    icon: '▤',
                  },
                  {
                    id: 'notes',
                    title: 'ملاحظاتي',
                    value: notes.length,
                    caption: 'ملاحظة محفوظة',
                    icon: '▢',
                  },
                  {
                    id: 'timer',
                    title: 'مؤقت الدراسة',
                    value: formatTime(pomoTime),
                    caption: pomoRunning ? 'جلسة تعمل الآن' : 'جاهز للدراسة',
                    icon: '◷',
                  },
                ].map((card) => (
                  <button
                    key={card.id}
                    onClick={() => goTo(card.id)}
                    className="group rounded-[17px] border border-[#E9EAED] bg-white p-4 text-right transition hover:-translate-y-0.5 hover:border-[#D7D9DE] hover:shadow-[0_10px_30px_rgba(20,20,20,0.05)]"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#F2F3F5] text-[14px] transition group-hover:bg-[#17181B] group-hover:text-white">
                      {card.icon}
                    </div>
                    <div className="mt-4 text-[12px] font-semibold">{card.title}</div>
                    <div className="mt-1 text-[19px] font-bold tracking-tight">{card.value}</div>
                    <div className="mt-0.5 text-[9px] text-[#9699A0]">{card.caption}</div>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
                <div className="rounded-[18px] border border-[#E9EAED] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[14px] font-bold">ابدأ بسرعة</h2>
                      <p className="mt-1 text-[10px] text-[#8C8F96]">
                        أدوات مصممة للدراسة فقط
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <button
                      onClick={() => {
                        goTo('ai')
                        setInput('اشرح لي هذا الدرس بطريقة بسيطة')
                      }}
                      className="rounded-[13px] border border-[#ECEDEF] bg-[#FAFAFB] p-4 text-right transition hover:bg-[#F3F4F6]"
                    >
                      <div className="text-[16px]">✦</div>
                      <div className="mt-3 text-[11px] font-semibold">شرح درس</div>
                      <div className="mt-1 text-[9px] text-[#92959C]">فهم الفكرة خطوة بخطوة</div>
                    </button>

                    <button
                      onClick={() => {
                        goTo('ai')
                        setInput('أنشئ لي أسئلة مراجعة من الدرس')
                      }}
                      className="rounded-[13px] border border-[#ECEDEF] bg-[#FAFAFB] p-4 text-right transition hover:bg-[#F3F4F6]"
                    >
                      <div className="text-[16px]">?</div>
                      <div className="mt-3 text-[11px] font-semibold">مراجعة</div>
                      <div className="mt-1 text-[9px] text-[#92959C]">أسئلة تساعدك على التذكر</div>
                    </button>

                    <button
                      onClick={() => goTo('timer')}
                      className="rounded-[13px] border border-[#ECEDEF] bg-[#FAFAFB] p-4 text-right transition hover:bg-[#F3F4F6]"
                    >
                      <div className="text-[16px]">◷</div>
                      <div className="mt-3 text-[11px] font-semibold">جلسة دراسة</div>
                      <div className="mt-1 text-[9px] text-[#92959C]">25 دقيقة تركيز</div>
                    </button>
                  </div>
                </div>

                <div className="rounded-[18px] border border-[#E9EAED] bg-white p-5">
                  <div className="text-[13px] font-bold">حالتك اليوم</div>

                  <div className="mt-4 rounded-[13px] bg-[#F7F8FA] p-4">
                    <div className="flex items-center justify-between text-[10px] text-[#777A81]">
                      <span>رسائل رفيق</span>
                      <strong className="text-[#17181B]">
                        {chances} / {DAILY_LIMIT}
                      </strong>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E6E7EA]">
                      <div
                        className="h-full rounded-full bg-[#17181B] transition-all"
                        style={{ width: `${(chances / DAILY_LIMIT) * 100}%` }}
                      />
                    </div>
                    <p className="mt-3 text-[9px] leading-5 text-[#9699A0]">
                      يتجدد الحد اليومي تلقائياً مع بداية يوم جديد.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {tab === 'ai' && (
            <section className="mx-auto max-w-[920px]">
              <div className="overflow-hidden rounded-[20px] border border-[#E7E8EB] bg-white shadow-[0_12px_40px_rgba(20,20,20,0.04)]">
                <div className="flex min-h-[66px] items-center justify-between gap-3 border-b border-[#ECEDEF] px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#17181B] text-white">
                      ✦
                    </div>
                    <div>
                      <div className="text-[13px] font-bold">رفيق AI</div>
                      <div className="text-[9px] text-[#8D9097]">
                        مساعد دراسي • {chances} رسالة متبقية
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={clearChat}
                    className="rounded-full border border-[#E7E8EB] px-3 py-1.5 text-[9px] text-[#777A81] transition hover:bg-[#F5F6F7]"
                  >
                    مسح المحادثة
                  </button>
                </div>

                <div className="thin-scroll h-[58vh] min-h-[430px] overflow-y-auto bg-[#FAFBFC] p-4 sm:p-6">
                  {messages.length === 0 ? (
                    <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                      <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-[#17181B] text-[23px] text-white">
                        ✦
                      </div>
                      <h2 className="mt-5 text-[19px] font-bold">شن تبي نراجع معاك؟</h2>
                      <p className="mt-2 max-w-[450px] text-[11px] leading-6 text-[#858890]">
                        اسأل عن درس أو اطلب شرحاً أو أسئلة مراجعة. رفيق لا يستبدل
                        كتبك ومصادر المدرسة.
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
                            className="rounded-[12px] border border-[#E7E8EB] bg-white p-3 text-right text-[10px] transition hover:border-[#C9CBD0] hover:bg-[#F8F8F9]"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === 'user' ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <div
                            className={`max-w-[88%] whitespace-pre-wrap rounded-[17px] px-4 py-3 text-[12px] leading-7 sm:max-w-[76%] ${
                              message.role === 'user'
                                ? 'rounded-tl-[5px] bg-[#17181B] text-white'
                                : message.error
                                  ? 'rounded-tr-[5px] border border-[#F0D4D4] bg-[#FFF8F8] text-[#8B4242]'
                                  : 'rounded-tr-[5px] border border-[#E7E8EB] bg-white text-[#282A2F] shadow-[0_2px_10px_rgba(0,0,0,0.025)]'
                            }`}
                          >
                            {message.text}
                          </div>
                        </div>
                      ))}

                      {aiLoading && (
                        <div className="flex justify-end">
                          <div className="flex items-center gap-2 rounded-[16px] border border-[#E7E8EB] bg-white px-4 py-3 text-[10px] text-[#777A81]">
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#D9DBDF] border-t-[#17181B]" />
                            رفيق يجهز الإجابة...
                          </div>
                        </div>
                      )}

                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                <div className="border-t border-[#ECEDEF] bg-white p-3 sm:p-4">
                  <div className="flex items-end gap-2 rounded-[16px] border border-[#E2E4E8] bg-[#F6F7F8] p-2 transition focus-within:border-[#BFC2C8] focus-within:bg-white">
                    <button
                      onClick={toggleVoice}
                      title="إدخال صوتي"
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                        isListening
                          ? 'bg-[#D92D20] text-white animate-pulse'
                          : 'bg-white text-[#17181B] shadow-sm'
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
                      placeholder={
                        isListening
                          ? 'تكلم الآن...'
                          : 'اكتب سؤالك الدراسي هنا...'
                      }
                      className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-[12px] leading-5 outline-none"
                    />

                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || aiLoading || chances <= 0}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#17181B] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[8px] text-[#9A9DA4]">
                    <span>
                      Enter للإرسال • Shift + Enter لسطر جديد • {DAILY_LIMIT} رسالة يومياً
                    </span>
                    <span>{chances}/{DAILY_LIMIT}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {tab === 'books' && (
            <section className="space-y-4">
              <div className="rounded-[20px] bg-[#17181B] p-6 text-white sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-[10px] text-white/50">المحتوى الدراسي</div>
                    <h1 className="mt-2 text-[24px] font-bold">كتب ودروس</h1>
                    <p className="mt-2 max-w-[560px] text-[10px] leading-5 text-white/55">
                      الكتب هنا هي المواد التي أضافتها المنصة للطلاب. لا يوجد تنزيل
                      وهمي أو كتب افتراضية غير موجودة.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px]">
                    {filteredBooks.length} مادة
                  </div>
                </div>
              </div>

              {filteredBooks.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[#D9DBDF] bg-white p-14 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-[16px] bg-[#F2F3F5] text-[22px]">
                    ▤
                  </div>
                  <div className="mt-4 text-[13px] font-bold">
                    لا توجد كتب متاحة حالياً
                  </div>
                  <p className="mx-auto mt-2 max-w-[420px] text-[10px] leading-5 text-[#999CA3]">
                    عندما يضيف المعلم الكتب أو المواد من لوحة الإدارة ستظهر هنا
                    تلقائياً حسب طريقة التخزين المستخدمة في مشروعك.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBooks.map((book, index) => (
                    <div
                      key={book.id || index}
                      className="rounded-[16px] border border-[#E7E8EB] bg-white p-4 transition hover:border-[#D2D4D9] hover:shadow-[0_10px_30px_rgba(20,20,20,0.04)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#F2F3F5] text-[18px]">
                          📖
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-2 text-[12px] font-bold">
                            {book.name || book.title || 'كتاب دراسي'}
                          </div>
                          <div className="mt-1 text-[9px] text-[#94979E]">
                            {book.subject || 'مادة دراسية'}
                            {book.class || book.grade ? ` • ${book.class || book.grade}` : ''}
                          </div>
                        </div>
                      </div>

                      {book.description && (
                        <p className="mt-3 line-clamp-3 text-[10px] leading-5 text-[#777A81]">
                          {book.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        {book.url || book.data ? (
                          <a
                            href={book.url || book.data}
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 flex-1 rounded-full bg-[#17181B] text-center text-[10px] font-semibold leading-8 text-white"
                          >
                            فتح الكتاب
                          </a>
                        ) : (
                          <div className="h-8 flex-1 rounded-full bg-[#F2F3F5] text-center text-[10px] leading-8 text-[#8C8F96]">
                            الملف غير متاح
                          </div>
                        )}

                        <button
                          onClick={() => {
                            goTo('ai')
                            setInput(
                              `ساعدني في مراجعة كتاب ${book.name || book.title || 'المادة'}`
                            )
                          }}
                          className="h-8 rounded-full border border-[#E2E4E8] px-3 text-[10px] transition hover:bg-[#F5F6F7]"
                        >
                          راجع مع AI
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'notes' && (
            <section className="mx-auto max-w-[1000px] space-y-4">
              <div className="rounded-[20px] border border-[#E7E8EB] bg-white p-5 sm:p-6">
                <div>
                  <h1 className="text-[19px] font-bold">ملاحظاتي</h1>
                  <p className="mt-1 text-[10px] text-[#8E9198]">
                    ملاحظاتك الشخصية محفوظة محلياً في هذا المتصفح.
                  </p>
                </div>

                <div className="mt-5 rounded-[14px] border border-[#E2E4E8] bg-[#F7F8FA] p-2">
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    rows={4}
                    placeholder="اكتب ملاحظة، قانون، فكرة أو نقطة تريد الاحتفاظ بها..."
                    className="w-full resize-none bg-transparent p-2 text-[12px] leading-6 outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={addNote}
                      disabled={!noteInput.trim()}
                      className="h-9 rounded-full bg-[#17181B] px-5 text-[10px] font-semibold text-white disabled:opacity-30"
                    >
                      حفظ الملاحظة
                    </button>
                  </div>
                </div>
              </div>

              {filteredNotes.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[#D9DBDF] bg-white p-14 text-center">
                  <div className="text-[24px]">▢</div>
                  <div className="mt-3 text-[12px] font-semibold">لا توجد ملاحظات</div>
                  <div className="mt-1 text-[9px] text-[#999CA3]">
                    اكتب أول ملاحظة من الأعلى.
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredNotes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-[16px] border border-[#E7E8EB] bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="line-clamp-1 text-[12px] font-bold">{note.title}</h2>
                        <span className="shrink-0 text-[8px] text-[#9A9DA4]">
                          {note.date}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-[10px] leading-6 text-[#65686F]">
                        {note.content}
                      </p>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="rounded-full border border-[#F0D6D6] bg-[#FFF8F8] px-3 py-1.5 text-[9px] text-[#B34A4A]"
                        >
                          حذف
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'timer' && (
            <section className="mx-auto max-w-[620px] space-y-4">
              <div className="rounded-[22px] border border-[#E7E8EB] bg-white p-6 text-center shadow-[0_12px_40px_rgba(20,20,20,0.04)] sm:p-9">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EA] bg-[#F7F8FA] px-3 py-1.5 text-[9px] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#17181B]" />
                  {pomoMode === 'break'
                    ? 'وقت الراحة'
                    : pomoMode === 'deep'
                      ? 'جلسة تركيز عميق'
                      : 'جلسة دراسة'}
                </div>

                <div className="mt-8 text-[68px] font-bold tracking-tight tabular-nums sm:text-[86px]">
                  {formatTime(pomoTime)}
                </div>

                <p className="mt-2 text-[10px] text-[#8C8F96]">
                  {pomoMode === 'break'
                    ? 'خذ راحة قصيرة ثم ارجع للدراسة'
                    : 'ركز على مادة واحدة وتجنب المشتتات'}
                </p>

                <div className="mt-8 flex justify-center gap-3">
                  <button
                    onClick={() => setPomoRunning((current) => !current)}
                    className="grid h-14 w-14 place-items-center rounded-full bg-[#17181B] text-[18px] text-white shadow-[0_8px_20px_rgba(20,20,20,0.12)]"
                  >
                    {pomoRunning ? 'Ⅱ' : '▶'}
                  </button>

                  <button
                    onClick={() => resetTimer()}
                    className="grid h-14 w-14 place-items-center rounded-full border border-[#E4E6E9] bg-[#F5F6F7] text-[18px]"
                  >
                    ↺
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-2">
                  {[
                    ['study', '25 دقيقة'],
                    ['break', '5 دقائق'],
                    ['deep', '50 دقيقة'],
                  ].map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => changeTimerMode(mode)}
                      className={`h-10 rounded-full border text-[9px] font-semibold transition ${
                        pomoMode === mode
                          ? 'border-[#17181B] bg-[#17181B] text-white'
                          : 'border-[#E4E6E9] bg-white text-[#65686D] hover:bg-[#F6F7F8]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] border border-[#E7E8EB] bg-white p-5">
                <div className="text-[12px] font-bold">طريقة بسيطة للاستفادة</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-[12px] bg-[#F7F8FA] p-3">
                    <div className="text-[10px] font-bold">01</div>
                    <div className="mt-1 text-[9px] leading-5 text-[#777A81]">
                      اختر درساً واحداً.
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-[#F7F8FA] p-3">
                    <div className="text-[10px] font-bold">02</div>
                    <div className="mt-1 text-[9px] leading-5 text-[#777A81]">
                      ابدأ جلسة تركيز.
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-[#F7F8FA] p-3">
                    <div className="text-[10px] font-bold">03</div>
                    <div className="mt-1 text-[9px] leading-5 text-[#777A81]">
                      راجع ما تعلمته مع رفيق.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E3E5E8] bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[600px] gap-1 overflow-x-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              className={`min-w-[72px] flex-1 rounded-[11px] px-2 py-2 text-center transition ${
                tab === item.id
                  ? 'bg-[#17181B] text-white'
                  : 'text-[#777A81] hover:bg-[#F3F4F6]'
              }`}
            >
              <div className="text-[14px]">{item.icon}</div>
              <div className="mt-0.5 text-[8px] font-semibold">{item.label}</div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
