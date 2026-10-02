// api/chat.js - FINAL FIXED - سريع + فصحى + المصمم أحمد البنداق
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const { message, mode = 'general', context = [] } = req.body
    if (!message) return res.status(400).json({ reply: 'اكتب سؤالك' })

    const lower = message.toLowerCase().trim()

    // 1) رد سريع جداً للتحيات بدون ما ينادي 【entity-Nvidia¦canonical_name=Nvidia】 - هذا اللي يسرع السلام عليكم
    const greetings = ['السلام عليكم', 'سلام', 'مرحبا', 'أهلا', 'هلا', 'hi', 'hello']
    if (greetings.includes(lower) || lower === 'السلام عليكم ورحمة الله') {
      return res.json({ 
        reply: 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك، أنا رفيق، مساعدك الدراسي. كيف يمكنني مساعدتك اليوم؟',
        provider: 'instant' 
      })
    }

    // 2) من صممك؟ - رد فوري
    if (lower.includes('من صممك') || lower.includes('من صنعك') || lower.includes('من انشأك') || lower.includes('من برمجك') || lower.includes('من انت') || lower.includes('من أنت') || lower.includes('who made you') || lower.includes('who created you') || lower.includes('مصممك')) {
      return res.json({ 
        reply: 'أنا مساعد ذكي تم تطويري وتصميمي بواسطة **أحمد البنداق**، لأساعدك في رحلتك التعليمية.',
        provider: 'identity' 
      })
    }

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b'

    if (!NVIDIA_KEY) {
      return res.json({ reply: '❌ NVIDIA_API_KEY غير موجود في Vercel. أضفه في Settings > Environment Variables' })
    }

    // فصحى + تحديد المصمم في النظام
    let systemPrompt = 'أنت رفيق، مساعد دراسي ذكي. تتحدث باللغة العربية الفصحى الواضحة والمبسطة فقط، لا تستخدم اللهجة العامية. عندما يُسأل عن مصممه أو منشئه، يجيب بوضوح: تم تطويري بواسطة أحمد البنداق. اشرح الدروس بأسلوب مبسط مع أمثلة عملية.'
    
    if (mode === 'notebook' && context.length) {
      const ctx = context.map(c => `[${c.n}] ${c.title}: ${c.text.slice(0,800)}`).join('\n\n')
      systemPrompt = `أنت دفتر رفيق. تجيب باللغة العربية الفصحى فقط من المصادر التالية، وإذا سُئلت عن مصممك فقل: أحمد البنداق.\nالمصادر:\n${ctx}`
    } else if (mode === 'mcq') {
      systemPrompt = `أنت أستاذ خبير في إعداد الاختبارات. تتحدث باللغة العربية الفصحى. اصنع 5 أسئلة اختيار من متعدد عن: ${message}. وإذا سُئلت عن مصممك فقل: أحمد البنداق.`
    }

    // تسريع: كلما كانت الرسالة قصيرة، كلما قللنا max_tokens
    const isShort = message.length < 30
    const maxTokens = isShort ? 400 : mode === 'notebook' ? 1200 : 800

    const body = {
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.5, // قللت الحرارة باش يرد أسرع وأدق
      top_p: 0.9,
      max_tokens: maxTokens
    }

    // Timeout 25 ثانية باش ما يقعدش 5 دقائق
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_KEY}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })

    clearTimeout(timeout)
    const data = await r.json()

    if (!r.ok) {
      return res.json({ reply: `خطأ من Nvidia: ${data.error?.message || JSON.stringify(data).slice(0,300)}` })
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return res.json({ reply: 'لم يصل رد من النموذج، حاول مرة أخرى.' })
    }

    return res.json({ reply: content, provider: 'nvidia' })

  } catch (e) {
    if (e.name === 'AbortError') {
      return res.json({ reply: 'استغرق الرد وقتاً طويلاً، حاول مرة أخرى برسالة أقصر. (انتهت مهلة 25 ثانية)' })
    }
    return res.json({ reply: `خطأ في الخادم: ${e.message}` })
  }
}