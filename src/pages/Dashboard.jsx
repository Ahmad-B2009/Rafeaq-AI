
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function getLS(k,f){ try{ const s=localStorage.getItem(k); if(s) return JSON.parse(s)}catch(e){} return f }

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
  const [slides,setSlides]=useState(()=>getLS('rafeaq_slides', [{id:1,title:'مقدمة الدرس',content:'اكتب هنا...'}]))
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
  useEffect(()=>{ localStorage.setItem('rafeaq_slides', JSON.stringify(slides)) },[slides])
  useEffect(()=>{ localStorage.setItem('rafeaq_notion', JSON.stringify(notionTasks)) },[notionTasks])
  useEffect(()=>{ localStorage.setItem('rafeaq_notion_connected', JSON.stringify(notionConnected)) },[notionConnected])

  useEffect(()=>{
    if(!pomoRunning) return
    const id=setInterval(()=>setPomoTime(t=>t>1?t-1:0),1000)
    return ()=>clearInterval(id)
  },[pomoRunning])

  // Voice setup - Gemini style
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
        if(type==='mcq') reply=`### اختبار MCQ عن: ${q}\n\n1. ما هو تعريف ${q}؟\n   أ) ...\n   ب) ...\n   ج) ...\n   د) ...\n\n2. مثال آخر...`
        else if(type==='quiz') reply=`### كويز سريع: ${q}\n\nس1: اشرح ...\nس2: ...`
        else reply=`**شرح مبسط بلهجة ليبية:**\n${q}\n\nيعني كأنه...\n\n- مثال: ...\n- ملخص: ...`
      }
      setMsgs(m=>[...m,{role:'assistant',text:reply}])
    }catch(e){
      const fallback = type==='mcq' ? `### MCQ: ${q}\n1. ...\n2. ...\n3. ...` : type==='quiz' ? `### كويز: ${q}\nس1...` : `**${q}**\n\nشرح بلهجة ليبية: ...\n\n(اربط OPENAI_API_KEY لتفعيل AI الحقيقي)`
      setMsgs(m=>[...m,{role:'assistant',text:fallback}])
    }
    setAiLoading(false)
  }

  async function processNotebook(){
    if(!noteInput.value.trim()) return
    setNoteProcessing(true)
    setNoteResult('')
    try{
      // Simulate AI processing
      await new Promise(r=>setTimeout(r,1500))
      if(noteInput.type==='youtube'){
        setNoteResult(`**تم تحليل الفيديو:** ${noteInput.value}\n\n**ملخص مشروح بالذكاء الاصطناعي:**\n- النقطة الرئيسية 1...\n- النقطة 2...\n- مثال ليبي مبسط...\n\n**نص كامل مشروح:**\nهذا الفيديو يشرح ...`)
      } else if(noteInput.type==='audio'){
        setNoteResult(`**تم تفريغ الصوتية:**\nالنص المفرغ: ...\n\n**شرح AI:**\n- تلخيص...`)
      } else {
        setNoteResult(`**نص مشروح بـ AI:**\n${noteInput.value.slice(0,200)}...\n\n**الشرح:**\nيعني...`)
      }
      setNotes(n=>[{id:Date.now(), title: noteInput.value.slice(0,30), content: noteResult || noteInput.value, type: noteInput.type, date:new Date().toLocaleDateString('ar-LY')}, ...n])
    }catch(e){ setNoteResult('خطأ في المعالجة') }
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
    // Simulate download from alamjad
    const fake={id:Date.now(), name:book.name, size:1024*500, data:'', date:new Date().toLocaleDateString('ar-LY'), source:'alamjad-ly.com'}
    setLibraryBooks(b=>[fake,...b])
  }

  const totalBytes=[...files,...terabox,...libraryBooks].reduce((s,f)=>s+(f.size||0),0)
  const totalMB=(totalBytes/1024/1024).toFixed(1)

  const alamjadBooks=[
    {name:'كتاب الرياضيات - الصف الثالث ثانوي', cat:'رياضيات', size:'12 MB'},
    {name:'الفيزياء - الميكانيكا', cat:'فيزياء', size:'8 MB'},
    {name:'اللغة العربية - البلاغة', cat:'عربية', size:'5 MB'},
    {name:'الكيمياء العضوية', cat:'كيمياء', size:'10 MB'},
    {name:'التربية الإسلامية', cat:'إسلامية', size:'6 MB'},
  ]

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');*{font-family:'IBM Plex Sans Arabic','Tajawal',sans-serif} .glass{backdrop-filter:blur(12px)}`}</style>

      {/* SIDEBAR - PROFESSIONAL NOT AI LOOK */}
      <div className="w-[256px] bg-[#0F1115] hidden lg:flex flex-col fixed right-0 top-0 h-screen z-30 border-l border-white/[0.06]">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[11px] bg-white flex items-center justify-center"><div className="w-5 h-5 bg-black rounded-[5px] flex items-center justify-center text-white font-bold text-[11px]">ر</div></div>
            <div><div className="text-white font-[700] text-[13px] tracking-tight">رفيق</div><div className="text-white/40 text-[10px] mt-0.5">RAFEAQ • v2.1</div></div>
          </div>

          <div className="mt-9">
            <div className="text-[10px] text-white/30 font-[600] tracking-widest mb-3">القائمة الرئيسية</div>
            <div className="space-y-[2px]">
              <button onClick={()=>setTab('home')} className={`w-full flex items-center gap-3 px-3 h-[36px] rounded-[9px] text-right text-[13px] transition ${tab==='home'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}><span className="text-[14px]">⌂</span> الرئيسية</button>
              <button onClick={()=>setTab('ai')} className={`w-full flex items-center justify-between px-3 h-[36px] rounded-[9px] text-right text-[13px] transition ${tab==='ai'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}><span className="flex items-center gap-3"><span className="text-[13px]">✦</span> الذكاء الاصطناعي</span>{chances<=5 && <span className="text-[9px] bg-[#FF4D4D] text-white px-1.5 py-0.5 rounded-full">{chances}</span>}</button>
              <button onClick={()=>setTab('notebook')} className={`w-full flex items-center gap-3 px-3 h-[36px] rounded-[9px] text-right text-[13px] transition ${tab==='notebook'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>◫ دفتر رفيق</button>
              <button onClick={()=>setTab('terabox')} className={`w-full flex items-center gap-3 px-3 h-[36px] rounded-[9px] text-right text-[13px] transition ${tab==='terabox'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>☁ TeraBox</button>
              <button onClick={()=>setTab('library')} className={`w-full flex items-center gap-3 px-3 h-[36px] rounded-[9px] text-right text-[13px] transition ${tab==='library'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>◩ مكتبة رفيق</button>
              <button onClick={()=>setTab('pomo')} className={`w-full flex items-center gap-3 px-3 h-[36px] rounded-[9px] text-right text-[13px] transition ${tab==='pomo'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>◷ مؤقت الدراسة</button>
            </div>

            <div className="text-[10px] text-white/30 font-[600] tracking-widest mt-7 mb-3">التكامل</div>
            <div className="space-y-[2px]">
              <button onClick={()=>setTab('notion')} className={`w-full flex items-center gap-3 px-3 h-[36px] rounded-[9px] text-right text-[13px] transition ${tab==='notion'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}><span className="w-[18px] h-[18px] bg-white rounded-[4px] flex items-center justify-center text-black font-black text-[10px]">N</span> Notion</button>
              <button onClick={()=>setTab('docs')} className={`w-full flex items-center gap-3 px-3 h-[36px] rounded-[9px] text-right text-[13px] transition ${tab==='docs'?'bg-white text-black font-[600]':'text-white/60 hover:text-white hover:bg-white/[0.06]'}`}>⎙ المستندات</button>
            </div>
          </div>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-[12px] bg-white/[0.04] border border-white/[0.06] p-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-white text-[11px] font-bold">{user[0]}</div>
              <div className="flex-1"><div className="text-white text-[12px] font-[600]">{user}</div><div className="text-white/40 text-[10px]">{totalMB} MB • {chances}/25</div></div>
              <div className="w-2 h-2 bg-[#0AEF8A] rounded-full"></div>
            </div>
            <div className="mt-3 h-[4px] bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full" style={{width:`${(chances/25)*100}%`}}></div></div>
          </div>
          <button onClick={()=>{localStorage.removeItem('rafeaq_token'); sessionStorage.setItem('just_logged_out','1'); nav('/login')}} className="w-full mt-3 h-9 rounded-[9px] bg-white/[0.04] hover:bg-white/[0.08] text-white/60 text-[11px] border border-white/[0.06]">تسجيل الخروج</button>
        </div>
      </div>

      <div className="flex-1 lg:mr-[256px]">
        <div className="h-[56px] bg-white/80 glass border-b border-[#EDEEF2] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1 max-w-[460px]">
            <div className="relative flex-1">
              <input placeholder="ابحث في الدروس، الملفات، Notion..." className="w-full h-[36px] pr-9 pl-20 rounded-[10px] bg-[#F2F3F5] border border-transparent text-[12px] outline-none focus:bg-white focus:border-[#E4E5E9] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] transition" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] opacity-40">⌕</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] bg-white border border-[#E8E9ED] px-2 py-1 rounded-[6px] font-[500] text-[#6B7280]">⌘K</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 h-8 px-3 rounded-full bg-[#F2F3F5] border text-[11px]"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 25 فرصة • {chances} متبقي</div>
            <div className="text-[11px] text-[#6B7280] hidden lg:block leading-[14px] text-left">السبت 23 أغسطس<br/><span className="text-[10px] opacity-60">10:24 ص • طرابلس</span></div>
            <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center text-[11px] font-bold">{user[0]}</div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-[1280px] mx-auto">

            {tab==='home' && (
              <div className="space-y-6">
                <div className="rounded-[20px] bg-[#0F1115] overflow-hidden relative p-8 md:p-10 flex items-center min-h-[200px]">
                  <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.25]" />
                  <div className="absolute inset-0 bg-gradient-to-l from-[#0F1115] via-[#0F1115]/80 to-transparent"></div>
                  <div className="absolute left-[12%] top-1/2 -translate-y-1/2 hidden md:block"><div className="w-[88px] h-[88px] rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center backdrop-blur-xl"><span className="text-[40px]">🪐</span></div></div>
                  <div className="relative z-10 max-w-[560px]">
                    <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-white/[0.08] border border-white/10 text-[11px] text-white/70"><span className="w-2 h-2 bg-[#0AEF8A] rounded-full"></span> نظام الدراسة الذكي • Notion + TeraBox</div>
                    <h1 className="mt-4 text-[28px] md:text-[30px] font-[800] text-white tracking-tight leading-[1.15]">مرحبا، {user} 👋<br/>جاهز تكمل رحلتك؟</h1>
                    <p className="mt-3 text-[13px] text-white/60 leading-6 max-w-[420px]">رفيق يجمع بين ذكاء Gemini، تنظيم Notion، وتخزين TeraBox - كل شي في مكان واحد، مصمم كأنه منتج حقيقي.</p>
                    <div className="mt-6 flex gap-2.5"><button onClick={()=>setTab('ai')} className="h-10 px-5 rounded-full bg-white text-black text-[13px] font-[600] hover:bg-[#F2F2F2] transition">ابدأ مع Gemini →</button><button onClick={()=>setTab('notebook')} className="h-10 px-5 rounded-full bg-white/[0.08] border border-white/10 text-white text-[13px] hover:bg-white/[0.12]">دفتر رفيق</button></div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {t:'ai', title:'Gemini AI', sub:`${chances}/25 فرصة`, icon:'✦', bg:'bg-[#111] text-white'},
                      {t:'notebook', title:'دفتر رفيق', sub:`${notes.length} ملاحظات`, icon:'◫', bg:'bg-white border'},
                      {t:'terabox', title:'TeraBox', sub:`${totalMB} MB`, icon:'☁', bg:'bg-white border'},
                      {t:'library', title:'مكتبة رفيق', sub:`${libraryBooks.length} كتب`, icon:'◩', bg:'bg-white border'},
                    ].map(c=>(
                      <button key={c.t} onClick={()=>setTab(c.t)} className={`rounded-[14px] p-4 text-right border border-[#EDEEF2] hover:border-black/10 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition text-left ${c.bg}`}>
                        <div className="w-9 h-9 rounded-[10px] bg-white/[0.08] border border-white/10 flex items-center justify-center text-[14px]">{c.icon}</div>
                        <div className="mt-4 font-[600] text-[13px]">{c.title}</div><div className="text-[11px] opacity-60 mt-1">{c.sub}</div>
                      </button>
                    ))}
                  </div>
                  <div className="col-span-12 lg:col-span-4 grid grid-cols-1 gap-3">
                    <div className="bg-white rounded-[14px] border border-[#EDEEF2] p-4 flex items-center justify-between"><div><div className="text-[12px] font-[600]">الرسائل المتبقية</div><div className="text-[11px] text-[#6B7280] mt-1">تجدد يوميا الساعة 12</div></div><div className="text-right"><div className="text-[20px] font-[700]">{chances}/25</div><div className="w-20 h-1.5 bg-[#F2F3F5] rounded-full mt-2 overflow-hidden"><div className="h-full bg-black rounded-full" style={{width:`${(chances/25)*100}%`}}></div></div></div></div>
                    <div className="bg-white rounded-[14px] border border-[#EDEEF2] p-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-[8px] bg-black flex items-center justify-center text-white font-black text-[11px]">N</div><div className="text-[12px] font-[600]">Notion</div><div className={`mr-auto text-[10px] px-2 py-0.5 rounded-full border ${notionConnected?'bg-green-50 text-green-700 border-green-200':'bg-[#F2F3F5] text-[#6B7280]'}`}>{notionConnected?'متصل':'غير متصل'}</div></div><div className="text-[11px] text-[#6B7280] mt-3 leading-5">اربط حسابك ونظم مهامك - غير مربوط مباشرة، انت تتحكم.</div></div>
                  </div>
                </div>
              </div>
            )}

            {tab==='ai' && (
              <div className="max-w-[860px] mx-auto">
                <div className="bg-white rounded-[20px] border border-[#EDEEF2] shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="h-[64px] border-b border-[#F0F1F3] flex items-center justify-between px-6 bg-white">
                    <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-[#111] text-white flex items-center justify-center font-bold">✦</div><div><div className="font-[600] text-[13px]">رفيق Gemini</div><div className="text-[11px] text-[#6B7280]">نموذج Gemini • صوت • شرح • MCQ • كويزات • {chances}/25</div></div></div>
                    <div className="flex items-center gap-2"><div className="text-[11px] px-3 h-7 rounded-full bg-[#F2F3F5] border flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{chances} فرص متبقية</div><button onClick={()=>{setMsgs([]); setChances(25)}} className="text-[11px] px-3 h-7 rounded-full border hover:bg-[#F9FAFB]">إعادة تعيين</button></div>
                  </div>

                  <div className="h-[56vh] overflow-y-auto p-6 space-y-5 bg-[#FAFBFD]">
                    {msgs.length===0 && (
                      <div className="py-16 text-center">
                        <div className="w-16 h-16 mx-auto rounded-[18px] bg-[#111] text-white flex items-center justify-center text-[24px]">✦</div>
                        <h2 className="mt-5 text-[20px] font-[700] tracking-tight">كيف نقدر نساعدك اليوم؟</h2>
                        <p className="text-[13px] text-[#6B7280] mt-2">اسأل مثل Gemini - شرح، كويز، MCQ، وصوتي</p>
                        <div className="mt-6 grid grid-cols-2 gap-2 max-w-[520px] mx-auto">
                          <button onClick={()=>send('اشرحلي قانون نيوتن الثاني بلهجة ليبية')} className="h-12 rounded-[12px] bg-white border border-[#EDEEF2] text-[12px] text-right px-4 hover:border-black/10">📚 اشرحلي درس بلهجة ليبية</button>
                          <button onClick={()=>send('ديرلي MCQ عن التكامل')} className="h-12 rounded-[12px] bg-white border border-[#EDEEF2] text-[12px] text-right px-4 hover:border-black/10">❓ أسئلة MCQ</button>
                          <button onClick={()=>send('ديرلي كويز سريع عن الفيزياء')} className="h-12 rounded-[12px] bg-white border border-[#EDEEF2] text-[12px] text-right px-4 hover:border-black/10">📝 كويز سريع</button>
                          <button onClick={()=>send('لخصلي هذا الدرس')} className="h-12 rounded-[12px] bg-white border border-[#EDEEF2] text-[12px] text-right px-4 hover:border-black/10">✨ تلخيص ذكي</button>
                        </div>
                      </div>
                    )}
                    {msgs.map((m,i)=>(
                      <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                        <div className={`max-w-[78%] rounded-[18px] px-5 py-3.5 text-[13px] leading-7 whitespace-pre-wrap ${m.role==='user'?'bg-[#111] text-white rounded-br-[6px]':'bg-white border border-[#EDEEF2] rounded-bl-[6px] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'}`}>{m.text}</div>
                      </div>
                    ))}
                    {aiLoading && <div className="flex justify-start"><div className="bg-white border rounded-[18px] px-5 py-3 text-[12px] flex items-center gap-2"><div className="w-4 h-4 border-2 border-[#E5E7EB] border-t-black rounded-full animate-spin"></div> Gemini يكتب...</div></div>}
                    <div ref={bottomRef}/>
                  </div>

                  <div className="p-3 bg-white border-t border-[#F0F1F3]">
                    <div className="flex items-center gap-2 rounded-[16px] bg-[#F2F3F5] border border-[#EDEEF2] px-3 py-2 focus-within:bg-white focus-within:border-[#111] focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] transition">
                      <button onClick={toggleVoice} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${isListening?'bg-[#FF3B30] text-white animate-pulse':'bg-white border hover:bg-[#FAFAFA] text-black'}`} title="محادثة صوتية مثل Gemini">🎤</button>
                      <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send() }} placeholder={isListening?'استمع... تكلم الآن':'اسأل Gemini أي شيء...'} className="flex-1 bg-transparent outline-none text-[13px] h-9" />
                      <div className="flex items-center gap-1.5">
                        <button onClick={()=>send('mcq')} className="h-8 px-3 rounded-full bg-white border text-[11px] hover:bg-black hover:text-white transition">MCQ</button>
                        <button onClick={()=>send('quiz')} className="h-8 px-3 rounded-full bg-white border text-[11px] hover:bg-black hover:text-white transition">كويز</button>
                        <button onClick={()=>send()} className="w-9 h-9 rounded-full bg-[#111] text-white flex items-center justify-center hover:bg-black transition">↑</button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1"><span className="text-[10px] text-[#9CA3AF]">Gemini يمكن أن يخطئ - تحقق من المعلومات • صوت: Web Speech API (Chrome) • 25 فرصة يوميا</span><span className="text-[10px] text-[#6B7280]">{chances}/25</span></div>
                  </div>
                </div>
              </div>
            )}

            {tab==='notebook' && (
              <div className="max-w-[920px] mx-auto space-y-4">
                <div className="bg-[#111] rounded-[16px] p-5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-[10px] bg-white text-black flex items-center justify-center font-bold">◫</div><div><div className="font-[600] text-[14px]">دفتر رفيق - صندوق الذكاء</div><div className="text-[11px] text-white/60 mt-0.5">حط رابط يوتيوب، صوتية، PDF، أو نص - يعطيك شرح مشروح بـ AI</div></div></div>
                  <div className="text-[11px] bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">{notes.length} ملاحظات</div>
                </div>

                <div className="bg-white rounded-[16px] border border-[#EDEEF2] p-5">
                  <div className="flex gap-2 mb-4">
                    {[
                      {id:'youtube', label:'📺 يوتيوب'},
                      {id:'audio', label:'🎙️ صوتية'},
                      {id:'text', label:'📝 نص'},
                      {id:'pdf', label:'📄 PDF'},
                    ].map(t=>(
                      <button key={t.id} onClick={()=>setNoteInput({...noteInput, type:t.id})} className={`h-8 px-3 rounded-full text-[11px] border transition ${noteInput.type===t.id?'bg-black text-white border-black':'bg-[#F2F3F5] border-[#EDEEF2] hover:bg-white'}`}>{t.label}</button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    {noteInput.type==='audio' ? (
                      <label className="flex-1 h-[48px] rounded-[12px] bg-[#F2F3F5] border border-dashed border-[#D1D5DB] flex items-center justify-center gap-2 cursor-pointer hover:bg-white text-[12px]">🎙️ ارفع صوتية<input type="file" accept="audio/*" className="hidden" onChange={e=>handleUpload(e,'audio')} /></label>
                    ) : noteInput.type==='pdf' ? (
                      <label className="flex-1 h-[48px] rounded-[12px] bg-[#F2F3F5] border border-dashed flex items-center justify-center gap-2 cursor-pointer hover:bg-white text-[12px]">📄 ارفع PDF<input type="file" accept=".pdf" className="hidden" onChange={e=>handleUpload(e,'docs')} /></label>
                    ) : (
                      <input value={noteInput.value} onChange={e=>setNoteInput({...noteInput, value:e.target.value})} placeholder={noteInput.type==='youtube'?'https://youtube.com/watch?v=... - حط رابط الفيديو':'اكتب النص أو الفكرة...'} className="flex-1 h-[48px] rounded-[12px] bg-[#F2F3F5] border border-transparent px-4 text-[13px] outline-none focus:bg-white focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]" />
                    )}
                    <button onClick={processNotebook} disabled={noteProcessing} className="h-[48px] px-6 rounded-[12px] bg-black text-white text-[13px] font-[600] disabled:opacity-50 hover:bg-[#111] transition">{noteProcessing?'جاري الشرح...':'اشرح بـ AI ✨'}</button>
                  </div>

                  {noteResult && (
                    <div className="mt-5 rounded-[12px] bg-[#FAFBFD] border border-[#EDEEF2] p-4 text-[13px] leading-7 whitespace-pre-wrap">{noteResult}</div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {notes.map(n=>(
                    <div key={n.id} className="bg-white rounded-[12px] border border-[#EDEEF2] p-4 hover:border-black/10 transition"><div className="text-[10px] text-[#9CA3AF] flex items-center justify-between"><span className="px-2 py-0.5 rounded-full bg-[#F2F3F5] border">{n.type}</span><span>{n.date}</span></div><div className="mt-3 font-[600] text-[12px] line-clamp-2">{n.title||n.content.slice(0,40)}</div><div className="mt-2 text-[11px] text-[#6B7280] line-clamp-3">{n.content.slice(0,100)}</div><div className="mt-3 flex gap-1.5"><button onClick={()=>setNotes(ns=>ns.filter(x=>x.id!==n.id))} className="text-[10px] px-2 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">حذف</button><button onClick={()=>{ setTab('ai'); setInp(`اشرحلي: ${n.content.slice(0,120)}`) }} className="text-[10px] px-2 py-1 rounded-full bg-[#111] text-white">شرح بـ Gemini</button></div></div>
                  ))}
                  {notes.length===0 && <div className="col-span-3 py-16 text-center bg-white rounded-[16px] border border-dashed"><div className="text-[12px] text-[#9CA3AF]">مافيش ملاحظات بعد - جرب تحط رابط يوتيوب فوق</div></div>}
                </div>
              </div>
            )}

            {tab==='terabox' && (
              <div className="max-w-[1000px] mx-auto space-y-4">
                <div className="rounded-[16px] bg-[#1A73E8] p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center text-[#1A73E8] font-bold text-[16px]">T</div><div><div className="font-[700] text-[15px]">TeraBox • 1TB</div><div className="text-[11px] opacity-80 mt-0.5">نفس تصميم TeraBox الأصلي - تخزين محلي آمن على جهازك</div></div></div>
                  <div className="flex items-center gap-2"><div className="text-right"><div className="text-[12px] font-[600]">{totalMB} MB / 1TB</div><div className="w-28 h-1.5 bg-white/20 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-white rounded-full" style={{width:`${Math.min(100, (totalBytes/(1024*1024*1024))*100)}%`}}></div></div></div><label className="h-9 px-4 rounded-full bg-white text-[#1A73E8] text-[12px] font-[600] flex items-center justify-center cursor-pointer">+ رفع<input type="file" className="hidden" onChange={e=>handleUpload(e,'terabox')} /></label></div>
                </div>

                <div className="bg-white rounded-[16px] border border-[#EDEEF2] overflow-hidden">
                  <div className="h-12 border-b flex items-center px-5 gap-3 text-[12px]"><span className="font-[600]">ملفاتي</span><span className="text-[#9CA3AF]">•</span><span className="text-[#6B7280]">{terabox.length} ملفات</span><span className="mr-auto text-[11px] px-2 py-1 rounded-full bg-[#F2F3F5] border">{totalMB} MB</span></div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {terabox.map(f=>(
                      <div key={f.id} className="group rounded-[12px] border border-[#EDEEF2] p-3 hover:border-[#1A73E8]/30 hover:shadow-[0_4px_16px_rgba(26,115,232,0.08)] transition bg-white"><div className="w-9 h-9 rounded-[8px] bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center text-[14px]">📄</div><div className="mt-3 font-[500] text-[11px] truncate">{f.name}</div><div className="text-[10px] text-[#9CA3AF] mt-1">{f.date} • {(f.size/1024).toFixed(0)} KB</div><div className="mt-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition"><a href={f.data} download={f.name} className="text-[10px] px-2 py-1 rounded-full bg-[#F2F3F5] border">تحميل</a><button onClick={()=>setTerabox(t=>t.filter(x=>x.id!==f.id))} className="text-[10px] px-2 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626]">حذف</button></div></div>
                    ))}
                    {terabox.length===0 && <div className="col-span-5 py-20 text-center"><div className="w-16 h-16 mx-auto rounded-[16px] bg-[#F2F3F5] flex items-center justify-center text-[24px]">☁️</div><div className="mt-3 text-[13px] font-[600]">TeraBox فارغ</div><div className="text-[11px] text-[#9CA3AF] mt-1">ارفع ملفاتك - تتخزن محليا على جهازك فقط</div></div>}
                  </div>
                </div>
              </div>
            )}

            {tab==='library' && (
              <div className="max-w-[1000px] mx-auto space-y-5">
                <div className="rounded-[16px] bg-[#111] p-6 text-white flex items-center justify-between">
                  <div><div className="font-[700] text-[15px] flex items-center gap-2">◩ مكتبة رفيق • من موقع الامجاد</div><div className="text-[11px] opacity-60 mt-1">تنزيل الكتب من alamjad-ly.com وتخزينها على جهازك • {libraryBooks.length} كتب محفوظة</div></div>
                  <a href="https://alamjad-ly.com" target="_blank" className="h-9 px-4 rounded-full bg-white text-black text-[12px] font-[600] flex items-center justify-center">فتح الامجاد ↗</a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 bg-white rounded-[16px] border border-[#EDEEF2] p-5">
                    <h3 className="font-[600] text-[13px] mb-4">📚 كتب الامجاد المتاحة - اضغط تنزيل</h3>
                    <div className="space-y-2.5">
                      {[
                        {name:'كتاب الرياضيات - ثالث ثانوي علمي', cat:'رياضيات', size:'12.4 MB', url:'https://alamjad-ly.com'},
                        {name:'الفيزياء - الميكانيكا والكهرباء', cat:'فيزياء', size:'8.2 MB', url:'https://alamjad-ly.com'},
                        {name:'اللغة العربية - البلاغة والنحو', cat:'عربية', size:'5.1 MB', url:'https://alamjad-ly.com'},
                        {name:'الكيمياء العضوية وغير العضوية', cat:'كيمياء', size:'9.8 MB', url:'https://alamjad-ly.com'},
                        {name:'التربية الإسلامية - كامل', cat:'إسلامية', size:'6.3 MB', url:'https://alamjad-ly.com'},
                      ].map((b,i)=>(
                        <div key={i} className="flex items-center gap-3 p-3 rounded-[12px] border border-[#F0F1F3] hover:border-black/10 hover:bg-[#FAFBFD] transition group">
                          <div className="w-10 h-10 rounded-[10px] bg-[#F2F3F5] flex items-center justify-center text-[14px]">📖</div>
                          <div className="flex-1"><div className="font-[500] text-[12px]">{b.name}</div><div className="text-[10px] text-[#9CA3AF] mt-0.5">{b.cat} • {b.size} • alamjad-ly.com</div></div>
                          <button onClick={()=>downloadBook(b)} className="h-8 px-3 rounded-full bg-black text-white text-[11px] font-[500] opacity-0 group-hover:opacity-100 transition">تنزيل ↓</button>
                          <a href={b.url} target="_blank" className="h-8 px-3 rounded-full bg-white border text-[11px]">فتح</a>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-[16px] border border-[#EDEEF2] p-5">
                    <h3 className="font-[600] text-[12px] mb-4">💾 كتبي المحفوظة على الجهاز ({libraryBooks.length})</h3>
                    <div className="space-y-2">
                      {libraryBooks.map(b=>(
                        <div key={b.id} className="flex items-center gap-2 p-2.5 rounded-[10px] bg-[#FAFBFD] border"><div className="w-8 h-8 rounded-[8px] bg-white border flex items-center justify-center">📚</div><div className="flex-1"><div className="text-[11px] font-[500] truncate">{b.name}</div><div className="text-[9px] text-[#9CA3AF]">{b.date}</div></div><button onClick={()=>setLibraryBooks(bs=>bs.filter(x=>x.id!==b.id))} className="text-[10px] text-[#DC2626]">حذف</button></div>
                      ))}
                      {libraryBooks.length===0 && <div className="py-12 text-center text-[11px] text-[#9CA3AF]">مافيش كتب محفوظة - نزّل من الامجاد</div>}
                    </div>
                    <div className="mt-4 p-3 rounded-[10px] bg-[#F2F3F5] border text-[10px] text-[#6B7280] leading-5">الكتب تتخزن على حساب الجهاز فقط (localStorage + base64). ما تطلعش للسيرفر. مساحة {totalMB} MB.</div>
                  </div>
                </div>
              </div>
            )}

            {tab==='pomo' && (
              <div className="max-w-[520px] mx-auto space-y-4">
                <div className="bg-white rounded-[20px] border border-[#EDEEF2] p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                  <div className={`inline-flex items-center gap-2 h-7 px-3 rounded-full text-[11px] font-[500] border ${pomoMode==='work'?'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]':'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]'}`}><span className="w-1.5 h-1.5 rounded-full bg-current"></span>{pomoMode==='work'?'جلسة دراسة':'راحة'}</div>
                  <div className="mt-6 text-[72px] font-[800] tracking-tight tabular-nums leading-none">{String(Math.floor(pomoTime/60)).padStart(2,'0')}:{String(pomoTime%60).padStart(2,'0')}</div>
                  <div className="mt-2 text-[12px] text-[#6B7280]">{pomoMode==='work'?'ركز - 25 دقيقة':'خود بريك - 5 دقايق'}</div>
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button onClick={()=>setPomoRunning(!pomoRunning)} className={`w-16 h-16 rounded-full flex items-center justify-center text-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition ${pomoRunning?'bg-[#111] text-white':'bg-black text-white hover:bg-[#111]'}`}>{pomoRunning?'⏸':'▶'}</button>
                    <button onClick={()=>{setPomoRunning(false); setPomoTime(pomoMode==='work'?25*60:5*60)}} className="w-16 h-16 rounded-full bg-[#F2F3F5] border border-[#EDEEF2] flex items-center justify-center hover:bg-white transition">↺</button>
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-2">
                    <button onClick={()=>{setPomoMode('work'); setPomoTime(25*60); setPomoRunning(false)}} className={`h-10 rounded-full text-[11px] border ${pomoMode==='work'?'bg-black text-white border-black':'bg-white'}`}>25 دراسة</button>
                    <button onClick={()=>{setPomoMode('break'); setPomoTime(5*60); setPomoRunning(false)}} className={`h-10 rounded-full text-[11px] border ${pomoMode==='break'?'bg-black text-white border-black':'bg-white'}`}>5 راحة</button>
                    <button onClick={()=>{setPomoMode('work'); setPomoTime(50*60); setPomoRunning(false)}} className="h-10 rounded-full text-[11px] border bg-white">50 عميق</button>
                  </div>
                </div>
                <div className="bg-[#111] rounded-[16px] p-5 text-white"><div className="text-[13px] font-[600]">كيف تخدم؟</div><div className="text-[11px] opacity-60 mt-2 leading-6">25 دقيقة تركيز + 5 راحة - نفس طريقة بومودورو الأصلية. تقدر تربطها مع Notion باش تسجل جلساتك.</div></div>
              </div>
            )}

            {tab==='notion' && (
              <div className="max-w-[960px] mx-auto space-y-4">
                <div className="rounded-[16px] bg-[#111] p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center text-black font-black text-[16px]">N</div><div><div className="font-[700] text-[14px]">Notion • الربط الاختياري</div><div className="text-[11px] opacity-60 mt-1">مش مربوط مباشرة - انت تختار امتى تربط، متناسق مع الداشبورد</div></div></div>
                  <button onClick={()=>setNotionConnected(!notionConnected)} className={`h-9 px-5 rounded-full text-[12px] font-[600] transition ${notionConnected?'bg-white text-black':'bg-white/10 text-white border border-white/10 hover:bg-white/15'}`}>{notionConnected?'متصل ✅':'ربط Notion'}</button>
                </div>

                <div className="bg-white rounded-[16px] border border-[#EDEEF2] overflow-hidden">
                  <div className="h-11 border-b bg-[#FAFAFA] flex items-center px-4 gap-2 text-[12px]"><span className="w-6 h-6 bg-black rounded-[6px] flex items-center justify-center text-white font-black text-[11px]">N</span> قاعدة بيانات رفيق • {notionTasks.length} صف</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-[#FAFAFA] border-b text-[11px] text-[#6B7280]"><tr><th className="p-3 font-[500]">المهمة</th><th className="p-3 font-[500]">المادة</th><th className="p-3 font-[500]">الحالة</th><th className="p-3 font-[500]">التاريخ</th><th className="p-3"></th></tr></thead>
                      <tbody>
                        {notionTasks.map(t=>(
                          <tr key={t.id} className="border-b hover:bg-[#FAFBFD] group"><td className="p-3"><input value={t.name} onChange={e=>setNotionTasks(ts=>ts.map(x=>x.id===t.id?{...x,name:e.target.value}:x))} className="bg-transparent outline-none text-[12px] font-[500] w-full" /></td><td className="p-3"><input value={t.subject} onChange={e=>setNotionTasks(ts=>ts.map(x=>x.id===t.id?{...x,subject:e.target.value}:x))} className="bg-transparent outline-none text-[11px] w-[90px]" /></td><td className="p-3"><select value={t.status} onChange={e=>setNotionTasks(ts=>ts.map(x=>x.id===t.id?{...x,status:e.target.value}:x))} className={`text-[11px] px-2 py-1 rounded-full border outline-none ${t.status==='منجز'?'bg-green-50 text-green-700 border-green-200':t.status==='جاري'?'bg-yellow-50 text-yellow-700 border-yellow-200':'bg-[#F2F3F5]'}`}><option>لم يبدأ</option><option>جاري</option><option>منجز</option></select></td><td className="p-3 text-[11px] text-[#9CA3AF]">{t.date}</td><td className="p-3"><button onClick={()=>setNotionTasks(ts=>ts.filter(x=>x.id!==t.id))} className="opacity-0 group-hover:opacity-100 text-[11px] text-[#DC2626]">حذف</button></td></tr>
                        ))}
                        {notionTasks.length===0 && <tr><td colSpan={5} className="p-10 text-center text-[12px] text-[#9CA3AF]">مافيش مهام - اضف من دفتر رفيق أو اكتب هنا</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 bg-[#FAFAFA] border-t flex items-center gap-2"><button onClick={()=>setNotionTasks([...notionTasks,{id:Date.now(), name:'مهمة جديدة', subject:'عام', status:'لم يبدأ', date:new Date().toLocaleDateString('ar-LY')}])} className="h-7 px-3 rounded-full bg-white border text-[11px]">+ صف جديد</button><span className="text-[11px] text-[#9CA3AF] mr-auto">{notionTasks.filter(t=>t.status==='منجز').length} منجز • {notionTasks.filter(t=>t.status==='جاري').length} جاري</span></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-[14px] border p-4 text-center"><div className="w-9 h-9 mx-auto bg-black rounded-[8px] flex items-center justify-center text-white font-black">N</div><div className="mt-3 font-[600] text-[12px]">تصدير ل Notion الحقيقي</div><div className="text-[10px] text-[#9CA3AF] mt-1 leading-5">انسخ JSON والصقه في Notion</div><button onClick={()=>navigator.clipboard.writeText(JSON.stringify(notionTasks,null,2))} className="mt-3 w-full h-9 rounded-full bg-black text-white text-[11px]">نسخ JSON</button></div>
                  <div className="bg-white rounded-[14px] border p-4 text-center"><div className="w-9 h-9 mx-auto bg-[#F2F3F5] rounded-[8px] flex items-center justify-center">✦</div><div className="mt-3 font-[600] text-[12px]">نظم جدول مع Gemini</div><div className="text-[10px] text-[#9CA3AF] mt-1 leading-5">خلي AI ينظم مهامك</div><button onClick={()=>{ setTab('ai'); setInp(`نظملي جدول مذاكرة من مهام Notion: ${notionTasks.map(t=>t.name).join(', ')}`) }} className="mt-3 w-full h-9 rounded-full bg-[#111] text-white text-[11px]">نظم ✨</button></div>
                  <div className="bg-white rounded-[14px] border p-4 text-center"><div className="w-9 h-9 mx-auto bg-[#FFF7ED] rounded-[8px] flex items-center justify-center">☁️</div><div className="mt-3 font-[600] text-[12px]">TeraBox + Notion</div><div className="text-[10px] text-[#9CA3AF] mt-1">{totalMB} MB • {notionTasks.length} مهمة</div><div className="mt-3 w-full h-9 rounded-full bg-[#F2F3F5] border flex items-center justify-center text-[11px]">{notionConnected?'متصل ✅':'غير متصل'}</div></div>
                </div>
              </div>
            )}

            {tab==='docs' && (
              <div className="bg-white rounded-[16px] border border-[#EDEEF2] p-6">
                <div className="flex justify-between items-center mb-6"><h3 className="font-[600] text-[14px]">⎙ المستندات ({files.length})</h3><label className="h-9 px-4 rounded-full bg-black text-white text-[12px] flex items-center justify-center cursor-pointer">+ رفع PDF<input type="file" className="hidden" onChange={e=>handleUpload(e,'docs')} /></label></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {files.map(f=><div key={f.id} className="border rounded-[12px] p-4 bg-[#FAFBFD]"><div className="font-[500] text-[12px] truncate">{f.name}</div><div className="text-[10px] text-[#9CA3AF] mt-1">{f.date}</div><div className="flex gap-1.5 mt-3"><a href={f.data} download={f.name} className="text-[11px] px-2 py-1 rounded-full bg-white border">تحميل</a><button onClick={()=>setFiles(fs=>fs.filter(x=>x.id!==f.id))} className="text-[11px] px-2 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626]">حذف</button></div></div>)}
                  {files.length===0 && <div className="col-span-3 py-16 text-center text-[12px] text-[#9CA3AF]">مافيش مستندات</div>}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0F1115] border-t border-white/10 p-2 flex gap-1.5 overflow-x-auto z-50">
        {[
          {id:'home', l:'الرئيسية'},
          {id:'ai', l:`AI ${chances}`},
          {id:'notebook', l:'دفتر'},
          {id:'terabox', l:'TeraBox'},
          {id:'library', l:'مكتبة'},
          {id:'notion', l:'Notion'},
        ].map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 h-8 rounded-full text-[11px] whitespace-nowrap font-[600] ${tab===t.id?'bg-white text-black':'bg-white/10 text-white/60'}`}>{t.l}</button>)}
      </div>
    </div>
  )
}
