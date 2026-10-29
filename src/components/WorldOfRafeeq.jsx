
import './WorldOfRafeeq.css'

const features = [
  {
    number: '01',
    title: 'مساعد ذكي',
    description: 'اسأل رفيق وتعلّم بأسلوب واضح وبسيط.',
    icon: '✳',
    color: 'purple',
  },
  {
    number: '02',
    title: 'سبورة تفاعلية',
    description: 'افهم الأفكار من خلال الشرح والرسم.',
    icon: '⌁',
    color: 'cyan',
  },
  {
    number: '03',
    title: 'مساحة تعلّم',
    description: 'اجمع مصادرك وأدواتك الدراسية في مكان واحد.',
    icon: '▤',
    color: 'violet',
  },
]

function GlassRibbons() {
  return (
    <div className="wr-art" aria-hidden="true">
      <div className="wr-art-glow wr-art-glow--purple" />
      <div className="wr-art-glow wr-art-glow--cyan" />

      <div className="wr-ribbon-scene">
        <div className="wr-ribbon wr-ribbon--one" />
        <div className="wr-ribbon wr-ribbon--two" />
        <div className="wr-ribbon wr-ribbon--three" />
        <div className="wr-ribbon wr-ribbon--four" />
        <div className="wr-ribbon wr-ribbon--five" />
      </div>

      <div className="wr-art-orbit wr-art-orbit--one" />
      <div className="wr-art-orbit wr-art-orbit--two" />

      <span className="wr-art-dot wr-art-dot--one" />
      <span className="wr-art-dot wr-art-dot--two" />
      <span className="wr-art-dot wr-art-dot--three" />
      <span className="wr-art-dot wr-art-dot--four" />
    </div>
  )
}

export default function WorldOfRafeeq() {
  return (
    <section
      className="wr-section"
      dir="rtl"
      aria-labelledby="wr-heading"
    >
      <div className="wr-background-glow" aria-hidden="true" />

      <div className="wr-container">
        <div className="wr-heading">
          <span className="wr-eyebrow">
            <span className="wr-eyebrow-dot" />
            عالم رفيق
          </span>

          <h2 id="wr-heading" className="wr-title">
            تعلّم بطريقة
            <br />
            <span>تناسب عالمك.</span>
          </h2>

          <p className="wr-description">
            أكثر من مجرد مساعد ذكي؛ مساحة تعليمية تجمع أدواتك
            في تجربة واحدة، لتفهم دروسك وتنظّم تعلّمك وتكتشف
            طرقًا جديدة للوصول إلى المعرفة.
          </p>

          <div className="wr-highlights">
            <span>
              <span className="wr-check">✓</span>
              تجربة تعليمية مترابطة
            </span>

            <span>
              <span className="wr-check">✓</span>
              واجهة عربية سهلة
            </span>
          </div>
        </div>

        <div className="wr-visual">
          <GlassRibbons />

          <div className="wr-floating-card wr-floating-card--top">
            <span className="wr-floating-icon">✦</span>
            <div>
              <strong>أفكارك تبدأ هنا</strong>
              <span>مساحة للإبداع والتعلّم</span>
            </div>
          </div>

          <div className="wr-floating-card wr-floating-card--bottom">
            <span className="wr-status-dot" />
            <div>
              <strong>كل شيء في مكان واحد</strong>
              <span>تعلّم • اكتشف • أنجز</span>
            </div>
          </div>
        </div>
      </div>

      <div className="wr-features">
        {features.map((feature) => (
          <article
            className="wr-feature"
            key={feature.number}
          >
            <div className={`wr-feature-icon wr-feature-icon--${feature.color}`}>
              {feature.icon}
            </div>

            <div className="wr-feature-content">
              <span className="wr-feature-number">
                {feature.number}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>

            <span className="wr-feature-arrow" aria-hidden="true">
              ↙
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
