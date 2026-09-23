import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const nav = useNavigate()
  const [tab, setTab] = useState('home')
  const [collapsed, setCollapsed] = useState(false)
  const [lang, setLang] = useState('ar')
  const [user, setUser] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [search, setSearch] = useState('')
  const [showNotif, setShowNotif] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const isAr = lang === 'ar'

  // كل الترجمات كاملة 100% - عربي / انجليزي
  const T = {
    dashboard: isAr ? 'لوحة التحكم' : 'Dashboard',
    welcome: isAr ? 'مرحبا بعودتك - اليوم' : 'Welcome back - Today',
    search: isAr ? 'ابحث في مهامك، ملفاتك...' : 'Search tasks, notes, files...',
    overview: isAr ? 'نظرة عامة' : 'Overview',
    home: isAr ? 'الرئيسية' : 'Home',
    aiChat: isAr ? 'رفيق AI' : 'Rafeaq AI',
    aiChats: isAr ? '25 محادثة يوميا' : '25 chats daily',
    tasks: isAr ? 'المهام' : 'Tasks',
    myTasks: isAr ? 'مهامي' : 'My Tasks',
    pomodoro: isAr ? 'بومودورو' : 'Pomodoro',
    focus: isAr ? 'تركيز' : 'Focus',
    flashcards: isAr ? 'بطاقات' : 'Flashcards',
    smartReview: isAr ? 'مراجعة ذكية' : 'Smart Review',
    library: isAr ? 'مكتبة رفيق' : 'Rafeaq Library',
    curriculum: isAr ? 'المنهج الليبي' : 'Libyan Curriculum',
    notebook: isAr ? 'دفتر رفيق' : 'Rafeaq Notebook',
    slides: isAr ? 'العروض' : 'Slides',
    khazna: isAr ? 'خزنة' : 'Khazna',
    exams: isAr ? 'الامتحانات' : 'Exams',
    countdown: isAr ? 'عد تنازلي' : 'Countdown',
    settings: isAr ? 'الإعدادات' : 'Settings',
    notif: isAr ? 'الإشعارات' : 'Notifications',
    notif1: isAr ? 'تذكير: مراجعة اليوم' : 'Reminder: Review today',
    close: isAr ? 'إغلاق' : 'Close',
    open: isAr ? 'فتح' : 'Open',
    start: isAr ? 'ابدأ' : 'Start',
    pause: isAr ? 'وقف' : 'Pause',
    reset: isAr ? 'تصفير' : 'Reset',
    logout: isAr ? 'خروج' : 'Logout',
    langBtn: isAr ? 'English' : 'عربي',
    editName: isAr ? 'اضغط للتعديل' : 'Click to edit',
    premium: isAr ? 'مميز' : 'Premium',
    review: isAr ? 'مراجعة' : 'Review',
    today: isAr ? 'اليوم' : 'Today',
    addTask: isAr ? 'إضافة مهمة' : 'Add task',
    taskPlaceholder: isAr ? 'مثال: واجب الرياضيات' : 'e.g. Math homework',
    noTasks: isAr ? 'لا توجد مهام' : 'No tasks',
    work: isAr ? 'عمل' : 'Work',
    break: isAr ? 'راحة' : 'Break',
    edit: isAr ? 'تعديل' : 'Edit',
    language: isAr ? 'اللغة' : 'Language'
  }

  const tabs = [
    { id: 'home', label: T.home, letter: 'R', color: '#A78BFA', desc: T.overview },
    { id: 'ai', label: T.aiChat, letter: 'AI', color: '#7C3AED', desc: T.aiChats },
    { id: 'notebook', label: T.notebook, letter: 'N', color: '#F59E0B', desc: 'NotebookLM' },
    { id: 'library', label: T.library, letter: 'L', color: '#10B981', desc: T.curriculum },
    { id: 'slides', label: T.slides, letter: 'S', color: '#EC4899', desc: 'PowerPoint' },
    { id: 'khazna', label: T.khazna, letter: 'K', color: '#6366F1', desc: 'TeraBox 100GB' },
    { id: 'tasks', label: T.tasks, letter: 'T', color: '#059669', desc: T.myTasks },
    { id: 'pomo', label: T.pomodoro, letter: 'P', color: '#EF4444', desc: T.focus },
    { id: 'flash', label: T.flashcards, letter: 'F', color: '#8B5CF6', desc: T.smartReview },
    { id: 'exam', label: T.exams, letter: 'E', color: '#F97316', desc: T.countdown }
  ]

  useEffect(() => {
    const u = localStorage.getItem('rafeaq_user') || ''
    setUser(u)
    setTempName(u)
    const savedLang = localStorage.getItem('rafeaq_lang')
    if (savedLang) setLang(savedLang)
    const onDocClick = (e) => {
      if (!e.target.closest('.dd')) {
        setShowNotif(false)
        setShowSettings(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function saveName() {
    const n = tempName.trim()
    if (!n) return
    setUser(n)
    localStorage.setItem('rafeaq_user', n)
    setEditingName(false)
  }

  function toggleLang() {
    const nl = lang === 'ar' ? 'en' : 'ar'
    setLang(nl)
    localStorage.setItem('rafeaq_lang', nl)
    // تحديث فوري بدون ريلود
  }

  function logout() {
    localStorage.removeItem('rafeaq_token')
    localStorage.removeItem('rafeaq_user')
    nav('/login')
  }

  const sideW = collapsed ? 'w-[72px]' : 'w-[260px]'
  const mainMl = collapsed ? 'ml-[72px]' : 'ml-[260px]'

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex overflow-x-hidden" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: 'Tajawal, sans-serif' }}>
      {/* SIDEBAR - بدون Link */}
      <div className={sideW + ' bg-white border-r border-[#A78BFA]/10 fixed left-0 top-0 h-screen z-30 flex flex-col justify-between transition-all duration-300'}>
        <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#A78BFA] text-white flex items-center justify-center font-black shrink-0">ر</div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="font-extrabold text-[13px] truncate">رفيق</div>
                  <div className="text-[8px] opacity-40 -mt-1">Rafeaq OS Beta</div>
                </div>
              )}
            </div>
            <button onClick={() => setCollapsed(!collapsed)} className="w-7 h-7 rounded-full bg-[#F5F3FF] border flex items-center justify-center text-[11px] shrink-0 hover:bg-[#A78BFA] hover:text-white">
              {collapsed ? '>' : '<'}
            </button>
          </div>

          <div className="mt-5 space-y-1">
            {tabs.map((t) => {
              const active = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className={'w-full flex items-center gap-2 px-2 h-[42px] rounded-xl transition-all overflow-hidden ' + (active ? 'bg-[#A78BFA] text-white shadow' : 'hover:bg-[#F5F3FF] text-black/60 hover:text-black')}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: active ? 'rgba(255,255,255,0.25)' : t.color + '15', color: active ? 'white' : t.color }}>
                    {t.letter}
                  </div>
                  {!collapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-[11px] font-bold truncate">{t.label}</div>
                      <div className="text-[9px] opacity-50 truncate">{t.desc}</div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-3 border-t border-black/5 space-y-2 bg-white">
          <button onClick={toggleLang} className="w-full h-[34px] rounded-full bg-[#F5F3FF] border border-[#A78BFA]/20 text-[10px] font-bold text-[#7C3AED] hover:bg-[#A78BFA] hover:text-white">
            {collapsed ? 'EN' : T.langBtn}
          </button>

          <div className={'flex items-center gap-2 ' + (collapsed ? 'justify-center' : '')}>
            <div className="w-8 h-8 rounded-full bg-[#A78BFA] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
              {user ? user[0].toUpperCase() : '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex gap-1">
                    <input value={tempName} onChange={(e) => setTempName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveName()} className="flex-1 min-w-0 h-[24px] rounded-full border px-2 text-[10px] outline-none" autoFocus />
                    <button onClick={saveName} className="w-6 h-6 rounded-full bg-[#A78BFA] text-white text-[10px]">✓</button>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold truncate flex items-center gap-1">
                      <span className="truncate">{user || T.editName}</span>
                      <button onClick={() => { setEditingName(true); setTempName(user) }} className="opacity-30 text-[9px]">✎</button>
                    </div>
                    <div className="text-[8px] opacity-40">{T.premium}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={logout} className="w-full h-[32px] rounded-full border text-[10px] font-bold hover:bg-black hover:text-white">
            {collapsed ? '↪' : T.logout}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className={'flex-1 min-w-0 ' + mainMl + ' transition-all duration-300'}>
        <div className="h-[52px] px-4 flex items-center justify-between bg-white border-b border-[#A78BFA]/10 sticky top-0 z-20 gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="dd relative">
              <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowNotif(false) }} className="w-8 h-8 rounded-full bg-[#F5F3FF] border flex items-center justify-center text-[11px]">⚙</button>
              {showSettings && (
                <div className="absolute top-[40px] left-0 w-[200px] bg-white rounded-xl border shadow-xl p-3 z-50">
                  <div className="font-bold text-[11px]">{T.settings}</div>
                  <div className="text-[9px] opacity-50 mt-1">{T.language}</div>
                  <button onClick={toggleLang} className="mt-2 w-full h-[34px] rounded-full bg-[#F5F3FF] border text-[11px] font-bold">{T.langBtn}</button>
                  <button onClick={() => setShowSettings(false)} className="mt-2 w-full h-[30px] rounded-full bg-black text-white text-[10px]">{T.close}</button>
                </div>
              )}
            </div>
            <div className="dd relative">
              <button onClick={(e) => { e.stopPropagation(); setShowNotif(!showNotif); setShowSettings(false) }} className="w-8 h-8 rounded-full bg-[#F5F3FF] border flex items-center justify-center text-[11px]">🔔</button>
              {showNotif && (
                <div className="absolute top-[40px] left-0 w-[240px] bg-white rounded-xl border shadow-xl p-3 z-50">
                  <div className="font-bold text-[11px]">{T.notif}</div>
                  <div className="mt-2 text-[10px] p-2 rounded-lg bg-[#F5F3FF]">{T.notif1}</div>
                  <button onClick={() => setShowNotif(false)} className="mt-2 w-full h-[30px] rounded-full bg-black text-white text-[10px]">{T.close}</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 max-w-[320px] min-w-0">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T.search} className="w-full h-[34px] rounded-full bg-[#F5F3FF] border border-[#A78BFA]/10 px-4 text-[11px] outline-none focus:bg-white focus:border-[#A78BFA]" />
          </div>

          <div className="w-7 h-7 rounded-full bg-[#A78BFA] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            {user ? user[0].toUpperCase() : '?'}
          </div>
        </div>

        <div className="p-4 lg:p-5 min-w-0 overflow-x-hidden">
          {tab === 'home' && <HomeView T={T} isAr={isAr} setTab={setTab} />}
          {tab === 'ai' && <AIView T={T} isAr={isAr} />}
          {tab === 'notebook' && <NotebookView T={T} />}
          {tab === 'library' && <LibraryView T={T} isAr={isAr} />}
          {tab === 'slides' && <SlidesView T={T} />}
          {tab === 'khazna' && <KhaznaView T={T} />}
          {tab === 'tasks' && <TasksView T={T} search={search} isAr={isAr} />}
          {tab === 'pomo' && <PomoView T={T} isAr={isAr} />}
          {tab === 'flash' && <FlashView T={T} isAr={isAr} />}
          {tab === 'exam' && <ExamView T={T} isAr={isAr} />}
        </div>
      </div>
    </div>
  )
}

function HomeView({ T, isAr, setTab }) {
  return (
    <div className="min-w-0">
      <h1 className="text-[20px] font-extrabold">{T.dashboard}</h1>
      <p className="text-[11px] opacity-60 mt-1">{T.welcome} • {new Date().toLocaleDateString(isAr ? 'ar-LY' : 'en-US')}</p>

      <div className="mt-4 grid lg:grid-cols-3 gap-3">
        <div className="rounded-xl bg-[#EDE9FE] border border-[#A78BFA]/20 p-4 min-w-0">
          <div className="flex justify-between items-center"><div className="font-bold text-[12px]">{T.aiChat}</div><span className="text-[9px] px-2 py-1 rounded-full bg-white border">25</span></div>
          <div className="mt-3 bg-white rounded-lg p-3 text-[10px] leading-5 truncate">{isAr ? 'التنفس الخلوي يحول الجلوكوز...' : 'Cellular respiration converts glucose...'}</div>
          <button onClick={() => setTab('ai')} className="mt-3 w-full h-[30px] rounded-full bg-white border text-[10px] font-bold">{T.open} ↗</button>
        </div>
        <div className="rounded-xl bg-white border p-4 min-w-0">
          <div className="font-bold text-[12px]">{T.tasks} - 3/6</div>
          <div className="mt-3 space-y-2 text-[11px]">
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[8px]">✓</span><span className="truncate">{T.review}</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border"></span><span className="truncate">{isAr ? 'واجب رياضيات' : 'Math Worksheet'}</span></div>
          </div>
          <button onClick={() => setTab('tasks')} className="mt-3 w-full h-[30px] rounded-full bg-[#F5F3FF] text-[10px] font-bold">+ {isAr ? 'مهمة' : 'Task'}</button>
        </div>
        <div className="rounded-xl bg-white border p-4 text-center min-w-0">
          <div className="font-bold text-[12px]">{T.pomodoro}</div>
          <div className="text-[28px] font-extrabold text-[#5B21B6]">24:00</div>
          <button onClick={() => setTab('pomo')} className="mt-2 w-full h-[30px] rounded-full bg-[#5B21B6] text-white text-[10px] font-bold">{T.start}</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => setTab('flash')} className="rounded-xl bg-white border p-3 text-left min-w-0"><div className="text-[10px] font-bold truncate">{T.flashcards}</div><div className="font-bold">124</div></button>
        <button onClick={() => setTab('library')} className="rounded-xl bg-white border p-3 text-left min-w-0"><div className="text-[10px] font-bold truncate">{T.library}</div><div className="font-bold">36</div></button>
        <button onClick={() => setTab('notebook')} className="rounded-xl bg-white border p-3 text-left min-w-0"><div className="text-[10px] font-bold truncate">{T.notebook}</div><div className="font-bold">8</div></button>
        <button onClick={() => setTab('slides')} className="rounded-xl bg-white border p-3 text-left min-w-0"><div className="text-[10px] font-bold truncate">{T.slides}</div><div className="font-bold">3</div></button>
      </div>
    </div>
  )
}

function AIView({ T, isAr }) {
  const [msgs, setMsgs] = useState([{ role: 'a', text: isAr ? 'هلا والله! أنا رفيق' : 'Hello! I am Rafeaq' }])
  const [inp, setInp] = useState('')
  const ref = useRef(null)
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])
  function send() {
    const u = inp.trim()
    if (!u) return
    setMsgs([...msgs, { role: 'u', text: u }])
    setInp('')
    setTimeout(() => setMsgs((m) => [...m, { role: 'a', text: (isAr ? 'تمام: ' : 'Got: ') + u }]), 300)
  }
  return (
    <div className="max-w-[600px] mx-auto min-w-0">
      <div className="bg-white rounded-2xl border p-4">
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={'flex ' + (m.role === 'u' ? 'justify-end' : 'justify-start')}>
              <div className={'max-w-[80%] rounded-xl px-3 py-2 text-[11px] ' + (m.role === 'u' ? 'bg-[#A78BFA] text-white' : 'bg-[#F8F7FF] border')}>{m.text}</div>
            </div>
          ))}
          <div ref={ref}></div>
        </div>
        <div className="mt-3 flex gap-2">
          <input value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={T.search} className="flex-1 h-[36px] rounded-full border px-4 text-[11px] outline-none" />
          <button onClick={send} className="w-9 h-9 rounded-full bg-[#A78BFA] text-white">↑</button>
        </div>
      </div>
    </div>
  )
}

function TasksView({ T, search, isAr }) {
  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem('rafeaq_tasks') || '[]') } catch { return [] } })
  useEffect(() => { localStorage.setItem('rafeaq_tasks', JSON.stringify(tasks)) }, [tasks])
  function add() {
    const t = prompt(isAr ? 'اكتب المهمة؟' : 'Task?')
    if (!t) return
    setTasks([...tasks, { id: Date.now(), title: t, done: false }])
  }
  const filtered = tasks.filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="max-w-[500px] mx-auto min-w-0">
      <div className="flex justify-between mb-3"><h2 className="font-bold">{T.tasks} ({filtered.length})</h2><button onClick={add} className="h-[32px] px-3 rounded-full bg-[#A78BFA] text-white text-[10px]">+ {isAr ? 'مهمة' : 'Task'}</button></div>
      {filtered.length === 0 && <div className="text-center py-8 opacity-40 text-[11px]">{T.noTasks}</div>}
      <div className="bg-white rounded-xl border p-3 space-y-2">
        {filtered.map((t) => (
          <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F7FF] border min-w-0">
            <button onClick={() => setTasks(tasks.map((v) => v.id === t.id ? { ...v, done: !v.done } : v))} className={'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ' + (t.done ? 'bg-[#A78BFA] text-white' : '')}>{t.done ? '✓' : ''}</button>
            <span className="flex-1 text-[11px] truncate">{t.title}</span>
            <button onClick={() => setTasks(tasks.filter((v) => v.id !== t.id))} className="opacity-30 text-[10px]">X</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function LibraryView({ T, isAr }) {
  const [books, setBooks] = useState(() => { try { return JSON.parse(localStorage.getItem('rafeaq_books') || '[]') } catch { return [] } })
  const URL = 'https://www.al-amgaad.com/2021/08/allbooks.html'
  function onFile(e) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((f) => {
      const r = new FileReader()
      r.onload = () => {
        const b = { id: Date.now() + Math.random(), name: f.name.replace('.pdf', ''), data: r.result }
        const cur = JSON.parse(localStorage.getItem('rafeaq_books') || '[]')
        const nb = [...cur, b]
        setBooks(nb)
        localStorage.setItem('rafeaq_books', JSON.stringify(nb))
      }
      r.readAsDataURL(f)
    })
    e.target.value = ''
  }
  return (
    <div className="max-w-[800px] mx-auto min-w-0 space-y-3">
      <div className="bg-white rounded-xl border p-3 flex justify-between gap-2">
        <h3 className="font-bold text-[12px] truncate">{T.library} - {books.length}</h3>
        <label className="h-[30px] px-3 rounded-full bg-[#A78BFA] text-white text-[10px] flex items-center cursor-pointer shrink-0">+ PDF<input type="file" accept="application/pdf" multiple onChange={onFile} className="hidden" /></label>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {books.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border p-2 min-w-0">
            <div className="h-[50px] bg-[#F5F3FF] rounded-lg flex items-center justify-center text-[9px]">PDF</div>
            <div className="text-[10px] font-bold mt-1 truncate">{b.name}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border overflow-hidden"><iframe src={URL} title="books" className="w-full h-[400px] border-0"></iframe></div>
    </div>
  )
}

function NotebookView({ T }) {
  const [sources, setSources] = useState(() => { try { return JSON.parse(localStorage.getItem('rafeaq_sources') || '[]') } catch { return [] } })
  const [note, setNote] = useState('')
  function add() {
    if (!note.trim()) return
    const ns = [...sources, { id: Date.now(), title: note.slice(0, 30) }]
    setSources(ns)
    localStorage.setItem('rafeaq_sources', JSON.stringify(ns))
    setNote('')
  }
  return (
    <div className="grid grid-cols-[200px_1fr] gap-3 max-w-[800px] mx-auto min-w-0">
      <div className="bg-white rounded-xl border p-3 min-w-0"><h3 className="font-bold text-[11px]">Sources ({sources.length})</h3><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Paste..." className="mt-2 w-full h-[60px] rounded-lg border p-2 text-[10px]" /><button onClick={add} className="mt-2 w-full h-[28px] rounded-full bg-[#A78BFA] text-white text-[10px]">Add</button></div>
      <div className="bg-white rounded-xl border p-4 min-w-0"><h3 className="font-bold text-[12px]">{T.notebook}</h3></div>
    </div>
  )
}

function SlidesView({ T }) {
  const [slides, setSlides] = useState(() => { try { return JSON.parse(localStorage.getItem('rafeaq_slides') || '[{"t":"Hello","c":""}]') } catch { return [{ t: 'Hello', c: '' }] } })
  const [idx, setIdx] = useState(0)
  useEffect(() => { localStorage.setItem('rafeaq_slides', JSON.stringify(slides)) }, [slides])
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 max-w-[800px] mx-auto min-w-0">
      <div className="bg-white rounded-xl border p-2 min-w-0">{slides.map((s, i) => (<button key={i} onClick={() => setIdx(i)} className={'w-full p-2 rounded-lg text-[10px] text-left mb-1 truncate ' + (i === idx ? 'bg-[#A78BFA] text-white' : 'bg-[#F5F3FF]')}>{s.t}</button>))}<button onClick={() => { setSlides([...slides, { t: 'New', c: '' }]); setIdx(slides.length) }} className="w-full h-[26px] rounded-full bg-black/5 text-[9px]">+ Slide</button></div>
      <div className="bg-white rounded-xl border p-3 min-w-0"><input value={slides[idx] ? slides[idx].t : ''} onChange={(e) => { const n = [...slides]; n[idx].t = e.target.value; setSlides(n) }} className="font-bold text-[13px] w-full outline-none" /><textarea value={slides[idx] ? slides[idx].c : ''} onChange={(e) => { const n = [...slides]; n[idx].c = e.target.value; setSlides(n) }} className="mt-2 w-full h-[200px] outline-none text-[11px]" /></div>
    </div>
  )
}

function KhaznaView({ T }) {
  const [files, setFiles] = useState(() => { try { return JSON.parse(localStorage.getItem('rafeaq_khazna') || '[]') } catch { return [] } })
  function onFile(e) {
    const fs = e.target.files
    if (!fs) return
    Array.from(fs).forEach((f) => {
      const r = new FileReader()
      r.onload = () => {
        const file = { id: Date.now() + Math.random(), name: f.name }
        const cur = JSON.parse(localStorage.getItem('rafeaq_khazna') || '[]')
        const nb = [...cur, file]
        setFiles(nb)
        localStorage.setItem('rafeaq_khazna', JSON.stringify(nb))
      }
      r.readAsDataURL(f)
    })
    e.target.value = ''
  }
  return (
    <div className="max-w-[600px] mx-auto min-w-0"><div className="bg-white rounded-xl border p-3 flex justify-between gap-2"><h3 className="font-bold text-[12px] truncate">{T.khazna} - {files.length}</h3><label className="h-[28px] px-3 rounded-full bg-[#A78BFA] text-white text-[9px] flex items-center cursor-pointer shrink-0">+ Upload<input type="file" multiple onChange={onFile} className="hidden" /></label></div><div className="mt-2 grid grid-cols-3 gap-2">{files.map((f) => (<div key={f.id} className="bg-white rounded-lg border p-2 min-w-0"><div className="text-[9px] font-bold truncate">{f.name}</div></div>))}</div></div>
  )
}

function PomoView({ T, isAr }) {
  const [work, setWork] = useState(25)
  const [brk, setBrk] = useState(5)
  const [sec, setSec] = useState(25 * 60)
  const [run, setRun] = useState(false)
  const [mode, setMode] = useState('work')
  const ref = useRef(null)
  useEffect(() => { setSec(work * 60) }, [work])
  useEffect(() => {
    if (!run) return
    ref.current = setInterval(() => {
      setSec((s) => {
        if (s <= 1) {
          const nm = mode === 'work' ? 'break' : 'work'
          setMode(nm)
          return nm === 'work' ? work * 60 : brk * 60
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [run, mode, work, brk])
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return (
    <div className="max-w-[360px] mx-auto space-y-3 min-w-0">
      <div className="bg-white rounded-xl border p-3 flex gap-3 justify-center">
        <div className="flex items-center gap-1"><span className="text-[9px]">{T.work}</span><input type="number" value={work} onChange={(e) => setWork(Math.max(1, parseInt(e.target.value) || 1))} className="w-[44px] h-[26px] rounded-full border px-2 text-[10px] text-center" /></div>
        <div className="flex items-center gap-1"><span className="text-[9px]">{T.break}</span><input type="number" value={brk} onChange={(e) => setBrk(Math.max(1, parseInt(e.target.value) || 1))} className="w-[44px] h-[26px] rounded-full border px-2 text-[10px] text-center" /></div>
      </div>
      <div className="bg-white rounded-2xl border p-5 text-center">
        <div className="text-[11px] opacity-40">{mode === 'work' ? (isAr ? 'تركيز' : 'FOCUS') : (isAr ? 'راحة' : 'BREAK')}</div>
        <div className="text-[36px] font-bold">{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</div>
        <div className="mt-3 flex gap-2 justify-center">
          <button onClick={() => setRun(!run)} className="h-[32px] px-5 rounded-full bg-[#A78BFA] text-white font-bold text-[11px]">{run ? T.pause : T.start}</button>
          <button onClick={() => { setRun(false); setSec(work * 60) }} className="h-[32px] px-4 rounded-full bg-black/5 text-[11px]">{T.reset}</button>
        </div>
      </div>
    </div>
  )
}

function FlashView({ T, isAr }) {
  const [cards, setCards] = useState(() => { try { return JSON.parse(localStorage.getItem('rafeaq_flash') || '[]') } catch { return [] } })
  function add() {
    const q = prompt(isAr ? 'السؤال؟' : 'Question?')
    if (!q) return
    const a = prompt(isAr ? 'الجواب؟' : 'Answer?')
    if (!a) return
    setCards([...cards, { q, a }])
  }
  useEffect(() => { localStorage.setItem('rafeaq_flash', JSON.stringify(cards)) }, [cards])
  return (
    <div className="max-w-[400px] mx-auto min-w-0"><div className="flex justify-between mb-3"><h3 className="font-bold text-[13px]">{T.flashcards}</h3><button onClick={add} className="h-[30px] px-3 rounded-full bg-[#A78BFA] text-white text-[10px]">+ {isAr ? 'بطاقة' : 'Card'}</button></div><div className="space-y-2">{cards.map((c, i) => (<div key={i} className="bg-white rounded-xl border p-3 min-w-0"><div className="font-bold text-[11px] truncate">{c.q}</div><div className="text-[10px] opacity-60 truncate">{c.a}</div></div>))}</div></div>
  )
}

function ExamView({ T, isAr }) {
  const [exams, setExams] = useState(() => { try { return JSON.parse(localStorage.getItem('rafeaq_exams') || '[]') } catch { return [] } })
  function add() {
    const n = prompt(isAr ? 'اسم الامتحان؟' : 'Exam name?')
    if (!n) return
    const d = prompt('YYYY-MM-DD')
    if (!d) return
    setExams([...exams, { id: Date.now(), name: n, date: d }])
  }
  function editDate(id) {
    const nd = prompt('YYYY-MM-DD')
    if (!nd) return
    setExams(exams.map((e) => e.id === id ? { ...e, date: nd } : e))
  }
  useEffect(() => { localStorage.setItem('rafeaq_exams', JSON.stringify(exams)) }, [exams])
  return (
    <div className="max-w-[400px] mx-auto min-w-0"><div className="flex justify-between mb-3"><h3 className="font-bold text-[13px]">{T.exams}</h3><button onClick={add} className="h-[30px] px-3 rounded-full bg-[#A78BFA] text-white text-[10px]">+ {isAr ? 'امتحان' : 'Exam'}</button></div><div className="space-y-2">{exams.map((ex) => {
      const diff = Math.ceil((new Date(ex.date) - new Date()) / (1000 * 60 * 60 * 24))
      return (<div key={ex.id} className="bg-white rounded-xl border p-3 flex justify-between items-center gap-2 min-w-0"><div className="min-w-0"><div className="font-bold text-[11px] truncate">{ex.name}</div><div className="text-[9px] opacity-50 flex items-center gap-1 truncate">{ex.date}<button onClick={() => editDate(ex.id)} className="px-2 py-0.5 rounded-full bg-[#F5F3FF] border text-[#7C3AED] text-[8px]">{T.edit}</button></div></div><div className="text-[14px] font-bold text-[#A78BFA] shrink-0">{diff}{isAr ? 'يوم' : 'd'}</div></div>)
    })}</div></div>
  )
}