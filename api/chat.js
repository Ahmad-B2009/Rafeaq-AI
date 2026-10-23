// api/chat.js - رفيق AI
// نطاق: التعليم + تحسين الحياة اليومية | المنهج الليبي
// سلسلة نماذج احتياطية: Groq (عدة نماذج) ثم Gemini ثم أي مزوّد إضافي
// يدعم: دردشة + دفتر رفيق (context) + صور + امتحانات (Quiz) + بطاقات (Flashcards)

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const REFUSAL = 'عذراً، أنا رفيق، وتخصصي مساعدة الطلاب في دراستهم وتحسين حياتهم اليومية. اسألني في دروسك أو في أمور تنظّم يومك وتطوّر حياتك.'

// ============ البرومبت الأساسي ============
const SYSTEM_PROMPT = `أنت «رفيق»، مساعد دراسي ذكي، تتحدث بالعربية الفصحى المبسطة فقط. صممك وطوّرك أحمد البنداق.

النطاق المسموح (فقط):
1) المواد الدراسية والتعليم، ومنها الحاسوب والتقنية والبرمجة.
2) تحسين الحياة اليومية: تنظيم الوقت، المذاكرة، العادات الصحية العامة، الإدارة المالية الشخصية، المهارات، الطبخ والنظافة والسلامة المنزلية.
- إذا ذكر الطالب أن سؤاله في مادة دراسية، أو أرسل صورة مع سؤال دراسي، فهو ضمن النطاق، فلا تعتذر.
- عند الصور: صف ما تراه وأجب عن السؤال. وإن لم تستطع تحديد الشيء بيقين فقل ذلك صراحة واذكر الاحتمالات، واطلب صورة أوضح.
- اعتذر بالجملة التالية فقط إذا كان السؤال بعيداً تماماً (سياسة، ترفيه، مشاهير، رياضة): «${REFUSAL}»
في الأمور الصحية قدّم نصائح عامة فقط، ولا تشخّص مرضاً ولا تصف دواءً، وانصح بمراجعة الطبيب.

المنهج الدراسي:
- التزم بالمنهج الليبي الرسمي (وزارة التربية والتعليم الليبية): مصطلحاته وطرق حله وترتيب دروسه.
- لا تُدخل طرقاً أو مصطلحات أجنبية معقدة خارج المنهج في المواد الدراسية.
- المعلومات العالمية مسموحة فقط عند تحسين الحياة اليومية.
- إن لم تكن متأكداً أن الموضوع ضمن المنهج الليبي فقل ذلك صراحة ولا تخترع.

الأرقام والرموز (إلزامي):
- الأرقام دائماً غربية: 0 1 2 3 4 5 6 7 8 9. يُمنع استخدام الأرقام الهندية (٠١٢٣٤٥٦٧٨٩).
- المتغيرات بالحروف العربية: س، ص، ع، ن، م، أ، ب، جـ. الدالة: ق(س). نصف القطر: نق. الأساس الطبيعي: هـ.
- الدوال والنهايات: جا، جتا، ظا، ظتا، قا، قتا، لو، نهـا. مثال: نهـا (س ← 2) (س² − 4) / (س − 2) = 4
- المتطابقات المثلثية مثال: جا²س + جتا²س = 1 ، ظا س = جا س ÷ جتا س
- لا تستخدم LaTeX ولا علامات الدولار. اكتب كل معادلة في سطر مستقل.`

// ============ الأرقام الغربية ============
function westernDigits(t) {
  return t
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',')
}

// ============ تحويل الرموز إلى العربية ============
const LETTER_MAP = {
  x: 'س', y: 'ص', z: 'ع', n: 'ن', m: 'م',
  a: 'أ', b: 'ب', c: 'جـ', d: 'د', f: 'ق', r: 'نق', e: 'هـ'
}
const COMMANDS = [
  [/\\left|\\right|\\,|\\;|\\!/g, ''],
  [/\\times/g, '×'], [/\\cdot/g, '·'], [/\\div/g, '÷'], [/\\pm/g, '±'],
  [/\\leq?/g, '≤'], [/\\geq?/g, '≥'], [/\\neq/g, '≠'], [/\\approx/g, '≈'],
  [/\\infty/g, '∞'], [/\\pi/g, 'π'], [/\\theta/g, 'θ'], [/\\sum/g, '∑'], [/\\int/g, '∫'],
  [/\\rightarrow|\\to/g, '←'],
  [/\\lim/g, 'نهـا'],
  [/\\sin/g, 'جا'], [/\\cos/g, 'جتا'], [/\\tan/g, 'ظا'], [/\\cot/g, 'ظتا'],
  [/\\sec/g, 'قا'], [/\\csc/g, 'قتا'],
  [/\\log/g, 'لو'], [/\\ln/g, 'لوهـ']
]
// كلمات إنجليزية مستقلة قد يكتبها النموذج خارج LaTeX
const WORDS = [
  [/\bsin\b/g, 'جا'], [/\bcos\b/g, 'جتا'], [/\btan\b/g, 'ظا'], [/\bcot\b/g, 'ظتا'],
  [/\bsec\b/g, 'قا'], [/\bcsc\b/g, 'قتا'], [/\blim\b/g, 'نهـا'],
  [/\bln\b/g, 'لوهـ'], [/\blog\b/g, 'لو']
]
const SUPERSCRIPTS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }

// أوامر LaTeX (كسور، جذور، أسس، رموز) تُحوَّل في أي مكان من النص
function convertCommands(s) {
  for (const [re, to] of COMMANDS) s = s.replace(re, to)
  let prev
  do {
    prev = s
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
  } while (s !== prev)
  // نهـا_{س ← 2}  ←  نهـا (س ← 2)
  s = s.replace(/نهـا_\{([^{}]*)\}/g, 'نهـا ($1)')
  // الأسس: ^2 أو ^{10}
  s = s.replace(/\^\{?(\d+)\}?/g, (_, d) => [...d].map((c) => SUPERSCRIPTS[c]).join(''))
  return s
}

function convertMath(s) {
  s = convertCommands(s)
  s = s.replace(/\^\{([^{}]+)\}/g, '^($1)').replace(/[{}]/g, '')
  // الحروف المفردة فقط (لا تمس الكلمات)
  s = s.replace(/(?<![A-Za-z\\])([A-Za-z])(?![A-Za-z])/g, (m) => LETTER_MAP[m.toLowerCase()] || m)
  return s
}

// ============ اتجاه المعادلات (من اليمين لليسار) ============
// نغلّف كل مقطع رياضي بعازل اتجاه RTL حتى تُعرض المعادلة بترتيب عربي صحيح داخل النص
const RLI = '\u2067'
const PDI = '\u2069'
const OPS = /[=+×÷<>≤≥≠≈±^/−]/
const NOLETTER_MATH = /^[0-9.,()|[\]+\-−×÷=<>≤≥≠≈±√∑∫π∞²³⁴⁵⁶⁷⁸⁹⁰¹⁻/^←→%]+$/
const VAR_OR_FN = /جـ|نق|جتا|جا|ظتا|ظا|قتا|قا|لوهـ|لو|نهـا|[سصعنمقأبدهـ]/g
const SINGLE_ATOM = /^(?:جـ|نق|جتا|جا|ظتا|ظا|قتا|قا|لوهـ|لو|نهـا|[سصعنمقأبدهـ])$/

function isMathToken(tok) {
  if (SINGLE_ATOM.test(tok)) return true
  if (NOLETTER_MATH.test(tok)) return true
  const stripped = tok.replace(VAR_OR_FN, '')
  return stripped.length > 0 && stripped.length < tok.length && NOLETTER_MATH.test(stripped)
}

function wrapMathRuns(line) {
  const parts = line.split(/( +)/) // [كلمة, فراغ, كلمة, ...]
  let run = []
  const flush = () => {
    if (!run.length) return
    const first = run[0]
    const last = run[run.length - 1]
    let core = parts.slice(first, last + 1).join('')
    let tail = ''
    const m = core.match(/[.,؛،:]+$/)
    if (m) { tail = m[0]; core = core.slice(0, -tail.length) }
    if (core.length >= 3 && OPS.test(core)) {
      for (let k = first; k <= last; k++) parts[k] = ''
      parts[first] = RLI + core + PDI + tail
    }
    run = []
  }
  for (let k = 0; k < parts.length; k += 2) {
    const tok = parts[k]
    if (tok === '') continue
    const isMarker = k === 0 && /^(?:[-*•]|\d+[.)])$/.test(tok)
    if (!isMarker && isMathToken(tok)) run.push(k)
    else flush()
  }
  flush()
  return parts.join('')
}

function convertPart(t) {
  t = westernDigits(t)
  t = t.replace(
    /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g,
    (_, a, b, c, d) => convertMath(a ?? b ?? c ?? d)
  )
  if (t.includes('\\')) t = convertCommands(t)
  for (const [re, to] of WORDS) t = t.replace(re, to)
  // حروف مفردة ظهرت خارج LaTeX (س ص ع ن فقط، لتفادي الخطأ مع الكلمات الإنجليزية)
  t = t.replace(/(?<![A-Za-z\\])([xyznXYZN])(?![A-Za-z])/g, (m) => LETTER_MAP[m.toLowerCase()])
  return t.split('\n').map(wrapMathRuns).join('\n')
}

function toArabicMath(text) {
  if (typeof text !== 'string' || !text) return text
  // لا نمس كتل الكود
  return text.split(/(```[\s\S]*?```)/g).map((p, i) => (i % 2 ? p : convertPart(p))).join('')
}

function deepConvert(v) {
  if (typeof v === 'string') return toArabicMath(v)
  if (Array.isArray(v)) return v.map(deepConvert)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepConvert(x)]))
  return v
}

// ============ سبورة رفيق: شرح بخطوات (كلام + رسم) ============
const BOARD_COLORS = ['#26304A', '#2563EB', '#DC2626', '#16A34A', '#9333EA', '#EA580C']

function buildBoardPrompt(topic, teacher = {}, previous = '', hasImage = false, W = 1600, H = 900) {
  const portrait = H > W
  const name = String(teacher.name || 'رفيق').slice(0, 30)
  const subject = String(teacher.subject || 'المواد الدراسية').slice(0, 40)
  return `أنت الأستاذ «${name}» معلم ${subject}، تشرح للطالب على سبورة بيضاء بصوتك وبالرسم، وفق المنهج الليبي الرسمي.
الموضوع المطلوب: «${String(topic).slice(0, 2200)}»
${previous ? `ما شُرح سابقاً على السبورة (للمتابعة وليس للتكرار): ${String(previous).slice(0, 600)}\n` : ''}أرجع JSON فقط بهذا الشكل:
{"title":"عنوان قصير","steps":[{"say":"ما يقوله الأستاذ بصوته","draw":[عناصر الرسم]}]}

مساحة السبورة ${W} عرضاً × ${H} ارتفاعاً (x من 0 إلى ${W}، y من 0 إلى ${H}).${portrait ? ' الشاشة طولية (هاتف): رتّب المحتوى عمودياً من الأعلى إلى الأسفل، واجعل الخط كبيراً مقروءاً (s بين 40 و64)، ولا تضع شيئاً فوق y = 180 لأن اسم الأستاذ يظهر هناك.' : ''}
أنواع عناصر الرسم:
{"t":"text","x":${Math.round(W / 2)},"y":120,"s":44,"c":"#26304A","text":"..."}   (x هو منتصف النص، s حجم الخط بين 28 و64)
{"t":"line","x1":0,"y1":0,"x2":0,"y2":0,"c":"#2563EB"}
{"t":"arrow","x1":0,"y1":0,"x2":0,"y2":0,"c":"#DC2626"}
{"t":"rect","x":0,"y":0,"w":0,"h":0,"c":"#16A34A"}
{"t":"circle","x":0,"y":0,"r":0,"c":"#9333EA"}
{"t":"poly","pts":[[x,y],[x,y]],"c":"#EA580C"}   (لمنحنى أو رسم بياني، من 2 إلى 24 نقطة)
الألوان المسموحة فقط: ${BOARD_COLORS.join(' ')}

القواعد:
${hasImage ? (portrait ? `- الصورة موضوعة في أعلى السبورة (y أقل من ${Math.round(H * 0.38) + 130}). ارسم واكتب أسفلها فقط: y بين ${Math.round(H * 0.38) + 170} و${H - 60}، وتمركز النصوص حول x = ${Math.round(W / 2)}، ولا تضع أي عنصر فوق الصورة.\n` : '- الصورة موضوعة على الجانب الأيسر (x أقل من 700). ارسم واكتب فقط في الجانب الأيمن: x بين 740 و1560، وتمركز النصوص حول x = 1150، ولا تضع أي عنصر فوق الصورة.\n') : ''}- من 4 إلى 7 خطوات، وكل خطوة من 1 إلى 5 عناصر.
- "say": جملة أو جملتان بالفصحى المبسطة تُنطق بصوت عالٍ، فلا تكتب فيها رموزاً رياضية ولا معادلات، بل اشرحها بالكلمات.
- النصوص على السبورة قصيرة (حتى ${portrait ? 26 : 36} حرفاً)، كل معادلة أو جملة في عنصر text مستقل.
- رتّب النصوص من الأعلى إلى الأسفل بفارق لا يقل عن 90 في y، ولا تجعل العناصر تتداخل، ولا تخرج عن حدود السبورة (اترك هامشاً 60).
- أول خطوة عنوان الدرس وفكرته، وآخر خطوة خلاصة قصيرة.
- المعادلات والرموز على السبورة بالأرقام الغربية 0-9 والمتغيرات بحروف عربية (س، ص).
- تحقق من صحة كل عملية حسابية قبل كتابتها.`
}

function normalizeBoard(raw, W = 1600, H = 900) {
  const num = (v, lo, hi, d = lo) => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d
  }
  const color = (c) => (BOARD_COLORS.includes(String(c).toUpperCase()) ? String(c).toUpperCase() : BOARD_COLORS[0])
  const str = (t, max) => toArabicMath(String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, max))

  const toItem = (d) => {
    if (!d || typeof d !== 'object') return null
    const c = color(d.c)
    switch (d.t) {
      case 'text': {
        const text = str(d.text, 60)
        return text ? { t: 'text', x: num(d.x, 0, W, Math.round(W / 2)), y: num(d.y, 0, H, Math.round(H / 2)), s: num(d.s, 24, 72, 40), c, text } : null
      }
      case 'line':
      case 'arrow':
        return { t: d.t, x1: num(d.x1, 0, W), y1: num(d.y1, 0, H), x2: num(d.x2, 0, W), y2: num(d.y2, 0, H), c }
      case 'rect':
        return { t: 'rect', x: num(d.x, 0, W), y: num(d.y, 0, H), w: num(d.w, 10, W, 100), h: num(d.h, 10, H, 60), c }
      case 'circle':
        return { t: 'circle', x: num(d.x, 0, W), y: num(d.y, 0, H), r: num(d.r, 6, Math.round(Math.min(W, H) / 2), 40), c }
      case 'poly': {
        const pts = (Array.isArray(d.pts) ? d.pts : [])
          .filter((p) => Array.isArray(p) && p.length >= 2)
          .slice(0, 24)
          .map((p) => [num(p[0], 0, W), num(p[1], 0, H)])
        return pts.length >= 2 ? { t: 'poly', pts, c } : null
      }
      default:
        return null
    }
  }

  const steps = (Array.isArray(raw?.steps) ? raw.steps : [])
    .slice(0, 8)
    .map((st) => ({
      say: str(st?.say, 400),
      draw: (Array.isArray(st?.draw) ? st.draw : []).slice(0, 6).map(toItem).filter(Boolean)
    }))
    .filter((st) => st.say || st.draw.length)

  return { title: str(raw?.title, 80) || 'درس على السبورة', steps }
}

// ============ سلسلة النماذج (احتياط تلقائي عند نفاد الحصة أو الإيقاف) ============
const csv = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean)

// كل مزوّد: { name, url, key, model, vision }
// أسماء النماذج في متغيرات البيئة حتى لا يتعطل الموقع عند إيقاف نموذج
function getProviders() {
  const list = []
  const gk = process.env.GROQ_API_KEY
  if (gk) {
    csv(process.env.GROQ_MODEL || 'openai/gpt-oss-120b,openai/gpt-oss-20b').forEach((model) =>
      list.push({ name: 'groq', url: GROQ_URL, key: gk, model, vision: false })
    )
    csv(process.env.GROQ_VISION_MODELS || 'qwen/qwen3.8-27b').forEach((model) =>
      list.push({ name: 'groq', url: GROQ_URL, key: gk, model, vision: true })
    )
  }
  if (process.env.GEMINI_API_KEY) {
    list.push({
      name: 'gemini', url: GEMINI_URL, key: process.env.GEMINI_API_KEY,
      model: (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim(), vision: true
    })
  }
  // أي مزوّد آخر متوافق مع OpenAI (OpenRouter, Cerebras, Mistral ...)
  if (process.env.EXTRA_API_URL && process.env.EXTRA_API_KEY && process.env.EXTRA_MODEL) {
    list.push({
      name: 'extra', url: process.env.EXTRA_API_URL, key: process.env.EXTRA_API_KEY,
      model: process.env.EXTRA_MODEL.trim(), vision: process.env.EXTRA_VISION === '1'
    })
  }
  return list
}

async function callLLM({ messages, max_tokens = 1200, json = false, vision = false }) {
  const providers = getProviders().filter((p) => !vision || p.vision)
  if (!providers.length) {
    throw Object.assign(new Error(vision ? 'لا يوجد نموذج يدعم الصور' : 'لا يوجد مفتاح API'), { details: [] })
  }
  const errors = []
  for (const p of providers) {
    try {
      const body = { model: p.model, messages, max_tokens }
      if (json) body.response_format = { type: 'json_object' }
      if (p.model.includes('gpt-oss')) body.reasoning_effort = 'low'
      const r = await fetch(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      })
      const data = await r.json().catch(() => ({}))
      let content = data.choices?.[0]?.message?.content
      if (!r.ok || !content) throw new Error(`${r.status} ${data.error?.message || 'رد فارغ'}`)
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      if (!content) throw new Error('رد فارغ')
      return { content, provider: `${p.name}:${p.model}` }
    } catch (e) {
      const msg = `${p.name}/${p.model}: ${e.message}`
      errors.push(msg)
      console.error('[LLM fail]', msg)
    }
  }
  throw Object.assign(new Error('فشلت كل النماذج المتاحة'), { details: errors })
}

function parseJson(text) {
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s === -1 || e === -1) throw new Error('الرد ليس JSON')
  return JSON.parse(text.slice(s, e + 1))
}

// ============ PaliGemma (اختياري) ============
// يعمل فقط إذا ضبطت PALIGEMMA_URL و PALIGEMMA_KEY، وإلا تُقرأ الصور بنموذج الرؤية في السلسلة
async function askPaligemma(imageUrl, prompt) {
  const r = await fetch(process.env.PALIGEMMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PALIGEMMA_KEY}`, Accept: 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: `${prompt} <img src="${imageUrl}" />` }],
      max_tokens: 512,
      temperature: 0.2
    }),
    signal: AbortSignal.timeout(15000)
  })
  const data = await r.json()
  return (data.choices?.[0]?.message?.content || '').trim()
}

async function readImageWithPaligemma(imageUrl) {
  if (!process.env.PALIGEMMA_URL || !process.env.PALIGEMMA_KEY) return null
  try {
    const [ocr, caption] = await Promise.all([
      askPaligemma(imageUrl, 'ocr'),
      askPaligemma(imageUrl, 'caption en')
    ])
    if ((ocr + caption).length < 5) return null
    return { ocr, caption }
  } catch (e) {
    return null
  }
}

// ============ أدوات الامتحان والبطاقات ============
function detectMode(text) {
  if (/بطاق|فلاش|flash/i.test(text)) return 'flashcards'
  if (/امتحان|اختبار|اختبرني|كويز|quiz|أسئلة اختيار|اسئلة اختيار/i.test(text)) return 'quiz'
  return 'chat'
}

function pickCount(body, text, fallback = 10) {
  let n = Number(body.count)
  if (!n) {
    const m = text.match(/(\d+)\s*(سؤال|أسئلة|اسئلة|بطاقة|بطاقات)/)
    n = m ? Number(m[1]) : fallback
  }
  return Math.min(Math.max(n, 3), 30)
}

const DIFFICULTY = { easier: 'أسهل من المعتاد', same: 'متوسطة', harder: 'أصعب من المعتاد' }

function buildStudyPrompt(mode, { topic, count, difficulty, focus, weakTopics }) {
  const focusText = focus === 'growth' && weakTopics?.length
    ? `ركّز على نقاط ضعف الطالب التالية: ${weakTopics.join('، ')}.`
    : 'غطِّ جميع محاور الدرس.'
  if (mode === 'quiz') {
    return `أنشئ امتحاناً من ${count} أسئلة اختيار من متعدد في: «${topic}» وفق المنهج الليبي الرسمي.
الصعوبة: ${DIFFICULTY[difficulty] || DIFFICULTY.same}. ${focusText}
أرجع JSON فقط بهذا الشكل:
{"title":"...","questions":[{"question":"...","options":["...","...","...","..."],"answer":0,"hint":"...","explanation":"..."}]}
"answer" رقم الخيار الصحيح من 0 إلى 3. تحقق من صحة الإجابات حسابياً قبل الإرجاع. خيارات خاطئة معقولة وغير مكررة. الأرقام غربية (0-9).`
  }
  return `أنشئ ${count} بطاقة مراجعة (Flashcards) في: «${topic}» وفق المنهج الليبي الرسمي.
${focusText}
أرجع JSON فقط بهذا الشكل:
{"title":"...","cards":[{"front":"سؤال أو مصطلح","back":"إجابة مختصرة وواضحة"}]}
الأرقام غربية (0-9).`
}

function normalizeQuiz(q) {
  const questions = (q.questions || []).map((x) => {
    const options = (x.options || []).slice(0, 4)
    while (options.length < 4) options.push('—')
    let answer = Number(x.answer)
    if (!(answer >= 0 && answer <= 3)) answer = 0
    return { question: x.question || '', options, answer, hint: x.hint || '', explanation: x.explanation || '' }
  }).filter((x) => x.question)
  return { title: q.title || 'اختبار', questions }
}

// ============ بناء البرومبت حسب الطالب والمصادر ============
function buildSystem(body) {
  let s = SYSTEM_PROMPT
  const st = body.student || {}
  s += st.class
    ? `\n\nصف الطالب: ${st.class}. اجعل الشرح والأسئلة مناسبة لهذا الصف في المنهج الليبي ولا تخمّن صفاً آخر.`
    : '\n\nصف الطالب غير محدد، فلا تخمّن صفاً دراسياً.'
  if (body.mode === 'notebook' && Array.isArray(body.context) && body.context.length) {
    s += `\n\nوضع دفتر رفيق: أجب فقط من المقاطع المرقمة أدناه، واذكر رقم المقطع بين قوسين مربعين مثل [1] بعد كل معلومة. إن لم تجد الجواب فيها فقل ذلك صراحة ولا تخترع.\n\n` +
      body.context.map((c) => `[${c.n}] (${c.title}${c.page ? `، ص${c.page}` : ''})\n${c.text}`).join('\n\n')
  }
  return s
}

// آخر 6 رسائل فقط لتوفير الحصة اليومية
function cleanHistory(h) {
  if (!Array.isArray(h)) return []
  return h
    .filter((x) => x && ['user', 'assistant'].includes(x.role) && typeof x.content === 'string')
    .slice(-6)
    .map((x) => ({ role: x.role, content: x.content.slice(0, 1000) }))
}

function fail(res, e) {
  console.error('[chat error]', e.message, e.details || '')
  return res.status(503).json({
    error: 'تعذر الاتصال بنماذج الذكاء الاصطناعي الآن. حاول بعد قليل.',
    details: e.details || []
  })
}

// ============ المعالج الرئيسي ============
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const body = req.body || {}
    const { message } = body

    // الواجهة ترسل images (مصفوفة)، ونقبل image القديم أيضاً
    const imageList = (Array.isArray(body.images) && body.images.length ? body.images : body.image ? [body.image] : [])
      .slice(0, 3)
      .map((im) => (typeof im === 'string' && !im.startsWith('data:') ? `data:image/jpeg;base64,${im}` : im))
      .filter(Boolean)

    if (!message && !imageList.length) return res.status(400).json({ reply: 'اكتب سؤالك أو أرسل صورة' })

    const lower = (message || '').toLowerCase().trim()

    if (lower.startsWith('السلام') || ['سلام', 'مرحبا', 'أهلا', 'هلا', 'hello', 'hi'].includes(lower)) {
      return res.json({ reply: 'وعليكم السلام ورحمة الله. أهلا وسهلا بك، أنا رفيق AI...' })
    }

    if (lower.includes('من صممك') || lower.includes('من صنعك') || lower.includes('من انت')) {
      return res.json({ reply: 'أنا رفيق، مساعد ذكي تم تطويره وتصميمه بواسطة **أحمد البنداق**.' })
    }

    if (!getProviders().length) return res.status(503).json({ error: 'GROQ_API_KEY غير موجود' })

    const SYSTEM = buildSystem(body)
    const history = cleanHistory(body.history)

    // الواجهة ترسل general/study/notebook/quiz/flashcards
    const ui = body.mode
    const mode = ['quiz', 'flashcards'].includes(ui)
      ? ui
      : ui === 'notebook' || imageList.length
        ? 'chat'
        : detectMode(message || '')

    // ---------- سبورة رفيق: شرح بالصوت والرسم ----------
    if (ui === 'board') {
      const bw = Math.min(2000, Math.max(600, Math.round(Number(body.board?.w) || 1600)))
      const bh = Math.min(2000, Math.max(500, Math.round(Number(body.board?.h) || 900)))
      let topicText = String(body.topic || message || '')
      // صورة مرفقة: نستخرج محتواها أولاً (PaliGemma إن وُجد، وإلا نموذج رؤية) ثم يشرحها الأستاذ على السبورة
      if (imageList.length) {
        let seen = ''
        const paliAll = await Promise.all(imageList.map((u) => readImageWithPaligemma(u))).catch(() => [])
        if (paliAll.length && paliAll.every(Boolean)) {
          seen = paliAll.map((x, i) => `صورة ${i + 1}: النص المقروء: ${x.ocr || 'لا يوجد'} | الوصف (بالإنجليزية): ${x.caption || 'لا يوجد'}`).join('\n')
        } else {
          const r = await callLLM({
            vision: true,
            messages: [
              { role: 'system', content: SYSTEM },
              { role: 'user', content: [
                { type: 'text', text: 'اقرأ هذه الصورة التعليمية: انسخ كل نص أو سؤال أو أرقام فيها حرفياً، ثم صف أي رسم أو شكل أو جدول باختصار. لا تحلّ شيئاً الآن.' },
                ...imageList.map((url) => ({ type: 'image_url', image_url: { url } }))
              ] }
            ],
            max_tokens: 900
          })
          seen = String(r.content || '')
        }
        topicText = `${topicText}\n\nمحتوى الصورة المرفقة (قد تحتوي أخطاء قراءة، فإن لم تكن متأكداً فقل ذلك للطالب): ${seen.slice(0, 1500)}`
      }
      const { content, provider } = await callLLM({
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: buildBoardPrompt(topicText, body.teacher, body.previous, imageList.length > 0, bw, bh) }
        ],
        max_tokens: 3500,
        json: true
      })
      const board = normalizeBoard(parseJson(content), bw, bh)
      if (!board.steps.length) return res.json({ reply: 'تعذر تجهيز الشرح على السبورة، حاول مرة أخرى.' })
      return res.json({ type: 'board', ...board, provider })
    }

    // ---------- امتحان / بطاقات ----------
    if (mode === 'quiz' || mode === 'flashcards') {
      const opts = {
        topic: body.topic || message,
        count: pickCount(body, message || ''),
        difficulty: body.difficulty || 'same',   // easier | same | harder
        focus: body.focus || 'all',              // all | growth
        weakTopics: Array.isArray(body.weakTopics) ? body.weakTopics : []
      }
      const { content, provider } = await callLLM({
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: buildStudyPrompt(mode, opts) }
        ],
        max_tokens: 3500,
        json: true
      })
      const parsed = parseJson(content)
      if (mode === 'quiz') {
        const quiz = normalizeQuiz(parsed)
        if (!quiz.questions.length) return res.json({ reply: 'تعذر إنشاء الاختبار، حاول مرة أخرى.' })
        return res.json(deepConvert({ type: 'quiz', ...quiz, provider }))
      }
      const cards = (parsed.cards || []).filter((c) => c.front && c.back)
      if (!cards.length) return res.json({ reply: 'تعذر إنشاء البطاقات، حاول مرة أخرى.' })
      return res.json(deepConvert({ type: 'flashcards', title: parsed.title || 'بطاقات', cards, provider }))
    }

    // ---------- صور ----------
    if (imageList.length) {
      const question = message || 'اشرح ما في هذه الصورة تعليمياً بالتفصيل'

      // 1) PaliGemma (اختياري) يقرأ الصور ثم النموذج النصي يجيب
      const seenAll = await Promise.all(imageList.map((u) => readImageWithPaligemma(u)))
      if (seenAll.every(Boolean)) {
        try {
          const seenText = seenAll
            .map((s, i) => `صورة ${i + 1}:\nالنص المقروء: ${s.ocr || 'لا يوجد'}\nوصف الصورة (بالإنجليزية): ${s.caption || 'لا يوجد'}`)
            .join('\n\n')
          const { content, provider } = await callLLM({
            messages: [
              { role: 'system', content: SYSTEM },
              ...history,
              {
                role: 'user',
                content: `أرسل الطالب صوراً. هذا ما استخرجه نظام قراءة الصور (قد يحتوي أخطاء):\n${seenText}\n\nملاحظة: إن كان الوصف لا يكفي للإجابة فقل ذلك بصدق ولا تعتبر السؤال خارج النطاق.\n\nسؤال الطالب: ${question}`
              }
            ],
            max_tokens: 1200
          })
          return res.json({ reply: toArabicMath(content), provider: `paligemma+${provider}` })
        } catch (e) { /* ننتقل لنموذج الرؤية */ }
      }

      // 2) نماذج الرؤية في السلسلة (Groq ثم Gemini ...)
      // إن فشلت كلها نرجع خطأ صريحاً بدل الإجابة كأن الصورة غير موجودة
      const { content, provider } = await callLLM({
        vision: true,
        messages: [
          { role: 'system', content: SYSTEM },
          ...history,
          {
            role: 'user',
            content: [
              { type: 'text', text: question },
              ...imageList.map((url) => ({ type: 'image_url', image_url: { url } }))
            ]
          }
        ],
        max_tokens: 1200
      })
      return res.json({ reply: toArabicMath(content), provider })
    }

    // ---------- نص فقط (ويشمل دفتر رفيق) ----------
    const { content, provider } = await callLLM({
      messages: [
        { role: 'system', content: SYSTEM },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1200
    })
    return res.json({ reply: toArabicMath(content), provider })

  } catch (e) {
    return fail(res, e)
  }
}
