import { useEffect, useRef, useState } from 'react'
import './RafeeqBoard.css'

const COLORS = ['#25243a', '#e34b5f', '#3478e5', '#16a779', '#8b5cf6', '#f59e0b']
const LESSON = [
  { title: 'أهلًا! أنا أستاذ رفيق', body: 'هذه سبورة رفيق التجريبية. أستطيع عرض شرح صوتي تجريبي والرسم على السبورة أثناء الشرح. اكتب موضوعًا أو اختر درسًا للبدء.', draw: 'welcome' },
  { title: 'مثال: كيف تعمل الدورة المائية؟', body: 'تسخّن الشمس الماء فيتبخر ويصعد إلى السماء. ثم يبرد بخار الماء ويتكاثف مكوّنًا السحب. وعندما تكبر قطرات الماء تهطل أمطارًا، وتعود المياه إلى الأرض لتبدأ الدورة من جديد.', draw: 'water' },
  { title: 'مثال رياضيات: حل معادلة بسيطة', body: 'لنحل المعادلة: اثنان في س زائد أربعة يساوي عشرة. نطرح أربعة من الطرفين، فتصبح اثنان س تساوي ستة. نقسم الطرفين على اثنين، فنجد أن س تساوي ثلاثة.', draw: 'math' },
]
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

export default function RafeeqBoard() {
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(4)
  const [items, setItems] = useState([])
  const [draft, setDraft] = useState(null)
  const [lesson, setLesson] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [caption, setCaption] = useState('اختر درسًا تجريبيًا أو ابدأ الرسم بنفسك.')
  const [topic, setTopic] = useState('')
  const svgRef = useRef(null)
  const points = useRef([])
  const savedItems = useRef([])

  useEffect(() => {
    const onEnd = () => setSpeaking(false)
    if ('speechSynthesis' in window) window.speechSynthesis.addEventListener?.('end', onEnd)
    return () => {
      window.speechSynthesis?.cancel()
      window.speechSynthesis?.removeEventListener?.('end', onEnd)
    }
  }, [])

  function pointFromEvent(e) {
    const rect = svgRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  function startDraw(e) {
    if (tool === 'text') {
      const text = window.prompt('اكتب النص الذي تريد إضافته إلى السبورة:')
      if (text?.trim()) setItems(v => [...v, { id: makeId(), type: 'text', x: pointFromEvent(e).x, y: pointFromEvent(e).y, text: text.trim(), color, size: Math.max(16, size * 4) }])
      return
    }
    if (!['pen', 'highlighter', 'eraser', 'line', 'rect', 'circle'].includes(tool)) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const p = pointFromEvent(e)
    points.current = [p]
    savedItems.current = items
    setDraft({ id: makeId(), type: tool, points: [p], color: tool === 'eraser' ? '#ffffff' : color, size: tool === 'highlighter' ? size * 4 : size })
  }
  function moveDraw(e) {
    if (!draft) return
    const p = pointFromEvent(e)
    const next = [...points.current, p]
    points.current = next
    setDraft(d => ({ ...d, points: next }))
  }
  function endDraw() {
    if (!draft) return
    setItems(v => [...v, draft])
    setDraft(null)
    points.current = []
  }
  function itemShape(item, isDraft = false) {
    const p = item.points || []
    const first = p[0] || { x: 0, y: 0 }
    const last = p[p.length - 1] || first
    const common = { stroke: item.color, strokeWidth: item.size, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none', opacity: item.type === 'highlighter' ? .32 : 1, key: item.id }
    if (item.type === 'text') return <text key={item.id} x={item.x} y={item.y} fill={item.color} fontSize={item.size} fontWeight="600">{item.text}</text>
    if (item.type === 'rect') return <rect {...common} x={Math.min(first.x,last.x)} y={Math.min(first.y,last.y)} width={Math.abs(last.x-first.x)} height={Math.abs(last.y-first.y)} />
    if (item.type === 'circle') return <ellipse {...common} cx={(first.x+last.x)/2} cy={(first.y+last.y)/2} rx={Math.abs(last.x-first.x)/2} ry={Math.abs(last.y-first.y)/2} />
    if (item.type === 'line') return <line {...common} x1={first.x} y1={first.y} x2={last.x} y2={last.y} />
    return <polyline {...common} points={p.map(q => `${q.x},${q.y}`).join(' ')} />
  }
  function undo() { setItems(v => v.slice(0, -1)) }
  function clearBoard() { if (items.length && window.confirm('هل تريد مسح كل ما على السبورة؟')) setItems([]) }

  function drawLesson(kind) {
    const w = svgRef.current?.clientWidth || 900
    const h = svgRef.current?.clientHeight || 560
    const addText = (x,y,text,c='#34304c',s=23) => ({ id: makeId(), type:'text', x, y, text, color:c, size:s })
    const line = (x1,y1,x2,y2,c='#8b78ee',s=3) => ({ id:makeId(),type:'line',points:[{x:x1,y:y1},{x:x2,y:y2}],color:c,size:s })
    const rect = (x1,y1,x2,y2,c='#cfc6ff') => ({id:makeId(),type:'rect',points:[{x:x1,y:y1},{x:x2,y:y2}],color:c,size:2})
    const circle = (x1,y1,x2,y2,c='#65c8db') => ({id:makeId(),type:'circle',points:[{x:x1,y:y1},{x:x2,y:y2}],color:c,size:3})
    let newItems = []
    if (kind === 'water') {
      const cx = w/2
      newItems = [
        addText(cx-115,70,'الدورة المائية', '#6f5ce7',28),
        circle(cx-58,105,cx+58,221,'#f5b544'), addText(cx-27,171,'الشمس','#b77916',16),
        rect(cx-135,270,cx+135,332,'#83d3ec'), addText(cx-44,308,'البحر','#277f9e',18),
        line(cx-70,250,cx-130,205,'#3b9de8',4), line(cx,250,cx,215,'#3b9de8',4), line(cx+70,250,cx+130,205,'#3b9de8',4),
        addText(cx-105,248,'تبخر','#3b80c8',17), addText(cx+140,235,'سحب ثم أمطار','#3989b5',17),
        circle(cx+145,142,cx+300,198,'#a9d9f2'), circle(cx+220,126,cx+338,188,'#a9d9f2'),
        line(cx+230,205,cx+210,246,'#328de0',3), line(cx+260,205,cx+260,246,'#328de0',3), line(cx+290,205,cx+310,246,'#328de0',3),
        addText(cx-170,h-65,'تبخر  ←  تكاثف  ←  هطول  ←  تجمّع','#4f4a6d',19),
      ]
    } else if (kind === 'math') {
      newItems = [
        addText(w/2-160,85,'حل المعادلة خطوة بخطوة','#6f5ce7',25),
        addText(w/2-135,165,'2س + 4 = 10','#34304c',34),
        addText(w/2-135,230,'2س = 10 − 4 = 6','#3478e5',29),
        addText(w/2-135,295,'س = 6 ÷ 2','#16a779',29),
        rect(w/2-150,325,w/2+160,395,'#b9eedc'),
        addText(w/2-74,370,'س = 3','#12835f',35),
      ]
    } else {
      newItems = [addText(w/2-100,100,'أهلًا بك في سبورة رفيق','#6f5ce7',27), addText(w/2-150,160,'ابدأ بالرسم أو اختر شرحًا تجريبيًا.','#55516d',18)]
    }
    setItems(v => [...v, ...newItems])
  }
  function teach() {
    if (speaking) { window.speechSynthesis?.cancel(); setSpeaking(false); return }
    const chosen = LESSON[lesson]
    const speech = topic.trim() ? `سنبدأ شرحًا تجريبيًا عن ${topic.trim()}. هذه نسخة عرض للسبورة؛ لم يتم ربط نموذج ذكاء اصطناعي بعد. يمكننا كتابة الأفكار الأساسية على السبورة ثم مراجعتها خطوة بخطوة.` : chosen.body
    setCaption(speech)
    drawLesson(topic.trim() ? 'welcome' : chosen.draw)
    if (!('speechSynthesis' in window)) { setCaption('المتصفح لا يدعم النطق الصوتي. يمكنك متابعة الشرح المكتوب.'); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(speech)
    utterance.lang = 'ar'
    utterance.rate = .92
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  return <main className={`rf-board ${speaking ? 'is-speaking' : ''}`} dir="rtl">
    <div className="rf-board-glow" aria-hidden="true"><i/><i/><i/><i/></div>
    <header className="rf-board-top">
      <div className="rf-board-brand"><span className="rf-board-mark">ر</span><div><strong>سبورة رفيق</strong><small>مساحة شرح ورسم تفاعلية</small></div></div>
      <div className="rf-board-status"><span className={speaking ? 'rf-speaking-dot live' : 'rf-speaking-dot'}/>{speaking ? 'الأستاذ يشرح الآن' : 'السبورة جاهزة'}</div>
      <div className="rf-board-top-actions">
        <button onClick={() => { setLesson((lesson + 1) % LESSON.length); setCaption(LESSON[(lesson + 1) % LESSON.length].body) }}>درس آخر ↻</button>
        <button className="rf-board-exit" onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); window.history.back() }}>رجوع</button>
      </div>
    </header>
    <section className="rf-board-stage">
      <svg ref={svgRef} className="rf-board-canvas" onPointerDown={startDraw} onPointerMove={moveDraw} onPointerUp={endDraw} onPointerCancel={endDraw} role="application" aria-label="مساحة الرسم على السبورة">
        {items.map(item => itemShape(item))}
        {draft && itemShape(draft, true)}
      </svg>
      {!items.length && <div className="rf-board-empty"><span>✎</span><strong>مساحة السبورة</strong><p>ارسم مباشرة هنا، أو اطلب من الأستاذ عرض شرح تجريبي.</p></div>}
      <div className="rf-board-lesson-card"><div className="rf-board-lesson-eyebrow">الأستاذ الذكي · وضع تجريبي</div><strong>{LESSON[lesson].title}</strong><p>{caption}</p></div>
    </section>
    <footer className="rf-board-dock">
      <div className="rf-board-tools" aria-label="أدوات السبورة">
        {[['pen','✎','قلم'],['highlighter','▰','تمييز'],['eraser','◩','ممحاة'],['line','／','خط'],['rect','▱','مستطيل'],['circle','◯','دائرة'],['text','T','نص']].map(([id,icon,label]) => <button key={id} className={tool===id?'chosen':''} onClick={() => setTool(id)} title={label}><span>{icon}</span><small>{label}</small></button>)}
      </div>
      <div className="rf-board-colors">{COLORS.map(c=><button key={c} className={color===c?'chosen':''} style={{'--swatch':c}} onClick={()=>{setColor(c);if(tool==='eraser')setTool('pen')}} aria-label={'لون '+c}/>)}</div>
      <label className="rf-board-size">السُمك <input type="range" min="2" max="12" value={size} onChange={e=>setSize(Number(e.target.value))}/><b>{size}</b></label>
      <div className="rf-board-actions"><button onClick={undo} disabled={!items.length} title="تراجع">↶</button><button onClick={clearBoard} disabled={!items.length} title="مسح السبورة">⌫</button><button className="rf-board-teach" onClick={teach}>{speaking?'■ إيقاف الشرح':'◖ تشغيل الأستاذ'}</button></div>
    </footer>
    <div className="rf-board-mobile-topic"><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="موضوع الشرح (عرض تجريبي)"/><button onClick={teach}>اشرح</button></div>
    <div className="rf-board-footnote">نسخة تجربة مستقلة · الصوت من المتصفح · نموذج الذكاء الاصطناعي غير مربوط بعد</div>
  </main>
}
