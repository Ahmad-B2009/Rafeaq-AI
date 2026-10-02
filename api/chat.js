// api/chat.js - رفيق AI - فصحى - المصمم أحمد البنداق
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method!== 'POST') return res.status(405).json({ reply: 'method not allowed' })

  try {
    const { message } = req.body
    if (!message) return res.json({ reply: 'اكتب سؤالك' })

    // رد هوية المصمم مباشرة
    const lowerMsg = message.toLowerCase()
    if (lowerMsg.includes('من صممك') || lowerMsg.includes('من صنعك') || lowerMsg.includes('من المطور') || lowerMsg.includes('من انشأك') || lowerMsg.includes('من برمجك') || lowerMsg.includes('who made you') || lowerMsg.includes('who created you') || message.includes('من أنت') || message.includes('من انت')) {
      return res.json({ reply: 'أنا مساعد ذكي تم تطويري وتصميمي بواسطة **أحمد البنداق**. أنا هنا لمساعدتك في دراستك.' })
    }

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    const modelName = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b'

    const systemInstruction = `أنت رفيق، مساعد تعليمي ذكي.
- تتحدث باللغة العربية الفصحى الواضحة والمبسطة فقط.
- إذا سألك أحد عن مصممك أو من أنشأك، أجب أنك من تطوير وتصميم أحمد البنداق.
- لا تذكر أنك من تطوير OpenAI أو Google أو Meta أبدا.
- تشرح الدروس بأسلوب أكاديمي مبسط.`

    if (NVIDIA_KEY) {
      try {
        const r = await fetch('https://integrate.api.【entity-nvidia¦canonical_name=Nvidia】.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_KEY}` },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: message }
            ],
            temperature: 0.6,
            top_p: 0.9,
            max_tokens: 1200
          })
        })
        const data = await r.json()
        if (data.choices?.[0]?.message?.content) {
          return res.json({ reply: data.choices[0].message.content, provider: 'nvidia' })
        }
      } catch (e) { console.log(e.message) }
    }

    res.json({ reply: 'حدث خطأ، تأكد من وجود NVIDIA_API_KEY في Vercel' })
  } catch (e) {
    res.json({ reply: 'خطأ: ' + e.message })
  }
}