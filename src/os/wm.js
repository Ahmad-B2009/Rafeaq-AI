
// src/os/wm.js
// مدير النوافذ: reducer بسيط بدون مكتبات خارجية.

export const TASKBAR_H = 42
export const MIN_W = 360
export const MIN_H = 280

const clamp = (v, a, b) => Math.max(a, Math.min(v, b))

const finite = (value, fallback) =>
  Number.isFinite(value) ? value : fallback

const getBackState = (state) =>
  state === 'max' ? 'max' : 'normal'

function pickFocus(wins) {
  const visible = wins.filter((w) => w.state !== 'min')

  if (!visible.length) return null

  return visible.reduce((a, b) => (b.z > a.z ? b : a)).id
}

export function initState(saved, validIds) {
  const wins = (Array.isArray(saved) ? saved : [])
    .filter((w) => w && validIds.includes(w.app))
    .map((w, i) => ({
      id: w.app,
      app: w.app,

      x: finite(w.x, 60),
      y: finite(w.y, 30),

      w: Math.max(MIN_W, finite(w.w, 700)),
      h: Math.max(MIN_H, finite(w.h, 500)),

      state:
        w.state === 'max'
          ? 'max'
          : w.state === 'min'
            ? 'min'
            : 'normal',

      back: w.back === 'max' ? 'max' : 'normal',

      z: i + 1,
      payload: null,
    }))

  return {
    wins,
    z: wins.length + 1,
    focus: pickFocus(wins),
  }
}

export function serialize(wins) {
  return wins.map(({ app, x, y, w, h, state, back }) => ({
    app,
    x,
    y,
    w,
    h,
    state,
    back,
  }))
}

export function reducer(st, a) {
  switch (a.type) {
    case 'open': {
      const { app, area, payload } = a

      const z = st.z + 1
      const existing = st.wins.find((w) => w.id === app.id)

      if (existing) {
        return {
          z,
          focus: existing.id,
          wins: st.wins.map((w) =>
            w.id === existing.id
              ? {
                  ...w,
                  state:
                    w.state === 'min'
                      ? w.back || 'normal'
                      : w.state,
                  z,
                  payload: payload ?? w.payload,
                }
              : w
          ),
        }
      }

      const areaW = Math.max(1, finite(area?.w, 900))
      const areaH = Math.max(1, finite(area?.h, 600))

      const n = st.wins.length

      const requestedW = finite(app.w, 700)
      const requestedH = finite(app.h, 500)

      const w = Math.min(
        requestedW,
        Math.max(MIN_W, areaW - 24)
      )

      // بعض التطبيقات تفتح تحت شريط البحث.
      const hasTop =
        Number.isFinite(app.top) && areaH >= 560

      const h = hasTop
        ? Math.min(
            requestedH,
            Math.max(MIN_H, areaH - app.top - 12)
          )
        : Math.min(
            requestedH,
            Math.max(MIN_H, areaH - 24)
          )

      const x = clamp(
        Math.round((areaW - w) / 2) +
          (hasTop ? 0 : (n % 6) * 28 - 56),
        0,
        Math.max(0, areaW - w)
      )

      const y = hasTop
        ? app.top
        : clamp(
            Math.round((areaH - h) / 2) +
              (n % 6) * 24 - 40,
            0,
            Math.max(0, areaH - h)
          )

      const win = {
        id: app.id,
        app: app.id,
        x,
        y,
        w,
        h,
        state: app.max ? 'max' : 'normal',
        back: 'normal',
        z,
        payload: payload ?? null,
      }

      return {
        z,
        focus: win.id,
        wins: [...st.wins, win],
      }
    }

    case 'close': {
      const wins = st.wins.filter((w) => w.id !== a.id)

      return {
        ...st,
        wins,
        focus:
          st.focus === a.id
            ? pickFocus(wins)
            : st.focus,
      }
    }

    case 'min': {
      const wins = st.wins.map((w) => {
        if (w.id !== a.id) return w

        // لا نفقد حالة الرجوع إذا كانت النافذة مصغّرة بالفعل.
        if (w.state === 'min') return w

        return {
          ...w,
          state: 'min',
          back: getBackState(w.state),
        }
      })

      return {
        ...st,
        wins,
        focus:
          st.focus === a.id
            ? pickFocus(wins)
            : st.focus,
      }
    }

    case 'toggleMax': {
      const wins = st.wins.map((w) => {
        if (w.id !== a.id) return w

        // استعادة الأبعاد والإحداثيات السابقة.
        // لا نحتاج إلى حفظ نسخة أخرى لأن max لا يغيّرها.
        return {
          ...w,
          state: w.state === 'max' ? 'normal' : 'max',
        }
      })

      return {
        ...st,
        wins,
      }
    }

    case 'focus': {
      const target = st.wins.find((w) => w.id === a.id)

      if (!target) return st

      const z = st.z + 1

      return {
        z,
        focus: a.id,
        wins: st.wins.map((w) =>
          w.id === a.id
            ? {
                ...w,
                state:
                  w.state === 'min'
                    ? w.back || 'normal'
                    : w.state,
                z,
              }
            : w
        ),
      }
    }

    case 'rect': {
      const rect = a.rect || {}

      return {
        ...st,
        wins: st.wins.map((w) => {
          if (w.id !== a.id) return w

          return {
            ...w,
            x: finite(rect.x, w.x),
            y: finite(rect.y, w.y),
            w: Math.max(MIN_W, finite(rect.w, w.w)),
            h: Math.max(MIN_H, finite(rect.h, w.h)),
            state: 'normal',
          }
        }),
      }
    }

    case 'snap': {
      const area = a.area || {}
      const areaW = Math.max(1, finite(area.w, 900))
      const areaH = Math.max(1, finite(area.h, 600))

      if (a.side === 'top') {
        return {
          ...st,
          wins: st.wins.map((w) =>
            w.id === a.id
              ? { ...w, state: 'max' }
              : w
          ),
        }
      }

      const half = Math.floor(areaW / 2)

      const rect =
        a.side === 'left'
          ? { x: 0, y: 0, w: half, h: areaH }
          : {
              x: areaW - half,
              y: 0,
              w: half,
              h: areaH,
            }

      return {
        ...st,
        wins: st.wins.map((w) =>
          w.id === a.id
            ? { ...w, ...rect, state: 'normal' }
            : w
        ),
      }
    }

    case 'tile': {
      const area = a.area || {}
      const areaW = Math.max(1, finite(area.w, 900))
      const areaH = Math.max(1, finite(area.h, 600))

      const visible = st.wins.filter(
        (w) => w.state !== 'min'
      )

      if (!visible.length) return st

      const cols = Math.ceil(Math.sqrt(visible.length))
      const rows = Math.ceil(visible.length / cols)

      const cw = Math.floor(areaW / cols)
      const ch = Math.floor(areaH / rows)

      const rects = new Map()

      visible.forEach((w, i) => {
        const c = i % cols
        const r = Math.floor(i / cols)

        rects.set(w.id, {
          x: c * cw,
          y: r * ch,
          w: Math.max(MIN_W, cw - 4),
          h: Math.max(MIN_H, ch - 4),
        })
      })

      return {
        ...st,
        wins: st.wins.map((w) =>
          rects.has(w.id)
            ? {
                ...w,
                ...rects.get(w.id),
                state: 'normal',
              }
            : w
        ),
      }
    }

    case 'clamp': {
      const area = a.area || {}
      const areaW = Math.max(1, finite(area.w, 900))
      const areaH = Math.max(1, finite(area.h, 600))

      return {
        ...st,
        wins: st.wins.map((w) => {
          if (w.state !== 'normal') return w

          const ww = Math.min(w.w, areaW)
          const hh = Math.min(w.h, areaH)

          return {
            ...w,
            w: ww,
            h: hh,
            x: clamp(
              w.x,
              -ww + 120,
              Math.max(0, areaW - 120)
            ),
            y: clamp(
              w.y,
              0,
              Math.max(0, areaH - 32)
            ),
          }
        }),
      }
    }

    case 'minAll': {
      return {
        ...st,
        focus: null,
        wins: st.wins.map((w) =>
          w.state === 'min'
            ? w
            : {
                ...w,
                state: 'min',
                back: getBackState(w.state),
              }
        ),
      }
    }

    case 'closeAll':
      return {
        ...st,
        wins: [],
        focus: null,
      }

    default:
      return st
  }
}
