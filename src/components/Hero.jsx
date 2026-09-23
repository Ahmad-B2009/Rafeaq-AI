import { useNavigate } from 'react-router-dom'
export default function Hero(){
  const nav = useNavigate()
  return (
    <section className="relative pt-[140px] pb-20 px-6 overflow-hidden">
      <style>{`
        @keyframes float { 0%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-20px) translateX(10px)} 100%{transform:translateY(0) translateX(0)} }
        @keyframes gradientMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes bounceDot { 0%,80%,100%{transform:scale(0.8); opacity:0.5} 40%{transform:scale(1); opacity:1} }
      `}</style>
      <div className="blob w-[600px] h-[600px] bg-[#EDE9FF]" style={{top:'-150px', right:'-100px', animation:'float 8s ease-in-out infinite'}} />
      <div className="blob w-[500px] h-[500px] bg-[#F3E8FF]" style={{top:'300px', left:'-100px', animation:'float 10s ease-in-out infinite reverse'}} />
      <div className="blob w-[400px] h-[400px] bg-[#DDD6FE] opacity-60" style={{top:'500px', right:'20%', animation:'float 12s ease-in-out infinite'}} />
      
      <div className="max-w-6xl mx-auto relative grid md:grid-cols-2 gap-10 items-center">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 glass-strong rounded-full px-4 py-2 text-xs mb-6 animate-[float_3s_ease-in-out_infinite]">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse shadow-[0_0_8px_#7C3AED]"></span>
            مساعدك الذكي باللهجة الليبية
          </div>
          <h1 className="text-[42px] md:text-[56px] font-extrabold leading-[1.05] tracking-tight">
            <span className="bg-[linear-gradient(100deg,#7C3AED,#6D28D9,#A78BFA,#7C3AED)] bg-[length:200%_200%] bg-clip-text text-transparent" style={{animation:'gradientMove 4s ease infinite'}}>رفيق</span> يفهمك<br/>ويجاوبك زي صاحبك
          </h1>
          <p className="mt-6 text-[18px] leading-7 opacity-60 max-w-[520px]">
            مساعد ذكاء اصطناعي يفهم اللهجة الليبية، يساعدك في الكتابة، الشرح، التلخيص، والأفكار. واجهة بسيطة وسريعة بدون تعقيد.
          </p>
          <div className="mt-8 flex gap-3">
            <button onClick={()=>nav('/login')} className="h-[52px] px-8 rounded-full bg-black text-white font-medium shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:scale-[1.03] hover:shadow-[0_14px_36px_rgba(0,0,0,0.28)] transition-all duration-300">ابدأ المحادثة</button>
            <button onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})} className="h-[52px] px-8 rounded-full glass-strong font-medium hover:scale-[1.02] transition-all">شاهد كيف يعمل</button>
          </div>
        </div>

        <div className="relative z-10 group">
          <div className="glass-strong rounded-[32px] p-3 shadow-[0_24px_80px_rgba(124,58,237,0.18)] transition-all duration-500 group-hover:shadow-[0_32px_100px_rgba(124,58,237,0.25)] group-hover:-translate-y-2">
            <div className="bg-white rounded-[24px] p-5 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.2s] pointer-events-none" />
              <div className="flex gap-2 mb-4"><div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div><div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div><div className="w-3 h-3 rounded-full bg-[#27C93F]"></div></div>
              <div className="space-y-4">
                <div className="flex justify-end"><div className="bg-black text-white rounded-[18px] rounded-bl-[4px] px-4 py-3 text-sm max-w-[80%] shadow">اشرحلي درس الجبر بطريقة ليبية بسيطة؟</div></div>
                <div className="flex justify-start items-end gap-2">
                  <div className="glass-strong rounded-[18px] rounded-br-[4px] px-4 py-3 text-sm max-w-[80%]">تمام يا غالي، الجبر ساهل بكل... نخلي الأرقام تتكلم مع بعضها باش نطلعو قيمة المجهول...</div>
                </div>
                <div className="flex gap-1 mt-2">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-[bounceDot_1.4s_infinite]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-[bounceDot_1.4s_0.2s_infinite]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-[bounceDot_1.4s_0.4s_infinite]"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
