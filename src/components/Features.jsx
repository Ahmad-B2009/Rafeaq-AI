const feats = [
  {title:'يفهم اللهجة الليبية', desc:'يحكي معاك ليبي صافي ويفهم كلامك بدون ما تحتاج تكتب بالفصحى.', icon:'💬'},
  {title:'تلخيص وشرح الدروس', desc:'يعطيك شرح بسيط لأي درس أو مادة بأسلوب تفهمه بسرعة.', icon:'📚'},
  {title:'كتابة وتصحيح', desc:'يساعدك تكتب رسائل، تقارير، أو تصحح نصوصك لغوياً.', icon:'✍️'},
  {title:'أفكار ومشاريع', desc:'يعطيك أفكار لمشروعك أو محتواك ويساعدك تطورها.', icon:'💡'},
  {title:'يحفظ محادثاتك', desc:'كل محادثاتك محفوظة ترجعلها أي وقت.', icon:'🗂️'},
  {title:'سريع وبسيط', desc:'واجهة نظيفة وسريعة بدون إعلانات ولا تعقيد.', icon:'⚡'},
]
export default function Features(){
  return (
    <section id="features" className="px-6 py-20 max-w-6xl mx-auto">
      <style>{`@keyframes pulseRing {0%{transform:scale(1); opacity:0.6} 100%{transform:scale(1.6); opacity:0}}`}</style>
      <h2 className="text-[32px] font-bold text-center">شن يقدر يدير رفيق؟</h2>
      <p className="text-center opacity-60 mt-3">أشياء مفيدة فعلاً، مش كلام وهمي</p>
      <div className="grid md:grid-cols-3 gap-5 mt-12">
        {feats.map((f,i)=>(
          <div key={i} className="group relative glass-strong rounded-[24px] p-6 overflow-hidden transition-all duration-500 hover:-translate-y-[8px] hover:rotate-[0.5deg] hover:shadow-[0_30px_60px_rgba(124,58,237,0.18)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[0.9s]" />
            <div className="relative w-12 h-12 rounded-full bg-[#EDE9FF] flex items-center justify-center text-[20px] group-hover:scale-110 transition-transform duration-300">
              <span className="absolute inset-0 rounded-full border border-[#7C3AED]/30 group-hover:animate-[pulseRing_1.2s_ease-out_infinite]"></span>
              {f.icon}
            </div>
            <h3 className="mt-4 font-bold text-[16px] relative z-10">{f.title}</h3>
            <p className="mt-2 text-sm opacity-60 leading-6 relative z-10">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
