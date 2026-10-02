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

    const lower = message.toLowerCase()
    if (lower.includes('من صممك') || lower.includes('من صنعك') || lower.includes('من انشأك') || lower.includes('من انت') || lower.includes('من أنت') || lower.includes('who made you')) {
      return res.json({ reply: 'أنا رفيق، مساعد ذكي تم تطويره وتصميمه بواسطة **أحمد البنداق**.' })
    }

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b'

    if (NVIDIA_KEY) {
      try {
        const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_KEY}` },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: 'أنت رفيق، مساعد تعليمي ذكي تتحدث باللغة العربية الفصحى فقط. لا تستخدم العامية. عندما يسأل عن مصممك قل أنك من تطوير أحمد البنداق. اشرح ببساطة.' },
              { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        })
        const data = await r.json()
        if (data.choices?.[0]?.message?.content) {
          return res.json({ reply: data.choices[0].message.content })
        }
        console.log('NVIDIA error', JSON.stringify(data).slice(0,500))
      } catch (e) { console.log(e.message) }
    }

    return res.json({ reply: 'تأكد من وجود NVIDIA_API_KEY في Vercel > Settings > Environment Variables' })
  } catch (e) {
    res.json({ reply: 'خطأ: ' + e.message })
  }
}