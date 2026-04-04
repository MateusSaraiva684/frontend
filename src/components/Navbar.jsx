import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

export default function Navbar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const link = (to, label, icon) => (
    <Link
      to={to}
      className={`btn btn-sm ${pathname === to ? 'btn-light' : 'btn-outline-light'}`}
    >
      <i className={`fa ${icon} me-1`}></i>{label}
    </Link>
  )

  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/alunos">
          <i className="fa fa-school me-2"></i>Sistema Escolar
        </Link>
        <div className="d-flex align-items-center gap-2">
          <span className="text-secondary small d-none d-md-inline">{usuario?.nome}</span>
          {link('/alunos', 'Alunos', 'fa-users')}
          {link('/dashboard', 'Dashboard', 'fa-chart-line')}
          <button onClick={handleLogout} className="btn btn-sm btn-outline-danger">
            <i className="fa fa-sign-out-alt me-1"></i>Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
