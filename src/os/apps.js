// src/os/apps.js
// سجل تطبيقات Rafeeq OS. كل تطبيق حقيقي يُفتح في نافذة واحدة فقط (single instance).
// kind: dash     → تبويب من Dashboard الحالي يعمل داخل النافذة (بدون نسخ منه)
//       home / tasks / settings → تطبيقات صغيرة خاصة بالنظام
// alias: اختصار لتطبيق موجود مع إعداد مسبق (مثل «ملفاتي» = مكتبتي داخل المكتبة)، ولا نافذة مستقلة له.

export const APPS = [
  { id: 'home', title: 'الرئيسية', icon: 'home', grad: 'linear-gradient(135deg,#8b7bff,#6d5ef5)', w: 810, h: 700, top: 150, kind: 'home', keywords: 'الرئيسية البداية ترحيب' },
  { id: 'ai', title: 'رفيق AI', desc: 'اسأل عن أي شيء في دراستك', icon: 'ai', grad: 'linear-gradient(135deg,#8b7bff,#6a4df0)', w: 860, h: 680, kind: 'dash', tab: 'ai', keywords: 'مساعد ذكاء اصطناعي شرح اسأل محادثة chat' },
  { id: 'files', title: 'ملفاتي', desc: 'كتبي المحفوظة على جهازي', icon: 'folder', grad: 'linear-gradient(135deg,#7cc8ff,#4a9cf0)', alias: { app: 'books', payload: { view: 'mine' } }, keywords: 'ملفات ملفاتي كتبي مكتبتي جهازي' },
  { id: 'books', title: 'المكتبة', desc: 'كتب ومصادر تعليمية', icon: 'book', grad: 'linear-gradient(135deg,#a78bfa,#7c5cf0)', w: 940, h: 660, kind: 'dash', tab: 'books', keywords: 'مكتبة كتب منهج دروس' },
  { id: 'tasks', title: 'المهام', desc: 'نظّم وقتك وإنجازاتك', icon: 'tasks', grad: 'linear-gradient(135deg,#34d3b0,#16b58a)', w: 460, h: 580, kind: 'tasks', keywords: 'مهام قائمة واجبات إنجازات' },
  { id: 'notebook', title: 'دفتر رفيق', desc: 'تلخيص وتحليل ملفاتك', icon: 'notebook', grad: 'linear-gradient(135deg,#6f8dff,#4a62e8)', w: 1000, h: 680, kind: 'dash', tab: 'notebook', keywords: 'دفتر مصادر ملخص تلخيص notebook' },
  { id: 'board', title: 'السبورة التفاعلية', desc: 'ارسم وتعلّم بسهولة', icon: 'board', grad: 'linear-gradient(135deg,#2fd4c0,#17a9c9)', w: 1100, h: 720, max: true, kind: 'board', keywords: 'سبورة معلم رسم شرح' },
  { id: 'vision', title: 'تحليل الصور', desc: 'حل المسائل من الصور', icon: 'image', grad: 'linear-gradient(135deg,#5fb4ff,#3b82f6)', alias: { app: 'ai', payload: { pickImage: true } }, keywords: 'صور تحليل صورة كاميرا مسألة' },
  { id: 'notes', title: 'ملاحظاتي', desc: 'دوّن أفكارك بسرعة', icon: 'notes', grad: 'linear-gradient(135deg,#f9b34c,#f27a3d)', w: 880, h: 620, kind: 'dash', tab: 'notes', keywords: 'ملاحظات دفتر' },
  { id: 'timer', title: 'مؤقت الدراسة', desc: 'ركّز بأسلوب بومودورو', icon: 'timer', grad: 'linear-gradient(135deg,#b49cff,#7a5cf0)', w: 580, h: 660, kind: 'dash', tab: 'timer', keywords: 'مؤقت تركيز بومودورو' },
  { id: 'settings', title: 'الإعدادات', desc: 'الخلفية والحساب الدراسي', icon: 'settings', grad: 'linear-gradient(135deg,#9aa6c4,#6b7799)', w: 660, h: 620, kind: 'settings', keywords: 'إعدادات خلفية حساب' },
]

// التطبيقات التي لها نافذة فعلية (بدون الاختصارات)
export const WINDOW_APPS = APPS.filter((a) => !a.alias)

export const getApp = (id) => APPS.find((a) => a.id === id)

// يحوّل الاختصار إلى التطبيق الحقيقي + إعداده المسبق
export function resolveApp(id, payload) {
  const app = getApp(id)
  if (!app) return null
  if (app.alias) return { app: getApp(app.alias.app), payload: { ...app.alias.payload, ...(payload || {}) } }
  return { app, payload }
}

// أيقونات شريط المهام الثابتة (بالترتيب)
export const PINNED = ['ai', 'files', 'books', 'tasks', 'vision', 'notebook', 'settings']

// أيقونات سطح المكتب (بالترتيب كما في التصميم)
export const DESKTOP_ICONS = ['ai', 'files', 'books', 'tasks', 'notebook', 'settings']

// أدوات سريعة (ودجت سطح المكتب)
export const QUICK_TOOLS = ['notes', 'timer', 'board']

export const WALLPAPERS = [
  { id: 'sunrise', name: 'شروق هادئ' },
  { id: 'light', name: 'فاتح هادئ' },
  { id: 'rafeeq', name: 'بنفسجي رفيق' },
  { id: 'aero', name: 'أزرق صافٍ' },
  { id: 'aurora', name: 'شفق أخضر' },
  { id: 'sunset', name: 'غروب' },
  { id: 'graphite', name: 'رمادي داكن' },
]
