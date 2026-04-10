import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import { useAlunos } from '../hooks/useAlunos'
import { resolveMediaUrl } from '../services/api'

export default function Alunos() {
  const { alunos, carregando, erro, deletar } = useAlunos()
  const [erroAcao, setErroAcao] = useState('')

  async function handleDeletar(id, nome) {
    if (!confirm(`Remover ${nome}?`)) return
    try {
      await deletar(id)
    } catch {
      setErroAcao('Erro ao remover aluno. Tente novamente.')
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0 fw-semibold">
            Alunos <span className="badge bg-secondary fw-normal">{alunos.length}</span>
          </h4>
          <Link to="/alunos/novo" className="btn btn-primary">
            <i className="fa fa-plus me-1"></i>Novo aluno
          </Link>
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
            <h5 className="text-muted">Nenhum aluno cadastrado ainda</h5>
            <Link to="/alunos/novo" className="btn btn-primary mt-3">
              <i className="fa fa-plus me-1"></i>Cadastrar primeiro aluno
            </Link>
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
                    <p className="small text-primary fw-semibold mb-2">
                      Inscricao: {aluno.numero_inscricao}
                    </p>
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
