import { useState } from 'react'
import { X, Lightbulb, Check } from 'lucide-react'
import { saveItem } from '../lib/studyStore'
import FlashcardDeck from './FlashcardDeck'

const LETTERS = ['أ', 'ب', 'جـ', 'د']

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm flex items-center gap-1 ${
        active ? 'bg-sky-200 text-sky-900' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {active && <Check size={14} />}
      {children}
    </button>
  )
}

// request: دالة من الداشبورد ترسل الطلب إلى /api/chat مع المصادقة وتخصم من العدّاد
export default function QuizCard({ data, topic, request, onClose }) {
  const [questions, setQuestions] = useState(data.questions)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState({})
  const [showHint, setShowHint] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [deck, setDeck] = useState(null)
  const [opts, setOpts] = useState({ focus: 'all', count: 10, difficulty: 'same' })

  const total = questions.length
  const done = i >= total
  const q = questions[i]
  const right = questions.filter((x, k) => picked[k] === x.answer).length
  const wrong = questions.filter((x, k) => picked[k] !== undefined && picked[k] !== x.answer).length

  const callApi = (extra) => request({ message: topic, topic, ...extra })

  async function addMore() {
    setLoading(true)
    setError('')
    try {
      const weakTopics = questions
        .filter((x, k) => picked[k] !== undefined && picked[k] !== x.answer)
        .map((x) => x.question.slice(0, 80))
      const d = await callApi({ mode: 'quiz', ...opts, weakTopics })
      if (!d.questions?.length) throw new Error(d.reply || 'تعذر إنشاء أسئلة')
      setQuestions((old) => [...old, ...d.questions])
      setDialog(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function openFlashcards() {
    setLoading(true)
    setError('')
    try {
      const d = await callApi({ mode: 'flashcards', count: 10 })
      if (!d.cards?.length) throw new Error(d.reply || 'تعذر إنشاء البطاقات')
      setDeck(d)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function save() {
    setSaved(saveItem('quizzes', { title: data.title, topic, questions }))
  }

  if (deck) return <FlashcardDeck data={deck} onClose={() => setDeck(null)} />

  return (
    <div dir="rtl" className="fixed inset-0 z-[60] bg-white overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4">
        {/* الشريط العلوي */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onClose} className="p-2"><X /></button>
          <div className="flex-1 flex gap-1">
            {questions.map((_, k) => (
              <div key={k} className={`h-1 flex-1 rounded ${k < i || done ? 'bg-gray-600' : k === i ? 'bg-gray-400' : 'bg-gray-200'}`} />
            ))}
          </div>
          <span className="text-sm text-gray-600">{Math.min(i + 1, total)}/{total}</span>
          <span className="px-3 py-1 rounded-full bg-red-300 text-sm">✕ {wrong}</span>
          <span className="px-3 py-1 rounded-full bg-green-300 text-sm">✓ {right}</span>
        </div>

        {!done ? (
          <>
            <p className="text-sm font-bold mb-2">السؤال {i + 1}</p>
            <p className="text-lg mb-6 leading-8">{q.question}</p>

            <div className="space-y-3">
              {q.options.map((opt, k) => {
                const chosen = picked[i]
                const answered = chosen !== undefined
                let style = 'bg-gray-100'
                if (answered && k === q.answer) style = 'bg-green-200'
                else if (answered && k === chosen) style = 'bg-red-200'
                return (
                  <button
                    key={k}
                    disabled={answered}
                    onClick={() => setPicked({ ...picked, [i]: k })}
                    className={`w-full text-right p-4 rounded-2xl ${style}`}
                  >
                    <span className="font-bold ml-2">{LETTERS[k]}.</span> {opt}
                  </button>
                )
              })}
            </div>

            {picked[i] !== undefined && q.explanation && (
              <div className="mt-4 p-4 rounded-2xl bg-indigo-50 text-sm leading-7">{q.explanation}</div>
            )}

            {q.hint && picked[i] === undefined && (
              <div className="mt-6">
                <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-1 text-sm">
                  <Lightbulb size={16} /> تلميح
                </button>
                {showHint && <p className="mt-2 text-sm text-gray-600">{q.hint}</p>}
              </div>
            )}

            <div className="flex justify-between mt-10">
              <button
                onClick={() => { setI(i - 1); setShowHint(false) }}
                disabled={i === 0}
                className="px-6 py-3 rounded-full bg-gray-100 disabled:opacity-40"
              >
                السابق
              </button>
              <button
                onClick={() => { setI(i + 1); setShowHint(false) }}
                disabled={picked[i] === undefined}
                className="px-6 py-3 rounded-full bg-sky-200 disabled:opacity-40"
              >
                {i === total - 1 ? 'إنهاء' : 'التالي'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-2">{data.title}</h2>
            <p className="text-5xl font-bold my-6">{right} / {total}</p>
            <div className="grid gap-3 max-w-sm mx-auto">
              <button onClick={() => setDialog(true)} className="p-4 rounded-2xl bg-sky-200">إضافة أسئلة أخرى</button>
              <button onClick={openFlashcards} disabled={loading} className="p-4 rounded-2xl bg-indigo-100">
                {loading ? 'جاري التجهيز...' : 'مراجعة بالبطاقات (Flashcards)'}
              </button>
              <button onClick={save} className="p-4 rounded-2xl bg-gray-100">
                {saved ? 'تم الحفظ على جهازك ✓' : 'حفظ على جهازي'}
              </button>
              <button onClick={() => { setI(0); setPicked({}) }} className="p-4 rounded-2xl bg-gray-100">إعادة الاختبار</button>
            </div>
            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          </div>
        )}
      </div>

      {/* نافذة إضافة أسئلة */}
      {dialog && (
        <div className="fixed inset-0 z-[65] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md" dir="rtl">
            <h3 className="text-xl mb-5">إضافة أسئلة</h3>

            <p className="text-sm mb-2">التركيز</p>
            <div className="flex gap-2 mb-5">
              <Chip active={opts.focus === 'all'} onClick={() => setOpts({ ...opts, focus: 'all' })}>كل المحاور</Chip>
              <Chip active={opts.focus === 'growth'} onClick={() => setOpts({ ...opts, focus: 'growth' })}>نقاط الضعف</Chip>
            </div>

            <p className="text-sm mb-2">عدد الأسئلة</p>
            <div className="flex gap-2 mb-5 items-center">
              {[5, 10, 20].map((n) => (
                <Chip key={n} active={opts.count === n} onClick={() => setOpts({ ...opts, count: n })}>{n}</Chip>
              ))}
              <input
                type="number" min="3" max="30" placeholder="مخصص"
                onChange={(e) => setOpts({ ...opts, count: Number(e.target.value) || 10 })}
                className="w-20 px-3 py-2 rounded-full bg-gray-100 text-sm"
              />
            </div>

            <p className="text-sm mb-2">الصعوبة</p>
            <div className="flex gap-2 mb-6">
              <Chip active={opts.difficulty === 'easier'} onClick={() => setOpts({ ...opts, difficulty: 'easier' })}>أسهل</Chip>
              <Chip active={opts.difficulty === 'same'} onClick={() => setOpts({ ...opts, difficulty: 'same' })}>نفس المستوى</Chip>
              <Chip active={opts.difficulty === 'harder'} onClick={() => setOpts({ ...opts, difficulty: 'harder' })}>أصعب</Chip>
            </div>

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setDialog(false)} className="px-4 py-2">إلغاء</button>
              <button onClick={addMore} disabled={loading} className="px-5 py-2 rounded-full bg-sky-200">
                {loading ? 'جاري الإنشاء...' : 'أضف الأسئلة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
