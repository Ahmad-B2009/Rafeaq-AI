import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'RafeaqAIBot'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Login(){
  const nav = useNavigate()
  const [method,setMethod] = useState('telegram')
  const [phone,setPhone] = useState('')
  const [phoneError,setPhoneError] = useState('')
  const [codeSent,setCodeSent] = useState(false)
  const [code,setCode] = useState(['','','','','',''])
  const [generatedCode,setGeneratedCode] = useState('')
  const [sending,setSending] = useState(false)
  const refs = useRef([])

  useEffect(()=>{
    if(!GOOGLE_CLIENT_ID) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    document.body.appendChild(script)
    script.onload = () => {
      if(window.google){
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res)=>{
            try{
              const payload = JSON.parse(atob(res.credential.split('.')[1]))
              localStorage.setItem('rafeaq_user', payload.email)
              localStorage.setItem('rafeaq_token', 'google_' + payload.sub)
              nav('/dashboard')
            }catch{}
          }
        })
        window.google.accounts.id.renderButton(
          document.getElementById('googleBtn'),
          { theme:'outline', size:'large', shape:'pill', width: 360 }
        )
      }
    }
    return ()=>{ if(script.parentNode) script.parentNode.removeChild(script) }
  },[])

  function validatePhone(){
    const clean = phone.replace(/\D/g,'')
    if(clean.length < 9){
      setPhoneError('رقم الهاتف ضروري - على الأقل 9 أرقام')
      return false
    }
    if(clean.length > 10){
      setPhoneError('رقم طويل بزيادة')
      return false
    }
    setPhoneError('')
    return true
  }

  async function sendTelegramCode(){
    if(!validatePhone()){
      return
    }
    setSending(true)
    const c = Math.floor(100000 + Math.random()*900000).toString()
    setGeneratedCode(c)

    try{
      const res = await fetch('http://localhost:3001/api/send-code', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ code: c, phone: '+218'+phone })
      })
      const data = await res.json()
      if(data.chatId) localStorage.setItem('rafeaq_chat_id', data.chatId)
      setCodeSent(true)
    }catch(e){
      // حتى لو السيرفر مش شغال، نمشو لشاشة الكود
      setCodeSent(true)
      console.log('Demo code:', c)
    }
    setSending(false)
  }

  function verifyCode(){
    if(!generatedCode){
      // لو السيرفر شغال، التحقق يصير في السيرفر
      if(code.join('').length === 6){
        localStorage.setItem('rafeaq_user', '+218'+phone)
        localStorage.setItem('rafeaq_token','telegram_ok')
        nav('/dashboard')
      }
      return
    }
    if(code.join('') === generatedCode){
      localStorage.setItem('rafeaq_user', '+218'+phone)
      localStorage.setItem('rafeaq_token','telegram_ok')
      nav('/dashboard')
    } else {
      alert('الكود غلط')
    }
  }

  return (
    <div className="min-h-screen flex bg-[#FAFAF8]" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');*{font-family:'Tajawal',sans-serif}`}</style>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-[24px] border border-black/5 p-8 shadow-sm">
            <h1 className="text-[28px] font-[800]">مرحبا في رفيق</h1>
            <p className="text-[13px] opacity-60 mt-1">دخول برقم التيليجرام</p>

            <div className="flex mt-6 p-1 bg-[#F5F5F4] rounded-full">
              <button onClick={()=>setMethod('telegram')} className={`flex-1 h-[40px] rounded-full text-[13px] font-bold transition-all ${method==='telegram'?'bg-[#229ED9] text-white':'text-black/60'}`}>✈️ تيليجرام</button>
              <button onClick={()=>setMethod('google')} className={`flex-1 h-[40px] rounded-full text-[13px] font-bold transition-all ${method==='google'?'bg-black text-white':'text-black/60'}`}>G جوجل</button>
            </div>

            {method==='google' ? (
              <div className="mt-8 space-y-4">
                <div id="googleBtn" className="flex justify-center"></div>
              </div>
            ) : (
              <div className="mt-8">
                {!codeSent ? (
                  <div className="space-y-5">
                    <div>
                      <label className="text-[11px] font-bold">رقم الهاتف <span className="text-red-500">*</span> <span className="text-[10px] opacity-50">(ضروري)</span></label>
                      <div className="mt-2 flex gap-2">
                        <div className="h-[56px] px-4 rounded-[14px] border border-black/10 bg-[#FAFAF8] flex items-center text-[13px] font-bold">🇱🇾 +218</div>
                        <input 
                          value={phone} 
                          onChange={e=>{
                            const v = e.target.value.replace(/\D/g,'')
                            setPhone(v)
                            if(v.length >= 9) setPhoneError('')
                          }}
                          onBlur={validatePhone}
                          placeholder="912345678" 
                          className={`flex-1 h-[56px] rounded-[14px] border px-4 text-[15px] outline-none transition-all ${phoneError ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-black/10 focus:border-[#229ED9]'}`}
                          autoFocus
                        />
                      </div>
                      {phoneError ? (
                        <div className="mt-2 text-[11px] text-red-600 font-bold flex items-center gap-1">⚠️ {phoneError}</div>
                      ) : (
                        <div className="mt-2 text-[10px] opacity-50">مثال: 91xxxxxxx - لازم رقم تيليجرام الحقيقي</div>
                      )}
                    </div>

                    <button 
                      onClick={sendTelegramCode} 
                      disabled={sending || phone.replace(/\D/g,'').length < 9} 
                      className="w-full h-[56px] rounded-full bg-[#229ED9] text-white text-[15px] font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C8BC0] transition-colors"
                    >
                      {sending ? 'جاري الإرسال...' : 'إرسال الكود على تيليجرام ✈️'}
                    </button>

                    <div className="p-3 rounded-[12px] bg-[#F0F9FF] border border-[#229ED9]/20 text-[11px] leading-5">
                      💡 الكود حيوصلك في بوت <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" className="text-[#229ED9] font-bold underline">@{BOT_USERNAME}</a> - دوس /start قبل
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold">كود تيليجرام - 6 أرقام</label>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">انبعت لـ +218{phone}</span>
                    </div>

                    <div className="mt-3 p-3 rounded-[12px] bg-green-50 border border-green-200 text-[11px]">
                      ✅ شوف تيليجرام - الكود انبعت لرقم <b>+218{phone}</b>
                    </div>

                    <div className="mt-4 flex gap-2 justify-center" dir="ltr">
                      {code.map((c,i)=>(
                        <input key={i} ref={el=>refs.current[i]=el} value={c} onChange={e=>{ const v=e.target.value.replace(/\D/g,''); const n=[...code]; n[i]=v; setCode(n); if(v && i<5) refs.current[i+1]?.focus(); if(n.join('').length===6 && generatedCode && n.join('')===generatedCode){ setTimeout(()=>{ localStorage.setItem('rafeaq_user', '+218'+phone); nav('/dashboard') },200) } }} maxLength={1} className="w-[48px] h-[56px] rounded-[12px] border border-black/10 text-center text-[18px] font-bold outline-none focus:border-[#229ED9]" />
                      ))}
                    </div>

                    <button onClick={verifyCode} className="w-full mt-5 h-[52px] rounded-full bg-black text-white font-bold">تأكيد الكود ✓</button>
                    <button onClick={()=>{ setCodeSent(false); setCode(['','','','','','']) }} className="w-full mt-2 h-[44px] rounded-full border border-black/10 text-[12px]">تعديل الرقم ← {phone}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}