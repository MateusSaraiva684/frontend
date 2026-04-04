import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api, { BASE_URL } from '../services/api'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'

export default function FormAluno() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editando = Boolean(id)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fotoAtual, setFotoAtual] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [buscando, setBuscando] = useState(editando)

  useEffect(() => {
    if (!editando) return
    api.get(`/api/alunos/${id}`)
      .then(({ data }) => {
        setNome(data.nome)
        setTelefone(data.telefone)
        setFotoAtual(data.foto)
      })
      .catch(() => setErro('Aluno não encontrado'))
      .finally(() => setBuscando(false))
  }, [id, editando])

  function handleFoto(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setFoto(arquivo)
    setPreview(URL.createObjectURL(arquivo))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const formData = new FormData()
    formData.append('nome', nome)
    formData.append('telefone', telefone)
    if (foto) formData.append('foto', foto)

    try {
      if (editando) {
        await api.put(`/api/alunos/${id}`, formData)
      } else {
        await api.post('/api/alunos/', formData)
      }
      navigate('/alunos')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar')
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

  const fotoExibida = preview || (fotoAtual ? `${BASE_URL}${fotoAtual}` : null)

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-sm p-4" style={{ borderRadius: 14, border: 'none' }}>
              <h4 className="text-center mb-4 fw-semibold">
                <i className={`fa ${editando ? 'fa-user-edit text-warning' : 'fa-user-plus text-primary'} me-2`}></i>
                {editando ? 'Editar Aluno' : 'Novo Aluno'}
              </h4>

              <Toast mensagem={erro} tipo="danger" onClose={() => setErro('')} />

              {fotoExibida && (
                <div className="text-center mb-3">
                  <img src={fotoExibida}
                    style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb' }}
                    alt="Foto" />
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nome <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" required value={nome}
                    onChange={e => setNome(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Telefone <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" required value={telefone}
                    onChange={e => setTelefone(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="form-label">
                    {editando ? 'Nova foto' : 'Foto'}
                    <small className="text-muted ms-1">(JPEG/PNG/WEBP, máx. 5MB)</small>
                  </label>
                  <input type="file" className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFoto} />
                </div>
                <div className="d-flex justify-content-between">
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
        </div>
      </div>
    </>
  )
}
