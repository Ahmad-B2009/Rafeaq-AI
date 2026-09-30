import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const tabs = [
  { id:'ai', label:'رفيق AI', icon:'💬', desc:'مساعدك الذكي' },
  { id:'notebook', label:'دفتر رفيق', icon:'📓', desc:'ملاحظاتك' },
  { id:'docs', label:'المستندات', icon:'📝', desc:'ملفاتك' },
  { id:'slides', label:'العروض', icon:'🎨', desc:'عروضك' },
  { id:'library', label:'مكتبة رفيق', icon:'📚', desc:'TeraBox + الامجاد' },
  { id:'pomo', label:'بومودورو', icon:'⏱', desc:'ركز وذاكر' },
]

export default function Dashboard(){
  const nav = useNavigate()
  const [tab,setTab] = useState('ai')
  const [user,setUser] = useState('')
  const [msgs,setMsgs] = useState([
    {role:'assistant', text:'هلا والله يا بطل! 🇱🇾\n\nأنا رفيق AI، جاهز نساعدك:\n• نشرح أي درس بلهجة ليبية بسيطة\n• نلخص كتب ومذكرات\n• نديرلك اختبارات و MCQ\n• نحول كلامك لصوت وصوتك لكلام\n\nشن تبي نبدأو بيه اليوم؟'}
  ])
  const [inp,setInp] = useState('')
  const [isListening,setIsListening] = useState(false)
  const [isSpeaking,setIsSpeaking] = useState(false)
  const bottomRef = useRef(null)
  
  // Notebook
  const [notes,setNotes] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('rafeaq_notes')||'[]') }catch{ return [] } })
  const [activeNote,setActiveNote] = useState(null)
  const [noteText,setNoteText] = useState('')

  // Docs
  const [files,setFiles] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('rafeaq_files')||'[]') }catch{ return [] } })

  // Slides
  const [slides,setSlides] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('rafeaq_slides')||'[{"title":"درس جديد","content":"اكتب محتوى الدرس هنا..."}]') }catch{ return [{title:'درس جديد',content:'...'}] } })
  const [activeSlide,setActiveSlide] = useState(0)

  // Library
  const [teraboxFiles,setTeraboxFiles] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('rafeaq_terabox')||'[]') }catch{ return [] } })

  // Pomo
  const [pomoTime,setPomoTime] = useState(25*60)
  const [pomoRunning,setPomoRunning] = useState(false)
  const [pomoMode,setPomoMode] = useState('work') // work | break
  const pomoRef = useRef(null)

  useEffect(()=>{
    const u = localStorage.getItem('rafeaq_user') || localStorage.getItem('rafeaq_name') || 'طالب'
    setUser(u)
    if(!localStorage.getItem('rafeaq_token')) nav('/login')
  },[nav])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  useEffect(()=>{
    localStorage.setItem('rafeaq_notes', JSON.stringify(notes))
  },[notes])
  useEffect(()=>{
    localStorage.setItem('rafeaq_files', JSON.stringify(files))
  },[files])
  useEffect(()=>{
    localStorage.setItem('rafeaq_slides', JSON.stringify(slides))
  },[slides])
  useEffect(()=>{
    localStorage.setItem('rafeaq_terabox', JSON.stringify(teraboxFiles))
  },[teraboxFiles])

  // Pomo timer
  useEffect(()=>{
    if(pomoRunning){
      pomoRef.current = setInterval(()=>{
        setPomoTime(t=>{
          if(t<=1){
            // switch mode
            const nextMode = pomoMode==='work' ? 'break' : 'work'
            const nextTime = nextMode==='work' ? 25*60 : 5*60
            setPomoMode(nextMode)
            if('Notification' in window && Notification.permission==='granted'){
              new Notification(nextMode==='work' ? 'يلا نرجعو نقرو!' : 'خود بريك 5 دقايق ☕')
            }
            return nextTime
          }
          return t-1
        })
      },1000)
    }else{
      clearInterval(pomoRef.current)
    }
    return ()=>clearInterval(pomoRef.current)
  },[pomoRunning,pomoMode])

  function logout(){
    localStorage.removeItem('rafeaq_token')
    localStorage.removeItem('rafeaq_user')
    sessionStorage.setItem('just_logged_out','1')
    nav('/login')
  }

  function send(t){
    const u = (t||inp).trim()
    if(!u) return
    setMsgs(m=>[...m,{role:'user',text:u}])
    setInp('')
    // Simulate AI response
    setTimeout(()=>{
      let reply = ''
      if(u.includes('اختبار') || u.toLowerCase().includes('quiz')){
        reply = `تمام، درتلك اختبار سريع على: "${u}"\n\n**س1:** شن تعريف ...؟\nأ) ...\nب) ...\nج) ...\n\n**س2:** علل: ...؟\n\n**س3:** صح/خطأ: ...\n\nتبي نصححلك؟ ابعث إجاباتك!`
      }else if(u.includes('لخص') || u.includes('تلخيص')){
        reply = `**ملخص سريع:**\n\n📌 النقطة 1: ${u} هو ...\n📌 النقطة 2: أهميته ...\n📌 النقطة 3: تطبيقاته ...\n\nتبي نحوله لعرض تقديمي؟ قول "ديره عرض"`
      }else{
        reply = `تمام يا ${user}، فهمت: "${u}"\n\nنشرحهولك بلهجة ليبية بسيطة:\n\nيعني الموضوع كأنه ... تخيل ...\n\nمثال عملي: ...\n\nتبي نلخصه؟ ولا نديرلك اختبار عليه؟ ولا نحوله لنوت في دفتر رفيق؟`
      }
      setMsgs(m=>[...m,{role:'assistant',text:reply}])
    },600)
  }

  function speak(text){
    if('speechSynthesis' in window){
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang='ar-SA'
      u.rate=0.9
      u.onstart=()=>setIsSpeaking(true)
      u.onend=()=>setIsSpeaking(false)
      speechSynthesis.speak(u)
    }
  }

  function listen(){
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if(!SpeechRecognition){ alert('المتصفح ما يدعمش الصوت - استخدم Chrome'); return }
    const rec = new SpeechRecognition()
    rec.lang='ar-SA'
    rec.onstart=()=>setIsListening(true)
    rec.onend=()=>setIsListening(false)
    rec.onresult=(e)=>{ setInp(e.results[0][0].transcript) }
    rec.start()
  }

  function handleFileUpload(e, target){
    const file = e.target.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const item = {id:Date.now(), name:file.name, size:file.size, type:file.type, data:reader.result, date:new Date().toLocaleDateString('ar-LY')}
      if(target==='docs') setFiles(f=>[...f,item])
      if(target==='terabox') setTeraboxFiles(f=>[...f,item])
    }
    reader.readAsDataURL(file)
  }

  const totalStorage = teraboxFiles.reduce((s,f)=>s+f.size,0) + files.reduce((s,f)=>s+f.size,0)
  const storagePercent = Math.min(100, (totalStorage / (1024*1024*1024)) * 100) // 1GB mock for 1024GB

  return (
    <div className="min-h-screen bg-[#FCFBFF] flex" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');*{font-family:'Tajawal',sans-serif}`}</style>

      {/* SIDEBAR */}
      <div className="w-[300px] bg-white border-l border-black/[0.06] hidden lg:flex flex-col justify-between p-5 fixed right-0 top-0 h-screen z-20">
        <div>
          <div className="flex items-center gap-3 px-2 mb-8 mt-2">
            <div className="w-10 h-10 rounded-[12px] bg-black text-white flex items-center justify-center font-[800] text-[16px]">ر</div>
            <div>
              <div className="font-[800] text-[14px] leading-none">رفيق</div>
              <div className="text-[10px] opacity-50 mt-1">Rafeaq OS • 2026</div>
            </div>
            <div className="mr-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>

          <div className="space-y-2">
            {tabs.map(t=>{
              const active = tab===t.id
              return (
                <button key={t.id} onClick={()=>setTab(t.id)} className={`w-full flex items-center gap-3 px-4 h-[52px] rounded-[14px] text-right transition-all ${active ? 'bg-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)]' : 'bg-[#FAFAFA] border border-black/[0.04] hover:bg-white hover:shadow-sm'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[16px] ${active ? 'bg-white/15' : 'bg-white border'}`}>{t.icon}</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold leading-none">{t.label}</div>
                    <div className={`text-[10px] mt-1 ${active ? 'text-white/60' : 'opacity-50'}`}>{t.desc}</div>
                  </div>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"></div>}
                </button>
              )
            })}
          </div>

          <div className="mt-6 p-4 rounded-[16px] bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FF] border border-[#E9D5FF]">
            <div className="text-[11px] font-bold text-[#6D28D9]">💾 TeraBox</div>
            <div className="text-[10px] text-[#7C3AED] mt-1">1TB تخزين محلي</div>
            <div className="w-full h-1.5 bg-white rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#7C3AED] rounded-full" style={{width: `${storagePercent.toFixed(1)}%`}}></div>
            </div>
            <div className="text-[9px] opacity-60 mt-1">{(totalStorage/1024/1024).toFixed(1)} MB مستخدم</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-[1px] bg-black/5"></div>
          <div className="flex items-center gap-3 px-3 py-3 rounded-[14px] bg-[#FAFAFA] border border-black/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-violet-300 text-white flex items-center justify-center text-[12px] font-bold">{user[0]?.toUpperCase()||'A'}</div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[12px] font-bold truncate">{user}</div>
              <div className="text-[10px] opacity-50">متصل • Online</div>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <button onClick={logout} className="w-full h-[40px] rounded-full border border-black/10 text-[12px] font-bold hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2">
            ↪ تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex gap-2 overflow-x-auto z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-4 h-[40px] rounded-full text-[12px] whitespace-nowrap border font-bold ${tab===t.id?'bg-black text-white':'bg-white'}`}>{t.icon} {t.label}</button>)}
      </div>

      {/* MAIN */}
      <div className="flex-1 lg:mr-[300px] p-4 lg:p-8 pb-28">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 max-w-[1000px] mx-auto">
          <div className="flex items-center gap-2 text-[11px] text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">● متصل • {new Date().toLocaleDateString('ar-LY')}</div>
          <div className="text-right">
            <div className="font-[800] text-[16px]">{tabs.find(t=>t.id===tab)?.label}</div>
            <div className="text-[10px] opacity-50">مرحبا {user} 👋</div>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto">
          {/* AI TAB */}
          {tab==='ai' && (
            <div>
              <div className="bg-[#F9F9FB] rounded-[20px] border border-black/[0.04] p-5 mb-4">
                <div className="flex gap-2">
                  <button onClick={()=>send('اشرح درس بلهجة ليبية')} className="h-[32px] px-4 rounded-full bg-white border text-[11px] font-bold hover:bg-black hover:text-white transition">📖 اشرح درس</button>
                  <button onClick={()=>send('لخص كتاب')} className="h-[32px] px-4 rounded-full bg-white border text-[11px] font-bold hover:bg-black hover:text-white transition">📝 لخص</button>
                  <button onClick={()=>send('ديرلي اختبار MCQ')} className="h-[32px] px-4 rounded-full bg-[#7C3AED] text-white text-[11px] font-bold">🧪 اختبار</button>
                  <button onClick={()=>{ if(msgs.length>1) speak(msgs[msgs.length-1].text) }} className={`h-[32px] px-4 rounded-full border text-[11px] font-bold ${isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-white'}`}>🔊 {isSpeaking ? 'يسمع...' : 'اسمع'}</button>
                </div>
              </div>

              <div className="space-y-3 mb-6 min-h-[300px]">
                {msgs.map((m,i)=>(
                  <div key={i} className={`flex ${m.role==='user'?'justify-start':'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-[18px] px-5 py-4 text-[13px] leading-7 whitespace-pre-wrap ${m.role==='user'?'bg-black text-white rounded-br-[4px]':'bg-white border shadow-sm rounded-bl-[4px]'}`}>
                      {m.text}
                      {m.role==='assistant' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-black/5">
                          <button onClick={()=>speak(m.text)} className="text-[10px] px-2 py-1 rounded-full bg-[#F5F3FF] hover:bg-[#EDE9FF]">🔊 صوت</button>
                          <button onClick={()=>{ setNotes(n=>[...n,{id:Date.now(),title:m.text.slice(0,20),content:m.text,date:new Date().toLocaleDateString()}]) }} className="text-[10px] px-2 py-1 rounded-full bg-[#FFFBEB] hover:bg-[#FEF3C7]">📓 حفظ في الدفتر</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <button onClick={()=>send('اشرح درس')} className="bg-white rounded-[16px] border border-black/5 p-4 text-right hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-full bg-[#F5F3FF] flex items-center justify-center group-hover:scale-110 transition">📖</div>
                  <div className="text-[13px] font-bold mt-3">اشرح درس</div>
                  <div className="text-[11px] opacity-50 mt-1">بلهجة ليبية بسيطة مع أمثلة</div>
                </button>
                <button onClick={()=>send('لخص كتاب')} className="bg-white rounded-[16px] border border-black/5 p-4 text-right hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-full bg-[#FFFBEB] flex items-center justify-center group-hover:scale-110 transition">📝</div>
                  <div className="text-[13px] font-bold mt-3">لخص كتاب</div>
                  <div className="text-[11px] opacity-50 mt-1">نقط واضحة وسريعة</div>
                </button>
                <button onClick={()=>send('ديرلي اختبار')} className="bg-white rounded-[16px] border border-black/5 p-4 text-right hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center group-hover:scale-110 transition">🧪</div>
                  <div className="text-[13px] font-bold mt-3">ساعدني نكتب + اختبار</div>
                  <div className="text-[11px] opacity-50 mt-1">MCQ وصح وخطأ</div>
                </button>
              </div>

              <div className="flex gap-2 items-center bg-white rounded-full border border-black/10 p-2 shadow-sm">
                <button onClick={listen} className={`w-10 h-10 rounded-full flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#F5F3FF] hover:bg-[#EDE9FF]'}`}>🎤</button>
                <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="اكتب سؤالك بالليبي... أو اضغط الميكروفون 🎤" className="flex-1 bg-transparent px-4 text-[13px] outline-none" />
                <button onClick={()=>send()} className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#222]">↑</button>
              </div>
            </div>
          )}

          {/* NOTEBOOK */}
          {tab==='notebook' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1 bg-white rounded-[16px] border p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[14px]">📓 دفتر رفيق</h3>
                  <button onClick={()=>{ const n={id:Date.now(),title:'ملاحظة جديدة',content:'',date:new Date().toLocaleDateString()}; setNotes([n,...notes]); setActiveNote(n.id); setNoteText('') }} className="text-[11px] bg-black text-white px-3 py-1 rounded-full">+ جديد</button>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {notes.map(n=>(
                    <button key={n.id} onClick={()=>{ setActiveNote(n.id); setNoteText(n.content) }} className={`w-full text-right p-3 rounded-[12px] border text-[12px] ${activeNote===n.id ? 'bg-black text-white' : 'bg-[#FAFAFA] hover:bg-white'}`}>
                      <div className="font-bold truncate">{n.title}</div>
                      <div className="opacity-60 text-[10px] mt-1 truncate">{n.content.slice(0,40)}</div>
                    </button>
                  ))}
                  {notes.length===0 && <div className="text-[11px] opacity-50 text-center py-10">مافيش ملاحظات - دير واحدة جديدة</div>}
                </div>
              </div>
              <div className="lg:col-span-2 bg-white rounded-[16px] border p-4">
                {activeNote ? (
                  <>
                    <input value={notes.find(n=>n.id===activeNote)?.title||''} onChange={e=>setNotes(ns=>ns.map(n=>n.id===activeNote?{...n,title:e.target.value}:n))} className="w-full font-bold text-[16px] outline-none mb-3" placeholder="عنوان الملاحظة" />
                    <textarea value={noteText} onChange={e=>{ setNoteText(e.target.value); setNotes(ns=>ns.map(n=>n.id===activeNote?{...n,content:e.target.value}:n)) }} className="w-full h-[50vh] outline-none text-[13px] leading-7 resize-none" placeholder="اكتب ملاحظاتك هنا..."></textarea>
                    <div className="flex gap-2 mt-4">
                      <button onClick={()=>setNotes(ns=>ns.filter(n=>n.id!==activeNote))} className="text-[11px] px-3 py-1 rounded-full border text-red-600">حذف</button>
                      <button onClick={()=>{ setActiveNote(null); setNoteText('') }} className="text-[11px] px-3 py-1 rounded-full bg-[#F5F3FF]">إغلاق</button>
                    </div>
                  </>
                ) : (
                  <div className="h-[50vh] flex items-center justify-center text-[12px] opacity-50">اختار ملاحظة من اليسار أو دير واحدة جديدة</div>
                )}
              </div>
            </div>
          )}

          {/* DOCS */}
          {tab==='docs' && (
            <div className="bg-white rounded-[16px] border p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold">📝 المستندات</h3>
                <label className="text-[11px] bg-black text-white px-4 py-2 rounded-full cursor-pointer hover:bg-[#222]">+ رفع ملف<input type="file" className="hidden" onChange={e=>handleFileUpload(e,'docs')} /></label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {files.map(f=>(
                  <div key={f.id} className="border rounded-[12px] p-4 bg-[#FAFAFA]">
                    <div className="text-[12px] font-bold truncate">{f.name}</div>
                    <div className="text-[10px] opacity-50 mt-1">{f.date} • {(f.size/1024).toFixed(1)} KB</div>
                    <div className="flex gap-2 mt-3">
                      <a href={f.data} download={f.name} className="text-[10px] px-2 py-1 rounded-full bg-white border">تحميل</a>
                      <button onClick={()=>setFiles(fs=>fs.filter(x=>x.id!==f.id))} className="text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-600">حذف</button>
                    </div>
                  </div>
                ))}
                {files.length===0 && <div className="col-span-3 text-center py-20 opacity-50 text-[12px]">مافيش مستندات - ارفع ملف PDF أو Word</div>}
              </div>
            </div>
          )}

          {/* SLIDES */}
          {tab==='slides' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-[16px] border p-4">
                <h3 className="font-bold text-[13px] mb-4">🎨 العروض</h3>
                <div className="space-y-2">
                  {slides.map((s,i)=>(
                    <button key={i} onClick={()=>setActiveSlide(i)} className={`w-full text-right p-3 rounded-[12px] border text-[12px] ${activeSlide===i ? 'bg-black text-white' : 'bg-[#FAFAFA]'}`}>
                      {s.title}
                    </button>
                  ))}
                </div>
                <button onClick={()=>setSlides([...slides,{title:`شريحة ${slides.length+1}`,content:'محتوى جديد...'}])} className="w-full mt-4 h-10 rounded-full border text-[11px]">+ شريحة جديدة</button>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-[16px] border p-8 min-h-[400px] flex flex-col justify-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <input value={slides[activeSlide]?.title||''} onChange={e=>{ const ns=[...slides]; ns[activeSlide].title=e.target.value; setSlides(ns) }} className="text-[28px] font-[800] outline-none mb-4 text-center" />
                  <textarea value={slides[activeSlide]?.content||''} onChange={e=>{ const ns=[...slides]; ns[activeSlide].content=e.target.value; setSlides(ns) }} className="w-full h-[200px] outline-none text-[14px] leading-7 text-center resize-none" />
                  <div className="mt-8 flex justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                    <div className="w-2 h-2 rounded-full bg-black/20"></div>
                    <div className="w-2 h-2 rounded-full bg-black/20"></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={()=>setSlides(s=>s.filter((_,i)=>i!==activeSlide))} className="text-[11px] px-4 py-2 rounded-full border">حذف الشريحة</button>
                  <button onClick={()=>window.print()} className="text-[11px] px-4 py-2 rounded-full bg-black text-white">طباعة / PDF</button>
                </div>
              </div>
            </div>
          )}

          {/* LIBRARY */}
          {tab==='library' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-[20px] p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[18px] font-bold">☁️ TeraBox - 1TB تخزين</div>
                    <div className="text-[12px] opacity-80 mt-1">كل ملفاتك محفوظة محليا في جهازك - آمن ومجاني</div>
                    <div className="mt-4 flex gap-2">
                      <label className="bg-white text-black text-[11px] px-4 py-2 rounded-full cursor-pointer font-bold">+ رفع ملف<input type="file" className="hidden" onChange={e=>handleFileUpload(e,'terabox')} /></label>
                      <div className="text-[11px] px-3 py-2 rounded-full bg-white/20">{teraboxFiles.length} ملف • {(totalStorage/1024/1024).toFixed(1)} MB</div>
                    </div>
                  </div>
                  <div className="text-[40px] opacity-20">☁️</div>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{width: `${Math.min(100, storagePercent*10)}%`}}></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {teraboxFiles.map(f=>(
                  <div key={f.id} className="bg-white border rounded-[14px] p-4">
                    <div className="text-[12px] font-bold truncate">☁️ {f.name}</div>
                    <div className="text-[10px] opacity-50 mt-1">{f.date}</div>
                    <a href={f.data} download={f.name} className="mt-3 inline-block text-[10px] px-3 py-1 rounded-full bg-[#F5F3FF]">تحميل</a>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[20px] border p-6">
                <h3 className="font-bold text-[14px]">📚 مكتبة الامجاد</h3>
                <p className="text-[11px] opacity-60 mt-1">مصادر ليبية - كتب، مذكرات، شروحات</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <a href="https://alamjad-ly.com" target="_blank" className="block border rounded-[12px] p-4 hover:shadow-md transition bg-[#FFFBEB]">
                    <div className="text-[13px] font-bold">موقع الامجاد الرسمي</div>
                    <div className="text-[11px] opacity-60 mt-1">alamjad-ly.com • كتب وملازم</div>
                    <div className="text-[10px] mt-2 text-[#F59E0B]">فتح الموقع ↗</div>
                  </a>
                  <div className="border rounded-[12px] p-4 bg-[#ECFDF5]">
                    <div className="text-[13px] font-bold">مكتبة رفيق المحلية</div>
                    <div className="text-[11px] opacity-60 mt-1">{files.length + teraboxFiles.length} ملف محفوظ</div>
                    <div className="text-[10px] mt-2">كل ملفاتك هنا 📚</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-[#F9FAFB] rounded-[12px] text-[11px] leading-6">
                  💡 <b>كيف تستعملها؟</b><br/>
                  • ارفع كتبك PDF في TeraBox<br/>
                  • افتحها في رفيق AI وقول "لخصلي هذا الكتاب"<br/>
                  • AI يقرا ويشرح بلهجة ليبية
                </div>
              </div>
            </div>
          )}

          {/* POMO */}
          {tab==='pomo' && (
            <div className="max-w-[500px] mx-auto">
              <div className="bg-white rounded-[24px] border p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="text-[12px] opacity-50">{pomoMode==='work' ? '📚 وقت القراية' : '☕ بريك'}</div>
                <div className="text-[72px] font-[800] mt-4 tabular-nums tracking-tight">
                  {String(Math.floor(pomoTime/60)).padStart(2,'0')}:{String(pomoTime%60).padStart(2,'0')}
                </div>
                <div className="text-[12px] opacity-50 mt-2">{pomoMode==='work' ? 'ركز 25 دقيقة' : 'رتاح 5 دقايق'}</div>
                
                <div className="flex justify-center gap-3 mt-8">
                  <button onClick={()=>setPomoRunning(!pomoRunning)} className={`w-[64px] h-[64px] rounded-full flex items-center justify-center text-[20px] ${pomoRunning ? 'bg-black text-white' : 'bg-[#7C3AED] text-white shadow-[0_8px_20px_rgba(124,107,255,0.3)]'}`}>
                    {pomoRunning ? '⏸' : '▶️'}
                  </button>
                  <button onClick={()=>{ setPomoRunning(false); setPomoTime(pomoMode==='work' ? 25*60 : 5*60) }} className="w-[64px] h-[64px] rounded-full bg-[#F5F3FF] flex items-center justify-center">🔄</button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-8">
                  <button onClick={()=>{ setPomoMode('work'); setPomoTime(25*60); setPomoRunning(false) }} className={`h-10 rounded-full text-[11px] font-bold border ${pomoMode==='work' ? 'bg-black text-white' : 'bg-white'}`}>25 د عمل</button>
                  <button onClick={()=>{ setPomoMode('break'); setPomoTime(5*60); setPomoRunning(false) }} className={`h-10 rounded-full text-[11px] font-bold border ${pomoMode==='break' ? 'bg-black text-white' : 'bg-white'}`}>5 د بريك</button>
                  <button onClick={()=>{ setPomoMode('work'); setPomoTime(50*60); setPomoRunning(false) }} className="h-10 rounded-full text-[11px] font-bold border bg-white">50 د قراية</button>
                </div>

                <div className="mt-8 p-4 bg-[#F9FAFB] rounded-[14px] text-right">
                  <div className="text-[11px] font-bold">💡 طريقة بومودورو:</div>
                  <div className="text-[11px] leading-6 opacity-70 mt-2">
                    • اقرا 25 دقيقة بتركيز<br/>
                    • خود بريك 5 دقايق<br/>
                    • بعد 4 جولات خود بريك طويل 15 د<br/>
                    • رفيق ينبهك أوتوماتيك
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}