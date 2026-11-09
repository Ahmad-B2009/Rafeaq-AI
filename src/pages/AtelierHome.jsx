
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RafeeqIcon } from '../components/RafeeqIcon.jsx'

const apps = [
  {
    id: 'ai',
    title: 'رفيق AI',
    description: 'اسأل، ناقش، وافهم أفكارك مع رفيق.',
    icon: 'ai',
    color: 'purple',
    path: '/dashboard/ai',
  },
  {
    id: 'lab',
    title: 'مختبر رفيق',
    description: 'استكشف المفاهيم والتجارب التعليمية.',
    icon: 'lab',
    color: 'cyan',
    path: '/dashboard/lab',
  },
  {
    id: 'notebook',
    title: 'دفتر رفيق',
    description: 'اجمع مصادرك وملاحظاتك في مكان واحد.',
    icon: 'notebook',
    color: 'pearl',
    path: '/dashboard/notebook',
  },
  {
    id: 'board',
    title: 'السبورة',
    description: 'مساحة تفاعلية للشرح والرسم والتعلّم.',
    icon: 'board',
    color: 'purple',
    path: '/dashboard/board',
  },
  {
    id: 'books',
    title: 'مكتبة رفيق',
    description: 'اكتشف كتبك ومصادرك التعليمية.',
    icon: 'book',
    color: 'cyan',
    path: '/dashboard/books',
  },
  {
    id: 'achievement',
    title: 'الإنجاز',
    description: 'تابع أعمالك وما أنجزته في رحلتك.',
    icon: 'list',
    color: 'pearl',
    path: '/dashboard/tasks',
  },
]

function getUserName() {
  try {
    const directName = localStorage.getItem('rafeaq_name')
    if (directName?.trim()) return directName.trim()

    const user = JSON.parse(localStorage.getItem('rafeaq_user') || 'null')
    return user?.name?.trim() || user?.fullName?.trim() || ''
  } catch {
    return ''
  }
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'صباح الخير'
  if (hour >= 12 && hour < 17) return 'طاب يومك'
  if (hour >= 17 && hour < 21) return 'مساء الخير'
  return 'أهلاً بك'
}

function AppCard({ app, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(app.path)}
      className={`atelier-app-card ${app.color}`}
    >
      <span className="atelier-app-icon"><RafeeqIcon name={app.icon} size={22} weight="duotone" /></span>

      <span className="atelier-app-content">
        <strong>{app.title}</strong>
        <span>{app.description}</span>
      </span>

      <span className="atelier-app-arrow">←</span>
    </button>
  )
}

export default function AtelierHome() {
  const navigate = useNavigate()

  const name = useMemo(() => getUserName(), [])
  const greeting = useMemo(() => getGreeting(), [])

  const date = useMemo(
    () =>
      new Intl.DateTimeFormat('ar', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date()),
    []
  )

  const openApp = (path) => navigate(path)

  return (
    <main className="atelier-home" dir="rtl">
      <style>{`
        .atelier-home {
          --atelier-bg: #FBFAF7;
          --atelier-surface: #FFFFFF;
          --atelier-purple: #7955C8;
          --atelier-purple-soft: #F2EDFA;
          --atelier-cyan: #24BBD1;
          --atelier-text: #282532;
          --atelier-muted: #817C89;
          --atelier-border: #EAE6EE;

          width: 100%;
          min-height: 100%;
          padding: 30px;
          color: var(--atelier-text);
          background: var(--atelier-bg);
          font-family: 'Tajawal', sans-serif;
        }

        .atelier-home * {
          box-sizing: border-box;
        }

        .atelier-welcome {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          min-height: 215px;
          padding: 34px;
          border: 1px solid #E9E0F5;
          border-radius: 25px;
          background:
            radial-gradient(circle at 85% 10%, rgba(255,255,255,.9), transparent 32%),
            linear-gradient(120deg, #F3EDFC, #F8F7FC 58%, #EAF9FB);
        }

        .atelier-welcome-copy {
          position: relative;
          z-index: 1;
          max-width: 590px;
        }

        .atelier-date {
          color: var(--atelier-muted);
          font-size: 13px;
          margin-bottom: 13px;
        }

        .atelier-welcome h1 {
          margin: 0;
          font-size: clamp(27px, 3vw, 38px);
          font-weight: 800;
          line-height: 1.5;
          letter-spacing: -.7px;
        }

        .atelier-welcome h1 span {
          color: var(--atelier-purple);
        }

        .atelier-welcome p {
          margin: 9px 0 0;
          color: #716B7D;
          font-size: 15px;
          line-height: 1.9;
        }

        .atelier-welcome-decoration {
          position: relative;
          display: grid;
          flex: 0 0 145px;
          width: 145px;
          height: 145px;
          place-items: center;
          border: 1px solid rgba(121,85,200,.14);
          border-radius: 42px;
          background: rgba(255,255,255,.55);
          transform: rotate(-8deg);
        }

        .atelier-welcome-decoration span {
          color: var(--atelier-purple);
          font-size: 76px;
          font-weight: 400;
          transform: rotate(8deg);
        }

        .atelier-section {
          margin-top: 35px;
        }

        .atelier-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 17px;
        }

        .atelier-section-heading h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
        }

        .atelier-section-heading p {
          margin: 5px 0 0;
          color: var(--atelier-muted);
          font-size: 13px;
        }

        .atelier-app-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
        }

        .atelier-app-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 15px;
          width: 100%;
          min-height: 125px;
          padding: 20px;
          text-align: right;
          border: 1px solid var(--atelier-border);
          border-radius: 19px;
          background: var(--atelier-surface);
          cursor: pointer;
          transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
          font-family: inherit;
        }

        .atelier-app-card:hover {
          transform: translateY(-3px);
          border-color: #D7C9EF;
          box-shadow: 0 12px 28px rgba(65, 48, 93, .07);
        }

        .atelier-app-icon {
          display: grid;
          flex: 0 0 47px;
          width: 47px;
          height: 47px;
          place-items: center;
          border-radius: 15px;
          font-size: 24px;
          font-weight: 700;
        }

        .atelier-app-card.purple .atelier-app-icon {
          color: #7955C8;
          background: #F2EDFA;
        }

        .atelier-app-card.cyan .atelier-app-icon {
          color: #159DB2;
          background: #E9F8FA;
        }

        .atelier-app-card.pearl .atelier-app-icon {
          color: #716A80;
          background: #F5F3F7;
        }

        .atelier-app-content {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
          padding-top: 2px;
        }

        .atelier-app-content strong {
          font-size: 15px;
          font-weight: 800;
        }

        .atelier-app-content > span {
          color: var(--atelier-muted);
          font-size: 12px;
          line-height: 1.8;
        }

        .atelier-app-arrow {
          align-self: center;
          color: #AAA3B3;
          font-size: 19px;
        }

        .atelier-lower-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 15px;
          margin-top: 30px;
        }

        .atelier-info-card {
          min-height: 155px;
          padding: 23px;
          border: 1px solid var(--atelier-border);
          border-radius: 19px;
          background: #FFFFFF;
        }

        .atelier-info-card h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
        }

        .atelier-info-card p {
          margin: 8px 0 0;
          color: var(--atelier-muted);
          font-size: 13px;
          line-height: 1.9;
        }

        .atelier-empty-symbol {
          display: inline-grid;
          width: 34px;
          height: 34px;
          margin-bottom: 12px;
          place-items: center;
          border-radius: 11px;
          color: var(--atelier-purple);
          background: var(--atelier-purple-soft);
          font-size: 19px;
        }

        .atelier-footer {
          margin-top: 35px;
          padding: 18px 0 5px;
          color: #A19BA8;
          text-align: center;
          font-size: 11px;
        }

        @media (max-width: 1050px) {
          .atelier-app-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .atelier-home {
            padding: 17px;
          }

          .atelier-welcome {
            min-height: 175px;
            padding: 23px;
            border-radius: 20px;
          }

          .atelier-welcome-decoration {
            flex-basis: 75px;
            width: 75px;
            height: 75px;
            border-radius: 25px;
          }

          .atelier-welcome-decoration span {
            font-size: 43px;
          }

          .atelier-welcome p {
            font-size: 13px;
          }

          .atelier-section {
            margin-top: 27px;
          }

          .atelier-app-grid {
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .atelier-app-card {
            min-height: 100px;
            padding: 16px;
          }

          .atelier-lower-grid {
            grid-template-columns: 1fr;
            margin-top: 23px;
          }
        }

        @media (max-width: 390px) {
          .atelier-welcome-decoration {
            display: none;
          }

          .atelier-welcome {
            min-height: 155px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .atelier-app-card {
            transition: none;
          }
        }
      `}</style>

      <section className="atelier-welcome">
        <div className="atelier-welcome-copy">
          <div className="atelier-date">{date}</div>

          <h1>
            {greeting}{name ? `، ${name}` : ''}
            <br />
            <span>أهلاً بك في رفيق.</span>
          </h1>

          <p>
            مساحتك الخاصة للتعلّم والاستكشاف وصناعة أفكار جديدة.
            ابدأ من المكان الذي يناسبك.
          </p>
        </div>

        <div className="atelier-welcome-decoration" aria-hidden="true">
          <RafeeqIcon name="ai" size={76} weight="duotone" />
        </div>
      </section>

      <section className="atelier-section">
        <div className="atelier-section-heading">
          <div>
            <h2>مساحتك التعليمية</h2>
            <p>كل أدواتك الأساسية في مكان واحد.</p>
          </div>
        </div>

        <div className="atelier-app-grid">
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onClick={openApp}
            />
          ))}
        </div>
      </section>

      <section className="atelier-lower-grid">
        <article className="atelier-info-card">
          <span className="atelier-empty-symbol"><RafeeqIcon name="chart" size={20} /></span>
          <h3>رحلتك التعليمية</h3>
          <p>
            ستظهر هنا متابعتك وتقدمك عندما نربط بيانات التعلّم الفعلية.
            لن نعرض أرقاماً تقديرية على أنها إنجازات حقيقية.
          </p>
        </article>

        <article className="atelier-info-card">
          <span className="atelier-empty-symbol"><RafeeqIcon name="notebook" size={20} /></span>
          <h3>مساحة العمل الأخيرة</h3>
          <p>
            ستجد هنا أعمالك وملاحظاتك الأخيرة بعد ربطها بمصادر البيانات
            الموجودة في المشروع.
          </p>
        </article>
      </section>

      <footer className="atelier-footer">
        Rafeeq Atelier · مساحة للتعلّم والإبداع
      </footer>
    </main>
  )
}
