// src/os/apps/BoardApp.jsx
// سبورة رفيق: صفحة تعريفية صادقة. الميزات الفعلية (المعلم، الكتابة، الصوت) تُبنى في المرحلة الرابعة.
export default function BoardApp() {
  return (
    <div className="ros-pad" dir="rtl">
      <div className="ros-board-card">
        <div className="ros-board-glow" />
        <h2>سبورة رفيق</h2>
        <p className="ros-badge">نموذج أولي — قيد التطوير</p>
        <p>
          هذا التطبيق محجوز له مكان في Rafeeq OS، لكن ميزاته لم تُنفَّذ بعد. حالياً لا توجد سبورة تعمل ولا معلمون ولا صوت.
        </p>
        <ul>
          <li>اختيار المعلم وإنشاؤه وتخصيصه</li>
          <li>كتابة تدريجية على السبورة مع الشرح</li>
          <li>إضاءة الحواف مع كلام المعلم</li>
          <li>الربط بالكتب والمصادر</li>
        </ul>
        <p className="ros-muted">تأتي هذه الأمور في المرحلة الرابعة، وستُختبر قبل إعلان اكتمالها.</p>
      </div>
    </div>
  )
}
