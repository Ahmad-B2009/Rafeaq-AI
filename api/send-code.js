// api/send-code.js - بدون لابتوب ثاني، مجاني
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false })

  try {
    const { code, phone } = req.body
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

    // خزن الكود في نفس قاعدة البيانات
    // حتى لو ما عندكش Supabase، نحفظه في ملف ونرجع الكود للـ frontend في وضع التطوير
    console.log(`[CODE] ${code} لـ ${phone}`)

    // لو عندك تيليجرام بوت، أرسل الكود
    if (BOT_TOKEN) {
      try {
        // لازم المستخدم يكون دار /start للبوت قبل
        // هنا نبحث عن chat_id من قاعدة البيانات لو موجود
        const SUPABASE_URL = process.env.SUPABASE_URL
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
        if (SUPABASE_URL && SUPABASE_KEY) {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
          const { data: user } = await supabase.from('users').select('chat_id').eq('phone', phone).single()
          if (user?.chat_id) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: user.chat_id,
                text: `🔐 كود رفيق: *${code}*\nصالح 5 دقائق`,
                parse_mode: 'Markdown'
              })
            })
          }
        }
      } catch (e) { console.log('Telegram error:', e.message) }
    }

    // في وضع التطوير نرجع الكود للـ frontend باش يختبر بدون تيليجرام
    const isDev = process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV !== 'production'
    res.json({ 
      success: true, 
      message: 'تم إرسال الكود',
      ...(isDev ? { devCode: code } : {})
    })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}