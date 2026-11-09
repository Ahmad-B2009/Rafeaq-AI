// src/lib/notebookParser.js
// محرك استخراج وتحليل وتقسيم النصوص والبحث الدلالي لدفتر رفيق AI
// يدعم: PDF (صفحة بصفحة)، DOCX، TXT، MD، HTML، ولصق النصوص المباشر

/* ==================== التطبيع اللغوي العربي ==================== */
export function normalizeArabic(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // إزالة التشكيل والتطويل
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
}

export function tokenizeArabic(text = '') {
  return normalizeArabic(text)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => (w.startsWith('ال') && w.length > 4 ? w.slice(2) : w))
    .filter((w) => w.length > 2)
}

/* ==================== تقطيع النصوص (Chunking) ==================== */
export function chunkText(rawText, chunkSize = 950, overlap = 150) {
  const paragraphs = String(rawText || '')
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const chunks = []
  let currentChunk = ''

  for (const para of paragraphs) {
    if (currentChunk && (currentChunk + ' ' + para).length > chunkSize) {
      chunks.push(currentChunk.trim())
      // احتساب التداخل (overlap) للحفاظ على ترابط المعنى
      const words = currentChunk.split(' ')
      currentChunk = words.slice(-Math.min(15, words.length)).join(' ') + ' ' + para
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${para}` : para
    }
  }

  if (currentChunk.trim().length > 25) {
    chunks.push(currentChunk.trim())
  }

  return chunks.map((text, idx) => ({
    part: idx + 1,
    page: null,
    text,
  }))
}

/* ==================== استخراج نصوص PDF ==================== */
export async function extractPdf(blob, onProgress = null) {
  try {
    const pdfjs = await import('pdfjs-dist')
    const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
    pdfjs.GlobalWorkerOptions.workerSrc = worker

    const arrayBuffer = await blob.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    const chunks = []
    const totalPages = pdf.numPages

    for (let p = 1; p <= totalPages; p++) {
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()

      // NFKC يحوّل أشكال الحروف العربية الخاصة إلى حروف قياسية
      const text = content.items
        .map((item) => item.str)
        .join(' ')
        .normalize('NFKC')
        .replace(/\s+/g, ' ')
        .trim()

      if (text.length > 20) {
        // تقسيم الصفحة إلى أجزاء إن كانت طويلة جداً
        const step = 1000
        for (let i = 0; i < text.length; i += step) {
          const slice = text.slice(i, i + step + 150)
          if (slice.trim().length > 30) {
            chunks.push({ page: p, text: slice.trim() })
          }
        }
      }

      onProgress?.(Math.round((p / totalPages) * 100))
    }

    if (!chunks.length) {
      throw new Error('لم يتم العثور على نصوص قابلة للقراءة داخل ملف PDF (قد يكون مصوراً أو محمياً).')
    }

    return { chunks, pageCount: totalPages }
  } catch (err) {
    console.error('PDF extraction error:', err)
    throw new Error(err.message || 'تعذر استخراج النص من ملف PDF.')
  }
}

/* ==================== استخراج نصوص Word (DOCX) ==================== */
export async function extractDocx(file, onProgress = null) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('المتصفح لا يدعم فك ضغط ملفات Word مباشرة. يرجى حفظ الملف كـ PDF أو TXT.')
  }

  try {
    const buf = await file.arrayBuffer()
    const view = new DataView(buf)
    const bytes = new Uint8Array(buf)

    let eocd = -1
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocd = i
        break
      }
    }
    if (eocd < 0) throw new Error('ملف Word غير صالح أو تالف.')

    const count = view.getUint16(eocd + 10, true)
    let p = view.getUint32(eocd + 16, true)
    const dec = new TextDecoder()

    for (let n = 0; n < count; n++) {
      if (view.getUint32(p, true) !== 0x02014b50) break

      const method = view.getUint16(p + 10, true)
      const csize = view.getUint32(p + 20, true)
      const nameLen = view.getUint16(p + 28, true)
      const extraLen = view.getUint16(p + 30, true)
      const commLen = view.getUint16(p + 32, true)
      const local = view.getUint32(p + 42, true)
      const fname = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen))
      p += 46 + nameLen + extraLen + commLen

      if (fname === 'word/document.xml') {
        const lNameLen = view.getUint16(local + 26, true)
        const lExtraLen = view.getUint16(local + 28, true)
        const start = local + 30 + lNameLen + lExtraLen
        const raw = bytes.subarray(start, start + csize)

        let xmlBytes = raw
        if (method === 8) {
          const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
          xmlBytes = new Uint8Array(await new Response(stream).arrayBuffer())
        }

        const text = dec
          .decode(xmlBytes)
          .replace(/<\/w:p>/g, '\n')
          .replace(/<w:tab\/>/g, ' ')
          .replace(/<w:br\/>/g, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, '&')

        onProgress?.(100)
        const chunks = chunkText(text)
        return { chunks, pageCount: Math.ceil(chunks.length / 3) }
      }
    }

    throw new Error('تعذر العثور على محتوى النص داخل ملف Word.')
  } catch (err) {
    throw new Error(err.message || 'فشل في قراءة مستند Word.')
  }
}

/* ==================== معالجة أي نوع ملف مدعوم ==================== */
export async function parseDocumentFile(file, onProgress = null) {
  const name = (file.name || '').toLowerCase()
  const mime = file.type || ''

  if (name.endsWith('.pdf') || mime === 'application/pdf') {
    return extractPdf(file, onProgress)
  }

  if (name.endsWith('.docx')) {
    onProgress?.(30)
    return extractDocx(file, onProgress)
  }

  if (/\.html?$/.test(name) || mime.includes('html')) {
    const raw = await file.text()
    const cleaned = raw
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
    onProgress?.(100)
    const chunks = chunkText(cleaned)
    return { chunks, pageCount: Math.ceil(chunks.length / 3) }
  }

  if (/\.(txt|md|csv|json|srt|log)$/.test(name) || mime.startsWith('text/')) {
    const text = await file.text()
    onProgress?.(100)
    const chunks = chunkText(text)
    return { chunks, pageCount: Math.ceil(chunks.length / 3) }
  }

  throw new Error('نوع الملف غير مدعوم. الأنواع المدعومة: PDF، Word (docx)، TXT، Markdown، HTML، CSV.')
}

/* ==================== البحث والاسترجاع المعتمد على السياق (RAG) ==================== */
export function findRelevantChunks(query, sourcesPool, maxChunks = 6) {
  if (!sourcesPool || !sourcesPool.length) return []
  const qTokens = [...new Set(tokenizeArabic(query))]

  // إذا لم توجد كلمات مفتاحية واضحة، نأخذ مقاطع موزعة من المصادر
  if (!qTokens.length) {
    return sourcesPool.slice(0, maxChunks)
  }

  const scored = sourcesPool.map((item) => {
    const normalized = normalizeArabic(item.text)
    let score = 0

    // حساب تكرار ومطابقة كل كلمة مفتاحية
    qTokens.forEach((kw) => {
      if (normalized.includes(kw)) {
        score += 2
        // نقاط إضافية إذا كانت الكلمة مطابقة ككلمة مستقلة
        const regex = new RegExp(`\\b${kw}\\b`, 'gu')
        const matches = (normalized.match(regex) || []).length
        score += matches
      }
    })

    return { item, score }
  })

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map((x) => x.item)
}

/* ==================== اكتشاف التعارض والتناقض بين المصادر ==================== */
export function detectConflictsBetweenSources(topic, sourcesData) {
  // مصادر بيانات تحوي المصدر والمقاطع
  if (!sourcesData || sourcesData.length < 2) {
    return {
      hasConflict: false,
      message: 'يتطلب اكتشاف التعارض وجود مصدرين مختلفين على الأقل في الدفتر.',
      comparisons: [],
    }
  }

  const qTokens = tokenizeArabic(topic)
  const sourceMatches = sourcesData.map((src) => {
    const matched = (src.chunks || []).filter((ch) => {
      const norm = normalizeArabic(ch.text)
      return qTokens.some((tok) => norm.includes(tok))
    })
    return {
      sourceId: src.id,
      title: src.title,
      matches: matched.slice(0, 3),
    }
  }).filter((s) => s.matches.length > 0)

  if (sourceMatches.length < 2) {
    return {
      hasConflict: false,
      message: `لم نجد بيانات كافية حول «${topic}» في كلا المصدرين لإجراء مقارنة دقيقة.`,
      comparisons: [],
    }
  }

  // بناء مقارنة هيكلية واضحة
  const comparisons = []
  for (let i = 0; i < sourceMatches.length - 1; i++) {
    for (let j = i + 1; j < sourceMatches.length; j++) {
      const srcA = sourceMatches[i]
      const srcB = sourceMatches[j]

      comparisons.push({
        topic,
        sourceA: {
          title: srcA.title,
          page: srcA.matches[0]?.page || 'غير محدد',
          excerpt: srcA.matches[0]?.text.slice(0, 320) + '...',
        },
        sourceB: {
          title: srcB.title,
          page: srcB.matches[0]?.page || 'غير محدد',
          excerpt: srcB.matches[0]?.text.slice(0, 320) + '...',
        },
        analysis: `المصدران يتناولان «${topic}» من زاويتين مختلفتين، راجع المقتطفين أدناه للتحقق من أصل المعلومة وسياقها.`,
      })
    }
  }

  return {
    hasConflict: true,
    comparisons,
  }
}
