export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'url required' })

  try {
    const r = await fetch(url)
    if (!r.ok) throw new Error('fetch failed')
    const buf = Buffer.from(await r.arrayBuffer())
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/pdf')
    res.setHeader('Content-Length', buf.length)
    return res.send(buf)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}