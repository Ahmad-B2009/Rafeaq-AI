
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const navItems = [
  { id: 'home', label: 'الرئيسية', icon: '🏠' },
  { id: 'ai', label: 'الذكاء الاصطناعي', icon: '💬' },
  { id: 'notebook', label: 'دفتر رفيق', icon: '📓' },
  { id: 'docs', label: 'المستندات', icon: '📄' },
  { id: 'slides', label: 'العروض', icon: '🎨' },
  { id: 'library', label: 'مكتبة رفيق', icon: '📚' },
  { id: 'pomo', label: 'بومودورو', icon: '⏱️' },
]

function getInitialMsgs(){
  try{
    const s = localStorage.getItem('rafeaq_msgs')
    if(s){
      const p = JSON.parse(s)
      if(Array.isArray(p) && p.length>0) return p
    }
  }catch(e){}
  return [{role:'assistant', text:'أهلاً يا أحمد! 👋\n\nأنا رفيق AI - مساعدك الدراسي الذكي. أقدر:\n\n• أشرح أي درس بلهجة ليبية بسيطة\n• ألخص كتب ومذكرات طويلة\n• أديرلك اختبارات MCQ\n• أحفظ ملاحظاتك في دفتر رفيق\n• أحول أي درس لعرض تقديمي\n\nشن تبي نبدو بيه؟'}]
}

function getInitialSlides(){
  try{
    const s = localStorage.getItem('rafeaq_slides')
    if(s){
      const p = JSON.parse(s)
      if(Array.isArray(p) && p.length>0) return p
    }
  }catch(e){}
  return [{id:1,title:'مقدمة الدرس',content:'اكتب محتوى الدرس هنا... كل شريحة هي فكرة رئيسية'}]
}

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
  const [msgs,setMsgs] = useState(()=>getInitialMsgs())
  const [inp,setInp] = useState('')
  const [isAiLoading,setIsAiLoading] = useState(false)
  const bottomRef = useRef(null)

  const [notes,setNotes] = useState(()=>getLS('rafeaq_notes', []))
  const [activeNoteId,setActiveNoteId] = useState(null)
  const [files,setFiles] = useState(()=>getLS('rafeaq_files', []))
  const [terabox,setTerabox] = useState(()=>getLS('rafeaq_terabox', []))
  const [slides,setSlides] = useState(()=>getInitialSlides())
  const [activeSlide,setActiveSlide] = useState(0)

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

  useEffect(()=>{
    if(!pomoRunning) return
    const id = setInterval(()=> setPomoTime(t=> t>1 ? t-1 : 0), 1000)
    return ()=> clearInterval(id)
  },[pomoRunning])

  useEffect(()=>{
    if(pomoTime===0 && pomoRunning){
      setPomoRunning(false)
      const next = pomoMode==='work' ? 'break' : 'work'
      setPomoMode(next)
      setPomoTime(next==='work'?25*60:5*60)
      if(typeof Notification!=='undefined' && Notification.permission==='granted'){
        new Notification(next==='work'?'يلا نرجعو نقرو! 📚':'خود بريك ☕')
      }
    }
  },[pomoTime,pomoRunning,pomoMode])

  if(typeof window!=='undefined' && typeof Notification!=='undefined' && Notification.permission==='default'){
    Notification.requestPermission()
  }

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
      const reply = data.reply || data.text || `تمام يا ${user}:\n\n"${q}"\n\nنشرحهولك بلهجة ليبية بسيطة:\nيعني كأنه...\n\nتبي نحفظه في دفتر رفيق؟ ولا نديره عرض؟`
      setMsgs(m=>[...m,{role:'assistant',text:reply}])
    }catch(e){
      setMsgs(m=>[...m,{role:'assistant',text:`تمام يا ${user}:\n\n"${q}"\n\nنشرحهولك بلهجة ليبية:\n• الفكرة الرئيسية...\n• مثال...\n• ملخص...\n\n(اربط OPENAI_API_KEY في Vercel باش يخدم AI الحقيقي)`}])
    }
    setIsAiLoading(false)
  }

  function addNote(){
    const n = {id:Date.now(), title:'ملاحظة جديدة', content:'', date:new Date().toLocaleDateString('ar-LY'), time:new Date().toLocaleTimeString('ar-LY',{hour:'2-digit',minute:'2-digit'})}
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
    <div className="min-h-screen bg-[#F8F9FF] flex" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');*{font-family:'Tajawal',sans-serif}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:#E9E5FF;border-radius:10px}`}</style>

      <div className="w-[280px] bg-white border-l border-[#F0ECFF] hidden lg:flex flex-col fixed right-0 top-0 h-screen z-30">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#7C6BFF] to-[#5B4DFF] flex items-center justify-center text-white font-black shadow-[0_6px_16px_rgba(124,107,255,0.3)]">ر</div>
            <div>
              <div className="font-[800] text-[16px] text-[#1E1B4B] leading-none">رفيق AI</div>
              <div className="text-[10px] text-[#8B8BA7] mt-1.5">مساعدك الدراسي الذكي</div>
            </div>
          </div>
          <div className="mt-8 space-y-1">
            {navItems.map(item=>{
              const active = tab===item.id
              return (
                <button key={item.id} onClick={()=>setTab(item.id)} className={`w-full flex items-center gap-3 px-4 h-[46px] rounded-[12px] text-right transition-all ${active ? 'bg-[#7C6BFF] text-white shadow-[0_6px_16px_rgba(124,107,255,0.25)]' : 'text-[#6B7280] hover:bg-[#F8F7FF] hover:text-[#1E1B4B]'}`}>
                  <span className={`text-[16px] ${active ? '' : 'opacity-70'}`}>{item.icon}</span>
                  <span className={`text-[13px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                  {active && <span className="mr-auto w-1.5 h-1.5 bg-white rounded-full"></span>}
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-auto p-4 border-t border-[#F3F0FF] space-y-3">
          <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FF] rounded-[14px] p-3.5 border border-[#E9D5FF]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#5B4DFF]">☁️ TeraBox 1TB</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold">{totalMB} MB</span>
            </div>
            <div className="w-full h-1.5 bg-white rounded-full mt-2.5 overflow-hidden"><div className="h-full bg-[#7C6BFF] rounded-full transition-all" style={{width:`${Math.min(100,(totalBytes/(1024*1024*1024))*100)}%`}}></div></div>
            <div className="text-[10px] text-[#6B7280] mt-2">{terabox.length + files.length} ملفات محفوظة محلياً</div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] bg-[#FAFBFF] border border-[#F0ECFF]">
            <div className="w-8 h-8 rounded-full bg-[#7C6BFF] text-white flex items-center justify-center text-[11px] font-bold">{user[0] ? user[0].toUpperCase() : 'A'}</div>
            <div className="flex-1">
              <div className="text-[12px] font-bold text-[#1E1B4B] truncate">{user}</div>
              <div className="text-[10px] text-[#8B8BA7]">طالب • متصل</div>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <button onClick={logout} className="w-full h-9 rounded-full border text-[11px] font-bold hover:bg-black hover:text-white transition">تسجيل الخروج ↪</button>
        </div>
      </div>

      <div className="flex-1 lg:mr-[280px] min-h-screen flex flex-col">
        <div className="h-[64px] bg-white/80 backdrop-blur-xl border-b border-[#F0ECFF] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-[11px] text-[#6B7280] bg-[#F8F7FF] border border-[#F0ECFF] px-3 py-1.5 rounded-full">📅 السبت 23 أغسطس 2025</div>
            <div className="flex items-center gap-2 text-[11px] text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">● متصل</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <input placeholder="ابحث..." className="w-[220px] h-9 pr-8 pl-4 rounded-full bg-[#F8F7FF] border border-[#F0ECFF] text-[11px] outline-none focus:border-[#7C6BFF]" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] opacity-40">🔍</span>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 bg-[#F8F9FF] flex-1">
          <div className="max-w-[1400px] mx-auto">

            {tab==='home' && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
                <div className="xl:col-span-3 space-y-5">
                  <div className="rounded-[20px] bg-gradient-to-l from-[#EDE9FF] via-[#F3F0FF] to-white border border-[#EDE9FF] p-6 lg:p-8 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute -left-20 top-0 w-[300px] h-[300px] bg-white/60 rounded-full blur-3xl"></div>
                    <div className="flex items-center gap-6 z-10">
                      <div className="w-[88px] h-[88px] rounded-[20px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex items-center justify-center text-[44px]">🤖</div>
                      <div>
                        <h1 className="text-[26px] font-[800] text-[#1E1B4B] flex items-center gap-2">مرحباً، {user} <span className="text-[22px]">👋</span></h1>
                        <p className="text-[13px] text-[#6B7280] mt-1">معاً نحقق أهدافك.. خطوة بخطوة نحو مستقبل أفضل</p>
                        <div className="mt-4 flex items-center gap-3 bg-white rounded-full px-3 py-1.5 border border-[#F0ECFF] w-fit">
                          <span className="text-[10px] text-[#8B8BA7]">تقدمك في التعلم</span>
                          <div className="w-20 h-1.5 bg-[#F3F0FF] rounded-full overflow-hidden"><div className="h-full bg-[#7C6BFF] w-[40%]"></div></div>
                          <span className="text-[10px] font-bold text-[#7C6BFF]">40%</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden lg:block z-10">
                      <div className="bg-white rounded-[14px] border p-3 shadow-sm">
                        <div className="text-[10px] text-[#8B8BA7]">أنت الآن في</div>
                        <div className="mt-1.5 bg-[#F5F3FF] text-[#7C6BFF] text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">🎓 المستوى الأول</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {id:'notebook', icon:'📓', bg:'#F5F3FF', title:'دفتر رفيق', desc: notes.length + ' ملاحظات محفوظة', color:'#7C6BFF'},
                      {id:'docs', icon:'📄', bg:'#ECFDF5', title:'المستندات', desc: files.length + ' ملفات PDF', color:'#10B981'},
                      {id:'slides', icon:'🎨', bg:'#FFF7ED', title:'العروض', desc: slides.length + ' عروض', color:'#F59E0B'},
                      {id:'library', icon:'📚', bg:'#FDF2F8', title:'مكتبة رفيق', desc: terabox.length + ' ملفات TeraBox', color:'#EC4899'},
                    ].map(c=>(
                      <button key={c.id} onClick={()=>setTab(c.id)} className="bg-white rounded-[16px] border border-[#F0ECFF] p-5 text-right hover:shadow-[0_12px_32px_rgba(124,107,255,0.08)] hover:-translate-y-0.5 transition-all group">
                        <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[20px] group-hover:scale-110 transition" style={{background:c.bg}}>{c.icon}</div>
                        <div className="mt-4 font-bold text-[13px] text-[#1E1B4B]">{c.title}</div>
                        <div className="text-[11px] text-[#8B8BA7] mt-1">{c.desc}</div>
                        <div className="mt-4 flex items-center gap-1 text-[11px] font-bold" style={{color:c.color}}>فتح <span className="group-hover:translate-x-1 transition">→</span></div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 bg-white rounded-[16px] border border-[#F0ECFF] p-5">
                      <div className="flex justify-between items-center mb-5">
                        <h3 className="font-bold text-[13px]">🎯 مراجعة سريعة</h3>
                        <span className="text-[11px] text-[#8B8BA7]">كل مميزاتك في مكان واحد</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={()=>setTab('notebook')} className="flex items-center gap-3 p-3.5 rounded-[12px] bg-[#F8F7FF] border border-[#F0ECFF] hover:bg-[#F5F3FF] transition text-right">
                          <div className="w-10 h-10 rounded-[10px] bg-white border flex items-center justify-center">📓</div>
                          <div><div className="text-[12px] font-bold">دفتر رفيق</div><div className="text-[10px] text-[#8B8BA7]">{notes.length} ملاحظات جديدة</div></div>
                          <span className="mr-auto opacity-30">›</span>
                        </button>
                        <button onClick={()=>setTab('docs')} className="flex items-center gap-3 p-3.5 rounded-[12px] bg-[#F0FDF4] border border-[#DCFCE7] hover:bg-[#DCFCE7] transition text-right">
                          <div className="w-10 h-10 rounded-[10px] bg-white border flex items-center justify-center">📄</div>
                          <div><div className="text-[12px] font-bold">المستندات</div><div className="text-[10px] text-[#8B8BA7]">{files.length} ملفات مرفوعة</div></div>
                          <span className="mr-auto opacity-30">›</span>
                        </button>
                        <button onClick={()=>setTab('pomo')} className="flex items-center gap-3 p-3.5 rounded-[12px] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FECACA] transition text-right">
                          <div className="w-10 h-10 rounded-[10px] bg-white border flex items-center justify-center">⏱️</div>
                          <div><div className="text-[12px] font-bold">بومودورو</div><div className="text-[10px] text-[#8B8BA7]">{Math.floor(pomoTime/60)}:{String(pomoTime%60).padStart(2,'0')} متبقي</div></div>
                          <span className="mr-auto opacity-30">›</span>
                        </button>
                        <button onClick={()=>setTab('library')} className="flex items-center gap-3 p-3.5 rounded-[12px] bg-[#FDF2F8] border border-[#FCE7F3] hover:bg-[#FCE7F3] transition text-right">
                          <div className="w-10 h-10 rounded-[10px] bg-white border flex items-center justify-center">☁️</div>
                          <div><div className="text-[12px] font-bold">TeraBox 1TB</div><div className="text-[10px] text-[#8B8BA7]">{totalMB} MB محفوظة</div></div>
                          <span className="mr-auto opacity-30">›</span>
                        </button>
                      </div>
                    </div>
                    <div className="bg-white rounded-[16px] border border-[#F0ECFF] p-5">
                      <h3 className="font-bold text-[13px] mb-4">📊 إحصائياتك</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#F8F7FF] rounded-[12px] p-4 text-center border border-[#F0ECFF]"><div className="text-[20px]">📚</div><div className="text-[20px] font-[800] mt-1">{notes.length + files.length + terabox.length}</div><div className="text-[10px] text-[#8B8BA7]">مواد محفوظة</div></div>
                        <div className="bg-[#F8F7FF] rounded-[12px] p-4 text-center border border-[#F0ECFF]"><div className="text-[20px]">💬</div><div className="text-[20px] font-[800] mt-1">{msgs.length}</div><div className="text-[10px] text-[#8B8BA7]">رسائل AI</div></div>
                        <div className="bg-[#F8F7FF] rounded-[12px] p-4 text-center border border-[#F0ECFF]"><div className="text-[20px]">🎯</div><div className="text-[20px] font-[800] mt-1">90%</div><div className="text-[10px] text-[#8B8BA7]">تقدم</div></div>
                        <div className="bg-[#F8F7FF] rounded-[12px] p-4 text-center border border-[#F0ECFF]"><div className="text-[20px]">☁️</div><div className="text-[20px] font-[800] mt-1">{terabox.length}</div><div className="text-[10px] text-[#8B8BA7]">TeraBox</div></div>
                      </div>
                      <div className="mt-4 bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FF] rounded-[12px] p-3 border border-[#E9D5FF] flex gap-2">
                        <span>💡</span><span className="text-[11px] leading-5"><b>أنت تسير بشكل رائع!</b> استمر، فالنجاح قادم.</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-[#EDE9FF] to-[#F5F3FF] rounded-[20px] border border-[#E9D5FF] p-6 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center text-[26px]">🤖</div>
                    <div className="mt-3 font-bold text-[13px]">تحدث مع رفيق AI</div>
                    <div className="text-[11px] text-[#6B7280] mt-1 leading-5">اسأل أي شيء عن دروسك</div>
                    <button onClick={()=>setTab('ai')} className="mt-4 w-full h-11 rounded-full bg-[#7C6BFF] text-white text-[12px] font-bold hover:bg-[#6B5AE0] shadow-[0_6px_16px_rgba(124,107,255,0.3)]">→ بدء المحادثة</button>
                  </div>
                  <div className="bg-white rounded-[16px] border border-[#F0ECFF] p-5">
                    <h3 className="font-bold text-[12px] mb-4">🔔 آخر الأنشطة</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[12px]">☁️</div><div className="flex-1"><div className="text-[11px] font-bold">TeraBox 1TB</div><div className="text-[10px] text-[#8B8BA7] mt-1">تخزين محلي آمن ومجاني</div><div className="text-[9px] text-[#9CA3AF] mt-1">الآن</div></div></div>
                      <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[12px]">📚</div><div className="flex-1"><div className="text-[11px] font-bold">مكتبة الامجاد</div><div className="text-[10px] text-[#8B8BA7] mt-1">كتب ليبية - alamjad-ly.com</div><div className="text-[9px] text-[#9CA3AF] mt-1">مربوطة ✅</div></div></div>
                      <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[12px]">📓</div><div className="flex-1"><div className="text-[11px] font-bold">دفتر رفيق</div><div className="text-[10px] text-[#8B8BA7] mt-1">{notes.length} ملاحظات</div><div className="text-[9px] text-[#9CA3AF] mt-1">منذ 3 ساعات</div></div></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab==='ai' && (
              <div className="max-w-[900px] mx-auto bg-white rounded-[20px] border border-[#F0ECFF] shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-4 border-b bg-[#FAFBFF] flex justify-between items-center">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-[#7C6BFF] text-white flex items-center justify-center">🤖</div><div><div className="text-[13px] font-bold">رفيق AI</div><div className="text-[10px] text-[#8B8BA7]">متصل • يشرح بلهجة ليبية 🇱🇾</div></div></div>
                  <button onClick={()=>setMsgs([{role:'assistant',text:'هلا! شن تبي نشرحلك؟'}])} className="text-[10px] px-3 py-1 rounded-full border bg-white">مسح</button>
                </div>
                <div className="h-[55vh] overflow-y-auto p-5 space-y-4 bg-[#FCFBFF]">
                  {msgs.map((m,i)=>(
                    <div key={i} className={`flex ${m.role==='user'?'justify-start':'justify-end'}`}>
                      <div className={`max-w-[78%] rounded-[18px] px-5 py-3.5 text-[13px] leading-7 whitespace-pre-wrap ${m.role==='user'?'bg-[#1E1B4B] text-white rounded-br-[4px]':'bg-white border border-[#F0ECFF] shadow-sm rounded-bl-[4px]'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && <div className="flex justify-end"><div className="bg-white border rounded-[18px] px-5 py-3 text-[12px]">يكتب... ●●●</div></div>}
                  <div ref={bottomRef}/>
                </div>
                <div className="p-3 border-t bg-white flex gap-2">
                  <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="اكتب سؤالك..." className="flex-1 h-12 rounded-full bg-[#F8F7FF] border border-[#F0ECFF] px-5 text-[13px] outline-none focus:border-[#7C6BFF] focus:bg-white" />
                  <button onClick={()=>send()} className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#222]">↑</button>
                </div>
              </div>
            )}

            {tab==='notebook' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white rounded-[16px] border border-[#F0ECFF] p-4">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-[13px]">📓 دفتر رفيق ({notes.length})</h3><button onClick={addNote} className="h-8 px-3 rounded-full bg-black text-white text-[11px]">+ جديد</button></div>
                  <div className="space-y-2 max-h-[65vh] overflow-y-auto">
                    {notes.map(n=>(
                      <button key={n.id} onClick={()=>setActiveNoteId(n.id)} className={`w-full text-right p-3.5 rounded-[12px] border transition ${activeNoteId===n.id?'bg-[#1E1B4B] text-white border-[#1E1B4B]':'bg-[#FAFBFF] border-[#F0ECFF] hover:bg-white'}`}>
                        <div className="font-bold text-[12px] truncate">{n.title||'بدون عنوان'}</div>
                        <div className="text-[11px] mt-1 opacity-70 line-clamp-2">{n.content.slice(0,80)||'فارغ...'}</div>
                        <div className="text-[9px] mt-2 opacity-50">{n.date}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-[16px] border border-[#F0ECFF] p-6 min-h-[65vh]">
                  {activeNoteId ? (
                    (()=>{ const note = notes.find(n=>n.id===activeNoteId); if(!note) return null; return (
                      <div>
                        <input value={note.title} onChange={e=>setNotes(ns=>ns.map(x=>x.id===activeNoteId?{...x,title:e.target.value}:x))} className="w-full text-[18px] font-bold outline-none" placeholder="عنوان الملاحظة" />
                        <div className="text-[10px] text-[#8B8BA7] mt-1">{note.date} {note.time}</div>
                        <textarea value={note.content} onChange={e=>setNotes(ns=>ns.map(x=>x.id===activeNoteId?{...x,content:e.target.value}:x))} className="w-full h-[50vh] mt-6 outline-none text-[13px] leading-8 resize-none" placeholder="اكتب هنا..." />
                        <div className="flex gap-2 mt-4">
                          <button onClick={()=>{ setNotes(ns=>ns.filter(x=>x.id!==activeNoteId)); setActiveNoteId(null)}} className="text-[11px] px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100">حذف</button>
                        </div>
                      </div>
                    )})()
                  ) : (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 rounded-full bg-[#F8F7FF] flex items-center justify-center text-[32px]">📓</div>
                      <div className="mt-4 font-bold text-[14px]">دفتر رفيق</div>
                      <div className="text-[11px] text-[#8B8BA7] mt-1">كل ملاحظاتك محفوظة محلياً</div>
                      <button onClick={addNote} className="mt-6 px-5 py-2 rounded-full bg-black text-white text-[11px]">+ ملاحظة جديدة</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab==='docs' && (
              <div className="bg-white rounded-[16px] border border-[#F0ECFF] p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-[14px]">📄 المستندات ({files.length})</h3>
                  <label className="h-9 px-4 rounded-full bg-black text-white text-[11px] flex items-center justify-center cursor-pointer">+ رفع PDF<input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={e=>handleUpload(e,'docs')} /></label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {files.map(f=>(
                    <div key={f.id} className="border border-[#F0ECFF] rounded-[14px] p-4 bg-[#FAFBFF]">
                      <div className="w-10 h-10 rounded-[10px] bg-white border flex items-center justify-center text-[16px]">📄</div>
                      <div className="mt-3 font-bold text-[12px] truncate">{f.name}</div>
                      <div className="text-[10px] text-[#8B8BA7] mt-1">{f.date} • {(f.size/1024).toFixed(0)} KB</div>
                      <div className="flex gap-2 mt-3">
                        <a href={f.data} download={f.name} className="text-[10px] px-3 py-1 rounded-full bg-white border">تحميل</a>
                        <button onClick={()=>setFiles(fs=>fs.filter(x=>x.id!==f.id))} className="text-[10px] px-3 py-1 rounded-full bg-red-50 text-red-600">حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==='slides' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-[16px] border border-[#F0ECFF] p-4">
                  <h3 className="font-bold text-[13px] mb-4">🎨 العروض ({slides.length})</h3>
                  <div className="space-y-2">
                    {slides.map((s,i)=>(
                      <button key={s.id||i} onClick={()=>setActiveSlide(i)} className={`w-full text-right p-3 rounded-[12px] border text-[12px] ${activeSlide===i?'bg-black text-white border-black':'bg-[#FAFBFF] border-[#F0ECFF]'}`}>
                        <div className="font-bold truncate">{i+1}. {s.title}</div>
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>setSlides([...slides,{id:Date.now(),title:`شريحة ${slides.length+1}`,content:'محتوى جديد...'}])} className="w-full mt-4 h-10 rounded-full border text-[11px] font-bold">+ شريحة جديدة</button>
                </div>
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-[20px] border border-[#F0ECFF] shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-10 lg:p-16 min-h-[500px] flex flex-col justify-center">
                    <input value={slides[activeSlide]?.title||''} onChange={e=>{ const ns=[...slides]; ns[activeSlide].title=e.target.value; setSlides(ns)}} className="text-[32px] font-[800] text-center outline-none text-[#1E1B4B]" />
                    <textarea value={slides[activeSlide]?.content||''} onChange={e=>{ const ns=[...slides]; ns[activeSlide].content=e.target.value; setSlides(ns)}} className="w-full mt-8 h-[200px] outline-none text-[15px] leading-8 text-center resize-none text-[#374151]" />
                  </div>
                </div>
              </div>
            )}

            {tab==='library' && (
              <div className="space-y-5">
                <div className="rounded-[20px] bg-gradient-to-br from-[#7C6BFF] to-[#4F46E5] p-7 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[20px] font-bold">☁️ TeraBox 1TB - تخزين محلي آمن</div>
                      <div className="text-[12px] opacity-80 mt-2">{terabox.length + files.length} ملفات • {totalMB} MB</div>
                    </div>
                    <label className="bg-white text-black text-[12px] font-bold px-5 py-2.5 rounded-full cursor-pointer">+ رفع ملف<input type="file" className="hidden" onChange={e=>handleUpload(e,'terabox')} /></label>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {terabox.map(f=>(
                    <div key={f.id} className="bg-white border border-[#F0ECFF] rounded-[14px] p-4">
                      <div className="w-10 h-10 rounded-[10px] bg-[#F5F3FF] flex items-center justify-center">☁️</div>
                      <div className="mt-3 font-bold text-[11px] truncate">{f.name}</div>
                      <div className="flex gap-1 mt-3"><a href={f.data} download={f.name} className="text-[10px] px-2 py-1 rounded-full bg-[#F5F3FF]">تحميل</a><button onClick={()=>setTerabox(t=>t.filter(x=>x.id!==f.id))} className="text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-600">حذف</button></div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-[16px] border border-[#F0ECFF] p-6">
                  <h3 className="font-bold text-[14px]">📚 مكتبة الامجاد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    <a href="https://alamjad-ly.com" target="_blank" className="border rounded-[14px] p-5 bg-[#FFFBEB]"><div className="font-bold text-[13px]">موقع الامجاد الرسمي</div><div className="text-[11px] text-[#8B8BA7] mt-2">alamjad-ly.com</div></a>
                    <div className="border rounded-[14px] p-5 bg-[#ECFDF5]"><div className="font-bold text-[13px]">مكتبة رفيق المحلية</div><div className="text-[11px] text-[#8B8BA7] mt-2">{files.length + terabox.length} ملفات</div></div>
                  </div>
                </div>
              </div>
            )}

            {tab==='pomo' && (
              <div className="max-w-[520px] mx-auto">
                <div className="bg-white rounded-[24px] border border-[#F0ECFF] p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
                  <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold border ${pomoMode==='work'?'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]':'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'}`}>{pomoMode==='work'?'📚 وقت التركيز':'☕ بريك'}</div>
                  <div className="text-[80px] font-[800] mt-6 tabular-nums text-[#1E1B4B]">{String(Math.floor(pomoTime/60)).padStart(2,'0')}:{String(pomoTime%60).padStart(2,'0')}</div>
                  <div className="flex justify-center gap-4 mt-10">
                    <button onClick={()=>setPomoRunning(!pomoRunning)} className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.15)] ${pomoRunning?'bg-[#1E1B4B] text-white':'bg-[#7C6BFF] text-white'}`}>{pomoRunning?'⏸':'▶️'}</button>
                    <button onClick={()=>{ setPomoRunning(false); setPomoTime(pomoMode==='work'?25*60:5*60)}} className="w-[72px] h-[72px] rounded-full bg-[#F8F7FF] border border-[#F0ECFF] flex items-center justify-center text-[20px]">🔄</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0ECFF] p-2 flex gap-1 overflow-x-auto z-50">
        {navItems.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 h-9 rounded-full text-[11px] whitespace-nowrap font-bold border ${tab===t.id?'bg-black text-white border-black':'bg-white'}`}>{t.icon} {t.label}</button>)}
      </div>
    </div>
  )
}