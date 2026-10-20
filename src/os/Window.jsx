// src/os/Window.jsx
// نافذة Aero: سحب، تغيير حجم، تصغير، تكبير، إغلاق، تثبيت على الحافة.
import { memo, useRef } from 'react'
import { MIN_W, MIN_H } from './wm'
import { Icon, AppIcon } from './icons'

const HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

function WindowImpl({ win, app, active, area, mobile, dispatch, onSnapHint, onDragging, children }) {
  const drag = useRef(null)
  const resize = useRef(null)
  const hidden = win.state === 'min' || (mobile && !active)

  /* ---------- سحب النافذة من شريط العنوان ---------- */
  const onTitleDown = (e) => {
    if (mobile || e.button !== 0 || e.target.closest('.ros-cap')) return
    dispatch({ type: 'focus', id: win.id })
    let { x, y } = win
    if (win.state === 'max') {
      // السحب من نافذة مكبّرة يعيدها لحجمها السابق تحت المؤشر
      x = Math.round(e.clientX - win.w / 2)
      y = 0
      dispatch({ type: 'rect', id: win.id, rect: { x, y, w: win.w, h: win.h } })
    }
    drag.current = { px: e.clientX, py: e.clientY, x0: x, y0: y, zone: null }
    e.currentTarget.setPointerCapture(e.pointerId)
    onDragging(true)
  }

  const onTitleMove = (e) => {
    const d = drag.current
    if (!d) return
    const x = d.x0 + (e.clientX - d.px)
    const y = Math.min(Math.max(0, d.y0 + (e.clientY - d.py)), area.h - 32)
    dispatch({ type: 'rect', id: win.id, rect: { x, y, w: win.w, h: win.h } })
    const zone = e.clientY <= 4 ? 'top' : e.clientX <= 4 ? 'left' : e.clientX >= window.innerWidth - 4 ? 'right' : null
    if (zone !== d.zone) {
      d.zone = zone
      onSnapHint(zone)
    }
  }

  const onTitleUp = () => {
    const d = drag.current
    if (!d) return
    drag.current = null
    onDragging(false)
    onSnapHint(null)
    if (d.zone) dispatch({ type: 'snap', id: win.id, side: d.zone, area })
  }

  /* ---------- تغيير الحجم من الحواف ---------- */
  const onHandleDown = (dir) => (e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    dispatch({ type: 'focus', id: win.id })
    resize.current = { dir, px: e.clientX, py: e.clientY, r0: { x: win.x, y: win.y, w: win.w, h: win.h } }
    e.currentTarget.setPointerCapture(e.pointerId)
    onDragging(true)
  }

  const onHandleMove = (e) => {
    const r = resize.current
    if (!r) return
    const dx = e.clientX - r.px
    const dy = e.clientY - r.py
    let { x, y, w, h } = r.r0
    if (r.dir.includes('e')) w = Math.max(MIN_W, r.r0.w + dx)
    if (r.dir.includes('s')) h = Math.max(MIN_H, r.r0.h + dy)
    if (r.dir.includes('w')) {
      w = Math.max(MIN_W, r.r0.w - dx)
      x = r.r0.x + (r.r0.w - w)
    }
    if (r.dir.includes('n')) {
      h = Math.max(MIN_H, r.r0.h - dy)
      y = r.r0.y + (r.r0.h - h)
    }
    dispatch({ type: 'rect', id: win.id, rect: { x, y: Math.max(0, y), w, h } })
  }

  const onHandleUp = () => {
    if (!resize.current) return
    resize.current = null
    onDragging(false)
  }

  const style = mobile
    ? { zIndex: win.z, display: hidden ? 'none' : undefined }
    : win.state === 'max'
      ? { left: 0, top: 0, width: '100%', height: '100%', zIndex: win.z, display: hidden ? 'none' : undefined }
      : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z, display: hidden ? 'none' : undefined }

  return (
    <section
      className={`ros-win ${active ? 'active' : 'inactive'} ${win.state === 'max' ? 'max' : ''}`}
      style={style}
      role="dialog"
      aria-label={app.title}
      onPointerDown={() => !active && dispatch({ type: 'focus', id: win.id })}
    >
      <header
        className="ros-titlebar"
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={onTitleUp}
        onPointerCancel={onTitleUp}
        onDoubleClick={(e) => !mobile && !e.target.closest('.ros-cap') && dispatch({ type: 'toggleMax', id: win.id })}
      >
        <AppIcon app={app} size={22} className="ros-wicon" />
        <span className="ros-wtitle">{app.title}</span>
        <div className="ros-caps">
          {mobile && (
            <button className="ros-cap ros-home" aria-label="العودة إلى سطح المكتب" onClick={() => dispatch({ type: 'minAll' })}>
              <Icon name="home" size={17} />
            </button>
          )}
          {!mobile && (
            <>
              <button className="ros-cap" aria-label="تصغير" onClick={() => dispatch({ type: 'min', id: win.id })}><Icon name="min" size={16} /></button>
              <button className="ros-cap" aria-label={win.state === 'max' ? 'استعادة' : 'تكبير'} onClick={() => dispatch({ type: 'toggleMax', id: win.id })}>
                <Icon name={win.state === 'max' ? 'restore' : 'max'} size={15} />
              </button>
            </>
          )}
          <button className="ros-cap ros-close" aria-label="إغلاق" onClick={() => dispatch({ type: 'close', id: win.id })}><Icon name="close" size={17} /></button>
        </div>
      </header>

      <div className="ros-wbody">
        <div className="ros-wscroll">{children}</div>
      </div>

      {!mobile && win.state !== 'max' &&
        HANDLES.map((h) => (
          <div
            key={h}
            className={`ros-h ros-h-${h}`}
            onPointerDown={onHandleDown(h)}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
          />
        ))}
    </section>
  )
}

export default memo(WindowImpl)
