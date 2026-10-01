export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { message, mode, context } = req.body
  const OPENAI_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_KEY) {
    // Mock لو ما عندكش مفتاح
    return res.json({
      reply: `**رد تجريبي (حط OPENAI_API_KEY باش يخدم الحقيقي):**\n\nسؤالك: ${message}\n\n${mode === 'notebook'? `لقيت ${context?.length || 0} مقتطفات من كتبك.` : 'هذا شرح مبسط:'}\n- النقطة 1\n- النقطة 2\n\n> حط مفتاح OpenAI في Vercel Environment Variables`
    })
  }

  try {
    const system = mode === 'notebook'
     ? `انت مساعد دراسي يجيب فقط من المصادر المعطاة. اذكر رقم المقتطف [1] [2]`
      : `انت رفيق، مساعد دراسي ليبي يشرح بلهجة ليبية مبسطة`

    const userContent = context
     ? `المصادر:\n${context.map(c=>`[${c.n}] ${c.title} ص${c.page||''}: ${c.text.slice(0,800)}`).join('\n')}\n\nالسؤال: ${message}`
      : message

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }],
        temperature: 0.4
      })
    })
    const data = await r.json()
    return res.json({ reply: data.choices?.[0]?.message?.content || 'ما قدرتش نجيب إجابة' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}