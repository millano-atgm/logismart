'use client'

import Link from 'next/link'
import { ArrowRight, Thermometer, Timer, Wrench } from 'lucide-react'
import { AnaliseBox, DadosSimulados, KpiTile, PageIntro, Section } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ManutencaoItem } from '@/lib/data'
import { useDemo } from '@/lib/store'

const situacaoInfo = {
  em_oficina: { label: 'Em oficina', tone: 'primary' as const },
  agendada: { label: 'Agendada', tone: 'neutral' as const },
  recomendada: { label: 'Recomendada pelo sistema', tone: 'warning' as const },
}

const tipoInfo = {
  corretiva: 'Corretiva',
  preventiva: 'Preventiva',
  inspecao: 'Inspeção',
}

function ItemManutencao({ item }: { item: ManutencaoItem }) {
  const info = situacaoInfo[item.situacao]
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{item.veiculoNome}</span>
            <span className="text-xs text-muted-foreground">{tipoInfo[item.tipo]}</span>
          </div>
          <Badge tone={info.tone}>{info.label}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{item.descricao}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Timer className="size-3.5" aria-hidden />
            {item.prazo}
          </span>
          {item.kmRestante !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <Wrench className="size-3.5" aria-hidden />
              <span className="font-mono">{item.kmRestante.toLocaleString('pt-BR')} km</span> até a
              manutenção
            </span>
          ) : null}
        </div>
        <Button
          render={<Link href={`/veiculos/${item.veiculoId}`} />}
          variant="outline"
          size="sm"
          className="w-fit"
        >
          Ver veículo
          <ArrowRight className="size-3.5" data-icon="inline-end" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ManutencaoPage() {
  const { manutencoes, veiculos } = useDemo()

  const emOficina = manutencoes.filter((m) => m.situacao === 'em_oficina')
  const recomendadas = manutencoes.filter((m) => m.situacao === 'recomendada')
  const agendadas = manutencoes.filter((m) => m.situacao === 'agendada')

  const proximas = [...veiculos]
    .filter((v) => v.status !== 'manutencao')
    .sort((a, b) => a.kmAteManutencao - b.kmAteManutencao)
    .slice(0, 6)

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageIntro
          titulo="Manutenção preventiva e corretiva"
          descricao="Situação dos veículos em oficina, revisões próximas e alertas preventivos gerados a partir da telemetria simulada."
        />
        <DadosSimulados />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Em oficina" valor={String(emOficina.length)} nota="fora de operação" />
        <KpiTile
          label="Inspeções recomendadas"
          valor={String(recomendadas.length)}
          destaque="negativo"
        />
        <KpiTile label="Revisões agendadas" valor={String(agendadas.length)} />
        <KpiTile
          label="Menor folga de km"
          valor={`${Math.min(...manutencoes.filter((m) => m.kmRestante !== null).map((m) => m.kmRestante as number)).toLocaleString('pt-BR')} km`}
          nota="Veículo 14"
          destaque="negativo"
        />
      </div>

      <Section titulo="Veículos em manutenção" descricao="Indisponíveis para roteirização hoje.">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {emOficina.map((m) => (
            <ItemManutencao key={m.id} item={m} />
          ))}
        </div>
      </Section>

      <Section
        titulo="Alertas preventivos do sistema"
        descricao="Recomendações geradas por desvios de consumo, temperatura e desgaste."
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {recomendadas.map((m) => (
            <ItemManutencao key={m.id} item={m} />
          ))}
        </div>
      </Section>

      <Section titulo="Próximas revisões" descricao="Ordenadas pela quilometragem restante.">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {proximas.map((v) => {
              const critico = v.kmAteManutencao < 5000
              return (
                <li key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/veiculos/${v.id}`} className="truncate text-sm font-medium hover:underline">
                      {v.nome}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      Próxima em {v.proximaManutencaoKm.toLocaleString('pt-BR')} km · última{' '}
                      {v.ultimaManutencao}
                    </span>
                  </div>
                  <div className="flex w-full items-center gap-3 sm:w-56">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={critico ? 'h-full rounded-full bg-warning' : 'h-full rounded-full bg-primary'}
                        style={{ width: `${100 - Math.min(100, (v.kmAteManutencao / 8000) * 100)}%` }}
                      />
                    </div>
                    <span
                      className={
                        critico ? 'w-20 text-right font-mono text-xs text-warning' : 'w-20 text-right font-mono text-xs'
                      }
                    >
                      {v.kmAteManutencao.toLocaleString('pt-BR')} km
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </Section>

      <Section titulo="Revisões agendadas" descricao="Planejamento das próximas semanas.">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {agendadas.map((m) => (
            <ItemManutencao key={m.id} item={m} />
          ))}
        </div>
      </Section>

      <AnaliseBox
        titulo="Prioridade recomendada"
        texto="O Caminhão 02 deve ser tratado primeiro: a oscilação de temperatura detectada via telemetria pode gerar uma quebra em operação, cujo custo médio é cerca de três vezes maior do que a inspeção preventiva. Em seguida, o Caminhão 12 — a verificação de pneus e alinhamento tende a recuperar parte dos 12% de consumo perdido."
      />

      <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Thermometer className="size-3.5" aria-hidden />
        Dados de desgaste e temperatura simulados para fins didáticos.
      </p>
    </>
  )
}
