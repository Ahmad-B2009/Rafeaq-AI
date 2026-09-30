import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const navItems = [
  { id: 'home', label: 'الرئيسية', icon: '🏠' },
  { id: 'notebook', label: 'دفتر رفيق', icon: '📓' },
  { id: 'docs', label: 'المستندات', icon: '📝' },
  { id: 'slides', label: 'العروض', icon: '🎨' },
  { id: 'library', label: 'مكتبة رفيق', icon: '📚' },
  { id: 'ai', label: 'الذكاء الاصطناعي', icon: '💬' },
  { id: 'pomo', label: 'بومودورو', icon: '⏱️' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
]

export default function Dashboard(){
  const nav = useNavigate()
  const [tab,setTab] = useState('home')
  const [user,setUser] = useState('أحمد')
  const [msgs,setMsgs] = useState([
    {role:'assistant', text:'هلا أحمد! 👋\nأنا رفيق AI جاهز:\n• نشرح دروس بلهجة ليبية\n• نلخص كتب\n• ندير اختبارات\n• TeraBox 1TB لمفاتك'}
  ])
  const [inp,setInp] = useState('')
  const bottomRef = useRef(null)
  const [notes,setNotes] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('rafeaq_notes')||'[]')}catch{ return [] } })
  const [files,setFiles] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('rafeaq_files')||'[]')}catch{ return [] } })
  const [teraboxFiles,setTeraboxFiles] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('rafeaq_terabox')||'[]')}catch{ return [] } })
  const [pomoTime,setPomoTime] = useState(25*60)
  const [pomoRunning,setPomoRunning] = useState(false)
  const [search,setSearch] = useState('')

  useEffect(()=>{
    const u = localStorage.getItem('rafeaq_user') || localStorage.getItem('rafeaq_name') || 'أحمد محمد'
    setUser(u.split('@')[0])
    if(!localStorage.getItem('rafeaq_token')) nav('/login')
  },[nav])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])
  useEffect(()=>{ localStorage.setItem('rafeaq_notes', JSON.stringify(notes)) },[notes])
  useEffect(()=>{ localStorage.setItem('rafeaq_files', JSON.stringify(files)) },[files])
  useEffect(()=>{ localStorage.setItem('rafeaq_terabox', JSON.stringify(teraboxFiles)) },[teraboxFiles])

  useEffect(()=>{
    if(!pomoRunning) return
    const id = setInterval(()=> setPomoTime(t=> t>0 ? t-1 : 0), 1000)
    return ()=> clearInterval(id)
  },[pomoRunning])

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
    setTimeout(()=> setMsgs(m=>[...m,{role:'assistant',text:`تمام: "${u}" - نشرحهولك بلهجة ليبية 🇱🇾\n\nتبي نحفظه في دفتر رفيق ولا نديرلك عرض؟`}]),500)
  }

  const filteredNav = navItems.filter(n=> n.label.includes(search) || search==='')

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');*{font-family:'Tajawal',sans-serif}`}</style>

      {/* SIDEBAR - مثل الصورة */}
      <div className="w-[260px] bg-white border-l border-[#EEF0F6] hidden lg:flex flex-col justify-between fixed right-0 top-0 h-screen z-30">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#7C6BFF] flex items-center justify-center text-white font-black">🤖</div>
            <div>
              <div className="font-[800] text-[16px] text-[#1E1B4B]">رفيق AI</div>
              <div className="text-[10px] text-[#8B8BA7] -mt-1">مساعدك الدراسي الذكي</div>
            </div>
          </div>

          <div className="px-4 space-y-1 mt-2">
            {filteredNav.map(item=>{
              const active = tab===item.id
              return (
                <button key={item.id} onClick={()=>setTab(item.id)} className={`w-full flex items-center gap-3 px-4 h-[44px] rounded-[12px] text-right transition-all ${active ? 'bg-[#F0ECFF] text-[#7C6BFF]' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>
                  <span className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-[14px] ${active ? 'bg-[#7C6BFF] text-white' : 'bg-[#F9FAFB]'}`}>{item.icon}</span>
                  <span className={`text-[13px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                  {item.id==='library' && <span className="mr-auto text-[10px] bg-[#7C6BFF] text-white px-2 py-0.5 rounded-full">3</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t border-[#F3F0FF]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-[12px] hover:bg-[#F9FAFB] cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-[#EDE9FF] flex items-center justify-center text-[14px]">👤</div>
            <div className="flex-1">
              <div className="text-[12px] font-bold text-[#1E1B4B]">{user}</div>
              <div className="text-[10px] text-[#8B8BA7]">طالب</div>
            </div>
            <span className="text-[12px]">▼</span>
          </div>
          <div className="mt-3 bg-[#F8F7FF] rounded-[12px] p-3 border border-[#F0ECFF]">
            <div className="flex justify-between text-[10px] text-[#8B8BA7]"><span>الرسائل المتبقية اليوم</span><span>👑</span></div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-[#EDE9FF] rounded-full overflow-hidden"><div className="h-full bg-[#7C6BFF] rounded-full w-[48%]"></div></div>
              <span className="text-[11px] font-bold text-[#1E1B4B]">12 / 25</span>
            </div>
          </div>
          <button onClick={logout} className="w-full mt-3 h-9 rounded-[10px] border border-[#E5E7EB] text-[11px] font-bold text-[#6B7280] hover:bg-black hover:text-white transition">تسجيل الخروج</button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 lg:mr-[260px] flex flex-col">
        {/* TOP BAR - مثل الصورة */}
        <div className="h-[64px] bg-white border-b border-[#EEF0F6] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1 max-w-[500px]">
            <div className="relative flex-1">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[14px]">🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث في الدروس أو الأسئلة..." className="w-full h-10 pr-9 pl-4 rounded-full bg-[#F9FAFB] border border-[#F3F0FF] text-[12px] outline-none focus:border-[#7C6BFF] focus:bg-white" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative w-9 h-9 rounded-full bg-[#F9FAFB] flex items-center justify-center">
              🔔
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <span>السبت 23 أغسطس 2025</span>
              <span className="text-[14px]">📅</span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6 bg-[#F8F9FF]">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6">

            {/* CENTER - 3 cols */}
            <div className="xl:col-span-3 space-y-6">
              {/* HERO - مثل الصورة بالزبط */}
              <div className="rounded-[20px] bg-gradient-to-l from-[#EDE9FF] via-[#F5F3FF] to-[#F8F7FF] border border-[#EDE9FF] p-6 flex items-center justify-between overflow-hidden relative">
                <div className="absolute left-10 top-0 w-32 h-32 bg-white/40 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-6 z-10">
                  <div className="w-[96px] h-[96px] rounded-[20px] bg-gradient-to-br from-[#7C6BFF] to-[#A78BFA] flex items-center justify-center text-[48px] shadow-[0_8px_24px_rgba(124,107,255,0.3)]">🤖</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-[28px] font-[800] text-[#1E1B4B]">مرحباً، {user} 👋</h1>
                    </div>
                    <p className="text-[13px] text-[#6B7280] mt-1">معاً نحقق أهدافك.. خطوة بخطوة نحو مستقبل أفضل</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="text-[11px] text-[#6B7280]">تقدمك في التعلم</div>
                      <div className="w-32 h-2 bg-white rounded-full overflow-hidden border"><div className="h-full bg-[#7C6BFF] w-[40%] rounded-full"></div></div>
                      <span className="text-[11px] font-bold text-[#7C6BFF]">40%</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block z-10">
                  <div className="bg-white rounded-[14px] border border-[#EDE9FF] p-3 min-w-[140px]">
                    <div className="text-[11px] text-[#8B8BA7]">أنت الآن في</div>
                    <div className="mt-2 flex items-center gap-2 bg-[#F0ECFF] rounded-full px-3 py-1.5">
                      <span className="text-[12px]">🎓</span>
                      <span className="text-[11px] font-bold text-[#7C6BFF]">المستوى الأول</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 CARDS - اللي ذكرناه: دفتر، مستندات، عروض، مكتبة TeraBox */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={()=>setTab('notebook')} className="bg-white rounded-[16px] border border-[#F0ECFF] p-5 text-right hover:shadow-[0_8px_24px_rgba(124,107,255,0.08)] transition group">
                  <div className="w-10 h-10 rounded-[12px] bg-[#F0ECFF] flex items-center justify-center text-[18px] group-hover:scale-110 transition">📓</div>
                  <div className="mt-4 font-bold text-[13px] text-[#1E1B4B]">دفتر رفيق</div>
                  <div className="text-[11px] text-[#8B8BA7] mt-1">دون ملاحظاتك وملخصاتك</div>
                  <div className="mt-3 w-6 h-6 rounded-full bg-[#F9FAFB] flex items-center justify-center text-[10px]">→</div>
                </button>
                <button onClick={()=>setTab('docs')} className="bg-white rounded-[16px] border border-[#F0ECFF] p-5 text-right hover:shadow-[0_8px_24px_rgba(124,107,255,0.08)] transition group">
                  <div className="w-10 h-10 rounded-[12px] bg-[#DCFCE7] flex items-center justify-center text-[18px] group-hover:scale-110 transition">📝</div>
                  <div className="mt-4 font-bold text-[13px] text-[#1E1B4B]">المستندات</div>
                  <div className="text-[11px] text-[#8B8BA7] mt-1">ارفع وحلل ملفاتك PDF</div>
                  <div className="mt-3 w-6 h-6 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[10px]">→</div>
                </button>
                <button onClick={()=>setTab('slides')} className="bg-white rounded-[16px] border border-[#F0ECFF] p-5 text-right hover:shadow-[0_8px_24px_rgba(124,107,255,0.08)] transition group">
                  <div className="w-10 h-10 rounded-[12px] bg-[#E0F2FE] flex items-center justify-center text-[18px] group-hover:scale-110 transition">🎨</div>
                  <div className="mt-4 font-bold text-[13px] text-[#1E1B4B]">العروض</div>
                  <div className="text-[11px] text-[#8B8BA7] mt-1">حول دروسك لعروض</div>
                  <div className="mt-3 w-6 h-6 rounded-full bg-[#F0F9FF] flex items-center justify-center text-[10px]">→</div>
                </button>
                <button onClick={()=>setTab('library')} className="bg-white rounded-[16px] border border-[#F0ECFF] p-5 text-right hover:shadow-[0_8px_24px_rgba(124,107,255,0.08)] transition group">
                  <div className="w-10 h-10 rounded-[12px] bg-[#FCE7F3] flex items-center justify-center text-[18px] group-hover:scale-110 transition">📚</div>
                  <div className="mt-4 font-bold text-[13px] text-[#1E1B4B]">مكتبة رفيق + TeraBox</div>
                  <div className="text-[11px] text-[#8B8BA7] mt-1">1TB تخزين + الامجاد</div>
                  <div className="mt-3 w-6 h-6 rounded-full bg-[#FDF2F8] flex items-center justify-center text-[10px]">→</div>
                </button>
              </div>

              {/* BOTTOM ROW - مراجعة سريعة + إحصائيات */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* مراجعة سريعة - دفتر، مستندات، عروض، مكتبة */}
                <div className="lg:col-span-2 bg-white rounded-[16px] border border-[#F0ECFF] p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[13px] flex items-center gap-2">🎯 مراجعة سريعة</h3>
                    <button className="text-[11px] text-[#7C6BFF]">عرض الكل</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={()=>setTab('notebook')} className="flex items-center gap-3 p-3 rounded-[12px] bg-[#F5F3FF] border border-[#EDE9FF] hover:bg-[#EDE9FF] transition text-right">
                      <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center">📓</div>
                      <div>
                        <div className="text-[12px] font-bold">دفتر رفيق</div>
                        <div className="text-[10px] text-[#8B8BA7]">{notes.length} ملاحظات</div>
                      </div>
                      <span className="mr-auto">›</span>
                    </button>
                    <button onClick={()=>setTab('docs')} className="flex items-center gap-3 p-3 rounded-[12px] bg-[#EFF6FF] border border-[#DBEAFE] hover:bg-[#DBEAFE] transition text-right">
                      <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center">📝</div>
                      <div>
                        <div className="text-[12px] font-bold">المستندات</div>
                        <div className="text-[10px] text-[#8B8BA7]">{files.length} ملفات</div>
                      </div>
                      <span className="mr-auto">›</span>
                    </button>
                    <button onClick={()=>setTab('library')} className="flex items-center gap-3 p-3 rounded-[12px] bg-[#FDF2F8] border border-[#FCE7F3] hover:bg-[#FCE7F3] transition text-right">
                      <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center">📚</div>
                      <div>
                        <div className="text-[12px] font-bold">مكتبة TeraBox</div>
                        <div className="text-[10px] text-[#8B8BA7]">{teraboxFiles.length} ملفات • 1TB</div>
                      </div>
                      <span className="mr-auto">›</span>
                    </button>
                    <button onClick={()=>setTab('pomo')} className="flex items-center gap-3 p-3 rounded-[12px] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FECACA] transition text-right">
                      <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center">⏱️</div>
                      <div>
                        <div className="text-[12px] font-bold">بومودورو</div>
                        <div className="text-[10px] text-[#8B8BA7]">{Math.floor(pomoTime/60)} دقيقة</div>
                      </div>
                      <span className="mr-auto">›</span>
                    </button>
                  </div>
                </div>

                {/* إحصائياتك */}
                <div className="bg-white rounded-[16px] border border-[#F0ECFF] p-5">
                  <h3 className="font-bold text-[13px] flex items-center gap-2 mb-4">📊 إحصائياتك</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F8F7FF] rounded-[12px] p-3 text-center">
                      <div className="text-[18px]">📚</div>
                      <div className="text-[18px] font-[800] text-[#1E1B4B] mt-1">{notes.length + files.length}</div>
                      <div className="text-[10px] text-[#8B8BA7]">المواد المحفوظة</div>
                    </div>
                    <div className="bg-[#F8F7FF] rounded-[12px] p-3 text-center">
                      <div className="text-[18px]">💬</div>
                      <div className="text-[18px] font-[800] text-[#1E1B4B] mt-1">{msgs.length}</div>
                      <div className="text-[10px] text-[#8B8BA7]">مجموع الرسائل</div>
                    </div>
                    <div className="bg-[#F8F7FF] rounded-[12px] p-3 text-center">
                      <div className="text-[18px]">🎯</div>
                      <div className="text-[18px] font-[800] text-[#1E1B4B] mt-1">90%</div>
                      <div className="text-[10px] text-[#8B8BA7]">نسبة التقدم</div>
                    </div>
                    <div className="bg-[#F8F7FF] rounded-[12px] p-3 text-center">
                      <div className="text-[18px]">☁️</div>
                      <div className="text-[18px] font-[800] text-[#1E1B4B] mt-1">{teraboxFiles.length}</div>
                      <div className="text-[10px] text-[#8B8BA7]">ملفات TeraBox</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-[#F0ECFF] rounded-[12px] flex items-center gap-2">
                    <div className="text-[16px]">💡</div>
                    <div className="text-[11px] leading-5">
                      <b>أنت تسير بشكل رائع!</b><br/>
                      <span className="text-[#6B7280]">استمر في جهودك، فالتفاصيل قادم دائماً.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* النشاط الأخير */}
              <div className="bg-white rounded-[16px] border border-[#F0ECFF] p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[13px]">🕒 النشاط الأخير</h3>
                  <button className="text-[11px] text-[#7C6BFF]">عرض الكل</button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="w-8 h-8 rounded-full bg-[#F5F3FF] flex items-center justify-center">📓</div>
                    <div className="flex-1">
                      <div className="font-medium">تم حفظ ملاحظة في دفتر رفيق</div>
                      <div className="text-[10px] text-[#8B8BA7]">منذ 12 دقيقة</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center">📝</div>
                    <div className="flex-1">
                      <div className="font-medium">تم رفع ملف: ملخص الرياضيات</div>
                      <div className="text-[10px] text-[#8B8BA7]">منذ 25 دقيقة</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="w-8 h-8 rounded-full bg-[#FCE7F3] flex items-center justify-center">📚</div>
                    <div className="flex-1">
                      <div className="font-medium">تم حفظ ملف في TeraBox 1TB</div>
                      <div className="text-[10px] text-[#8B8BA7]">منذ ساعة</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL - الذكاء + اشعارات */}
            <div className="space-y-6">
              {/* تحدث مع رفيق AI */}
              <div className="bg-gradient-to-br from-[#EDE9FF] to-[#F5F3FF] rounded-[20px] border border-[#EDE9FF] p-5 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center text-[24px]">🤖</div>
                <div className="mt-3 font-bold text-[13px]">تحدث مع رفيق AI</div>
                <div className="text-[11px] text-[#6B7280] mt-1 leading-5">أسأل أي شيء عن دروسك أو موضوعات الدراسية</div>
                <button onClick={()=>setTab('ai')} className="mt-4 w-full h-10 rounded-full bg-[#7C6BFF] text-white text-[12px] font-bold hover:bg-[#6B5AE0]">→ بدء المحادثة</button>
              </div>

              {/* آخر الأنشطة - TeraBox + الامجاد */}
              <div className="bg-white rounded-[16px] border border-[#F0ECFF] p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[12px] flex items-center gap-2">🔔 آخر الأنشطة</h3>
                  <button className="text-[10px] text-[#7C6BFF]">عرض الكل</button>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[12px]">☁️</div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold">منصة رفيق AI</div>
                      <div className="text-[10px] text-[#8B8BA7] mt-1">تم إضافة ميزة TeraBox 1TB لحفظ ملفاتك محليا</div>
                      <div className="text-[9px] text-[#9CA3AF] mt-1">منذ 5 دقائق</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[12px]">📚</div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold">مكتبة الامجاد</div>
                      <div className="text-[10px] text-[#8B8BA7] mt-1">تم ربط مكتبة الامجاد - كتب وملازم ليبية</div>
                      <div className="text-[9px] text-[#9CA3AF] mt-1">منذ 5 ساعات</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[12px]">📝</div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold">دفتر رفيق</div>
                      <div className="text-[10px] text-[#8B8BA7] mt-1">تم حفظ {notes.length} ملاحظات جديدة</div>
                      <div className="text-[9px] text-[#9CA3AF] mt-1">منذ 3 ساعات</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FCE7F3] flex items-center justify-center text-[12px]">⏱️</div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold">بومودورو</div>
                      <div className="text-[10px] text-[#8B8BA7] mt-1">موعد الاختبار القادم يوم الإثنين</div>
                      <div className="text-[9px] text-[#9CA3AF] mt-1">منذ ساعات</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABS CONTENT - يظهر عند الضغط */}
          {tab!=='home' && (
            <div className="mt-6 max-w-[1400px] mx-auto">
              {tab==='ai' && (
                <div className="bg-white rounded-[16px] border p-5">
                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                    {msgs.map((m,i)=><div key={i} className={`flex ${m.role==='user'?'justify-start':'justify-end'}`}><div className={`max-w-[80%] rounded-[14px] px-4 py-3 text-[12px] ${m.role==='user'?'bg-black text-white':'bg-[#F9FAFB] border'}`}>{m.text}</div></div>)}
                    <div ref={bottomRef}/>
                  </div>
                  <div className="flex gap-2">
                    <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="اسأل رفيق AI..." className="flex-1 h-11 rounded-full border bg-[#F9FAFB] px-5 text-[12px] outline-none focus:border-[#7C6BFF]" />
                    <button onClick={()=>send()} className="w-11 h-11 rounded-full bg-black text-white">↑</button>
                  </div>
                </div>
              )}
              {tab==='notebook' && (
                <div className="bg-white rounded-[16px] border p-5">
                  <div className="flex justify-between mb-4"><h3 className="font-bold">📓 دفتر رفيق - {notes.length} ملاحظات</h3><button onClick={()=>setNotes([...notes,{id:Date.now(),title:'جديد',content:'',date:new Date().toLocaleDateString()}])} className="text-[11px] bg-black text-white px-3 py-1 rounded-full">+ جديد</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{notes.map(n=><div key={n.id} className="border rounded-[12px] p-3 bg-[#FFFBEB]"><div className="font-bold text-[12px]">{n.title}</div><div className="text-[11px] mt-1 opacity-70">{n.content.slice(0,60)}</div></div>)}</div>
                </div>
              )}
              {tab==='library' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-[16px] p-6 text-white flex justify-between items-center">
                    <div><div className="font-bold">☁️ TeraBox 1TB</div><div className="text-[11px] opacity-80 mt-1">{teraboxFiles.length} ملفات محفوظة محليا</div></div>
                    <label className="bg-white text-black text-[11px] px-4 py-2 rounded-full cursor-pointer font-bold">+ رفع<input type="file" className="hidden" onChange={e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=> setTeraboxFiles([...teraboxFiles,{id:Date.now(),name:f.name,data:r.result}]); r.readAsDataURL(f) }} /></label>
                  </div>
                  <div className="bg-white rounded-[16px] border p-5">
                    <h3 className="font-bold text-[13px] mb-3">📚 مكتبة الامجاد + مكتبة رفيق</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <a href="https://alamjad-ly.com" target="_blank" className="block border rounded-[12px] p-4 bg-[#FFFBEB] hover:shadow-md transition"><div className="font-bold text-[12px]">موقع الامجاد</div><div className="text-[10px] opacity-60 mt-1">كتب ليبية • alamjad-ly.com</div></a>
                      <div className="border rounded-[12px] p-4 bg-[#ECFDF5]"><div className="font-bold text-[12px]">مكتبة رفيق المحلية</div><div className="text-[10px] opacity-60 mt-1">{files.length + teraboxFiles.length} ملفات</div></div>
                    </div>
                  </div>
                </div>
              )}
              {tab==='pomo' && (
                <div className="bg-white rounded-[16px] border p-8 text-center max-w-[400px] mx-auto">
                  <div className="text-[48px] font-[800]">{String(Math.floor(pomoTime/60)).padStart(2,'0')}:{String(pomoTime%60).padStart(2,'0')}</div>
                  <div className="flex justify-center gap-3 mt-6">
                    <button onClick={()=>setPomoRunning(!pomoRunning)} className={`w-14 h-14 rounded-full text-white ${pomoRunning ? 'bg-black' : 'bg-[#7C6BFF]'}`}>{pomoRunning ? '⏸' : '▶️'}</button>
                    <button onClick={()=>{ setPomoRunning(false); setPomoTime(25*60) }} className="w-14 h-14 rounded-full bg-[#F5F3FF]">🔄</button>
                  </div>
                </div>
              )}
              {tab==='docs' && (
                <div className="bg-white rounded-[16px] border p-5">
                  <h3 className="font-bold mb-4">📝 المستندات - {files.length} ملفات</h3>
                  <div className="grid grid-cols-3 gap-3">{files.map(f=><div key={f.id} className="border rounded-[12px] p-3 text-[11px]"><div className="font-bold truncate">{f.name}</div></div>)}</div>
                </div>
              )}
              {tab==='slides' && (
                <div className="bg-white rounded-[16px] border p-5 text-center py-20">
                  <div className="text-[40px]">🎨</div>
                  <div className="font-bold mt-4">العروض التقديمية</div>
                  <div className="text-[11px] opacity-60 mt-2">حول أي درس لعرض تقديمي من AI</div>
                  <button onClick={()=>setTab('ai')} className="mt-4 px-4 py-2 rounded-full bg-black text-white text-[11px]">ابدأ مع AI</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex gap-2 overflow-x-auto z-50">
        {navItems.slice(0,6).map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-4 h-10 rounded-full text-[11px] whitespace-nowrap border font-bold ${tab===t.id?'bg-black text-white':'bg-white'}`}>{t.icon} {t.label}</button>)}
      </div>
    </div>
  )
}