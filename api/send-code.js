export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN
  const BOT_USERNAME = process.env.VITE_BOT_USERNAME || 'RafeaqAIBot'
  if (!BOT_TOKEN) return res.status(500).json({ success: false, message: 'BOT_TOKEN ناقص في Vercel' })
  const { code, phone } = req.body
  try {
    const upRes = await fetch('https://api.telegram.org/bot'+BOT_TOKEN+'/getUpdates?limit=100')
    const upData = await upRes.json()
    let targetId = null
    const last9 = phone.replace(/\D/g,'').slice(-9)
    if (upData.ok) {
      for (let i = upData.result.length-1; i>=0; i--) {
        const msg = upData.result[i].message
        if (!msg) continue
        if (msg.contact) {
          const c = msg.contact.phone_number.replace(/\D/g,'')
          if (c.includes(last9)) { targetId = msg.chat.id; break }
        }
      }
      if (!targetId && upData.result.length>0) targetId = upData.result[upData.result.length-1]?.message?.chat?.id
    }
    if (!targetId) return res.json({ success: false, needStart: true, message: 'افتح https://t.me/'+BOT_USERNAME+' ودير /start وشارك رقمك' })
    const sendRes = await fetch('https://api.telegram.org/bot'+BOT_TOKEN+'/sendMessage', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: targetId, parse_mode:'Markdown', text: '🔐 *كود رفيق:* '+code+'\nرقمك: '+phone })
    })
    const sendData = await sendRes.json()
    return res.json(sendData.ok? {success:true, chatId:targetId} : {success:false, message: sendData.description})
  } catch(e){ return res.json({success:false, message:e.message}) }
}
