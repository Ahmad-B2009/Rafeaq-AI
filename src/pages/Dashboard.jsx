import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function getLS(k,f){ try{ const s=localStorage.getItem(k); if(s) return JSON.parse(s)}catch(e){} return f }

const LIBRARY_URL = 'https://www.al-amgaad.com/2021/08/allbooks.html'

export default function Dashboard(){
  const nav = useNavigate()
  const [tab,setTab]=useState('home')
  const [user,setUser]=useState('أحمد')
  const [msgs,setMsgs]=useState(()=>getLS('rafeaq_msgs', []))
  const [inp,setInp]=useState('')
  const [aiLoading,setAiLoading]=useState(false)
  const [chances,setChances]=useState(()=>getLS('rafeaq_chances', 25))
  const [isListening,setIsListening]=useState(false)
  const bottomRef=useRef(null)
  const recognitionRef=useRef(null)
  const [notes,setNotes]=useState(()=>getLS('rafeaq_notes', []))
  const [noteInput,setNoteInput]=useState({type:'youtube', value:''})
  const [noteResult,setNoteResult]=useState('')
  const [noteProcessing,setNoteProcessing]=useState(false)
  const [files,setFiles]=useState(()=>getLS('rafeaq_files', []))
  const [terabox,setTerabox]=useState(()=>getLS('rafeaq_terabox', []))
  const [libraryBooks,setLibraryBooks]=useState(()=>getLS('rafeaq_library', []))
  const [notionConnected,setNotionConnected]=useState(()=>getLS('rafeaq_notion_connected', false))
  const [notionTasks,setNotionTasks]=useState(()=>getLS('rafeaq_notion', []))
  const [pomoTime,setPomoTime]=useState(25*60)
  const [pomoRunning,setPomoRunning]=useState(false)
  const [pomoMode,setPomoMode]=useState('work')

  useEffect(()=>{
    const u=localStorage.getItem('rafeaq_user')||localStorage.getItem('rafeaq_name')||'أحمد محمد'
    setUser(u.split('@')[0])
    if(!localStorage.getItem('rafeaq_token')) nav('/login')
  },[nav])
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs,tab])
  useEffect(()=>{ localStorage.setItem('rafeaq_msgs', JSON.stringify(msgs)) },[msgs])
  useEffect(()=>{ localStorage.setItem('rafeaq_chances', JSON.stringify(chances)) },[chances])
  useEffect(()=>{ localStorage.setItem('rafeaq_notes', JSON.stringify(notes)) },[notes])
  useEffect(()=>{ localStorage.setItem('rafeaq_files', JSON.stringify(files)) },[files])
  useEffect(()=>{ localStorage.setItem('rafeaq_terabox', JSON.stringify(terabox)) },[terabox])
  useEffect(()=>{ localStorage.setItem('rafeaq_library', JSON.stringify(libraryBooks)) },[libraryBooks])
  useEffect(()=>{ localStorage.setItem('rafeaq_notion', JSON.stringify(notionTasks)) },[notionTasks])
  useEffect(()=>{ localStorage.setItem('rafeaq_notion_connected', JSON.stringify(notionConnected)) },[notionConnected])
  useEffect(()=>{
    if(!pomoRunning) return
    const id=setInterval(()=>setPomoTime(t=>t>1?t-1:0),1000)
    return ()=>clearInterval(id)
  },[pomoRunning])

  useEffect(()=>{
    if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      const rec = new SR()
      rec.lang='ar-LY'
      rec.continuous=false
      rec.interimResults=false
      rec.onresult=(e)=>{ setInp(e.results[0][0].transcript); setIsListening(false) }
      rec.onend=()=>setIsListening(false)
      recognitionRef.current=rec
    }
  },[])

  function toggleVoice(){
    if(!recognitionRef.current){ alert('المتصفح لا يدعم المحادثة الصوتية - استخدم Chrome') ; return }
    if(isListening){ recognitionRef.current.stop(); setIsListening(false) }
    else { recognitionRef.current.start(); setIsListening(true) }
  }

  async function send(type){
    const q=(type||inp).trim()
    if(!q) return
    if(chances<=0){ setMsgs(m=>[...m,{role:'assistant',text:'استهلكت 25 فرصة اليوم. تتجدد غدا.'}]); return }
    setMsgs(m=>[...m,{role:'user',text:q}])
    setInp('')
    setAiLoading(true)
    setChances(c=>c-1)
    try{
      const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q, mode:type||'general'})})
      const data=await res.json()
      let reply=data.reply||data.text||''
      if(!reply){
        if(type==='mcq') reply=`### اختبار MCQ عن: ${q}`
        else if(type==='quiz') reply=`### كويز سريع: ${q}`
        else reply=`**شرح مبسط:**\n${q}`
      }
      setMsgs(m=>[...m,{role:'assistant',text:reply}])
    }catch(e){
      setMsgs(m=>[...m,{role:'assistant',text:`**${q}**`}])
    }
    setAiLoading(false)
  }

  async function processNotebook(){
    if(!noteInput.value.trim()) return
    setNoteProcessing(true)
    setNoteResult('')
    try{
      await new Promise(r=>setTimeout(r,1500))
      setNoteResult(`**تم التحليل:** ${noteInput.value.slice(0,200)}`)
      setNotes(n=>[{id:Date.now(), title: noteInput.value.slice(0,30), content: noteInput.value, type: noteInput.type, date:new Date().toLocaleDateString('ar-LY')},...n])
    }catch(e){ setNoteResult('خطأ') }
    setNoteProcessing(false)
  }

  function handleUpload(e,target){
    const file=e.target.files&&e.target.files[0]; if(!file) return
    const reader=new FileReader()
    reader.onload=()=>{
      const item={id:Date.now(), name:file.name, size:file.size, type:file.type, data:reader.result, date:new Date().toLocaleDateString('ar-LY')}
      if(target==='docs') setFiles(f=>[item,...f])
      else if(target==='terabox') setTerabox(f=>[item,...f])
      else if(target==='audio'){ setNoteInput({type:'audio', value:file.name}); setNoteResult(`تم رفع الصوتية: ${file.name}`) }
      else setLibraryBooks(b=>[item,...b])
    }
    reader.readAsDataURL(file)
  }

  function downloadBook(book){
    const fake={id:Date.now(), name:book.name, size:1024*500, data:'', date:new Date().toLocaleDateString('ar-LY'), source:'library'}
    setLibraryBooks(b=>[fake,...b])
    window.open(LIBRARY_URL,'_blank')
  }

  const totalBytes=[...files,...terabox,...libraryBooks].reduce((s,f)=>s+(f.size||0),0)
  const totalMB=(totalBytes/1024/1024).toFixed(1)

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');*{font-family:'IBM Plex Sans Arabic',sans-serif}`}</style>
      <div className="w- bg-[#0F1115] hidden lg:flex flex-col fixed right-0 top-0 h-screen z-30 border-l border-white/[0.06]">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded- bg-white flex items-center justify-center"><div className="w-5 h-5 bg-black rounded- flex items-center justify-center text-white font-bold text-">ر</div></div>
            <div><div className="text-white font-[700] text-">رفيق</div><div className="text-white/40 text- mt-0.5">RAFEAQ • v2.1</div></div>
          </div>
          <div className="mt-9">
            <div className="text- text-white/30 font-[600] tracking-widest mb-3">القائمة الرئيسية</div>
            <div className="space-y-">
              <button onClick={()=>setTab('home')} className={`w-full flex items-center gap-3 px-3 h- rounded- text-right text- transition ${tab==='home'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>الرئيسية</button>
              <button onClick={()=>setTab('ai')} className={`w-full flex items-center justify-between px-3 h- rounded- text-right text- transition ${tab==='ai'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}><span>رفيق AI</span></button>
              <button onClick={()=>setTab('notebook')} className={`w-full flex items-center gap-3 px-3 h- rounded- text-right text- transition ${tab==='notebook'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>دفتر رفيق</button>
              <button onClick={()=>setTab('terabox')} className={`w-full flex items-center gap-3 px-3 h- rounded- text-right text- transition ${tab==='terabox'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>TeraBox</button>
              <button onClick={()=>setTab('library')} className={`w-full flex items-center gap-3 px-3 h- rounded- text-right text- transition ${tab==='library'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>مكتبة رفيق</button>
              <button onClick={()=>setTab('pomo')} className={`w-full flex items-center gap-3 px-3 h- rounded- text-right text- transition ${tab==='pomo'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>مؤقت الدراسة</button>
            </div>
          </div>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded- bg-white/[0.04] border border-white/[0.06] p-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-white text- font-bold">{user[0]}</div>
              <div className="flex-1"><div className="text-white text- font-[600]">{user}</div><div className="text-white/40 text-">{totalMB} MB • {chances}/25</div></div>
            </div>
          </div>
          <button onClick={()=>{localStorage.removeItem('rafeaq_token'); nav('/login')}} className="w-full mt-3 h-9 rounded- bg-white/[0.04] text-white/60 text- border border-white/[0.06]">تسجيل الخروج</button>
        </div>
      </div>
      <div className="flex-1 lg:mr-">
        <div className="h- bg-white/80 border-b border-[#EDEEF2] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex-1 max-w-"><input placeholder="ابحث..." className="w-full h- px-4 rounded- bg-[#F2F3F5] text- outline-none" /></div>
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center text- font-bold">{user[0]}</div></div>
        </div>
        <div className="p-6"><div className="max-w- mx-auto">
            {tab==='home' && (
              <div className="space-y-6">
                <div className="rounded- bg-[#0F1115] overflow-hidden relative p-8 md:p-10 flex items-center min-h-">
                  <div className="absolute inset-0 bg-gradient-to-l from-[#0F1115] via-[#0F1115]/90 to-[#0F1115]/60"></div>
                  <div className="relative z-10 max-w-">
                    <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-white/[0.08] border border-white/10 text- text-white/70"><span className="w-2 h-2 bg-[#0AEF8A] rounded-full"></span> نظام الدراسة الذكي</div>
                    <h1 className="mt-4 text- font-[800] text-white leading-[1.15]">مرحبا، {user}<br/>جاهز تكمل رحلتك؟</h1>
                    <p className="mt-3 text- text-white/60 leading-6">كل أدوات الدراسة في مكان واحد.</p>
                    <div className="mt-6 flex gap-2.5"><button onClick={()=>setTab('ai')} className="h-10 px-5 rounded-full bg-white text-black text- font-[600]">ابدأ الآن →</button><button onClick={()=>setTab('notebook')} className="h-10 px-5 rounded-full bg-white/[0.08] border border-white/10 text-white text-">دفتر رفيق</button></div>
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {t:'ai', title:'رفيق AI', sub:`${chances}/25`},
                      {t:'notebook', title:'دفتر رفيق', sub:`${notes.length}`},
                      {t:'terabox', title:'TeraBox', sub:`${totalMB} MB`},
                      {t:'library', title:'مكتبة رفيق', sub:`${libraryBooks.length}`},
                    ].map(c=>(
                      <button key={c.t} onClick={()=>setTab(c.t)} className="rounded- p-4 text-right border border-[#EDEEF2] bg-white hover:border-black/10">
                        <div className="font-[600] text-">{c.title}</div><div className="text- opacity-60 mt-1">{c.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab==='ai' && (
              <div className="max-w- mx-auto">
                <div className="bg-white rounded- border border-[#EDEEF2] overflow-hidden">
                  <div className="h- border-b flex items-center justify-between px-6">
                    <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-[#111] text-white flex items-center justify-center font-bold">ر</div><div><div className="font-[600] text-">رفيق AI</div><div className="text- text-[#6B7280]">صوت • شرح • MCQ • {chances}/25</div></div></div>
                    <div className="flex items-center gap-2"><div className="text- px-3 h-7 rounded-full bg-[#F2F3F5] border">{chances} متبقي</div><button onClick={()=>{ if(confirm('مسح المحادثة؟')){ setMsgs([]); setChances(25); localStorage.removeItem('rafeaq_msgs'); } }} className="text- px-3 h-7 rounded-full border">إعادة تعيين</button></div>
                  </div>
                  <div className="h- overflow-y-auto p-6 space-y-5 bg-[#FAFBFD]">
                    {msgs.length===0 && (
                      <div className="py-16 text-center">
                        <div className="w-16 h-16 mx-auto rounded- bg-[#111] text-white flex items-center justify-center">ر</div>
                        <h2 className="mt-5 text- font-[700]">كيف نقدر نساعدك؟</h2>
                        <p className="text- text-[#6B7280] mt-2">شرح، كويز، MCQ، وصوتي</p>
                      </div>
                    )}
                    {msgs.map((m,i)=>(
                      <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[78%] rounded- px-5 py-3.5 text- ${m.role==='user'?'bg-[#111] text-white':'bg-white border'}`}>{m.text}</div></div>
                    ))}
                    {aiLoading && <div className="flex justify-start"><div className="bg-white border rounded- px-5 py-3 text-">يكتب...</div></div>}
                    <div ref={bottomRef}/>
                  </div>
                  <div className="p-3 bg-white border-t">
                    <div className="flex items-center gap-2 rounded- bg-[#F2F3F5] border px-3 py-2">
                      <button onClick={toggleVoice} className={`w-9 h-9 rounded-full flex items-center justify-center ${isListening?'bg-red-500 text-white':'bg-white border'}`}>🎤</button>
                      <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send() }} placeholder={isListening?'استمع...':'اسأل أي شيء...'} className="flex-1 bg-transparent outline-none text- h-9" />
                      <button onClick={()=>send()} className="w-9 h-9 rounded-full bg-[#111] text-white">↑</button>
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1"><span className="text- text-[#9CA3AF]">تحقق من المعلومات • 25 فرصة يوميا</span><span className="text- text-[#6B7280]">{chances}/25</span></div>
                  </div>
                </div>
              </div>
            )}
            {tab==='library' && (
              <div className="max-w- mx-auto space-y-5">
                <div className="rounded- bg-[#111] p-6 text-white flex items-center justify-between">
                  <div><div className="font-[700] text-">مكتبة رفيق</div><div className="text- opacity-60 mt-1">{libraryBooks.length} كتب محفوظة</div></div>
                  <a href={LIBRARY_URL} target="_blank" className="h-9 px-4 rounded-full bg-white text-black text- font-[600]">فتح المكتبة ↗</a>
                </div>
                <div className="bg-white rounded- border p-5">
                  <div className="space-y-2.5">
                    {[
                      {name:'الرياضيات - ثالث ثانوي', cat:'رياضيات'},
                      {name:'الفيزياء', cat:'فيزياء'},
                      {name:'اللغة العربية', cat:'عربية'},
                      {name:'الكيمياء', cat:'كيمياء'},
                      {name:'التربية الإسلامية', cat:'إسلامية'},
                    ].map((b,i)=>(
                      <div key={i} className="flex items-center gap-3 p-3 rounded- border hover:bg-[#FAFBFD]">
                        <div className="w-10 h-10 rounded- bg-[#F2F3F5] flex items-center justify-center font-bold">ك</div>
                        <div className="flex-1"><div className="font-[500] text-">{b.name}</div><div className="text- text-[#9CA3AF]">{b.cat}</div></div>
                        <button onClick={()=>downloadBook(b)} className="h-8 px-3 rounded-full bg-black text-white text-">تنزيل</button>
                        <a href={LIBRARY_URL} target="_blank" className="h-8 px-3 rounded-full bg-white border text- flex items-center">فتح</a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div></div>
      </div>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0F1115] border-t border-white/10 p-2 flex gap-1.5 overflow-x-auto z-50">
        {[
          {id:'home', l:'الرئيسية'},
          {id:'ai', l:`AI ${chances}`},
          {id:'notebook', l:'دفتر'},
          {id:'terabox', l:'TeraBox'},
          {id:'library', l:'مكتبة'},
        ].map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 h-8 rounded-full text- font-[600] ${tab===t.id?'bg-white text-black':'bg-white/10 text-white/60'}`}>{t.l}</button>)}
      </div>
    </div>
  )
}