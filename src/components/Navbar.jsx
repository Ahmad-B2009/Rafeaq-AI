import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
export default function Navbar(){
  const nav = useNavigate()
  const [scrolled,setScrolled]=useState(false)
  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>20)
    window.addEventListener('scroll',onScroll)
    return ()=>window.removeEventListener('scroll',onScroll)
  },[])
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-center p-4">
      <div className={`w-full max-w-6xl rounded-full px-6 h-[64px] flex items-center justify-between transition-all duration-500 ${scrolled ? 'glass-strong !bg-white/90 shadow-[0_8px_32px_rgba(124,58,237,0.18)] backdrop-blur-[32px]' : 'glass-strong'}`}>
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold transition-transform group-hover:scale-110 group-hover:rotate-3">ر</div>
          <span className="font-bold text-[18px]">رفيق</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <a href="#features" className="opacity-70 hover:opacity-100 relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-[#7C3AED] after:bottom-[-4px] after:right-0 hover:after:w-full after:transition-all">المميزات</a>
          <a href="#how" className="opacity-70 hover:opacity-100 relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-[#7C3AED] after:bottom-[-4px] after:right-0 hover:after:w-full after:transition-all">كيف يعمل</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>nav('/login')} className="px-5 h-10 rounded-full glass-strong text-sm hover:scale-105 transition-all">دخول</button>
          <button onClick={()=>nav('/login')} className="px-6 h-10 rounded-full bg-black text-white text-sm shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:scale-[1.03] hover:shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-all duration-300">ابدأ المحادثة</button>
        </div>
      </div>
    </nav>
  )
}
