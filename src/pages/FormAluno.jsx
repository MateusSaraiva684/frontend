import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api, { resolveMediaUrl } from '../services/api'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import { useAuth } from '../services/AuthContext'
import {
  formatarTamanho,
  getExternalIdReconhecimento,
  getSchoolIdReconhecimento,
  getStatusReconhecimentoAluno,
  validarArquivoImagem,
} from '../services/reconhecimento'

export default function FormAluno() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const editando = Boolean(id)

  const [nome, setNome] = useState('')
  const [numeroInscricao, setNumeroInscricao] = useState('')
  const [telefone, setTelefone] = useState('')
  const [turma, setTurma] = useState('')
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fotoAtual, setFotoAtual] = useState(null)
  const [alunoAtual, setAlunoAtual] = useState(null)
  const [turmasExistentes, setTurmasExistentes] = useState([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [buscando, setBuscando] = useState(editando)

  useEffect(() => {
    api.get('/api/alunos/turmas')
      .then(({ data }) => setTurmasExistentes(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!editando) return
    api.get(`/api/alunos/${id}`)
      .then(({ data }) => {
        setAlunoAtual(data)
        setNome(data.nome)
        setNumeroInscricao(data.numero_inscricao)
        setTelefone(data.telefone)
        setTurma(data.turma || '')
        setFotoAtual(data.foto)
      })
      .catch(() => setErro('Aluno nao encontrado'))
      .finally(() => setBuscando(false))
  }, [id, editando])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleFoto(e) {
    const arquivo = e.target.files?.[0]
    setErro('')

    if (!arquivo) {
      setFoto(null)
      setPreview(null)
      return
    }

    const erroValidacao = validarArquivoImagem(arquivo)
    if (erroValidacao) {
      setFoto(null)
      setPreview(null)
      e.target.value = ''
      setErro(erroValidacao)
      return
    }

    setFoto(arquivo)
    setPreview(URL.createObjectURL(arquivo))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const formData = new FormData()
    formData.append('nome', nome.trim())
    formData.append('numero_inscricao', numeroInscricao.trim())
    formData.append('telefone', telefone.trim())
    formData.append('turma', turma.trim())
    if (foto) formData.append('foto', foto)

    try {
      if (editando) {
        await api.put(`/api/alunos/${id}`, formData)
      } else {
        await api.post('/api/alunos/', formData)
      }
      navigate('/alunos')
    } catch (err) {
      setErro(err.response?.data?.detail || err.response?.data?.erro || 'Erro ao salvar')
    } finally {
      setCarregando(false)
    }
  }

  if (buscando) return (
    <>
      <Navbar />
      <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
    </>
  )

  const alunoParaStatus = alunoAtual || { foto: foto ? 'preview' : null, user_id: usuario?.id }
  const fotoExibida = preview || resolveMediaUrl(fotoAtual)
  const statusReconhecimento = getStatusReconhecimentoAluno(alunoParaStatus, usuario)
  const schoolId = getSchoolIdReconhecimento(alunoParaStatus, usuario)
  const externalId = getExternalIdReconhecimento(alunoAtual)

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center g-3">
          <div className="col-lg-7">
            <div className="card shadow-sm p-4" style={{ borderRadius: 14, border: 'none' }}>
              <h4 className="text-center mb-4 fw-semibold">
                <i className={`fa ${editando ? 'fa-user-edit text-warning' : 'fa-user-plus text-primary'} me-2`}></i>
                {editando ? 'Editar aluno' : 'Novo aluno'}
              </h4>

              <Toast mensagem={erro} tipo="danger" onClose={() => setErro('')} />

              {fotoExibida && (
                <div className="text-center mb-3">
                  <img src={fotoExibida}
                    style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb' }}
                    alt="Previa da foto do aluno" />
                  {foto && <div className="text-muted small mt-1">{foto.name} - {formatarTamanho(foto.size)}</div>}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nome <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" required value={nome}
                    onChange={e => setNome(e.target.value)} />
                </div>

                <div className="mb-3">
                  <label className="form-label">Numero de inscricao <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" required value={numeroInscricao}
                    onChange={e => setNumeroInscricao(e.target.value)} />
                </div>

                <div className="mb-3">
                  <label className="form-label">Turma</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 3o Ano A, Turma 5..."
                    value={turma}
                    onChange={e => setTurma(e.target.value)}
                    list="turmas-sugestoes"
                  />
                  <datalist id="turmas-sugestoes">
                    {turmasExistentes.map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  <small className="text-muted">Opcional. Digite ou escolha uma turma existente.</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Telefone <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" required value={telefone}
                    onChange={e => setTelefone(e.target.value)} />
                </div>

                <div className="mb-4">
                  <label className="form-label">
                    {editando ? 'Nova foto' : 'Foto'}
                    <small className="text-muted ms-1">(JPEG/PNG/WEBP, max. 5MB)</small>
                  </label>
                  <input type="file" className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFoto} />
                  <div className="form-text">
                    Para reconhecimento: rosto de frente, boa iluminacao, sem oculos escuros e sem imagem borrada.
                  </div>
                </div>

                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <Link to="/alunos" className="btn btn-secondary">
                    <i className="fa fa-arrow-left me-1"></i>Voltar
                  </Link>
                  <button type="submit" disabled={carregando}
                    className={`btn ${editando ? 'btn-warning' : 'btn-success'}`}>
                    {carregando
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</>
                      : <><i className="fa fa-save me-1"></i>{editando ? 'Atualizar' : 'Salvar'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm p-4 h-100" style={{ borderRadius: 14, border: 'none' }}>
              <h6 className="fw-semibold mb-3">
                <i className="fa fa-camera text-primary me-2"></i>Reconhecimento facial
              </h6>

              <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <div className="text-muted small">Status de sincronizacao</div>
                  <div className="fw-semibold">{statusReconhecimento.label}</div>
                </div>
                <span className={`badge ${statusReconhecimento.badge}`}>{statusReconhecimento.label}</span>
              </div>

              <div className="border rounded p-3 mb-3 bg-light">
                <div className="mb-2">
                  <div className="text-muted small">external_id</div>
                  <div className="fw-semibold text-break">{externalId || 'Nao exposto pelo backend'}</div>
                </div>
                <div>
                  <div className="text-muted small">school_id usado</div>
                  <div className="fw-semibold text-break">{schoolId || 'Nao disponivel'}</div>
                </div>
              </div>

              <p className="small text-muted mb-3">{statusReconhecimento.detail}</p>

              <button
                type="button"
                className="btn btn-outline-primary w-100"
                disabled
                title="Nao ha endpoint SaaS confirmado para disparar sync manual de reconhecimento facial."
              >
                <i className="fa fa-rotate me-1"></i>Sincronizar reconhecimento facial
              </button>
              <div className="form-text">
                O cadastro atual pode acionar sync automatico no backend, mas o frontend nao tem contrato para disparo manual.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
