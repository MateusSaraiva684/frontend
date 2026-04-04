import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // envia cookies em TODAS as requisições (necessário para cross-origin)
})

// ── Injeta access token em todas as requisições ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Renovação automática do access token ao expirar ──────────────────────────
let renovando = false
let filaEspera = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isAuthRota = original?.url?.includes('/api/auth/')

    if (error.response?.status === 401 && !isAuthRota && !original._retry) {
      original._retry = true

      if (renovando) {
        return new Promise((resolve, reject) => {
          filaEspera.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      renovando = true

      try {
        // withCredentials já está no default da instância, mas reforçamos aqui
        const resp = await api.post('/api/auth/refresh')
        const novoToken = resp.data.access_token
        localStorage.setItem('access_token', novoToken)

        filaEspera.forEach(({ resolve }) => resolve(novoToken))
        filaEspera = []

        original.headers.Authorization = `Bearer ${novoToken}`
        return api(original)
      } catch {
        filaEspera.forEach(({ reject }) => reject(error))
        filaEspera = []
        localStorage.removeItem('access_token')
        localStorage.removeItem('usuario')
        window.location.href = '/'
        return Promise.reject(error)
      } finally {
        renovando = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
export { BASE_URL }
