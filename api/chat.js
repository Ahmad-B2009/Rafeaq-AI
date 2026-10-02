// api/chat.js - FINAL WORKING 2026 - 【entity-【entity-nvidia¦canonical_name=Nvidia】¦canonical_name=【entity-Nvidia¦canonical_name=Nvidia】】/nemotron-3-nano-30b-a3b
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method!== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const { message } = req.body
    if (!message) return res.status(400).json({ reply: 'اكتب سؤالك' })
    const lower = message.toLowerCase().trim()

    if (lower.startsWith('السلام') || ['سلام','مرحبا','أهلا','هلا'].includes(lower)) {
      return res.json({ reply: 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك، أنا رفيق، مساعدك الدراسي الذي طوره **أحمد البنداق**. كيف أساعدك اليوم؟' })
    }

    if (lower.includes('من صممك') || lower.includes('من صنعك') || lower.includes('من انت') || lower.includes('من أنت') || lower.includes('مصممك')) {
      return res.json({ reply: 'أنا رفيق، مساعد ذكي تم تطويره وتصميمه بواسطة **أحمد البنداق**.' })
    }

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    // موديل 2026 الشغال - سريع
    const MODEL = (process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-nano-30b-a3b').trim()

    if (!NVIDIA_KEY) return res.json({ reply: 'NVIDIA_API_KEY غير موجود' })

    const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'أنت رفيق، مساعد دراسي ذكي. تتحدث باللغة العربية الفصحى الواضحة فقط، لا تستخدم العامية. إذا سُئلت عن مصممك فقل بوضوح: أنا من تطوير وتصميم أحمد البنداق.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 700
      })
    })

    const text = await r.text()
    let data
    try { data = JSON.parse(text) } catch { return res.json({ reply: `خطأ: ${text.slice(0,500)}` }) }

    if (!r.ok) return res.json({ reply: `خطأ من Nvidia (${MODEL}): ${data.detail || data.error?.message || text.slice(0,400)}` })

    return res.json({ reply: data.choices?.[0]?.message?.content || 'لا يوجد رد' })
  } catch (e) {
    return res.json({ reply: `خطأ: ${e.message}` })
  }
}