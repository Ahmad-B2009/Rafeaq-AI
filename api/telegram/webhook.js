// api/telegram/webhook.js - يستقبل رسائل البوت ويحفظ chat_id
export default async function handler(req, res) {
  // تيليجرام يبعت POST فقط
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Rafeaq Telegram Webhook is running' })
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

    if (!BOT_TOKEN) {
      console.log('No BOT_TOKEN')
      return res.status(200).json({ ok: true })
    }

    const update = req.body
    const message = update?.message
    if (!message) return res.status(200).json({ ok: true })

    const chatId = message.chat?.id
    const text = message.text
    const contact = message.contact

    // لو المستخدم داس /start
    if (text === '/start') {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `مرحبا في رفيق! 🚀\n\nأنا بوت كود الدخول لمنصة رفيق.\n\nاضغط الزر تحت وشارك رقمك باش نبعثلك كود الدخول تلقائيا.`,
          reply_markup: {
            keyboard: [[{ text: "📱 مشاركة رقمي", request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        })
      })
      return res.status(200).json({ ok: true })
    }

    // لو المستخدم شارك رقمه
    if (contact) {
      const rawPhone = contact.phone_number || ''
      const phone = rawPhone.startsWith('+') ? rawPhone : '+' + rawPhone.replace(/\D/g,'')
      
      // احفظ في Supabase
      if (SUPABASE_URL && SUPABASE_KEY) {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
          await supabase.from('users').upsert({
            phone: phone,
            chat_id: chatId.toString(),
            name: contact.first_name || 'مستخدم',
            updated_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          }, { onConflict: 'phone' })
          console.log('Saved user', phone, chatId)
        } catch (e) {
          console.log('Supabase save error', e.message)
        }
      }

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ تم حفظ رقمك ${phone}\n\nتوا ارجع لمنصة رفيق وسجل دخول - الكود حيوصلك هنا تلقائيا!`,
          reply_markup: { remove_keyboard: true }
        })
      })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Webhook error', e)
    return res.status(200).json({ ok: true })
  }
}