import { createContext, useContext, useState, useCallback } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const s = localStorage.getItem('usuario')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email, senha) => {
    const { data } = await api.post('/api/auth/login', { email, senha }, { withCredentials: true })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('usuario', JSON.stringify(data.usuario))
    setUsuario(data.usuario)
    return data
  }, [])

  const registrar = useCallback(async (nome, email, senha) => {
    await api.post('/api/auth/registrar', { nome, email, senha })
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout', {}, { withCredentials: true })
    } catch { /* ignora erro de rede */ }
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
