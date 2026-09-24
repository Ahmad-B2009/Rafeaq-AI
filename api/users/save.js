// api/users/save.js - يحفظ المستخدمين بدون لابتوب ثاني
// يدعم: Supabase (مجاني 500MB) -> Vercel KV -> JSON file fallback

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false })

  try {
    const { email, phone, name, picture, method, token } = req.body
    const identifier = email || phone
    if (!identifier) return res.json({ success: false, message: 'email أو phone مطلوب' })

    // 1. حاول Supabase أولا (أفضل خيار مجاني)
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        
        // تأكد من وجود الجدول
        const { data, error } = await supabase
          .from('users')
          .upsert({
            email: email || null,
            phone: phone || null,
            name: name || 'مستخدم',
            picture: picture || null,
            method: method || 'gmail',
            token: token || null,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: email ? 'email' : 'phone' })
          .select()

        if (!error) {
          return res.json({ success: true, user: data?.[0], provider: 'supabase' })
        }
        console.log('Supabase error:', error.message)
      } catch (e) {
        console.log('Supabase failed, trying fallback:', e.message)
      }
    }

    // 2. حاول Vercel KV (Upstash Redis - مجاني 10k طلب/يوم)
    const KV_URL = process.env.KV_REST_API_URL
    const KV_TOKEN = process.env.KV_REST_API_TOKEN
    if (KV_URL && KV_TOKEN) {
      try {
        const { kv } = await import('@vercel/kv')
        const key = `user:${identifier}`
        await kv.set(key, { email, phone, name, picture, method, token, lastLogin: new Date().toISOString() })
        const user = await kv.get(key)
        return res.json({ success: true, user, provider: 'vercel-kv' })
      } catch (e) {
        console.log('KV failed:', e.message)
      }
    }

    // 3. Fallback: ملف JSON محلي (يشتغل حتى بدون أي خدمة)
    const fs = await import('fs')
    const path = await import('path')
    const dbPath = path.join(process.cwd(), 'rafeaq.db.json')
    let db = { users: [], sessions: [], logs: [] }
    try {
      if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    } catch {}

    let user = db.users.find(u => (email && u.email === email) || (phone && u.phone === phone))
    if (user) {
      user.lastLogin = new Date().toISOString()
      if (name) user.name = name
      if (token) user.token = token
    } else {
      user = {
        id: 'user_' + Date.now(),
        email: email || null,
        phone: phone || null,
        name: name || 'مستخدم',
        picture: picture || null,
        method: method || 'gmail',
        token: token || null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
      db.users.push(user)
    }
    if (token) {
      db.sessions = db.sessions.filter(s => s.userId !== user.id)
      db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() })
    }
    db.logs.push({ type: 'login', identifier, time: new Date().toISOString() })
    
    // حاول تكتب الملف، لو فشل (Vercel readonly) احفظ في /tmp
    try {
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
    } catch {
      try {
        const tmpPath = '/tmp/rafeaq.db.json'
        fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2))
      } catch {}
    }

    return res.json({ success: true, user, provider: 'json-file' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ success: false, error: e.message })
  }
}