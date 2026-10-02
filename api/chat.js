// api/chat.js - FINAL FIXED - meta/llama-3.1-8b-instruct-fp8-fast
// المصمم: أحمد البنداق - فصحى - سريع

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

    if (['السلام عليكم', 'سلام', 'مرحبا', 'أهلا', 'هلا'].includes(lower) || lower.startsWith('السلام')) {
      return res.json({ reply: 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك، أنا رفيق، مساعدك الدراسي. كيف أساعدك اليوم؟' })
    }

    if (lower.includes('من صممك') || lower.includes('من صنعك') || lower.includes('من انشأك') || lower.includes('من انت') || lower.includes('من أنت') || lower.includes('مصممك')) {
      return res.json({ reply: 'أنا رفيق، مساعد ذكي تم تطويره وتصميمه بواسطة **أحمد البنداق**.' })
    }

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    // بدون مسافة في البداية - هذا كان سبب الخطأ
    const MODEL = (process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct-fp8-fast').trim()

    if (!NVIDIA_KEY) {
      return res.json({ reply: 'NVIDIA_API_KEY غير موجود في Vercel' })
    }

    const systemPrompt = 'أنت رفيق، مساعد دراسي ذكي. تتحدث باللغة العربية الفصحى الواضحة فقط. لا تستخدم العامية. إذا سُئلت عن مصممك فقل: أنا من تطوير وتصميم أحمد البنداق. اشرح بذكاء ووضوح.'

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.6,
        max_tokens: 600
      })
    })

    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      // لو 【entity-Nvidia¦canonical_name=Nvidia】 رجع نص مش JSON
      return res.json({ reply: `خطأ في الرد من Nvidia: ${text.slice(0,500)}` })
    }

    if (!response.ok) {
      return res.json({ reply: `خطأ: ${data.error?.message || text.slice(0,300)}` })
    }

    return res.json({ reply: data.choices?.[0]?.message?.content || 'لم يصل رد' })

  } catch (e) {
    return res.json({ reply: `خطأ: ${e.message}` })
  }
}