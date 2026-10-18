import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RafeeqOS.css'

const APPS = [
  { id: 'ai', title: 'رفيق AI', icon: '✦', color: '#7968f6', tab: 'ai', hint: 'مساعدك الدراسي' },
  { id: 'notebook', title: 'دفتر رفيق', icon: '▤', color: '#16a6b6', tab: 'notebook', hint: 'مصادرك وملاحظاتك' },
  { id: 'books', title: 'مكتبة رفيق', icon: '▥', color: '#e9a23b', tab: 'books', hint: 'الكتب والدروس' },
  { id: 'notes', title: 'ملاحظاتي', icon: '▧', color: '#dd7d9d', tab: 'notes', hint: 'ملاحظاتك المحفوظة' },
  { id: 'timer', title: 'مؤقت الدراسة', icon: '◷', color: '#3caa80', tab: 'timer', hint: 'جلسات التركيز' },
]
const WALLS = {
  aurora: 'radial-gradient(ellipse at 18% 18%,#42d0e688,transparent 32%),radial-gradient(ellipse at 82% 14%,#af71ffbb,transparent 34%),radial-gradient(ellipse at 70% 86%,#387eeebb,transparent 38%),linear-gradient(135deg,#101e49,#263a75 52%,#171d46)',
  violet: 'radial-gradient(ellipse at 80% 12%,#e1beffaa,transparent 34%),radial-gradient(ellipse at 15% 85%,#6f66facc,transparent 40%),linear-gradient(135deg,#24134d,#4b3c92 55%,#18264f)',
  sky: 'radial-gradient(ellipse at 15% 20%,#94ebffcc,transparent 36%),radial-gradient(ellipse at 85% 80%,#68b1ffcc,transparent 38%),linear-gradient(135deg,#123b64,#287db0 55%,#19365c)'
}
const defaults = { wallpaper: 'aurora', accent: '#7567f8', icons: true }
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const clock = d => new Intl.DateTimeFormat('ar-LY',{hour:'2-digit',minute:'2-digit'}).format(d)
const fullDate = d => new Intl.DateTimeFormat('ar-LY',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)

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
  useEffect(() => { const t=setInterval(()=>setNow(new Date()),1000); const m=matchMedia('(max-width:720px)'); const f=()=>setMobile(m.matches); m.addEventListener?.('change',f); return ()=>{clearInterval(t);m.removeEventListener?.('change',f)} },[])
  useEffect(() => localStorage.setItem('rafeaq_os_settings',JSON.stringify(settings)),[settings])
  useEffect(() => localStorage.setItem('rafeaq_os_notifications',JSON.stringify(notifications)),[notifications])
  useEffect(() => localStorage.setItem('rafeaq_os_history',JSON.stringify(history.slice(0,80))),[history])
  useEffect(() => {
    const move=e=>{if(!drag.current)return;const d=drag.current;setWindows(ws=>ws.map(w=>w.id===d.id?{...w,x:Math.max(0,Math.min(innerWidth-260,d.x+e.clientX-d.px)),y:Math.max(0,Math.min(innerHeight-90,d.y+e.clientY-d.py))}:w))}
    const up=()=>{drag.current=null};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)}
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
      {!mobile&&settings.icons&&<div className="os-desktop-icons">{APPS.map(a=><button key={a.id} onClick={()=>launch(a)}><span style={{background:a.color}}>{a.icon}</span><b>{a.title}</b></button>)}<button onClick={()=>setPanel('settings')}><span className="os-gear">⚙</span><b>الإعدادات</b></button></div>}
      {windows.map(w=>!w.min&&<section key={w.id} className={'os-window '+(active===w.id?'active':'')} style={{left:mobile?0:w.x,top:mobile?0:w.y,width:mobile?'100%':w.width,height:mobile?'calc(100% - 64px)':w.height,zIndex:active===w.id?30:20}} onPointerDown={()=>setActive(w.id)}>
        <header className="os-window-bar" onPointerDown={e=>beginDrag(e,w)}><div className="os-window-label"><span style={{background:w.color}}>{w.icon}</span><b>{w.title}</b></div><div className="os-controls"><button onPointerDown={e=>e.stopPropagation()} onClick={()=>minimize(w.id)} aria-label="تصغير" title="تصغير">−</button><button onPointerDown={e=>e.stopPropagation()} onClick={()=>toggleMaximize(w.id)} aria-label={w.max?'استعادة الحجم':'ملء الشاشة'} title={w.max?'استعادة الحجم':'ملء الشاشة'}>{w.max?'❐':'□'}</button><button className="close" onPointerDown={e=>e.stopPropagation()} onClick={()=>close(w.id)} aria-label="إغلاق" title="إغلاق">×</button></div></header>
        <iframe title={w.title} className="os-frame" src={'/workspace?tab='+w.tab+'&embedded=1'}/>
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
