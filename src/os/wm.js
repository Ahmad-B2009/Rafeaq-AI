// src/os/wm.js
// مدير النوافذ: reducer بسيط بدون مكتبات خارجية.

export const TASKBAR_H = 42
export const MIN_W = 360
export const MIN_H = 280

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

function pickFocus(wins) {
  const vis = wins.filter((w) => w.state !== 'min')
  if (!vis.length) return null
  return vis.reduce((a, b) => (b.z > a.z ? b : a)).id
}

export function initState(saved, validIds) {
  const wins = (saved || [])
    .filter((w) => w && validIds.includes(w.app))
    .map((w, i) => ({
      id: w.app,
      app: w.app,
      x: Number.isFinite(w.x) ? w.x : 60,
      y: Number.isFinite(w.y) ? w.y : 30,
      w: Math.max(MIN_W, w.w || 700),
      h: Math.max(MIN_H, w.h || 500),
      state: w.state === 'max' ? 'max' : w.state === 'min' ? 'min' : 'normal',
      back: w.back === 'max' ? 'max' : 'normal',
      z: i + 1,
      payload: null,
    }))
  return { wins, z: wins.length + 1, focus: pickFocus(wins) }
}

export function serialize(wins) {
  return wins.map(({ app, x, y, w, h, state, back }) => ({ app, x, y, w, h, state, back }))
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
              ? { ...w, state: w.state === 'min' ? w.back || 'normal' : w.state, z, payload: payload ?? w.payload }
              : w
          ),
        }
      }
      const n = st.wins.length
      const w = Math.min(app.w, Math.max(MIN_W, area.w - 24))
      // app.top: نافذة تُفتح تحت شريط البحث (مثل «الرئيسية»)، وتُصغَّر لتبقى داخل الشاشة
      const hasTop = Number.isFinite(app.top) && area.h >= 560
      const h = hasTop ? Math.min(app.h, Math.max(MIN_H, area.h - app.top - 12)) : Math.min(app.h, Math.max(MIN_H, area.h - 24))
      const x = clamp(Math.round((area.w - w) / 2) + (hasTop ? 0 : (n % 6) * 28 - 56), 0, Math.max(0, area.w - w))
      const y = hasTop ? app.top : clamp(Math.round((area.h - h) / 2) + (n % 6) * 24 - 40, 0, Math.max(0, area.h - h))
      const win = { id: app.id, app: app.id, x, y, w, h, state: app.max ? 'max' : 'normal', back: 'normal', z, payload: payload ?? null }
      return { z, focus: win.id, wins: [...st.wins, win] }
    }
    case 'close': {
      const wins = st.wins.filter((w) => w.id !== a.id)
      return { ...st, wins, focus: st.focus === a.id ? pickFocus(wins) : st.focus }
    }
    case 'min': {
      const wins = st.wins.map((w) => (w.id === a.id ? { ...w, state: 'min', back: w.state === 'max' ? 'max' : 'normal' } : w))
      return { ...st, wins, focus: st.focus === a.id ? pickFocus(wins) : st.focus }
    }
    case 'toggleMax': {
      return { ...st, wins: st.wins.map((w) => (w.id === a.id ? { ...w, state: w.state === 'max' ? 'normal' : 'max' } : w)) }
    }
    case 'focus': {
      const z = st.z + 1
      return {
        z,
        focus: a.id,
        wins: st.wins.map((w) => (w.id === a.id ? { ...w, state: w.state === 'min' ? w.back || 'normal' : w.state, z } : w)),
      }
    }
    case 'rect': {
      return { ...st, wins: st.wins.map((w) => (w.id === a.id ? { ...w, ...a.rect, state: 'normal' } : w)) }
    }
    case 'snap': {
      const { area } = a
      if (a.side === 'top') return { ...st, wins: st.wins.map((w) => (w.id === a.id ? { ...w, state: 'max' } : w)) }
      const half = Math.floor(area.w / 2)
      const rect = a.side === 'left' ? { x: 0, y: 0, w: half, h: area.h } : { x: area.w - half, y: 0, w: half, h: area.h }
      return { ...st, wins: st.wins.map((w) => (w.id === a.id ? { ...w, ...rect, state: 'normal' } : w)) }
    }
    case 'tile': {
      const { area } = a
      const vis = st.wins.filter((w) => w.state !== 'min')
      if (!vis.length) return st
      const cols = Math.ceil(Math.sqrt(vis.length))
      const rows = Math.ceil(vis.length / cols)
      const cw = Math.floor(area.w / cols)
      const ch = Math.floor(area.h / rows)
      const rects = new Map()
      vis.forEach((w, i) => {
        const c = i % cols
        const r = Math.floor(i / cols)
        rects.set(w.id, { x: c * cw, y: r * ch, w: cw - 4, h: ch - 4 })
      })
      return { ...st, wins: st.wins.map((w) => (rects.has(w.id) ? { ...w, ...rects.get(w.id), state: 'normal' } : w)) }
    }
    case 'clamp': {
      const { area } = a
      return {
        ...st,
        wins: st.wins.map((w) => {
          if (w.state !== 'normal') return w
          const ww = Math.min(w.w, area.w)
          const hh = Math.min(w.h, area.h)
          return {
            ...w,
            w: ww,
            h: hh,
            x: clamp(w.x, -ww + 120, Math.max(0, area.w - 120)),
            y: clamp(w.y, 0, Math.max(0, area.h - 32)),
          }
        }),
      }
    }
    case 'minAll':
      return {
        ...st,
        focus: null,
        wins: st.wins.map((w) => (w.state === 'min' ? w : { ...w, state: 'min', back: w.state === 'max' ? 'max' : 'normal' })),
      }
    case 'closeAll':
      return { ...st, wins: [], focus: null }
    default:
      return st
  }
}
