import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RafeeqIcon } from '../components/RafeeqIcon.jsx'
import './Landing.css'

const products = [
  {
    id: 'ai',
    name: 'رفيق AI',
    category: 'اسأل وافهم',
    icon: 'ai',
    tone: 'purple',
    title: 'اسأل بطريقتك، وافهم خطوة بخطوة.',
    description: 'مساعد دراسي يشرح المفاهيم ويهيئك للمراجعة بأسلوب عربي واضح.',
    points: ['شرح مبسط للأفكار', 'أسئلة وبطاقات للمراجعة', 'إمكانية السؤال بالصورة'],
  },
  {
    id: 'notebook',
    name: 'دفتر رفيق',
    category: 'تعلّم من مصادرك',
    icon: 'notebook',
    tone: 'cyan',
    title: 'خلّ مصادرك جزءاً من الحوار.',
    description: 'أضف مستنداتك، اسأل عنها، واحتفظ بالملاحظات والملخصات في دفترك.',
    points: ['إضافة PDF ونصوص وروابط', 'إجابات مرتبطة بالمقاطع', 'مخرجات محفوظة للمراجعة'],
  },
  {
    id: 'board',
    name: 'السبورة',
    category: 'شاهد الفكرة',
    icon: 'board',
    tone: 'violet',
    title: 'من السؤال إلى شرح مرئي.',
    description: 'مساحة تفاعلية للرسم والكتابة ومتابعة خطوات الدرس.',
    points: ['أدوات كتابة ورسم', 'شرح صوتي عند توفره', 'صفحات وخيارات للمقاطعة'],
  },
  {
    id: 'lab',
    name: 'مختبر رفيق',
    category: 'نظّم المعرفة',
    icon: 'lab',
    tone: 'blue',
    title: 'شاهد الروابط بين الأفكار.',
    description: 'حلّل محتوى الدرس ونظّم مفاهيمه ومصطلحاته وعلاقاته.',
    points: ['استخراج أفكار ومصطلحات', 'تنظيم القوانين', 'حفظ التحليل في الملاحظات'],
  },
  {
    id: 'books',
    name: 'مكتبة رفيق',
    category: 'اجمع مراجعك',
    icon: 'book',
    tone: 'amber',
    title: 'مصادرك التعليمية في مكان واحد.',
    description: 'استكشف الكتب المتاحة واحتفظ بمصادرك الشخصية على جهازك.',
    points: ['تصفح الكتب المتاحة', 'حفظ الكتب على جهازك', 'إرسال مصدر إلى الدفتر'],
  },
  {
    id: 'tasks',
    name: 'الإنجاز',
    category: 'خطّط وأنجز',
    icon: 'list',
    tone: 'mint',
    title: 'حوّل مهامك اليومية إلى خطوات واضحة.',
    description: 'أضف مهامك، رتّب أولوياتها، وتابع ما أنجزته.',
    points: ['مهام وأولويات', 'مواعيد وتصنيفات', 'متابعة التقدم'],
  },
]

const demoQuestions = [
  {
    prompt: 'كيف أحل معادلة ٢س + ٤ = ١٠؟',
    answer: 'نطرح ٤ من الطرفين، فتصبح ٢س = ٦. نقسم الطرفين على ٢، إذن س = ٣.',
    tag: 'شرح خطوة بخطوة',
  },
  {
    prompt: 'ما الفرق بين الكتلة والوزن؟',
    answer: 'الكتلة مقدار المادة وتقاس بالكيلوغرام، أما الوزن فقوة جذب الجاذبية للجسم ويقاس بالنيوتن.',
    tag: 'مقارنة المفاهيم',
  },
  {
    prompt: 'اختبرني في درس الجهاز الهضمي',
    answer: 'سؤال سريع: أين يبدأ هضم النشويات؟ فكّر في دور اللعاب قبل أن تختار إجابتك.',
    tag: 'تدريب تفاعلي',
  },
]

const journey = [
  { number: '01', icon: 'question', title: 'اسأل', description: 'ابدأ من سؤالك أو من درس تريد فهمه.' },
  { number: '02', icon: 'brain', title: 'افهم', description: 'تابع الفكرة بشرح يناسب مستواك.' },
  { number: '03', icon: 'target', title: 'طبّق', description: 'اختبر فهمك بمسألة أو تدريب.' },
  { number: '04', icon: 'chart', title: 'تقدّم', description: 'نظّم تعلمك وتابع ما أنجزته.' },
]

const audiences = [
  {
    icon: 'graduation',
    title: 'للطالب',
    text: 'مكان يجمع الشرح، المصادر، التدريب، والمهام الدراسية.',
  },
  {
    icon: 'board',
    title: 'للمعلّم',
    text: 'أدوات مرئية تساعد على شرح الأفكار ومراجعة محتوى الدروس.',
  },
  {
    icon: 'heart',
    title: 'للأسرة',
    text: 'مساحة تعليمية واضحة يمكن استكشاف أدواتها مع الطالب.',
  },
]

const faqs = [
  {
    question: 'هل رفيق متاح مجاناً؟',
    answer: 'المنصة تتضمن حالياً حداً يومياً لاستخدام مساعد رفيق. تفاصيل الباقات والأسعار لم تُحدد بعد.',
  },
  {
    question: 'هل تُرفع كتبي وملفاتي إلى الإنترنت؟',
    answer: 'تُحفظ ملفات الدفتر على جهازك داخل تخزين المتصفح. عند طلب إجابة تعتمد على مصدر، تُرسل المقاطع اللازمة إلى مزود الذكاء الاصطناعي عبر خادم رفيق.',
  },
  {
    question: 'هل يجب تثبيت تطبيق؟',
    answer: 'يمكنك استخدام رفيق من المتصفح. بعض الأدوات، مثل الصوت، تعتمد على إمكانات المتصفح والجهاز.',
  },
  {
    question: 'هل الإجابات دائماً صحيحة؟',
    answer: 'قد يخطئ رفيق أحياناً؛ راجع المعلومات المهمة مع كتابك أو معلّمك، خصوصاً قبل الاختبارات.',
  },
]

function LandingLogo() {
  return (
    <span className="landing-logo" aria-hidden="true">
      <span>ر</span>
      <i />
    </span>
  )
}

function BrandLink({ onClick }) {
  return (
    <button className="landing-brand" type="button" onClick={onClick} aria-label="رفيق، الصفحة الرئيسية">
      <LandingLogo />
      <span className="landing-brand-copy">
        <strong>رفيق</strong>
        <small>مساحة تعلّمك</small>
      </span>
    </button>
  )
}

function ProductPreview({ product }) {
  if (product.id === 'ai') {
    return (
      <div className="preview-window">
        <div className="preview-window-bar"><i /><i /><i /><span>محادثة جديدة</span></div>
        <div className="preview-chat">
          <div className="preview-question"><span>أنت</span>{product.title}</div>
          <div className="preview-answer">
            <span className="preview-answer-mark"><RafeeqIcon name="ai" size={15} weight="duotone" /></span>
            <div>
              <strong>رفيق يشرح لك</strong>
              <p>{product.description}</p>
            </div>
          </div>
          <div className="preview-composer"><span>اكتب سؤالك هنا...</span><RafeeqIcon name="send" size={15} /></div>
        </div>
      </div>
    )
  }

  if (product.id === 'notebook') {
    return (
      <div className="preview-window preview-notebook">
        <div className="preview-window-bar"><i /><i /><i /><span>دفتر الأحياء</span></div>
        <div className="preview-notebook-layout">
          <div className="preview-source">
            <span className="preview-document"><RafeeqIcon name="file" size={18} /></span>
            <strong>الفصل الثالث.pdf</strong>
            <small>مصدر محدد · ١٢ صفحة</small>
            <span className="preview-source-line" />
            <span className="preview-source-line short" />
            <span className="preview-source-line" />
          </div>
          <div className="preview-note">
            <span className="preview-caption">إجابة من مصادرك</span>
            <strong>ما وظيفة الجهاز الدوري؟</strong>
            <p>ينقل الدم الأكسجين والمواد الغذائية إلى خلايا الجسم، ويساعد على التخلص من الفضلات.</p>
            <span className="preview-citation"><RafeeqIcon name="bookmark" size={12} /> المصدر · ص ٤</span>
          </div>
        </div>
      </div>
    )
  }

  if (product.id === 'board') {
    return (
      <div className="preview-window preview-board">
        <div className="preview-window-bar"><i /><i /><i /><span>مساحة السبورة</span></div>
        <div className="preview-canvas">
          <span className="preview-canvas-label">خطوات الحل</span>
          <strong>٢س + ٤ = ١٠</strong>
          <span className="preview-equation-line" />
          <strong>٢س = ٦</strong>
          <strong className="preview-equation-result">س = ٣</strong>
          <div className="preview-tool-dock">
            {['pen', 'eraser', 'text', 'undo'].map((icon) => <span key={icon}><RafeeqIcon name={icon} size={14} /></span>)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`preview-window preview-generic tone-${product.tone}`}>
      <div className="preview-window-bar"><i /><i /><i /><span>{product.name}</span></div>
      <div className="preview-generic-content">
        <span className="preview-big-icon"><RafeeqIcon name={product.icon} size={28} weight="duotone" /></span>
        <span className="preview-caption">{product.category}</span>
        <strong>{product.title}</strong>
        <div className="preview-generic-list">
          {product.points.map((point) => (
            <span key={point}><RafeeqIcon name="checkCircle" size={15} />{point}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [demoIndex, setDemoIndex] = useState(0)
  const [activeProductId, setActiveProductId] = useState('ai')
  const [activeFaq, setActiveFaq] = useState(0)
  const activeProduct = products.find((product) => product.id === activeProductId) || products[0]
  const activeDemo = demoQuestions[demoIndex]

  function goToLogin() {
    setMenuOpen(false)
    navigate('/login')
  }

  return (
    <div className="landing-page" dir="rtl">
      <header className="landing-header">
        <div className="landing-header-inner">
          <BrandLink onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          <button
            type="button"
            className="landing-menu-toggle"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <RafeeqIcon name={menuOpen ? 'x' : 'menu'} size={20} />
          </button>

          <nav className={`landing-nav ${menuOpen ? 'is-open' : ''}`} aria-label="التنقل الرئيسي">
            <a href="#experience" onClick={() => setMenuOpen(false)}>التجربة</a>
            <a href="#products" onClick={() => setMenuOpen(false)}>أدوات رفيق</a>
            <a href="#journey" onClick={() => setMenuOpen(false)}>رحلة التعلم</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>الأسئلة الشائعة</a>
            <button type="button" className="landing-mobile-cta" onClick={goToLogin}>ابدأ التعلّم</button>
          </nav>

          <div className="landing-header-actions">
            <button type="button" className="landing-login-link" onClick={goToLogin}>تسجيل الدخول</button>
            <button type="button" className="landing-button landing-button-primary landing-header-cta" onClick={goToLogin}>
              ابدأ التعلّم <RafeeqIcon name="arrowLeft" size={16} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-orb landing-hero-orb-one" aria-hidden="true" />
          <div className="landing-hero-orb landing-hero-orb-two" aria-hidden="true" />
          <div className="landing-hero-grid" aria-hidden="true" />
          <div className="landing-container landing-hero-layout">
            <div className="landing-hero-copy">
              <span className="landing-eyebrow"><span className="landing-live-dot" /> مساحة تعلّم عربية متكاملة</span>
              <h1>خلّ الفهم<br /><span>بداية كل إنجاز.</span></h1>
              <p className="landing-hero-description">
                اسأل، استكشف مصادرك، وطبّق ما تعلّمته. أدوات رفيق تجمع رحلتك الدراسية في مساحة واحدة.
              </p>
              <div className="landing-hero-actions">
                <button type="button" className="landing-button landing-button-primary" onClick={goToLogin}>
                  ابدأ التعلّم مع رفيق <RafeeqIcon name="arrowLeft" size={17} />
                </button>
                <a className="landing-button landing-button-quiet" href="#products">
                  اكتشف الأدوات <RafeeqIcon name="arrowDown" size={16} />
                </a>
              </div>
              <div className="landing-hero-notes">
                <span><RafeeqIcon name="globe" size={15} /> واجهة عربية</span>
                <span><RafeeqIcon name="device" size={15} /> تعمل من المتصفح</span>
                <span><RafeeqIcon name="shield" size={15} /> تحكم ببياناتك</span>
              </div>
            </div>

            <div className="landing-hero-visual" aria-label="مثال توضيحي لمحادثة مع رفيق">
              <div className="hero-visual-glow" aria-hidden="true" />
              <div className="hero-floating-note hero-floating-note-top">
                <span className="hero-floating-icon"><RafeeqIcon name="brain" size={16} weight="duotone" /></span>
                <span><strong>فهم الفكرة</strong><small>بخطوات واضحة</small></span>
              </div>

              <div className="hero-chat-window">
                <div className="hero-chat-header">
                  <span className="hero-chat-avatar"><RafeeqIcon name="ai" size={19} weight="duotone" /></span>
                  <span><strong>رفيق AI</strong><small><i /> جاهز للمساعدة</small></span>
                  <RafeeqIcon className="hero-chat-menu" name="more" size={20} />
                </div>

                <div className="hero-chat-content" aria-live="polite">
                  <span className="hero-demo-label">مثال توضيحي</span>
                  <div className="hero-user-message">{activeDemo.prompt}</div>
                  <div className="hero-assistant-message">
                    <span className="hero-assistant-mark"><RafeeqIcon name="sparkle" size={14} weight="duotone" /></span>
                    <div><small>{activeDemo.tag}</small><p>{activeDemo.answer}</p></div>
                  </div>
                  <div className="hero-chat-actions">
                    <button type="button" aria-label="استمع إلى الإجابة"><RafeeqIcon name="speaker" size={15} /></button>
                    <button type="button" aria-label="انسخ الإجابة"><RafeeqIcon name="copy" size={15} /></button>
                    <span>رفيق يساعدك على الفهم</span>
                  </div>
                </div>

                <div className="hero-prompt-list" aria-label="أمثلة للأسئلة">
                  {demoQuestions.map((item, index) => (
                    <button
                      type="button"
                      key={item.prompt}
                      className={index === demoIndex ? 'is-active' : ''}
                      aria-pressed={index === demoIndex}
                      onClick={() => setDemoIndex(index)}
                    >
                      {item.tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hero-floating-note hero-floating-note-bottom">
                <span className="hero-progress-icon"><RafeeqIcon name="target" size={17} weight="duotone" /></span>
                <span><strong>تعلّم ثم طبّق</strong><small>على طريقتك</small></span>
              </div>
            </div>
          </div>
          <div className="landing-hero-bottom">
            <span>من أول سؤال، تبدأ رحلتك</span>
            <a href="#experience" aria-label="انتقل إلى تجربة رفيق"><RafeeqIcon name="arrowDown" size={17} /></a>
          </div>
        </section>

        <section id="experience" className="landing-section landing-experience">
          <div className="landing-container">
            <div className="landing-section-heading">
              <span className="landing-eyebrow"><RafeeqIcon name="sparkle" size={15} /> تجربة رفيق</span>
              <h2>مش مجرد إجابة.<br /><span>فهم يوصّلك للي بعده.</span></h2>
              <p>رفيق يساعدك تربط بين السؤال والمصدر والتطبيق، بأدوات مصممة لرحلتك التعليمية.</p>
            </div>

            <div className="experience-grid">
              <article className="experience-card experience-card-main">
                <span className="experience-index">01 / اسأل</span>
                <div className="experience-chat-mini">
                  <span className="experience-avatar"><RafeeqIcon name="ai" size={18} weight="duotone" /></span>
                  <div><strong>ابدأ من سؤالك</strong><p>اكتب سؤالك أو أرفق صورة للمسألة.</p></div>
                  <RafeeqIcon name="image" size={18} />
                </div>
                <h3>شرح يتبع فضولك</h3>
                <p>اسأل بلهجتك، واطلب التوضيح أو مثالاً آخر وقت ما تحتاج.</p>
                <span className="experience-card-decoration"><RafeeqIcon name="chat" size={80} weight="duotone" /></span>
              </article>

              <article className="experience-card">
                <span className="experience-index">02 / استكشف</span>
                <span className="experience-icon tone-cyan"><RafeeqIcon name="notebook" size={22} weight="duotone" /></span>
                <h3>تعلّم من مصادرك</h3>
                <p>اربط أسئلتك بملفاتك واحفظ مخرجاتك في دفتر رفيق.</p>
                <div className="experience-source-line"><RafeeqIcon name="file" size={15} /> ملخص الدرس.pdf <span>مصدر محفوظ</span></div>
              </article>

              <article className="experience-card">
                <span className="experience-index">03 / طبّق</span>
                <span className="experience-icon tone-amber"><RafeeqIcon name="target" size={22} weight="duotone" /></span>
                <h3>حوّل الفهم إلى ممارسة</h3>
                <p>جهّز أسئلة مراجعة وبطاقات، وتدرّب على ما تعلمته.</p>
                <div className="experience-mini-chips"><span>مراجعة</span><span>تدريب</span><span>تقدّم</span></div>
              </article>
            </div>
          </div>
        </section>

        <section id="products" className="landing-section landing-products">
          <div className="landing-container">
            <div className="landing-section-heading landing-section-heading-center">
              <span className="landing-eyebrow"><RafeeqIcon name="grid" size={15} /> أدواتك في مكان واحد</span>
              <h2>كل أداة لها دور<br /><span>في رحلتك.</span></h2>
              <p>استكشف تطبيقات رفيق واختر الأداة التي تناسب ما تريد إنجازه الآن.</p>
            </div>

            <div className="product-showcase">
              <div className="product-tabs" role="tablist" aria-label="تطبيقات رفيق">
                {products.map((product) => (
                  <button
                    type="button"
                    role="tab"
                    key={product.id}
                    id={`product-tab-${product.id}`}
                    aria-selected={activeProductId === product.id}
                    aria-controls="product-panel"
                    className={`product-tab ${activeProductId === product.id ? 'is-active' : ''}`}
                    onClick={() => setActiveProductId(product.id)}
                  >
                    <span className={`product-tab-icon tone-${product.tone}`}><RafeeqIcon name={product.icon} size={17} weight="duotone" /></span>
                    {product.name}
                    <RafeeqIcon className="product-tab-arrow" name="arrowLeft" size={14} />
                  </button>
                ))}
              </div>

              <div className="product-panel" id="product-panel" role="tabpanel" aria-labelledby={`product-tab-${activeProduct.id}`}>
                <div className="product-copy">
                  <span className={`product-category tone-text-${activeProduct.tone}`}>{activeProduct.category}</span>
                  <h3>{activeProduct.title}</h3>
                  <p>{activeProduct.description}</p>
                  <ul>
                    {activeProduct.points.map((point) => <li key={point}><RafeeqIcon name="checkCircle" size={16} />{point}</li>)}
                  </ul>
                  <button type="button" className="landing-text-link" onClick={goToLogin}>
                    استكشف {activeProduct.name}<RafeeqIcon name="arrowLeft" size={16} />
                  </button>
                </div>
                <div className={`product-preview-wrap tone-bg-${activeProduct.tone}`}>
                  <ProductPreview product={activeProduct} />
                  <span className="product-preview-footnote"><RafeeqIcon name="info" size={13} /> نموذج بصري توضيحي</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="journey" className="landing-section landing-journey">
          <div className="landing-container">
            <div className="landing-section-heading">
              <span className="landing-eyebrow"><RafeeqIcon name="chart" size={15} /> رحلة التعلّم</span>
              <h2>من المعرفة<br /><span>إلى الإتقان.</span></h2>
              <p>ابدأ بخطوة صغيرة، واستخدم أدوات رفيق بالطريقة التي تخدم هدفك.</p>
            </div>
            <div className="journey-steps">
              {journey.map((step, index) => (
                <article className="journey-step" key={step.number}>
                  <div className="journey-step-top">
                    <span>{step.number}</span>
                    <span className="journey-step-icon"><RafeeqIcon name={step.icon} size={21} weight="duotone" /></span>
                    {index < journey.length - 1 && <i className="journey-connector" />}
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-audience">
          <div className="landing-container">
            <div className="landing-section-heading landing-section-heading-center">
              <span className="landing-eyebrow"><RafeeqIcon name="users" size={15} /> تعلّم يجمعنا</span>
              <h2>رفيق لكل من<br /><span>يهتم بالتعلّم.</span></h2>
              <p>أدوات تساعد كل شخص يشارك في رحلة التعليم، كلٌّ من زاويته.</p>
            </div>
            <div className="audience-grid">
              {audiences.map((audience, index) => (
                <article className="audience-card" key={audience.title}>
                  <span className={`audience-icon audience-icon-${index}`}><RafeeqIcon name={audience.icon} size={23} weight="duotone" /></span>
                  <h3>{audience.title}</h3>
                  <p>{audience.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="plans" className="landing-section landing-plans">
          <div className="landing-container">
            <div className="plans-card">
              <div className="plans-copy">
                <span className="landing-eyebrow"><RafeeqIcon name="sparkle" size={15} /> الوصول إلى رفيق</span>
                <h2>ابدأ رحلتك<br /><span>بما هو متاح اليوم.</span></h2>
                <p>تتضمن المنصة حالياً حداً يومياً للمحادثات. نعمل على تحديد الباقات والأسعار بعد مراجعة تكلفة الخدمات.</p>
                <button type="button" className="landing-button landing-button-primary" onClick={goToLogin}>
                  ادخل إلى مساحة التعلّم <RafeeqIcon name="arrowLeft" size={16} />
                </button>
              </div>
              <div className="plans-preview">
                <span className="plans-preview-icon"><RafeeqIcon name="wallet" size={22} weight="duotone" /></span>
                <span className="plans-status">الوضع الحالي</span>
                <strong>تفاصيل الاشتراكات قيد التطوير</strong>
                <p>لا توجد أسعار أو وسائل دفع معلنة حالياً.</p>
                <span className="plans-divider" />
                <span className="plans-note"><RafeeqIcon name="info" size={14} /> سنوضح الحدود والمزايا قبل إطلاق أي باقات.</span>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="landing-section landing-faq">
          <div className="landing-container landing-faq-layout">
            <div className="landing-section-heading">
              <span className="landing-eyebrow"><RafeeqIcon name="question" size={15} /> قبل أن تبدأ</span>
              <h2>أسئلة<br /><span>تستحق إجابة.</span></h2>
              <p>معلومات واضحة عن تجربة رفيق واستخدام بياناتك.</p>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <details
                  className="faq-item"
                  key={faq.question}
                  open={activeFaq === index}
                  onToggle={(event) => {
                    if (event.currentTarget.open) setActiveFaq(index)
                    else if (activeFaq === index) setActiveFaq(-1)
                  }}
                >
                  <summary>
                    {faq.question}
                    <span><RafeeqIcon name={activeFaq === index ? 'minus' : 'plus'} size={16} /></span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-final-glow" aria-hidden="true" />
          <div className="landing-container landing-final-content">
            <span className="landing-final-icon"><RafeeqIcon name="sparkle" size={23} weight="duotone" /></span>
            <span className="landing-eyebrow">خطوتك الجاية تبدأ هنا</span>
            <h2>جاهز تتعلّم<br />بطريقتك؟</h2>
            <p>افتح مساحتك، واسأل رفيق عن أول فكرة تريد فهمها.</p>
            <button type="button" className="landing-button landing-button-white" onClick={goToLogin}>
              ابدأ التعلّم الآن <RafeeqIcon name="arrowLeft" size={17} />
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <BrandLink onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <p>من المعرفة إلى الفهم، ومن الفهم إلى التطبيق.</p>
          <span>© {new Date().getFullYear()} رفيق AI</span>
        </div>
      </footer>
    </div>
  )
}
