export default function Footer(){
  return (
    <footer className="px-6 py-10 border-t border-black/5 mt-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-[#EDE9FF]/30 to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative">
        <div className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">ر</div>
          <span className="font-bold">رفيق</span>
        </div>
        <div className="text-sm opacity-60 hover:opacity-100 transition-opacity">© 2026 Rafeaq AI — Developed By : Ahmad Bendago</div>
      </div>
    </footer>
  )
}
