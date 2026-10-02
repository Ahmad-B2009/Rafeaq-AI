// api/chat.js - FINAL 【entity-Nvidia¦canonical_name=Nvidia】
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method!== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const { message, mode = 'general', context = [] } = req.body
    if (!message) return res.status(400).json({ reply: 'اكتب سؤالك' })

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b'

    console.log('NVIDIA_KEY exists:',!!NVIDIA_KEY)
    console.log('MODEL:', NVIDIA_MODEL)

    if (!NVIDIA_KEY) {
      return res.json({
        reply: `❌ NVIDIA_API_KEY مش موجود في Vercel\n\nروح Vercel > Settings > Environment Variables وضيف:\nNVIDIA_API_KEY = nvapi-xxx\nNVIDIA_MODEL = nvidia/nemotron-3.5-lightning-30b-a3b\n\nبعدها Redeploy`,
        error: 'no key'
      })
    }

    let systemPrompt = 'أنت رفيق - مساعد دراسي ليبي، اشرح بلهجة ليبية مبسطة واضحة مع أمثلة.'
    if (mode === 'notebook' && context.length) {
      const ctx = context.map(c => `[${c.n}] ${c.title}: ${c.text.slice(0,1000)}`).join('\n\n')
      systemPrompt = `أنت دفتر رفيق - جاوب من المصادر فقط بلهجة ليبية. المصادر:\n${ctx}`
    }

    const body = {
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 3000,
      extra_body: { chat_template_kwargs: { enable_thinking: true }, reasoning_budget: 2048 }
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
      console.log('Nvidia error:', data)
      return res.json({ reply: `خطأ من Nvidia: ${JSON.stringify(data).slice(0,500)}`, error: data })
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return res.json({ reply: `ما فيش محتوى: ${JSON.stringify(data).slice(0,500)}` })
    }

    return res.json({ reply: content, provider: 'nvidia' })

  } catch (e) {
    console.error(e)
    return res.json({ reply: `خطأ سيرفر: ${e.message}`, error: e.message })
  }
}