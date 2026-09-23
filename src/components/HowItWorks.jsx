export default function How(){
  const steps = [
    {n:'1', t:'سجل دخول', d:'ادخل بإيميلك أو Google في ثواني'},
    {n:'2', t:'اكتب سؤالك', d:'احكي عادي بالليبي زي ما تحكي مع صاحبك'},
    {n:'3', t:'خود الإجابة', d:'يجاوبك فوراً وبأسلوب بسيط وواضح'},
  ]
  return (
    <section id="how" className="px-6 py-20 bg-white/60 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7C3AED]/20 to-transparent hidden md:block" />
      <div className="max-w-6xl mx-auto relative">
        <h2 className="text-[32px] font-bold text-center">كيف يخدم؟</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {steps.map((s,idx)=>(
            <div key={s.n} className="group glass-strong rounded-[24px] p-8 text-center relative transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(124,58,237,0.15)]" style={{transitionDelay:`${idx*100}ms`}}>
              <div className="w-14 h-14 mx-auto rounded-full bg-black text-white flex items-center justify-center font-bold text-lg shadow-[0_8px_20px_rgba(0,0,0,0.15)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">{s.n}</div>
              <h3 className="mt-5 font-bold text-[18px]">{s.t}</h3>
              <p className="mt-2 text-sm opacity-60">{s.d}</p>
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
