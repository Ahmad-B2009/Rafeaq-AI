// api/send-code.js - يرسل الكود لتيليجرام + يحفظه في Supabase - نسخة مصححة
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false })

  try {
    const { code, phone } = req.body
    console.log('=== SEND CODE REQUEST ===', { code, phone })
    
    if (!code || !phone) return res.status(400).json({ success: false, message: 'code و phone مطلوبين' })

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    console.log('ENV CHECK', { hasToken: !!BOT_TOKEN, hasSupabase: !!(SUPABASE_URL && SUPABASE_KEY) })

    if (!BOT_TOKEN) {
      console.log('NO BOT TOKEN - returning devCode only')
      return res.json({ success: true, message: 'البوت غير مُعد - استخدم كود الاختبار', devCode: code, noBot: true })
    }

    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        
        await supabase.from('codes').insert({ phone, code })
        console.log('Code saved')
        
        const cleanPhone = phone.replace(/\D/g, '')
        const phonesToTry = [
          phone, '+' + cleanPhone, cleanPhone,
          phone.replace('+', ''), '+218' + cleanPhone.slice(-9),
          '218' + cleanPhone.slice(-9), cleanPhone.slice(-9),
        ]

        let user = null
        for (const p of phonesToTry) {
          const { data } = await supabase.from('users').select('chat_id, phone').eq('phone', p).maybeSingle()
          if (data?.chat_id) { user = data; break }
        }
        
        if (!user) {
          const last9 = cleanPhone.slice(-9)
          const { data: allUsers } = await supabase.from('users').select('chat_id, phone').ilike('phone', `%${last9}%`)
          if (allUsers && allUsers.length > 0) user = allUsers.find(u => u.chat_id) || allUsers[0]
        }

        console.log('Final user:', user)
        
        if (user?.chat_id) {
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
          console.log('Telegram response:', tgData)
          
          if (!tgData.ok) {
            return res.json({ success: false, message: `فشل ارسال تيليجرام: ${tgData.description}`, telegram_error: tgData, devCode: code })
          }
          return res.json({ success: true, message: 'تم ارسال الكود لتيليجرام ✅', devCode: code })
        } else {
          return res.json({ success: false, message: 'ما لقيناش حسابك في تيليجرام. افتح البوت @rafeaqai_bot ودير /start وشارك رقمك أولا', needStart: true, devCode: code })
        }
      } catch (e) {
        console.log('Supabase error', e.message)
        return res.json({ success: false, message: 'خطأ: ' + e.message, devCode: code })
      }
    }
    return res.json({ success: false, message: 'Supabase غير مُعد', devCode: code })
  } catch (e) {
    console.error('ERROR', e)
    res.status(500).json({ success: false, error: e.message, devCode: req.body?.code })
  }
}