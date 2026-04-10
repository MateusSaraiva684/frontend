import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './services/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Alunos from './pages/Alunos'
import FormAluno from './pages/FormAluno'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas normais */}
          <Route path="/" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/alunos" element={<PrivateRoute><Alunos /></PrivateRoute>} />
          <Route path="/alunos/novo" element={<PrivateRoute><FormAluno /></PrivateRoute>} />
          <Route path="/alunos/editar/:id" element={<PrivateRoute><FormAluno /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

          {/* Painel admin — acessível pelo mesmo login */}
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
