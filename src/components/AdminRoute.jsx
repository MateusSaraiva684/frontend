import { Navigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function AdminRoute({ children }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/" replace />
  if (!usuario.is_superuser) return <Navigate to="/alunos" replace />
  return children
}
