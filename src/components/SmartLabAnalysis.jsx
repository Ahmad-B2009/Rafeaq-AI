import { useState } from 'react'
import { RafeeqIcon } from './RafeeqIcon.jsx'

const VIEWS = [
  { id: 'concepts', label: 'الأفكار', icon: 'brain' },
  { id: 'definitions', label: 'المصطلحات', icon: 'text' },
  { id: 'laws', label: 'القوانين', icon: 'exam' },
  { id: 'relationships', label: 'العلاقات', icon: 'link' },
]

function analysisText(result) {
  return [
    result.title,
    ...result.concepts.map((item) => `الفكرة ${item.type ? `(${item.type}) ` : ''}${item.title}\n${item.description}`),
    ...result.definitions.map((item) => `مصطلح: ${item.term}\n${item.definition}`),
    ...result.laws.map((item) => `قانون: ${item.name}${item.formula ? `\nالصيغة: ${item.formula}` : ''}\n${item.explanation}`),
    ...result.relationships.map((item) => `العلاقة بين ${item.from} و${item.to}: ${item.relationship}`),
  ].filter(Boolean).join('\n\n')
}

export default function SmartLabAnalysis({ onAnalyze, onSaveNote }) {
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [activeView, setActiveView] = useState('concepts')
  const [selectedConcept, setSelectedConcept] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (content.trim().length < 20) {
      setError('أضف نصاً تعليمياً لا يقل عن 20 حرفاً حتى أتمكن من تحليل محتواه.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const analysis = await onAnalyze({ topic: topic.trim(), content: content.trim() })
      setResult(analysis)
      setActiveView('concepts')
      setSelectedConcept(analysis.concepts[0]?.title || '')
    } catch (e) {
      setError(e.message || 'تعذر تحليل المحتوى الآن. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const selectedView = VIEWS.find((view) => view.id === activeView)
  const items = result?.[activeView] || []

  return (
    <section className="glass space-y-4 rounded-[26px] p-5 sm:p-6" aria-labelledby="lab-analysis-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-100 text-indigo-700"><RafeeqIcon name="brain" size={19} weight="duotone" /></span>
            <h2 id="lab-analysis-title" className="text-[15px] font-black">حلّل محتواك الدراسي</h2>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
            استخرج الأفكار الرئيسية، المصطلحات، القوانين والعلاقات من نص الدرس.
          </p>
        </div>
        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-[9px] font-bold text-emerald-800">
          المرحلة الأولى · فهم المعرفة
        </span>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold text-[var(--muted)]">اسم الدرس (اختياري)</span>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            maxLength={180}
            placeholder="مثال: الاتزان الكيميائي"
            className="w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2.5 text-[11px] text-[var(--ink)] outline-none focus:border-indigo-400"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold text-[var(--muted)]">نص الدرس</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={12000}
            rows={5}
            placeholder="الصق هنا نص الدرس أو الملخص الذي تريد تنظيمه..."
            className="w-full resize-y rounded-xl border border-[var(--line)] bg-white/80 px-3 py-3 text-[11px] leading-6 text-[var(--ink)] outline-none focus:border-indigo-400"
          />
          <span className="mt-1 block text-left text-[9px] text-[var(--muted)]">{content.length}/12000</span>
        </label>
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-[10px] leading-5 text-rose-800">{error}</p>}
        <button
          type="submit"
          disabled={loading || content.trim().length < 20}
          className="btn-grad w-full rounded-xl py-3 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'جارٍ تنظيم المعرفة...' : <><RafeeqIcon name="lab" size={16} weight="duotone" /> حلّل الدرس ونظّم مفاهيمه</>}
        </button>
      </form>

      {result && (
        <div className="space-y-4 border-t border-[var(--line)] pt-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <span className="text-[9px] font-semibold text-emerald-700">اكتمل تحليل المحتوى</span>
              <h3 className="text-[13px] font-bold text-[var(--ink)]">{result.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => onSaveNote(analysisText(result), `تحليل المختبر: ${result.title}`)}
              className="btn-soft flex items-center gap-1.5 rounded-full px-3 py-2 text-[9px] font-semibold"
            >
              <RafeeqIcon name="notes" size={14} /> احفظ التحليل في ملاحظاتي
            </button>
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="أقسام التحليل">
            {VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={activeView === view.id}
                onClick={() => setActiveView(view.id)}
                className={`rounded-full px-3 py-2 text-[9px] font-bold transition ${
                  activeView === view.id ? 'bg-indigo-600 text-white' : 'bg-white/70 text-[var(--muted)] hover:bg-white'
                }`}
              >
                <RafeeqIcon name={view.icon} size={14} /> {view.label} ({result[view.id].length})
              </button>
            ))}
          </div>

          {items.length ? (
            <div className="grid gap-2 sm:grid-cols-2" role="tabpanel">
              {items.map((item, index) => {
                const isConcept = activeView === 'concepts'
                const related = isConcept
                  ? result.relationships.filter((relation) => relation.from === item.title || relation.to === item.title)
                  : []
                return (
                <article
                  key={`${activeView}-${index}`}
                  onClick={isConcept ? () => setSelectedConcept(item.title) : undefined}
                  onKeyDown={isConcept ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedConcept(item.title)
                    }
                  } : undefined}
                  role={isConcept ? 'button' : undefined}
                  tabIndex={isConcept ? 0 : undefined}
                  aria-pressed={isConcept ? selectedConcept === item.title : undefined}
                  className={`rounded-2xl border bg-white/75 p-4 ${
                    isConcept ? 'cursor-pointer transition hover:border-indigo-300' : ''
                  } ${isConcept && selectedConcept === item.title ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-[var(--line)]'}`}
                >
                  {activeView === 'concepts' && (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[11px] font-bold">{item.title}</h4>
                        {item.type && <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[8px] text-indigo-700">{item.type}</span>}
                      </div>
                      <p className="mt-2 text-[10px] leading-6 text-[var(--muted)]">{item.description}</p>
                      {related.length > 0 && (
                        <div className="mt-3 border-t border-[var(--line)] pt-2">
                          <span className="text-[9px] font-bold text-indigo-700">روابط هذا المفهوم</span>
                          {related.map((relation, relationIndex) => (
                            <p key={relationIndex} className="mt-1 text-[9px] leading-5 text-[var(--muted)]">
                              {relation.from} ↔ {relation.to}: {relation.relationship}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {activeView === 'definitions' && (
                    <>
                      <h4 className="text-[11px] font-bold text-indigo-700">{item.term}</h4>
                      <p className="mt-2 text-[10px] leading-6 text-[var(--muted)]">{item.definition}</p>
                    </>
                  )}
                  {activeView === 'laws' && (
                    <>
                      <h4 className="text-[11px] font-bold">{item.name}</h4>
                      {item.formula && <p dir="auto" className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-center text-[12px] font-bold text-indigo-800">{item.formula}</p>}
                      <p className="mt-2 text-[10px] leading-6 text-[var(--muted)]">{item.explanation}</p>
                    </>
                  )}
                  {activeView === 'relationships' && (
                    <>
                      <div className="flex items-center gap-2 text-[10px] font-bold">
                        <span>{item.from}</span><span className="text-indigo-500">↔</span><span>{item.to}</span>
                      </div>
                      <p className="mt-2 text-[10px] leading-6 text-[var(--muted)]">{item.relationship}</p>
                    </>
                  )}
                </article>
                )
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-white/60 p-4 text-[10px] text-[var(--muted)]">
              لم يستخرج التحليل {selectedView?.label} واضحة من النص المقدم.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
