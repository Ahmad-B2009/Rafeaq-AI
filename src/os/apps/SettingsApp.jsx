// src/os/apps/SettingsApp.jsx
// إعدادات Rafeeq OS: الخلفية، الحساب الدراسي، ترتيب النوافذ، تسجيل الخروج.
import { useState } from 'react'
import { WALLPAPERS } from '../apps'
import { readProfile } from '../osStorage'

export default function SettingsApp({ osRef, wallpaper }) {
  const os = osRef.current
  const [form, setForm] = useState(readProfile)
  const [saved, setSaved] = useState(false)

  const saveProfile = () => {
    os.saveProfile({
      name: form.name.trim() || 'الطالب',
      class: form.class.trim(),
      section: form.section.trim(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="ros-pad ros-settings" dir="rtl">
      <section>
        <h3>الخلفية</h3>
        <div className="ros-wp-grid">
          {WALLPAPERS.map((w) => (
            <button
              key={w.id}
              className={`ros-wp-tile ros-wp-${w.id} ${wallpaper === w.id ? 'on' : ''}`}
              onClick={() => os.setWallpaper(w.id)}
              aria-pressed={wallpaper === w.id}
              aria-label={w.name}
            >
              <span>{w.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>حسابك الدراسي</h3>
        {[['name', 'الاسم', 'اسمك كما تريد'], ['class', 'الصف', 'مثال: الصف التاسع'], ['section', 'الشعبة', 'مثال: شعبة 2']].map(([k, label, ph]) => (
          <label key={k} className="ros-field">
            <span>{label}</span>
            <input className="ros-input" value={form[k]} placeholder={ph} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
          </label>
        ))}
        <button className="ros-btn primary" onClick={saveProfile}>{saved ? 'تم الحفظ ✓' : 'حفظ'}</button>
        <p className="ros-muted">يستخدم رفيق AI صفّك ليلائم الشرح والأسئلة المنهج.</p>
      </section>

      <section>
        <h3>النوافذ</h3>
        <div className="ros-row">
          <button className="ros-btn" onClick={os.tile}>ترتيب جنباً إلى جنب</button>
          <button className="ros-btn" onClick={os.closeAll}>إغلاق كل النوافذ</button>
        </div>
      </section>

      <section>
        <h3>النظام</h3>
        <div className="ros-row">
          <button className="ros-btn danger" onClick={os.logout}>تسجيل الخروج</button>
        </div>
        <p className="ros-muted">رفيق AI — سطح المكتب والنوافذ والتطبيقات.</p>
      </section>
    </div>
  )
}
