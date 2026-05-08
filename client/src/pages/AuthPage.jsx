import { useNavigate } from 'react-router-dom'
import AuthPanel from '../components/auth/AuthPanel'

export default function AuthPage({ onAuthSuccess }) {
  const navigate = useNavigate()

  const handleSuccess = (token, user) => {
    onAuthSuccess(token, user)
    navigate('/', { replace: true })
  }

  return <AuthPanel onAuthSuccess={handleSuccess} />
}
