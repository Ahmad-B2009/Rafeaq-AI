// api/chat.js - FINAL - meta/llama-3.1-8b-instruct-fp8-fast - أسرع موديل
// المصمم: أحمد البنداق - لغة عربية فصحى

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

    // رد فوري - 0 ثانية للتحية
    if (['السلام عليكم', 'سلام', 'مرحبا', 'أهلا', 'هلا', 'أهلا وسهلا', 'hi', 'hello'].includes(lower) || lower.startsWith('السلام')) {
      return res.json({ reply: 'وعليكم السلام ورحمة الله وبركاته! أهلاً بك، أنا رفيق، مساعدك الدراسي الذي طوره **أحمد البنداق**. كيف أساعدك اليوم؟' })
    }

    // من صممك؟
    if (lower.includes('من صممك') || lower.includes('من صنعك') || lower.includes('من انشأك') || lower.includes('من برمجك') || lower.includes('من انت') || lower.includes('من أنت') || lower.includes('مصممك') || lower.includes('who made you')) {
      return res.json({ reply: 'أنا رفيق، مساعد ذكي تم تطويره وتصميمه بواسطة **أحمد البنداق**.' })
    }

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    const MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct-fp8-fast'

    if (!NVIDIA_KEY) {
      return res.json({ reply: 'NVIDIA_API_KEY غير موجود في Vercel' })
    }

    let systemPrompt = 'أنت رفيق، مساعد دراسي ذكي. تتحدث باللغة العربية الفصحى الواضحة والمبسطة فقط. لا تستخدم اللهجة العامية. إذا سُئلت عن مصممك فقل بوضوح: أنا من تطوير وتصميم أحمد البنداق. اشرح الدروس بذكاء ووضوح مع أمثلة عملية مفيدة.'

    if (mode === 'notebook' && context.length) {
      const ctx = context.map(c => `[${c.n}] ${c.title}: ${c.text.slice(0,800)}`).join('\n\n')
      systemPrompt = `أنت دفتر رفيق. تجيب بالفصحى فقط من هذه المصادر. إذا سُئلت عن مصممك فقل: أحمد البنداق.\n${ctx}`
    } else if (mode === 'mcq') {
      systemPrompt = `أنت أستاذ خبير. تتحدث بالفصحى. اصنع 5 أسئلة MCQ عن: ${message}. إذا سُئلت عن مصممك فقل: أحمد البنداق.`
    }

    const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.6,
        max_tokens: 600,
        top_p: 0.9
      })
    })

    const data = await r.json()

    if (!r.ok) {
      return res.json({ reply: `خطأ: ${data.error?.message || JSON.stringify(data).slice(0,300)}` })
    }

    return res.json({ reply: data.choices?.[0]?.message?.content || 'لم يصل رد' })

  } catch (e) {
    return res.json({ reply: `خطأ: ${e.message}` })
  }
}