// src/os/icons.jsx
// أيقونات SVG خفيفة (بدون مكتبات). كل أيقونة مرسومة على شبكة 24×24 بخط واحد.
const P = {
  ai: (
    <>
      <rect x="4" y="8" width="16" height="11" rx="4.5" />
      <circle cx="9" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 8V5.5" />
      <circle cx="12" cy="4.3" r="1.1" />
      <path d="M2 13h2M20 13h2" />
    </>
  ),
  folder: <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />,
  book: (
    <>
      <path d="M2.5 5.5H9A3 3 0 0 1 12 8.5V20a2 2 0 0 0-2-2H2.5z" />
      <path d="M21.5 5.5H15A3 3 0 0 0 12 8.5V20a2 2 0 0 1 2-2h7.5z" />
    </>
  ),
  tasks: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <path d="m8.5 12.4 2.5 2.5 4.8-5.3" />
    </>
  ),
  notebook: (
    <>
      <rect x="4.5" y="3" width="13" height="18" rx="2.5" />
      <path d="M8 8h6M8 12h4" />
      <path d="m13.5 17.5 6.2-6.2a1.4 1.4 0 0 1 2 2L15.5 19.5l-2.8.7z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  board: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2.5" />
      <path d="M12 16v4M8 20h8M7.5 12.5l3-3 2.5 2 3.5-3.5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3.5" />
      <circle cx="9" cy="10" r="1.7" />
      <path d="m21 16-5-5-8.5 8.5" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 1.8M9.5 2.5h5" />
    </>
  ),
  notes: (
    <>
      <path d="M6 3h8.5L19 7.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M14 3v5h5M8 13h8M8 17h5" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-7.5 9 7.5" />
      <path d="M5.5 9.5V20h13V9.5M10 20v-5.5h4V20" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.9-3.9" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m15 6-6 6 6 6" />,
  chevronUp: <path d="m6 15 6-6 6 6" />,
  power: <path d="M12 3v8.5M6.6 6.8a7.5 7.5 0 1 0 10.8 0" />,
  min: <path d="M6 12h12" />,
  max: <rect x="6" y="6" width="12" height="12" rx="2" />,
  restore: (
    <>
      <rect x="5" y="9" width="10" height="10" rx="2" />
      <path d="M9 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
    </>
  ),
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  wifi: (
    <>
      <path d="M2.5 9a14 14 0 0 1 19 0M5.8 12.4a9.5 9.5 0 0 1 12.4 0M9 15.7a5 5 0 0 1 6 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  wifiOff: (
    <>
      <path d="M2.5 9a14 14 0 0 1 4-2.6M21.5 9a14 14 0 0 0-8-3.9M9 15.7a5 5 0 0 1 6 0M5.8 12.4a9.5 9.5 0 0 1 3-1.8" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
      <path d="m3 3 18 18" />
    </>
  ),
  battery: (
    <>
      <rect x="2.5" y="7" width="16" height="10" rx="2.5" />
      <path d="M21.5 10.5v3" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </>
  ),
  layout: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="3" />
      <path d="M3.5 9.5h17M9.5 9.5V20" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.6V16h5.6v-.6c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
}

export function Icon({ name, size = 20, stroke = 1.8, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[name] || null}
    </svg>
  )
}

// مربع أيقونة ملوّن لتطبيق (يُستخدم في سطح المكتب والقوائم وشريط المهام)
export function AppIcon({ app, size = 48, className = '' }) {
  return (
    <span
      className={`ros-aicon ${className}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: app.grad }}
      aria-hidden="true"
    >
      <Icon name={app.icon} size={Math.round(size * 0.54)} stroke={size < 32 ? 2 : 1.7} />
    </span>
  )
}
