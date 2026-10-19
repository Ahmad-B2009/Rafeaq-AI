// src/os/apps.js
// سجل تطبيقات Rafeeq OS. كل تطبيق يُفتح في نافذة واحدة فقط (single instance).
// kind: dash  → يعرض تبويباً من Dashboard الحالي (بدون أي نسخ جديدة منه)
//       tasks / settings / board → تطبيقات صغيرة جديدة

export const APPS = [
  { id: 'ai', title: 'رفيق AI', glyph: '✦', grad: 'linear-gradient(135deg,#7c6cff,#b06cff)', w: 820, h: 640, kind: 'dash', tab: 'ai', keywords: 'مساعد ذكاء اصطناعي شرح اسأل' },
  { id: 'board', title: 'سبورة رفيق', glyph: '✎', grad: 'linear-gradient(135deg,#2dd4a0,#1fc8e3)', w: 760, h: 560, kind: 'board', keywords: 'سبورة معلم رسم شرح' },
  { id: 'notebook', title: 'دفتر رفيق', glyph: '❖', grad: 'linear-gradient(135deg,#ff8a5b,#ff5e8a)', w: 980, h: 660, kind: 'dash', tab: 'notebook', keywords: 'دفتر مصادر ملخص' },
  { id: 'books', title: 'مكتبة رفيق', glyph: '▤', grad: 'linear-gradient(135deg,#1fc8e3,#3b82f6)', w: 920, h: 640, kind: 'dash', tab: 'books', keywords: 'مكتبة كتب منهج' },
  { id: 'tasks', title: 'مهامي', glyph: '✓', grad: 'linear-gradient(135deg,#34d399,#16a34a)', w: 460, h: 560, kind: 'tasks', keywords: 'مهام قائمة واجبات' },
  { id: 'notes', title: 'ملاحظاتي', glyph: '▢', grad: 'linear-gradient(135deg,#fbbf24,#f97316)', w: 860, h: 600, kind: 'dash', tab: 'notes', keywords: 'ملاحظات' },
  { id: 'timer', title: 'مؤقت الدراسة', glyph: '◷', grad: 'linear-gradient(135deg,#a78bfa,#6d5ef5)', w: 560, h: 640, kind: 'dash', tab: 'timer', keywords: 'مؤقت تركيز بومودورو' },
  { id: 'settings', title: 'الإعدادات', glyph: '⚙', grad: 'linear-gradient(135deg,#94a3b8,#475569)', w: 640, h: 600, kind: 'settings', keywords: 'إعدادات خلفية حساب' },
]

export const getApp = (id) => APPS.find((a) => a.id === id)

export const WALLPAPERS = [
  { id: 'aero', name: 'أيرو أزرق' },
  { id: 'rafeeq', name: 'بنفسجي رفيق' },
  { id: 'aurora', name: 'شفق أخضر' },
  { id: 'sunset', name: 'غروب' },
  { id: 'graphite', name: 'رمادي داكن' },
  { id: 'light', name: 'فاتح هادئ' },
]
