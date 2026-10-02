// api/chat.js - FINAL FIXED - Nvidia Nemotron 3.5 Lightning
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const { message, mode = 'general', context = [] } = req.body
    if (!message) return res.status(400).json({ reply: 'اكتب سؤالك' })

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b'

    if (!NVIDIA_KEY) {
      return res.json({ reply: '❌ NVIDIA_API_KEY مش موجود في Vercel - ضيفه في Settings > Environment Variables' })
    }

    let systemPrompt = 'أنت رفيق - مساعد دراسي ليبي، اشرح بلهجة ليبية مبسطة واضحة مع أمثلة عملية.'
    if (mode === 'notebook' && context.length) {
      const ctx = context.map(c => `[${c.n}] ${c.title}: ${c.text.slice(0,1000)}`).join('\n\n')
      systemPrompt = `أنت دفتر رفيق - جاوب من المصادر فقط بلهجة ليبية. المصادر:\n${ctx}`
    } else if (mode === 'mcq') {
      systemPrompt = `أنت أستاذ ليبي خبير MCQ. اصنع 5 أسئلة اختيار من متعدد عن: ${message}`
    }

    // بدون extra_body - هذا اللي كان يسبب الخطأ
    const body = {
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 3000
    }

    const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_KEY}`
      },
      body: JSON.stringify(body)
    })

    const data = await r.json()

    if (!r.ok) {
      return res.json({ reply: `خطأ Nvidia: ${data.error?.message || JSON.stringify(data).slice(0,400)}` })
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return res.json({ reply: 'ما فيش رد من Nvidia' })
    }

    return res.json({ reply: content, provider: 'nvidia' })

  } catch (e) {
    return res.json({ reply: `خطأ سيرفر: ${e.message}` })
  }
}