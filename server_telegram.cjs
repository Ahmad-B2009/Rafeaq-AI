const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
const BOT_USERNAME = process.env.VITE_BOT_USERNAME || 'RafeaqAIBot'

if(!BOT_TOKEN){
  console.log('❌ ما لقيتش BOT_TOKEN في .env')
  process.exit(1)
}

console.log(`🤖 البوت: @${BOT_USERNAME}`)

let lastChatId = null
let chats = {}

async function pollTelegram(){
  let offset = 0
  setInterval(async ()=>{
    try{
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=1`)
      const data = await res.json()
      if(!data.ok) return
      for(const upd of data.result){
        offset = upd.update_id + 1
        const msg = upd.message
        if(!msg) continue
        const chatId = msg.chat.id
        lastChatId = chatId
        chats[chatId] = true

        if(msg.contact){
          const phone = msg.contact.phone_number.replace(/\D/g,'')
          chats[phone] = chatId
          chats[phone.slice(-9)] = chatId
          console.log(`📱 ربط ${phone} -> ${chatId}`)
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ chat_id: chatId, text: `✅ تم ربط رقمك ${phone}\nارجع للموقع توا ودخل نفس الرقم` })
          })
        }

        if(msg.text === '/start'){
          console.log(`👋 /start من ${chatId}`)
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              chat_id: chatId,
              text: `مرحبا في رفيق! 👋\nباش نربط حسابك دوس زر مشاركة رقم الهاتف 👇`,
              reply_markup: { keyboard: [[{ text: "📱 مشاركة رقم الهاتف", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true }
            })
          })
        }
      }
    }catch(e){}
  }, 2000)
}

pollTelegram()

app.post('/api/send-code', async (req,res)=>{
  const { code, phone } = req.body
  console.log(`📤 طلب كود ${code} لرقم ${phone}`)

  let targetChatId = lastChatId
  if(phone){
    const clean = phone.replace(/\D/g,'')
    if(chats[clean]) targetChatId = chats[clean]
    if(chats[clean.slice(-9)]) targetChatId = chats[clean.slice(-9)]
  }

  if(!targetChatId){
    return res.json({ success: false, message: `افتح @${BOT_USERNAME} ودير /start وشارك رقمك` })
  }

  try{
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: targetChatId, text: `🔐 كود رفيق: *${code}*\nرقمك: ${phone}`, parse_mode: 'Markdown' })
    })
    const tgData = await tgRes.json()
    console.log('TG:', tgData)
    if(tgData.ok) return res.json({ success: true, chatId: targetChatId })
    else return res.json({ success: false, message: tgData.description })
  }catch(e){
    return res.json({ success: false, message: e.message })
  }
})

app.get('/', (req,res)=> res.send(`Bot @${BOT_USERNAME} شغال - lastChatId: ${lastChatId}`))

app.listen(3001, ()=> console.log('✅ شغال على http://localhost:3001 - افتح @'+BOT_USERNAME+' ودير /start'))
