import { useState } from 'react'
import { X } from 'lucide-react'
import { saveItem } from '../lib/studyStore'

export default function FlashcardDeck({ data, onClose }) {
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [saved, setSaved] = useState(false)
  const card = data.cards[i]

  const go = (n) => { setI(n); setFlipped(false) }

  return (
    <div dir="rtl" className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-2"><X /></button>
          <span className="text-sm text-gray-600">{i + 1}/{data.cards.length}</span>
        </div>

        <h2 className="text-lg font-bold mb-4 text-center">{data.title}</h2>

        <button
          onClick={() => setFlipped(!flipped)}
          className={`w-full min-h-[260px] rounded-3xl p-8 text-xl leading-9 flex items-center justify-center ${
            flipped ? 'bg-green-100' : 'bg-indigo-100'
          }`}
        >
          {flipped ? card.back : card.front}
        </button>
        <p className="text-center text-sm text-gray-500 mt-2">اضغط على البطاقة لقلبها</p>

        <div className="flex justify-between mt-8">
          <button onClick={() => go(i - 1)} disabled={i === 0} className="px-6 py-3 rounded-full bg-gray-100 disabled:opacity-40">السابق</button>
          <button onClick={() => go(i + 1)} disabled={i === data.cards.length - 1} className="px-6 py-3 rounded-full bg-sky-200 disabled:opacity-40">التالي</button>
        </div>

        <button
          onClick={() => setSaved(saveItem('decks', data))}
          className="w-full mt-6 p-3 rounded-2xl bg-gray-100"
        >
          {saved ? 'تم الحفظ على جهازك ✓' : 'حفظ البطاقات على جهازي'}
        </button>
      </div>
    </div>
  )
}