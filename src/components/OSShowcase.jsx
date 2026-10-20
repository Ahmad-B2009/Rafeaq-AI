import { useNavigate } from 'react-router-dom'

const points = [
  { t: 'سطح مكتب مرتب', d: 'أيقونات رفيق AI والمكتبة والمهام ودفتر رفيق في مكان واحد، مع بحث سريع.' },
  { t: 'نوافذ حقيقية', d: 'افتح أكثر من تطبيق معًا، حرّكها وكبّرها وصغّرها كما في الحاسوب.' },
  { t: 'يناسب كل جهاز', d: 'على اللابتوب نوافذ، وعلى الهاتف والتابلت صفحات مريحة بدون تداخل.' },
]

export default function OSShowcase() {
  const nav = useNavigate()
  return (
    <section id="os" className="px-6 py-20 max-w-6xl mx-auto">
      <h2 className="text-[32px] font-bold text-center">رفيق OS</h2>
      <p className="text-center opacity-60 mt-3">مساحتك الدراسية كلها على سطح مكتب واحد</p>

      <div className="mt-12 grid md:grid-cols-5 gap-8 items-center">
        <div className="md:col-span-2 space-y-4">
          {points.map((p) => (
            <div key={p.t} className="glass-strong rounded-[24px] p-5">
              <h3 className="font-bold text-[16px]">{p.t}</h3>
              <p className="mt-1 text-sm opacity-60 leading-6">{p.d}</p>
            </div>
          ))}
          <button
            onClick={() => nav('/login')}
            className="h-[52px] px-8 rounded-full bg-black text-white font-medium shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:scale-[1.03] transition-all duration-300"
          >
            جرّب رفيق OS
          </button>
        </div>

        <div className="md:col-span-3 glass-strong rounded-[28px] p-3 shadow-[0_24px_80px_rgba(124,58,237,0.18)]">
          <img
            src="/os-preview.jpg"
            alt="واجهة رفيق OS: سطح المكتب ونافذة الرئيسية وشريط المهام"
            loading="lazy"
            className="w-full rounded-[20px] block"
          />
        </div>
      </div>
    </section>
  )
}
