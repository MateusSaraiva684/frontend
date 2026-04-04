import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import adminApi, { BASE_URL } from '../services/adminApi'

function StatCard({ titulo, valor, cor, icone }) {
  return (
    <div className="card p-4 h-100" style={{ borderRadius: 12, border: 'none', background: '#1f2937' }}>
      <div className="d-flex align-items-center gap-3">
        <div className={`rounded-circle d-flex align-items-center justify-content-center ${cor}`}
          style={{ width: 48, height: 48, minWidth: 48 }}>
          <i className={`fa ${icone}`}></i>
        </div>
        <div>
          <div className="text-secondary small">{titulo}</div>
          <div className="fs-3 fw-semibold text-white">{valor ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [aba, setAba] = useState('usuarios')
  const [stats, setStats] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [alunos, setAlunos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    Promise.all([
      adminApi.get('/api/admin/stats'),
      adminApi.get('/api/admin/usuarios'),
      adminApi.get('/api/admin/alunos'),
    ]).then(([s, u, a]) => {
      setStats(s.data)
      setUsuarios(u.data)
      setAlunos(a.data)
    }).finally(() => setCarregando(false))
  }, [])

  function logout() {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  async function toggleAtivo(id) {
    const { data } = await adminApi.patch(`/api/admin/usuarios/${id}/ativo`)
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo: data.ativo } : u))
  }

  async function deletarUsuario(id, nome) {
    if (!confirm(`Remover permanentemente o usuário "${nome}" e todos os seus alunos?`)) return
    await adminApi.delete(`/api/admin/usuarios/${id}`)
    setUsuarios(prev => prev.filter(u => u.id !== id))
    setAlunos(prev => prev.filter(a => a.usuario_email !== usuarios.find(u => u.id === id)?.email))
    const { data } = await adminApi.get('/api/admin/stats')
    setStats(data)
  }

  const usuariosFiltrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase())
  )

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.usuario_nome?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#111827', color: '#f9fafb' }}>

      {/* Navbar */}
      <nav className="navbar" style={{ background: '#1f2937', borderBottom: '1px solid #374151' }}>
        <div className="container-fluid px-4">
          <span className="navbar-brand text-white fw-semibold">
            <i className="fa fa-shield-alt text-warning me-2"></i>Admin
          </span>
          <button onClick={logout} className="btn btn-sm btn-outline-danger">
            <i className="fa fa-sign-out-alt me-1"></i>Sair
          </button>
        </div>
      </nav>

      <div className="container-fluid px-4 py-4">

        {/* Stats */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <StatCard titulo="Total de usuários" valor={stats?.total_usuarios} cor="bg-primary bg-opacity-25 text-primary" icone="fa-users" />
          </div>
          <div className="col-md-3 col-sm-6">
            <StatCard titulo="Usuários ativos" valor={stats?.usuarios_ativos} cor="bg-success bg-opacity-25 text-success" icone="fa-user-check" />
          </div>
          <div className="col-md-3 col-sm-6">
            <StatCard titulo="Usuários inativos" valor={stats?.usuarios_inativos} cor="bg-danger bg-opacity-25 text-danger" icone="fa-user-slash" />
          </div>
          <div className="col-md-3 col-sm-6">
            <StatCard titulo="Total de alunos" valor={stats?.total_alunos} cor="bg-warning bg-opacity-25 text-warning" icone="fa-user-graduate" />
          </div>
        </div>

        {/* Tabs + Busca */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex gap-2">
            <button onClick={() => { setAba('usuarios'); setBusca('') }}
              className={`btn btn-sm ${aba === 'usuarios' ? 'btn-warning' : 'btn-outline-secondary'}`}>
              <i className="fa fa-users me-1"></i>Usuários ({usuarios.length})
            </button>
            <button onClick={() => { setAba('alunos'); setBusca('') }}
              className={`btn btn-sm ${aba === 'alunos' ? 'btn-warning' : 'btn-outline-secondary'}`}>
              <i className="fa fa-user-graduate me-1"></i>Todos os alunos ({alunos.length})
            </button>
          </div>
          <input
            type="text" className="form-control form-control-sm w-auto"
            style={{ background: '#1f2937', color: '#f9fafb', border: '1px solid #374151', minWidth: 220 }}
            placeholder="Buscar..."
            value={busca} onChange={e => setBusca(e.target.value)}
          />
        </div>

        {carregando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning"></div>
          </div>
        ) : (

          /* Tabela de Usuários */
          aba === 'usuarios' ? (
            <div className="card" style={{ borderRadius: 12, border: 'none', background: '#1f2937', overflow: 'hidden' }}>
              <table className="table table-dark table-hover mb-0" style={{ '--bs-table-bg': '#1f2937', '--bs-table-hover-bg': '#374151' }}>
                <thead style={{ background: '#111827' }}>
                  <tr>
                    <th className="text-secondary fw-normal py-3 ps-4">ID</th>
                    <th className="text-secondary fw-normal py-3">Nome</th>
                    <th className="text-secondary fw-normal py-3">E-mail</th>
                    <th className="text-secondary fw-normal py-3">Alunos</th>
                    <th className="text-secondary fw-normal py-3">Status</th>
                    <th className="text-secondary fw-normal py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-secondary py-4">Nenhum usuário encontrado</td></tr>
                  ) : usuariosFiltrados.map(u => (
                    <tr key={u.id}>
                      <td className="ps-4 text-secondary">#{u.id}</td>
                      <td className="fw-medium">{u.nome}</td>
                      <td className="text-secondary">{u.email}</td>
                      <td>
                        <span className="badge bg-primary bg-opacity-25 text-primary">
                          {u.total_alunos} aluno{u.total_alunos !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.ativo ? 'bg-success bg-opacity-25 text-success' : 'bg-danger bg-opacity-25 text-danger'}`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button onClick={() => toggleAtivo(u.id)}
                            className={`btn btn-sm ${u.ativo ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            title={u.ativo ? 'Desativar conta' : 'Ativar conta'}>
                            <i className={`fa ${u.ativo ? 'fa-ban' : 'fa-check'}`}></i>
                            <span className="ms-1 d-none d-md-inline">{u.ativo ? 'Desativar' : 'Ativar'}</span>
                          </button>
                          <button onClick={() => deletarUsuario(u.id, u.nome)}
                            className="btn btn-sm btn-outline-danger" title="Remover usuário">
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          ) : (

            /* Tabela de Alunos */
            <div className="card" style={{ borderRadius: 12, border: 'none', background: '#1f2937', overflow: 'hidden' }}>
              <table className="table table-dark table-hover mb-0" style={{ '--bs-table-bg': '#1f2937', '--bs-table-hover-bg': '#374151' }}>
                <thead style={{ background: '#111827' }}>
                  <tr>
                    <th className="text-secondary fw-normal py-3 ps-4">Foto</th>
                    <th className="text-secondary fw-normal py-3">Aluno</th>
                    <th className="text-secondary fw-normal py-3">Telefone</th>
                    <th className="text-secondary fw-normal py-3">Cadastrado por</th>
                    <th className="text-secondary fw-normal py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosFiltrados.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-secondary py-4">Nenhum aluno encontrado</td></tr>
                  ) : alunosFiltrados.map(a => (
                    <tr key={a.id}>
                      <td className="ps-4">
                        {a.foto
                          ? <img src={`${BASE_URL}${a.foto}`} width={36} height={36}
                              style={{ borderRadius: '50%', objectFit: 'cover' }} alt={a.nome} />
                          : <span className="text-secondary"><i className="fa fa-user-circle fa-2x"></i></span>
                        }
                      </td>
                      <td className="fw-medium">{a.nome}</td>
                      <td className="text-secondary">{a.telefone}</td>
                      <td>
                        <div className="small">{a.usuario_nome}</div>
                        <div className="text-secondary" style={{ fontSize: 11 }}>{a.usuario_email}</div>
                      </td>
                      <td className="text-secondary small">
                        {a.criado_em ? new Date(a.criado_em).toLocaleDateString('pt-BR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
