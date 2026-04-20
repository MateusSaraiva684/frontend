import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useAlunos({ turma = '', busca = '' } = {}) {
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
      const { data } = await api.get('/api/alunos/', { params })
      // Extrai alunos da resposta paginada: { data: [...], paginacao: {...} }
      setAlunos(data.data || data)
    } catch {
      setErro('Não foi possível carregar os alunos.')
    } finally {
      setCarregando(false)
    }
  }, [turma, busca])

  useEffect(() => { carregar() }, [carregar])

  const deletar = useCallback(async (id) => {
    await api.delete(`/api/alunos/${id}`)
    setAlunos(prev => prev.filter(a => a.id !== id))
  }, [])

  return { alunos, carregando, erro, recarregar: carregar, deletar }
}
