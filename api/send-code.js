// api/send-code.js - PRODUCTION - بدون أكواد تجريبية
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false })

  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' })

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

    if (!BOT_TOKEN) return res.status(500).json({ success: false, message: 'البوت غير مُعد' })
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير مُعدة' })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const clean = phone.replace(/\D/g, '')
    const last9 = clean.slice(-9)

    // دور على المستخدم
    let user = null
    const tries = [phone, '+'+clean, clean, '+218'+last9, '218'+last9]
    for (const p of tries) {
      const { data } = await supabase.from('users').select('chat_id, phone').eq('phone', p).maybeSingle()
      if (data?.chat_id) { user = data; break }
    }

    if (!user) {
      const { data } = await supabase.from('users').select('chat_id, phone').ilike('phone', `%${last9}%`).order('updated_at', { ascending: false }).limit(3)
      if (data && data.length > 0) user = data.find(u => u.chat_id) || null
    }

    if (!user?.chat_id) {
      // جرب آخر مستخدم (اللي توا شارك)
      const { data } = await supabase.from('users').select('chat_id, phone').not('chat_id', 'is', null).order('updated_at', { ascending: false }).limit(1)
      if (data && data[0]?.chat_id) user = data[0]
    }

    if (!user?.chat_id) {
      return res.json({ success: false, message: 'ما لقيناش حسابك في تيليجرام - دير /start في البوت وشارك رقمك أولا' })
    }

    // أنشئ كود جديد
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // احفظ الكود
    await supabase.from('codes').insert({ phone: user.phone, code, created_at: new Date().toISOString() })

    // ابعت لتيليجرام
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

    if (!tgData.ok) {
      return res.json({ success: false, message: 'فشل ارسال الكود لتيليجرام - حاول مرة أخرى' })
    }

    return res.json({ success: true, message: 'تم ارسال الكود إلى تيليجرام' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ success: false, message: 'خطأ في الخادم' })
  }
}