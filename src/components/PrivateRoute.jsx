import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function PrivateRoute({ children }) {
  const { usuario } = useAuth()
  const location = useLocation()
  return usuario
    ? children
    : <Navigate to="/" state={{ from: location }} replace />
}
