import { useState, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'
import api, { resolveMediaUrl } from '../services/api'
import Navbar from '../components/Navbar'

// ── Componentes de apoio ──────────────────────────────────────────────────────

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

// Modal genérico
function Modal({ titulo, onClose, children }) {
  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content" style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 14 }}>
          <div className="modal-header" style={{ borderBottom: '1px solid #374151' }}>
            <h6 className="modal-title text-white mb-0">{titulo}</h6>
            <button onClick={onClose} className="btn-close btn-close-white"></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminPanel() {
  const { usuario } = useAuth()
  const [aba, setAba] = useState('usuarios')
  const [stats, setStats] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [alunos, setAlunos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [toast, setToast] = useState(null)

  // Modais
  const [modalEditar, setModalEditar] = useState(null)    // usuário sendo editado
  const [modalSenha, setModalSenha] = useState(null)      // usuário para redefinir senha
  const [modalAlunos, setModalAlunos] = useState(null)    // usuário cujos alunos estão sendo vistos

  // Formulários
  const [formEditar, setFormEditar] = useState({ nome: '', email: '' })
  const [formSenha, setFormSenha] = useState('')
  const [salvando, setSalvando] = useState(false)

  function mostrarToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  async function carregar() {
    setCarregando(true)
    try {
      const [s, u, a] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/usuarios'),
        api.get('/api/admin/alunos'),
      ])
      setStats(s.data)
      setUsuarios(u.data)
      setAlunos(a.data)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  // ── Ações de usuário ────────────────────────────────────────────────────────

  function abrirEditar(u) {
    setFormEditar({ nome: u.nome, email: u.email })
    setModalEditar(u)
  }

  async function salvarEdicao() {
    if (!formEditar.nome.trim() || !formEditar.email.trim()) return
    setSalvando(true)
    try {
      const { data } = await api.patch(`/api/admin/usuarios/${modalEditar.id}`, formEditar)
      setUsuarios(prev => prev.map(u => u.id === modalEditar.id
        ? { ...u, nome: data.nome, email: data.email } : u))
      setModalEditar(null)
      mostrarToast('Usuário atualizado com sucesso')
    } catch (err) {
      mostrarToast(err.response?.data?.erro || 'Erro ao salvar', 'danger')
    } finally {
      setSalvando(false)
    }
  }

  function abrirSenha(u) {
    setFormSenha('')
    setModalSenha(u)
  }

  async function salvarSenha() {
    if (formSenha.length < 6) {
      mostrarToast('Senha deve ter no mínimo 6 caracteres', 'danger')
      return
    }
    setSalvando(true)
    try {
      await api.patch(`/api/admin/usuarios/${modalSenha.id}/senha`, { nova_senha: formSenha })
      setModalSenha(null)
      mostrarToast('Senha redefinida com sucesso')
    } catch (err) {
      mostrarToast(err.response?.data?.erro || 'Erro ao redefinir senha', 'danger')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo(id) {
    const { data } = await api.patch(`/api/admin/usuarios/${id}/ativo`)
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo: data.ativo } : u))
    mostrarToast(`Usuário ${data.ativo ? 'ativado' : 'desativado'}`)
  }

  async function deletarUsuario(id, nome) {
    if (!confirm(`Remover permanentemente o usuário "${nome}" e todos os seus alunos?`)) return
    await api.delete(`/api/admin/usuarios/${id}`)
    setUsuarios(prev => prev.filter(u => u.id !== id))
    setAlunos(prev => prev.filter(a => a.user_id !== id))
    const { data } = await api.get('/api/admin/stats')
    setStats(data)
    mostrarToast('Usuário removido')
  }

  // ── Ações de aluno ──────────────────────────────────────────────────────────

  async function deletarAluno(id, nome) {
    if (!confirm(`Remover o aluno "${nome}"?`)) return
    await api.delete(`/api/admin/alunos/${id}`)
    setAlunos(prev => prev.filter(a => a.id !== id))
    if (modalAlunos) setModalAlunos(prev => ({ ...prev, lista: prev.lista.filter(a => a.id !== id) }))
    const { data } = await api.get('/api/admin/stats')
    setStats(data)
    mostrarToast('Aluno removido')
  }

  function verAlunosDoUsuario(u) {
    const lista = alunos.filter(a => a.user_id === u.id)
    setModalAlunos({ usuario: u, lista })
  }

  // ── Filtros ─────────────────────────────────────────────────────────────────

  const usuariosFiltrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase())
  )

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (a.numero_inscricao || '').toLowerCase().includes(busca.toLowerCase()) ||
    (a.usuario_nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (a.usuario_email || '').toLowerCase().includes(busca.toLowerCase())
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#111827', color: '#f9fafb' }}>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <div className={`alert alert-${toast.tipo} py-2 px-3 mb-0 shadow`} style={{ borderRadius: 10 }}>
            {toast.msg}
          </div>
        </div>
      )}

      <div className="container-fluid px-4 py-4">

        {/* Cabeçalho */}
        <div className="d-flex align-items-center gap-2 mb-4">
          <i className="fa fa-shield-alt text-warning fs-4"></i>
          <div>
            <h5 className="mb-0 text-white fw-semibold">Painel Administrativo</h5>
            <small className="text-secondary">Logado como {usuario?.nome}</small>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <StatCard titulo="Total de usuários" valor={stats?.total_usuarios}
              cor="bg-primary bg-opacity-25 text-primary" icone="fa-users" />
          </div>
          <div className="col-md-3 col-sm-6">
            <StatCard titulo="Usuários ativos" valor={stats?.usuarios_ativos}
              cor="bg-success bg-opacity-25 text-success" icone="fa-user-check" />
          </div>
          <div className="col-md-3 col-sm-6">
            <StatCard titulo="Usuários inativos" valor={stats?.usuarios_inativos}
              cor="bg-danger bg-opacity-25 text-danger" icone="fa-user-slash" />
          </div>
          <div className="col-md-3 col-sm-6">
            <StatCard titulo="Total de alunos" valor={stats?.total_alunos}
              cor="bg-warning bg-opacity-25 text-warning" icone="fa-user-graduate" />
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
            placeholder={aba === 'usuarios' ? 'Buscar por nome ou e-mail...' : 'Buscar por aluno, inscricao ou escola...'}
            value={busca} onChange={e => setBusca(e.target.value)}
          />
        </div>

        {carregando ? (
          <div className="text-center py-5"><div className="spinner-border text-warning"></div></div>
        ) : aba === 'usuarios' ? (

          /* ── Tabela de Usuários ── */
          <div className="card" style={{ borderRadius: 12, border: 'none', background: '#1f2937', overflow: 'hidden' }}>
            <table className="table table-dark table-hover mb-0"
              style={{ '--bs-table-bg': '#1f2937', '--bs-table-hover-bg': '#374151' }}>
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
                    <td className="fw-medium">
                      {u.nome}
                      {u.is_superuser && (
                        <span className="badge bg-warning text-dark ms-2" style={{ fontSize: 10 }}>
                          <i className="fa fa-shield-alt me-1"></i>Admin
                        </span>
                      )}
                    </td>
                    <td className="text-secondary">{u.email}</td>
                    <td>
                      <button
                        className="btn btn-link btn-sm p-0 text-primary text-decoration-none"
                        onClick={() => verAlunosDoUsuario(u)}
                        title="Ver alunos desta escola">
                        <i className="fa fa-user-graduate me-1"></i>
                        {u.total_alunos} aluno{u.total_alunos !== 1 ? 's' : ''}
                      </button>
                    </td>
                    <td>
                      <span className={`badge ${u.ativo ? 'bg-success bg-opacity-25 text-success' : 'bg-danger bg-opacity-25 text-danger'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      {u.is_superuser ? (
                        <span className="text-secondary small">—</span>
                      ) : (
                        <div className="d-flex gap-1 flex-wrap">
                          <button onClick={() => abrirEditar(u)}
                            className="btn btn-sm btn-outline-info" title="Editar nome/e-mail">
                            <i className="fa fa-pen"></i>
                          </button>
                          <button onClick={() => abrirSenha(u)}
                            className="btn btn-sm btn-outline-secondary" title="Redefinir senha">
                            <i className="fa fa-key"></i>
                          </button>
                          <button onClick={() => toggleAtivo(u.id)}
                            className={`btn btn-sm ${u.ativo ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            title={u.ativo ? 'Desativar conta' : 'Ativar conta'}>
                            <i className={`fa ${u.ativo ? 'fa-ban' : 'fa-check'}`}></i>
                          </button>
                          <button onClick={() => deletarUsuario(u.id, u.nome)}
                            className="btn btn-sm btn-outline-danger" title="Remover usuário">
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        ) : (

          /* ── Tabela de Alunos ── */
          <div className="card" style={{ borderRadius: 12, border: 'none', background: '#1f2937', overflow: 'hidden' }}>
            <table className="table table-dark table-hover mb-0"
              style={{ '--bs-table-bg': '#1f2937', '--bs-table-hover-bg': '#374151' }}>
              <thead style={{ background: '#111827' }}>
                <tr>
                  <th className="text-secondary fw-normal py-3 ps-4">Foto</th>
                  <th className="text-secondary fw-normal py-3">Aluno</th>
                  <th className="text-secondary fw-normal py-3">Inscricao</th>
                  <th className="text-secondary fw-normal py-3">Telefone</th>
                  <th className="text-secondary fw-normal py-3">Escola / Usuário</th>
                  <th className="text-secondary fw-normal py-3">Data</th>
                  <th className="text-secondary fw-normal py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-secondary py-4">Nenhum aluno encontrado</td></tr>
                ) : alunosFiltrados.map(a => (
                  <tr key={a.id}>
                    <td className="ps-4">
                      {a.foto
                        ? <img src={resolveMediaUrl(a.foto)} width={36} height={36}
                            style={{ borderRadius: '50%', objectFit: 'cover' }} alt={a.nome} />
                        : <span className="text-secondary"><i className="fa fa-user-circle fa-2x"></i></span>
                      }
                    </td>
                    <td className="fw-medium">{a.nome}</td>
                    <td className="text-secondary">{a.numero_inscricao}</td>
                    <td className="text-secondary">{a.telefone}</td>
                    <td>
                      <div className="small">{a.usuario_nome}</div>
                      <div className="text-secondary" style={{ fontSize: 11 }}>{a.usuario_email}</div>
                    </td>
                    <td className="text-secondary small">
                      {a.criado_em ? new Date(a.criado_em).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <button onClick={() => deletarAluno(a.id, a.nome)}
                        className="btn btn-sm btn-outline-danger" title="Remover aluno">
                        <i className="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Editar usuário ── */}
      {modalEditar && (
        <Modal titulo={`Editar — ${modalEditar.nome}`} onClose={() => setModalEditar(null)}>
          <div className="mb-3">
            <label className="form-label text-secondary small">Nome</label>
            <input
              className="form-control bg-dark text-white border-secondary"
              value={formEditar.nome}
              onChange={e => setFormEditar(f => ({ ...f, nome: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="form-label text-secondary small">E-mail</label>
            <input
              type="email"
              className="form-control bg-dark text-white border-secondary"
              value={formEditar.email}
              onChange={e => setFormEditar(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="d-flex gap-2 justify-content-end">
            <button onClick={() => setModalEditar(null)} className="btn btn-outline-secondary btn-sm">
              Cancelar
            </button>
            <button onClick={salvarEdicao} className="btn btn-info btn-sm" disabled={salvando}>
              {salvando ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fa fa-save me-1"></i>}
              Salvar
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Redefinir senha ── */}
      {modalSenha && (
        <Modal titulo={`Redefinir senha — ${modalSenha.nome}`} onClose={() => setModalSenha(null)}>
          <p className="text-secondary small mb-3">
            A nova senha será aplicada imediatamente. O usuário precisará usar essa senha no próximo login.
          </p>
          <div className="mb-4">
            <label className="form-label text-secondary small">Nova senha</label>
            <input
              type="password"
              className="form-control bg-dark text-white border-secondary"
              placeholder="Mínimo 6 caracteres"
              value={formSenha}
              onChange={e => setFormSenha(e.target.value)}
              autoFocus
            />
          </div>
          <div className="d-flex gap-2 justify-content-end">
            <button onClick={() => setModalSenha(null)} className="btn btn-outline-secondary btn-sm">
              Cancelar
            </button>
            <button onClick={salvarSenha} className="btn btn-warning btn-sm" disabled={salvando}>
              {salvando ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fa fa-key me-1"></i>}
              Redefinir
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Alunos de um usuário ── */}
      {modalAlunos && (
        <Modal titulo={`Alunos de ${modalAlunos.usuario.nome}`} onClose={() => setModalAlunos(null)}>
          {modalAlunos.lista.length === 0 ? (
            <p className="text-secondary text-center py-3 mb-0">Nenhum aluno cadastrado.</p>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {modalAlunos.lista.map(a => (
                <div key={a.id} className="d-flex align-items-center justify-content-between py-2"
                  style={{ borderBottom: '1px solid #374151' }}>
                  <div className="d-flex align-items-center gap-3">
                    {a.foto
                      ? <img src={resolveMediaUrl(a.foto)} width={40} height={40}
                          style={{ borderRadius: '50%', objectFit: 'cover' }} alt={a.nome} />
                      : <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                          style={{ width: 40, height: 40 }}>
                          <i className="fa fa-user text-white"></i>
                        </div>
                    }
                    <div>
                      <div className="text-white small fw-medium">{a.nome}</div>
                      <div className="text-info" style={{ fontSize: 12 }}>{a.numero_inscricao}</div>
                      <div className="text-secondary" style={{ fontSize: 12 }}>{a.telefone}</div>
                    </div>
                  </div>
                  <button onClick={() => deletarAluno(a.id, a.nome)}
                    className="btn btn-sm btn-outline-danger" title="Remover aluno">
                    <i className="fa fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="text-end mt-3">
            <button onClick={() => setModalAlunos(null)} className="btn btn-outline-secondary btn-sm">
              Fechar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
