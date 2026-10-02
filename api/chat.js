// api/chat.js - FINAL - 【entity-Nvidia¦canonical_name=Nvidia】 Nemotron 3.5 Lightning
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const { message, mode = 'general', context = [], student } = req.body
    if (!message) return res.status(400).json({ error: 'message مطلوب' })
    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b'
    let systemPrompt = ''
    if (mode === 'notebook') {
      const ctx = Array.isArray(context) && context.length ? context.map(c => `[${c.n}] ${c.title}: ${c.text.slice(0,1000)}`).join('\n\n') : ''
      systemPrompt = `أنت "دفتر رفيق" - مساعد دراسي ليبي. جاوب من المصادر فقط بلهجة ليبية مبسطة. استشهد [1] [2]. المصادر:\n${ctx}`.trim()
    } else if (mode === 'mcq') {
      systemPrompt = `أنت أستاذ ليبي خبير MCQ. اصنع 5 أسئلة عن: ${message}. 4 اختيارات + الصحيحة + شرح ليبي.`
    } else {
      systemPrompt = `أنت "رفيق" - مساعد دراسي ليبي (تاسع، ثانوي). اشرح بلهجة ليبية مبسطة منظم مع أمثلة. الطالب: ${student?.name||'طالب'}.`.trim()
    }
    if (NVIDIA_KEY) {
      try {
        const body = {
          model: NVIDIA_MODEL,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
          temperature: mode === 'notebook' ? 0.4 : 0.9,
          top_p: 0.95,
          max_tokens: 4000,
          extra_body: { chat_template_kwargs: { enable_thinking: true }, reasoning_budget: 4096 }
        }
        const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NVIDIA_KEY}` },
          body: JSON.stringify(body)
        })
        const data = await r.json()
        const content = data.choices?.[0]?.message?.content
        if (r.ok && content) {
          return res.json({ reply: content, provider: 'nvidia', model: NVIDIA_MODEL })
        }
      } catch (e) { console.log(e.message) }
    }
    return res.json({ reply: `فهمت: "${message.slice(0,80)}"\n\nاربط مفتاح Nvidia في Vercel باش يخدم AI الحقيقي.`, provider: 'fallback' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}