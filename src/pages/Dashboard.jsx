import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { answerFromSources, deleteDeviceFile, extractPdfText, getDeviceFile, listDeviceFiles, saveDeviceFile } from '../lib/deviceStorage.js'

const LIBRARY_URL = "https://www.al-amjaad.com/%D8%A7%D9%84%D9%85%D9%86%D9%87%D8%AC/libya"

export default function Dashboard() {
  const nav = useNavigate()
  const [tab, setTab] = useState('home')
  const [user, setUser] = useState('حمود')
  const [search, setSearch] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('rafeaq_user') || 'حمود'
    setUser(u.split('@')[0] || 'حمود')
  }, [])

  function logout() {
    localStorage.removeItem('rafeaq_token')
    localStorage.removeItem('rafeaq_user')
    nav('/login')
  }

  const cards = [
    { id: 'ai', title: 'رفيق AI', desc: 'اسأل .. تعلم .. تطور', icon: '🤖', iconBg: 'bg-[#E9E5FF]' },
    { id: 'tasks', title: 'المهام', desc: 'نظم يومك وحقق أهدافك', icon: '✅', iconBg: 'bg-[#DCFCE7]' },
    { id: 'library', title: 'مكتبة رفيق', desc: 'كتب وملفات دراسية', icon: '📚', iconBg: 'bg-[#DBEAFE]' },
    { id: 'notebook', title: 'دفتر رفيق', desc: 'اسأل من مصادر موثوقة', icon: '📝', iconBg: 'bg-[#FEE4E2]' },
    { id: 'slides', title: 'العروض', desc: 'أنشئ شرائح بسهولة', icon: '📊', iconBg: 'bg-[#FFE4E6]' },
    { id: 'terabox', title: 'TeraBox', desc: 'مساحة تخزين سحابية', icon: '☁️', iconBg: 'bg-[#E0F2FE]' },
    { id: 'pomo', title: 'بومودورو', desc: 'ركز .. وحقق أكثر', icon: '⏱️', iconBg: 'bg-[#FEF3C7]' },
    { id: 'flash', title: 'بطاقات المراجعة', desc: 'راجع بذكاء', icon: '🃏', iconBg: 'bg-[#EDE9FE]' },
    { id: 'exam', title: 'الامتحانات', desc: 'لا تنسى مواعيدك', icon: '📅', iconBg: 'bg-[#DBEAFE]' },
    { id: 'notion', title: 'Notion AI', desc: 'أفكار وتنظيم أفضل', icon: 'N', iconBg: 'bg-[#E9ECEF]', black: true },
    { id: 'more', title: 'المزيد', desc: 'أدوات أخرى', icon: '•••', iconBg: 'bg-[#F3F4F6]' },
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif}`}</style>

      <aside className="hidden lg:flex w-[260px] bg-white border-l border-[#EEF0F6] flex-col fixed right-0 top-0 h-screen z-20">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6C5CE7] flex items-center justify-center text-white font-bold">🤖</div>
            <span className="font-extrabold text-[18px] text-[#1E1B4B]">رفيق AI</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <button onClick={()=>setTab('home')} className={`w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[13px] font-medium ${tab==='home'?'bg-[#F3F0FF] text-[#6C5CE7]':'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>🏠 الرئيسية</button>
          {cards.filter(c=>c.id!=='more').map(c=>(
            <button key={c.id} onClick={()=>setTab(c.id)} className={`w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[13px] font-medium ${tab===c.id?'bg-[#F3F0FF] text-[#6C5CE7]':'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>
              <span className="w-5 text-center">{c.black?<span className="font-black border border-black w-5 h-5 flex items-center justify-center rounded text-[11px]">N</span>:c.icon}</span> {c.title}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#EEF0F6] space-y-2">
          <button onClick={()=>setTab('settings')} className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[13px] text-[#6B7280] hover:bg-[#F9FAFB]">⚙️ الإعدادات</button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[13px] text-[#6B7280] hover:bg-[#F9FAFB]">↪️ تسجيل الخروج</button>
        </div>
      </aside>

      <div className="flex-1 lg:mr-[260px] min-h-screen">
        <header className="h-[64px] bg-white/80 backdrop-blur border-b border-[#EEF0F6] sticky top-0 z-10 px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-[600px]">
            <button onClick={()=>setShowMobileMenu(!showMobileMenu)} className="lg:hidden w-9 h-9 rounded-xl bg-[#F3F4F6] flex items-center justify-center">☰</button>
            <div className="relative flex-1 hidden md:block">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث في المهام أو أي شيء..." className="w-full h-10 pr-10 pl-4 rounded-xl bg-[#F9FAFB] border border-[#EEF0F6] text-[13px] outline-none focus:bg-white focus:border-[#6C5CE7]" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#F9FAFB] rounded-full p-1 border"><button className="px-3 h-7 rounded-full bg-white shadow text-[12px] font-bold text-[#6C5CE7]">AR</button><button className="px-3 h-7 rounded-full text-[12px] text-[#9CA3AF]">EN</button></div>
            <button className="w-9 h-9 rounded-full bg-[#F9FAFB] border flex items-center justify-center relative">🔔<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span></button>
            <div className="flex items-center gap-2"><span className="text-[13px] font-bold hidden md:block">{user}</span><div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A78BFA] flex items-center justify-center text-white font-bold">{user[0]?.toUpperCase()}</div></div>
          </div>
        </header>

        <main className="p-4 lg:p-8 pb-24 lg:pb-8">
          {tab==='home' && (
            <>
              <div className="rounded-[20px] bg-gradient-to-l from-[#EDE9FE] to-[#F5F3FF] p-6 lg:p-8 flex items-center justify-between relative overflow-hidden">
                <div><h1 className="text-[22px] lg:text-[26px] font-extrabold text-[#1E1B4B]">مرحباً {user} 👋</h1><p className="mt-2 text-[14px] font-bold text-[#6C5CE7]">معاً نحو مستقبل أفضل ..</p><p className="mt-1 text-[12px] text-[#8B8BA7]">رفيقك الذكي في رحلتك الدراسية</p></div>
                <div className="hidden md:flex text-[80px]">🤖</div>
              </div>

              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {cards.map(c=>(
                  <button key={c.id} onClick={()=>setTab(c.id)} className="bg-white rounded-[16px] border border-[#EEF0F6] p-4 text-right hover:border-[#6C5CE7]/20 hover:shadow-[0_8px_24px_rgba(108,92,231,0.08)] transition group">
                    <div className="flex items-start justify-between"><div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center text-[18px] ${c.black?'font-black border border-black text-[12px]':''}`}>{c.icon}</div><span className="text-[#9CA3AF] group-hover:text-[#6C5CE7]">›</span></div>
                    <div className="mt-4"><div className="text-[14px] font-bold text-[#1E1B4B]">{c.title}</div><div className="text-[11px] text-[#8B8BA7] mt-1">{c.desc}</div></div>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-[16px] border border-[#EEF0F6] p-5">
                  <div className="flex justify-between"><h3 className="text-[14px] font-bold">🔔 مراجعة اليوم</h3><button className="text-[11px] text-[#6C5CE7]">عرض الكل .</button></div>
                  <div className="mt-4 bg-[#F9FAFB] rounded-xl p-6 flex flex-col items-center text-center border border-dashed"><div className="w-10 h-10 rounded-xl bg-[#F3F0FF] flex items-center justify-center">📅</div><div className="mt-3 text-[12px] font-medium text-[#6B7280]">لا توجد مهام للمراجعة اليوم</div><div className="text-[11px] text-[#9CA3AF] mt-1">ابق على هذا النشاط الرائع!</div></div>
                </div>
                <div className="bg-white rounded-[16px] border p-5">
                  <h3 className="text-[14px] font-bold">📊 إحصائياتك</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-[#F0FDF4] rounded-xl p-4 flex justify-between items-center"><div><div className="text-[11px] text-[#6B7280]">المهام المكتملة</div><div className="text-[18px] font-bold mt-1">3</div></div><div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center">✓</div></div>
                    <div className="bg-[#EFF6FF] rounded-xl p-4 flex justify-between items-center"><div><div className="text-[11px] text-[#6B7280]">المهام الكلية</div><div className="text-[18px] font-bold mt-1">5</div></div><div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center">📋</div></div>
                    <div className="bg-[#FFFBEB] rounded-xl p-4 flex justify-between items-center"><div><div className="text-[11px] text-[#6B7280]">الكتب في مكتبتك</div><div className="text-[18px] font-bold mt-1">2</div></div><div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center">📚</div></div>
                    <div className="bg-[#FEF2F2] rounded-xl p-4 flex justify-between items-center"><div><div className="text-[11px] text-[#6B7280]">الرسائل اليوم</div><div className="text-[14px] font-bold mt-1">12/25</div></div><div className="w-8 h-8 rounded-full bg-[#FEE2E2] flex items-center justify-center">💬</div></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab==='ai' && <AIView />}
          {tab==='tasks' && <TasksView search={search} />}
          {tab==='library' && <LibraryView />}
          {tab==='notebook' && <NotebookView />}
          {tab==='slides' && <SlidesView />}
          {tab==='terabox' && <TeraBoxView />}
          {tab==='pomo' && <PomoView />}
          {tab==='flash' && <FlashView />}
          {tab==='exam' && <ExamView />}
          {tab==='notion' && <NotionView />}
          {tab==='more' && <MoreView />}
          {tab==='settings' && <SettingsView user={user} logout={logout} />}
        </main>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EEF0F6] z-20 px-2 py-2">
          <div className="flex justify-around">
            <button onClick={()=>setTab('home')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${tab==='home'?'text-[#6C5CE7] bg-[#F3F0FF]':'text-[#9CA3AF]'}`}><span>🏠</span><span className="text-[10px]">الرئيسية</span></button>
            <button onClick={()=>setTab('library')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${tab==='library'?'text-[#6C5CE7] bg-[#F3F0FF]':'text-[#9CA3AF]'}`}><span>📚</span><span className="text-[10px]">مكتبة</span></button>
            <button onClick={()=>setTab('tasks')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${tab==='tasks'?'text-[#6C5CE7] bg-[#F3F0FF]':'text-[#9CA3AF]'}`}><span>✅</span><span className="text-[10px]">المهام</span></button>
            <button onClick={()=>setTab('more')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${tab==='more'?'text-[#6C5CE7] bg-[#F3F0FF]':'text-[#9CA3AF]'}`}><span>•••</span><span className="text-[10px]">المزيد</span></button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-30 flex">
            <div className="flex-1 bg-black/30" onClick={()=>setShowMobileMenu(false)}></div>
            <div className="w-[280px] bg-white h-full p-4 overflow-y-auto">
              <div className="flex justify-between mb-6"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-[#6C5CE7] flex items-center justify-center text-white">🤖</div><span className="font-bold">رفيق AI</span></div><button onClick={()=>setShowMobileMenu(false)} className="w-8 h-8 rounded-full bg-[#F3F4F6]">✕</button></div>
              {cards.map(c=><button key={c.id} onClick={()=>{setTab(c.id); setShowMobileMenu(false)}} className="w-full flex items-center gap-3 px-3 h-12 rounded-xl text-[13px] text-[#6B7280] hover:bg-[#F9FAFB]">{c.icon} {c.title}</button>)}
              <button onClick={logout} className="w-full mt-6 flex items-center gap-3 px-3 h-12 rounded-xl text-[13px] text-red-500">↪️ تسجيل الخروج</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AIView() {
  const [msgs, setMsgs] = useState([{ role: 'a', text: 'مرحبا! أنا رفيق AI - مساعدك الدراسي الذكي 🤖\n\nأقدر:\n• أشرح الدروس\n• ألخص الكتب\n• أسوي لك امتحان (قل: سويلي امتحان)\n• أجاوب بصوت\n\nشن تبي اليوم؟' }])
  const [inp, setInp] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const today = new Date().toISOString().slice(0,10)
  const [history, setHistory] = useState(()=>{ try { return JSON.parse(localStorage.getItem('rafeaq_ai_history')||'[]') } catch(e) { return [] } })
  const used = history.filter(d=>d===today).length
  const remaining = Math.max(0,25-used)
  const ref = useRef(null)

  useEffect(()=>{ ref.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  function isExamRequest(text) {
    const t = text.toLowerCase()
    return t.includes('امتحان') || t.includes('اسئله') || t.includes('أسئلة') || t.includes('اختبار') || t.includes('quiz') || t.includes('سويلي')
  }

  function generateExam(topic) {
    return `📝 **امتحان: ${topic}**\n\n**السؤال 1 (اختياري):** ما هو تعريف ${topic}؟\nأ) تعريف خاطئ\nب) التعريف الصحيح\nج) تعريف ناقص\nد) لا شيء مما سبق\n\n**السؤال 2 (صح/خطأ):** ${topic} مهم في الدراسة.\n\n**السؤال 3 (مقالي):** اشرح ${topic} بأسلوبك مع ذكر مثالين.\n\n**السؤال 4 (تطبيقي):** كيف تطبق ${topic} في حياتك الدراسية؟\n\n✏️ جاوب و أنا نصححلك!`
  }

  async function send() {
    const text = inp.trim()
    if (!text || busy || !remaining) return
    setMsgs(m=>[...m,{role:'u',text}]); setInp(''); setBusy(true)
    const nh = [...history, today]; setHistory(nh); localStorage.setItem('rafeaq_ai_history', JSON.stringify(nh))

    if (isExamRequest(text)) {
      setTimeout(()=>{ setMsgs(m=>[...m,{role:'a',text: generateExam(text.replace(/سويلي|امتحان|اسئلة|اختبار/g,'').trim() || 'الدرس')}]) ; setBusy(false) }, 800)
      return
    }

    try {
      const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})})
      const data = await res.json()
      setMsgs(m=>[...m,{role:'a',text:data.reply||'اكتب المادة وحدد شرح أو تلخيص.'}])
    } catch { setMsgs(m=>[...m,{role:'a',text:'أرسل النص وسألخصه.'}]) }
    finally { setBusy(false) }
  }

  function startVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) { alert('المتصفح لا يدعم الصوت'); return }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.lang = 'ar-SA'
    rec.onstart = ()=>setListening(true)
    rec.onend = ()=>setListening(false)
    rec.onresult = (e)=>{ const t=e.results[0][0].transcript; setInp(t) }
    rec.start()
  }

  function speak(text) {
    const u = new SpeechSynthesisUtterance(text)
    u.lang='ar-SA'
    speechSynthesis.speak(u)
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[22px] font-bold flex items-center gap-2">رفيق AI <span className="text-[10px] px-2 py-1 rounded-full bg-[#F3F0FF] text-[#6C5CE7]">Gemini Style</span></h1><p className="text-[12px] text-[#8A919E] mt-1">مساعدك الدراسي الذكي - يشرح ويمتحنك</p></div>
        <div className="px-3 py-2 rounded-full bg-white border text-[11px] font-medium">{remaining} من 25 اليوم</div>
      </div>
      <div className="bg-white rounded-[16px] border border-[#EEF0F6] p-4">
        <div className="space-y-3 h-[460px] overflow-y-auto p-1">
          {msgs.map((m,i)=><div key={i} className={`flex ${m.role==='u'?'justify-end':'justify-start'}`}><div className={`max-w-[85%] rounded-[16px] px-4 py-3 text-[13px] leading-7 whitespace-pre-line relative group ${m.role==='u'?'bg-[#6C5CE7] text-white rounded-br-[4px]':'bg-[#F9FAFB] border border-[#EEF0F6] rounded-bl-[4px]'}`}>{m.text}{m.role==='a'&&<button onClick={()=>speak(m.text)} className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-[#F3F0FF] flex items-center justify-center text-[12px] transition">🔊</button>}</div></div>)}
          {busy && <div className="flex justify-start"><div className="bg-[#F9FAFB] border rounded-[16px] px-4 py-3 text-[11px] text-[#8A919E]">رفيق يكتب... ✨</div></div>}
          <div ref={ref}></div>
        </div>
        <div className="mt-4 flex gap-2 items-center">
          <button onClick={startVoice} className={`w-11 h-11 rounded-xl border flex items-center justify-center transition ${listening?'bg-red-500 text-white animate-pulse':'bg-[#F9FAFB] hover:bg-[#F3F0FF]'}`}>🎤</button>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={remaining?'اكتب سؤالك أو قل: سويلي امتحان في الرياضيات...':'انتهت المحادثات'} className="flex-1 h-11 rounded-xl border bg-[#F9FAFB] px-4 text-[13px] outline-none focus:bg-white focus:border-[#6C5CE7]" />
          <button onClick={send} disabled={!inp.trim()||busy||!remaining} className="w-11 h-11 rounded-xl bg-[#6C5CE7] text-white disabled:opacity-30 flex items-center justify-center">↑</button>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button onClick={()=>setInp('سويلي امتحان في ')} className="px-3 py-1.5 rounded-full bg-[#F3F0FF] border border-[#E9E5FF] text-[11px] text-[#6C5CE7]">📝 سويلي امتحان</button>
          <button onClick={()=>setInp('اشرحلي ')} className="px-3 py-1.5 rounded-full bg-[#F9FAFB] border text-[11px]">📖 اشرحلي</button>
          <button onClick={()=>setInp('لخصلي ')} className="px-3 py-1.5 rounded-full bg-[#F9FAFB] border text-[11px]">✨ لخصلي</button>
        </div>
      </div>
    </div>
  )
}

function TasksView({ search }) {
  const [tasks, setTasks] = useState(()=>{ try { return JSON.parse(localStorage.getItem('rafeaq_tasks')||'[]') } catch(e) { return [] } })
  useEffect(()=>{ localStorage.setItem('rafeaq_tasks', JSON.stringify(tasks)) },[tasks])
  const filtered = tasks.filter(t=>!search||t.title.includes(search))
  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-[20px] font-bold">المهام ({filtered.length})</h2><button onClick={()=>{const t=prompt('اكتب المهمة؟'); if(t) setTasks([...tasks,{id:Date.now(),title:t,done:false}])}} className="h-9 px-4 rounded-xl bg-[#6C5CE7] text-white text-[12px]">+ مهمة</button></div>
      <div className="bg-white rounded-[16px] border border-[#EEF0F6] p-3 space-y-2">
        {filtered.map(t=>(
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F9FAFB] border">
            <button onClick={()=>setTasks(tasks.map(v=>v.id===t.id?{...v,done:!v.done}:v))} className={`w-6 h-6 rounded-full border flex items-center justify-center ${t.done?'bg-[#6C5CE7] text-white border-[#6C5CE7]':'bg-white'}`}>{t.done?'✓':''}</button>
            <span className={`flex-1 text-[13px] ${t.done?'line-through text-[#9CA3AF]':''}`}>{t.title}</span>
            <button onClick={()=>setTasks(tasks.filter(v=>v.id!==t.id))} className="text-[#9CA3AF]">✕</button>
          </div>
        ))}
        {!filtered.length && <div className="py-12 text-center text-[13px] text-[#9CA3AF]">لا توجد مهام</div>}
      </div>
    </div>
  )
}

function LibraryView() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  async function load(){ const f=await listDeviceFiles('library'); setBooks(f) }
  useEffect(()=>{ load() },[])
  async function onFile(e){
    const files=Array.from(e.target.files||[]); e.target.value=''; if(!files.length) return; setLoading(true)
    try { for(const f of files){ await saveDeviceFile(f,'library') } await load() } finally { setLoading(false) }
  }
  return (
    <div className="max-w-[900px] mx-auto space-y-4">
      <div className="bg-white rounded-[16px] border border-[#EEF0F6] p-4 flex flex-col md:flex-row justify-between gap-3">
        <div><h3 className="font-bold text-[14px]">مكتبة رفيق - {books.length} كتاب</h3><p className="text-[11px] text-[#8A919E] mt-1">الكتب محفوظة على جهازك - تظهر دائما</p></div>
        <div className="flex gap-2">
          <a href="https://www.al-amjaad.com/%D8%A7%D9%84%D9%85%D9%86%D9%87%D8%AC/libya" target="_blank" className="h-9 px-4 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] text-[12px] flex items-center font-medium">🌐 موقع الامجاد</a>
          <label className="h-9 px-4 rounded-xl bg-[#6C5CE7] text-white text-[12px] flex items-center cursor-pointer font-medium">{loading?'جاري...':'+ رفع كتاب'}<input type="file" accept="application/pdf" multiple onChange={onFile} className="hidden" /></label>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {books.map(b=><div key={b.id} className="bg-white rounded-[16px] border border-[#EEF0F6] p-3 hover:border-[#6C5CE7]/30 transition group">
          <div className="h-20 bg-[#F9FAFB] rounded-xl flex flex-col items-center justify-center border"><span className="text-[24px]">📄</span><span className="text-[9px] mt-1 font-bold text-[#6C5CE7]">PDF</span></div>
          <div className="text-[12px] font-bold mt-3 truncate">{b.name}</div>
          <div className="text-[10px] text-[#9CA3AF] mt-1">{(b.size/1024/1024).toFixed(2)} MB</div>
          <div className="mt-3 flex gap-2"><button onClick={async()=>{const f=await getDeviceFile(b.id); const url=URL.createObjectURL(f.blob); window.open(url,'_blank')}} className="flex-1 h-8 rounded-xl bg-[#F9FAFB] border text-[11px] group-hover:bg-[#6C5CE7] group-hover:text-white transition">فتح</button><button onClick={async()=>{await deleteDeviceFile(b.id); await load()}} className="w-8 h-8 rounded-xl border text-[#9CA3AF] hover:text-red-500">✕</button></div>
        </div>)}
      </div>
      {!books.length && <div className="bg-white rounded-[16px] border border-dashed p-12 text-center"><div className="text-[32px]">📚</div><p className="text-[13px] text-[#6B7280] mt-2">مكتبتك فارغة - الكتب تظهر هنا دائما بعد التحميل</p><a href="https://www.al-amjaad.com/%D8%A7%D9%84%D9%85%D9%86%D9%87%D8%AC/libya" target="_blank" className="inline-flex mt-3 h-9 px-4 rounded-xl bg-[#6C5CE7] text-white text-[12px] items-center">تصفح موقع الامجاد</a></div>}
      <div className="bg-[#1E1B4B] rounded-[16px] p-6 text-white">
        <div className="text-[11px] text-[#A5B4FC]">المصدر المعتمد</div><div className="font-bold text-[14px] mt-2">مكتبة رفيق تتيح لك جميع كتبك الدراسية</div>
        <a href="https://www.al-amjaad.com/%D8%A7%D9%84%D9%85%D9%86%D9%87%D8%AC/libya" target="_blank" className="inline-flex mt-4 h-9 px-4 items-center rounded-xl bg-white text-black text-[12px] font-medium">فتح موقع الامجاد →</a>
      </div>
    </div>
  )
}

function NotebookView() {
  const [sources, setSources] = useState([])
  const [q, setQ] = useState('')
  const [ans, setAns] = useState(null)
  const [loading, setLoading] = useState(false)
  async function load(){ const s=await listDeviceFiles('notebook'); setSources(s) }
  useEffect(()=>{ load() },[])
  async function upload(e){
    const f=e.target.files?.[0]; e.target.value=''; if(!f) return; setLoading(true)
    try { const txt=await extractPdfText(f); await saveDeviceFile(new File([txt], f.name), 'notebook'); await load() } catch{} finally { setLoading(false) }
  }
  async function ask(){
    if(!q.trim()||!sources.length) return; setLoading(true)
    try { const files=await Promise.all(sources.map(s=>getDeviceFile(s.id))); const res=await answerFromSources(q, files.map(f=>({name:f.name,text:f.text||''}))); setAns(res) } catch{} finally { setLoading(false) }
  }
  return (
    <div className="max-w-[1000px] mx-auto grid lg:grid-cols-[280px_1fr] gap-4">
      <aside className="bg-white rounded-[16px] border border-[#EEF0F6] p-4">
        <div className="flex justify-between items-center"><h3 className="font-bold text-[13px]">مصادر</h3><label className="text-[11px] bg-[#6C5CE7] text-white px-3 py-1 rounded-full cursor-pointer">+ مصدر<input type="file" accept="application/pdf" onChange={upload} className="hidden" /></label></div>
        <div className="mt-4 space-y-2">{sources.map(s=><div key={s.id} className="p-2 rounded-xl bg-[#F9FAFB] border text-[11px] truncate">{s.name}</div>)} {!sources.length&&<p className="text-[11px] text-[#9CA3AF] py-8 text-center">أضف كتابا</p>}</div>
      </aside>
      <section className="bg-white rounded-[16px] border border-[#EEF0F6] p-6">
        <h1 className="text-[20px] font-bold">دفتر رفيق</h1><p className="text-[12px] text-[#8A919E] mt-2">اسأل عن المحتوى المرفوع</p>
        <div className="mt-6 flex gap-2"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="اسأل عن الدرس..." className="flex-1 h-11 rounded-xl border bg-[#F9FAFB] px-4 text-[13px]" /><button onClick={ask} className="px-5 rounded-xl bg-[#6C5CE7] text-white text-[12px]">اسأل</button></div>
        {ans && <div className="mt-6 rounded-xl bg-[#F9FAFB] border p-4 text-[13px] leading-7 whitespace-pre-line">{ans.text}</div>}
      </section>
    </div>
  )
}

function SlidesView() {
  const [slides, setSlides] = useState(()=>{ try { return JSON.parse(localStorage.getItem('rafeaq_slides')||'[{"t":"Hello","c":""}]') } catch(e) { return [{t:'Hello',c:''}] } })
  const [idx, setIdx] = useState(0)
  useEffect(()=>{ localStorage.setItem('rafeaq_slides', JSON.stringify(slides)) },[slides])
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 max-w-[900px] mx-auto">
      <div className="bg-white rounded-[16px] border border-[#EEF0F6] p-2">{slides.map((s,i)=><button key={i} onClick={()=>setIdx(i)} className={`w-full p-2.5 rounded-xl text-[11px] text-right mb-1 truncate border ${i===idx?'bg-[#6C5CE7] text-white':'bg-[#F9FAFB] text-[#6B7280]'}`}>{i+1}. {s.t}</button>)}<button onClick={()=>{setSlides([...slides,{t:'شريحة جديدة',c:''}]); setIdx(slides.length)}} className="w-full h-8 rounded-xl bg-[#F9FAFB] border-dashed border text-[11px] mt-1">+ شريحة</button></div>
      <div className="bg-white rounded-[16px] border border-[#EEF0F6] p-5"><input value={slides[idx]?.t||''} onChange={e=>{const n=[...slides]; n[idx].t=e.target.value; setSlides(n)}} className="font-bold text-[14px] w-full outline-none border-b pb-2" placeholder="عنوان الشريحة" /><textarea value={slides[idx]?.c||''} onChange={e=>{const n=[...slides]; n[idx].c=e.target.value; setSlides(n)}} className="mt-4 w-full h-[280px] outline-none text-[13px] resize-none" placeholder="محتوى الشريحة..." /></div>
    </div>
  )
}

function TeraBoxView() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  async function load(){ const f=await listDeviceFiles('terabox'); setFiles(f) }
  useEffect(()=>{ load() },[])
  const total = files.reduce((s,f)=>s+f.size,0)
  return (
    <div className="max-w-[900px] mx-auto">
      <div className="rounded-[16px] bg-gradient-to-l from-[#0EA5E9] to-[#0284C7] text-white p-6 flex flex-wrap justify-between items-center gap-4">
        <div><div className="flex items-center gap-2"><span className="text-[20px]">☁️</span><h1 className="text-[18px] font-bold">TeraBox</h1><span className="text-[10px] px-2 py-1 rounded-full bg-white/20">1024GB</span></div><p className="text-[12px] text-[#BAE6FD] mt-1">{files.length} ملفات - {(total/1024/1024).toFixed(1)} MB / 1TB - محفوظة على جهازك</p></div>
        <label className="h-10 px-5 rounded-xl bg-white text-[#0284C7] text-[12px] font-bold flex items-center cursor-pointer hover:bg-[#F0F9FF]">{loading?'جاري...':'+ رفع إلى TeraBox'}<input type="file" multiple onChange={async e=>{const sel=Array.from(e.target.files||[]); e.target.value=''; if(!sel.length) return; setLoading(true); try{for(const f of sel) await saveDeviceFile(f,'terabox'); await load()} finally{setLoading(false)}}} className="hidden" /></label>
      </div>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
        {files.map(f=><div key={f.id} className="bg-white rounded-[16px] border border-[#EEF0F6] p-4 hover:border-[#0EA5E9]/30 transition">
          <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[10px] font-bold text-[#0284C7]">{f.name.split('.').pop()?.slice(0,4).toUpperCase()}</div>
          <p className="font-bold text-[12px] mt-3 truncate">{f.name}</p><p className="text-[11px] text-[#9CA3AF] mt-1">{(f.size/1024).toFixed(1)} KB - على جهازك</p>
          <div className="mt-3 flex gap-2"><button onClick={async()=>{const file=await getDeviceFile(f.id); const url=URL.createObjectURL(file.blob); const a=document.createElement('a'); a.href=url; a.download=file.name; a.click()}} className="flex-1 h-8 rounded-xl bg-[#F9FAFB] border text-[11px] hover:bg-[#0EA5E9] hover:text-white transition">تنزيل</button><button onClick={async()=>{await deleteDeviceFile(f.id); await load()}} className="w-8 h-8 rounded-xl border text-[#9CA3AF] hover:text-red-500">✕</button></div>
        </div>)}
        {!files.length&&<div className="col-span-3 py-16 text-center bg-white rounded-[16px] border border-dashed"><div className="text-[32px]">☁️</div><p className="text-[13px] text-[#6B7280] mt-2">TeraBox فارغة - ارفع ملفاتك، تظهر دائما على جهازك</p><p className="text-[11px] text-[#9CA3AF] mt-1">1024GB مجانا - آمن ومشفر - محفوظ محليا</p></div>}
      </div>
    </div>
  )
}

function PomoView() {
  const [work, setWork] = useState(25); const [brk, setBrk] = useState(5); const [sec, setSec] = useState(25*60); const [run, setRun] = useState(false); const [mode, setMode] = useState('work'); const ref=useRef(null)
  useEffect(()=>setSec(work*60),[work])
  useEffect(()=>{ if(!run) return; ref.current=setInterval(()=>setSec(s=>{ if(s<=1){ const nm=mode==='work'?'break':'work'; setMode(nm); return nm==='work'?work*60:brk*60 } return s-1 }),1000); return()=>clearInterval(ref.current) },[run,mode,work,brk])
  const m=Math.floor(sec/60), s=sec%60
  return (
    <div className="max-w-[400px] mx-auto space-y-4">
      <div className="bg-white rounded-[16px] border border-[#EEF0F6] p-4 flex gap-4 justify-center"><div className="flex items-center gap-2"><span className="text-[11px]">عمل</span><input type="number" value={work} onChange={e=>setWork(Math.max(1,parseInt(e.target.value)||1))} className="w-14 h-8 rounded-xl bg-[#F9FAFB] border px-2 text-[12px] text-center" /></div><div className="flex items-center gap-2"><span className="text-[11px]">راحة</span><input type="number" value={brk} onChange={e=>setBrk(Math.max(1,parseInt(e.target.value)||1))} className="w-14 h-8 rounded-xl bg-[#F9FAFB] border px-2 text-[12px] text-center" /></div></div>
      <div className="bg-white rounded-[16px] border border-[#EEF0F6] p-8 text-center"><div className="text-[10px] text-[#9CA3AF] font-bold">{mode==='work'?'تركيز':'راحة'}</div><div className="text-[48px] font-bold mt-2">{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</div><div className="mt-6 flex gap-2 justify-center"><button onClick={()=>setRun(!run)} className="h-10 px-8 rounded-xl bg-[#6C5CE7] text-white text-[13px]">{run?'وقف':'ابدأ'}</button><button onClick={()=>{setRun(false); setSec(work*60)}} className="h-10 px-6 rounded-xl bg-[#F9FAFB] border text-[13px]">تصفير</button></div></div>
    </div>
  )
}

function FlashView() {
  const [cards, setCards] = useState(()=>{ try { return JSON.parse(localStorage.getItem('rafeaq_flash')||'[]') } catch(e) { return [] } })
  useEffect(()=>{ localStorage.setItem('rafeaq_flash', JSON.stringify(cards)) },[cards])
  return (
    <div className="max-w-[480px] mx-auto"><div className="flex justify-between items-center mb-6"><h3 className="text-[18px] font-bold">بطاقات المراجعة</h3><button onClick={()=>{const q=prompt('السؤال؟'); if(!q) return; const a=prompt('الجواب؟'); if(!a) return; setCards([...cards,{q,a}])}} className="h-9 px-4 rounded-xl bg-[#6C5CE7] text-white text-[12px]">+ بطاقة</button></div><div className="space-y-2">{cards.map((c,i)=><div key={i} className="bg-white rounded-[16px] border border-[#EEF0F6] p-4"><div className="font-medium text-[13px]">{c.q}</div><div className="text-[12px] text-[#8A919E] mt-1">{c.a}</div></div>)} {!cards.length&&<div className="py-12 text-center bg-white border-dashed border rounded-[16px] text-[12px] text-[#9CA3AF]">لا توجد بطاقات</div>}</div></div>
  )
}

function ExamView() {
  const [exams, setExams] = useState(()=>{ try { return JSON.parse(localStorage.getItem('rafeaq_exams')||'[]') } catch(e) { return [] } })
  useEffect(()=>{ localStorage.setItem('rafeaq_exams', JSON.stringify(exams)) },[exams])
  return (
    <div className="max-w-[480px] mx-auto"><div className="flex justify-between items-center mb-6"><h3 className="text-[18px] font-bold">الامتحانات</h3><button onClick={()=>{const n=prompt('اسم الامتحان؟'); if(!n) return; const d=prompt('YYYY-MM-DD'); if(!d) return; setExams([...exams,{id:Date.now(),name:n,date:d}])}} className="h-9 px-4 rounded-xl bg-[#6C5CE7] text-white text-[12px]">+ امتحان</button></div><div className="space-y-2">{exams.map(ex=>{const diff=Math.ceil((new Date(ex.date)-new Date())/(1000*60*60*24)); return <div key={ex.id} className="bg-white rounded-[16px] border border-[#EEF0F6] p-4 flex justify-between items-center"><div><div className="font-medium text-[13px]">{ex.name}</div><div className="text-[11px] text-[#8A919E] mt-1">{ex.date}</div></div><div className="text-[18px] font-bold">{diff}ي</div></div>})} {!exams.length&&<div className="py-12 text-center bg-white border-dashed border rounded-[16px] text-[12px] text-[#9CA3AF]">لا توجد امتحانات</div>}</div></div>
  )
}

function NotionView() {
  return <div className="max-w-[600px] mx-auto bg-white rounded-[16px] border border-[#EEF0F6] p-12 text-center"><div className="w-16 h-16 mx-auto rounded-2xl bg-black text-white flex items-center justify-center font-black text-[24px]">N</div><h2 className="mt-4 text-[18px] font-bold">Notion AI</h2><p className="text-[12px] text-[#8A919E] mt-2">أفكار وتنظيم أفضل - قريباً</p></div>
}
function MoreView() {
  return <div className="max-w-[600px] mx-auto bg-white rounded-[16px] border border-[#EEF0F6] p-12 text-center"><div className="text-[32px]">•••</div><h2 className="mt-4 text-[18px] font-bold">المزيد</h2><p className="text-[12px] text-[#8A919E] mt-2">أدوات أخرى قريباً</p></div>
}
function SettingsView({ user, logout }) {
  return <div className="max-w-[500px] mx-auto bg-white rounded-[16px] border border-[#EEF0F6] p-6"><h2 className="text-[18px] font-bold">الإعدادات</h2><div className="mt-6 space-y-3"><div className="p-4 rounded-xl bg-[#F9FAFB] border"><div className="text-[12px] text-[#6B7280]">المستخدم</div><div className="font-bold mt-1">{user}</div></div><button onClick={logout} className="w-full h-11 rounded-xl bg-red-50 border border-red-200 text-red-600 font-medium">تسجيل الخروج</button></div></div>
}