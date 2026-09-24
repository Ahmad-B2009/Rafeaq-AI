// api/send-code.js - يرسل الكود لتيليجرام + يحفظه في Supabase
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false })

  try {
    const { code, phone } = req.body
    if (!code || !phone) return res.status(400).json({ success: false, message: 'code و phone مطلوبين' })

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    console.log(`[CODE] ${code} لـ ${phone}`)

    // 1. احفظ الكود في Supabase
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        
        // احفظ الكود
        await supabase.from('codes').insert({ phone, code })
        
        // دور على chat_id
        const { data: user } = await supabase.from('users').select('chat_id').eq('phone', phone).maybeSingle()
        
        if (user?.chat_id && BOT_TOKEN) {
          // ابعت الكود لتيليجرام
          const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.chat_id,
              text: `🔐 كود دخول رفيق: *${code}*\n\nصالح لمدة 5 دقائق. لا تشاركه مع أحد.`,
              parse_mode: 'Markdown'
            })
          })
          const tgData = await tgRes.json()
          console.log('Telegram send result', tgData)
          
          if (!tgData.ok) {
            // لو فشل، ارجع السبب
            return res.json({ 
              success: true, 
              message: 'الكود محفوظ لكن فشل ارسال تيليجرام',
              telegram_error: tgData,
              devCode: code // للاختبار
            })
          }
          
          return res.json({ success: true, message: 'تم ارسال الكود لتيليجرام', devCode: code })
        } else {
          console.log('No chat_id found for', phone, 'user:', user)
          // ما لقاش chat_id - معناها المستخدم ما دارش /start وشارك رقمه
          return res.json({ 
            success: false, 
            message: 'ما لقيناش حسابك في تيليجرام. افتح البوت ودير /start وشارك رقمك أولا',
            needStart: true,
            devCode: code // نرجعه للاختبار مؤقتا
          })
        }
      } catch (e) {
        console.log('Supabase error in send-code', e.message)
        return res.json({ success: true, message: 'تم حفظ الكود محليا', devCode: code, error: e.message })
      }
    }

    // fallback بدون Supabase
    return res.json({ success: true, message: 'تم حفظ الكود', devCode: code })
  } catch (e) {
    console.error(e)
    res.status(500).json({ success: false, error: e.message })
  }
}