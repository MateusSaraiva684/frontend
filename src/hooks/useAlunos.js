import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from '../services/AuthContext'

export function useAlunos({ turma = '', busca = '' } = {}) {
  const { usuario } = useAuth()
  const [alunos, setAlunos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const params = {}
      if (turma) params.turma = turma
      if (busca.trim()) params.busca = busca.trim()

      const endpoint = usuario?.is_superuser
        ? '/api/admin/alunos'
        : '/api/alunos/'

      const { data } = await api.get(endpoint, { params })
      setAlunos(data.data ?? (Array.isArray(data) ? data : []))
    } catch {
      setErro('Não foi possível carregar os alunos.')
    } finally {
      setCarregando(false)
    }
  }, [turma, busca, usuario])

  useEffect(() => { carregar() }, [carregar])

  const deletar = useCallback(async (id) => {
    await api.delete(`/api/alunos/${id}`)
    setAlunos(prev => prev.filter(a => a.id !== id))
  }, [])

  return { alunos, carregando, erro, recarregar: carregar, deletar }
}