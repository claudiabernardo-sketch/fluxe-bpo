import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients } from '../../hooks/useData'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const STORAGE_KEY = 'fluxe_onboarding_dismissed'

export default function OnboardingChecklist() {
  const nav = useNavigate()
  const { empresa } = useAuthStore()
  const { data: clients = [] } = useClients()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  // Usuários com custo configurado
  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios_onb', empresa?.id],
    queryFn: async () => {
      const { data } = await supabase.from('usuarios').select('id, custo_hora').eq('empresa_id', empresa.id)
      return data || []
    },
    enabled: !!empresa?.id,
  })

  // Modelos de tarefa
  const { data: modelos = [] } = useQuery({
    queryKey: ['modelos_onb', empresa?.id],
    queryFn: async () => {
      const { data } = await supabase.from('tarefa_modelos').select('id').eq('empresa_id', empresa.id).limit(1)
      return data || []
    },
    enabled: !!empresa?.id,
  })

  // Senhas no cofre
  const { data: acessos = [] } = useQuery({
    queryKey: ['acessos_onb', empresa?.id],
    queryFn: async () => {
      const { data } = await supabase.from('acessos').select('id').eq('empresa_id', empresa.id).limit(1)
      return data || []
    },
    enabled: !!empresa?.id,
  })

  const steps = [
    {
      id: 'equipe',
      done: usuarios.some(u => u.custo_hora),
      icon: '🧮',
      title: 'Configure o custo da sua equipe',
      desc: 'Informe o custo/hora de cada analista para calcular a rentabilidade real dos seus clientes.',
      action: () => nav('/capacidade'),
      cta: 'Configurar equipe',
    },
    {
      id: 'cliente',
      done: clients.length > 0,
      icon: '🏢',
      title: 'Cadastre seu primeiro cliente',
      desc: 'Adicione os dados do cliente para começar a criar tarefas e acompanhar a carteira.',
      action: () => nav('/clientes'),
      cta: 'Cadastrar cliente',
    },
    {
      id: 'modelo',
      done: modelos.length > 0,
      icon: '🔁',
      title: 'Crie modelos de tarefas recorrentes',
      desc: 'Configure uma vez e o sistema gera automaticamente todo mês — folha, DRE, conciliação.',
      action: () => nav('/modelos'),
      cta: 'Criar modelo',
    },
    {
      id: 'cofre',
      done: acessos.length > 0,
      icon: '🔒',
      title: 'Adicione senhas no cofre',
      desc: 'Centralize os logins dos sistemas dos clientes. Quando um analista sai, a operação não para.',
      action: () => nav('/cofre'),
      cta: 'Abrir cofre',
    },
  ]

  const done = steps.filter(s => s.done).length
  const total = steps.length
  const allDone = done === total

  // Auto-dismiss quando completo
  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, 'true')
        setDismissed(true)
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [allDone])

  if (dismissed) return null

  const pct = Math.round((done / total) * 100)

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 4,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>🚀</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
            {allDone ? '🎉 Configuração completa!' : 'Configure seu Fluxe BPO'}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            {allDone
              ? 'Tudo pronto. Seu sistema está configurado para operar.'
              : `${done} de ${total} etapas concluídas`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: allDone ? '#16A34A' : '#6366F1' }}>{pct}%</div>
          <button
            onClick={() => { localStorage.setItem(STORAGE_KEY, 'true'); setDismissed(true) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
            title="Dispensar"
          >×</button>
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={{ height: 3, background: '#F1F5F9' }}>
        <div style={{ height: '100%', background: allDone ? '#22C55E' : '#6366F1', width: `${pct}%`, transition: 'width .5s' }} />
      </div>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0 }}>
        {steps.map((step, i) => (
          <div
            key={step.id}
            style={{
              padding: '14px 18px',
              borderRight: i < steps.length - 1 ? '1px solid #F1F5F9' : 'none',
              borderTop: '1px solid #F1F5F9',
              background: step.done ? '#F0FDF4' : '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: step.done ? '#22C55E' : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: step.done ? 12 : 14,
              }}>
                {step.done ? <span style={{ color: '#fff', fontWeight: 800 }}>✓</span> : step.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: step.done ? '#15803D' : '#0F172A' }}>
                {step.title}
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#64748B', margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
            {!step.done && (
              <button
                onClick={step.action}
                style={{
                  marginTop: 4, alignSelf: 'flex-start',
                  padding: '5px 12px', borderRadius: 6, border: '1px solid #E2E8F0',
                  background: '#fff', color: '#6366F1', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#A5B4FC' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0' }}
              >
                {step.cta} →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
