// api/chat.js - رفيق AI
// نطاق: التعليم + تحسين الحياة اليومية | المنهج الليبي | PaliGemma للصور | Groq للباقي
// يدعم: دردشة + دفتر رفيق (context) + امتحانات (Quiz) + بطاقات (Flashcards)

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const REFUSAL = 'عذراً، أنا رفيق، وتخصصي مساعدة الطلاب في دراستهم وتحسين حياتهم اليومية. اسألني في دروسك أو في أمور تنظّم يومك وتطوّر حياتك.'

// ============ البرومبت الأساسي ============
const SYSTEM_PROMPT = `أنت «رفيق»، مساعد دراسي ذكي، تتحدث بالعربية الفصحى المبسطة فقط. صممك وطوّرك أحمد البنداق.

النطاق المسموح (فقط):
1) المواد الدراسية والتعليم، ومنها الحاسوب والتقنية والبرمجة.
2) تحسين الحياة اليومية: تنظيم الوقت، المذاكرة، العادات الصحية العامة، الإدارة المالية الشخصية، المهارات، الطبخ والنظافة والسلامة المنزلية.
- إذا ذكر الطالب أن سؤاله في مادة دراسية، أو أرسل صورة مع سؤال دراسي، فهو ضمن النطاق، فلا تعتذر.
- عند الصور: صف ما تراه وأجب عن السؤال. وإن لم تستطع تحديد الشيء بيقين (مثل نوع نظام التشغيل من خلفية فقط) فقل ذلك صراحة واذكر الاحتمالات، واطلب لقطة شاشة أوضح.
- اعتذر بالجملة التالية فقط إذا كان السؤال بعيداً تماماً (سياسة، ترفيه، مشاهير، رياضة): «${REFUSAL}»
في الأمور الصحية قدّم نصائح عامة فقط، ولا تشخّص مرضاً ولا تصف دواءً، وانصح بمراجعة الطبيب.

المنهج الدراسي:
- التزم بالمنهج الليبي الرسمي (وزارة التربية والتعليم الليبية): مصطلحاته وطرق حله وترتيب دروسه.
- لا تُدخل طرقاً أو مصطلحات أجنبية معقدة خارج المنهج في المواد الدراسية.
- المعلومات العالمية مسموحة فقط عند تحسين الحياة اليومية.
- إن لم تكن متأكداً أن الموضوع ضمن المنهج الليبي فقل ذلك صراحة ولا تخترع.

الرموز العلمية والرياضية (إلزامي):
- اكتب بالرموز العربية: س، ص، ع بدل x, y, z، و ن بدل n، و أ، ب، جـ بدل a, b, c.
- لا تستخدم LaTeX ولا علامات الدولار. اكتب المعادلات نصاً عادياً مثل: س² + ٣س = ١٠ أو (أ + ب) ÷ ٢.
- جا، جتا، ظا بدل sin, cos, tan.`

// ============ تحويل الرموز إلى العربية ============
const LETTER_MAP = {
  x: 'س', y: 'ص', z: 'ع', n: 'ن', m: 'م',
  a: 'أ', b: 'ب', c: 'جـ', d: 'د', f: 'ق', r: 'نق'
}
const COMMANDS = [
  [/\\left|\\right|\\,|\\;|\\!/g, ''],
  [/\\times/g, '×'], [/\\cdot/g, '·'], [/\\div/g, '÷'], [/\\pm/g, '±'],
  [/\\leq?/g, '≤'], [/\\geq?/g, '≥'], [/\\neq/g, '≠'], [/\\approx/g, '≈'],
  [/\\infty/g, '∞'], [/\\pi/g, 'π'], [/\\theta/g, 'θ'], [/\\sum/g, '∑'], [/\\int/g, '∫'],
  [/\\sin/g, 'جا'], [/\\cos/g, 'جتا'], [/\\tan/g, 'ظا'],
  [/\\log/g, 'لو'], [/\\ln/g, 'لوه']
]
const SUPERSCRIPTS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }

// أوامر LaTeX (كسور، جذور، رموز) تُحوَّل في أي مكان من النص
function convertCommands(s) {
  for (const [re, to] of COMMANDS) s = s.replace(re, to)
  // كسور وجذور (متداخلة)
  let prev
  do {
    prev = s
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
  } while (s !== prev)
  return s
}

function convertMath(s) {
  s = convertCommands(s)
  // الأسس
  s = s.replace(/\^\{?(\d)\}?/g, (_, d) => SUPERSCRIPTS[d])
  s = s.replace(/\^\{([^{}]+)\}/g, '^($1)').replace(/[{}]/g, '')
  // الحروف المفردة فقط (لا تمس الكلمات)
  s = s.replace(/(?<![A-Za-z\\])([A-Za-z])(?![A-Za-z])/g, (m) => LETTER_MAP[m.toLowerCase()] || m)
  return s
}

function convertPart(t) {
  t = t.replace(
    /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g,
    (_, a, b, c, d) => convertMath(a ?? b ?? c ?? d)
  )
  // أوامر LaTeX متفرقة خارج علامات الدولار
  if (t.includes('\\')) t = convertCommands(t)
  // حروف مفردة ظهرت خارج LaTeX (س ص ع ن فقط، لتفادي الخطأ مع الكلمات الإنجليزية)
  return t.replace(/(?<![A-Za-z\\])([xyznXYZN])(?![A-Za-z])/g, (m) => LETTER_MAP[m.toLowerCase()])
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

// ============ Groq ============
async function callGroq({ model, messages, max_tokens = 1500, json = false }) {
  const body = { model, messages, max_tokens }
  if (json) body.response_format = { type: 'json_object' }
  if (model.includes('gpt-oss')) body.reasoning_effort = 'low'
  const r = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify(body)
  })
  const data = await r.json()
  const content = data.choices?.[0]?.message?.content
  if (!r.ok || !content) throw new Error(data.error?.message || 'لم يصل رد من Groq')
  return content
}

function parseJson(text) {
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s === -1 || e === -1) throw new Error('الرد ليس JSON')
  return JSON.parse(text.slice(s, e + 1))
}

// ============ PaliGemma ============
// Groq لا يستضيف PaliGemma، لذلك يُستدعى من مزوّد آخر عبر متغيرات البيئة:
//   PALIGEMMA_URL  = رابط الـ endpoint   |   PALIGEMMA_KEY = المفتاح
// الصيغة أدناه على نمط واجهات NVIDIA (متوافقة مع OpenAI + وسم <img>). تأكد من توثيق مزوّدك.
async function askPaligemma(imageUrl, prompt) {
  const r = await fetch(process.env.PALIGEMMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PALIGEMMA_KEY}`, Accept: 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: `${prompt} <img src="${imageUrl}" />` }],
      max_tokens: 512,
      temperature: 0.2
    })
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
"answer" رقم الخيار الصحيح من 0 إلى 3. تحقق من صحة الإجابات حسابياً قبل الإرجاع. خيارات خاطئة معقولة وغير مكررة.`
  }
  return `أنشئ ${count} بطاقة مراجعة (Flashcards) في: «${topic}» وفق المنهج الليبي الرسمي.
${focusText}
أرجع JSON فقط بهذا الشكل:
{"title":"...","cards":[{"front":"سؤال أو مصطلح","back":"إجابة مختصرة وواضحة"}]}`
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

function cleanHistory(h) {
  if (!Array.isArray(h)) return []
  return h
    .filter((x) => x && ['user', 'assistant'].includes(x.role) && typeof x.content === 'string')
    .slice(-8)
    .map((x) => ({ role: x.role, content: x.content.slice(0, 1500) }))
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
      return res.json({ reply: 'أنا رفيق، مساعد ذكي تم تطويره وتصميمه بواسطة **أحمد البنداقو**.' })
    }

    if (!process.env.GROQ_API_KEY) return res.json({ reply: 'GROQ_API_KEY غير موجود' })

    const MODEL = (process.env.GROQ_MODEL || 'openai/gpt-oss-120b').trim()
    const SYSTEM = buildSystem(body)
    const history = cleanHistory(body.history)

    // الوضع: الواجهة ترسل general/study/notebook، ونكتشف الامتحان من نص الرسالة
    const ui = body.mode
    const mode = ['quiz', 'flashcards'].includes(ui)
      ? ui
      : ui === 'notebook' || imageList.length
        ? 'chat'
        : detectMode(message || '')

    // ---------- امتحان / بطاقات ----------
    if (mode === 'quiz' || mode === 'flashcards') {
      const opts = {
        topic: body.topic || message,
        count: pickCount(body, message || ''),
        difficulty: body.difficulty || 'same',   // easier | same | harder
        focus: body.focus || 'all',              // all | growth
        weakTopics: Array.isArray(body.weakTopics) ? body.weakTopics : []
      }
      const raw = await callGroq({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: buildStudyPrompt(mode, opts) }
        ],
        max_tokens: 6000,
        json: true
      })
      const parsed = parseJson(raw)
      if (mode === 'quiz') {
        const quiz = normalizeQuiz(parsed)
        if (!quiz.questions.length) return res.json({ reply: 'تعذر إنشاء الاختبار، حاول مرة أخرى.' })
        return res.json(deepConvert({ type: 'quiz', ...quiz, provider: 'groq' }))
      }
      const cards = (parsed.cards || []).filter((c) => c.front && c.back)
      if (!cards.length) return res.json({ reply: 'تعذر إنشاء البطاقات، حاول مرة أخرى.' })
      return res.json(deepConvert({ type: 'flashcards', title: parsed.title || 'بطاقات', cards, provider: 'groq' }))
    }

    // ---------- صور ----------
    if (imageList.length) {
      const question = message || 'اشرح ما في هذه الصورة تعليمياً بالتفصيل'

      // 1) PaliGemma يقرأ كل صورة ثم Groq يجيب
      const seenAll = await Promise.all(imageList.map((u) => readImageWithPaligemma(u)))
      if (seenAll.every(Boolean)) {
        const seenText = seenAll
          .map((s, i) => `صورة ${i + 1}:\nالنص المقروء: ${s.ocr || 'لا يوجد'}\nوصف الصورة (بالإنجليزية): ${s.caption || 'لا يوجد'}`)
          .join('\n\n')
        const reply = await callGroq({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM },
            ...history,
            {
              role: 'user',
              content: `أرسل الطالب صوراً. هذا ما استخرجه نظام قراءة الصور (قد يحتوي أخطاء):\n${seenText}\n\nملاحظة: إن كان الوصف لا يكفي للإجابة فقل ذلك بصدق ولا تعتبر السؤال خارج النطاق.\n\nسؤال الطالب: ${question}`
            }
          ],
          max_tokens: 1500
        })
        return res.json({ reply: toArabicMath(reply), provider: 'paligemma+groq' })
      }

      // 2) احتياطي: نماذج Groq البصرية
      const visionModels = [
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'meta-llama/llama-4-maverick-17b-128e-instruct',
        'llama-3.2-11b-vision-preview'
      ]
      for (const visionModel of visionModels) {
        try {
          const reply = await callGroq({
            model: visionModel,
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
          return res.json({ reply: toArabicMath(reply), provider: 'groq-vision' })
        } catch (e) { /* جرّب التالي */ }
      }
      if (!message) return res.json({ reply: 'تعذر قراءة الصورة، حاول مجدداً أو اكتب سؤالك.' })
    }

    // ---------- نص فقط (ويشمل دفتر رفيق) ----------
    const reply = await callGroq({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1500
    })
    return res.json({ reply: toArabicMath(reply), provider: 'groq' })

  } catch (e) {
    return res.json({ reply: `خطأ: ${e.message}` })
  }
}