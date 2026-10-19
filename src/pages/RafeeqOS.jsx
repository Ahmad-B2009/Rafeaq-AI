import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RafeeqOS.css'

const APPS = [
  { id: 'ai', title: 'رفيق AI', icon: '✦', color: '#7968f6', tab: 'ai', hint: 'مساعدك الدراسي' },
  { id: 'board', title: 'سبورة رفيق', icon: '▱', color: '#8b78ee', tab: 'board', hint: 'شرح ورسم على سبورة كاملة' },
  { id: 'notebook', title: 'دفتر رفيق', icon: '▤', color: '#16a6b6', tab: 'notebook', hint: 'مصادرك وملاحظاتك' },
  { id: 'books', title: 'مكتبة رفيق', icon: '▥', color: '#e9a23b', tab: 'books', hint: 'الكتب والدروس' },
  { id: 'notes', title: 'ملاحظاتي', icon: '▧', color: '#dd7d9d', tab: 'notes', hint: 'ملاحظاتك المحفوظة' },
  { id: 'achievement', title: 'الإنجاز', icon: '▦', color: '#438b76', tab: 'achievement', hint: 'مساحة عملك ومشاريعك مثل Notion' },
  { id: 'timer', title: 'مؤقت الدراسة', icon: '◷', color: '#3caa80', tab: 'timer', hint: 'جلسات التركيز' },
]
const WALLS = {
  aurora: 'radial-gradient(ellipse at 12% 18%,#d8f7ff 0,transparent 36%),radial-gradient(ellipse at 82% 12%,#e8ddff 0,transparent 35%),radial-gradient(ellipse at 72% 86%,#d8f2ff 0,transparent 40%),linear-gradient(135deg,#fffefa,#f5f1ff 52%,#eefaff)',
  violet: 'radial-gradient(ellipse at 80% 12%,#e9ddff 0,transparent 38%),radial-gradient(ellipse at 15% 85%,#d8d0ff 0,transparent 42%),linear-gradient(135deg,#fffdfb,#f1edff 55%,#f7f5ff)',
  sky: 'radial-gradient(ellipse at 15% 20%,#d4f7ff 0,transparent 38%),radial-gradient(ellipse at 85% 80%,#cfeeff 0,transparent 40%),linear-gradient(135deg,#fbffff,#edfaff 55%,#f2f3ff)'
}
const defaults = { wallpaper: 'aurora', accent: '#7567f8', icons: true }
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const clock = d => new Intl.DateTimeFormat('ar-LY',{hour:'2-digit',minute:'2-digit'}).format(d)
const fullDate = d => new Intl.DateTimeFormat('ar-LY',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)

function readPages() {
  const stored = read('rafeaq_achievement_pages', null)
  return Array.isArray(stored) && stored.length ? stored : [
    { id: 'welcome', title: 'مساحة العمل', icon: '✦', body: 'أهلًا بك في الإنجاز.\n\nحوّل أفكارك إلى صفحات ومشاريع وخطط واضحة.\n\n## ابدأ من هنا\n- اكتب ملاحظاتك وأفكارك\n- خطط لمشروعك القادم\n- اجمع مهامك في مكان واحد', tasks: [] }
  ]
}

function AchievementWorkspace() {
  const [pages, setPages] = useState(readPages)
  const [selected, setSelected] = useState(() => readPages()[0]?.id || 'welcome')
  const [search, setSearch] = useState('')
  const [showTasks, setShowTasks] = useState(false)
  const [newTask, setNewTask] = useState('')
  const page = pages.find(p => p.id === selected) || pages[0]
  useEffect(() => { localStorage.setItem('rafeaq_achievement_pages', JSON.stringify(pages)) }, [pages])
  useEffect(() => { if (!pages.some(p => p.id === selected) && pages[0]) setSelected(pages[0].id) }, [pages, selected])
  const updatePage = patch => setPages(list => list.map(p => p.id === selected ? { ...p, ...patch } : p))
  const createPage = () => {
    const p = { id: 'page-' + Date.now(), title: 'صفحة جديدة', icon: '📄', body: '', tasks: [] }
    setPages(list => [...list, p]); setSelected(p.id)
  }
  const addTask = () => {
    if (!newTask.trim() || !page) return
    updatePage({ tasks: [...(page.tasks || []), { id: 'task-' + Date.now(), text: newTask.trim(), done: false }] })
    setNewTask('')
  }
  const filteredPages = pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
  if (!page) return null
  return <div className="os-achievement" dir="rtl">
    <aside className="os-ach-sidebar">
      <div className="os-ach-workspace"><span>✦</span><div><b>الإنجاز</b><small>مساحة عملك الشخصية</small></div></div>
      <label className="os-ach-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث في صفحاتك"/></label>
      <div className="os-ach-nav-label">مساحة العمل</div>
      <button className={'os-ach-nav '+(!showTasks?'active':'')} onClick={()=>setShowTasks(false)}>▤ <span>كل الصفحات</span></button>
      <button className={'os-ach-nav '+(showTasks?'active':'')} onClick={()=>setShowTasks(true)}>☑ <span>المهام</span><small>{pages.reduce((n,p)=>n+(p.tasks||[]).filter(t=>!t.done).length,0)}</small></button>
      <div className="os-ach-pages-heading"><span>صفحاتك</span><button onClick={createPage} title="إنشاء صفحة">＋</button></div>
      <div className="os-ach-page-list">{filteredPages.map(p=><button key={p.id} className={p.id===selected?'active':''} onClick={()=>{setSelected(p.id);setShowTasks(false)}}><span>{p.icon||'📄'}</span><span className="os-ach-page-title">{p.title||'بدون عنوان'}</span></button>)}</div>
      <button className="os-ach-add-page" onClick={createPage}>＋ صفحة جديدة</button>
      <div className="os-ach-sidebar-foot">محفوظ على هذا الجهاز · نسخة أولية</div>
    </aside>
    <main className="os-ach-main">
      <div className="os-ach-breadcrumb"><span>الإنجاز</span><span>›</span><span>{showTasks?'المهام':page.title||'صفحة بدون عنوان'}</span><span className="os-ach-saved">● محفوظ تلقائيًا</span></div>
      {showTasks ? <section className="os-ach-task-view">
        <div className="os-ach-emoji">☑</div><h1>مهامي</h1><p>كل مهام صفحاتك في مكان واحد.</p>
        {pages.map(p=>(p.tasks||[]).length>0&&<div className="os-ach-task-group" key={p.id}><h3>{p.icon} {p.title}</h3>{p.tasks.map(t=><label className={'os-ach-task '+(t.done?'done':'')} key={t.id}><input type="checkbox" checked={t.done} onChange={e=>setPages(list=>list.map(x=>x.id===p.id?{...x,tasks:x.tasks.map(z=>z.id===t.id?{...z,done:e.target.checked}:z)}:x))}/><span>{t.text}</span></label>)}</div>)}
        {!pages.some(p=>(p.tasks||[]).length)>0&&<p className="os-ach-empty">لا توجد مهام بعد. أضف مهامك داخل أي صفحة.</p>}
      </section> : <article className="os-ach-editor">
        <div className="os-ach-emoji"> {page.icon||'📄'} </div>
        <input className="os-ach-title" value={page.title} onChange={e=>updatePage({title:e.target.value})} placeholder="بدون عنوان"/>
        <div className="os-ach-subtitle">صفحتك الخاصة — اكتب، خطط، واجمع أفكارك في مكان واحد.</div>
        <textarea className="os-ach-body" value={page.body||''} onChange={e=>updatePage({body:e.target.value})} placeholder={'ابدأ الكتابة...\n\nيمكنك استخدام هذه المساحة للملاحظات والخطط والأفكار.'}/>
        <section className="os-ach-inline-tasks"><div className="os-ach-inline-heading"><div><b>المهام</b><small>خطواتك القادمة لهذه الصفحة</small></div><span>{(page.tasks||[]).filter(t=>t.done).length}/{(page.tasks||[]).length}</span></div>
          {(page.tasks||[]).map(t=><div className={'os-ach-task '+(t.done?'done':'')} key={t.id}><input type="checkbox" checked={t.done} onChange={e=>updatePage({tasks:page.tasks.map(z=>z.id===t.id?{...z,done:e.target.checked}:z)})}/><span>{t.text}</span><button title="حذف المهمة" onClick={()=>updatePage({tasks:page.tasks.filter(z=>z.id!==t.id)})}>×</button></div>)}
          <form className="os-ach-new-task" onSubmit={e=>{e.preventDefault();addTask()}}><span>＋</span><input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="أضف مهمة جديدة..." /><button type="submit">إضافة</button></form>
        </section>
        <div className="os-ach-page-actions"><button onClick={()=>{if(window.confirm('هل تريد حذف هذه الصفحة؟')){setPages(list=>list.filter(p=>p.id!==selected));setShowTasks(false)}}}>حذف الصفحة</button><small>التغييرات تُحفظ تلقائيًا على هذا الجهاز</small></div>
      </article>}
    </main>
  </div>
}

export default function RafeeqOS() {
  const navigate = useNavigate()
  const [now,setNow] = useState(new Date())
  const [settings,setSettings] = useState(() => ({...defaults,...read('rafeaq_os_settings',{})}))
  const [windows,setWindows] = useState([])
  const [active,setActive] = useState(null)
  const [start,setStart] = useState(false)
  const [query,setQuery] = useState('')
  const [notifications,setNotifications] = useState(() => read('rafeaq_os_notifications',[{id:'welcome',title:'مرحبًا بك في رفيق OS',body:'هذه أول تجربة لسطح المكتب الجديد.',time:Date.now(),read:false}]))
  const [history,setHistory] = useState(() => read('rafeaq_os_history',[]))
  const [panel,setPanel] = useState('')
  const [mobile,setMobile] = useState(() => matchMedia('(max-width:720px)').matches)
  const drag = useRef(null)
  const iconDrag = useRef(null)
  const [iconPositions, setIconPositions] = useState(() => read('rafeaq_os_icon_positions', {}))
  useEffect(() => { const t=setInterval(()=>setNow(new Date()),1000); const m=matchMedia('(max-width:720px)'); const f=()=>setMobile(m.matches); m.addEventListener?.('change',f); return ()=>{clearInterval(t);m.removeEventListener?.('change',f)} },[])
  useEffect(() => localStorage.setItem('rafeaq_os_settings',JSON.stringify(settings)),[settings])
  useEffect(() => localStorage.setItem('rafeaq_os_icon_positions',JSON.stringify(iconPositions)),[iconPositions])
  useEffect(() => localStorage.setItem('rafeaq_os_notifications',JSON.stringify(notifications)),[notifications])
  useEffect(() => localStorage.setItem('rafeaq_os_history',JSON.stringify(history.slice(0,80))),[history])
  useEffect(() => { const onBoardExit = e => { if (e.data?.type === 'rafeeq-board-exit') close('board') }; window.addEventListener('message', onBoardExit); return () => window.removeEventListener('message', onBoardExit) }, [])
  useEffect(() => {
    const move=e=>{if(iconDrag.current){const d=iconDrag.current;setIconPositions(pos=>({...pos,[d.id]:{x:Math.max(0,Math.min(innerWidth-100,d.x+e.clientX-d.px)),y:Math.max(75,Math.min(innerHeight-145,d.y+e.clientY-d.py))}}));return}if(!drag.current)return;const d=drag.current;setWindows(ws=>ws.map(w=>w.id===d.id?{...w,x:Math.max(0,Math.min(innerWidth-260,d.x+e.clientX-d.px)),y:Math.max(0,Math.min(innerHeight-90,d.y+e.clientY-d.py))}:w))}
    const up=()=>{iconDrag.current=null;drag.current=null};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)}
  },[])
  const filtered=useMemo(()=>APPS.filter(a=>(a.title+' '+a.hint).toLowerCase().includes(query.toLowerCase().trim())),[query])
  const unread=notifications.filter(n=>!n.read).length
  function log(title,kind='فتح تطبيق'){setHistory(h=>[{id:Date.now()+Math.random(),title,kind,time:Date.now()},...h].slice(0,80))}
  function launch(app){
    const a=APPS.find(x=>x.id===(app.id||app));if(!a)return
    setWindows(ws=>{if(ws.some(w=>w.id===a.id))return ws;const o=(ws.length%4)*24;return [...ws,{...a,x:mobile?0:115+o,y:mobile?0:72+o,width:Math.min(940,Math.max(560,innerWidth-290)),height:Math.min(680,Math.max(400,innerHeight-145)),min:false,max:false,prev:null}]})
    setWindows(ws=>ws.map(w=>w.id===a.id?{...w,min:false}:w));setActive(a.id);setStart(false);setQuery('');setPanel('');log(a.title)
  }
  function close(id){setWindows(ws=>ws.filter(w=>w.id!==id));if(active===id)setActive(null)}
  function minimize(id){setWindows(ws=>ws.map(w=>w.id===id?{...w,min:true}:w));if(active===id)setActive(null)}
  function toggleMaximize(id){setWindows(ws=>ws.map(w=>{if(w.id!==id)return w;if(w.max)return {...w,...(w.prev||{}),max:false,prev:null};return {...w,prev:{x:w.x,y:w.y,width:w.width,height:w.height},x:0,y:0,width:innerWidth,height:innerHeight-64,max:true,min:false}}));setActive(id)}
  function beginDrag(e,w){if(mobile||e.button!==0)return;drag.current={id:w.id,px:e.clientX,py:e.clientY,x:w.x,y:w.y};setActive(w.id);e.preventDefault()}
  const background=WALLS[settings.wallpaper]||WALLS.aurora
  return <div className="rafeeq-os" dir="rtl" style={{backgroundImage:background,'--os-accent':settings.accent}}>
    <div className="os-desktop">
      <div className="os-top">
        <div className="os-brand"><span className="os-logo">ر</span><div><b>رفيق OS</b><small>مساحة تعلم واحدة</small></div></div>
        <div className="os-big-clock"><b>{clock(now)}</b><span>{fullDate(now)}</span></div>
      </div>
      {!mobile&&settings.icons&&<div className="os-desktop-icons">{APPS.map((a,i)=>{const p=iconPositions[a.id]||{x:innerWidth-120,y:118+i*88};return <button key={a.id} style={{left:p.x,top:p.y}} onDoubleClick={()=>launch(a)} onClick={()=>{}} onPointerDown={e=>{if(e.button!==0)return;iconDrag.current={id:a.id,px:e.clientX,py:e.clientY,x:p.x,y:p.y};e.currentTarget.setPointerCapture?.(e.pointerId);e.preventDefault()}} title="اسحب الأيقونة لتحريكها، وانقر مرتين لفتحها"><span style={{background:a.color}}>{a.icon}</span><b>{a.title}</b></button>})}<button className="os-desktop-settings-icon" style={{left:innerWidth-120,top:118+APPS.length*88}} onDoubleClick={()=>setPanel('settings')} onPointerDown={e=>{if(e.button!==0)return;iconDrag.current={id:'settings',px:e.clientX,py:e.clientY,x:innerWidth-120,y:118+APPS.length*88};e.currentTarget.setPointerCapture?.(e.pointerId);e.preventDefault()}}><span className="os-gear">⚙</span><b>الإعدادات</b></button></div>}
      {windows.map(w=>!w.min&&<section key={w.id} className={'os-window '+(w.id==='board'?'os-board-window ':'')+(active===w.id?'active':'')} style={{left:mobile?0:w.x,top:mobile?0:w.y,width:mobile?'100%':w.width,height:mobile?'calc(100% - 64px)':w.height,zIndex:active===w.id?30:20}} onPointerDown={()=>setActive(w.id)}>
        {w.id!=='board'&&<header className="os-window-bar" onPointerDown={e=>beginDrag(e,w)}><div className="os-window-label"><span style={{background:w.color}}>{w.icon}</span><b>{w.title}</b></div><div className="os-controls"><button onPointerDown={e=>e.stopPropagation()} onClick={()=>minimize(w.id)} aria-label="تصغير" title="تصغير">−</button><button onPointerDown={e=>e.stopPropagation()} onClick={()=>toggleMaximize(w.id)} aria-label={w.max?'استعادة الحجم':'ملء الشاشة'} title={w.max?'استعادة الحجم':'ملء الشاشة'}>{w.max?'❐':'□'}</button><button className="close" onPointerDown={e=>e.stopPropagation()} onClick={()=>close(w.id)} aria-label="إغلاق" title="إغلاق">×</button></div></header>}
        {w.id==='achievement'?<AchievementWorkspace/>:<iframe title={w.title} className="os-frame" src={'/workspace?tab='+w.tab+'&embedded=1'}/>}
      </section>)}
      {start&&<section className="os-start"><div className="os-start-heading"><span className="os-logo">ر</span><div><b>رفيق OS</b><small>ماذا تريد أن تتعلم اليوم؟</small></div></div><label className="os-search"><span>⌕</span><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن تطبيق..."/></label><small className="os-section-label">التطبيقات</small><div className="os-app-list">{filtered.map(a=><button key={a.id} onClick={()=>launch(a)}><span style={{background:a.color}}>{a.icon}</span><b>{a.title}</b><small>{a.hint}</small></button>)}</div>{!filtered.length&&<p className="os-empty">لا توجد تطبيقات بهذا الاسم.</p>}<footer><span>رفيق OS · نسخة تجريبية</span><button onClick={()=>{setStart(false);setPanel('settings')}}>⚙ الإعدادات</button></footer></section>}
      {panel==='notifications'&&<aside className="os-panel"><div className="os-panel-heading"><div><b>مركز الإشعارات</b><small>{unread?unread+' غير مقروء':'كل شيء محدّث'}</small></div><button onClick={()=>setPanel('')}>×</button></div>{notifications.slice().reverse().map(n=><article className={'os-notice '+(!n.read?'unread':'')} key={n.id}><span>✦</span><div><b>{n.title}</b><p>{n.body}</p><small>{clock(new Date(n.time))}</small></div></article>)}<button className="os-panel-action" onClick={()=>setNotifications(ns=>ns.map(n=>({...n,read:true})))}>تحديد الكل كمقروء</button></aside>}
      {panel==='history'&&<aside className="os-panel"><div className="os-panel-heading"><div><b>سجل النشاط</b><small>يُحفظ على هذا الجهاز</small></div><button onClick={()=>setPanel('')}>×</button></div>{history.length?history.map(h=><article className="os-history-item" key={h.id}><b>{h.title}</b><small>{h.kind} · {new Intl.DateTimeFormat('ar-LY',{dateStyle:'short',timeStyle:'short'}).format(new Date(h.time))}</small></article>):<p className="os-empty">لا يوجد نشاط مسجل بعد.</p>}<button className="os-panel-action danger" onClick={()=>{setHistory([]);log('مسح سجل النشاط','الخصوصية')}}>مسح سجل النشاط</button></aside>}
      {panel==='settings'&&<div className="os-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)setPanel('')}}><section className="os-settings"><div className="os-panel-heading"><div><b>إعدادات رفيق OS</b><small>خصص مساحة التعلم</small></div><button onClick={()=>setPanel('')}>×</button></div><div className="os-setting"><b>الخلفية</b><div className="os-wall-options">{Object.keys(WALLS).map((k,i)=><button key={k} className={settings.wallpaper===k?'chosen':''} style={{backgroundImage:WALLS[k]}} onClick={()=>setSettings(s=>({...s,wallpaper:k}))}>{['الشفق','بنفسجي','سماء'][i]}</button>)}</div></div><div className="os-setting"><b>لون النظام</b><div className="os-colors">{['#7567f8','#14a6b7','#e39a36','#d96d9a','#3caa80'].map(c=><button key={c} className={settings.accent===c?'chosen':''} style={{background:c}} onClick={()=>setSettings(s=>({...s,accent:c}))}/>)}</div></div><label className="os-toggle"><span><b>أيقونات سطح المكتب</b><small>إظهار اختصارات التطبيقات</small></span><input type="checkbox" checked={settings.icons} onChange={e=>setSettings(s=>({...s,icons:e.target.checked}))}/></label><p className="os-settings-note">التفضيلات وسجل النشاط محفوظة محليًا في هذا المتصفح. المزامنة بين الأجهزة غير مفعلة في النموذج الأولي.</p><button className="os-primary" onClick={()=>{setPanel('');log('تحديث إعدادات النظام','إعدادات')}}>حفظ الإعدادات</button></section></div>}
    </div>
    <footer className="os-taskbar"><button className={'os-start-button '+(start?'selected':'')} onClick={()=>{setStart(s=>!s);setPanel('')}}><span className="os-logo">ر</span><b>ابدأ</b></button><div className="os-task-apps">{windows.map(w=><button key={w.id} className={active===w.id?'selected':''} onClick={()=>{if(w.min) setWindows(ws=>ws.map(x=>x.id===w.id?{...x,min:false}:x));setActive(w.id)}}><span style={{background:w.color}}>{w.icon}</span><b>{w.title}</b></button>)}</div><div className="os-tray"><button title="سجل النشاط" onClick={()=>{setPanel('history');setStart(false)}}>◷</button><button title="الإشعارات" onClick={()=>{setPanel('notifications');setStart(false)}}>♧{unread>0&&<i>{unread}</i>}</button><button title="الإعدادات" onClick={()=>{setPanel('settings');setStart(false)}}>⚙</button><div className="os-tray-clock"><b>{clock(now)}</b><small>{new Intl.DateTimeFormat('ar-LY',{day:'2-digit',month:'2-digit',year:'numeric'}).format(now)}</small></div><button title="تسجيل الخروج" onClick={()=>{localStorage.removeItem('rafeaq_token');sessionStorage.setItem('just_logged_out','1');navigate('/login')}}>⇥</button></div></footer>
      {mobile&&<div className="os-mobile-apps"><b>تطبيقات رفيق</b><div>{APPS.map(a=><button key={a.id} onClick={()=>launch(a)}><span style={{background:a.color}}>{a.icon}</span><b>{a.title}</b></button>)}</div></div>}
  </div>
}
