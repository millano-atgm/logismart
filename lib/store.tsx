'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  CONSUMO_MEDIO_FROTA,
  estadoInicial,
  type DemoState,
  type Vehicle,
} from '@/lib/data'

interface DemoContextValue extends DemoState {
  resolverAlerta: (id: string) => void
  restaurarDemo: () => void
  ultimaAtualizacao: string
  atualizarIndicadores: () => void
  veiculoPorId: (id: string) => Vehicle | undefined
  resumo: {
    total: number
    emManutencao: number
    emRota: number
    atrasados: number
    atencao: number
    alertasSegurancaPendentes: number
    alertasPendentes: number
    criticos: number
    abaixoDaMedia: Vehicle[]
    kmTotal: number
    consumoMedio: number
    custoKm: number
    utilizacao: number
  }
}

const DemoContext = createContext<DemoContextValue | null>(null)

function horaAgora() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => estadoInicial())
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('09:42')

  const resolverAlerta = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      alertas: s.alertas.map((a) => (a.id === id ? { ...a, resolvido: !a.resolvido } : a)),
    }))
    setUltimaAtualizacao(horaAgora())
  }, [])

  const restaurarDemo = useCallback(() => {
    setState(estadoInicial())
    setUltimaAtualizacao('09:42')
  }, [])

  const atualizarIndicadores = useCallback(() => {
    setUltimaAtualizacao(horaAgora())
  }, [])

  const value = useMemo<DemoContextValue>(() => {
    const ativos = state.veiculos.filter((v) => v.consumo !== null)
    const consumoMedio =
      ativos.reduce((acc, v) => acc + (v.consumo ?? 0), 0) / (ativos.length || 1)
    const custoKm = ativos.reduce((acc, v) => acc + v.custoKm, 0) / (ativos.length || 1)
    const pendentes = state.alertas.filter((a) => !a.resolvido)

    return {
      ...state,
      resolverAlerta,
      restaurarDemo,
      atualizarIndicadores,
      ultimaAtualizacao,
      veiculoPorId: (id: string) => state.veiculos.find((v) => v.id === id),
      resumo: {
        total: state.veiculos.length,
        emManutencao: state.veiculos.filter((v) => v.status === 'manutencao').length,
        emRota: state.veiculos.filter((v) => v.status === 'em_rota').length,
        atrasados: state.veiculos.filter((v) => v.status === 'atrasado').length,
        atencao: state.veiculos.filter((v) => v.status === 'atencao').length,
        alertasSegurancaPendentes: pendentes.filter((a) => a.categoria === 'seguranca').length,
        alertasPendentes: pendentes.length,
        criticos: pendentes.filter((a) => a.severidade === 'critico').length,
        abaixoDaMedia: ativos.filter((v) => (v.consumo ?? 0) < CONSUMO_MEDIO_FROTA * 0.9),
        kmTotal: 42850,
        consumoMedio,
        custoKm,
        utilizacao: 87,
      },
    }
  }, [state, resolverAlerta, restaurarDemo, atualizarIndicadores, ultimaAtualizacao])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo deve ser usado dentro de DemoProvider')
  return ctx
}
