import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { answerFromSources, deleteDeviceFile, extractPdfText, getDeviceFile, listDeviceFiles, saveDeviceFile } from '../lib/deviceStorage.js'

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
    { id: 'home', label: T.home, icon: 'H', desc: T.overview },
    { id: 'ai', label: T.aiChat, icon: 'AI', desc: T.aiChats },
    { id: 'notebook', label: T.notebook, icon: 'N', desc: 'NotebookLM' },
    { id: 'library', label: T.library, icon: 'L', desc: T.curriculum },
    { id: 'slides', label: T.slides, icon: 'S', desc: 'PowerPoint' },
    { id: 'khazna', label: T.khazna, icon: 'K', desc: isAr ? 'مساحتك الشخصية' : 'Personal space' },
    { id: 'tasks', label: T.tasks, icon: 'T', desc: T.myTasks },
    { id: 'pomo', label: T.pomodoro, icon: 'P', desc: T.focus },
    { id: 'flash', label: T.flashcards, icon: 'F', desc: T.smartReview },
    { id: 'exam', label: T.exams, icon: 'E', desc: T.countdown }
  ]

  useEffect(function() {
    const u = localStorage.getItem('rafeaq_user') || ''
    setUser(u)
    setTempName(u)
    const savedLang = localStorage.getItem('rafeaq_lang')
    if (savedLang) setLang(savedLang)
    function onDocClick(e) {
      if (!e.target.closest('.dd')) {
        setShowNotif(false)
        setShowSettings(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return function() { document.removeEventListener('click', onDocClick) }
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
  }
  function logout() {
    localStorage.removeItem('rafeaq_token')
    localStorage.removeItem('rafeaq_user')
    nav('/login')
  }

  const sideW = collapsed ? 'w-[72px]' : 'w-[280px]'
  const mainMr = collapsed ? 'mr-[72px]' : 'mr-[280px]'

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex overflow-x-hidden text-[#0E1217]" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap'); *{font-family:'IBM Plex Sans Arabic',sans-serif}"}</style>

      <div className={sideW + " bg-[#0E1217] border-l border-[#1E242E] fixed right-0 top-0 h-screen z-30 flex flex-col justify-between transition-all duration-300"}>
        <div className="p-5 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-[#F5F3EF] text-[#0E1217] flex items-center justify-center font-bold text-[15px] shrink-0">ر</div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] text-[#F5F3EF]">رفيق</div>
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[#5A6372] -mt-0.5">Rafeaq OS - الرسمية</div>
                </div>
              )}
            </div>
            <button onClick={function(){ setCollapsed(!collapsed) }} className="w-7 h-7 rounded-[6px] bg-[#1E242E] border border-[#252E3D] flex items-center justify-center text-[11px] text-[#8A919E] hover:text-white shrink-0">
              {collapsed ? '>' : '<'}
            </button>
          </div>
          {!collapsed && (
            <div className="mt-6 px-1">
              <div className="h-px bg-[#1E242E]"></div>
              <div className="mt-4 text-[10px] tracking-[0.15em] uppercase text-[#5A6372] font-semibold">المنصة التعليمية</div>
            </div>
          )}
          <div className="mt-6 space-y-1">
            {tabs.map(function(t) {
              const active = tab === t.id
              return (
                <button key={t.id} onClick={function(){ setTab(t.id) }} className={"w-full flex items-center gap-3 px-3 h-[40px] rounded-[8px] transition-all overflow-hidden text-right " + (active ? 'bg-[#1E242E] text-[#F5F3EF] border border-[#252E3D]' : 'text-[#8A919E] hover:text-[#F5F3EF] hover:bg-[#151A23]')}>
                  <div className={"w-7 h-7 rounded-[6px] flex items-center justify-center text-[12px] shrink-0 " + (active ? 'bg-[#F5F3EF] text-[#0E1217]' : 'bg-[#1A1F2B] text-[#8A919E]')}>
                    {t.icon}
                  </div>
                  {!collapsed && (
                    <div className="flex-1 text-right min-w-0">
                      <div className="text-[12px] font-medium truncate">{t.label}</div>
                      <div className="text-[10px] opacity-60 truncate">{t.desc}</div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div className="p-4 border-t border-[#1E242E] space-y-3 bg-[#0E1217]">
          <button onClick={toggleLang} className="w-full h-[34px] rounded-[8px] bg-[#151A23] border border-[#1E242E] text-[11px] font-medium text-[#8A919E] hover:text-[#F5F3EF]">
            {collapsed ? 'EN' : T.langBtn}
          </button>
          <div className={"flex items-center gap-3 p-2.5 rounded-[10px] bg-[#151A23] border border-[#1E242E] " + (collapsed ? 'justify-center' : '')}>
            <div className="w-8 h-8 rounded-[8px] bg-[#F5F3EF] text-[#0E1217] flex items-center justify-center font-bold text-[11px] shrink-0">
              {user ? user[0].toUpperCase() : '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex gap-1">
                    <input value={tempName} onChange={function(e){ setTempName(e.target.value) }} onKeyDown={function(e){ if(e.key === 'Enter') saveName() }} className="flex-1 min-w-0 h-[26px] rounded-[6px] bg-[#0E1217] border border-[#252E3D] px-2 text-[11px] text-white outline-none" autoFocus />
                    <button onClick={saveName} className="w-6 h-6 rounded-[6px] bg-white text-black text-[10px]">✓</button>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-[#F5F3EF] truncate flex items-center gap-1">
                      <span className="truncate">{user || T.editName}</span>
                      <button onClick={function(){ setEditingName(true); setTempName(user) }} className="opacity-40 text-[10px]">✎</button>
                    </div>
                    <div className="text-[10px] text-[#5A6372]">{T.premium}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={logout} className="w-full h-[34px] rounded-[8px] bg-transparent border border-[#1E242E] text-[11px] font-medium text-[#8A919E] hover:bg-[#1E242E] hover:text-white">
            {collapsed ? 'X' : T.logout}
          </button>
          <div className="text-[9px] text-[#3A424E] text-center">© 2026 رفيق - منصة رسمية</div>
        </div>
      </div>

      <div className={"flex-1 min-w-0 " + mainMr + " transition-all duration-300"}>
        <div className="h-[60px] px-6 flex items-center justify-between bg-[#FFFFFF] border-b border-[#E8E6E1] sticky top-0 z-20 gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <div className="dd relative">
              <button onClick={function(e){ e.stopPropagation(); setShowSettings(!showSettings); setShowNotif(false) }} className="w-8 h-8 rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] flex items-center justify-center text-[13px] text-[#5A6372] hover:bg-[#0E1217] hover:text-white">⚙</button>
              {showSettings && (
                <div className="absolute top-[44px] right-0 w-[240px] bg-white rounded-[12px] border border-[#E8E6E1] shadow-lg p-4 z-50">
                  <div className="text-[10px] tracking-[0.15em] uppercase text-[#8A919E] font-semibold">{T.settings}</div>
                  <div className="text-[11px] text-[#5A6372] mt-3">{T.language}</div>
                  <button onClick={toggleLang} className="mt-2 w-full h-[36px] rounded-[8px] bg-[#0E1217] text-white text-[12px] font-medium">{T.langBtn}</button>
                  <button onClick={function(){ setShowSettings(false) }} className="mt-2 w-full h-[32px] rounded-[8px] bg-[#F7F5F3] border text-[11px]">{T.close}</button>
                </div>
              )}
            </div>
            <div className="dd relative">
              <button onClick={function(e){ e.stopPropagation(); setShowNotif(!showNotif); setShowSettings(false) }} className="w-8 h-8 rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] flex items-center justify-center text-[13px]">!</button>
              {showNotif && (
                <div className="absolute top-[44px] right-0 w-[280px] bg-white rounded-[12px] border border-[#E8E6E1] shadow-lg p-4 z-50">
                  <div className="text-[11px] font-semibold">{T.notif}</div>
                  <div className="mt-3 text-[12px] p-3 rounded-[8px] bg-[#F7F5F3] border">{T.notif1}</div>
                  <button onClick={function(){ setShowNotif(false) }} className="mt-3 w-full h-[32px] rounded-[8px] bg-[#0E1217] text-white text-[11px]">{T.close}</button>
                </div>
              )}
            </div>
            <div className="h-4 w-px bg-[#E8E6E1] hidden md:block"></div>
            <div className="hidden md:block">
              <div className="text-[12px] font-semibold">{T.dashboard}</div>
              <div className="text-[11px] text-[#8A919E]">{T.welcome}</div>
            </div>
          </div>
          <div className="flex-1 max-w-[360px] min-w-0 hidden md:block">
            <div className="relative">
              <input value={search} onChange={function(e){ setSearch(e.target.value) }} placeholder={T.search} className="w-full h-[36px] rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] pr-4 pl-9 text-[12px] outline-none focus:bg-white focus:border-[#0E1217]" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A919E] text-[12px]">⌕</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#8A919E]">
              <span>{new Date().toLocaleDateString(isAr ? 'ar-LY' : 'en-GB')}</span>
              <span className="w-1 h-1 bg-[#8A919E] rounded-full"></span>
              <span className="text-[#0E1217] font-medium">طرابلس</span>
            </div>
            <div className="w-8 h-8 rounded-[8px] bg-[#0E1217] text-white flex items-center justify-center text-[11px] font-bold">
              {user ? user[0].toUpperCase() : '?'}
            </div>
          </div>
        </div>
        <div className="md:hidden p-4 bg-white border-b border-[#E8E6E1]">
          <input value={search} onChange={function(e){ setSearch(e.target.value) }} placeholder={T.search} className="w-full h-[40px] rounded-[10px] bg-[#F7F5F3] border border-[#E8E6E1] px-4 text-[13px] outline-none" />
        </div>
        <div className="p-5 lg:p-7 min-w-0 overflow-x-hidden max-w-[1280px] mx-auto w-full">
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
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-[28px] font-bold text-[#0E1217]">لوحة التحكم</h1>
        <div className="h-px flex-1 bg-[#E8E6E1]"></div>
        <span className="text-[11px] text-[#8A919E]">{new Date().toLocaleDateString(isAr ? 'ar-LY' : 'en-US')}</span>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-[12px] bg-[#0E1217] border border-[#1E242E] p-5 text-white min-w-0">
          <div className="flex justify-between">
            <div className="text-[11px] tracking-[0.15em] uppercase text-[#8A919E] font-semibold">{T.aiChat}</div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#1E242E] border">25 / يوم</span>
          </div>
          <div className="mt-4 bg-[#151A23] rounded-[8px] p-3 text-[12px] leading-6 text-[#C2C8D1] border border-[#1E242E] truncate">{isAr ? 'التنفس الخلوي يحول الجلوكوز...' : 'Cellular respiration...'}</div>
          <button onClick={function(){ setTab('ai') }} className="mt-4 w-full h-[36px] rounded-[8px] bg-white text-black text-[12px] font-semibold">فتح →</button>
        </div>
        <div className="rounded-[12px] bg-white border border-[#E8E6E1] p-5 min-w-0">
          <div className="flex justify-between">
            <div className="text-[11px] tracking-[0.15em] uppercase text-[#8A919E] font-semibold">{T.tasks} - 3/6</div>
          </div>
          <div className="mt-4 space-y-2.5 text-[12px]">
            <div className="flex items-center gap-2.5"><span className="w-5 h-5 rounded-full bg-[#0E1217] text-white flex items-center justify-center text-[9px]">✓</span><span className="truncate">{T.review}</span></div>
            <div className="flex items-center gap-2.5"><span className="w-5 h-5 rounded-full border border-[#E8E6E1]"></span><span className="truncate text-[#5A6372]">{isAr ? 'واجب رياضيات' : 'Math Worksheet'}</span></div>
          </div>
          <button onClick={function(){ setTab('tasks') }} className="mt-5 w-full h-[36px] rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] text-[12px] font-medium hover:bg-[#0E1217] hover:text-white">+ {isAr ? 'مهمة جديدة' : 'New Task'}</button>
        </div>
        <div className="rounded-[12px] bg-white border border-[#E8E6E1] p-5 text-center min-w-0 flex flex-col">
          <div className="text-[11px] tracking-[0.15em] uppercase text-[#8A919E] font-semibold">{T.pomodoro}</div>
          <div className="mt-3 text-[36px] font-semibold">24:00</div>
          <div className="text-[11px] text-[#8A919E] mt-1">{T.focus}</div>
          <div className="mt-auto pt-5"><button onClick={function(){ setTab('pomo') }} className="w-full h-[36px] rounded-[8px] bg-[#0E1217] text-white text-[12px] font-medium">{T.start}</button></div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={function(){ setTab('flash') }} className="rounded-[12px] bg-white border border-[#E8E6E1] p-4 text-right hover:border-[#0E1217] text-left min-w-0 group">
          <div className="flex justify-between items-center"><div className="text-[11px] text-[#8A919E]">{T.flashcards}</div><span className="group-hover:text-[#0E1217]">↗</span></div>
          <div className="text-[22px] font-semibold mt-2">124</div>
          <div className="text-[11px] text-[#5A6372] mt-1">{T.smartReview}</div>
        </button>
        <button onClick={function(){ setTab('library') }} className="rounded-[12px] bg-white border border-[#E8E6E1] p-4 text-right hover:border-[#0E1217] text-left min-w-0 group">
          <div className="flex justify-between"><div className="text-[11px] text-[#8A919E]">{T.library}</div><span className="group-hover:text-[#0E1217]">↗</span></div>
          <div className="text-[22px] font-semibold mt-2">36</div>
          <div className="text-[11px] text-[#5A6372] mt-1">{T.curriculum}</div>
        </button>
        <button onClick={function(){ setTab('notebook') }} className="rounded-[12px] bg-white border border-[#E8E6E1] p-4 text-right hover:border-[#0E1217] min-w-0 group">
          <div className="flex justify-between"><div className="text-[11px] text-[#8A919E]">{T.notebook}</div><span className="group-hover:text-[#0E1217]">↗</span></div>
          <div className="text-[22px] font-semibold mt-2">8</div>
          <div className="text-[11px] text-[#5A6372] mt-1">PDF sources</div>
        </button>
        <button onClick={function(){ setTab('slides') }} className="rounded-[12px] bg-white border border-[#E8E6E1] p-4 text-right hover:border-[#0E1217] min-w-0 group">
          <div className="flex justify-between"><div className="text-[11px] text-[#8A919E]">{T.slides}</div><span className="group-hover:text-[#0E1217]">↗</span></div>
          <div className="text-[22px] font-semibold mt-2">3</div>
          <div className="text-[11px] text-[#5A6372] mt-1">Presentations</div>
        </button>
      </div>
    </div>
  )
}

function AIView({ T }) {
  const today = new Date().toISOString().slice(0, 10)
  const [history, setHistory] = useState(function(){ try { return JSON.parse(localStorage.getItem('rafeaq_ai_history') || '[]') } catch(e){ return [] } }())
  const [msgs, setMsgs] = useState(function(){ try { return JSON.parse(localStorage.getItem('rafeaq_ai_messages') || '[{"role":"a","text":"هلا! أنا رفيق، نقدر نشرح ونلخص ونرتب لك خطة مذاكرة."}]') } catch(e){ return [] } }())
  const [inp, setInp] = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)
  const used = history.filter(function(d){ return d === today }).length
  const remaining = Math.max(0, 25 - used)
  useEffect(function(){ localStorage.setItem('rafeaq_ai_messages', JSON.stringify(msgs)); if(ref.current) ref.current.scrollIntoView({ behavior: 'smooth' }) }, [msgs])
  function localReply(q) { if (/لخص/.test(q)) return 'أرسل النص وسألخصه.'; return 'اكتب المادة وحدد شرح أو تلخيص.' }
  async function send() {
    const text = inp.trim()
    if (!text || busy || remaining === 0) return
    const nextHistory = history.concat([today])
    setHistory(nextHistory); localStorage.setItem('rafeaq_ai_history', JSON.stringify(nextHistory))
    setMsgs(function(m){ return m.concat([{ role: 'u', text: text }]) }); setInp(''); setBusy(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) })
      const data = await res.json()
      setMsgs(function(m){ return m.concat([{ role: 'a', text: data.reply || localReply(text) }]) })
    } catch(e) { setMsgs(function(m){ return m.concat([{ role: 'a', text: localReply(text) }]) }) }
    finally { setBusy(false) }
  }
  return (
    <div className="max-w-[760px] mx-auto min-w-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold">رفيق AI</h1>
          <p className="text-[12px] text-[#8A919E] mt-1">مساعدك الدراسي الرسمي</p>
        </div>
        <div className="px-3 py-2 rounded-full bg-white border border-[#E8E6E1] text-[11px] font-medium">{remaining} من 25 اليوم</div>
      </div>
      <div className="bg-white rounded-[12px] border border-[#E8E6E1] p-4">
        <div className="space-y-3 h-[420px] overflow-y-auto p-1">
          {msgs.map(function(m,i){ return (<div key={i} className={"flex " + (m.role==='u'?'justify-end':'justify-start')}><div className={"max-w-[82%] rounded-[10px] px-4 py-3 text-[13px] leading-6 " + (m.role==='u'?'bg-[#0E1217] text-white':'bg-[#F7F5F3] border border-[#E8E6E1]')}>{m.text}</div></div>) })}
          {busy && <div className="text-[11px] text-[#8A919E] px-3">رفيق يجهز الرد...</div>}
          <div ref={ref}></div>
        </div>
        <div className="mt-4 flex gap-2">
          <input value={inp} onChange={function(e){ setInp(e.target.value) }} onKeyDown={function(e){ if(e.key==='Enter') send() }} disabled={remaining===0} placeholder={remaining ? 'اكتب سؤالك الدراسي هنا...' : 'اكتملت محادثات اليوم'} className="flex-1 h-[44px] rounded-[8px] border border-[#E8E6E1] bg-[#F7F5F3] px-4 text-[13px] outline-none focus:bg-white focus:border-[#0E1217]" />
          <button onClick={send} disabled={!inp.trim()||busy||remaining===0} className="w-11 h-11 rounded-[8px] bg-[#0E1217] text-white disabled:opacity-30">↑</button>
        </div>
      </div>
    </div>
  )
}

function TasksView({ T, search, isAr }) {
  const [tasks, setTasks] = useState(function(){ try { return JSON.parse(localStorage.getItem('rafeaq_tasks') || '[]') } catch(e){ return [] } }())
  useEffect(function(){ localStorage.setItem('rafeaq_tasks', JSON.stringify(tasks)) }, [tasks])
  function add() { const t = prompt(isAr ? 'اكتب المهمة؟' : 'Task?'); if (!t) return; setTasks(tasks.concat([{ id: Date.now(), title: t, done: false }])) }
  const filtered = tasks.filter(function(t){ return !search || t.title.toLowerCase().includes(search.toLowerCase()) })
  return (
    <div className="max-w-[560px] mx-auto min-w-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[20px] font-bold">{T.tasks} ({filtered.length})</h2>
        <button onClick={add} className="h-[36px] px-4 rounded-[8px] bg-[#0E1217] text-white text-[12px] font-medium">+ {isAr ? 'مهمة' : 'Task'}</button>
      </div>
      {filtered.length === 0 && <div className="text-center py-12 bg-white border border-[#E8E6E1] rounded-[12px] text-[13px] text-[#8A919E]">{T.noTasks}</div>}
      <div className="bg-white rounded-[12px] border border-[#E8E6E1] p-3 space-y-2">
        {filtered.map(function(t){
          return (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] min-w-0 hover:border-[#0E1217]">
              <button onClick={function(){ setTasks(tasks.map(function(v){ return v.id === t.id ? { id: v.id, title: v.title, done: !v.done } : v })) }} className={"w-5 h-5 rounded-full border flex items-center justify-center shrink-0 " + (t.done ? 'bg-[#0E1217] text-white border-[#0E1217]' : 'bg-white border-[#E8E6E1]')}>
                {t.done ? '✓' : ''}
              </button>
              <span className={"flex-1 text-[13px] truncate " + (t.done ? 'line-through text-[#8A919E]' : '')}>{t.title}</span>
              <button onClick={function(){ setTasks(tasks.filter(function(v){ return v.id !== t.id })) }} className="text-[#8A919E] hover:text-[#0E1217] text-[12px]">X</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LibraryView({ T }) {
  const [books, setBooks] = useState(function(){ try { return JSON.parse(localStorage.getItem('rafeaq_books') || '[]') } catch(e){ return [] } }())
  const URL = 'https://cerc.moe.gov.ly/'
  function onFile(e) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(function(f){
      const r = new FileReader()
      r.onload = function(){
        const b = { id: Date.now() + Math.random(), name: f.name.replace('.pdf', ''), data: r.result }
        const cur = JSON.parse(localStorage.getItem('rafeaq_books') || '[]')
        const nb = cur.concat([b])
        setBooks(nb)
        localStorage.setItem('rafeaq_books', JSON.stringify(nb))
      }
      r.readAsDataURL(f)
    })
    e.target.value = ''
  }
  return (
    <div className="max-w-[900px] mx-auto min-w-0 space-y-4">
      <div className="bg-white rounded-[12px] border border-[#E8E6E1] p-4 flex justify-between gap-3">
        <div><h3 className="font-semibold text-[13px]">{T.library} - {books.length} كتاب</h3><p className="text-[11px] text-[#8A919E] mt-1">مكتبة المنهج الليبي الرسمية</p></div>
        <label className="h-[36px] px-4 rounded-[8px] bg-[#0E1217] text-white text-[12px] flex items-center cursor-pointer font-medium">+ PDF<input type="file" accept="application/pdf" multiple onChange={onFile} className="hidden" /></label>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {books.map(function(b){
          return (<div key={b.id} className="bg-white rounded-[12px] border border-[#E8E6E1] p-3 min-w-0 hover:border-[#0E1217]"><div className="h-[64px] bg-[#F7F5F3] border border-[#E8E6E1] rounded-[8px] flex items-center justify-center text-[10px] font-medium tracking-wide">PDF - رسمي</div><div className="text-[12px] font-medium mt-3 truncate">{b.name}</div></div>)
        })}
      </div>
      <div className="bg-[#0E1217] rounded-[12px] p-6 text-white">
        <div className="text-[11px] tracking-[0.15em] uppercase text-[#8A919E]">المصدر المعتمد</div>
        <div className="font-semibold text-[14px] mt-2">مركز المناهج التعليمية والبحوث التربوية</div>
        <p className="text-[12px] text-[#8A919E] mt-2 leading-6">اختر الكتب من الموقع الرسمي لوزارة التعليم.</p>
        <a href={URL} target="_blank" rel="noreferrer" className="inline-flex mt-4 h-[36px] px-4 items-center rounded-[8px] bg-white text-black text-[12px] font-medium">فتح موقع المركز →</a>
      </div>
    </div>
  )
}

function NotebookView({ T }) {
  const [sources, setSources] = useState([])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function loadSources() { const s = await listDeviceFiles('notebook'); setSources(s) }
  useEffect(function(){ loadSources().catch(function(){ setError('تعذر فتح مصادر دفتر رفيق') }) }, [])
  async function upload(event){
    const file = event.target.files ? event.target.files[0] : null
    event.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') { setError('PDF فقط.'); return }
    setLoading(true); setError('')
    try { const text = await extractPdfText(file); if (!text) throw new Error('empty'); await saveDeviceFile(file, 'notebook', { text: text, pagesHint: 'PDF' }); await loadSources() } catch(e){ setError('لم نتمكن من قراءة النص') } finally { setLoading(false) }
  }
  async function ask(){ if (!question.trim() || !sources.length) return; const a = answerFromSources(question, sources); setAnswer(a); setQuestion('') }
  async function remove(id){ await deleteDeviceFile(id); await loadSources(); setAnswer(null) }
  return (
    <div className="max-w-[980px] mx-auto grid lg:grid-cols-[300px_1fr] gap-4 min-w-0">
      <aside className="bg-white rounded-[12px] border border-[#E8E6E1] p-4 min-w-0">
        <div className="flex justify-between items-center"><div><h2 className="font-semibold text-[13px]">مصادر دفتر رفيق</h2><p className="text-[11px] text-[#8A919E] mt-1">PDF محفوظ محليا</p></div><span className="text-[11px] font-mono bg-[#F7F5F3] border border-[#E8E6E1] px-2 py-1 rounded-full">{sources.length}</span></div>
        <label className="mt-4 h-[40px] rounded-[8px] bg-[#0E1217] text-white text-[12px] font-medium flex items-center justify-center cursor-pointer">{loading ? 'جاري القراءة...' : '+ إضافة PDF'}<input type="file" accept="application/pdf" onChange={upload} disabled={loading} className="hidden"/></label>
        {error && <p className="mt-3 p-3 rounded-[8px] bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] text-[11px]">{error}</p>}
        <div className="mt-4 space-y-2">
          {sources.map(function(source){
            return (<div key={source.id} className="rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] p-3 flex gap-2"><span className="w-7 h-7 shrink-0 rounded-[6px] bg-white border border-[#E8E6E1] flex items-center justify-center text-[9px] font-bold">PDF</span><div className="min-w-0 flex-1"><p className="font-medium text-[11px] truncate">{source.name}</p><p className="text-[10px] text-[#8A919E] mt-1">{Math.ceil(source.size / 1024)} KB</p></div><button onClick={function(){ remove(source.id) }} className="text-[12px] text-[#8A919E]">X</button></div>)
          })}
          {!sources.length && <p className="py-10 text-center text-[12px] text-[#8A919E]">أضف كتابا للبدء.</p>}
        </div>
      </aside>
      <section className="bg-white rounded-[12px] border border-[#E8E6E1] p-6 min-w-0">
        <div className="inline-flex px-2.5 py-1 rounded-full bg-[#F7F5F3] border border-[#E8E6E1] text-[#5A6372] text-[10px] font-medium">إجابة من مصادرك فقط</div>
        <h1 className="text-[22px] font-bold mt-4">{T.notebook}</h1>
        <p className="text-[12px] text-[#8A919E] mt-2 leading-6">اسأل عن المحتوى المرفوع.</p>
        <div className="mt-6 flex gap-2">
          <input value={question} onChange={function(e){ setQuestion(e.target.value) }} onKeyDown={function(e){ if(e.key === 'Enter') ask() }} placeholder={sources.length ? 'اسأل عن الدرس...' : 'أضف PDF أولا'} disabled={!sources.length} className="flex-1 h-[44px] rounded-[8px] border border-[#E8E6E1] bg-[#F7F5F3] px-4 text-[13px] outline-none focus:bg-white focus:border-[#0E1217]"/>
          <button onClick={ask} disabled={!sources.length || !question.trim()} className="px-5 rounded-[8px] bg-[#0E1217] text-white text-[12px] font-medium disabled:opacity-40">اسأل</button>
        </div>
        {answer && <div className="mt-6 rounded-[10px] bg-[#F7F5F3] border border-[#E8E6E1] p-4"><p className="text-[13px] leading-7 whitespace-pre-line">{answer.text}</p>{answer.citations && answer.citations.length > 0 && <p className="text-[11px] text-[#5A6372] font-medium mt-4 border-t border-[#E8E6E1] pt-3">المصدر: {answer.citations.join('، ')}</p>}</div>}
      </section>
    </div>
  )
}

function SlidesView({ T }) {
  const [slides, setSlides] = useState(function(){ try { return JSON.parse(localStorage.getItem('rafeaq_slides') || '[{"t":"Hello","c":""}]') } catch(e){ return [{ t: 'Hello', c: '' }] } }())
  const [idx, setIdx] = useState(0)
  useEffect(function(){ localStorage.setItem('rafeaq_slides', JSON.stringify(slides)) }, [slides])
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 max-w-[900px] mx-auto min-w-0">
      <div className="bg-white rounded-[12px] border border-[#E8E6E1] p-2 min-w-0">
        {slides.map(function(s,i){
          return (<button key={i} onClick={function(){ setIdx(i) }} className={"w-full p-2.5 rounded-[8px] text-[11px] text-right mb-1 truncate border " + (i === idx ? 'bg-[#0E1217] text-white border-[#0E1217]' : 'bg-[#F7F5F3] border-[#E8E6E1] text-[#5A6372]')}>{i+1}. {s.t}</button>)
        })}
        <button onClick={function(){ setSlides(slides.concat([{ t: 'شريحة جديدة', c: '' }])); setIdx(slides.length) }} className="w-full h-[32px] rounded-[8px] bg-[#F7F5F3] border border-dashed border-[#E8E6E1] text-[11px] mt-1">+ شريحة</button>
      </div>
      <div className="bg-white rounded-[12px] border border-[#E8E6E1] p-5 min-w-0">
        <input value={slides[idx] ? slides[idx].t : ''} onChange={function(e){ const n = slides.slice(); n[idx].t = e.target.value; setSlides(n) }} className="font-semibold text-[14px] w-full outline-none border-b border-[#E8E6E1] pb-2 focus:border-[#0E1217]" placeholder="عنوان الشريحة" />
        <textarea value={slides[idx] ? slides[idx].c : ''} onChange={function(e){ const n = slides.slice(); n[idx].c = e.target.value; setSlides(n) }} className="mt-4 w-full h-[280px] outline-none text-[13px] leading-6 resize-none" placeholder="محتوى الشريحة..." />
      </div>
    </div>
  )
}

function KhaznaView({ T }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function loadFiles(){ const f = await listDeviceFiles('vault'); setFiles(f) }
  useEffect(function(){ loadFiles().catch(function(){ setError('تعذر فتح الخزنة') }) }, [])
  async function upload(event){
    const selected = Array.from(event.target.files || [])
    event.target.value = ''
    if (!selected.length) return
    setLoading(true); setError('')
    try { for (const file of selected) { await saveDeviceFile(file, 'vault') } await loadFiles() } catch(e){ setError('تعذر حفظ أحد الملفات.') } finally { setLoading(false) }
  }
  async function download(id){ const file = await getDeviceFile(id); const url = URL.createObjectURL(file.blob); const link = document.createElement('a'); link.href = url; link.download = file.name; link.click(); URL.revokeObjectURL(url) }
  async function remove(id){ await deleteDeviceFile(id); await loadFiles() }
  const total = files.reduce(function(sum, file){ return sum + file.size }, 0)
  return (
    <div className="max-w-[900px] mx-auto min-w-0">
      <div className="rounded-[12px] bg-[#0E1217] text-white p-6 flex flex-wrap items-center justify-between gap-4 border border-[#1E242E]">
        <div><p className="text-[11px] tracking-[0.15em] uppercase text-[#8A919E]">الخزنة الرسمية</p><h1 className="text-[20px] font-semibold mt-2">{T.khazna}</h1><p className="text-[12px] text-[#8A919E] mt-2">{files.length} ملفات - {(total / 1024 / 1024).toFixed(1)} MB</p></div>
        <label className="h-[40px] px-5 rounded-[8px] bg-white text-black text-[12px] font-medium flex items-center cursor-pointer hover:bg-[#F5F3EF]">{loading ? 'جاري الحفظ...' : '+ رفع ملفات'}<input type="file" multiple onChange={upload} disabled={loading} className="hidden"/></label>
      </div>
      {error && <p className="mt-3 p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[11px]">{error}</p>}
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {files.map(function(file){
          return (<div key={file.id} className="bg-white rounded-[12px] border border-[#E8E6E1] p-4 hover:border-[#0E1217]"><div className="w-10 h-10 rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] flex items-center justify-center text-[10px] font-bold">{file.name.split('.').pop().slice(0,4).toUpperCase() || 'FILE'}</div><p className="font-medium text-[12px] mt-3 truncate">{file.name}</p><p className="text-[11px] text-[#8A919E] mt-1">{(file.size / 1024).toFixed(1)} KB</p><div className="mt-4 flex gap-2"><button onClick={function(){ download(file.id) }} className="flex-1 h-[32px] rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] text-[11px] font-medium hover:bg-[#0E1217] hover:text-white">تنزيل</button><button onClick={function(){ remove(file.id) }} className="w-[32px] h-[32px] rounded-[8px] border border-[#E8E6E1] text-[13px] text-[#8A919E]">X</button></div></div>)
        })}
        {!files.length && <div className="sm:col-span-2 lg:col-span-3 py-16 text-center bg-white rounded-[12px] border border-dashed border-[#E8E6E1] text-[12px] text-[#8A919E]">الخزنة فارغة.</div>}
      </div>
    </div>
  )
}

function PomoView({ T, isAr }) {
  const [work, setWork] = useState(25)
  const [brk, setBrk] = useState(5)
  const [sec, setSec] = useState(25 * 60)
  const [run, setRun] = useState(false)
  const [mode, setMode] = useState('work')
  const ref = useRef(null)
  useEffect(function(){ setSec(work * 60) }, [work])
  useEffect(function(){
    if (!run) return
    ref.current = setInterval(function(){
      setSec(function(s){
        if (s <= 1) { const nm = mode === 'work' ? 'break' : 'work'; setMode(nm); return nm === 'work' ? work * 60 : brk * 60 }
        return s - 1
      })
    }, 1000)
    return function(){ clearInterval(ref.current) }
  }, [run, mode, work, brk])
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return (
    <div className="max-w-[400px] mx-auto space-y-4 min-w-0">
      <div className="bg-white rounded-[12px] border border-[#E8E6E1] p-4 flex gap-4 justify-center">
        <div className="flex items-center gap-2"><span className="text-[11px] text-[#8A919E]">{T.work}</span><input type="number" value={work} onChange={function(e){ setWork(Math.max(1, parseInt(e.target.value) || 1)) }} className="w-[56px] h-[32px] rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] px-2 text-[12px] text-center outline-none focus:border-[#0E1217]" /></div>
        <div className="flex items-center gap-2"><span className="text-[11px] text-[#8A919E]">{T.break}</span><input type="number" value={brk} onChange={function(e){ setBrk(Math.max(1, parseInt(e.target.value) || 1)) }} className="w-[56px] h-[32px] rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] px-2 text-[12px] text-center outline-none focus:border-[#0E1217]" /></div>
      </div>
      <div className="bg-white rounded-[12px] border border-[#E8E6E1] p-8 text-center">
        <div className="text-[10px] tracking-[0.15em] uppercase text-[#8A919E] font-semibold">{mode === 'work' ? (isAr ? 'تركيز' : 'FOCUS') : (isAr ? 'راحة' : 'BREAK')}</div>
        <div className="text-[48px] font-semibold tracking-tight mt-2">{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</div>
        <div className="mt-6 flex gap-2 justify-center">
          <button onClick={function(){ setRun(!run) }} className="h-[40px] px-8 rounded-[8px] bg-[#0E1217] text-white font-medium text-[13px]">{run ? T.pause : T.start}</button>
          <button onClick={function(){ setRun(false); setSec(work * 60) }} className="h-[40px] px-6 rounded-[8px] bg-[#F7F5F3] border border-[#E8E6E1] text-[13px]">{T.reset}</button>
        </div>
      </div>
    </div>
  )
}

function FlashView({ T, isAr }) {
  const [cards, setCards] = useState(function(){ try { return JSON.parse(localStorage.getItem('rafeaq_flash') || '[]') } catch(e){ return [] } }())
  function add(){ const q = prompt(isAr ? 'السؤال؟' : 'Question?'); if (!q) return; const a = prompt(isAr ? 'الجواب؟' : 'Answer?'); if (!a) return; setCards(cards.concat([{ q: q, a: a }])) }
  useEffect(function(){ localStorage.setItem('rafeaq_flash', JSON.stringify(cards)) }, [cards])
  return (
    <div className="max-w-[480px] mx-auto min-w-0">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[18px] font-bold">{T.flashcards}</h3>
        <button onClick={add} className="h-[36px] px-4 rounded-[8px] bg-[#0E1217] text-white text-[12px] font-medium">+ {isAr ? 'بطاقة' : 'Card'}</button>
      </div>
      <div className="space-y-2">
        {cards.map(function(c,i){ return (<div key={i} className="bg-white rounded-[12px] border border-[#E8E6E1] p-4 min-w-0 hover:border-[#0E1217]"><div className="font-medium text-[13px] truncate">{c.q}</div><div className="text-[12px] text-[#8A919E] mt-1 truncate">{c.a}</div></div>) })}
        {!cards.length && <div className="py-12 text-center bg-white border border-dashed border-[#E8E6E1] rounded-[12px] text-[12px] text-[#8A919E]">{isAr ? 'لا توجد بطاقات بعد' : 'No cards yet'}</div>}
      </div>
    </div>
  )
}

function ExamView({ T, isAr }) {
  const [exams, setExams] = useState(function(){ try { return JSON.parse(localStorage.getItem('rafeaq_exams') || '[]') } catch(e){ return [] } }())
  function add(){ const n = prompt(isAr ? 'اسم الامتحان؟' : 'Exam name?'); if (!n) return; const d = prompt('YYYY-MM-DD'); if (!d) return; setExams(exams.concat([{ id: Date.now(), name: n, date: d }])) }
  function editDate(id){ const nd = prompt('YYYY-MM-DD'); if (!nd) return; setExams(exams.map(function(e){ return e.id === id ? { id: e.id, name: e.name, date: nd } : e })) }
  useEffect(function(){ localStorage.setItem('rafeaq_exams', JSON.stringify(exams)) }, [exams])
  return (
    <div className="max-w-[480px] mx-auto min-w-0">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[18px] font-bold">{T.exams}</h3>
        <button onClick={add} className="h-[36px] px-4 rounded-[8px] bg-[#0E1217] text-white text-[12px] font-medium">+ {isAr ? 'امتحان' : 'Exam'}</button>
      </div>
      <div className="space-y-2">
        {exams.map(function(ex){
          const diff = Math.ceil((new Date(ex.date) - new Date()) / (1000 * 60 * 60 * 24))
          return (<div key={ex.id} className="bg-white rounded-[12px] border border-[#E8E6E1] p-4 flex justify-between items-center gap-3 min-w-0"><div className="min-w-0"><div className="font-medium text-[13px] truncate">{ex.name}</div><div className="text-[11px] text-[#8A919E] flex items-center gap-2 mt-1 truncate">{ex.date}<button onClick={function(){ editDate(ex.id) }} className="px-2 py-0.5 rounded-full bg-[#F7F5F3] border border-[#E8E6E1] text-[#5A6372] text-[10px] hover:border-[#0E1217]">{T.edit}</button></div></div><div className="text-[18px] font-semibold text-[#0E1217] shrink-0">{diff}{isAr ? 'ي' : 'd'}</div></div>)
        })}
        {!exams.length && <div className="py-12 text-center bg-white border border-dashed border-[#E8E6E1] rounded-[12px] text-[12px] text-[#8A919E]">{isAr ? 'لا توجد امتحانات' : 'No exams'}</div>}
      </div>
    </div>
  )
}