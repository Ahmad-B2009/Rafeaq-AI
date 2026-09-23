export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const message = String(req.body?.message || '').trim()
  if (!message) return res.status(400).json({ error: 'Message is required' })
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'AI service is not configured' })
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        instructions: 'أنت رفيق، مساعد دراسي ليبي ودود. أجب بالعربية الواضحة وبأسلوب قصير ومنظم. لا تخترع معلومات عن المنهج؛ اطلب اسم الصف والكتاب عند الحاجة.',
        input: message
      })
    })
    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'AI request failed' })
    return res.status(200).json({ reply: data.output_text || 'لم أتمكن من إعداد إجابة الآن.' })
  } catch { return res.status(502).json({ error: 'AI service unavailable' }) }
}