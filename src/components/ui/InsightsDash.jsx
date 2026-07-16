import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useClients, useTasks, useUsuarios } from '../../hooks/useData'
import { supabase } from '../../lib/supabase'
import { useMemo } from 'react'
import { computeMargemPorCliente, computeAreaStatusPorCliente, computeRadarScore, CUSTO_HORA_PADRAO } from '../../utils/radar'

const HORAS_MES_PADRAO = 160
const OCUPACAO_ALERTA = 85

function Insight({ icon, color, bg, title, desc, action, cta }) {
  const nav = useNavigate()
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 14px', borderRadius: 10,
      background: bg, border: `1px solid ${color}30`,
      flex: '1 1 220px',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `${color}18`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        {action && (
          <button
            onClick={() => nav(action)}
            style={{
              marginTop: 6, padding: '3px 10px', borderRadius: 5,
              border: `1px solid ${color}50`, background: `${color}10`,
              color, fontSize: 10, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {cta} →
          </button>
        )}
      </div>
    </div>
  )
}

export default function InsightsDash() {
  const { empresa } = useAuthStore()
  const { data: usuarios = [] } = useUsuarios()
  const { data: clients = [] } = useClients()
  const { data: tasks = [] } = useTasks()

  // Apontamentos do mês para cálculo de margem
  const { data: apontamentos = [] } = useQuery({
    queryKey: ['apontamentos_insights', empresa?.id],
    queryFn: async () => {
      const inicio = new Date()
      inicio.setDate(1); inicio.setHours(0, 0, 0, 0)
      const { data } = await supabase
        .from('apontamentos')
        .select('cliente_id, segundos')
        .eq('empresa_id', empresa.id)
        .gte('inicio', inicio.toISOString())
      return data || []
    },
    enabled: !!empresa?.id,
    staleTime: 60_000,
  })

  const insights = useMemo(() => {
    const list = []

    // ── 1. Capacidade da equipe ─────────────────────────────
    const totalHoras = usuarios.reduce((a, u) => a + (u.horas_mes || HORAS_MES_PADRAO), 0)
    const horasUsadas = apontamentos.reduce((a, ap) => a + (ap.segundos || 0) / 3600, 0)
    const ocupacao = totalHoras > 0 ? (horasUsadas / totalHoras) * 100 : 0

    if (ocupacao >= OCUPACAO_ALERTA) {
      list.push({
        key: 'cap',
        icon: '⚡',
        color: '#F59E0B',
        bg: '#FFFBEB',
        title: `Equipe com ${ocupacao.toFixed(0)}% de capacidade`,
        desc: 'Cuidado ao aceitar novos clientes — risco de atrasos e queda de qualidade.',
        action: '/cap',
        cta: 'Ver capacidade',
      })
    } else if (totalHoras > 0 && ocupacao < 40 && clients.length > 0) {
      const horasLivres = totalHoras - horasUsadas
      list.push({
        key: 'cap_ok',
        icon: '✅',
        color: '#10B981',
        bg: '#F0FDF4',
        title: `${horasLivres.toFixed(0)}h disponíveis este mês`,
        desc: 'Sua equipe tem capacidade para mais clientes sem comprometer a operação.',
        action: '/cap',
        cta: 'Ver capacidade',
      })
    }

    // ── 2. Clientes com margem negativa ─────────────────────
    const custoHoraMedio = usuarios.length > 0
      ? usuarios.reduce((a, u) => a + (u.custo_hora || CUSTO_HORA_PADRAO), 0) / usuarios.length
      : CUSTO_HORA_PADRAO

    const margensPorCliente = computeMargemPorCliente(clients, apontamentos, custoHoraMedio)
    const margemNegativa = []
    clients.forEach(c => {
      const m = margensPorCliente.find(x => x.clienteId === c.id)
      if ((c.valor_mrr || 0) > 0 && m.margem < 0) {
        margemNegativa.push({ nome: c.fantasia || c.razao_social, custo: m.custo, mrr: c.valor_mrr })
      }
    })

    if (margemNegativa.length > 0) {
      const nomes = margemNegativa.slice(0, 2).map(c => c.nome).join(', ')
      list.push({
        key: 'margin',
        icon: '📉',
        color: '#EF4444',
        bg: '#FEF2F2',
        title: `${margemNegativa.length} cliente${margemNegativa.length > 1 ? 's' : ''} com margem negativa`,
        desc: `${nomes}${margemNegativa.length > 2 ? ` e mais ${margemNegativa.length - 2}` : ''} — custo de atendimento supera o valor mensal.`,
        action: '/rentabilidade',
        cta: 'Ver rentabilidade',
      })
    }

    // ── 3. Tarefas vencidas ────────────────────────────────
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
    const vencidas = tasks.filter(t =>
      t.status !== 'concluida' && t.prazo && new Date(t.prazo) < hoje
    )
    if (vencidas.length > 0) {
      list.push({
        key: 'overdue',
        icon: '🔴',
        color: '#EF4444',
        bg: '#FEF2F2',
        title: `${vencidas.length} tarefa${vencidas.length > 1 ? 's' : ''} vencida${vencidas.length > 1 ? 's' : ''}`,
        desc: 'Tarefas com prazo expirado podem gerar insatisfação do cliente.',
        action: '/tarefas',
        cta: 'Ver tarefas',
      })
    }

    // ── 4. Clientes sem responsável ────────────────────────
    const semResp = clients.filter(c => !c.responsavel_id)
    if (semResp.length > 0) {
      list.push({
        key: 'noresp',
        icon: '👤',
        color: '#8B5CF6',
        bg: '#F5F3FF',
        title: `${semResp.length} cliente${semResp.length > 1 ? 's' : ''} sem responsável`,
        desc: 'Clientes sem dono tendem a ser negligenciados na operação.',
        action: '/clientes',
        cta: 'Atribuir responsável',
      })
    }

    // ── 5. Sem custo configurado ────────────────────────────
    const semCusto = usuarios.filter(u => !u.custo_hora)
    if (semCusto.length > 0 && usuarios.length > 0) {
      list.push({
        key: 'nocost',
        icon: '🧮',
        color: '#F59E0B',
        bg: '#FFFBEB',
        title: `${semCusto.length} analista${semCusto.length > 1 ? 's' : ''} sem custo/hora`,
        desc: 'Sem esse dado, o cálculo de margem e rentabilidade não é preciso.',
        action: '/cap',
        cta: 'Configurar',
      })
    }

    // ── 6. Radar do cliente — semáforo vermelho ─────────────
    const emRisco = []
    clients.forEach(c => {
      const m = margensPorCliente.find(x => x.clienteId === c.id)
      const tarefasCliente = tasks.filter(t => t.cliente_id === c.id && !t.deleted_at)
      const areas = computeAreaStatusPorCliente(c, tarefasCliente, m)
      const { semaforo } = computeRadarScore(areas)
      if (semaforo === 'vermelho') emRisco.push(c)
    })
    if (emRisco.length > 0) {
      const nomes = emRisco.slice(0, 2).map(c => c.fantasia || c.razao_social).join(', ')
      list.push({
        key: 'radar_risk',
        icon: '🩺',
        color: '#DC2626',
        bg: '#FEF2F2',
        title: `${emRisco.length} cliente${emRisco.length > 1 ? 's' : ''} em risco esta semana`,
        desc: `${nomes}${emRisco.length > 2 ? ` e mais ${emRisco.length - 2}` : ''} — veja o radar de saúde do cliente.`,
        action: `/clientes/${emRisco[0].id}?tab=radar`,
        cta: 'Ver radar',
      })
    }

    // Sem alertas = tudo ok
    if (list.length === 0 && clients.length > 0) {
      list.push({
        key: 'allgood',
        icon: '🏆',
        color: '#10B981',
        bg: '#F0FDF4',
        title: 'Operação saudável',
        desc: 'Sem alertas no momento. Capacidade, margem e tarefas estão sob controle.',
      })
    }

    return list
  }, [usuarios, clients, tasks, apontamentos])

  if (insights.length === 0) return null

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>💡 Insights da operação</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
          background: '#F1F5F9', color: '#64748B',
        }}>{insights.length}</span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {insights.map(ins => (
          <Insight key={ins.key} {...ins} />
        ))}
      </div>
    </div>
  )
}
