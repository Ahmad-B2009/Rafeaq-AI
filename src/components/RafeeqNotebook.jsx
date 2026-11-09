// src/components/RafeeqNotebook.jsx
// تطبيق دفتر رفيق – Rafeeq Notebook (مساحة التعلم والبحث الذكي المعتمد على المصادر)
// بهوية رفيق أتيلييه اللؤلؤية (Pearl White, Atelier Purple & Cyan)
// يدعم: تعدد الدفاتر، معالجة PDF والملفات صفحة بصفحة، الاستشهادات التفاعلية، المحادثة الصوتية الحية،
// أوضاع التعلم الـ 5 (اشرح لي، اختبرني، ناقشني، لخّص لي، اربط المعلومات)، واكتشاف التعارض بين المصادر.

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../os/icons'
import { speak, pauseVoice, resumeVoice, voiceAvailable } from '../lib/boardVoice'
import {
  listNotebooks,
  createNotebook,
  updateNotebook,
  deleteNotebook,
  getActiveNotebookId,
  setActiveNotebookId,
  addSourceToNotebook,
  removeSourceFromNotebook,
  getNotebookSources,
  getSourceChunks,
  saveNotebookArtifact,
  deleteNotebookArtifact,
  saveNotebookMessages,
} from '../lib/notebookStorage'
import {
  parseDocumentFile,
  chunkText,
  findRelevantChunks,
  detectConflictsBetweenSources,
} from '../lib/notebookParser'

export default function RafeeqNotebook({ onClose = null, onToast = null }) {
  const navigate = useNavigate()

  // حالة الدفاتر
  const [notebooks, setNotebooks] = useState(() => listNotebooks())
  const [currentNbId, setCurrentNbId] = useState(() => getActiveNotebookId())
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [nbTitleDraft, setNbTitleDraft] = useState('')

  // الدفتر النشط حالياً
  const currentNb = useMemo(() => {
    return notebooks.find((n) => n.id === currentNbId) || notebooks[0] || null
  }, [notebooks, currentNbId])

  // مصادر الدفتر النشط
  const [sources, setSources] = useState([])
  const [selectedSourceIds, setSelectedSourceIds] = useState([])
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null) // { fileName, percent }

  // محادثة الدفتر
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // أوضاع التعلم الذكية النشطة
  const [learningMode, setLearningMode] = useState('chat') // 'chat' | 'explain' | 'quiz' | 'socratic' | 'summary' | 'connect' | 'conflict'

  // استوديو المخرجات والملاحظات
  const [activeStudioTab, setActiveStudioTab] = useState('notes') // 'notes' | 'summaries' | 'quizzes' | 'conflicts'
  const [artifacts, setArtifacts] = useState([])
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)

  // المحادثة الصوتية الحية
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [voiceSpeaking, setVoiceSpeaking] = useState(false)
  const [voiceListening, setVoiceListening] = useState(false)
  const [spokenCaption, setSpokenCaption] = useState('')

  // عارض الاستشهادات والمقتطفات
  const [activeCitation, setActiveCitation] = useState(null)
  const [previewSource, setPreviewSource] = useState(null)

  // نوافذ إضافة المصادر
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')

  // تصفية وعرض الموبايل
  const [mobileTab, setMobileTab] = useState('chat') // 'sources' | 'chat' | 'studio'
  const [sourceSearch, setSourceSearch] = useState('')

  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  const currentVoiceRef = useRef(null)

  const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

  const notify = useCallback((msg) => {
    if (typeof onToast === 'function') onToast(msg)
  }, [onToast])

  // تحديث مصادر ومحتوى الدفتر عند تغييره
  const loadNotebookData = useCallback(async (nb) => {
    if (!nb) return
    setSourcesLoading(true)
    try {
      const srcs = await getNotebookSources(nb.id)
      setSources(srcs)
      setSelectedSourceIds(srcs.filter((s) => s.status === 'ready').map((s) => s.id))
      setMessages(nb.messages || [])
      setArtifacts(nb.artifacts || [])
      setNbTitleDraft(nb.title)
    } catch (e) {
      console.error('Error loading notebook data:', e)
    } finally {
      setSourcesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentNb) {
      loadNotebookData(currentNb)
    }
  }, [currentNb, loadNotebookData])

  // التمرير التلقائي لأسفل المحادثة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  /* ==================== عمليات الدفاتر ==================== */
  const handleSelectNotebook = (id) => {
    setActiveNotebookId(id)
    setCurrentNbId(id)
    setIsEditingTitle(false)
  }

  const handleCreateNotebook = () => {
    const title = `دفتر دراسي ${notebooks.length + 1}`
    const newNb = createNotebook(title)
    const updated = listNotebooks()
    setNotebooks(updated)
    setCurrentNbId(newNb.id)
    notify(`تم إنشاء "${title}" بنجاح`)
  }

  const handleSaveTitle = () => {
    if (!nbTitleDraft.trim() || !currentNb) return
    updateNotebook(currentNb.id, { title: nbTitleDraft.trim() })
    setNotebooks(listNotebooks())
    setIsEditingTitle(false)
    notify('تم تحديث اسم الدفتر')
  }

  const handleDeleteNotebook = (id, e) => {
    e?.stopPropagation()
    if (notebooks.length <= 1) {
      notify('يجب أن تحتفظ بدفتر واحد على الأقل.')
      return
    }
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الدفتر وجميع مخرجاته؟')) return
    deleteNotebook(id)
    const updated = listNotebooks()
    setNotebooks(updated)
    setCurrentNbId(getActiveNotebookId())
    notify('تم حذف الدفتر.')
  }

  /* ==================== معالجة وإضافة المصادر ==================== */
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length || !currentNb) return

    for (const file of files) {
      setUploadProgress({ fileName: file.name, percent: 10 })
      try {
        const { chunks, pageCount } = await parseDocumentFile(file, (p) => {
          setUploadProgress({ fileName: file.name, percent: Math.max(10, p) })
        })

        const meta = {
          id: `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: file.name,
          type: file.name.split('.').pop()?.toLowerCase() || 'file',
          size: file.size,
          pageCount: pageCount || 1,
          status: 'ready',
        }

        await addSourceToNotebook(currentNb.id, meta, chunks, file)
        notify(`تمت فهرسة "${file.name}" (${chunks.length} مقطع) بنجاح`)
      } catch (err) {
        console.error('File parsing failed:', err)
        const failedMeta = {
          id: `src_fail_${Date.now()}`,
          title: file.name,
          type: 'failed',
          size: file.size,
          status: 'failed',
          errorMessage: err.message || 'تعذرت قراءة الملف.',
        }
        await addSourceToNotebook(currentNb.id, failedMeta, [])
        notify(`تعذر استخراج "${file.name}": ${err.message}`)
      } finally {
        setUploadProgress(null)
      }
    }

    loadNotebookData(currentNb)
  }

  const handlePasteText = async () => {
    if (!pasteContent.trim() || !currentNb) return
    const title = pasteTitle.trim() || `نص ملصق (${new Date().toLocaleTimeString('ar-SA')})`
    try {
      const chunks = chunkText(pasteContent.trim())
      const meta = {
        id: `paste_${Date.now()}`,
        title,
        type: 'text',
        size: new Blob([pasteContent]).size,
        pageCount: Math.ceil(chunks.length / 3),
        status: 'ready',
      }
      await addSourceToNotebook(currentNb.id, meta, chunks)
      setShowPasteModal(false)
      setPasteTitle('')
      setPasteContent('')
      notify(`تمت إضافة "${title}" كمصدر في الدفتر`)
      loadNotebookData(currentNb)
    } catch (err) {
      notify(err.message)
    }
  }

  const handleAddLink = async () => {
    if (!linkUrl.trim() || !currentNb) return
    const title = linkTitle.trim() || linkUrl.replace(/^https?:\/\//, '').slice(0, 30)
    try {
      // استخراج آمن للمحتوى النصي أو إضافته كمرجع
      const safeText = `رابط مرجعي: ${linkUrl}\nعنوان المصدر: ${title}\nتاريخ الإضافة: ${new Date().toLocaleDateString('ar-SA')}`
      const chunks = chunkText(safeText)
      const meta = {
        id: `link_${Date.now()}`,
        title,
        type: 'link',
        size: safeText.length,
        pageCount: 1,
        status: 'ready',
      }
      await addSourceToNotebook(currentNb.id, meta, chunks)
      setShowLinkModal(false)
      setLinkUrl('')
      setLinkTitle('')
      notify('تمت إضافة الرابط المرجعي بنجاح')
      loadNotebookData(currentNb)
    } catch (err) {
      notify(err.message)
    }
  }

  const handleDeleteSource = async (srcId, e) => {
    e?.stopPropagation()
    if (!currentNb) return
    await removeSourceFromNotebook(currentNb.id, srcId)
    setSources((prev) => prev.filter((s) => s.id !== srcId))
    setSelectedSourceIds((prev) => prev.filter((id) => id !== srcId))
    notify('تمت إزالة المصدر من الدفتر.')
  }

  const toggleSourceSelection = (srcId) => {
    setSelectedSourceIds((prev) =>
      prev.includes(srcId) ? prev.filter((id) => id !== srcId) : [...prev, srcId]
    )
  }

  const toggleAllSources = () => {
    const readyIds = sources.filter((s) => s.status === 'ready').map((s) => s.id)
    if (selectedSourceIds.length === readyIds.length) {
      setSelectedSourceIds([])
    } else {
      setSelectedSourceIds(readyIds)
    }
  }

  /* ==================== محرك المحادثة الذكية المعتمد على المصادر ==================== */
  const askNotebook = async (customQuery = null, overrideMode = null) => {
    const q = (customQuery || input).trim()
    if (!q || chatLoading || !currentNb) return

    const activeMode = overrideMode || learningMode

    // جمع المقاطع من المصادر المحددة فقط
    const targetSourceIds = selectedSourceIds.length > 0
      ? selectedSourceIds
      : sources.filter((s) => s.status === 'ready').map((s) => s.id)

    if (!targetSourceIds.length) {
      notify('يرجى تحديد أو رفع مصدر واحد على الأقل للبحث فيه.')
      return
    }

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: q,
      mode: activeMode,
      createdAt: new Date().toISOString(),
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setChatLoading(true)

    try {
      // 1. استخراج المقاطع من قاعدة IndexedDB للمصادر المحددة
      const pool = []
      for (const sId of targetSourceIds) {
        const srcMeta = sources.find((s) => s.id === sId)
        const chunks = await getSourceChunks(sId)
        chunks.forEach((ch) => {
          pool.push({
            sourceId: sId,
            title: srcMeta?.title || 'مصدر',
            page: ch.page || null,
            text: ch.text,
          })
        })
      }

      // 2. البحث الدلالي واسترجاع المقاطع الأكثر صلة بالسؤال
      const relevantChunks = findRelevantChunks(q, pool, 6)

      if (!relevantChunks.length) {
        const noAnsMessage = {
          id: `msg_ans_${Date.now()}`,
          role: 'assistant',
          text: 'لم أجد في مصادرك المحددة ما يتعلق بهذا السؤال بدقة. تأكد من تحديد المصدر المناسب أو جرّب صياغة أخرى.',
          cites: [],
          createdAt: new Date().toISOString(),
        }
        const updatedMsgs = [...nextMessages, noAnsMessage]
        setMessages(updatedMsgs)
        saveNotebookMessages(currentNb.id, updatedMsgs)
        return
      }

      // تجهيز السياق المرقم مع ذكر الصفحات
      const context = relevantChunks.map((c, i) => ({
        n: i + 1,
        title: c.title,
        page: c.page,
        text: c.text,
      }))

      // صياغة السؤال وفق وضع التعلم المختار
      let modeInstruction = ''
      if (activeMode === 'explain') {
        modeInstruction = ' [الوضع: اشرح لي - فكك المفهوم تدريجياً من الأساسيات، واشرح المصطلحات الصعبة، وقدم أمثلة مستندة للمصادر فقط]'
      } else if (activeMode === 'quiz') {
        modeInstruction = ' [الوضع: اختبرني - اطرح سؤالاً واحداً محدداً من المصادر مع خيارات متعددة، وانتظر إجابة الطالب]'
      } else if (activeMode === 'socratic') {
        modeInstruction = ' [الوضع: ناقشني - حاور الطالب بأسلوب سقراطي توجيهي، ولا تعطه الحل كاملاً بل سؤلاً يجعله يستنتج بنفسه]'
      } else if (activeMode === 'summary') {
        modeInstruction = ' [الوضع: لخّص لي - أرجع ملخصاً فائق التنظيم يتضمن الأفكار الرئيسية والتعريفات والقوانين والمعادلات والنتائج]'
      } else if (activeMode === 'connect') {
        modeInstruction = ' [الوضع: اربط المعلومات - استخرج شبكة العلاقات والمقارنات بين المفاهيم في المصادر المختلفة]'
      }

      // 3. استدعاء نموذج الذكاء الاصطناعي مع توجيه الالتزام بالمصادر
      const token = localStorage.getItem('rafeaq_token')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: q + modeInstruction,
          mode: 'notebook',
          role: 'student',
          context,
          history: nextMessages.slice(-6).map((m) => ({ role: m.role, content: m.text })),
          student: {
            name: localStorage.getItem('rafeaq_name') || '',
            class: localStorage.getItem('rafeaq_student_class') || '',
          },
        }),
      })

      const data = await res.json().catch(() => null)
      const replyText = data?.reply || data?.text || 'عذراً، لم أتمكن من استخلاص إجابة من الخادم الآن.'

      const assistantMessage = {
        id: `msg_ans_${Date.now()}`,
        role: 'assistant',
        text: replyText,
        cites: context.map((c) => ({
          n: c.n,
          title: c.title,
          page: c.page,
          excerpt: c.text.slice(0, 400),
        })),
        createdAt: new Date().toISOString(),
      }

      const updatedMsgs = [...nextMessages, assistantMessage]
      setMessages(updatedMsgs)
      saveNotebookMessages(currentNb.id, updatedMsgs)

      // إن كانت المحادثة الصوتية مفعلة، ينطق الرد
      if (isVoiceActive && voiceAvailable()) {
        playVoiceReply(replyText)
      }
    } catch (err) {
      console.error('Notebook query error:', err)
      const errMsg = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        error: true,
        text: 'تعذر الاتصال بالذكاء الاصطناعي للحصول على الإجابة من المصادر. تأكد من اتصال الإنترنت.',
        createdAt: new Date().toISOString(),
      }
      const updatedMsgs = [...nextMessages, errMsg]
      setMessages(updatedMsgs)
      saveNotebookMessages(currentNb.id, updatedMsgs)
    } finally {
      setChatLoading(false)
    }
  }

  /* ==================== المحادثة الصوتية الحية (Voice Conversation) ==================== */
  const startVoiceMode = () => {
    setIsVoiceActive(true)
    notify('تم تفعيل المحادثة الصوتية. تحدث وسيجيب رفيق من مصادرك')
    startListening()
  }

  const stopVoiceMode = () => {
    setIsVoiceActive(false)
    setVoiceSpeaking(false)
    setVoiceListening(false)
    setSpokenCaption('')
    speechRecognitionRef.current?.stop()
    currentVoiceRef.current?.cancel()
    window.speechSynthesis?.cancel?.()
  }

  const startListening = () => {
    if (!SR) {
      notify('المتصفح لا يدعم التسجيل الصوتي المباشر.')
      return
    }
    try {
      const r = new SR()
      r.lang = 'ar-SA'
      r.interimResults = false
      r.onstart = () => setVoiceListening(true)
      r.onresult = (ev) => {
        const text = ev.results[0][0].transcript
        setVoiceListening(false)
        if (text.trim()) {
          askNotebook(text.trim())
        }
      }
      r.onerror = () => setVoiceListening(false)
      r.onend = () => setVoiceListening(false)
      speechRecognitionRef.current = r
      r.start()
    } catch {
      setVoiceListening(false)
    }
  }

  const playVoiceReply = (text) => {
    setVoiceSpeaking(true)
    setSpokenCaption(text)
    const sp = speak(text, {
      teacher: { name: 'رفيق', rate: 1.0, pitch: 1.0 },
    })
    currentVoiceRef.current = sp
    sp.done.then(() => {
      setVoiceSpeaking(false)
      // يعود للاستماع بعد إتمام النطق إن كان وضع الصوت نشطاً
      if (isVoiceActive) {
        setTimeout(startListening, 600)
      }
    })
  }

  const handleInterruptVoice = () => {
    currentVoiceRef.current?.cancel()
    window.speechSynthesis?.cancel?.()
    setVoiceSpeaking(false)
    startListening()
  }

  /* ==================== أدوات اكتشاف التعارض والمخرجات ==================== */
  const handleRunConflictDetector = async () => {
    if (!currentNb || sources.length < 2) {
      notify('يتطلب كشف التعارض وجود مصدرين على الأقل في هذا الدفتر.')
      return
    }

    const topic = window.prompt('أدخل الموضوع أو المفهوم الذي ترغب في فحص تعارضه أو اختلافه بين المصادر:', 'تاريخ الحدث / قيمة الثابت / التعريف')
    if (!topic || !topic.trim()) return

    setChatLoading(true)
    try {
      const sourcesData = []
      for (const s of sources) {
        const chunks = await getSourceChunks(s.id)
        sourcesData.push({ id: s.id, title: s.title, chunks })
      }

      const result = detectConflictsBetweenSources(topic.trim(), sourcesData)
      setActiveStudioTab('conflicts')

      if (result.hasConflict) {
        saveNotebookArtifact(currentNb.id, {
          type: 'conflict',
          title: `مقارنة تعارض: ${topic}`,
          content: result.comparisons,
        })
        setArtifacts(currentNb.artifacts || [])
        notify('تم فحص المقاطع ورصد نقاط التباين بين المصادر بنجاح')
      } else {
        notify(result.message)
      }
    } finally {
      setChatLoading(false)
    }
  }

  const handleSaveNote = () => {
    if (!newNoteText.trim() || !currentNb) return
    const title = newNoteTitle.trim() || `ملاحظة (${new Date().toLocaleDateString('ar-SA')})`
    saveNotebookArtifact(currentNb.id, {
      type: 'note',
      title,
      content: newNoteText.trim(),
    })
    setNewNoteTitle('')
    setNewNoteText('')
    setShowAddNoteModal(false)
    setArtifacts([...(currentNb.artifacts || [])])
    notify('تم حفظ الملاحظة في الدفتر')
  }

  const handleSaveMessageAsNote = (msgText) => {
    if (!currentNb) return
    const title = `ملاحظة من محادثة الدفتر (${new Date().toLocaleTimeString('ar-SA')})`
    saveNotebookArtifact(currentNb.id, {
      type: 'note',
      title,
      content: msgText,
    })
    setArtifacts([...(currentNb.artifacts || [])])
    notify('تم نسخ الإجابة وحفظها في ملاحظات الدفتر')
  }

  const handleDeleteArtifact = (artId) => {
    if (!currentNb) return
    deleteNotebookArtifact(currentNb.id, artId)
    setArtifacts((prev) => prev.filter((a) => a.id !== artId))
    notify('تم حذف المخرج.')
  }

  /* ==================== الخروج الحتمي للوحة التحكم ==================== */
  const handleExit = () => {
    stopVoiceMode()
    if (typeof onClose === 'function') {
      onClose()
    } else {
      navigate('/dashboard')
    }
  }

  const filteredSources = useMemo(() => {
    if (!sourceSearch.trim()) return sources
    const q = sourceSearch.toLowerCase()
    return sources.filter((s) => s.title.toLowerCase().includes(q))
  }, [sources, sourceSearch])

  return (
    <div dir="rtl" className="rn-root">
      <style>{NOTEBOOK_CSS}</style>

      {/* ================= 1. الشريط العلوي اللؤلؤي ================= */}
      <header className="rn-header">
        <div className="rn-header-start">
          <button
            onClick={handleExit}
            className="rn-exit-btn"
            title="العودة للرئيسية"
            aria-label="العودة للرئيسية"
          >
            <Icon name="arrowRight" size={16} />
            <span>العودة للرئيسية</span>
          </button>

          {/* محدد الدفاتر الذكي */}
          <div className="rn-notebook-picker">
            <div className="rn-picker-badge">
              <Icon name="notebook" size={17} />
              {isEditingTitle ? (
                <div className="rn-title-edit-row">
                  <input
                    autoFocus
                    value={nbTitleDraft}
                    onChange={(e) => setNbTitleDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="rn-title-input"
                  />
                  <button onClick={handleSaveTitle} className="rn-check-btn" title="حفظ">
                    <Icon name="check" size={14} />
                  </button>
                </div>
              ) : (
                <div className="rn-title-display">
                  <strong>{currentNb?.title || 'دفتر رفيق'}</strong>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="rn-icon-inline-btn"
                    title="تعديل اسم الدفتر"
                  >
                    <Icon name="edit" size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* قائمة الدفاتر الأخرى والتبديل */}
            <select
              value={currentNbId}
              onChange={(e) => handleSelectNotebook(e.target.value)}
              className="rn-notebook-select"
              title="التبديل بين الدفاتر"
            >
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>
                  {nb.title} ({nb.sources?.length || 0} مصادر)
                </option>
              ))}
            </select>

            <button onClick={handleCreateNotebook} className="rn-add-nb-btn" title="إنشاء دفتر جديد">
              <Icon name="plus" size={13} />
              <span>دفتر جديد</span>
            </button>
          </div>
        </div>

        <div className="rn-header-end">
          {/* زر تفعيل المحادثة الصوتية المباشرة */}
          <button
            onClick={isVoiceActive ? stopVoiceMode : startVoiceMode}
            className={`rn-voice-toggle-btn ${isVoiceActive ? 'is-active' : ''}`}
            title="محادثة صوتية حية مع مصادرك"
          >
            <Icon name="mic" size={16} />
            <span>{isVoiceActive ? 'المحادثة الصوتية نشطة' : 'تحدث صوتياً'}</span>
            {isVoiceActive && (
              <span className="rn-live-pulse-dot" />
            )}
          </button>

          {/* تنقل الموبايل */}
          <div className="rn-mobile-nav-tabs">
            <button
              onClick={() => setMobileTab('sources')}
              className={`rn-m-tab ${mobileTab === 'sources' ? 'is-active' : ''}`}
            >
              المصادر ({sources.length})
            </button>
            <button
              onClick={() => setMobileTab('chat')}
              className={`rn-m-tab ${mobileTab === 'chat' ? 'is-active' : ''}`}
            >
              المحادثة
            </button>
            <button
              onClick={() => setMobileTab('studio')}
              className={`rn-m-tab ${mobileTab === 'studio' ? 'is-active' : ''}`}
            >
              الاستوديو ({artifacts.length})
            </button>
          </div>
        </div>
      </header>

      {/* ================= 2. مساحة العمل الثلاثية المتجاوبة ================= */}
      <div className="rn-workspace">
        {/* ================= أ. عمود المصادر (Sources Panel) ================= */}
        <aside className={`rn-panel-sources ${mobileTab === 'sources' ? 'm-show' : ''}`}>
          <div className="rn-panel-head">
            <div className="rn-panel-title">
              <Icon name="folder" size={17} />
              <span>المصادر المضافة</span>
              <span className="rn-count-pill">{sources.length}</span>
            </div>

            {sources.length > 1 && (
              <button onClick={toggleAllSources} className="rn-text-btn">
                {selectedSourceIds.length === sources.length ? 'إلغاء التحديد' : 'تحديد الكل'}
              </button>
            )}
          </div>

          {/* أزرار إضافة المستندات والنصوص */}
          <div className="rn-source-actions-grid">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md,.html,.csv"
              onChange={handleFileUpload}
              hidden
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rn-btn-primary"
              title="رفع ملف PDF، Word، TXT أو HTML"
            >
              <Icon name="plus" size={15} />
              <span>رفع ملفات</span>
            </button>

            <button
              onClick={() => setShowPasteModal(true)}
              className="rn-btn-subtle"
              title="لصق نص مباشر"
            >
              <Icon name="edit" size={14} />
              <span>لصق نص</span>
            </button>

            <button
              onClick={() => setShowLinkModal(true)}
              className="rn-btn-subtle"
              title="إضافة رابط مرجعي"
            >
              <Icon name="link" size={14} />
              <span>رابط</span>
            </button>
          </div>

          {/* شريط تقدم رفع ومعالجة الملفات */}
          {uploadProgress && (
            <div className="rn-upload-progress-card">
              <div className="rn-progress-info">
                <span className="rn-progress-name">{uploadProgress.fileName}</span>
                <span className="rn-progress-percent">{uploadProgress.percent}%</span>
              </div>
              <div className="rn-progress-track">
                <div
                  className="rn-progress-fill"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
              <span className="rn-progress-hint">جاري استخراج وفهرسة النصوص محلياً...</span>
            </div>
          )}

          {/* حقل تصفية المصادر */}
          {sources.length > 3 && (
            <div className="rn-search-box">
              <Icon name="search" size={14} />
              <input
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                placeholder="ابحث في أسماء المصادر..."
              />
            </div>
          )}

          {/* قائمة المصادر */}
          <div className="rn-sources-scroll thin-scroll">
            {sourcesLoading && !sources.length && (
              <div className="rn-loading-state">
                <span className="rn-spinner" />
                <p>جاري تحميل مصادر الدفتر...</p>
              </div>
            )}

            {!sourcesLoading && !sources.length && (
              <div className="rn-empty-sources">
                <div className="rn-empty-icon"><Icon name="book" size={24} /></div>
                <strong>لا توجد مصادر في هذا الدفتر بعد</strong>
                <p>
                  ارفع كتبك المنهجية (PDF)، أو ملفات Word، أو الصق نصوصاً. سيجيب رفيق عن أسئلتك استناداً إليها فقط وبأعلى دقة.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rn-btn-primary"
                >
                  <Icon name="plus" size={15} />
                  <span>ارفع أول كتاب أو مستند</span>
                </button>
              </div>
            )}

            {filteredSources.map((src) => {
              const isSelected = selectedSourceIds.includes(src.id)
              const isReady = src.status === 'ready'
              return (
                <div
                  key={src.id}
                  className={`rn-source-card ${isSelected ? 'is-selected' : ''} ${!isReady ? 'is-failed' : ''}`}
                  onClick={() => isReady && toggleSourceSelection(src.id)}
                >
                  <div className="rn-source-top">
                    <div className="rn-source-select-checkbox">
                      {isSelected && isReady && <Icon name="check" size={12} />}
                    </div>
                    <div className="rn-source-info">
                      <strong className="rn-source-title">{src.title}</strong>
                      <span className="rn-source-meta">
                        {src.type?.toUpperCase()} • {src.pageCount} {src.pageCount > 1 ? 'صفحات' : 'صفحة'}
                      </span>
                    </div>
                  </div>

                  {src.status === 'failed' && (
                    <div className="rn-source-error-msg">
                      <Icon name="warning" size={14} /> {src.errorMessage || 'تعذرت قراءة الملف.'}
                    </div>
                  )}

                  <div className="rn-source-card-footer">
                    {isReady && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          const chunks = await getSourceChunks(src.id)
                          setPreviewSource({ ...src, chunks })
                        }}
                        className="rn-preview-btn"
                        title="معاينة صفحات ومقاطع هذا المصدر"
                      >
                        <Icon name="page" size={13} />
                        <span>معاينة المقاطع</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDeleteSource(src.id, e)}
                      className="rn-delete-source-btn"
                      title="إزالة المصدر من الدفتر"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ================= ب. عمود المحادثة والأوضاع (Chat Hub) ================= */}
        <main className={`rn-panel-chat ${mobileTab === 'chat' ? 'm-show' : ''}`}>
          {/* شريط أوضاع التعلم الذكية الـ 5 المعتمدة على المصادر */}
          <div className="rn-learning-modes-bar">
            <span className="rn-modes-label">أوضاع التعلم:</span>
            {[
              { id: 'chat', label: 'حوار مباشر', icon: 'notebook' },
              { id: 'explain', label: 'اشرح لي', icon: 'bulb' },
              { id: 'quiz', label: 'اختبرني', icon: 'tasks' },
              { id: 'socratic', label: 'ناقشني', icon: 'ai' },
              { id: 'summary', label: 'لخّص لي', icon: 'notes' },
              { id: 'connect', label: 'اربط المعلومات', icon: 'link' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setLearningMode(m.id)
                  if (m.id === 'summary') {
                    askNotebook('قدم لي ملخصاً شاملاً ومنظماً لأهم ما ورد في هذه المصادر: الأفكار، التعريفات، القوانين، والمفاهيم.', 'summary')
                  } else if (m.id === 'connect') {
                    askNotebook('اربط بين المفاهيم والعلاقات المشتركة بين المصادر المحددة ووضح كيف تكمل بعضها.', 'connect')
                  }
                }}
                className={`rn-mode-chip ${learningMode === m.id ? 'is-active' : ''}`}
                title={m.label}
              >
                <Icon name={m.icon} size={14} />
                <span>{m.label}</span>
              </button>
            ))}

            <button
              onClick={handleRunConflictDetector}
              className="rn-conflict-detector-chip"
              title="فحص واكتشاف أي تعارض أو اختلاف بين معلومات المصادر المحددة"
            >
              <span><Icon name="balance" size={14} /> كشف التعارض بين المصادر</span>
            </button>
          </div>

          {/* تنبيه المحادثة الصوتية الحية عند تفعيلها */}
          {isVoiceActive && (
            <div className="rn-voice-active-banner">
              <div className="rn-voice-status-box">
                <span className="rn-pulse-ring" />
                <div className="rn-voice-texts">
                  <strong>
                    {voiceListening
                      ? <><Icon name="mic" size={14} /> جارٍ الاستماع لسؤالك صوتياً...</>
                      : voiceSpeaking
                        ? <><Icon name="speaker" size={14} /> رفيق يجيب بصوته من مصادرك...</>
                        : 'المحادثة الصوتية نشطة - تحدث بحرية'}
                  </strong>
                  {spokenCaption && <p className="rn-voice-caption-line">"{spokenCaption}"</p>}
                </div>
              </div>

              <div className="rn-voice-controls">
                {voiceSpeaking && (
                  <button onClick={handleInterruptVoice} className="rn-voice-interrupt-btn">
                    <><Icon name="hand" size={14} /> مقاطعة وسؤال جديد</>
                  </button>
                )}
                {!voiceListening && !voiceSpeaking && (
                  <button onClick={startListening} className="rn-btn-primary">
                    <><Icon name="mic" size={14} /> تحدث الآن</>
                  </button>
                )}
                <button onClick={stopVoiceMode} className="rn-voice-close-btn">
                  إيقاف الصوت
                </button>
              </div>
            </div>
          )}

          {/* صندوق رسائل المحادثة */}
          <div className="rn-chat-scroll thin-scroll">
            {messages.length === 0 && (
              <div className="rn-empty-chat">
                <div className="rn-empty-badge"><Icon name="ai" size={22} weight="duotone" /></div>
                <h3>مرحباً بك في {currentNb?.title || 'دفتر رفيق'}</h3>
                <p>
                  اطرح أي سؤال حول مصادرك، وسيستخرج رفيق الإجابات الموثوقة مع الإحالة المباشرة إلى رقم الصفحة والمقطع المحدد.
                </p>

                <div className="rn-suggested-prompts">
                  <button
                    onClick={() => askNotebook('ما هي أهم الأفكار والمحاور الرئيسية الواردة في هذا المستند؟')}
                    className="rn-prompt-btn"
                  >
                    <><Icon name="pin" size={14} /> ما هي الأفكار والمحاور الرئيسية في المصادر؟</>
                  </button>
                  <button
                    onClick={() => askNotebook('اشرح لي هذا المفهوم تدريجياً وبأسلوب تعليمي مبسط مع الأمثلة.', 'explain')}
                    className="rn-prompt-btn"
                  >
                    <><Icon name="lightbulb" size={14} /> اشرح لي أهم المفاهيم بأسلوب تعليمي مبسط</>
                  </button>
                  <button
                    onClick={() => askNotebook('اطرح علي سؤالاً تدريبياً لاختبار فهمي لما ورد في المصادر.', 'quiz')}
                    className="rn-prompt-btn"
                  >
                    <><Icon name="target" size={14} /> اختبرني بسؤال تطبيقي من داخل المنهج</>
                  </button>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`rn-message-row ${m.role === 'user' ? 'is-user' : 'is-assistant'}`}
              >
                <div className="rn-message-bubble">
                  {m.role === 'assistant' && (
                    <div className="rn-message-header">
                      <span className="rn-avatar-badge">رفيق</span>
                      {m.mode && m.mode !== 'chat' && (
                        <span className="rn-msg-mode-tag">
                          {m.mode === 'explain' ? 'شرح تعليمي' : m.mode === 'quiz' ? 'اختبار' : m.mode === 'summary' ? 'ملخص' : 'ربط مفاهيم'}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="rn-message-content">
                    {m.text.split('\n').map((line, lIdx) => {
                      const t = line.trim()
                      if (!t) return <div key={lIdx} className="h-2" />
                      if (t.startsWith('###')) return <h4 key={lIdx} className="rn-md-h3">{t.replace(/^###\s*/, '')}</h4>
                      if (t.startsWith('##')) return <h3 key={lIdx} className="rn-md-h2">{t.replace(/^##\s*/, '')}</h3>
                      if (t.startsWith('#')) return <h2 key={lIdx} className="rn-md-h1">{t.replace(/^#\s*/, '')}</h2>
                      if (t.startsWith('- ') || t.startsWith('* ')) {
                        return (
                          <div key={lIdx} className="rn-md-li">
                            <span className="rn-bullet">•</span>
                            <span>{t.slice(2)}</span>
                          </div>
                        )
                      }
                      return <p key={lIdx}>{t}</p>
                    })}
                  </div>

                  {/* الاستشهادات والمراجع المباشرة (Clickable Citations) */}
                  {m.cites && m.cites.length > 0 && (
                    <div className="rn-citations-drawer">
                      <span className="rn-citations-label">المصادر المرجعية للإجابة:</span>
                      <div className="rn-citations-chips">
                        {m.cites.map((c) => (
                          <button
                            key={c.n}
                            onClick={() => setActiveCitation(c)}
                            className="rn-citation-chip"
                            title="اضغط لعرض المقطع والصفحة الأصلية"
                          >
                            <span className="rn-cite-num">[{c.n}]</span>
                            <span className="rn-cite-title">{c.title}</span>
                            {c.page && <span className="rn-cite-page">ص {c.page}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* إجراءات الرسالة */}
                  {m.role === 'assistant' && !m.error && (
                    <div className="rn-message-actions">
                      <button
                        onClick={() => handleSaveMessageAsNote(m.text)}
                        className="rn-act-btn"
                        title="حفظ كملاحظة في استوديو الدفتر"
                      >
                        <Icon name="notes" size={13} />
                        <span>حفظ في الملاحظات</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(m.text)
                          notify('تم نسخ الإجابة')
                        }}
                        className="rn-act-btn"
                        title="نسخ الإجابة"
                      >
                        <Icon name="copy" size={13} />
                        <span>نسخ</span>
                      </button>

                      <button
                        onClick={() => playVoiceReply(m.text)}
                        className="rn-act-btn"
                        title="قراءة الإجابة بالصوت"
                      >
                        <Icon name="volume" size={13} />
                        <span>استمع</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="rn-message-row is-assistant">
                <div className="rn-message-bubble is-loading">
                  <span className="rn-spinner" />
                  <span>رفيق يبحث في مصادرك ويستخرج الإجابة مع المراجع...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* صندوق إدخال المحادثة */}
          <div className="rn-chat-input-bar">
            {SR && (
              <button
                onClick={voiceListening ? () => speechRecognitionRef.current?.stop() : startListening}
                className={`rn-input-mic-btn ${voiceListening ? 'is-recording' : ''}`}
                title={voiceListening ? 'جارٍ الاستماع... اضغط للإيقاف' : 'إملاء صوتي'}
              >
                <Icon name="mic" size={17} />
              </button>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  askNotebook()
                }
              }}
              rows={1}
              placeholder="اطرح سؤالاً من داخل مصادرك... (Shift + Enter لسطر جديد)"
              className="rn-chat-textarea"
            />

            <button
              onClick={() => askNotebook()}
              disabled={!input.trim() || chatLoading}
              className="rn-chat-send-btn"
              title="إرسال السؤال"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </main>

        {/* ================= ج. عمود الاستوديو والمخرجات (Study Studio) ================= */}
        <aside className={`rn-panel-studio ${mobileTab === 'studio' ? 'm-show' : ''}`}>
          <div className="rn-panel-head">
            <div className="rn-panel-title">
              <Icon name="tasks" size={17} />
              <span>استوديو المخرجات</span>
            </div>

            <button onClick={() => setShowAddNoteModal(true)} className="rn-btn-primary-sm">
              <Icon name="plus" size={13} />
              <span>ملاحظة جديدة</span>
            </button>
          </div>

          {/* تبويبات الاستوديو */}
          <div className="rn-studio-tabs">
            <button
              onClick={() => setActiveStudioTab('notes')}
              className={`rn-s-tab ${activeStudioTab === 'notes' ? 'is-active' : ''}`}
            >
              الملاحظات ({artifacts.filter((a) => a.type === 'note').length})
            </button>
            <button
              onClick={() => setActiveStudioTab('summaries')}
              className={`rn-s-tab ${activeStudioTab === 'summaries' ? 'is-active' : ''}`}
            >
              الملخصات
            </button>
            <button
              onClick={() => setActiveStudioTab('conflicts')}
              className={`rn-s-tab ${activeStudioTab === 'conflicts' ? 'is-active' : ''}`}
            >
              التعارضات
            </button>
          </div>

          {/* قائمة المخرجات المحفوظة */}
          <div className="rn-artifacts-scroll thin-scroll">
            {artifacts.length === 0 && (
              <div className="rn-empty-artifacts">
                <div className="rn-empty-icon"><Icon name="edit" size={22} /></div>
                <strong>لا توجد مخرجات محفوظة بعد</strong>
                <p>
                  يمكنك حفظ ملخصاتك وإجابات رفيق وملاحظاتك الشخصية هنا للرجوع إليها ومراجعتها لاحقاً.
                </p>
              </div>
            )}

            {artifacts
              .filter((a) => {
                if (activeStudioTab === 'notes') return a.type === 'note'
                if (activeStudioTab === 'summaries') return a.type === 'summary'
                if (activeStudioTab === 'conflicts') return a.type === 'conflict'
                return true
              })
              .map((art) => (
                <div key={art.id} className="rn-artifact-card">
                  <div className="rn-artifact-head">
                    <span className="rn-artifact-tag">
                      {art.type === 'note' ? 'ملاحظة' : art.type === 'summary' ? 'ملخص' : 'تعارض مصادر'}
                    </span>
                    <button
                      onClick={() => handleDeleteArtifact(art.id)}
                      className="rn-icon-inline-btn"
                      title="حذف"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>

                  <strong className="rn-artifact-title">{art.title}</strong>

                  {art.type === 'conflict' && Array.isArray(art.content) ? (
                    <div className="rn-conflict-preview">
                      {art.content.map((cmp, cIdx) => (
                        <div key={cIdx} className="rn-conflict-cmp-box">
                          <div className="rn-conflict-side">
                            <span className="rn-src-badge">{cmp.sourceA.title} (ص {cmp.sourceA.page})</span>
                            <p>{cmp.sourceA.excerpt}</p>
                          </div>
                          <div className="rn-conflict-vs">مقابل</div>
                          <div className="rn-conflict-side">
                            <span className="rn-src-badge">{cmp.sourceB.title} (ص {cmp.sourceB.page})</span>
                            <p>{cmp.sourceB.excerpt}</p>
                          </div>
                          <div className="rn-conflict-note">{cmp.analysis}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rn-artifact-body">{art.content}</p>
                  )}

                  <div className="rn-artifact-footer">
                    <span className="rn-artifact-date">
                      {new Date(art.updatedAt || art.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                    <button
                      onClick={() => {
                        const txt = typeof art.content === 'string' ? art.content : JSON.stringify(art.content, null, 2)
                        navigator.clipboard.writeText(txt)
                        notify('تم نسخ المحتوى')
                      }}
                      className="rn-text-btn"
                    >
                      نسخ
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </aside>
      </div>

      {/* ================= 3. النوافذ المنبثقة والعوارض ================= */}

      {/* عارض الاستشهاد والمقطع الأصلي في المصدر */}
      {activeCitation && (
        <div className="rn-modal-overlay" onClick={() => setActiveCitation(null)}>
          <div className="rn-citation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rn-modal-head">
              <div className="rn-modal-title">
                <span className="rn-cite-num-large">[{activeCitation.n}]</span>
                <div>
                  <strong>{activeCitation.title}</strong>
                  {activeCitation.page && <span>الصفحة: {activeCitation.page}</span>}
                </div>
              </div>
              <button onClick={() => setActiveCitation(null)} className="rn-close-btn">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="rn-citation-excerpt-box">
              <span className="rn-excerpt-badge">النص المقتبس من المصدر:</span>
              <p>{activeCitation.excerpt}</p>
            </div>
          </div>
        </div>
      )}

      {/* عارض مقاطع المصدر الكاملة */}
      {previewSource && (
        <div className="rn-modal-overlay" onClick={() => setPreviewSource(null)}>
          <div className="rn-source-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rn-modal-head">
              <div>
                <strong>معاينة: {previewSource.title}</strong>
                <span className="rn-modal-sub">
                  {previewSource.chunks?.length || 0} مقطع مفهرس للبحث والاسترجاع
                </span>
              </div>
              <button onClick={() => setPreviewSource(null)} className="rn-close-btn">
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="rn-chunks-scroll thin-scroll">
              {(previewSource.chunks || []).map((ch, idx) => (
                <div key={idx} className="rn-chunk-preview-card">
                  <div className="rn-chunk-head">
                    <span>مقطع #{idx + 1}</span>
                    {ch.page && <span className="rn-chunk-page">صفحة {ch.page}</span>}
                  </div>
                  <p className="rn-chunk-text">{ch.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة لصق نص جديد */}
      {showPasteModal && (
        <div className="rn-modal-overlay" onClick={() => setShowPasteModal(false)}>
          <div className="rn-paste-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rn-modal-head">
              <strong>لصق نص كمصدر جديد</strong>
              <button onClick={() => setShowPasteModal(false)} className="rn-close-btn">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="rn-modal-body">
              <input
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="عنوان النص أو الدرس..."
                className="rn-input"
              />
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                rows={9}
                placeholder="الصق المحتوى التعليمي هنا..."
                className="rn-textarea"
              />
            </div>
            <div className="rn-modal-foot">
              <button onClick={handlePasteText} className="rn-btn-primary">
                حفظ وفهرسة النص
              </button>
              <button onClick={() => setShowPasteModal(false)} className="rn-btn-subtle">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة رابط مرجعي */}
      {showLinkModal && (
        <div className="rn-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="rn-link-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rn-modal-head">
              <strong>إضافة رابط مرجعي كمصدر</strong>
              <button onClick={() => setShowLinkModal(false)} className="rn-close-btn">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="rn-modal-body">
              <input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="اسم أو عنوان المرجع..."
                className="rn-input"
              />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="rn-input"
                dir="ltr"
              />
            </div>
            <div className="rn-modal-foot">
              <button onClick={handleAddLink} className="rn-btn-primary">
                إضافة الرابط
              </button>
              <button onClick={() => setShowLinkModal(false)} className="rn-btn-subtle">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إنشاء ملاحظة جديدة */}
      {showAddNoteModal && (
        <div className="rn-modal-overlay" onClick={() => setShowAddNoteModal(false)}>
          <div className="rn-paste-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rn-modal-head">
              <strong>إنشاء ملاحظة شخصية داخل الدفتر</strong>
              <button onClick={() => setShowAddNoteModal(false)} className="rn-close-btn">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="rn-modal-body">
              <input
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="عنوان الملاحظة..."
                className="rn-input"
              />
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={8}
                placeholder="اكتب ملاحظاتك وخلاصة ما تعلمته هنا..."
                className="rn-textarea"
              />
            </div>
            <div className="rn-modal-foot">
              <button onClick={handleSaveNote} className="rn-btn-primary">
                حفظ الملاحظة
              </button>
              <button onClick={() => setShowAddNoteModal(false)} className="rn-btn-subtle">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ========================================================================= */
/*                          التنسيق البصري لدفتر رفيق                        */
/* ========================================================================= */
const NOTEBOOK_CSS = `
.rn-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  padding: 12px 14px 14px;
  gap: 10px;
  background: #FBFAF7;
  font-family: 'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif;
  color: #282532;
  box-sizing: border-box;
  overflow: hidden;
}
.rn-root *, .rn-root *::before, .rn-root *::after {
  box-sizing: border-box;
  font-family: inherit;
}

/* 1. الشريط العلوي اللؤلؤي */
.rn-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  border-radius: 18px;
  background: #FFFFFF;
  border: 1px solid #EAE6EE;
  box-shadow: 0 4px 18px rgba(121, 85, 200, 0.05);
}
.rn-header-start, .rn-header-end {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rn-exit-btn {
  height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid #EAE6EE;
  background: #F2EDFA;
  color: #7955C8;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.rn-exit-btn:hover {
  background: #E8E0F5;
  color: #6744B4;
  transform: translateY(-1px);
}

.rn-notebook-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FBFAF7;
  border: 1px solid #EAE6EE;
  padding: 3px 8px;
  border-radius: 14px;
}
.rn-picker-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #7955C8;
}
.rn-title-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #282532;
}
.rn-title-edit-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.rn-title-input {
  height: 28px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid #7955C8;
  font-size: 12.5px;
  outline: none;
}
.rn-check-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: #7955C8;
  color: #FFFFFF;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.rn-notebook-select {
  height: 32px;
  border-radius: 9px;
  border: 1px solid #EAE6EE;
  background: #FFFFFF;
  color: #282532;
  font-size: 12px;
  font-weight: 600;
  padding: 0 8px;
  outline: none;
  cursor: pointer;
}
.rn-add-nb-btn {
  height: 32px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 9px;
  border: none;
  background: #7955C8;
  color: #FFFFFF;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.rn-voice-toggle-btn {
  height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  border: 1.5px solid #7955C8;
  background: #FFFFFF;
  color: #7955C8;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.rn-voice-toggle-btn:hover {
  background: #F2EDFA;
}
.rn-voice-toggle-btn.is-active {
  background: #7955C8;
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(121, 85, 200, 0.3);
}
.rn-live-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  animation: rnPulse 1.2s infinite;
}
@keyframes rnPulse {
  0% { transform: scale(0.9); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.5; }
  100% { transform: scale(0.9); opacity: 1; }
}

.rn-mobile-nav-tabs {
  display: none;
  align-items: center;
  gap: 4px;
}
.rn-m-tab {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.rn-m-tab.is-active {
  background: #7955C8;
  color: #FFFFFF;
  border-color: #7955C8;
}

/* 2. مساحة العمل الثلاثية */
.rn-workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 310px 1fr 310px;
  gap: 12px;
}

/* أ. عمود المصادر */
.rn-panel-sources {
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border: 1px solid #EAE6EE;
  border-radius: 20px;
  padding: 14px;
  overflow: hidden;
}
.rn-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.rn-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 800;
  color: #282532;
}
.rn-count-pill {
  padding: 2px 7px;
  border-radius: 999px;
  background: #F2EDFA;
  color: #7955C8;
  font-size: 11px;
}
.rn-source-actions-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 6px;
  margin-bottom: 10px;
}
.rn-btn-primary {
  height: 34px;
  border-radius: 10px;
  border: none;
  background: #7955C8;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.rn-btn-primary:hover {
  background: #6744B4;
}
.rn-btn-primary-sm {
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  border: none;
  background: #7955C8;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.rn-btn-subtle {
  height: 34px;
  border-radius: 10px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  color: #282532;
  font-size: 11.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
}
.rn-btn-subtle:hover {
  background: #F2EDFA;
  color: #7955C8;
  border-color: #7955C8;
}

.rn-upload-progress-card {
  background: #F2EDFA;
  border: 1px solid #EAE6EE;
  border-radius: 12px;
  padding: 8px 10px;
  margin-bottom: 10px;
}
.rn-progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: #7955C8;
}
.rn-progress-track {
  height: 5px;
  background: #EAE6EE;
  border-radius: 999px;
  margin: 6px 0 4px;
  overflow: hidden;
}
.rn-progress-fill {
  height: 100%;
  background: #7955C8;
  border-radius: 999px;
  transition: width 0.2s ease;
}
.rn-progress-hint {
  font-size: 9.5px;
  color: #817C89;
}

.rn-search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  margin-bottom: 8px;
}
.rn-search-box input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 11.5px;
}

.rn-sources-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 2px;
}
.rn-empty-sources {
  margin: auto 0;
  text-align: center;
  padding: 20px 10px;
}
.rn-empty-icon {
  font-size: 32px;
  color: #7955C8;
  margin-bottom: 8px;
}
.rn-empty-sources strong {
  display: block;
  font-size: 13.5px;
  color: #282532;
  margin-bottom: 6px;
}
.rn-empty-sources p {
  font-size: 11.5px;
  color: #817C89;
  line-height: 1.6;
  margin-bottom: 14px;
}

.rn-source-card {
  border: 1px solid #EAE6EE;
  border-radius: 14px;
  padding: 10px;
  background: #FBFAF7;
  cursor: pointer;
  transition: all 0.15s ease;
}
.rn-source-card:hover {
  background: #FFFFFF;
  border-color: #7955C8;
}
.rn-source-card.is-selected {
  background: #F2EDFA;
  border-color: #7955C8;
}
.rn-source-card.is-failed {
  border-color: #FCA5A5;
  background: #FEF2F2;
}
.rn-source-top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.rn-source-select-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1.5px solid #7955C8;
  background: #FFFFFF;
  color: #7955C8;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.rn-source-info {
  flex: 1;
  min-width: 0;
}
.rn-source-title {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: #282532;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rn-source-meta {
  font-size: 10px;
  color: #817C89;
}
.rn-source-error-msg {
  font-size: 10.5px;
  color: #DC2626;
  margin-top: 4px;
}
.rn-source-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
.rn-preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  font-size: 10.5px;
  color: #7955C8;
  font-weight: 700;
  cursor: pointer;
}
.rn-delete-source-btn {
  background: transparent;
  border: none;
  color: #DC2626;
  cursor: pointer;
  padding: 2px;
  opacity: 0.7;
}
.rn-delete-source-btn:hover {
  opacity: 1;
}

/* ب. عمود المحادثة الذكية */
.rn-panel-chat {
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border: 1px solid #EAE6EE;
  border-radius: 20px;
  overflow: hidden;
}
.rn-learning-modes-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid #EAE6EE;
  background: #FBFAF7;
  overflow-x: auto;
}
.rn-modes-label {
  font-size: 11px;
  font-weight: 800;
  color: #7955C8;
  flex-shrink: 0;
}
.rn-mode-chip {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid #EAE6EE;
  background: #FFFFFF;
  color: #282532;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.rn-mode-chip:hover {
  border-color: #7955C8;
  color: #7955C8;
}
.rn-mode-chip.is-active {
  background: #7955C8;
  color: #FFFFFF;
  border-color: #7955C8;
}
.rn-conflict-detector-chip {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid #24BBD1;
  background: #E6FFFA;
  color: #0D9488;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  margin-right: auto;
}

/* بنر المحادثة الصوتية الحية */
.rn-voice-active-banner {
  padding: 10px 14px;
  background: linear-gradient(135deg, #F2EDFA, #E6FFFA);
  border-bottom: 1px solid #EAE6EE;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rn-voice-status-box {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rn-pulse-ring {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #7955C8;
  box-shadow: 0 0 0 0 rgba(121, 85, 200, 0.7);
  animation: pulseDot 1.4s infinite;
}
.rn-voice-texts strong {
  display: block;
  font-size: 12.5px;
  color: #282532;
}
.rn-voice-caption-line {
  font-size: 11.5px;
  color: #7955C8;
  font-weight: 600;
  margin: 2px 0 0;
}
.rn-voice-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}
.rn-voice-interrupt-btn {
  padding: 5px 12px;
  border-radius: 8px;
  border: none;
  background: #DC2626;
  color: #FFFFFF;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}
.rn-voice-close-btn {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid #EAE6EE;
  background: #FFFFFF;
  font-size: 11.5px;
  cursor: pointer;
}

/* شاشة المحادثة */
.rn-chat-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rn-empty-chat {
  margin: auto;
  max-width: 460px;
  text-align: center;
  padding: 20px;
}
.rn-empty-badge {
  width: 50px;
  height: 50px;
  border-radius: 16px;
  background: linear-gradient(135deg, #7955C8, #24BBD1);
  color: #FFFFFF;
  font-size: 24px;
  display: grid;
  place-items: center;
  margin: 0 auto 12px;
}
.rn-empty-chat h3 {
  font-size: 18px;
  font-weight: 800;
  color: #282532;
  margin: 0 0 6px;
}
.rn-empty-chat p {
  font-size: 12.5px;
  color: #817C89;
  line-height: 1.6;
  margin: 0 0 16px;
}
.rn-suggested-prompts {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rn-prompt-btn {
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  color: #282532;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  cursor: pointer;
  transition: all 0.15s ease;
}
.rn-prompt-btn:hover {
  background: #F2EDFA;
  border-color: #7955C8;
  color: #7955C8;
}

.rn-message-row {
  display: flex;
  width: 100%;
}
.rn-message-row.is-user {
  justify-content: flex-start;
}
.rn-message-row.is-assistant {
  justify-content: flex-end;
}
.rn-message-bubble {
  max-width: 84%;
  border-radius: 18px;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.7;
}
.rn-message-row.is-user .rn-message-bubble {
  background: #7955C8;
  color: #FFFFFF;
  border-bottom-right-radius: 4px;
}
.rn-message-row.is-assistant .rn-message-bubble {
  background: #FBFAF7;
  color: #282532;
  border: 1px solid #EAE6EE;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(121, 85, 200, 0.03);
}
.rn-message-bubble.is-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #7955C8;
  font-weight: 700;
}
.rn-message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.rn-avatar-badge {
  font-size: 11px;
  font-weight: 800;
  color: #7955C8;
  background: #F2EDFA;
  padding: 2px 8px;
  border-radius: 999px;
}
.rn-msg-mode-tag {
  font-size: 10px;
  color: #0D9488;
  background: #E6FFFA;
  padding: 2px 7px;
  border-radius: 999px;
}

/* الاستشهادات المرجعية القابلة للنقر */
.rn-citations-drawer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #EAE6EE;
}
.rn-citations-label {
  display: block;
  font-size: 10.5px;
  color: #817C89;
  font-weight: 700;
  margin-bottom: 5px;
}
.rn-citations-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.rn-citation-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 8px;
  border: 1px solid #EAE6EE;
  background: #FFFFFF;
  color: #7955C8;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.rn-citation-chip:hover {
  background: #F2EDFA;
  border-color: #7955C8;
  transform: translateY(-1px);
}
.rn-cite-num {
  color: #7955C8;
}
.rn-cite-title {
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rn-cite-page {
  color: #0D9488;
  background: #E6FFFA;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 10px;
}

.rn-message-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.rn-act-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: #817C89;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 4px;
}
.rn-act-btn:hover {
  color: #7955C8;
}

/* شريط إدخال المحادثة */
.rn-chat-input-bar {
  padding: 10px 14px;
  background: #FFFFFF;
  border-top: 1px solid #EAE6EE;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rn-chat-textarea {
  flex: 1;
  min-height: 40px;
  max-height: 100px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  font-size: 13px;
  resize: none;
  outline: none;
}
.rn-chat-textarea:focus {
  border-color: #7955C8;
  background: #FFFFFF;
}
.rn-input-mic-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  color: #7955C8;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.rn-input-mic-btn.is-recording {
  background: #DC2626;
  color: #FFFFFF;
  animation: pulseDot 1.2s infinite;
}
.rn-chat-send-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: none;
  background: #7955C8;
  color: #FFFFFF;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.rn-chat-send-btn:hover:not(:disabled) {
  background: #6744B4;
}
.rn-chat-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ج. عمود الاستوديو والمخرجات */
.rn-panel-studio {
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border: 1px solid #EAE6EE;
  border-radius: 20px;
  padding: 14px;
  overflow: hidden;
}
.rn-studio-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: #FBFAF7;
  border: 1px solid #EAE6EE;
  margin-bottom: 10px;
}
.rn-s-tab {
  flex: 1;
  padding: 5px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: #817C89;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.rn-s-tab.is-active {
  background: #FFFFFF;
  color: #7955C8;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.rn-artifacts-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rn-empty-artifacts {
  margin: auto 0;
  text-align: center;
  padding: 20px 10px;
}
.rn-artifact-card {
  border: 1px solid #EAE6EE;
  border-radius: 12px;
  padding: 10px;
  background: #FBFAF7;
}
.rn-artifact-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.rn-artifact-tag {
  font-size: 9.5px;
  font-weight: 800;
  color: #7955C8;
  background: #F2EDFA;
  padding: 1px 6px;
  border-radius: 4px;
}
.rn-artifact-title {
  display: block;
  font-size: 12.5px;
  color: #282532;
  margin-bottom: 4px;
}
.rn-artifact-body {
  font-size: 11.5px;
  color: #555060;
  line-height: 1.5;
  white-space: pre-wrap;
  max-height: 140px;
  overflow-y: auto;
}
.rn-artifact-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 10px;
  color: #817C89;
}

/* جدول مقارنة التعارض */
.rn-conflict-cmp-box {
  background: #FFFFFF;
  border: 1px solid #EAE6EE;
  border-radius: 10px;
  padding: 8px;
  margin: 6px 0;
}
.rn-conflict-side {
  font-size: 11px;
}
.rn-src-badge {
  font-weight: 700;
  color: #7955C8;
  display: block;
  margin-bottom: 2px;
}
.rn-conflict-vs {
  text-align: center;
  font-size: 10px;
  font-weight: 800;
  color: #DC2626;
  margin: 4px 0;
}
.rn-conflict-note {
  font-size: 10.5px;
  color: #0D9488;
  background: #E6FFFA;
  padding: 4px;
  border-radius: 6px;
  margin-top: 4px;
}

/* 3. النوافذ المنبثقة */
.rn-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(40, 37, 50, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.rn-citation-modal, .rn-paste-modal, .rn-link-modal, .rn-source-preview-modal {
  width: 100%;
  max-width: 540px;
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid #EAE6EE;
  box-shadow: 0 16px 45px rgba(121, 85, 200, 0.16);
  padding: 20px;
}
.rn-source-preview-modal {
  max-width: 680px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.rn-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.rn-modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rn-cite-num-large {
  font-size: 16px;
  font-weight: 800;
  color: #7955C8;
  background: #F2EDFA;
  padding: 4px 10px;
  border-radius: 8px;
}
.rn-modal-sub {
  display: block;
  font-size: 11px;
  color: #817C89;
}
.rn-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #817C89;
}
.rn-citation-excerpt-box {
  background: #FBFAF7;
  border: 1px solid #EAE6EE;
  border-radius: 12px;
  padding: 12px;
}
.rn-excerpt-badge {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #7955C8;
  margin-bottom: 6px;
}
.rn-citation-excerpt-box p {
  font-size: 13px;
  line-height: 1.7;
  color: #282532;
  margin: 0;
}
.rn-chunks-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rn-chunk-preview-card {
  background: #FBFAF7;
  border: 1px solid #EAE6EE;
  border-radius: 10px;
  padding: 10px;
}
.rn-chunk-head {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  font-weight: 700;
  color: #7955C8;
  margin-bottom: 4px;
}
.rn-chunk-text {
  font-size: 12px;
  line-height: 1.6;
  color: #282532;
  margin: 0;
}
.rn-modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}
.rn-input {
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #EAE6EE;
  font-size: 12.5px;
  outline: none;
}
.rn-textarea {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #EAE6EE;
  font-size: 12.5px;
  outline: none;
  resize: vertical;
}
.rn-modal-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.rn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #EAE6EE;
  border-top-color: #7955C8;
  border-radius: 50%;
  animation: sbSpin 0.7s linear infinite;
  display: inline-block;
}
@keyframes sbSpin {
  to { transform: rotate(360deg); }
}
.rn-text-btn {
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 700;
  color: #7955C8;
  cursor: pointer;
}
.rn-icon-inline-btn {
  background: transparent;
  border: none;
  color: #817C89;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 2px;
}
.rn-icon-inline-btn:hover {
  color: #7955C8;
}

/* تجاوب الشاشات الصغيرة والهواتف */
@media (max-width: 1024px) {
  .rn-workspace {
    grid-template-columns: 1fr;
  }
  .rn-panel-sources, .rn-panel-studio {
    display: none;
  }
  .rn-panel-sources.m-show, .rn-panel-chat.m-show, .rn-panel-studio.m-show {
    display: flex;
  }
  .rn-mobile-nav-tabs {
    display: flex;
  }
  .rn-header {
    height: auto;
    padding: 8px 12px;
    flex-wrap: wrap;
  }
}
`
