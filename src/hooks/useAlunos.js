import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useAlunos() {
  const [alunos, setAlunos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const { data } = await api.get('/api/alunos/')
      setAlunos(data)
    } catch {
      setErro('Não foi possível carregar os alunos.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const deletar = useCallback(async (id) => {
    await api.delete(`/api/alunos/${id}`)
    setAlunos(prev => prev.filter(a => a.id !== id))
  }, [])

  return { alunos, carregando, erro, carregar, deletar }
}
