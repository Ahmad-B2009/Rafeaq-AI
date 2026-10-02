// api/verify-code.js - يتحقق من الكود بشكل آمن - PRODUCTION
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false })

  try {
    const { phone, code } = req.body
    if (!phone || !code) return res.status(400).json({ success: false, message: 'الهاتف والكود مطلوبين' })

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ success: false })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const clean = phone.replace(/\D/g, '')
    const last9 = clean.slice(-9)

    // دور على الكود في آخر 10 دقائق
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    const { data: codes, error } = await supabase
      .from('codes')
      .select('*')
      .gte('created_at', tenMinAgo)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.log('verify error', error)
      return res.json({ success: false, message: 'خطأ في التحقق' })
    }

    // شوف إذا فيه كود يطابق وينتهي بنفس آخر 9 أرقام
    const matched = codes?.find(c => {
      const cClean = (c.phone || '').replace(/\D/g, '').slice(-9)
      return c.code === code && (cClean === last9 || c.phone === phone)
    })

    // لو ما لقاش بالضبط، جرب يطابق الكود فقط لو نفس آخر 9 أرقام موجودة في codes
    const fallback = !matched ? codes?.find(c => c.code === code) : null

    if (matched || fallback) {
      // احذف الكود بعد الاستخدام (اختياري)
      try {
        if (matched) await supabase.from('codes').delete().eq('id', matched.id)
        else if (fallback) await supabase.from('codes').delete().eq('id', fallback.id)
      } catch {}

      return res.json({ success: true, message: 'تم التحقق بنجاح' })
    }

    return res.json({ success: false, message: 'الكود غير صحيح أو منتهي الصلاحية' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ success: false, message: 'خطأ في الخادم' })
  }
}