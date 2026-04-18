import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import { useAlunos } from '../hooks/useAlunos'
import { listarPresencasAluno, registrarPresencaManual } from '../services/presencas'

function formatarData(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function origemBadge(origem) {
  if (origem === 'facial') return 'bg-info text-dark'
  return 'bg-primary'
}

function statusBadge(status) {
  if (status === 'confirmado') return 'bg-success'
  if (status === 'pendente') return 'bg-warning text-dark'
  return 'bg-danger'
}

export default function Presencas() {
  const [searchParams] = useSearchParams()
  const { alunos, carregando } = useAlunos()
  const [alunoId, setAlunoId] = useState(searchParams.get('aluno') || '')
  const [historico, setHistorico] = useState([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const alunoSelecionado = useMemo(
    () => alunos.find(aluno => String(aluno.id) === String(alunoId)),
    [alunos, alunoId],
  )

  async function carregarHistorico(id = alunoId) {
    if (!id) {
      setHistorico([])
      return
    }

    setCarregandoHistorico(true)
    setErro('')
    try {
      const data = await listarPresencasAluno(id)
      setHistorico(data)
    } catch (err) {
      setErro(err.response?.data?.detail || err.response?.data?.erro || 'Nao foi possivel carregar as presencas.')
    } finally {
      setCarregandoHistorico(false)
    }
  }

  useEffect(() => {
    carregarHistorico(alunoId)
  }, [alunoId])

  async function handleRegistrarManual() {
    if (!alunoId) {
      setErro('Selecione um aluno.')
      return
    }

    setRegistrando(true)
    setErro('')
    setSucesso('')
    try {
      await registrarPresencaManual(Number(alunoId))
      setSucesso('Presenca registrada.')
      await carregarHistorico(alunoId)
    } catch (err) {
      setErro(err.response?.data?.detail || err.response?.data?.erro || 'Erro ao registrar presenca.')
    } finally {
      setRegistrando(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="mb-1 fw-semibold">Presencas</h4>
            <span className="text-muted small">Registro manual e historico por aluno</span>
          </div>
          <button
            className="btn btn-outline-primary"
            onClick={() => carregarHistorico()}
            disabled={!alunoId || carregandoHistorico}
          >
            <i className="fa fa-rotate me-1"></i>Atualizar
          </button>
        </div>

        <Toast mensagem={erro} tipo="danger" onClose={() => setErro('')} />
        <Toast mensagem={sucesso} tipo="success" onClose={() => setSucesso('')} />

        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card shadow-sm p-4 h-100" style={{ borderRadius: 12, border: 'none' }}>
              <h6 className="fw-semibold mb-3">
                <i className="fa fa-clipboard-check text-primary me-2"></i>Registro manual
              </h6>

              <div className="mb-3">
                <label className="form-label">Aluno</label>
                <select
                  className="form-select"
                  value={alunoId}
                  onChange={e => setAlunoId(e.target.value)}
                  disabled={carregando}
                >
                  <option value="">Selecione um aluno</option>
                  {alunos.map(aluno => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.nome} - {aluno.numero_inscricao}
                    </option>
                  ))}
                </select>
              </div>

              {alunoSelecionado && (
                <div className="border rounded p-3 mb-3 bg-light">
                  <div className="fw-semibold">{alunoSelecionado.nome}</div>
                  <div className="text-muted small">
                    {alunoSelecionado.numero_inscricao}
                    {alunoSelecionado.turma ? ` / ${alunoSelecionado.turma}` : ''}
                  </div>
                </div>
              )}

              <button
                className="btn btn-success w-100"
                onClick={handleRegistrarManual}
                disabled={!alunoId || registrando}
              >
                {registrando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>Registrando...
                  </>
                ) : (
                  <>
                    <i className="fa fa-check me-1"></i>Registrar presenca
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card shadow-sm p-4" style={{ borderRadius: 12, border: 'none' }}>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h6 className="fw-semibold mb-0">
                  <i className="fa fa-clock-rotate-left text-primary me-2"></i>Historico
                </h6>
                <span className="badge bg-secondary fw-normal">{historico.length}</span>
              </div>

              {!alunoId ? (
                <div className="text-center text-muted py-5">
                  <i className="fa fa-user-check fa-3x mb-3 d-block"></i>
                  Selecione um aluno para ver as presencas.
                </div>
              ) : carregandoHistorico ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="fa fa-calendar-xmark fa-3x mb-3 d-block"></i>
                  Nenhuma presenca registrada.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Data</th>
                        <th>Origem</th>
                        <th>Status</th>
                        <th>Confianca</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historico.map(presenca => (
                        <tr key={presenca.id}>
                          <td>{formatarData(presenca.timestamp)}</td>
                          <td>
                            <span className={`badge ${origemBadge(presenca.origem)}`}>
                              {presenca.origem}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${statusBadge(presenca.status)}`}>
                              {presenca.status}
                            </span>
                          </td>
                          <td>
                            {typeof presenca.confianca === 'number'
                              ? `${Math.round(presenca.confianca * 100)}%`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
