// api/chat.js - FINAL - Groq 2026 - يدعم النص + الصور
// يحل: "عذراً، لا أستطيع رؤية الصور"

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method!== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const { message, image } = req.body || {}
    if (!message &&!image) return res.status(400).json({ reply: 'اكتب سؤالك أو أرسل صورة' })

    const lower = (message || '').toLowerCase().trim()

    if (lower.startsWith('السلام') || ['سلام','مرحبا','أهلا','هلا','hello','hi'].includes(lower)) {
      return res.json({ reply: 'وعليكم السلام ورحمة الله. أهلا وسهلا بك، أنا رفيق AI...' })
    }

    if (lower.includes('من صممك') || lower.includes('من صنعك') || lower.includes('من انت')) {
      return res.json({ reply: 'أنا رفيق، مساعد ذكي تم تطويره وتصميمه بواسطة **أحمد البنداق**.' })
    }

    const GROQ_KEY = process.env.GROQ_API_KEY
    if (!GROQ_KEY) return res.json({ reply: 'GROQ_API_KEY غير موجود' })

    // لو فيه صورة → vision
    if (image) {
      let imageUrl = image
      if (!image.startsWith('data:')) imageUrl = `data:image/jpeg;base64,${image}`

      const visionModels = [
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'meta-llama/llama-4-maverick-17b-128e-instruct',
        'llama-3.2-11b-vision-preview'
      ]

      const userPrompt = message || 'اشرح ما في هذه الصورة بالتفصيل بالعربية الفصحى'

      for (const visionModel of visionModels) {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({
            model: visionModel,
            messages: [
              { role: 'system', content: 'أنت رفيق، مساعد دراسي ذكي. تتحدث بالفصحى فقط.' },
              { role: 'user', content: [{ type: 'text', text: userPrompt },{ type: 'image_url', image_url: { url: imageUrl } }] }
            ],
            max_tokens: 1200
          })
        })
        const data = await r.json()
        if (r.ok && data.choices?.[0]?.message?.content) {
          return res.json({ reply: data.choices[0].message.content, provider: 'groq-vision' })
        }
      }
    }

    // نص فقط → gpt-oss-120b
    const MODEL = (process.env.GROQ_MODEL || 'openai/gpt-oss-120b').trim()
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'أنت رفيق، مساعد دراسي ذكي. تتحدث بالفصحى فقط.' },
          { role: 'user', content: message }
        ],
        max_tokens: 700
      })
    })
    const data = await r.json()
    return res.json({ reply: data.choices?.[0]?.message?.content })

  } catch (e) {
    return res.json({ reply: `خطأ: ${e.message}` })
  }
}