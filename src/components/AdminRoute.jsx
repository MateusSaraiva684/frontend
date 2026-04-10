import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function AdminRoute({ children }) {
  const { usuario } = useAuth()
  const location = useLocation()

  if (!usuario) return <Navigate to="/admin/login" state={{ from: location }} replace />
  if (!usuario.is_superuser) return <Navigate to="/alunos" replace />
  return children
}
