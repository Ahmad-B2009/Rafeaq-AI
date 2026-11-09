
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import AtelierLayout from './components/AtelierLayout.jsx'
import AtelierHome from './pages/AtelierHome.jsx'
import DashboardTabRoute from './pages/DashboardTabRoute.jsx'
import SettingsCenter from './pages/SettingsCenter.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<AtelierLayout />}>
          <Route index element={<AtelierHome />} />
          <Route path="settings" element={<SettingsCenter />} />
          <Route path=":tab" element={<DashboardTabRoute />} />
        </Route>

        <Route path="/os" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
