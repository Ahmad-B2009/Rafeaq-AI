import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RafeeqIcon } from '../components/RafeeqIcon.jsx'
import { readUserPreferences, saveUserPreferences } from '../lib/userPreferences'
import './SettingsCenter.css'

const sections = [
  { id: 'general', label: 'عام', icon: 'settings' },
  { id: 'ai', label: 'تفضيلات رفيق', icon: 'ai' },
  { id: 'account', label: 'الحساب', icon: 'user' },
  { id: 'privacy', label: 'الخصوصية والبيانات', icon: 'lock' },
  { id: 'help', label: 'المساعدة', icon: 'info' },
]

function readProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem('rafeaq_profile') || '{}')
    const rawUser = localStorage.getItem('rafeaq_user')
    let user = {}
    try {
      user = JSON.parse(rawUser || '{}') || {}
    } catch {
      user = { id: rawUser || '' }
    }

    return {
      name: localStorage.getItem('rafeaq_name') || user.name || user.fullName || saved.name || '',
      class: saved.class || localStorage.getItem('rafeaq_student_class') || '',
      section: saved.section || localStorage.getItem('rafeaq_student_section') || '',
      email: user.email || '',
      id: user.id || (typeof rawUser === 'string' && !rawUser.startsWith('{') ? rawUser : ''),
    }
  } catch {
    return { name: '', class: '', section: '', email: '', id: '' }
  }
}

function SettingRow({ title, description, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-copy">
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  )
}

function PreferenceButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      className={`settings-choice ${selected ? 'is-selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {children}
    </button>
  )
}

export default function SettingsCenter() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('general')
  const [preferences, setPreferences] = useState(readUserPreferences)
  const [profile, setProfile] = useState(readProfile)
  const [voices, setVoices] = useState([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const availableVoices = () => {
      if (!('speechSynthesis' in window)) return
      setVoices(window.speechSynthesis.getVoices().filter((voice) => /^ar([_-]|$)/i.test(voice.lang)))
    }

    availableVoices()
    if ('speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', availableVoices)
      return () => window.speechSynthesis.removeEventListener('voiceschanged', availableVoices)
    }
  }, [])

  const currentSection = sections.find((section) => section.id === activeSection) || sections[0]
  function updatePreference(key, value) {
    try {
      const next = saveUserPreferences({ [key]: value })
      setPreferences(next)
    } catch (error) {
      console.error('Unable to save user preferences:', error)
      showNotice('تعذر حفظ التفضيل؛ تحقق من مساحة التخزين في المتصفح')
    }
  }

  function saveProfile(event) {
    event.preventDefault()
    const next = {
      name: profile.name.trim() || 'الطالب',
      class: profile.class.trim(),
      section: profile.section.trim(),
    }
    try {
      localStorage.setItem('rafeaq_profile', JSON.stringify(next))
      localStorage.setItem('rafeaq_name', next.name)
      localStorage.setItem('rafeaq_student_class', next.class)
      localStorage.setItem('rafeaq_student_section', next.section)
      setProfile((current) => ({ ...current, ...next }))
      window.dispatchEvent(new CustomEvent('rafeeq-profile-change', { detail: next }))
      showNotice('حُفظت بيانات الملف الشخصي')
    } catch (error) {
      console.error('Unable to save profile:', error)
      showNotice('تعذر حفظ بيانات الملف الشخصي؛ تحقق من مساحة التخزين')
    }
  }

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  function signOut() {
    localStorage.removeItem('rafeaq_token')
    sessionStorage.setItem('just_logged_out', '1')
    navigate('/login', { replace: true })
  }

  function exportSettings() {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: {
        name: profile.name,
        class: profile.class,
        section: profile.section,
        email: profile.email,
      },
      preferences,
    }
    try {
      const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = 'rafeeq-settings.json'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      showNotice('تم تنزيل نسخة الإعدادات والملف الشخصي')
    } catch (error) {
      console.error('Unable to export settings:', error)
      showNotice('تعذر تنزيل نسخة الإعدادات')
    }
  }

  return (
    <div className="settings-center" dir="rtl">
      <header className="settings-heading">
        <div>
          <span className="settings-eyebrow">مساحتك، بطريقتك</span>
          <h1>الإعدادات</h1>
          <p>تحكم في تفضيلاتك وبيانات حسابك من مكان واحد.</p>
        </div>
        <span className="settings-heading-icon"><RafeeqIcon name="settings" size={25} weight="duotone" /></span>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="أقسام الإعدادات">
          {sections.map((section) => (
            <button
              type="button"
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? 'is-active' : ''}`}
              onClick={() => setActiveSection(section.id)}
              aria-current={activeSection === section.id ? 'page' : undefined}
            >
              <RafeeqIcon name={section.icon} size={18} weight={activeSection === section.id ? 'duotone' : 'regular'} />
              <span>{section.label}</span>
              <RafeeqIcon className="settings-nav-arrow" name="arrowLeft" size={14} />
            </button>
          ))}
        </nav>

        <main className="settings-panel">
          <div className="settings-panel-heading">
            <span className="settings-panel-icon"><RafeeqIcon name={currentSection.icon} size={20} weight="duotone" /></span>
            <div>
              <h2>{currentSection.label}</h2>
              <p>{activeSection === 'general' ? 'خصص مظهر مساحة التعلم وطريقة عرضها.' : 'إدارة تفضيلاتك وإعداداتك.'}</p>
            </div>
          </div>

          {activeSection === 'general' && (
            <section className="settings-group" aria-label="الإعدادات العامة">
              <SettingRow title="المظهر" description="يتكيف مع تفضيلك أثناء استخدام مساحة التعلم.">
                <div className="settings-choice-group">
                  <PreferenceButton selected={preferences.theme === 'light'} onClick={() => updatePreference('theme', 'light')}>
                    <RafeeqIcon name="lightbulb" size={15} /> فاتح
                  </PreferenceButton>
                  <PreferenceButton selected={preferences.theme === 'dark'} onClick={() => updatePreference('theme', 'dark')}>
                    <RafeeqIcon name="moon" size={15} /> داكن
                  </PreferenceButton>
                </div>
              </SettingRow>

              <SettingRow title="حجم النص" description="يضبط حجم النص الأساسي في واجهة أتيلييه.">
                <div className="settings-choice-group">
                  {[
                    ['small', 'صغير'],
                    ['medium', 'متوسط'],
                    ['large', 'كبير'],
                  ].map(([value, label]) => (
                    <PreferenceButton key={value} selected={preferences.fontSize === value} onClick={() => updatePreference('fontSize', value)}>
                      {label}
                    </PreferenceButton>
                  ))}
                </div>
              </SettingRow>

              <SettingRow title="تقليل الحركة" description="تقليل الحركات الانتقالية والزخرفية.">
                <button
                  type="button"
                  className={`settings-switch ${preferences.reduceMotion ? 'is-on' : ''}`}
                  role="switch"
                  aria-checked={preferences.reduceMotion}
                  aria-label="تقليل الحركة"
                  onClick={() => updatePreference('reduceMotion', !preferences.reduceMotion)}
                >
                  <span />
                </button>
              </SettingRow>

              <SettingRow title="اللغة" description="واجهة رفيق متاحة حالياً باللغة العربية.">
                <span className="settings-readonly-value"><RafeeqIcon name="globe" size={15} /> العربية</span>
              </SettingRow>
            </section>
          )}

          {activeSection === 'ai' && (
            <section className="settings-group" aria-label="تفضيلات رفيق">
              <SettingRow title="أسلوب الإجابة" description="يُطبّق على محادثاتك الجديدة مع رفيق.">
                <select
                  className="settings-select"
                  value={preferences.responseStyle}
                  onChange={(event) => updatePreference('responseStyle', event.target.value)}
                >
                  <option value="concise">موجز ومباشر</option>
                  <option value="balanced">متوازن</option>
                  <option value="detailed">مفصل وخطوة بخطوة</option>
                </select>
              </SettingRow>

              <SettingRow title="الصوت العربي" description="تختلف الأصوات المتاحة حسب المتصفح والجهاز.">
                <select
                  className="settings-select"
                  value={preferences.voiceURI}
                  onChange={(event) => updatePreference('voiceURI', event.target.value)}
                  disabled={!voices.length}
                >
                  <option value="">الصوت العربي الافتراضي</option>
                  {voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} — {voice.lang}</option>
                  ))}
                </select>
              </SettingRow>

              {!voices.length && (
                <p className="settings-inline-note">لم يعثر المتصفح على صوت عربي إضافي؛ سيُستخدم الصوت الافتراضي إن كان متاحاً.</p>
              )}

              <SettingRow title="سرعة التحدث" description="تؤثر على الشرح الصوتي في السبورة.">
                <div className="settings-range">
                  <span>أبطأ</span>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.1"
                    value={preferences.speechRate}
                    onChange={(event) => updatePreference('speechRate', Number(event.target.value))}
                    aria-label="سرعة التحدث"
                  />
                  <span>أسرع</span>
                  <strong>{preferences.speechRate.toFixed(1)}×</strong>
                </div>
              </SettingRow>
            </section>
          )}

          {activeSection === 'account' && (
            <>
              <form className="settings-group" onSubmit={saveProfile}>
                <div className="settings-profile-summary">
                  <span className="settings-profile-avatar">{profile.name?.trim().charAt(0) || 'ر'}</span>
                  <div>
                    <strong>{profile.name || 'أهلاً بك في رفيق'}</strong>
                    <span>{profile.email || 'الاسم والمعلومات الدراسية محفوظة على هذا الجهاز'}</span>
                  </div>
                </div>

                {[
                  ['name', 'الاسم', 'الاسم الذي يظهر في مساحة التعلم'],
                  ['class', 'المرحلة أو الصف', 'مثال: الصف التاسع'],
                  ['section', 'الشعبة', 'اختياري'],
                ].map(([key, label, placeholder]) => (
                  <label className="settings-field" key={key}>
                    <span>{label}</span>
                    <input
                      value={profile[key]}
                      onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))}
                      placeholder={placeholder}
                    />
                  </label>
                ))}

                {profile.id && (
                  <p className="settings-inline-note">معرّف تسجيل الدخول: <bdi>{profile.id}</bdi></p>
                )}
                <button className="settings-primary-button" type="submit"><RafeeqIcon name="check" size={16} /> حفظ بيانات الملف الشخصي</button>
              </form>

              <div className="settings-danger-zone">
                <div>
                  <strong>إنهاء الجلسة على هذا الجهاز</strong>
                  <span>لن تُحذف بياناتك المحلية عند تسجيل الخروج.</span>
                </div>
                <button type="button" className="settings-danger-button" onClick={signOut}>
                  <RafeeqIcon name="logout" size={16} /> تسجيل الخروج
                </button>
              </div>
            </>
          )}

          {activeSection === 'privacy' && (
            <section className="settings-group" aria-label="الخصوصية والبيانات">
              <div className="settings-privacy-card">
                <RafeeqIcon name="device" size={21} weight="duotone" />
                <div>
                  <strong>بياناتك المحلية</strong>
                  <p>تُحفظ إعداداتك وملفك الشخصي ودفاتر المصادر على هذا الجهاز في تخزين المتصفح. حذف بيانات المتصفح قد يزيلها.</p>
                </div>
              </div>
              <div className="settings-privacy-card is-cloud">
                <RafeeqIcon name="share" size={21} weight="duotone" />
                <div>
                  <strong>عند استخدام الذكاء الاصطناعي</strong>
                  <p>تُرسل رسالتك والسياق اللازم، بما فيه الصور التي تختار إرفاقها، عبر خادم رفيق إلى مزود الذكاء الاصطناعي لمعالجة الطلب. في وضع الدفتر تُرسل المقاطع ذات الصلة؛ ملفات المصادر نفسها تبقى مخزنة محلياً.</p>
                </div>
              </div>
              <div className="settings-data-actions">
                <div>
                  <strong>نسخة من إعداداتك وملفك الشخصي</strong>
                  <span>لا تتضمن كلمات المرور أو رموز تسجيل الدخول أو ملفات الكتب.</span>
                </div>
                <button type="button" className="settings-secondary-button" onClick={exportSettings}>
                  <RafeeqIcon name="download" size={16} /> تنزيل نسخة JSON
                </button>
              </div>
              <p className="settings-inline-note">إدارة وحذف المحادثات والكتب متاحة من أدواتها داخل رفيق. حذف الحساب أو إدارة الجلسات عن بُعد غير متاح حالياً.</p>
            </section>
          )}

          {activeSection === 'help' && (
            <section className="settings-group" aria-label="المساعدة والدعم">
              <details className="settings-faq" open>
                <summary>أين تُحفظ كتبي ومصادر الدفتر؟</summary>
                <p>تُحفظ ملفات ومقاطع مصادر الدفتر في تخزين المتصفح على جهازك. عند السؤال عنها، تُرسل المقاطع المرتبطة بالسؤال إلى مزود الذكاء الاصطناعي عبر خادم رفيق لصياغة الإجابة.</p>
              </details>
              <details className="settings-faq">
                <summary>لماذا لا أرى خيار تغيير كلمة المرور أو الاشتراك؟</summary>
                <p>تغيير كلمة المرور وإدارة الاشتراكات والدفع تحتاج إلى خدمات حسابات وفوترة غير مفعّلة في المشروع حالياً.</p>
              </details>
              <details className="settings-faq">
                <summary>كيف أغير الصوت أو سرعة الشرح؟</summary>
                <p>من «تفضيلات رفيق» اختر صوتاً عربياً متاحاً على جهازك واضبط سرعة التحدث. توافر الأصوات يعتمد على المتصفح ونظام التشغيل.</p>
              </details>
              <div className="settings-support-card">
                <RafeeqIcon name="info" size={19} />
                <span>لا توجد قناة دعم داخل التطبيق حالياً. للمساعدة التقنية، تواصل مع مطور المشروع عبر قنواته المنشورة.</span>
              </div>
            </section>
          )}
        </main>
      </div>

      {notice && <div className="settings-toast" role="status"><RafeeqIcon name="checkCircle" size={16} /> {notice}</div>}
    </div>
  )
}
