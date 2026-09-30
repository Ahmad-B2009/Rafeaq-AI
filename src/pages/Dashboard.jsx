import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function getLS(key, fallback){
  try{
    const s = localStorage.getItem(key)
    if(s) return JSON.parse(s)
  }catch(e){}
  return fallback
}

export default function Dashboard(){
  const nav = useNavigate()
  const [tab,setTab] = useState('home')
  const [user,setUser] = useState('أحمد')
  const [msgs,setMsgs] = useState(()=>getLS('rafeaq_msgs', [{role:'assistant', text:'أهلاً يا أحمد! 👋\nأنا رفيق AI - مساعدك الدراسي. أقدر أشرح بلهجة ليبية، ألخص، أدير اختبارات، وأربط مع Notion.'}]))
  const [inp,setInp] = useState('')
  const [isAiLoading,setIsAiLoading] = useState(false)
  const bottomRef = useRef(null)

  const [notes,setNotes] = useState(()=>getLS('rafeaq_notes', []))
  const [activeNoteId,setActiveNoteId] = useState(null)
  const [files,setFiles] = useState(()=>getLS('rafeaq_files', []))
  const [terabox,setTerabox] = useState(()=>getLS('rafeaq_terabox', []))
  const [slides,setSlides] = useState(()=>getLS('rafeaq_slides', [{id:1,title:'مقدمة الدرس',content:'اكتب محتوى الدرس هنا...'}]))
  const [activeSlide,setActiveSlide] = useState(0)
  const [notionTasks,setNotionTasks] = useState(()=>getLS('rafeaq_notion', [
    {id:1, name:'ملخص رياضيات', status:'جاري', subject:'رياضيات', date:'27 أغسطس'},
    {id:2, name:'واجب فيزياء', status:'منجز', subject:'فيزياء', date:'26 أغسطس'},
    {id:3, name:'عرض عربي', status:'لم يبدأ', subject:'عربية', date:'28 أغسطس'},
  ]))
  const [pomoTime,setPomoTime] = useState(25*60)
  const [pomoRunning,setPomoRunning] = useState(false)
  const [pomoMode,setPomoMode] = useState('work')

  useEffect(()=>{
    const u = localStorage.getItem('rafeaq_user') || localStorage.getItem('rafeaq_name') || 'أحمد محمد'
    setUser(u.split('@')[0])
    if(!localStorage.getItem('rafeaq_token')) nav('/login')
  },[nav])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs, tab])
  useEffect(()=>{ localStorage.setItem('rafeaq_msgs', JSON.stringify(msgs)) },[msgs])
  useEffect(()=>{ localStorage.setItem('rafeaq_notes', JSON.stringify(notes)) },[notes])
  useEffect(()=>{ localStorage.setItem('rafeaq_files', JSON.stringify(files)) },[files])
  useEffect(()=>{ localStorage.setItem('rafeaq_terabox', JSON.stringify(terabox)) },[terabox])
  useEffect(()=>{ localStorage.setItem('rafeaq_slides', JSON.stringify(slides)) },[slides])
  useEffect(()=>{ localStorage.setItem('rafeaq_notion', JSON.stringify(notionTasks)) },[notionTasks])

  useEffect(()=>{
    if(!pomoRunning) return
    const id = setInterval(()=> setPomoTime(t=> t>1 ? t-1 : 0), 1000)
    return ()=> clearInterval(id)
  },[pomoRunning])

  function logout(){
    localStorage.removeItem('rafeaq_token')
    sessionStorage.setItem('just_logged_out','1')
    nav('/login')
  }

  async function send(t){
    const q = (t||inp).trim()
    if(!q) return
    setMsgs(m=>[...m,{role:'user',text:q}])
    setInp('')
    setIsAiLoading(true)
    try{
      const res = await fetch('/api/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({message:q, user:user})
      })
      const data = await res.json()
      const reply = data.reply || data.text || `تمام يا ${user}: "${q}" نشرحهولك بلهجة ليبية...`
      setMsgs(m=>[...m,{role:'assistant',text:reply}])
    }catch(e){
      setMsgs(m=>[...m,{role:'assistant',text:`تمام يا ${user}: "${q}"\nشرح بلهجة ليبية بسيطة... (اربط OPENAI_API_KEY)`}])
    }
    setIsAiLoading(false)
  }

  function addNote(){
    const n = {id:Date.now(), title:'ملاحظة جديدة', content:'', date:new Date().toLocaleDateString('ar-LY')}
    setNotes([n,...notes])
    setActiveNoteId(n.id)
  }

  function handleUpload(e, target){
    const file = e.target.files && e.target.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = ()=>{
      const item = {id:Date.now(), name:file.name, size:file.size, type:file.type, data:reader.result, date:new Date().toLocaleDateString('ar-LY')}
      if(target==='docs') setFiles(f=>[item,...f])
      else setTerabox(f=>[item,...f])
    }
    reader.readAsDataURL(file)
  }

  const totalBytes = [...files, ...terabox].reduce((s,f)=>s+(f.size||0),0)
  const totalMB = (totalBytes/1024/1024).toFixed(1)

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');*{font-family:'Tajawal',sans-serif}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:#E9E5FF;border-radius:10px}`}</style>

      {/* SIDEBAR DARK - EXACT LIKE IMAGE */}
      <div className="w-[230px] bg-[#111827] hidden lg:flex flex-col fixed right-0 top-0 h-screen z-30">
        <div className="p-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#7C6BFF] flex items-center justify-center text-white font-black text-[14px]">ر</div>
            <div>
              <div className="font-bold text-[13px] text-white">رفيق AI</div>
              <div className="text-[9px] text-white/50 -mt-0.5">Rafeaq • Notion</div>
            </div>
          </div>
          <div className="mt-8 space-y-1.5">
            <button onClick={()=>setTab('home')} className={`w-full flex items-center gap-3 px-3 h-9 rounded-[10px] text-right text-[12px] ${tab==='home' ? 'bg-[#7C6BFF] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>⌂ الرئيسية</button>
            <button onClick={()=>setTab('ai')} className={`w-full flex items-center gap-3 px-3 h-9 rounded-[10px] text-right text-[12px] ${tab==='ai' ? 'bg-[#7C6BFF] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>✦ الذكاء الاصطناعي</button>
            <button onClick={()=>setTab('notebook')} className={`w-full flex items-center gap-3 px-3 h-9 rounded-[10px] text-right text-[12px] ${tab==='notebook' ? 'bg-[#7C6BFF] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>📓 دفتر رفيق</button>
            <button onClick={()=>setTab('docs')} className={`w-full flex items-center gap-3 px-3 h-9 rounded-[10px] text-right text-[12px] ${tab==='docs' ? 'bg-[#7C6BFF] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>📄 المستندات</button>
            <button onClick={()=>setTab('slides')} className={`w-full flex items-center gap-3 px-3 h-9 rounded-[10px] text-right text-[12px] ${tab==='slides' ? 'bg-[#7C6BFF] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>🎨 العروض</button>
            <button onClick={()=>setTab('library')} className={`w-full flex items-center gap-3 px-3 h-9 rounded-[10px] text-right text-[12px] ${tab==='library' ? 'bg-[#7C6BFF] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>📚 مكتبة + TeraBox</button>
            <button onClick={()=>setTab('notion')} className={`w-full flex items-center gap-3 px-3 h-9 rounded-[10px] text-right text-[12px] ${tab==='notion' ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              <span className="w-5 h-5 bg-white rounded-[4px] flex items-center justify-center text-[12px] font-black text-black">N</span> Notion
            </button>
            <button onClick={()=>setTab('pomo')} className={`w-full flex items-center gap-3 px-3 h-9 rounded-[10px] text-right text-[12px] ${tab==='pomo' ? 'bg-[#7C6BFF] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>⏱️ بومودورو</button>
          </div>
        </div>
        <div className="mt-auto p-4 border-t border-white/5">
          <div className="bg-[#1F2937] rounded-[12px] p-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#EDE9FF] flex items-center justify-center text-[10px]">👤</div>
              <div><div className="text-[11px] font-bold text-white">{user}</div><div className="text-[9px] text-white/50">طالب • {totalMB} MB</div></div>
            </div>
          </div>
          <button onClick={logout} className="w-full mt-3 h-8 rounded-full bg-white/5 text-white/60 text-[10px] hover:bg-white/10">تسجيل الخروج ↪</button>
        </div>
      </div>

      <div className="flex-1 lg:mr-[230px]">
        <div className="h-[56px] bg-white border-b border-[#EEF0F6] flex items-center justify-between px-5 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1 max-w-[420px]">
            <div className="relative flex-1">
              <input placeholder="ابحث في الدروس أو الواجبات" className="w-full h-8 pr-8 pl-16 rounded-[8px] bg-[#F3F4F6] border border-transparent text-[11px] outline-none focus:bg-white focus:border-[#E5E7EB]" />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] opacity-40">🔍</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] bg-white border px-1.5 py-0.5 rounded">Ctrl + K</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-[#6B7280] hidden md:block">السبت 23 أغسطس 2025<br/><span className="text-[9px] opacity-60">10:24 ص</span></div>
            <button className="w-8 h-8 rounded-full bg-[#F9FAFB] flex items-center justify-center text-[14px]">🔔</button>
            <div className="w-8 h-8 rounded-full bg-[#7C6BFF] text-white flex items-center justify-center text-[11px] font-bold">{user[0]||'A'}</div>
          </div>
        </div>

        <div className="p-5">
          <div className="max-w-[1400px] mx-auto">

            {tab==='home' && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
              <div className="xl:col-span-3 space-y-4">
                <div className="rounded-[16px] overflow-hidden relative h-[160px] bg-gradient-to-l from-[#9F8CFF] via-[#A78BFA] to-[#C4B5FD] flex items-center px-8">
                  <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-l from-[#7C6BFF]/80 to-[#A78BFA]/40"></div>
                  <div className="absolute left-[28%] top-1/2 -translate-y-1/2 z-10 hidden md:block">
                    <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-[#EDE9FF] to-[#A78BFA] shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center justify-center text-[28px]">🪐</div>
                  </div>
                  <div className="relative z-10 flex-1">
                    <h1 className="text-[20px] font-[800] text-white">مرحبا، {user} 👋</h1>
                    <p className="text-[11px] text-white/90 mt-1">مستعد للاستمرار في رحلتك الدراسية • مع Notion</p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={()=>setTab('ai')} className="h-8 px-4 rounded-full bg-white text-[#7C6BFF] text-[11px] font-bold">ابدأ رحلة مع رفيق →</button>
                      <button onClick={()=>setTab('notion')} className="h-8 px-3 rounded-full bg-black text-white text-[10px] flex items-center gap-1"><span className="w-4 h-4 bg-white rounded-[3px] flex items-center justify-center text-black font-black text-[10px]">N</span> فتح Notion</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white rounded-[12px] border border-[#F0ECFF] p-4 cursor-pointer hover:shadow-sm" onClick={()=>setTab('notebook')}>
                    <div className="w-8 h-8 rounded-[8px] bg-[#F5F3FF] flex items-center justify-center">📓</div>
                    <div className="mt-3 font-bold text-[11px]">دفتر رفيق</div>
                    <div className="text-[10px] text-[#8B8BA7] mt-1">{notes.length} ملاحظات</div>
                  </div>
                  <div className="bg-white rounded-[12px] border border-[#F0ECFF] p-4 cursor-pointer hover:shadow-sm" onClick={()=>setTab('ai')}>
                    <div className="w-8 h-8 rounded-[8px] bg-[#ECFDF5] flex items-center justify-center">💬</div>
                    <div className="mt-3 font-bold text-[11px]">الذكاء الاصطناعي</div>
                    <div className="text-[10px] text-[#8B8BA7] mt-1">{msgs.length} رسائل</div>
                  </div>
                  <div className="bg-white rounded-[12px] border border-[#F0ECFF] p-4 cursor-pointer hover:shadow-sm" onClick={()=>setTab('notion')}>
                    <div className="w-8 h-8 rounded-[8px] bg-black flex items-center justify-center"><span className="w-5 h-5 bg-white rounded-[3px] flex items-center justify-center font-black text-[11px]">N</span></div>
                    <div className="mt-3 font-bold text-[11px]">Notion</div>
                    <div className="text-[10px] text-[#8B8BA7] mt-1">{notionTasks.length} مهام</div>
                  </div>
                  <div className="bg-white rounded-[12px] border border-[#F0ECFF] p-4 cursor-pointer hover:shadow-sm" onClick={()=>setTab('library')}>
                    <div className="w-8 h-8 rounded-[8px] bg-[#FFF7ED] flex items-center justify-center">☁️</div>
                    <div className="mt-3 font-bold text-[11px]">TeraBox 1TB</div>
                    <div className="text-[10px] text-[#8B8BA7] mt-1">{totalMB} MB</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#F0ECFF] p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-[12px] flex items-center gap-2"><span className="w-5 h-5 bg-black rounded-[4px] flex items-center justify-center text-white font-black text-[10px]">N</span> Notion - مهامك</h3>
                      <button onClick={()=>setTab('notion')} className="text-[10px] text-[#8B8BA7]">فتح Notion →</button>
                    </div>
                    <div className="space-y-2">
                      {notionTasks.slice(0,4).map(t=>(
                        <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-[8px] border border-[#F3F0FF] bg-[#FAFBFF]">
                          <div className={`w-2 h-2 rounded-full ${t.status==='منجز'?'bg-green-500':t.status==='جاري'?'bg-yellow-500':'bg-gray-300'}`}></div>
                          <div className="flex-1"><div className="text-[11px] font-bold">{t.name}</div><div className="text-[9px] text-[#8B8BA7]">{t.subject} • {t.date}</div></div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border ${t.status==='منجز'?'bg-green-50 text-green-700 border-green-200':t.status==='جاري'?'bg-yellow-50 text-yellow-700 border-yellow-200':'bg-gray-50 text-gray-600'}`}>{t.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-[12px] border border-[#F0ECFF] p-4">
                      <h3 className="font-bold text-[12px] mb-3">📊 إحصائياتك</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#F8F7FF] rounded-[10px] p-3 text-center border"><div className="text-[18px] font-bold">{notes.length + files.length}</div><div className="text-[9px] text-[#8B8BA7]">ملفات وملاحظات</div></div>
                        <div className="bg-[#F8F7FF] rounded-[10px] p-3 text-center border"><div className="text-[18px] font-bold">{notionTasks.length}</div><div className="text-[9px] text-[#8B8BA7]">مهام Notion</div></div>
                        <div className="bg-[#F8F7FF] rounded-[10px] p-3 text-center border"><div className="text-[18px] font-bold">{totalMB}</div><div className="text-[9px] text-[#8B8BA7]">MB</div></div>
                        <div className="bg-[#F8F7FF] rounded-[10px] p-3 text-center border"><div className="text-[18px] font-bold">90%</div><div className="text-[9px] text-[#8B8BA7]">تقدم</div></div>
                      </div>
                    </div>
                    <div className="bg-black rounded-[12px] p-4 text-white">
                      <div className="flex items-center gap-2"><div className="w-6 h-6 bg-white rounded-[4px] flex items-center justify-center text-black font-black text-[12px]">N</div><div className="text-[11px] font-bold">Notion متصل ✅</div></div>
                      <div className="text-[10px] opacity-60 mt-2 leading-4">كل مهامك تتزامن مع Notion محليا. تقدر تصدّر ل Notion الحقيقي.</div>
                      <button onClick={()=>setTab('notion')} className="mt-3 w-full h-8 rounded-full bg-white text-black text-[10px] font-bold">فتح لوحة Notion</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-[12px] border border-[#F0ECFF] p-4">
                  <div className="text-[11px] font-bold">الرسائل المتبقية اليوم</div>
                  <div className="text-[10px] font-bold mt-1">12 / 25</div>
                  <div className="w-full h-1.5 bg-[#F3F0FF] rounded-full mt-3"><div className="h-full bg-[#7C6BFF] w-[48%] rounded-full"></div></div>
                </div>
                <div className="bg-white rounded-[12px] border border-[#F0ECFF] overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80" alt="" className="w-full h-[110px] object-cover" />
                  <div className="p-3"><div className="text-[10px] leading-4 font-bold">الواجبات</div><div className="text-[9px] text-[#8B8BA7] mt-1">{files.length} ملفات • {notes.length} ملاحظات</div></div>
                </div>
                <div className="bg-gradient-to-br from-[#EDE9FF] to-[#F5F3FF] rounded-[12px] border border-[#E9D5FF] p-4 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center">🤖</div>
                  <div className="mt-2 font-bold text-[11px]">رفيق AI</div>
                  <div className="text-[9px] text-[#6B7280] mt-1">مع Notion و TeraBox</div>
                  <button onClick={()=>setTab('ai')} className="mt-3 w-full h-8 rounded-full bg-[#7C6BFF] text-white text-[10px] font-bold">→ ابدأ المحادثة</button>
                </div>
              </div>
            </div>
            )}

            {tab==='ai' && (
              <div className="max-w-[900px] mx-auto bg-white rounded-[16px] border border-[#F0ECFF] overflow-hidden">
                <div className="p-4 border-b bg-[#FAFBFF] flex justify-between items-center">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-[#7C6BFF] text-white flex items-center justify-center">🤖</div><div><div className="text-[13px] font-bold">رفيق AI + Notion</div><div className="text-[10px] text-[#8B8BA7]">يشرح بلهجة ليبية 🇱🇾 • يحفظ في Notion</div></div></div>
                  <button onClick={()=>setMsgs([{role:'assistant',text:'هلا! شن تبي؟'}])} className="text-[10px] px-3 py-1 rounded-full border bg-white">مسح</button>
                </div>
                <div className="h-[55vh] overflow-y-auto p-5 space-y-4 bg-[#FCFBFF]">
                  {msgs.map((m,i)=>(
                    <div key={i} className={`flex ${m.role==='user'?'justify-start':'justify-end'}`}>
                      <div className={`max-w-[78%] rounded-[14px] px-4 py-3 text-[12px] leading-6 whitespace-pre-wrap ${m.role==='user'?'bg-[#111827] text-white':'bg-white border'}`}>{m.text}</div>
                    </div>
                  ))}
                  {isAiLoading && <div className="flex justify-end"><div className="bg-white border rounded-[14px] px-4 py-2 text-[11px]">يكتب... ●●●</div></div>}
                  <div ref={bottomRef}/>
                </div>
                <div className="p-3 border-t bg-white flex gap-2">
                  <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="اسأل رفيق AI..." className="flex-1 h-11 rounded-full bg-[#F8F7FF] border px-5 text-[12px] outline-none focus:border-[#7C6BFF]" />
                  <button onClick={()=>send()} className="w-11 h-11 rounded-full bg-black text-white">↑</button>
                </div>
              </div>
            )}

            {tab==='notebook' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white rounded-[12px] border p-4">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-[12px]">📓 دفتر رفيق ({notes.length})</h3><button onClick={addNote} className="h-8 px-3 rounded-full bg-black text-white text-[11px]">+ جديد</button></div>
                  <div className="space-y-2 max-h-[65vh] overflow-y-auto">
                    {notes.map(n=>(
                      <button key={n.id} onClick={()=>setActiveNoteId(n.id)} className={`w-full text-right p-3 rounded-[10px] border text-[11px] ${activeNoteId===n.id?'bg-black text-white':'bg-[#FAFBFF]'}`}>
                        <div className="font-bold truncate">{n.title}</div><div className="text-[10px] opacity-60 mt-1">{n.content.slice(0,40)}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-[12px] border p-6 min-h-[60vh]">
                  {activeNoteId ? (
                    (()=>{ const note = notes.find(n=>n.id===activeNoteId); if(!note) return null; return (
                      <div>
                        <input value={note.title} onChange={e=>setNotes(ns=>ns.map(x=>x.id===activeNoteId?{...x,title:e.target.value}:x))} className="w-full text-[16px] font-bold outline-none" placeholder="عنوان" />
                        <textarea value={note.content} onChange={e=>setNotes(ns=>ns.map(x=>x.id===activeNoteId?{...x,content:e.target.value}:x))} className="w-full h-[50vh] mt-4 outline-none text-[12px] leading-7 resize-none" placeholder="اكتب هنا..." />
                        <div className="flex gap-2 mt-3"><button onClick={()=>{ setNotes(ns=>ns.filter(x=>x.id!==activeNoteId)); setActiveNoteId(null)}} className="text-[10px] px-3 py-1 rounded-full bg-red-50 text-red-600 border">حذف</button><button onClick={()=>{ setTab('notion'); setNotionTasks([...notionTasks,{id:Date.now(), name:note.title, status:'جاري', subject:'ملاحظة', date:new Date().toLocaleDateString('ar-LY')}])}} className="text-[10px] px-3 py-1 rounded-full bg-black text-white flex items-center gap-1"><span className="w-3 h-3 bg-white rounded-[2px] flex items-center justify-center text-black font-black text-[8px]">N</span> أرسل ل Notion</button></div>
                      </div>
                    )})()
                  ) : (
                    <div className="h-[50vh] flex flex-col items-center justify-center text-center"><div className="w-16 h-16 rounded-full bg-[#F8F7FF] flex items-center justify-center text-[24px]">📓</div><div className="mt-3 font-bold text-[13px]">دفتر رفيق</div><div className="text-[10px] text-[#8B8BA7] mt-1">محفوظ محليا + يرتبط مع Notion</div><button onClick={addNote} className="mt-4 px-4 py-2 rounded-full bg-black text-white text-[11px]">+ ملاحظة جديدة</button></div>
                  )}
                </div>
              </div>
            )}

            {tab==='docs' && (
              <div className="bg-white rounded-[12px] border p-6">
                <div className="flex justify-between items-center mb-5"><h3 className="font-bold text-[13px]">📄 المستندات ({files.length})</h3><label className="h-9 px-4 rounded-full bg-black text-white text-[11px] flex items-center justify-center cursor-pointer">+ رفع PDF<input type="file" className="hidden" onChange={e=>handleUpload(e,'docs')} /></label></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {files.map(f=>(
                    <div key={f.id} className="border rounded-[12px] p-4 bg-[#FAFBFF]"><div className="font-bold text-[11px] truncate">{f.name}</div><div className="text-[10px] text-[#8B8BA7] mt-1">{f.date}</div><div className="flex gap-2 mt-3"><a href={f.data} download={f.name} className="text-[10px] px-2 py-1 rounded-full bg-white border">تحميل</a><button onClick={()=>setFiles(fs=>fs.filter(x=>x.id!==f.id))} className="text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-600">حذف</button></div></div>
                  ))}
                  {files.length===0 && <div className="col-span-3 py-16 text-center text-[11px] text-[#8B8BA7]">مافيش ملفات - ارفع PDF</div>}
                </div>
              </div>
            )}

            {tab==='slides' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-[12px] border p-4">
                  <h3 className="font-bold text-[12px] mb-4">🎨 العروض ({slides.length})</h3>
                  <div className="space-y-2">{slides.map((s,i)=><button key={s.id||i} onClick={()=>setActiveSlide(i)} className={`w-full text-right p-3 rounded-[10px] border text-[11px] ${activeSlide===i?'bg-black text-white':'bg-[#FAFBFF]'}`}>{i+1}. {s.title}</button>)}</div>
                  <button onClick={()=>setSlides([...slides,{id:Date.now(),title:`شريحة ${slides.length+1}`,content:'...'}])} className="w-full mt-4 h-9 rounded-full border text-[11px]">+ شريحة</button>
                </div>
                <div className="lg:col-span-3 bg-white rounded-[16px] border p-10 min-h-[400px] flex flex-col justify-center">
                  <input value={slides[activeSlide]?.title||''} onChange={e=>{ const ns=[...slides]; ns[activeSlide].title=e.target.value; setSlides(ns)}} className="text-[24px] font-bold text-center outline-none" />
                  <textarea value={slides[activeSlide]?.content||''} onChange={e=>{ const ns=[...slides]; ns[activeSlide].content=e.target.value; setSlides(ns)}} className="w-full mt-6 h-[200px] outline-none text-[13px] leading-7 text-center resize-none" />
                </div>
              </div>
            )}

            {tab==='library' && (
              <div className="space-y-5">
                <div className="rounded-[16px] bg-gradient-to-br from-[#7C6BFF] to-[#4F46E5] p-6 text-white flex justify-between items-center">
                  <div><div className="font-bold text-[14px]">☁️ TeraBox 1TB</div><div className="text-[11px] opacity-80 mt-1">{terabox.length + files.length} ملفات • {totalMB} MB محفوظة محليا</div></div>
                  <label className="bg-white text-black text-[11px] font-bold px-4 py-2 rounded-full cursor-pointer">+ رفع<input type="file" className="hidden" onChange={e=>handleUpload(e,'terabox')} /></label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {terabox.map(f=>(
                    <div key={f.id} className="bg-white border rounded-[12px] p-4"><div className="w-8 h-8 rounded-[8px] bg-[#F5F3FF] flex items-center justify-center">☁️</div><div className="mt-2 font-bold text-[10px] truncate">{f.name}</div><div className="flex gap-1 mt-2"><a href={f.data} download={f.name} className="text-[9px] px-2 py-1 rounded-full bg-[#F5F3FF]">تحميل</a><button onClick={()=>setTerabox(t=>t.filter(x=>x.id!==f.id))} className="text-[9px] px-2 py-1 rounded-full bg-red-50 text-red-600">حذف</button></div></div>
                  ))}
                </div>
                <div className="bg-white rounded-[12px] border p-5">
                  <h3 className="font-bold text-[12px]">📚 مكتبة الامجاد</h3>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <a href="https://alamjad-ly.com" target="_blank" className="border rounded-[10px] p-4 bg-[#FFFBEB]"><div className="font-bold text-[11px]">موقع الامجاد</div><div className="text-[9px] text-[#8B8BA7] mt-1">alamjad-ly.com</div></a>
                    <div className="border rounded-[10px] p-4 bg-[#ECFDF5]"><div className="font-bold text-[11px]">مكتبة رفيق</div><div className="text-[9px] text-[#8B8BA7] mt-1">{files.length + terabox.length} ملفات</div></div>
                  </div>
                </div>
              </div>
            )}

            {tab==='notion' && (
              <div className="space-y-5">
                <div className="bg-black rounded-[16px] p-6 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-[8px] flex items-center justify-center text-black font-black text-[18px]">N</div>
                    <div>
                      <div className="font-bold text-[15px]">Notion • نظام إدارة الدراسة</div>
                      <div className="text-[11px] opacity-60 mt-1">قاعدة بيانات مهامك - نفس ستايل Notion بالزبط</div>
                    </div>
                  </div>
                  <button onClick={()=>setNotionTasks([...notionTasks,{id:Date.now(), name:'مهمة جديدة', status:'لم يبدأ', subject:'عام', date:new Date().toLocaleDateString('ar-LY')}])} className="h-9 px-4 rounded-full bg-white text-black text-[11px] font-bold">+ New</button>
                </div>

                <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden">
                  <div className="p-3 border-b bg-[#FAFAFA] flex items-center gap-2 text-[11px]"><span className="w-5 h-5 bg-black rounded-[4px] flex items-center justify-center text-white font-black text-[10px]">N</span> مهام رفيق • {notionTasks.length} tasks</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-[#FAFAFA] border-b text-[10px] text-[#6B7280]">
                        <tr><th className="p-3 font-medium">الاسم</th><th className="p-3 font-medium">المادة</th><th className="p-3 font-medium">الحالة</th><th className="p-3 font-medium">التاريخ</th><th className="p-3 font-medium"></th></tr>
                      </thead>
                      <tbody>
                        {notionTasks.map(t=>(
                          <tr key={t.id} className="border-b hover:bg-[#FAFBFF] group">
                            <td className="p-3"><input value={t.name} onChange={e=>setNotionTasks(ts=>ts.map(x=>x.id===t.id?{...x,name:e.target.value}:x))} className="bg-transparent outline-none text-[11px] font-medium w-full" /></td>
                            <td className="p-3"><input value={t.subject} onChange={e=>setNotionTasks(ts=>ts.map(x=>x.id===t.id?{...x,subject:e.target.value}:x))} className="bg-transparent outline-none text-[10px] w-[80px]" /></td>
                            <td className="p-3">
                              <select value={t.status} onChange={e=>setNotionTasks(ts=>ts.map(x=>x.id===t.id?{...x,status:e.target.value}:x))} className={`text-[10px] px-2 py-1 rounded-full border outline-none ${t.status==='منجز'?'bg-green-50 text-green-700 border-green-200':t.status==='جاري'?'bg-yellow-50 text-yellow-700 border-yellow-200':'bg-gray-50'}`}>
                                <option>لم يبدأ</option><option>جاري</option><option>منجز</option>
                              </select>
                            </td>
                            <td className="p-3 text-[10px] text-[#8B8BA7]">{t.date}</td>
                            <td className="p-3"><button onClick={()=>setNotionTasks(ts=>ts.filter(x=>x.id!==t.id))} className="opacity-0 group-hover:opacity-100 text-[10px] text-red-500">حذف</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-2 bg-[#FAFAFA] border-t flex items-center gap-2 text-[10px] text-[#8B8BA7]">
                    <span>+ New</span><span className="mr-auto">{notionTasks.filter(t=>t.status==='منجز').length} منجز • {notionTasks.filter(t=>t.status==='جاري').length} جاري</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-4 bg-black rounded-[3px] flex items-center justify-center text-white font-black text-[8px]">N</span> Notion-style</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-[12px] border p-4 text-center"><div className="w-8 h-8 mx-auto bg-black rounded-[6px] flex items-center justify-center text-white font-black">N</div><div className="mt-2 font-bold text-[11px]">تصدير ل Notion</div><div className="text-[9px] text-[#8B8BA7] mt-1">انسخ الجدول والصقه في Notion الحقيقي</div><button onClick={()=>navigator.clipboard.writeText(JSON.stringify(notionTasks,null,2))} className="mt-3 w-full h-8 rounded-full bg-black text-white text-[10px]">نسخ JSON</button></div>
                  <div className="bg-white rounded-[12px] border p-4 text-center"><div className="w-8 h-8 mx-auto bg-[#F5F3FF] rounded-[6px] flex items-center justify-center">🤖</div><div className="mt-2 font-bold text-[11px]">ربط مع AI</div><div className="text-[9px] text-[#8B8BA7] mt-1">رفيق يقرا مهام Notion ويذكرك</div><button onClick={()=>{ setTab('ai'); setTimeout(()=>send(`عندي هذه المهام في Notion: ${notionTasks.map(t=>t.name).join(', ')} - نظملي جدول مذاكرة`),200)}} className="mt-3 w-full h-8 rounded-full bg-[#7C6BFF] text-white text-[10px]">نظملي جدول ✨</button></div>
                  <div className="bg-white rounded-[12px] border p-4 text-center"><div className="w-8 h-8 mx-auto bg-[#FFF7ED] rounded-[6px] flex items-center justify-center">☁️</div><div className="mt-2 font-bold text-[11px]">TeraBox + Notion</div><div className="text-[9px] text-[#8B8BA7] mt-1">{totalMB} MB + {notionTasks.length} مهام</div><div className="mt-3 w-full h-8 rounded-full bg-[#F8F7FF] border flex items-center justify-center text-[10px]">متصل ✅</div></div>
                </div>
              </div>
            )}

            {tab==='pomo' && (
              <div className="max-w-[420px] mx-auto bg-white rounded-[16px] border p-8 text-center">
                <div className="text-[64px] font-[800] tabular-nums">{String(Math.floor(pomoTime/60)).padStart(2,'0')}:{String(pomoTime%60).padStart(2,'0')}</div>
                <div className="text-[11px] text-[#8B8BA7] mt-2">{pomoMode==='work'?'📚 تركيز':'☕ بريك'}</div>
                <div className="flex justify-center gap-3 mt-6">
                  <button onClick={()=>setPomoRunning(!pomoRunning)} className={`w-14 h-14 rounded-full text-white ${pomoRunning?'bg-black':'bg-[#7C6BFF]'}`}>{pomoRunning?'⏸':'▶️'}</button>
                  <button onClick={()=>{ setPomoRunning(false); setPomoTime(25*60)}} className="w-14 h-14 rounded-full bg-[#F8F7FF] border">🔄</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-white/10 p-2 flex gap-1 overflow-x-auto z-50">
        <button onClick={()=>setTab('home')} className={`px-3 h-8 rounded-full text-[10px] whitespace-nowrap font-bold ${tab==='home'?'bg-white text-black':'bg-white/10 text-white/60'}`}>الرئيسية</button>
        <button onClick={()=>setTab('ai')} className={`px-3 h-8 rounded-full text-[10px] whitespace-nowrap font-bold ${tab==='ai'?'bg-white text-black':'bg-white/10 text-white/60'}`}>AI</button>
        <button onClick={()=>setTab('notion')} className={`px-3 h-8 rounded-full text-[10px] whitespace-nowrap font-bold flex items-center gap-1 ${tab==='notion'?'bg-white text-black':'bg-white/10 text-white/60'}`}><span className="w-3 h-3 bg-white rounded-[2px] flex items-center justify-center text-black font-black text-[7px]">N</span> Notion</button>
        <button onClick={()=>setTab('notebook')} className={`px-3 h-8 rounded-full text-[10px] whitespace-nowrap font-bold ${tab==='notebook'?'bg-white text-black':'bg-white/10 text-white/60'}`}>دفتر</button>
        <button onClick={()=>setTab('library')} className={`px-3 h-8 rounded-full text-[10px] whitespace-nowrap font-bold ${tab==='library'?'bg-white text-black':'bg-white/10 text-white/60'}`}>مكتبة</button>
      </div>
    </div>
  )
}