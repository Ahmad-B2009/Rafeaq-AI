
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { RafeeqIcon } from './RafeeqIcon.jsx'
import { readUserPreferences } from '../lib/userPreferences'
import './AtelierLayout.css'

const navigation = [
  {
    title: 'مساحة التعلم',
    items: [
      { label: 'الرئيسية', icon: 'home', to: '/dashboard' },
      { label: 'رفيق AI', icon: 'ai', to: '/dashboard/ai' },
      { label: 'مختبر رفيق', icon: 'lab', to: '/dashboard/lab' },
    ],
  },
  {
    title: 'أدواتك',
    items: [
      { label: 'دفتر رفيق', icon: 'notebook', to: '/dashboard/notebook' },
      { label: 'السبورة', icon: 'board', to: '/dashboard/board' },
      { label: 'المكتبة', icon: 'book', to: '/dashboard/books' },
      { label: 'ملاحظاتي', icon: 'notes', to: '/dashboard/notes' },
      { label: 'الإنجاز', icon: 'list', to: '/dashboard/tasks' },
      { label: 'مؤقت الدراسة', icon: 'timer', to: '/dashboard/timer' },
    ],
  },
]

function SidebarLink({ item, collapsed, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `atelier-nav-link ${isActive ? 'active' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <span className="atelier-nav-icon"><RafeeqIcon name={item.icon} size={19} weight={isActive ? 'duotone' : 'regular'} /></span>
          {!collapsed && <span>{item.label}</span>}
        </>
      )}
    </NavLink>
  )
}

export default function AtelierLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileName, setProfileName] = useState(() => readProfileName())
  const location = useLocation()
  const pageTitle = location.pathname.endsWith('/settings') ? 'الإعدادات' : 'مساحة التعلم'

  useEffect(() => {
    const applyPreferences = (preferences = readUserPreferences()) => {
      const shell = document.querySelector('.atelier-shell')
      if (!shell) return
      shell.dataset.theme = preferences.theme
      shell.dataset.fontSize = preferences.fontSize
      shell.dataset.reduceMotion = String(preferences.reduceMotion)
    }
    const updateProfile = (event) => {
      setProfileName(event.detail?.name || readProfileName())
    }
    applyPreferences()
    const onPreferenceChange = (event) => applyPreferences(event.detail)
    window.addEventListener('rafeeq-preferences-change', onPreferenceChange)
    window.addEventListener('rafeeq-profile-change', updateProfile)
    return () => {
      window.removeEventListener('rafeeq-preferences-change', onPreferenceChange)
      window.removeEventListener('rafeeq-profile-change', updateProfile)
    }
  }, [])

  const closeMobileMenu = () => {
    setMobileOpen(false)
  }

  const toggleSidebar = () => {
    if (window.innerWidth <= 700) {
      setMobileOpen(false)
    } else {
      setCollapsed(value => !value)
    }
  }

  const openMobileMenu = () => {
    setCollapsed(false)
    setMobileOpen(true)
  }

  return (
    <div className={`atelier-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            className="atelier-mobile-overlay"
            aria-label="إغلاق القائمة"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        className={`atelier-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      >

        {/* BRAND */}
        <div className="atelier-brand">
          <div className="atelier-brand-mark">ر</div>

          {!collapsed && (
            <div className="atelier-brand-text">
              <strong>رفيق</strong>
              <span>مساحة تعلمك</span>
            </div>
          )}

          <button
            className="atelier-collapse"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
            title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="atelier-sidebar-content">
          {navigation.map(group => (
            <section className="atelier-nav-group" key={group.title}>

              {!collapsed && (
                <h3 className="atelier-nav-heading">
                  {group.title}
                </h3>
              )}

              <nav>
                {group.items.map(item => (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    collapsed={collapsed}
                    onNavigate={closeMobileMenu}
                  />
                ))}
              </nav>

            </section>
          ))}
        </div>

        {/* SIDEBAR BOTTOM */}
        <div className="atelier-sidebar-bottom">

          <NavLink
            to="/dashboard/settings"
            end
            className={({ isActive }) => `atelier-nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
            title={collapsed ? 'الإعدادات' : undefined}
          >
            <span className="atelier-nav-icon"><RafeeqIcon name="settings" size={19} /></span>
            {!collapsed && <span>الإعدادات</span>}
          </NavLink>

          <div className="atelier-profile">
            <div className="atelier-avatar">{profileName.charAt(0) || 'ر'}</div>

            {!collapsed && (
              <div className="atelier-profile-info">
              <strong>{profileName || 'مرحباً بك'}</strong>
                <span>في رفيق</span>
              </div>
            )}
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="atelier-main">

        {/* TOPBAR */}
        <header className="atelier-topbar">

          <div className="atelier-topbar-start">

            <button
              className="atelier-mobile-menu"
              onClick={openMobileMenu}
              aria-label="فتح القائمة"
              title="القائمة"
            >
              <RafeeqIcon name="menu" size={19} />
            </button>

            <div className="atelier-breadcrumb">
              <span>رفيق</span>
              <span className="atelier-breadcrumb-separator">/</span>
              <strong>{pageTitle}</strong>
            </div>

          </div>

          <div className="atelier-topbar-actions">

            <button
              className="atelier-icon-button"
              aria-label="البحث"
              title="البحث"
            >
              <RafeeqIcon name="search" size={19} />
            </button>

            <button
              className="atelier-icon-button"
              aria-label="الإشعارات"
              title="الإشعارات"
            >
              <RafeeqIcon name="bell" size={18} />
              <i />
            </button>

            <div className="atelier-topbar-avatar">{profileName.charAt(0) || 'ر'}</div>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="atelier-page">
          <Outlet />
        </div>

      </main>
    </div>
  )
}

function readProfileName() {
  try {
    const name = localStorage.getItem('rafeaq_name')
    if (name?.trim()) return name.trim()
    const user = JSON.parse(localStorage.getItem('rafeaq_user') || 'null')
    const profile = JSON.parse(localStorage.getItem('rafeaq_profile') || 'null')
    return user?.name?.trim() || user?.fullName?.trim() || profile?.name?.trim() || ''
  } catch {
    return ''
  }
}
