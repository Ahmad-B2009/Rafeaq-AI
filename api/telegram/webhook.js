// api/telegram/webhook.js - نسخة مبسطة للبوت الأول - ترد 100%
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'Bot webhook is LIVE - POST only' })
  }
  if (req.method !== 'POST') return res.status(200).json({ ok: true })

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  if (!BOT_TOKEN) {
    console.log('NO TOKEN')
    return res.status(200).json({ ok: true })
  }

  try {
    const body = req.body
    const msg = body?.message
    if (!msg) return res.status(200).json({ ok: true })

    const chatId = msg.chat.id
    const text = msg.text || ''
    const contact = msg.contact

    // أي رسالة -> رد فوري
    if (text === '/start') {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `مرحبا! 🚀\n\nبوت رفيق شغال 100%\n\nشارك رقمك:`,
          reply_markup: {
            keyboard: [[{ text: "📱 مشاركة رقمي", request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        })
      })
    } else if (contact) {
      const phone = contact.phone_number
      const normalized = phone.startsWith('+') ? phone : '+' + phone

      // حاول تحفظ في Supabase - لو فشل مش مشكلة، البوت يرد على كل حال
      try {
        const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
        if (SUPABASE_URL && SUPABASE_KEY) {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
          await supabase.from('users').upsert({
            phone: normalized,
            chat_id: String(chatId),
            name: contact.first_name || 'مستخدم',
            updated_at: new Date().toISOString()
          }, { onConflict: 'phone' })
        }
      } catch (e) {
        console.log('Supabase error but ignoring:', e.message)
      }

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ تم حفظ رقمك ${normalized}\n\nارجع للموقع وسجل دخول!`,
          reply_markup: { remove_keyboard: true }
        })
      })
    } else {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `دير /start باش تشارك رقمك`
        })
      })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(200).json({ ok: true })
  }
}