import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import { useAlunos } from '../hooks/useAlunos'
import { resolveMediaUrl } from '../services/api'
import api from '../services/api'

export default function Alunos() {
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [busca, setBusca] = useState('')
  const [turmas, setTurmas] = useState([])
  const [erroAcao, setErroAcao] = useState('')

  const { alunos, carregando, erro, deletar, recarregar } = useAlunos({
    turma: turmaSelecionada,
    busca,
  })

  // Carrega lista de turmas disponíveis
  useEffect(() => {
    api.get('/api/alunos/turmas')
      .then(({ data }) => setTurmas(data))
      .catch(() => {})
  }, [alunos]) // atualiza quando alunos mudam (nova turma cadastrada)

  async function handleDeletar(id, nome) {
    if (!confirm(`Remover ${nome}?`)) return
    try {
      await deletar(id)
    } catch {
      setErroAcao('Erro ao remover aluno. Tente novamente.')
    }
  }

  function limparFiltros() {
    setTurmaSelecionada('')
    setBusca('')
  }

  const temFiltro = turmaSelecionada || busca

  return (
    <>
      <Navbar />
      <div className="container mt-4">

        {/* Cabeçalho */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h4 className="mb-0 fw-semibold">
            Alunos{' '}
            <span className="badge bg-secondary fw-normal">{alunos.length}</span>
            {turmaSelecionada && (
              <span className="badge bg-primary fw-normal ms-2">{turmaSelecionada}</span>
            )}
          </h4>
          <Link to="/alunos/novo" className="btn btn-primary">
            <i className="fa fa-plus me-1"></i>Novo aluno
          </Link>
        </div>

        {/* Filtros */}
        <div className="card shadow-sm p-3 mb-4" style={{ borderRadius: 12, border: 'none' }}>
          <div className="row g-2 align-items-end">

            {/* Busca por nome ou inscrição */}
            <div className="col-md-5">
              <label className="form-label small text-muted mb-1">Buscar</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="fa fa-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Nome ou número de inscrição..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
            </div>

            {/* Filtro por turma */}
            <div className="col-md-4">
              <label className="form-label small text-muted mb-1">Turma</label>
              <select
                className="form-select"
                value={turmaSelecionada}
                onChange={e => setTurmaSelecionada(e.target.value)}
              >
                <option value="">Todas as turmas</option>
                {turmas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Limpar filtros */}
            <div className="col-md-3">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={limparFiltros}
                disabled={!temFiltro}
              >
                <i className="fa fa-times me-1"></i>Limpar filtros
              </button>
            </div>
          </div>
        </div>

        <Toast mensagem={erro} tipo="danger" onClose={() => {}} />
        <Toast mensagem={erroAcao} tipo="danger" onClose={() => setErroAcao('')} />

        {carregando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
            <p className="text-muted mt-2">Carregando...</p>
          </div>
        ) : alunos.length === 0 && !erro ? (
          <div className="text-center py-5">
            <i className="fa fa-user-graduate fa-4x text-muted mb-3 d-block"></i>
            {temFiltro ? (
              <>
                <h5 className="text-muted">Nenhum aluno encontrado com esses filtros</h5>
                <button onClick={limparFiltros} className="btn btn-outline-secondary mt-3">
                  <i className="fa fa-times me-1"></i>Limpar filtros
                </button>
              </>
            ) : (
              <>
                <h5 className="text-muted">Nenhum aluno cadastrado ainda</h5>
                <Link to="/alunos/novo" className="btn btn-primary mt-3">
                  <i className="fa fa-plus me-1"></i>Cadastrar primeiro aluno
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="row g-3">
            {alunos.map(aluno => (
              <div key={aluno.id} className="col-xl-3 col-md-4 col-sm-6">
                <div className="card shadow-sm h-100" style={{ borderRadius: 12, border: 'none' }}>
                  {aluno.foto ? (
                    <img src={resolveMediaUrl(aluno.foto)} className="card-img-top"
                      style={{ height: 180, objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                      alt={aluno.nome} />
                  ) : (
                    <div style={{
                      height: 180, background: '#f3f4f6', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      borderRadius: '12px 12px 0 0', fontSize: 56, color: '#d1d5db'
                    }}>
                      <i className="fa fa-user"></i>
                    </div>
                  )}
                  <div className="card-body">
                    <h6 className="card-title fw-semibold mb-1">{aluno.nome}</h6>
                    <p className="small text-primary fw-semibold mb-1">
                      Inscrição: {aluno.numero_inscricao}
                    </p>
                    {aluno.turma && (
                      <p className="mb-1">
                        <span className="badge bg-light text-dark border" style={{ fontSize: 11 }}>
                          <i className="fa fa-layer-group me-1 text-muted"></i>{aluno.turma}
                        </span>
                      </p>
                    )}
                    <p className="text-muted small mb-3">
                      <i className="fa fa-phone me-1"></i>{aluno.telefone}
                    </p>
                    <div className="d-flex gap-2">
                      <Link to={`/alunos/editar/${aluno.id}`}
                        className="btn btn-warning btn-sm flex-fill">
                        <i className="fa fa-edit me-1"></i>Editar
                      </Link>
                      <button onClick={() => handleDeletar(aluno.id, aluno.nome)}
                        className="btn btn-danger btn-sm flex-fill">
                        <i className="fa fa-trash me-1"></i>Remover
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
