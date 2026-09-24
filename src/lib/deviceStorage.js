// src/lib/deviceStorage.js
// التخزين المحلي الرسمي لمنصة رفيق - IndexedDB + localStorage fallback
// يدعم: notebook (دفتر رفيق), vault (خزنة), library

const DB_NAME = 'RafeaqDB'
const DB_VERSION = 2
const STORES = ['notebook', 'vault', 'library', 'files']

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' })
          store.createIndex('name', 'name', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// حفظ ملف
export async function saveDeviceFile(file, storeName = 'vault', extra = {}) {
  const db = await openDB()
  const text = extra.text || null
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const record = {
      id: Date.now().toString() + '_' + Math.random().toString(36).slice(2, 8),
      name: file.name,
      size: file.size,
      type: file.type,
      blob: file,
      text: text, // نص PDF المستخرج
      pagesHint: extra.pagesHint || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...extra
    }
    // لـ notebook نحفظ النص للبحث
    if (text) record.searchText = text.slice(0, 20000) // اول 20k حرف للبحث
    store.put(record)
    tx.oncomplete = () => resolve(record)
    tx.onerror = () => reject(tx.error)
  })
}

// قراءة كل الملفات من مخزن معين
export async function listDeviceFiles(storeName = 'vault') {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => {
      // نحول Blob لـ metadata فقط للعرض
      const files = req.result.map((r) => ({
        id: r.id,
        name: r.name,
        size: r.size,
        type: r.type,
        createdAt: r.createdAt,
        text: r.text ? r.text.slice(0, 500) : null, // ملخص
        fullText: r.text || null, // النص الكامل للبحث
        pagesHint: r.pagesHint
      }))
      resolve(files)
    }
    req.onerror = () => reject(req.error)
  })
}

// قراءة ملف واحد كامل مع Blob
export async function getDeviceFile(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    // نبحث في كل المخازن
    let found = null
    let checked = 0
    STORES.forEach((storeName) => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const req = store.get(id)
      req.onsuccess = () => {
        if (req.result) found = req.result
        checked++
        if (checked === STORES.length) {
          if (found) resolve(found)
          else reject(new Error('File not found'))
        }
      }
      req.onerror = () => {
        checked++
        if (checked === STORES.length && !found) reject(new Error('File not found'))
      }
    })
  })
}

// حذف ملف
export async function deleteDeviceFile(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    let deleted = false
    let checked = 0
    STORES.forEach((storeName) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const req = store.delete(id)
      req.onsuccess = () => { deleted = true }
      tx.oncomplete = () => {
        checked++
        if (checked === STORES.length) resolve(deleted)
      }
      tx.onerror = () => {
        checked++
        if (checked === STORES.length) resolve(deleted)
      }
    })
  })
}

// استخراج نص من PDF في المتصفح
export async function extractPdfText(file) {
  // نستخدم مكتبة pdf.js لو متوفرة، والا نرجع null ونحفظ الملف فقط
  try {
    // dynamic import لـ pdfjs
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items.map((item) => item.str).join(' ')
      fullText += pageText + '\n\n'
    }
    return fullText.trim()
  } catch (e) {
    console.log('PDF.js غير متوفر، نحفظ الملف بدون نص:', e.message)
    // fallback: نرجع اسم الملف كنص مؤقت
    return 'محتوى الملف: ' + file.name + ' - ' + Math.round(file.size/1024) + ' KB'
  }
}

// البحث في المصادر (لـ Notebook)
export function answerFromSources(question, sources) {
  if (!sources || !sources.length) return { text: 'لا توجد مصادر. أضف PDF أولا.', citations: [] }
  const q = question.toLowerCase()
  const keywords = q.split(/\s+/).filter((w) => w.length > 2)
  
  let bestMatch = null
  let bestScore = 0
  let allMatches = []

  sources.forEach((src) => {
    const text = (src.fullText || src.text || '').toLowerCase()
    if (!text) return
    let score = 0
    keywords.forEach((kw) => {
      const matches = (text.match(new RegExp(kw, 'g')) || []).length
      score += matches
    })
    if (score > 0) {
      allMatches.push({ source: src, score, text: src.fullText || src.text })
      if (score > bestScore) {
        bestScore = score
        bestMatch = { source: src, text: src.fullText || src.text }
      }
    }
  })

  if (!bestMatch) {
    // لو ما لقاش تطابق، يرجع اول 500 حرف من اول مصدر
    const first = sources[0]
    const txt = first.fullText || first.text || ''
    return {
      text: txt.slice(0, 800) + (txt.length > 800 ? '...' : ''),
      citations: [first.name]
    }
  }

  // يطلع الفقرة اللي فيها الكلمات المفتاحية
  const fullText = bestMatch.text
  const lowerText = fullText.toLowerCase()
  let bestIndex = 0
  keywords.forEach((kw) => {
    const idx = lowerText.indexOf(kw)
    if (idx !== -1 && (bestIndex === 0 || idx < bestIndex)) bestIndex = idx
  })
  const start = Math.max(0, bestIndex - 200)
  const end = Math.min(fullText.length, bestIndex + 800)
  const snippet = fullText.slice(start, end)

  return {
    text: snippet + (end < fullText.length ? '...' : ''),
    citations: allMatches.slice(0, 3).map((m) => m.source.name)
  }
}

// مسح كل التخزين (للتطوير)
export async function clearAllDeviceStorage() {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORES, 'readwrite')
    STORES.forEach((name) => {
      if (db.objectStoreNames.contains(name)) tx.objectStore(name).clear()
    })
    tx.oncomplete = () => resolve(true)
  })
}