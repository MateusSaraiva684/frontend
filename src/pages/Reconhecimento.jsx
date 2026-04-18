import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import { useAlunos } from '../hooks/useAlunos'
import { enviarReconhecimentoFacial } from '../services/presencas'

function formatarData(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function Reconhecimento() {
  const { alunos } = useAlunos()
  const [arquivo, setArquivo] = useState(null)
  const [preview, setPreview] = useState('')
  const [imagemBase64, setImagemBase64] = useState('')
  const [resultado, setResultado] = useState(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  const alunoReconhecido = useMemo(() => {
    if (!resultado?.aluno_id) return null
    return alunos.find(aluno => aluno.id === resultado.aluno_id)
  }, [alunos, resultado])

  // Cleanup de URL do preview quando desmontar
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [])

  function handleArquivo(e) {
    const selecionado = e.target.files?.[0]
    setArquivo(selecionado || null)
    setResultado(null)
    setErro('')

    // Revogar URL anterior
    if (preview) URL.revokeObjectURL(preview)
    setPreview(selecionado ? URL.createObjectURL(selecionado) : '')
  }

  async function handleEnviar(e) {
    e.preventDefault()
    if (!arquivo && !imagemBase64.trim()) {
      setErro('Envie uma imagem.')
      return
    }

    setProcessando(true)
    setErro('')
    setResultado(null)
    try {
      const data = await enviarReconhecimentoFacial({
        arquivo,
        imagemBase64: imagemBase64.trim() || null,
      })
      setResultado(data)
    } catch (err) {
      setErro(err.response?.data?.detail || err.response?.data?.erro || 'Nao foi possivel processar a imagem.')
    } finally {
      setProcessando(false)
    }
  }

  function limpar() {
    if (preview) URL.revokeObjectURL(preview)
    setArquivo(null)
    setPreview('')
    setImagemBase64('')
    setResultado(null)
    setErro('')
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="mb-1 fw-semibold">Reconhecimento facial</h4>
            <span className="text-muted small">Envio de imagem para o servico externo</span>
          </div>
          <button className="btn btn-outline-secondary" onClick={limpar}>
            <i className="fa fa-eraser me-1"></i>Limpar
          </button>
        </div>

        <Toast mensagem={erro} tipo="danger" onClose={() => setErro('')} />

        <div className="row g-3">
          <div className="col-lg-5">
            <div className="card shadow-sm p-4 h-100" style={{ borderRadius: 12, border: 'none' }}>
              <h6 className="fw-semibold mb-3">
                <i className="fa fa-camera text-primary me-2"></i>Imagem
              </h6>

              <form onSubmit={handleEnviar}>
                <div className="mb-3">
                  <label className="form-label">Arquivo</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleArquivo}
                  />
                </div>

                {preview && (
                  <div className="mb-3">
                    <img
                      src={preview}
                      alt="Previa"
                      className="w-100"
                      style={{ maxHeight: 280, objectFit: 'cover', borderRadius: 10 }}
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Base64</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={imagemBase64}
                    onChange={e => setImagemBase64(e.target.value)}
                    placeholder="Opcional se um arquivo foi escolhido"
                    disabled={Boolean(arquivo)}
                  />
                </div>

                <button className="btn btn-primary w-100" disabled={processando}>
                  {processando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>Processando...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-wand-magic-sparkles me-1"></i>Enviar para reconhecimento
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card shadow-sm p-4 h-100" style={{ borderRadius: 12, border: 'none' }}>
              <h6 className="fw-semibold mb-3">
                <i className="fa fa-id-badge text-primary me-2"></i>Resultado
              </h6>

              {!resultado ? (
                <div className="text-center text-muted py-5">
                  <i className="fa fa-face-smile fa-4x mb-3 d-block"></i>
                  Aguardando envio de imagem.
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="border rounded p-3 h-100">
                      <div className="text-muted small mb-1">Aluno</div>
                      <div className="fw-semibold">
                        {alunoReconhecido?.nome || `ID ${resultado.aluno_id}`}
                      </div>
                      {alunoReconhecido && (
                        <div className="text-muted small">
                          {alunoReconhecido.numero_inscricao}
                          {alunoReconhecido.turma ? ` / ${alunoReconhecido.turma}` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="border rounded p-3 h-100">
                      <div className="text-muted small mb-1">Confianca</div>
                      <div className="fs-3 fw-semibold text-success">
                        {Math.round(resultado.confianca * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="border rounded p-3">
                      <div className="d-flex justify-content-between flex-wrap gap-2">
                        <div>
                          <div className="text-muted small mb-1">Presenca</div>
                          <div className="fw-semibold">
                            {formatarData(resultado.presenca?.timestamp)}
                          </div>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                          <span className="badge bg-info text-dark">facial</span>
                          <span className="badge bg-success">
                            {resultado.presenca?.status || 'confirmado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
