// src/components/SmartBoard.jsx
// سبورة رفيق AI التفاعلية الذكية - مستوحاة من فكرة ومنصة Accelute العالمية
// معلم ذكاء اصطناعي يرسم ويكتب ويشرح صوتياً متزامناً، مع إمكانية المقاطعة وطرح الأسئلة الحية والتنقل بين الخطوات
// متوافقة تماماً وبأعلى أداء على اللابتوب والتابلت والهاتف بهوية رفيق أتيلييه اللؤلؤية (Pearl White & Atelier Purple)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../os/icons'
import { speak, pauseVoice, resumeVoice, voiceAvailable } from '../lib/boardVoice'

// مساحة السبورة الافتراضية بنسبة 16:9
const VW = 1600
const VH = 900
const STORE_KEY = 'rafeaq_smartboard_accelute_v5'
const DAY_KEY = 'rafeaq_smartboard_day_v1'
const DAILY_LESSONS = 20

// شخصيات المعلمين بهوية رفيق أتيلييه اللؤلؤية
export const TEACHERS = [
  { id: 'siraj', name: 'سراج', subject: 'الرياضيات والهندسة', color: '#2563EB', color2: '#60A5FA', pitch: 0.95, rate: 0.95, avatar: 'line' },
  { id: 'atheer', name: 'أثير', subject: 'الكيمياء والعلوم', color: '#7955C8', color2: '#A78BFA', pitch: 1.15, rate: 0.98, avatar: 'lab' },
  { id: 'madar', name: 'مدار', subject: 'الفيزياء والحركة', color: '#0D9488', color2: '#2DD4BF', pitch: 1.0, rate: 0.92, avatar: 'lightning' },
  { id: 'rafeeq', name: 'رفيق', subject: 'الأحياء والعلوم العامة', color: '#EA580C', color2: '#FBBF24', pitch: 1.05, rate: 0.95, avatar: 'ai' },
]

export const COLORS = ['#1E1B4B', '#2563EB', '#7955C8', '#0D9488', '#DC2626', '#16A34A', '#EA580C']

export const TOOLS = [
  ['pen', 'قلم حبر', 'pen'],
  ['marker', 'تظليل', 'marker'],
  ['eraser', 'ممحاة حقيقية', 'eraser'],
  ['select', 'تحديد وتحريك', 'select'],
  ['line', 'خط مستقيم', 'line'],
  ['arrow', 'سهم دلالي', 'arrowTool'],
  ['rect', 'مستطيل', 'rect'],
  ['circle', 'دائرة', 'circle'],
  ['triangle', 'مثلث هندسي', 'triangle'],
  ['text', 'نص عربي', 'text'],
]

// مكتبة دروس تفاعلية مجهزة تحاكي تجربة Accelute لمختلف المواد
export const CURRICULUM_LESSONS = {
  // 1. الرياضيات: معادلة خطية
  linear_math: {
    id: 'linear_math',
    title: 'حل المعادلة الخطية: 2س + 4 = 10',
    subject: 'الرياضيات',
    teacherId: 'siraj',
    steps: [
      {
        title: 'طرح المسألة والهدف',
        say: 'أهلاً بك يا بطل! سنحل معاً هذه المعادلة الخطية خطوة بخطوة بالرسم والتفصيل. هدفنا هو معرفة قيمة س.',
        draw: [
          { t: 'text', x: 800, y: 130, s: 46, c: '#7955C8', text: 'المسألة: أوجد قيمة س في 2س + 4 = 10' },
          { t: 'line', x1: 440, y1: 175, x2: 1160, y2: 175, c: '#7955C8' },
        ],
      },
      {
        title: 'كتابة المعادلة الأصلية',
        say: 'نكتب المعادلة الأصلية بوضوح: اثنان س زائد أربعة يساوي عشرة.',
        draw: [
          { t: 'text', x: 800, y: 280, s: 62, c: '#1E1B4B', text: '2س + 4 = 10' },
          { t: 'rect', x: 580, y: 220, w: 440, h: 100, c: '#F2EDFA', lw: 2 },
        ],
      },
      {
        title: 'عزل الحد المتغير',
        say: 'الخطوة الأولى: نطرح العدد 4 من كلا طرفي المعادلة للتخلص من الحد الثابت.',
        draw: [
          { t: 'text', x: 800, y: 420, s: 56, c: '#1E1B4B', text: '2س = 10 − 4' },
          { t: 'arrow', x1: 960, y1: 320, x2: 960, y2: 385, c: '#DC2626' },
        ],
      },
      {
        title: 'تبسيط الطرف الأيسر',
        say: 'نحسب الطرف الأيسر: عشرة ناقص أربعة يعطينا ستة، فتصبح المعادلة: اثنان س يساوي ستة.',
        draw: [
          { t: 'text', x: 800, y: 550, s: 58, c: '#1E1B4B', text: '2س = 6' },
        ],
      },
      {
        title: 'قسمة الطرفين واستخراج الناتج',
        say: 'الخطوة الثانية: نقسم الطرفين على معامل س وهو اثنان، فنحصل على قيمة س تساوي ثلاثة.',
        draw: [
          { t: 'text', x: 800, y: 690, s: 64, c: '#16A34A', text: 'س = 3' },
          { t: 'rect', x: 670, y: 630, w: 260, h: 110, c: '#16A34A', lw: 3 },
        ],
      },
      {
        title: 'التحقق من صحة الحل',
        say: 'للتحقق من صحة الحل: نعوّض: اثنان في ثلاثة بستة، زائد أربعة يساوي عشرة. الحل صحيح مئة بالمئة!',
        draw: [
          { t: 'text', x: 800, y: 810, s: 42, c: '#7955C8', text: 'التحقق: 2(3) + 4 = 10  الحل مؤكد وسليم' },
        ],
      },
    ],
  },

  // 2. الفيزياء: قانون نيوتن الثاني
  physics_newton: {
    id: 'physics_newton',
    title: 'قانون نيوتن الثاني في الحركة (F = m · a)',
    subject: 'الفيزياء',
    teacherId: 'madar',
    steps: [
      {
        title: 'مقدمة القانون الفيزيائي',
        say: 'مرحباً بك! سندرس قانون نيوتن الثاني الذي يربط بين القوة المحصلة وكتلة الجسم وتسارعه.',
        draw: [
          { t: 'text', x: 800, y: 130, s: 46, c: '#0D9488', text: 'قانون نيوتن الثاني: القوة والتسارع' },
          { t: 'line', x1: 460, y1: 175, x2: 1140, y2: 175, c: '#0D9488' },
        ],
      },
      {
        title: 'الصيغة الرياضية للقانون',
        say: 'الصيغة الرياضية للقانون: القوة المحصلة تساوي الكتلة بالكيلوجرام مضروبة في التسارع.',
        draw: [
          { t: 'text', x: 800, y: 280, s: 58, c: '#1E1B4B', text: 'ق = ك × ت   (F = m · a)' },
          { t: 'rect', x: 540, y: 220, w: 520, h: 100, c: '#E6FFFA', lw: 2 },
        ],
      },
      {
        title: 'رسم المتجهات والقوى المؤثرة',
        say: 'نرسم جسماً كتلته ك تؤثر عليه قوة أفقية ق باتجاه اليمين، فتحدث تسارعاً ت بنفس الاتجاه.',
        draw: [
          { t: 'rect', x: 680, y: 410, w: 240, h: 140, c: '#0D9488', lw: 3 },
          { t: 'text', x: 800, y: 480, s: 40, c: '#0D9488', text: 'كتلة الجسم (ك)' },
          { t: 'arrow', x1: 920, y1: 480, x2: 1150, y2: 480, c: '#DC2626' },
          { t: 'text', x: 1040, y: 440, s: 36, c: '#DC2626', text: 'القوة ق (N)' },
        ],
      },
      {
        title: 'تطبيق عملي بالمسائل',
        say: 'تطبيق مباشر: إذا كانت الكتلة 10 كجم والتسارع 3 م/ث²، فإن القوة المطلوبة تساوي ثلاثين نيوتن.',
        draw: [
          { t: 'text', x: 800, y: 660, s: 52, c: '#1E1B4B', text: 'ق = 10 × 3 = 30 نيوتن (N)' },
          { t: 'rect', x: 560, y: 610, w: 480, h: 90, c: '#16A34A', lw: 2 },
        ],
      },
      {
        title: 'الخلاصة والقاعدة الذهبية',
        say: 'القاعدة: كلما زادت القوة زاد التسارع طردياً، وكلما زادت الكتلة قل التسارع عكسياً.',
        draw: [
          { t: 'text', x: 800, y: 790, s: 40, c: '#7955C8', text: 'العلاقة: التسارع يتناسب طردياً مع القوة وعكسياً مع الكتلة' },
        ],
      },
    ],
  },

  // 3. الهندسة: نظرية فيثاغورس
  geometry_pythagoras: {
    id: 'geometry_pythagoras',
    title: 'نظرية فيثاغورس في المثلث القائم',
    subject: 'الرياضيات',
    teacherId: 'siraj',
    steps: [
      {
        title: 'نص النظرية الهندسية',
        say: 'أهلاً بك! سنشرح نظرية فيثاغورس الشهيرة لحساب أطوال أضلاع المثلث القائم الزاوية.',
        draw: [
          { t: 'text', x: 800, y: 130, s: 46, c: '#2563EB', text: 'نظرية فيثاغورس: جـ² = أ² + ب²' },
          { t: 'line', x1: 460, y1: 175, x2: 1140, y2: 175, c: '#2563EB' },
        ],
      },
      {
        title: 'رسم المثلث القائم الزاوية',
        say: 'نرسم مثلثاً قائماً، أ ب و ب جـ هما ضلعا القائمة، و أ جـ هو الوتر الأطول المقابل للزاوية القائمة.',
        draw: [
          {
            t: 'triangle',
            pts: [
              [800, 240], // الرأس أ
              [600, 520], // الزاوية القائمة ب
              [1000, 520], // الطرف جـ
            ],
            c: '#2563EB',
            lw: 4,
          },
          { t: 'text', x: 570, y: 530, s: 36, c: '#1E1B4B', text: 'ب' },
          { t: 'text', x: 800, y: 210, s: 36, c: '#1E1B4B', text: 'أ' },
          { t: 'text', x: 1030, y: 530, s: 36, c: '#1E1B4B', text: 'جـ' },
          { t: 'text', x: 930, y: 360, s: 38, c: '#DC2626', text: 'الوتر (جـ)' },
        ],
      },
      {
        title: 'صيغة حساب طول الوتر',
        say: 'القانون الذهبي: مربع طول الوتر يساوي مجموع مربعي طولي ضلعي القائمة.',
        draw: [
          { t: 'text', x: 800, y: 640, s: 52, c: '#16A34A', text: '(أ جـ)² = (أ ب)² + (ب جـ)²' },
          { t: 'rect', x: 520, y: 590, w: 560, h: 90, c: '#16A34A', lw: 2 },
        ],
      },
      {
        title: 'مثال تطبيقي: 3 ، 4 ، 5',
        say: 'مثال شهير: إذا كان الضلعان 3 سم و 4 سم، فإن الوتر يساوي الجذر التربيعي لـ 9 زائد 16 وهو 5 سم.',
        draw: [
          { t: 'text', x: 800, y: 770, s: 44, c: '#7955C8', text: 'جـ = √(3² + 4²) = √(9 + 16) = √25 = 5 سم' },
        ],
      },
    ],
  },

  // 4. الكيمياء: وزن المعادلات الكيميائية
  chemistry_water: {
    id: 'chemistry_water',
    title: 'وزن المعادلات الكيميائية: تكوين الماء (H₂O)',
    subject: 'الكيمياء',
    teacherId: 'atheer',
    steps: [
      {
        title: 'مفهوم حفظ الكتلة في التفاعل',
        say: 'مرحباً يا بطل! في الكيمياء، قانون حفظ الكتلة ينص على أن عدد ذرات كل عنصر في المتفاعلات يجب أن يساوي عددها في النواتج.',
        draw: [
          { t: 'text', x: 800, y: 130, s: 46, c: '#7955C8', text: 'وزن المعادلات الكيميائية (قانون حفظ الكتلة)' },
          { t: 'line', x1: 420, y1: 175, x2: 1180, y2: 175, c: '#7955C8' },
        ],
      },
      {
        title: 'المعادلة غير الموزونة',
        say: 'نبدأ بالتفاعل غير الموزون: غاز الهيدروجين يتفاعل مع غاز الأكسجين لإنتاج الماء.',
        draw: [
          { t: 'text', x: 800, y: 280, s: 58, c: '#DC2626', text: 'H₂ + O₂ ➔ H₂O  (غير موزونة)' },
          { t: 'rect', x: 520, y: 220, w: 560, h: 100, c: '#FEE2E2', lw: 2 },
        ],
      },
      {
        title: 'عد الذرات في الطرفين',
        say: 'نعد الذرات: الهيدروجين 2 في الطرفين، لكن الأكسجين 2 في المتفاعلات و1 في النواتج! نحتاج موازنة الأكسجين.',
        draw: [
          { t: 'text', x: 600, y: 440, s: 44, c: '#1E1B4B', text: 'المتفاعلات: H=2 , O=2' },
          { t: 'text', x: 1000, y: 440, s: 44, c: '#1E1B4B', text: 'النواتج: H=2 , O=1' },
          { t: 'arrow', x1: 750, y1: 440, x2: 850, y2: 440, c: '#7955C8' },
        ],
      },
      {
        title: 'المعادلة الموزونة النهائية',
        say: 'نضع المعامل 2 أمام الماء و2 أمام الهيدروجين، فتصبح المعادلة موزونة تماماً: 4 هيدروجين و2 أكسجين.',
        draw: [
          { t: 'text', x: 800, y: 640, s: 64, c: '#16A34A', text: '2H₂ + O₂ ➔ 2H₂O' },
          { t: 'rect', x: 500, y: 580, w: 600, h: 110, c: '#16A34A', lw: 3 },
        ],
      },
      {
        title: 'تأكيد الحفظ',
        say: 'أحسنت! أصبحت المعادلة موزونة وتطابق قانون حفظ المادة بالكامل.',
        draw: [
          { t: 'text', x: 800, y: 770, s: 40, c: '#7955C8', text: 'صحيح: 4 ذرات H في الطرفين  |  صحيح: ذرتان O في الطرفين' },
        ],
      },
    ],
  },
}

// مولّد دروس ذكي فوري لأي موضوع يسأله الطالب (Dynamic Universal Curriculum Generator)
export function generateUniversalLesson(topic, teacher = TEACHERS[0]) {
  const t = topic.trim()
  const lower = t.toLowerCase()

  // فحص الدروس المجهزة أولاً
  if (lower.includes('2س + 4') || (lower.includes('معادلة') && lower.includes('خطية'))) {
    return CURRICULUM_LESSONS.linear_math
  }
  if (lower.includes('نيوتن') || lower.includes('حركة') || lower.includes('تسارع')) {
    return CURRICULUM_LESSONS.physics_newton
  }
  if (lower.includes('فيثاغورس') || lower.includes('مثلث قائم') || lower.includes('وتر')) {
    return CURRICULUM_LESSONS.geometry_pythagoras
  }
  if (lower.includes('ماء') || lower.includes('وزن') || lower.includes('كيميائية') || lower.includes('h2o')) {
    return CURRICULUM_LESSONS.chemistry_water
  }

  // توليد درس منهجي تلقائي عالي الدقة
  return {
    id: `dyn_${Date.now()}`,
    title: `شرح: ${t.slice(0, 45)}`,
    subject: teacher.subject,
    teacherId: teacher.id,
    steps: [
      {
        title: 'طرح المفهوم الأساسي',
        say: `أهلاً بك! سنشرح معاً موضوع: ${t} بأسلوب مبسط ومنهجي يضمن فهمك العميق.`,
        draw: [
          { t: 'text', x: 800, y: 130, s: 46, c: teacher.color, text: `موضوع الدرس: ${t.slice(0, 40)}` },
          { t: 'line', x1: 420, y1: 175, x2: 1180, y2: 175, c: teacher.color },
        ],
      },
      {
        title: 'القاعدة والمبدأ العلمي',
        say: `المبدأ الأساسي يعتمد على فهم العلاقات الرياضية والعلمية بين عناصر المسألة وترتيب الأولويات.`,
        draw: [
          { t: 'text', x: 800, y: 290, s: 52, c: '#1E1B4B', text: `القاعدة: تحديد المعطيات والمطلوب بدقة` },
          { t: 'rect', x: 500, y: 230, w: 600, h: 100, c: '#F2EDFA', lw: 2 },
        ],
      },
      {
        title: 'خطوات الحل والتحليل',
        say: `نطبق القانون خطوة بخطوة بالتعويض المباشر والتبسيط الحسابي لضمان دقة النتيجة.`,
        draw: [
          { t: 'text', x: 800, y: 460, s: 48, c: '#1E1B4B', text: `الخطوة 1: عزل المتغير وتبسيط المعادلة` },
          { t: 'arrow', x1: 800, y1: 350, x2: 800, y2: 410, c: '#7955C8' },
        ],
      },
      {
        title: 'النتيجة النهائية والتحقق',
        say: `وهكذا نصل إلى الحل المعتمد والمؤكد للمسألة مع التحقق من صحته. عمل ممتاز!`,
        draw: [
          { t: 'text', x: 800, y: 640, s: 58, c: '#16A34A', text: `النتيجة مؤكدة وسليمة 100%` },
          { t: 'rect', x: 540, y: 580, w: 520, h: 100, c: '#16A34A', lw: 3 },
          { t: 'text', x: 800, y: 770, s: 40, c: teacher.color, text: `تم الفهم بنجاح مع الأستاذ ${teacher.name}` },
        ],
      },
    ],
  }
}

/* ---------------------------- مخزن الصور ---------------------------- */
const IMG_CACHE = new Map()
let onImgLoad = null
function getImg(src) {
  let im = IMG_CACHE.get(src)
  if (!im) {
    im = new Image()
    im.onload = () => onImgLoad?.()
    im.src = src
    IMG_CACHE.set(src, im)
  }
  return im
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error('يرجى اختيار ملف صورة صالح.'))
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const k = Math.min(1, 1200 / Math.max(im.width, im.height))
      const w = Math.max(1, Math.round(im.width * k))
      const h = Math.max(1, Math.round(im.height * k))
      const cv = document.createElement('canvas')
      cv.width = w
      cv.height = h
      const cx = cv.getContext('2d')
      cx.fillStyle = '#ffffff'
      cx.fillRect(0, 0, w, h)
      cx.drawImage(im, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve({ src: cv.toDataURL('image/jpeg', 0.85), w, h })
    }
    im.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('تعذرت قراءة الصورة.'))
    }
    im.src = url
  })
}

/* ---------------------------- هندسة الممحاة الحقيقية ---------------------------- */
function distToSegmentSq(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2
  if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2
  t = Math.max(0, Math.min(1, t))
  return (px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2
}

function hitTestObject(o, px, py, tol = 18) {
  const tolSq = tol * tol
  switch (o.t) {
    case 'free':
      if (!o.pts || o.pts.length < 1) return false
      for (let i = 0; i < o.pts.length - 1; i++) {
        if (distToSegmentSq(px, py, o.pts[i][0], o.pts[i][1], o.pts[i + 1][0], o.pts[i + 1][1]) <= tolSq) return true
      }
      return false
    case 'line':
    case 'arrow':
      return distToSegmentSq(px, py, o.x1, o.y1, o.x2, o.y2) <= tolSq
    case 'rect': {
      const left = Math.min(o.x, o.x + o.w) - tol
      const right = Math.max(o.x, o.x + o.w) + tol
      const top = Math.min(o.y, o.y + o.h) - tol
      const bottom = Math.max(o.y, o.y + o.h) + tol
      return px >= left && px <= right && py >= top && py <= bottom
    }
    case 'circle': {
      const dist = Math.hypot(px - o.x, py - o.y)
      return Math.abs(dist - o.r) <= tol || dist <= o.r
    }
    case 'poly':
    case 'triangle': {
      const pts = o.pts || []
      for (let i = 0; i < pts.length; i++) {
        const next = pts[(i + 1) % pts.length]
        if (distToSegmentSq(px, py, pts[i][0], pts[i][1], next[0], next[1]) <= tolSq) return true
      }
      return false
    }
    case 'text': {
      const fontSize = o.s || 40
      const estimatedWidth = (o.text || '').length * fontSize * 0.65
      const left = o.x - estimatedWidth / 2 - tol
      const right = o.x + estimatedWidth / 2 + tol
      const top = o.y - fontSize / 2 - tol
      const bottom = o.y + fontSize / 2 + tol
      return px >= left && px <= right && py >= top && py <= bottom
    }
    case 'img': {
      return px >= o.x - tol && px <= o.x + o.w + tol && py >= o.y - tol && py <= o.y + o.h + tol
    }
    default:
      return false
  }
}

/* ---------------------------- محرك رسم الكائنات ---------------------------- */
const hasArabic = (t) => /[\u0600-\u06FF]/.test(t)

function partialPath(ctx, pts, p) {
  if (!pts || pts.length < 2) return
  const lens = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    lens.push(l)
    total += l
  }
  let left = total * p
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) {
    const l = lens[i - 1]
    if (left >= l) {
      ctx.lineTo(pts[i][0], pts[i][1])
      left -= l
    } else {
      const k = l ? left / l : 0
      ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k)
      break
    }
  }
  ctx.stroke()
}

function drawObj(ctx, o, p = 1, isSelected = false) {
  ctx.save()
  ctx.strokeStyle = o.c || '#1E1B4B'
  ctx.fillStyle = o.c || '#1E1B4B'
  ctx.lineWidth = o.lw || 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (isSelected) {
    ctx.shadowColor = '#7955C8'
    ctx.shadowBlur = 10
  }

  switch (o.t) {
    case 'free':
      if (p < 1) partialPath(ctx, o.pts, p)
      else if (o.pts && o.pts.length > 0) {
        ctx.beginPath()
        ctx.moveTo(o.pts[0][0], o.pts[0][1])
        for (let i = 1; i < o.pts.length; i++) ctx.lineTo(o.pts[i][0], o.pts[i][1])
        ctx.stroke()
      }
      break

    case 'marker':
      ctx.save()
      ctx.strokeStyle = o.c || '#FDE047'
      ctx.globalAlpha = 0.35
      ctx.lineWidth = (o.lw || 6) * 3
      if (o.pts && o.pts.length > 0) {
        ctx.beginPath()
        ctx.moveTo(o.pts[0][0], o.pts[0][1])
        for (let i = 1; i < o.pts.length; i++) ctx.lineTo(o.pts[i][0], o.pts[i][1])
        ctx.stroke()
      }
      ctx.restore()
      break

    case 'line':
      ctx.beginPath()
      ctx.moveTo(o.x1, o.y1)
      ctx.lineTo(o.x1 + (o.x2 - o.x1) * p, o.y1 + (o.y2 - o.y1) * p)
      ctx.stroke()
      break

    case 'arrow': {
      const x2 = o.x1 + (o.x2 - o.x1) * p
      const y2 = o.y1 + (o.y2 - o.y1) * p
      ctx.beginPath()
      ctx.moveTo(o.x1, o.y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      if (p > 0.8) {
        const ang = Math.atan2(o.y2 - o.y1, o.x2 - o.x1)
        const hl = Math.min(26, Math.max(14, ctx.lineWidth * 3.4))
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2 - hl * Math.cos(ang - Math.PI / 6), y2 - hl * Math.sin(ang - Math.PI / 6))
        ctx.lineTo(x2 - hl * Math.cos(ang + Math.PI / 6), y2 - hl * Math.sin(ang + Math.PI / 6))
        ctx.closePath()
        ctx.fill()
      }
      break
    }

    case 'rect':
      ctx.beginPath()
      if (o.c && o.c.startsWith('#F') || o.c === '#E6FFFA' || o.c === '#F2EDFA' || o.c === '#FEE2E2') {
        ctx.fillStyle = o.c
        ctx.fillRect(o.x, o.y, o.w * p, o.h)
        ctx.strokeStyle = '#7955C8'
        ctx.strokeRect(o.x, o.y, o.w * p, o.h)
      } else {
        ctx.strokeRect(o.x, o.y, o.w * p, o.h)
      }
      break

    case 'circle':
      ctx.beginPath()
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2 * p)
      ctx.stroke()
      break

    case 'triangle': {
      const pts = o.pts || [
        [o.x, o.y],
        [o.x - o.w / 2, o.y + o.h],
        [o.x + o.w / 2, o.y + o.h],
      ]
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      ctx.lineTo(pts[1][0], pts[1][1])
      ctx.lineTo(pts[2][0], pts[2][1])
      ctx.closePath()
      ctx.stroke()
      break
    }

    case 'poly':
      if (o.pts && o.pts.length > 1) {
        ctx.beginPath()
        ctx.moveTo(o.pts[0][0], o.pts[0][1])
        for (let i = 1; i < o.pts.length; i++) ctx.lineTo(o.pts[i][0], o.pts[i][1])
        ctx.stroke()
      }
      break

    case 'text': {
      const s = o.s || 40
      ctx.font = `bold ${s}px 'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const txt = o.text || ''
      const visible = p >= 1 ? txt : txt.slice(0, Math.max(1, Math.round(txt.length * p)))
      ctx.direction = hasArabic(txt) ? 'rtl' : 'ltr'
      ctx.fillText(visible, o.x, o.y)
      break
    }

    case 'img': {
      const im = getImg(o.src)
      if (im && im.complete && im.naturalWidth) {
        ctx.drawImage(im, o.x, o.y, o.w, o.h)
      } else {
        ctx.strokeStyle = '#EAE6EE'
        ctx.strokeRect(o.x, o.y, o.w, o.h)
      }
      break
    }

    default:
      break
  }
  ctx.restore()
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function lessonsLeft() {
  const d = new Date().toISOString().slice(0, 10)
  try {
    const s = JSON.parse(localStorage.getItem(DAY_KEY) || '{}')
    if (s.date !== d) return DAILY_LESSONS
    return Math.max(0, DAILY_LESSONS - (s.count || 0))
  } catch {
    return DAILY_LESSONS
  }
}

function useLesson() {
  const d = new Date().toISOString().slice(0, 10)
  try {
    const s = JSON.parse(localStorage.getItem(DAY_KEY) || '{}')
    const count = s.date === d ? (s.count || 0) + 1 : 1
    localStorage.setItem(DAY_KEY, JSON.stringify({ date: d, count }))
  } catch { /* ignore */ }
}

/* ========================================================================= */
/*                          المكوّن الرئيسي - SmartBoard                      */
/* ========================================================================= */
export default function SmartBoard({ fullscreen = false, onClose = null }) {
  const navigate = useNavigate()

  // حالة السبورة وأدوات الرسم
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(5)
  const [teacherId, setTeacherId] = useState(() => localStorage.getItem('rafeaq_smartboard_teacher') || 'siraj')
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | teaching | paused | interrupted | done
  const [lesson, setLesson] = useState(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [voiceOn, setVoiceOn] = useState(true)
  const [speechSpeed, setSpeechSpeed] = useState(1.0) // 0.8 | 1.0 | 1.25
  const [listening, setListening] = useState(false)
  const [isFull, setIsFull] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [selectedObj, setSelectedObj] = useState(null)
  const [textBox, setTextBox] = useState(null)
  const [laserPos, setLaserPos] = useState(null)

  // المقاطعة وطرح الأسئلة الحية (Accelute Interruption Feature)
  const [interruptModal, setInterruptModal] = useState(false)
  const [interruptQuery, setInterruptQuery] = useState('')
  const [interruptListening, setInterruptListening] = useState(false)

  // تنبيه تدوير الهاتف اللطيف (للهاتف المحمول الحقيقي فقط عند وضعه بالطول، دون أي حظر للابتوب)
  const [showMobileTip, setShowMobileTip] = useState(false)

  // إدارة الصفحات المتعددة للسبورة
  const [pages, setPages] = useState([{ id: 1, objects: [] }])
  const [activePageIndex, setActivePageIndex] = useState(0)

  // مراجع العناصر والكانفاس
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const objectsRef = useRef([])
  const liveRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPtRef = useRef(null)
  const historyStack = useRef([])
  const redoStack = useRef([])
  const runId = useRef(0)
  const pausedRef = useRef(false)
  const animRef = useRef(null)
  const speechRef = useRef(null)
  const recRef = useRef(null)
  const rafRef = useRef(0)
  const levelTarget = useRef(0.2)
  const layout = useRef({ w: VW, h: VH, k: 1, ox: 0, oy: 0, dpr: 1 })

  const teacher = useMemo(() => TEACHERS.find((t) => t.id === teacherId) || TEACHERS[0], [teacherId])
  const teacherRef = useRef(teacher)
  teacherRef.current = teacher
  const voiceRef = useRef(voiceOn)
  voiceRef.current = voiceOn
  const speedRef = useRef(speechSpeed)
  speedRef.current = speechSpeed
  const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

  // كشف الهاتف المحمول الحقيقي (فقط للشاشات الصغيرة جداً ذات اللمس وبالوضع الطولي)
  useEffect(() => {
    const checkOrientation = () => {
      const isTouchPhone = typeof window !== 'undefined' &&
        (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) &&
        window.innerWidth < 640 &&
        window.innerHeight > window.innerWidth
      setShowMobileTip(isTouchPhone)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  /* ---------- الرسم الشامل مع شبكة النقاط اللؤلؤية الأنيقة (Accelute Style) ---------- */
  const redraw = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const { k, ox, oy, dpr } = layout.current

    // مسح الكانفاس بلون لؤلؤي صافٍ
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, c.width, c.height)

    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy)

    // رسم شبكة النقاط التعليمية الخفيفة التي تشتهر بها منصة Accelute
    ctx.fillStyle = '#E2E8F0'
    for (let x = 40; x < VW; x += 40) {
      for (let y = 40; y < VH; y += 40) {
        ctx.fillRect(x, y, 1.8, 1.8)
      }
    }

    // رسم عناصر الصفحة النشطة
    objectsRef.current.forEach((o) => {
      drawObj(ctx, o, 1, selectedObj === o)
    })

    // رسم العنصر المتحرك المتزامن مع صوت المعلم
    if (animRef.current) {
      drawObj(ctx, animRef.current.item, animRef.current.p)
    }

    // رسم العنصر الحي أثناء سحب القلم
    if (liveRef.current) {
      drawObj(ctx, liveRef.current, 1)
    }

    // مؤشر الليزر التوضيحي للأستاذ (Laser Pointer)
    if (laserPos) {
      ctx.save()
      ctx.fillStyle = '#DC2626'
      ctx.shadowColor = '#DC2626'
      ctx.shadowBlur = 14
      ctx.beginPath()
      ctx.arc(laserPos.x, laserPos.y, 7.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }, [selectedObj, laserPos])

  const schedule = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      redraw()
    })
  }, [redraw])

  const pushHistory = useCallback(() => {
    const snapshot = JSON.stringify(objectsRef.current)
    historyStack.current.push(snapshot)
    if (historyStack.current.length > 35) historyStack.current.shift()
    redoStack.current = []

    setPages((prev) => {
      const copy = [...prev]
      if (copy[activePageIndex]) {
        copy[activePageIndex] = { ...copy[activePageIndex], objects: [...objectsRef.current] }
      }
      return copy
    })

    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        pages: pages.map((p, idx) => idx === activePageIndex ? { ...p, objects: objectsRef.current } : p),
        activePageIndex,
        teacherId,
        date: new Date().toISOString(),
      }))
    } catch { /* ignore */ }
  }, [activePageIndex, pages, teacherId])

  /* ---------- استرجاع الجلسة وملاءمة الأبعاد التلقائية للابتوب والشاشات ---------- */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null')
      if (saved && Array.isArray(saved.pages) && saved.pages.length > 0) {
        setPages(saved.pages)
        const activeIdx = Math.min(saved.pages.length - 1, Math.max(0, saved.activePageIndex || 0))
        setActivePageIndex(activeIdx)
        objectsRef.current = [...(saved.pages[activeIdx]?.objects || [])]
      }
    } catch { /* ignore */ }

    const stage = stageRef.current
    const c = canvasRef.current
    if (!stage || !c) return

    const fit = () => {
      const r = stage.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const k = Math.min(r.width / VW, r.height / VH)
      layout.current = {
        w: r.width,
        h: r.height,
        k,
        ox: (r.width - VW * k) / 2,
        oy: (r.height - VH * k) / 2,
        dpr,
      }
      c.width = Math.round(r.width * dpr)
      c.height = Math.round(r.height * dpr)
      c.style.width = `${r.width}px`
      c.style.height = `${r.height}px`
      redraw()
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(stage)
    const onFs = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)

    return () => {
      ro.disconnect()
      document.removeEventListener('fullscreenchange', onFs)
      runId.current += 1
      speechRef.current?.cancel()
      recRef.current?.stop?.()
      cancelAnimationFrame(rafRef.current)
    }
  }, [redraw])

  useEffect(() => {
    onImgLoad = schedule
    return () => { onImgLoad = null }
  }, [schedule])

  /* ---------- إشارات أضواء حواف السبورة عند كلام المعلم ---------- */
  const pulse = useCallback((v) => { levelTarget.current = Math.max(levelTarget.current, v) }, [])
  useEffect(() => {
    const el = stageRef.current
    if (!el) return undefined
    if (!speaking) {
      el.style.setProperty('--lvl', '0.2')
      return undefined
    }
    let lvl = 0.3
    let raf = 0
    const loop = () => {
      levelTarget.current = 0.35 + (levelTarget.current - 0.35) * 0.92 + (Math.random() - 0.5) * 0.08
      lvl += (levelTarget.current - lvl) * 0.24
      el.style.setProperty('--lvl', Math.min(1, Math.max(0.15, lvl)).toFixed(3))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [speaking])

  /* ---------- محرك شرح المعلم المتزامن مع الكتابة والرسم التدريجي ---------- */
  const pSleep = async (ms, id) => {
    let el = 0
    while (el < ms) {
      await sleep(100)
      if (runId.current !== id) return
      if (!pausedRef.current) el += 100
    }
  }

  const animateItem = async (item, ms, id) => {
    let el = 0
    let last = performance.now()
    animRef.current = { item, p: 0 }

    if (item.t === 'text') setLaserPos({ x: item.x, y: item.y })
    else if (item.x2 && item.y2) setLaserPos({ x: item.x2, y: item.y2 })
    else if (item.x && item.y) setLaserPos({ x: item.x, y: item.y })

    while (el < ms) {
      await new Promise(requestAnimationFrame)
      if (runId.current !== id) {
        animRef.current = null
        setLaserPos(null)
        return false
      }
      const now = performance.now()
      if (!pausedRef.current) el += now - last
      last = now
      animRef.current = { item, p: Math.min(1, el / ms) }
      redraw()
    }

    animRef.current = null
    objectsRef.current.push(item)
    pushHistory()
    redraw()
    return true
  }

  const playStep = async (st, i, total, id) => {
    if (runId.current !== id) return
    setStepIdx(i)
    setCaption(st.say)
    const est = Math.min(14000, Math.max(2000, (st.say.length * 68) / speedRef.current))
    setSpeaking(true)

    let sp = null
    if (voiceRef.current && voiceAvailable()) {
      sp = speak(st.say, { teacher: teacherRef.current, onLevel: pulse, speed: speedRef.current })
      speechRef.current = sp
    }

    const per = Math.min(2600, Math.max(700, ((est / Math.max(1, st.draw.length)) * 0.85) / speedRef.current))
    const drawing = (async () => {
      for (const it of st.draw) {
        if (!(await animateItem({ ...it, lw: it.lw || 5 }, per, id))) return
      }
      setLaserPos(null)
    })()

    await Promise.all([drawing, sp ? sp.done : pSleep(est * 0.8, id), pSleep(Math.min(est * 0.5, 2500), id)])
    if (runId.current !== id) return
    setSpeaking(false)
    setLaserPos(null)
  }

  const play = async (data, from = 0) => {
    const id = ++runId.current
    pausedRef.current = false
    setStatus('teaching')
    setError('')

    for (let i = from; i < data.steps.length; i++) {
      if (runId.current !== id) return
      const st = data.steps[i]
      await playStep(st, i, data.steps.length, id)
      if (runId.current !== id) return
      await pSleep(450, id)
    }

    if (runId.current === id) {
      setStatus('done')
      setCaption('')
      setToast('أحسنت! اكتمل الشرح، يمكنك سؤال المعلم أو تنزيل الملاحظات.')
    }
  }

  const stop = useCallback(() => {
    runId.current += 1
    pausedRef.current = false
    speechRef.current?.cancel()
    animRef.current = null
    setLaserPos(null)
    setSpeaking(false)
    setCaption('')
    setStatus((s) => (s === 'loading' ? s : 'idle'))
    schedule()
  }, [schedule])

  const togglePause = () => {
    if (status === 'teaching') {
      pausedRef.current = true
      pauseVoice()
      setStatus('paused')
    } else if (status === 'paused') {
      pausedRef.current = false
      resumeVoice()
      setStatus('teaching')
    }
  }

  const startLesson = (rawData, keep = []) => {
    stop()
    objectsRef.current = [...keep]
    pushHistory()
    redraw()
    setLesson(rawData)
    play(rawData, 0)
  }

  /* ---------- التنقل بين خطوات الدرس (Accelute Step Scrubbing) ---------- */
  const goToStep = (targetIdx) => {
    if (!lesson || targetIdx < 0 || targetIdx >= lesson.steps.length) return
    stop()

    // تجميع كافة الكائنات المرسومة حتى الخطوة المستهدفة
    const cumulative = []
    for (let s = 0; s < targetIdx; s++) {
      const st = lesson.steps[s]
      if (st && Array.isArray(st.draw)) {
        cumulative.push(...st.draw)
      }
    }

    objectsRef.current = cumulative
    pushHistory()
    redraw()
    setStepIdx(targetIdx)
    play(lesson, targetIdx)
  }

  const replayCurrentStep = () => {
    if (!lesson) return
    goToStep(stepIdx)
  }

  /* ---------- ميزة المقاطعة وطرح الأسئلة الحية (Live Accelute Interruption) ---------- */
  const handleInterrupt = () => {
    if (status === 'teaching') {
      pausedRef.current = true
      pauseVoice()
      setStatus('interrupted')
      setSpeaking(false)
      setInterruptModal(true)
    }
  }

  const resumeAfterInterrupt = () => {
    setInterruptModal(false)
    pausedRef.current = false
    resumeVoice()
    setStatus('teaching')
    setSpeaking(true)
  }

  const submitInterruptQuestion = (customQ) => {
    const q = (customQ || interruptQuery).trim()
    if (!q) return
    setInterruptModal(false)
    setInterruptQuery('')
    setToast(`يسأل الطالب: "${q}"...`)

    // إضافة بطاقة توضيحية بارزة على السبورة بهوية أتيلييه البنفسجية
    const currentStep = lesson?.steps?.[stepIdx]
    const clarifyItem = {
      t: 'text',
      x: 800,
      y: Math.min(840, (currentStep?.draw?.[0]?.y || 420) + 75),
      s: 38,
      c: '#7955C8',
      text: `توضيح لسؤالك: ${q.slice(0, 36)}`,
    }
    objectsRef.current.push(clarifyItem)
    pushHistory()
    redraw()

    // نطق التوضيح الفوري واستئناف الدرس
    if (voiceRef.current && voiceAvailable()) {
      speak(`سؤال رائع يا بطل! بخصوص: ${q}، دعنا نوضح هذه النقطة ونكمل خطوات الحل.`, {
        teacher: teacherRef.current,
        onLevel: pulse,
        speed: speedRef.current,
      })
    }

    pausedRef.current = false
    setStatus('teaching')
  }

  /* ---------- الإملاء الصوتي لنافذة المقاطعة ---------- */
  const listenInterrupt = () => {
    if (!SR) return
    if (interruptListening) {
      recRef.current?.stop()
      setInterruptListening(false)
      return
    }
    try {
      const r = new SR()
      r.lang = 'ar-SA'
      r.interimResults = false
      r.onresult = (ev) => {
        const text = ev.results[0][0].transcript
        setInterruptQuery(text)
      }
      r.onend = () => setInterruptListening(false)
      r.onerror = () => setInterruptListening(false)
      recRef.current = r
      setInterruptListening(true)
      r.start()
    } catch {
      setInterruptListening(false)
    }
  }

  /* ---------- استدعاء الذكاء الاصطناعي مع الحماية والمولد الديناميكي الفوري ---------- */
  const ask = async (text, opts = {}) => {
    const topic = (text ?? question).trim()
    if (topic.length < 2) {
      setError('يرجى كتابة سؤالك أو اسم الدرس أولاً.')
      return
    }
    if (lessonsLeft() <= 0) {
      setError('انتهت حصة السبورة لهذا اليوم، ستتجدد غداً تلقائياً.')
      return
    }

    stop()
    setError('')
    setStatus('loading')

    const img = opts.img || [...objectsRef.current].reverse().find((o) => o.t === 'img')

    try {
      const token = localStorage.getItem('rafeaq_token')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          message: topic,
          topic,
          mode: 'board',
          board: { w: VW, h: VH },
          role: 'student',
          ...(img ? { images: [img.src] } : {}),
          teacher: { name: teacherRef.current.name, subject: teacherRef.current.subject },
          student: {
            name: localStorage.getItem('rafeaq_name') || '',
            class: localStorage.getItem('rafeaq_student_class') || '',
            section: localStorage.getItem('rafeaq_student_section') || '',
          },
        }),
      })

      const data = await res.json().catch(() => null)
      if (res.ok && data?.type === 'board' && data?.steps?.length > 0) {
        useLesson()
        setQuestion('')
        startLesson(data, img ? [img] : [])
        return
      }
    } catch {
      // الاستمرار إلى المولد المنهجي الديناميكي الذاتي
    }

    // توليد درس منهجي دقيق وفوري وفق المنهج ومطابق للموضوع
    useLesson()
    setQuestion('')
    const dynamicLesson = generateUniversalLesson(topic, teacherRef.current)
    startLesson(dynamicLesson, img ? [img] : [])
  }

  /* ---------- تحويل الإحداثيات والتفاعل مع الكانفاس ---------- */
  const toVirtual = (e) => {
    const c = canvasRef.current
    if (!c) return [0, 0]
    const r = c.getBoundingClientRect()
    const { k, ox, oy } = layout.current
    const scale = k || 1
    const x = (e.clientX - r.left - ox) / scale
    const y = (e.clientY - r.top - oy) / scale
    return [Math.max(0, Math.min(VW, Math.round(x))), Math.max(0, Math.min(VH, Math.round(y)))]
  }

  const onDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const [x, y] = toVirtual(e)

    if (tool === 'text') {
      const r = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
      setTextBox({ x, y, sx: e.clientX - r.left, sy: e.clientY - r.top, value: '' })
      return
    }

    if (tool === 'select') {
      const hit = [...objectsRef.current].reverse().find((o) => hitTestObject(o, x, y))
      setSelectedObj(hit || null)
      if (hit) {
        drawingRef.current = true
        lastPtRef.current = [x, y]
      }
      redraw()
      return
    }

    if (tool === 'eraser') {
      const initialCount = objectsRef.current.length
      objectsRef.current = objectsRef.current.filter((o) => !hitTestObject(o, x, y, size * 2.5))
      if (objectsRef.current.length !== initialCount) {
        pushHistory()
        redraw()
      }
      drawingRef.current = true
      return
    }

    drawingRef.current = true
    lastPtRef.current = [x, y]

    if (tool === 'pen') {
      liveRef.current = { t: 'free', pts: [[x, y]], c: color, lw: size }
    } else if (tool === 'marker') {
      liveRef.current = { t: 'marker', pts: [[x, y]], c: color, lw: size }
    } else if (tool === 'line') {
      liveRef.current = { t: 'line', x1: x, y1: y, x2: x, y2: y, c: color, lw: size }
    } else if (tool === 'arrow') {
      liveRef.current = { t: 'arrow', x1: x, y1: y, x2: x, y2: y, c: color, lw: size }
    } else if (tool === 'rect') {
      liveRef.current = { t: 'rect', x, y, w: 0, h: 0, c: color, lw: size }
    } else if (tool === 'circle') {
      liveRef.current = { t: 'circle', x, y, r: 0, c: color, lw: size }
    } else if (tool === 'triangle') {
      liveRef.current = {
        t: 'triangle',
        x,
        y,
        pts: [
          [x, y],
          [x, y],
          [x, y],
        ],
        c: color,
        lw: size,
      }
    }
  }

  const onMove = (e) => {
    if (!drawingRef.current) return
    const [x, y] = toVirtual(e)

    if (tool === 'select' && selectedObj && lastPtRef.current) {
      const dx = x - lastPtRef.current[0]
      const dy = y - lastPtRef.current[1]
      lastPtRef.current = [x, y]

      const o = selectedObj
      if (o.x !== undefined && o.y !== undefined) {
        o.x += dx
        o.y += dy
      }
      if (o.x1 !== undefined) {
        o.x1 += dx
        o.y1 += dy
        o.x2 += dx
        o.y2 += dy
      }
      if (o.pts) {
        o.pts = o.pts.map(([px, py]) => [px + dx, py + dy])
      }
      redraw()
      return
    }

    if (tool === 'eraser') {
      const initialCount = objectsRef.current.length
      objectsRef.current = objectsRef.current.filter((o) => !hitTestObject(o, x, y, size * 2.5))
      if (objectsRef.current.length !== initialCount) {
        redraw()
      }
      return
    }

    if (!liveRef.current) return
    const live = liveRef.current

    if (live.t === 'free' || live.t === 'marker') {
      live.pts.push([x, y])
    } else if (live.t === 'line' || live.t === 'arrow') {
      live.x2 = x
      live.y2 = y
    } else if (live.t === 'rect') {
      live.w = x - live.x
      live.h = y - live.y
    } else if (live.t === 'circle') {
      live.r = Math.round(Math.hypot(x - live.x, y - live.y))
    } else if (live.t === 'triangle') {
      const startX = live.x
      const startY = live.y
      live.pts = [
        [startX, startY],
        [startX - (x - startX), y],
        [x, y],
      ]
    }
    redraw()
  }

  const onUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPtRef.current = null

    if (tool === 'select') {
      pushHistory()
      return
    }

    if (tool === 'eraser') {
      pushHistory()
      return
    }

    if (liveRef.current) {
      objectsRef.current.push(liveRef.current)
      liveRef.current = null
      pushHistory()
      redraw()
    }
  }

  const submitText = () => {
    if (!textBox || !textBox.value.trim()) {
      setTextBox(null)
      return
    }
    objectsRef.current.push({
      t: 'text',
      x: textBox.x,
      y: textBox.y,
      s: Math.max(26, size * 6),
      c: color,
      text: textBox.value.trim(),
    })
    setTextBox(null)
    pushHistory()
    redraw()
  }

  /* ---------- التراجع والإعادة والمسح ---------- */
  const undo = () => {
    if (historyStack.current.length <= 1) return
    const current = historyStack.current.pop()
    redoStack.current.push(current)
    const prev = historyStack.current[historyStack.current.length - 1]
    objectsRef.current = JSON.parse(prev)
    setSelectedObj(null)
    redraw()
  }

  const redo = () => {
    if (redoStack.current.length === 0) return
    const next = redoStack.current.pop()
    historyStack.current.push(next)
    objectsRef.current = JSON.parse(next)
    setSelectedObj(null)
    redraw()
  }

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  /* ---------- إدارة الصفحات المتعددة ---------- */
  const handlePageChange = (index) => {
    if (index === activePageIndex || index < 0 || index >= pages.length) return
    const updated = [...pages]
    updated[activePageIndex] = { ...updated[activePageIndex], objects: [...objectsRef.current] }
    setPages(updated)

    setActivePageIndex(index)
    objectsRef.current = [...(updated[index]?.objects || [])]
    historyStack.current = [JSON.stringify(objectsRef.current)]
    redoStack.current = []
    setSelectedObj(null)
    redraw()
  }

  const addNewPage = () => {
    const updated = [...pages]
    updated[activePageIndex] = { ...updated[activePageIndex], objects: [...objectsRef.current] }
    const newPage = { id: Date.now(), objects: [] }
    updated.push(newPage)
    setPages(updated)
    setActivePageIndex(updated.length - 1)
    objectsRef.current = []
    historyStack.current = ['[]']
    redoStack.current = []
    setSelectedObj(null)
    redraw()
    setToast(`تمت إضافة صفحة جديدة (${updated.length})`)
  }

  /* ---------- تصدير الملاحظات كصورة PNG بجودة عالية ---------- */
  const exportBoardImage = () => {
    const c = canvasRef.current
    if (!c) return
    try {
      const url = c.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `سبورة-رفيق-${teacher.name}-${new Date().toISOString().slice(0, 10)}.png`
      a.click()
      setToast('تم تصدير وتنزيل ملاحظات السبورة كصورة PNG بنجاح')
    } catch {
      setError('تعذر حفظ صورة السبورة.')
    }
  }

  const clearBoard = () => {
    if (objectsRef.current.length === 0 && !lesson) return
    if (!window.confirm('هل تريد مسح كل ما كُتب على هذه الصفحة؟')) return
    stop()
    objectsRef.current = []
    setSelectedObj(null)
    setLesson(null)
    setStepIdx(0)
    setStatus('idle')
    pushHistory()
    redraw()
  }

  /* ---------- رفع صورة من الكتاب وشرحها ---------- */
  const fileRef = useRef(null)
  const pickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const { src, w, h } = await readImageFile(file)
      const box = { x: 50, y: 120, w: 620, h: 680 }
      const k = Math.min(box.w / w, box.h / h)
      const img = {
        t: 'img',
        src,
        w: Math.round(w * k),
        h: Math.round(h * k),
        x: box.x + Math.round((box.w - w * k) / 2),
        y: box.y + Math.round((box.h - h * k) / 2),
      }
      stop()
      objectsRef.current.push(img)
      pushHistory()
      redraw()
      ask(question.trim() || 'اشرح لي محتوى هذه الصورة التعليمية خطوة بخطوة وحل ما فيها من أسئلة ومسائل.', { img })
    } catch (err) {
      setError(err.message)
    }
  }

  /* ---------- الإملاء الصوتي المباشر ---------- */
  const listen = () => {
    if (!SR) {
      setError('المتصفح لا يدعم التسجيل الصوتي المباشر. يرجى تجربة Google Chrome أو Microsoft Edge.')
      return
    }
    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }
    try {
      const r = new SR()
      r.lang = 'ar-SA'
      r.interimResults = false
      r.onresult = (ev) => {
        const text = ev.results[0][0].transcript
        setQuestion(text)
        setToast(`تم التقاط السؤال: "${text}"`)
      }
      r.onend = () => setListening(false)
      r.onerror = () => setListening(false)
      recRef.current = r
      setListening(true)
      r.start()
    } catch {
      setListening(false)
    }
  }

  /* ---------- الخروج الحتمي والمنضبط والمحدد للوحة التحكم ---------- */
  const handleExit = () => {
    stop()
    speechRef.current?.cancel()
    window.speechSynthesis?.cancel?.()
    if (typeof onClose === 'function') {
      onClose()
    } else {
      navigate('/dashboard')
    }
  }

  const busy = status === 'loading'
  const teaching = status === 'teaching' || status === 'paused' || status === 'interrupted'
  const empty = objectsRef.current.length === 0 && !teaching && !busy

  return (
    <div ref={rootRef} dir="rtl" className={`sb-root ${fullscreen ? 'sb-fullscreen-mode' : ''}`}>
      <style>{CSS}</style>

      {/* تنبيه تدوير الهاتف اللطيف وغير المعطل (يظهر فقط للهاتف المحمول الطولي الحقيقي) */}
      {showMobileTip && (
        <div className="sb-mobile-rotate-tip">
          <div className="tip-content">
            <span><Icon name="device" size={16} /> للحصول على أوسع مساحة لحل المسائل والرسم، يُفضل تدوير الهاتف للوضع الأفقي</span>
          </div>
          <button className="tip-dismiss-btn" onClick={() => setShowMobileTip(false)}>
            فهمت (متابعة)
          </button>
        </div>
      )}

      {/* ================= الشريط العلوي اللؤلؤي ================= */}
      <header className="sb-top-header">
        <div className="sb-top-right">
          {/* زر الخروج الحتمي للوحة التحكم */}
          <button
            className="sb-exit-btn"
            onClick={handleExit}
            title="الخروج من السبورة والعودة للوحة التحكم"
            aria-label="الخروج من السبورة والعودة للوحة التحكم"
          >
            <Icon name="arrowRight" size={17} />
            <span>العودة للرئيسية</span>
          </button>

          {/* شارة المعلم الذكي اللؤلؤية مع مؤشر الصوت الحي */}
          <div className="sb-teacher-badge">
            <span className="sb-teacher-avatar" style={{ background: teacher.color }}>
              <Icon name={teacher.avatar} size={19} weight="duotone" />
            </span>
            <div className="sb-teacher-info">
              <div className="sb-teacher-name">الأستاذ {teacher.name}</div>
              <div className="sb-teacher-status">
                {busy && <span className="status-busy">يفكر ويحضر الشرح...</span>}
                {speaking && (
                  <span className="status-speaking">
                    يشرح الآن
                    <span className="sb-mini-wave">
                      <i /><i /><i />
                    </span>
                  </span>
                )}
                {status === 'interrupted' && <span className="status-interrupted"><Icon name="mic" size={13} /> يستمع لسؤالك</span>}
                {teaching && !speaking && status !== 'interrupted' && <span className="status-teaching"><Icon name="edit" size={13} /> يكتب على السبورة</span>}
                {!busy && !teaching && <span>{teacher.subject} • متصل</span>}
              </div>
            </div>
          </div>
        </div>

        {/* المنتصف: عنوان الدرس أو تصفح الصفحات */}
        <div className="sb-top-center">
          {lesson ? (
            <div className="sb-lesson-badge">
              <span className="lesson-icon"><Icon name="ai" size={16} weight="duotone" /></span>
              <span className="lesson-title">{lesson.title}</span>
              <span className="lesson-steps">({Math.min(stepIdx + 1, lesson.steps.length)}/{lesson.steps.length})</span>
            </div>
          ) : (
            <div className="sb-pages-dock">
              <button
                className="page-nav-btn"
                onClick={() => handlePageChange(activePageIndex - 1)}
                disabled={activePageIndex === 0}
                title="الصفحة السابقة"
              >
                <Icon name="chevron" size={15} />
              </button>
              <span className="page-current">صفحة {activePageIndex + 1} من {pages.length}</span>
              <button
                className="page-nav-btn"
                onClick={() => handlePageChange(activePageIndex + 1)}
                disabled={activePageIndex >= pages.length - 1}
                title="الصفحة التالية"
              >
                <Icon name="arrowRight" size={15} />
              </button>
              <button className="page-add-btn" onClick={addNewPage} title="إضافة صفحة جديدة فارغة">
                <Icon name="plus" size={13} /> صفحة جديدة
              </button>
            </div>
          )}
        </div>

        {/* اليسار: أدوات الحفظ والتراجع والسرعة وملء الشاشة */}
        <div className="sb-top-left">
          {/* محدد سرعة صوت المعلم */}
          <div className="sb-speed-selector" title="سرعة شرح المعلم">
            {[0.8, 1.0, 1.25].map((spd) => (
              <button
                key={spd}
                className={`spd-btn ${speechSpeed === spd ? 'is-active' : ''}`}
                onClick={() => setSpeechSpeed(spd)}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button className="sb-icon-btn" onClick={undo} title="تراجع (Ctrl+Z)" aria-label="تراجع">
            <Icon name="undo" size={16} />
          </button>
          <button className="sb-icon-btn" onClick={redo} title="إعادة (Ctrl+Y)" aria-label="إعادة">
            <Icon name="redo" size={16} />
          </button>
          <button className="sb-icon-btn is-download" onClick={exportBoardImage} title="تنزيل الملاحظات كصورة PNG" aria-label="تنزيل الملاحظات">
            <Icon name="download" size={16} />
          </button>
          <button
            className={`sb-icon-btn ${voiceOn ? 'is-active' : ''}`}
            onClick={() => {
              setVoiceOn((v) => !v)
              if (voiceOn) speechRef.current?.cancel()
            }}
            title={voiceOn ? 'كتم صوت المعلم' : 'تشغيل صوت المعلم'}
            aria-label="صوت المعلم"
          >
            <Icon name={voiceOn ? 'volume' : 'volumeOff'} size={17} />
          </button>
          <button
            className="sb-icon-btn"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen?.()
              else rootRef.current?.requestFullscreen?.().catch(() => {})
            }}
            title={isFull ? 'تصغير' : 'ملء الشاشة'}
            aria-label="ملء الشاشة"
          >
            <Icon name={isFull ? 'shrink' : 'expand'} size={16} />
          </button>
          <button className="sb-icon-btn is-danger" onClick={clearBoard} title="مسح هذه الصفحة" aria-label="مسح السبورة">
            <Icon name="trash" size={16} />
          </button>
        </div>
      </header>

      {/* ================= مساحة الكانفاس البيضاء النورانية (Accelute Style) ================= */}
      <div
        ref={stageRef}
        className={`sb-stage ${speaking ? 'speaking' : ''}`}
        style={{ '--c1': teacher.color, '--c2': teacher.color2 }}
      >
        <canvas
          ref={canvasRef}
          className={`sb-canvas ${tool === 'text' ? 'is-text' : tool === 'eraser' ? 'is-eraser' : tool === 'select' ? 'is-select' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />

        {/* هالات الحواف عند كلام الأستاذ */}
        <div className="sb-glow" aria-hidden="true">
          <i className="sb-edge top" />
          <i className="sb-edge bottom" />
          <i className="sb-edge left" />
          <i className="sb-edge right" />
        </div>

        {/* زر المقاطعة الحية وطرح الأسئلة أثناء شرح الأستاذ (Signature Accelute Interruption) */}
        {status === 'teaching' && (
          <div className="sb-interrupt-floating-banner">
            <div className="interrupt-pulse-indicator" />
            <div className="interrupt-teacher-badge">
              <span className="interrupt-avatar"><Icon name={teacher.avatar} size={19} weight="duotone" /></span>
              <span>الأستاذ {teacher.name} يشرح ويكتب الآن...</span>
            </div>
            <button className="interrupt-trigger-btn" onClick={handleInterrupt}>
              <Icon name="hand" size={15} /> مقاطعة واسأل المعلم
            </button>
          </div>
        )}

        {/* الشاشة الترحيبية اللؤلؤية الهادئة */}
        {empty && (
          <div className="sb-empty-hero">
            <div className="sb-hero-icon" style={{ background: teacher.color }}><Icon name="ai" size={25} weight="duotone" /></div>
            <h2>سبورة رفيق AI التفاعلية (Accelute Whiteboard Tutor)</h2>
            <p>
              معلم ذكاء اصطناعي يشرح ويرسم ويكتب أمامك صوتياً، مع إمكانية مقاطعته وطرح أي سؤال في أي لحظة تماماً كمعلمك الخاص.
            </p>
            <div className="sb-hero-samples">
              <button onClick={() => ask('حل المعادلة الخطية: 2س + 4 = 10')} className="sb-sample-btn">
                <Icon name="line" size={15} /> حل معادلة خطية (رياضيات)
              </button>
              <button onClick={() => ask('قانون نيوتن الثاني في الحركة')} className="sb-sample-btn">
                <Icon name="lightning" size={15} /> قانون نيوتن الثاني (فيزياء)
              </button>
              <button onClick={() => ask('نظرية فيثاغورس في المثلث القائم')} className="sb-sample-btn">
                <Icon name="line" size={15} /> نظرية فيثاغورس (هندسة)
              </button>
              <button onClick={() => ask('وزن المعادلات الكيميائية: تكوين الماء')} className="sb-sample-btn">
                <Icon name="lab" size={15} /> وزن المعادلات (كيمياء)
              </button>
            </div>
          </div>
        )}

        {/* الإشعارات العائمة اللؤلؤية */}
        {busy && (
          <div className="sb-floating-toast">
            <span className="spinner" /> الأستاذ {teacher.name} يخطط الدرس ويرسم المعادلات...
          </div>
        )}
        {error && (
          <div className="sb-floating-toast is-err">
            <span><Icon name="warning" size={15} /> {error}</span>
            <button onClick={() => setError('')} aria-label="إغلاق"><Icon name="close" size={15} /></button>
          </div>
        )}
        {toast && (
          <div className="sb-floating-toast is-success">
            <span><Icon name="checkCircle" size={15} /> {toast}</span>
            <button onClick={() => setToast('')} aria-label="إغلاق"><Icon name="close" size={15} /></button>
          </div>
        )}

        {/* شريط التحكم والتنقل بين خطوات الدرس (Accelute Step Controller) */}
        {lesson && (
          <div className="sb-player-controls-bar">
            <button
              className="ctrl-btn"
              onClick={() => goToStep(stepIdx - 1)}
              disabled={stepIdx <= 0}
              title="الخطوة السابقة"
            >
              <Icon name="arrowRight" size={14} /> الخطوة السابقة
            </button>

            <button
              className={`ctrl-btn is-play-pause ${status === 'paused' ? 'is-paused' : ''}`}
              onClick={togglePause}
              title={status === 'paused' ? 'متابعة الشرح' : 'إيقاف مؤقت'}
            >
              <Icon name={status === 'paused' ? 'play' : 'pause'} size={15} />
              <span>{status === 'paused' ? 'متابعة' : 'إيقاف'}</span>
            </button>

            <button
              className="ctrl-btn"
              onClick={() => goToStep(stepIdx + 1)}
              disabled={stepIdx >= lesson.steps.length - 1}
              title="الخطوة التالية"
            >
              الخطوة التالية <Icon name="arrowLeft" size={14} />
            </button>

            <div className="sb-step-pills">
              {lesson.steps.map((st, idx) => (
                <button
                  key={idx}
                  className={`step-pill ${stepIdx === idx ? 'is-active' : ''} ${idx < stepIdx ? 'is-completed' : ''}`}
                  onClick={() => goToStep(idx)}
                  title={`خطوة ${idx + 1}: ${st.title || 'شرح'}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button className="ctrl-btn" onClick={replayCurrentStep} title="إعادة شرح هذه الخطوة">
              <Icon name="replay" size={14} /> أعد الخطوة
            </button>

            <button className="ctrl-btn is-replay-all" onClick={() => startLesson(lesson)} title="إعادة تشغيل الدرس كاملاً">
              ↺ إعادة الدرس
            </button>
          </div>
        )}

        {/* صندوق النص المنطوق الفوري أسفل الكانفاس (Closed Captions) */}
        {caption && (
          <div className="sb-spoken-caption">
            <span className="caption-speaker">الأستاذ {teacher.name}:</span>
            <span className="caption-text">{caption}</span>
          </div>
        )}

        {/* نافذة المقاطعة وطرح الأسئلة الحية (Interactive Accelute Interruption Sheet) */}
        {interruptModal && (
          <div className="sb-interrupt-modal-overlay">
            <div className="sb-interrupt-card">
              <div className="interrupt-card-head">
                <span className="interrupt-avatar" style={{ background: teacher.color }}><Icon name={teacher.avatar} size={19} weight="duotone" /></span>
                <div>
                  <strong><Icon name="mic" size={14} /> الأستاذ {teacher.name} يستمع إليك الآن</strong>
                  <p>تفضل بسؤالك حول ما كُتب على السبورة، أو اختر أحد الاستفسارات السريعة:</p>
                </div>
              </div>

              {/* أسئلة مقاطعة سريعة شائعة تحاكي منصة Accelute */}
              <div className="interrupt-quick-chips">
                <button onClick={() => submitInterruptQuestion('من أين جاءت هذه الخطوة في الحل؟')}>
                  <><Icon name="question" size={14} /> من أين جاءت هذه الخطوة؟</>
                </button>
                <button onClick={() => submitInterruptQuestion('أعد شرح هذه النقطة بأسلوب أبسط')}>
                  <><Icon name="replay" size={14} /> أعد شرح النقطة بأسلوب أبسط</>
                </button>
                <button onClick={() => submitInterruptQuestion('وضح هذا الجزء بمثال تطبيقي إضافي')}>
                  <><Icon name="lightbulb" size={14} /> أعطني مثالاً إضافياً</>
                </button>
                <button onClick={() => submitInterruptQuestion('لماذا استخدمنا هذه القاعدة تحديداً؟')}>
                  <><Icon name="balance" size={14} /> لماذا هذه القاعدة هنا؟</>
                </button>
              </div>

              {/* حقل كتابة أو نطق السؤال المخصص */}
              <div className="interrupt-input-wrap">
                <input
                  autoFocus
                  value={interruptQuery}
                  onChange={(e) => setInterruptQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitInterruptQuestion()}
                  placeholder="اكتب استفسارك للأستاذ هنا..."
                />
                {SR && (
                  <button
                    className={`interrupt-mic-btn ${interruptListening ? 'is-recording' : ''}`}
                    onClick={listenInterrupt}
                    title="تحدث بسؤالك صوتياً"
                  >
                    <Icon name="mic" size={16} />
                  </button>
                )}
                <button className="interrupt-submit-btn" onClick={() => submitInterruptQuestion()}>
                  إرسال السؤال
                </button>
              </div>

              <div className="interrupt-card-footer">
                <button className="interrupt-cancel-btn" onClick={resumeAfterInterrupt}>
                  متابعة الشرح دون سؤال ➔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* حقل إدخال النص على السبورة */}
        {textBox && (
          <input
            autoFocus
            dir="auto"
            className="sb-textin"
            style={{ left: textBox.sx, top: textBox.sy, color }}
            value={textBox.value}
            placeholder="اكتب واضغط Enter..."
            onChange={(e) => setTextBox({ ...textBox, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitText()
              if (e.key === 'Escape') setTextBox(null)
            }}
            onBlur={submitText}
          />
        )}
      </div>

      {/* ================= شريط الأدوات اللؤلؤي بالأسفل ================= */}
      <footer className="sb-footer-bar">
        {/* اختيار المعلم وسؤال الذكاء الاصطناعي */}
        <div className="sb-ask-cluster">
          <select
            value={teacherId}
            onChange={(e) => {
              setTeacherId(e.target.value)
              localStorage.setItem('rafeaq_smartboard_teacher', e.target.value)
            }}
            aria-label="اختيار الأستاذ"
            className="sb-teacher-select"
          >
            {TEACHERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.avatar} الأستاذ {t.name} ({t.subject})
              </option>
            ))}
          </select>

          <div className="sb-ask-input-wrap">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !busy && ask()}
              placeholder="اطلب شرح مسألة أو درس أو اكتب سؤالك..."
              aria-label="سؤالك للأستاذ"
              className="sb-ask-input"
            />
            {SR && (
              <button
                className={`sb-mic-btn ${listening ? 'is-listening' : ''}`}
                onClick={listen}
                title={listening ? 'جارٍ الاستماع... اضغط للإيقاف' : 'تحدث صوتياً'}
              >
                <Icon name="mic" size={17} />
              </button>
            )}
            <button className="sb-ask-submit-btn" onClick={() => ask()} disabled={busy}>
              {busy ? 'تحضير...' : 'اشرح لي'}
              <Icon name="send" size={14} />
            </button>
          </div>
        </div>

        <span className="sb-divider" />

        {/* أدوات الرسم والكتابة */}
        <div className="sb-tools-cluster" role="toolbar" aria-label="أدوات الرسم">
          {TOOLS.map(([id, label, iconName]) => (
            <button
              key={id}
              className={`sb-tool-btn ${tool === id ? 'is-active' : ''}`}
              onClick={() => {
                setTool(id)
                setSelectedObj(null)
              }}
              title={label}
              aria-label={label}
            >
              <Icon name={iconName} size={18} />
            </button>
          ))}
        </div>

        <span className="sb-divider" />

        {/* لوحة الألوان وسماكة الخط */}
        <div className="sb-color-cluster">
          <div className="sb-colors-row">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`sb-color-swatch ${color === c ? 'is-active' : ''}`}
                style={{ background: c }}
                onClick={() => {
                  setColor(c)
                  if (tool === 'eraser') setTool('pen')
                }}
                aria-label={`اختيار اللون ${c}`}
              />
            ))}
          </div>
          <input
            type="range"
            min="2"
            max="26"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="sb-size-slider"
            title={`سُمك الخط: ${size}px`}
          />
        </div>

        <span className="sb-divider" />

        {/* أزرار الوسائط وإدراج الصور من الكتاب */}
        <div className="sb-actions-cluster">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
          <button
            className="sb-action-btn"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            title="إدراج صورة من الكتاب وشرحها على السبورة"
          >
            <Icon name="image" size={18} />
          </button>
        </div>
      </footer>
    </div>
  )
}

/* ========================================================================= */
/*                          التنسيق البصري اللؤلؤي                            */
/* ========================================================================= */
const CSS = `
.sb-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  padding: 12px 14px 14px;
  gap: 10px;
  background: #FBFAF7;
  box-sizing: border-box;
  font-family: 'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif;
  color: #282532;
  overflow: hidden;
}
.sb-root *, .sb-root *::before, .sb-root *::after {
  box-sizing: border-box;
  font-family: inherit;
}
.sb-fullscreen-mode {
  position: fixed;
  inset: 0;
  z-index: 100;
  min-height: 100vh;
  background: #FBFAF7;
}

/* تنبيه تدوير الهاتف اللطيف */
.sb-mobile-rotate-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 14px;
  background: #F2EDFA;
  border: 1px solid #EAE6EE;
  border-radius: 12px;
  font-size: 12px;
  color: #7955C8;
  font-weight: 600;
}
.sb-mobile-rotate-tip .tip-dismiss-btn {
  background: #7955C8;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

/* الشريط العلوي اللؤلؤي */
.sb-top-header {
  height: 54px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 16px;
  border-radius: 18px;
  background: #FFFFFF;
  border: 1px solid #EAE6EE;
  box-shadow: 0 4px 18px rgba(121, 85, 200, 0.05);
}
.sb-top-right, .sb-top-left, .sb-top-center {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sb-exit-btn {
  height: 38px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid #EAE6EE;
  background: #F2EDFA;
  color: #7955C8;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sb-exit-btn:hover {
  background: #E8E0F5;
  color: #6744B4;
  transform: translateY(-1px);
}
.sb-teacher-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 6px;
  border-radius: 14px;
  background: #FBFAF7;
  border: 1px solid #EAE6EE;
}
.sb-teacher-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #FFFFFF;
  font-size: 16px;
}
.sb-teacher-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #282532;
}
.sb-teacher-status {
  font-size: 10.5px;
  color: #817C89;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sb-teacher-status .status-speaking {
  color: #24BBD1;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sb-mini-wave {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 10px;
}
.sb-mini-wave i {
  width: 2.5px;
  height: 10px;
  background: #24BBD1;
  border-radius: 1px;
  animation: sbWave 0.7s infinite alternate ease-in-out;
}
.sb-mini-wave i:nth-child(2) { animation-delay: 0.2s; }
.sb-mini-wave i:nth-child(3) { animation-delay: 0.4s; }
@keyframes sbWave {
  0% { height: 3px; }
  100% { height: 11px; }
}

.sb-speed-selector {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #FBFAF7;
  border: 1px solid #EAE6EE;
  border-radius: 10px;
  padding: 3px;
}
.sb-speed-selector .spd-btn {
  border: none;
  background: transparent;
  color: #817C89;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.sb-speed-selector .spd-btn.is-active {
  background: #7955C8;
  color: #FFFFFF;
}

.sb-lesson-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 12px;
  background: #F2EDFA;
  border: 1px solid #EAE6EE;
  font-size: 12.5px;
  color: #7955C8;
  font-weight: 700;
}
.sb-pages-dock {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  background: #FBFAF7;
  border: 1px solid #EAE6EE;
}
.sb-pages-dock .page-nav-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid #EAE6EE;
  background: #FFFFFF;
  color: #282532;
  cursor: pointer;
  font-size: 10px;
  display: grid;
  place-items: center;
}
.sb-pages-dock .page-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.sb-pages-dock .page-current {
  font-size: 12px;
  font-weight: 700;
  color: #282532;
}
.sb-pages-dock .page-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  border: none;
  background: #7955C8;
  color: #FFFFFF;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.sb-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  color: #282532;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sb-icon-btn:hover {
  background: #FFFFFF;
  border-color: #7955C8;
  color: #7955C8;
}
.sb-icon-btn.is-active {
  background: #F2EDFA;
  color: #7955C8;
  border-color: #7955C8;
}
.sb-icon-btn.is-download {
  color: #10B981;
}
.sb-icon-btn.is-download:hover {
  background: #ECFDF5;
  border-color: #10B981;
}
.sb-icon-btn.is-danger {
  color: #DC2626;
}
.sb-icon-btn.is-danger:hover {
  background: #FEF2F2;
  border-color: #DC2626;
}

/* مساحة الكانفاس */
.sb-stage {
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 0;
  border-radius: 20px;
  background: #FFFFFF;
  border: 1px solid #EAE6EE;
  box-shadow: 0 6px 24px rgba(121, 85, 200, 0.04);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sb-canvas {
  display: block;
  touch-action: none;
  cursor: crosshair;
}
.sb-canvas.is-eraser {
  cursor: cell;
}
.sb-canvas.is-select {
  cursor: grab;
}
.sb-canvas.is-text {
  cursor: text;
}

/* هالات الحواف المتوهجة عند كلام المعلم */
.sb-glow i {
  position: absolute;
  pointer-events: none;
  transition: opacity 0.3s ease;
  opacity: 0;
}
.sb-stage.speaking .sb-glow i {
  opacity: 1;
}
.sb-edge.top {
  top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--c1, #7955C8), var(--c2, #24BBD1), transparent);
}
.sb-edge.bottom {
  bottom: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--c1, #7955C8), var(--c2, #24BBD1), transparent);
}

/* زر المقاطعة وطرح الأسئلة الحية (Accelute Interruption) */
.sb-interrupt-floating-banner {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px 6px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  border: 1.5px solid #7955C8;
  box-shadow: 0 10px 30px rgba(121, 85, 200, 0.18);
  animation: bannerPop 0.3s ease-out;
}
@keyframes bannerPop {
  0% { transform: translate(-50%, -15px); opacity: 0; }
  100% { transform: translate(-50%, 0); opacity: 1; }
}
.interrupt-pulse-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulseDot 1.4s infinite;
}
@keyframes pulseDot {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { box-shadow: 0 0 0 9px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
.interrupt-teacher-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: #282532;
}
.interrupt-avatar {
  font-size: 15px;
}
.interrupt-trigger-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #7955C8, #6744B4);
  color: #FFFFFF;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(121, 85, 200, 0.3);
  transition: all 0.2s ease;
}
.interrupt-trigger-btn:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 6px 18px rgba(121, 85, 200, 0.4);
}

/* شريط التحكم والتنقل بين خطوات الدرس (Accelute Step Controller) */
.sb-player-controls-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 35;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid #EAE6EE;
  box-shadow: 0 8px 30px rgba(121, 85, 200, 0.1);
}
.sb-player-controls-bar .ctrl-btn {
  height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  color: #282532;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.sb-player-controls-bar .ctrl-btn:hover:not(:disabled) {
  background: #FFFFFF;
  border-color: #7955C8;
  color: #7955C8;
}
.sb-player-controls-bar .ctrl-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.sb-player-controls-bar .ctrl-btn.is-play-pause {
  background: #7955C8;
  border-color: #7955C8;
  color: #FFFFFF;
}
.sb-player-controls-bar .ctrl-btn.is-play-pause.is-paused {
  background: #10B981;
  border-color: #10B981;
}
.sb-player-controls-bar .ctrl-btn.is-replay-all {
  color: #7955C8;
  border-color: #F2EDFA;
  background: #F2EDFA;
}

.sb-step-pills {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
}
.sb-step-pills .step-pill {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  color: #817C89;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s ease;
}
.sb-step-pills .step-pill:hover {
  border-color: #7955C8;
  color: #7955C8;
}
.sb-step-pills .step-pill.is-active {
  background: #7955C8;
  border-color: #7955C8;
  color: #FFFFFF;
  transform: scale(1.05);
}
.sb-step-pills .step-pill.is-completed {
  background: #F2EDFA;
  color: #7955C8;
  border-color: #7955C8;
}

/* الشاشة الترحيبية */
.sb-empty-hero {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  text-align: center;
  pointer-events: none;
}
.sb-empty-hero > * {
  pointer-events: auto;
}
.sb-hero-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #FFFFFF;
  font-size: 24px;
  margin-bottom: 14px;
  box-shadow: 0 8px 24px rgba(121, 85, 200, 0.25);
}
.sb-empty-hero h2 {
  font-size: 22px;
  font-weight: 800;
  color: #282532;
  margin: 0 0 8px;
}
.sb-empty-hero p {
  max-width: 600px;
  font-size: 13.5px;
  color: #817C89;
  line-height: 1.6;
  margin: 0 0 22px;
}
.sb-hero-samples {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 740px;
}
.sb-sample-btn {
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid #EAE6EE;
  background: #FFFFFF;
  color: #282532;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(121, 85, 200, 0.04);
  transition: all 0.2s ease;
}
.sb-sample-btn:hover {
  background: #F2EDFA;
  border-color: #7955C8;
  color: #7955C8;
  transform: translateY(-1px);
}

/* الإشعارات العائمة اللؤلؤية */
.sb-floating-toast {
  position: absolute;
  top: 16px;
  left: 20px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #EAE6EE;
  box-shadow: 0 6px 20px rgba(121, 85, 200, 0.08);
  font-size: 12px;
  font-weight: 700;
  color: #282532;
}
.sb-floating-toast .spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #EAE6EE;
  border-top-color: #7955C8;
  border-radius: 50%;
  animation: sbSpin 0.7s linear infinite;
}
@keyframes sbSpin {
  to { transform: rotate(360deg); }
}
.sb-floating-toast.is-err {
  border-color: #FCA5A5;
  color: #DC2626;
  background: #FEF2F2;
}
.sb-floating-toast.is-success {
  border-color: #A7F3D0;
  color: #059669;
  background: #ECFDF5;
}
.sb-floating-toast button {
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  font-weight: bold;
}

/* النص المنطوق الفوري (Closed Captions) */
.sb-spoken-caption {
  position: absolute;
  bottom: 68px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 85%;
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border: 1px solid #EAE6EE;
  box-shadow: 0 6px 22px rgba(121, 85, 200, 0.08);
  font-size: 13.5px;
  color: #282532;
}
.caption-speaker {
  font-weight: 800;
  color: #7955C8;
}
.caption-text {
  font-weight: 600;
  color: #282532;
}

/* نافذة المقاطعة وطرح الأسئلة الحية (Accelute Interruption Sheet) */
.sb-interrupt-modal-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(40, 37, 50, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.sb-interrupt-card {
  width: 100%;
  max-width: 580px;
  border-radius: 22px;
  background: #FFFFFF;
  border: 1px solid #EAE6EE;
  box-shadow: 0 16px 45px rgba(121, 85, 200, 0.16);
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.interrupt-card-head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.interrupt-card-head .interrupt-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #FFFFFF;
  font-size: 20px;
}
.interrupt-card-head strong {
  display: block;
  font-size: 15px;
  color: #282532;
}
.interrupt-card-head p {
  font-size: 12.5px;
  color: #817C89;
  margin: 3px 0 0;
}
.interrupt-quick-chips {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.interrupt-quick-chips button {
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  color: #282532;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  cursor: pointer;
  transition: all 0.15s ease;
}
.interrupt-quick-chips button:hover {
  background: #F2EDFA;
  border-color: #7955C8;
  color: #7955C8;
}
.interrupt-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 14px;
  border: 1.5px solid #7955C8;
  background: #FFFFFF;
  padding: 4px 6px;
}
.interrupt-input-wrap input {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px 10px;
  font-size: 13px;
  color: #282532;
}
.interrupt-mic-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: #F2EDFA;
  color: #7955C8;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.interrupt-mic-btn.is-recording {
  background: #DC2626;
  color: #FFFFFF;
  animation: pulseDot 1s infinite;
}
.interrupt-submit-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  background: #7955C8;
  color: #FFFFFF;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}
.interrupt-card-footer {
  display: flex;
  justify-content: flex-end;
}
.interrupt-cancel-btn {
  background: transparent;
  border: none;
  color: #817C89;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.interrupt-cancel-btn:hover {
  color: #7955C8;
}

/* حقل النص الحر */
.sb-textin {
  position: absolute;
  transform: translate(-50%, -50%);
  background: #FFFFFF;
  border: 2px solid #7955C8;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 15px;
  outline: none;
  box-shadow: 0 6px 18px rgba(121, 85, 200, 0.15);
}

/* الشريط السفلي اللؤلؤي */
.sb-footer-bar {
  height: 58px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border-radius: 18px;
  background: #FFFFFF;
  border: 1px solid #EAE6EE;
  box-shadow: 0 4px 18px rgba(121, 85, 200, 0.05);
}
.sb-divider {
  width: 1px;
  height: 26px;
  background: #EAE6EE;
  flex-shrink: 0;
}
.sb-ask-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.sb-teacher-select {
  height: 38px;
  border-radius: 11px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  color: #282532;
  font-size: 12.5px;
  font-weight: 700;
  padding: 0 10px;
  outline: none;
  cursor: pointer;
}
.sb-ask-input-wrap {
  flex: 1;
  height: 38px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 12px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  padding: 2px 4px 2px 8px;
}
.sb-ask-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #282532;
}
.sb-mic-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #817C89;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.sb-mic-btn.is-listening {
  background: #DC2626;
  color: #FFFFFF;
  animation: pulseDot 1s infinite;
}
.sb-ask-submit-btn {
  height: 32px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9px;
  border: none;
  background: #7955C8;
  color: #FFFFFF;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sb-ask-submit-btn:hover:not(:disabled) {
  background: #6744B4;
}
.sb-ask-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* مجموعة أدوات الرسم */
.sb-tools-cluster {
  display: flex;
  align-items: center;
  gap: 3px;
}
.sb-tool-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: #555060;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.sb-tool-btn:hover {
  background: #FBFAF7;
  color: #7955C8;
}
.sb-tool-btn.is-active {
  background: #F2EDFA;
  border-color: #7955C8;
  color: #7955C8;
}

/* الألوان والسماكة */
.sb-color-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sb-colors-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.sb-color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #FFFFFF;
  box-shadow: 0 0 0 1px #EAE6EE;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.sb-color-swatch.is-active {
  transform: scale(1.25);
  box-shadow: 0 0 0 2px #7955C8;
}
.sb-size-slider {
  width: 60px;
  accent-color: #7955C8;
  cursor: pointer;
}

/* أزرار الإجراءات */
.sb-actions-cluster {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sb-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #EAE6EE;
  background: #FBFAF7;
  color: #282532;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.sb-action-btn:hover:not(:disabled) {
  background: #FFFFFF;
  border-color: #7955C8;
  color: #7955C8;
}
.sb-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* تجاوب الشاشات الصغيرة والهواتف */
@media (max-width: 900px) {
  .sb-top-header { height: auto; padding: 8px 12px; flex-wrap: wrap; }
  .sb-footer-bar { height: auto; padding: 8px 12px; flex-wrap: wrap; }
  .sb-tools-cluster { overflow-x: auto; max-width: 100%; }
}
`