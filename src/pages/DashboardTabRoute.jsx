
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Dashboard from './Dashboard.jsx'

const VALID_TABS = [
  'ai',
  'lab',
  'notebook',
  'board',
  'books',
  'notes',
  'tasks',
  'timer',
]

export default function DashboardTabRoute() {
  const { tab } = useParams()
  const navigate = useNavigate()

  if (!VALID_TABS.includes(tab)) {
    return <Navigate to="/dashboard" replace />
  }

  function handleNavigate(nextTab) {
    if (nextTab === 'home') {
      navigate('/dashboard')
      return
    }

    if (VALID_TABS.includes(nextTab)) {
      navigate(`/dashboard/${nextTab}`)
    }
  }

  return (
    <Dashboard
      embedded
      forcedTab={tab}
      onNavigate={handleNavigate}
    />
  )
}
