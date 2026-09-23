import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString()

const DB_NAME = 'rafeaq-device-library'
const STORE = 'files'

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function request(store, mode, action) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const result = action(transaction.objectStore(STORE))
    result.onsuccess = () => resolve(result.result)
    result.onerror = () => reject(result.error)
  }))
}

export async function extractPdfText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const document = await pdfjsLib.getDocument({ data: bytes }).promise
  const pages = Math.min(document.numPages, 120)
  const parts = []
  for (let pageNumber = 1; pageNumber <= pages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    parts.push(content.items.map((item) => item.str).join(' '))
  }
  return parts.join('\n').replace(/\s+/g, ' ').trim().slice(0, 180000)
}

export async function saveDeviceFile(file, area, details = {}) {
  const item = {
    id: crypto.randomUUID(), name: file.name, type: file.type || 'application/octet-stream',
    size: file.size, area, blob: file, createdAt: Date.now(), ...details
  }
  await request(STORE, 'readwrite', (store) => store.put(item))
  return item
}

export async function listDeviceFiles(area) {
  const files = await request(STORE, 'readonly', (store) => store.getAll())
  return files.filter((file) => file.area === area).sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteDeviceFile(id) {
  return request(STORE, 'readwrite', (store) => store.delete(id))
}

export async function getDeviceFile(id) {
  return request(STORE, 'readonly', (store) => store.get(id))
}

const stopWords = new Set(['من','في','على','الى','إلى','عن','ما','ماذا','كيف','هل','هذا','هذه','التي','الذي','ثم','مع','بعد','قبل'])
export function answerFromSources(question, sources) {
  const terms = question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter((term) => !stopWords.has(term)) || []
  const sentences = sources.flatMap((source) => (source.text || '').split(/(?<=[.!؟])\s+/).map((text) => ({ text, source: source.name })))
  const ranked = sentences.map((entry) => ({ ...entry, score: terms.reduce((score, term) => score + (entry.text.toLowerCase().includes(term) ? 1 : 0), 0) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 4)
  if (!ranked.length) return { text: 'لم أجد إجابة مباشرة في المصادر المرفوعة. جرّب صياغة السؤال بكلمات من الدرس أو أضف المصدر المناسب.', citations: [] }
  return { text: ranked.map((entry) => entry.text).join('\n\n'), citations: [...new Set(ranked.map((entry) => entry.source))] }
}