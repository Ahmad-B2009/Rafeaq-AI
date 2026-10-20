// src/os/apps/HomeApp.jsx
// نافذة «الرئيسية»: ترحيب + بطاقات التطبيقات الأساسية. كل بطاقة تفتح تطبيقها الحقيقي.
import { Icon, AppIcon } from '../icons'
import { getApp } from '../apps'

const CARDS = ['ai', 'notebook', 'books', 'tasks', 'board', 'vision']

export default function HomeApp({ profile, open, logo }) {
  return (
    <div className="ros-pad ros-home" dir="rtl">
      <div className="ros-home-hero">
        <div>
          <h2>مرحباً {profile.name} <span aria-hidden="true">👋</span></h2>
          <p>مستعد لمساعدتك في رحلتك الدراسية</p>
        </div>
        <span className="ros-hero-bot" aria-hidden="true">
          <img src={logo} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </span>
      </div>

      <div className="ros-home-grid">
        {CARDS.map(getApp).map((a) => (
          <button key={a.id} className="ros-hcard" onClick={() => open(a.id)}>
            <AppIcon app={a} size={46} />
            <strong>{a.title}</strong>
            <small>{a.desc}</small>
            <span className="ros-hgo"><Icon name="arrow" size={16} /></span>
          </button>
        ))}
      </div>

      <div className="ros-quote">
        <Icon name="bulb" size={34} stroke={1.5} />
        <div>
          <p>التعلم ليس استعداداً للحياة، بل هو الحياة نفسها.</p>
          <small>— جون ديوي</small>
        </div>
      </div>
    </div>
  )
}
