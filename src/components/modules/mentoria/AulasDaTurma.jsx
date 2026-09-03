import { useState, useEffect } from 'react'
import { useMinhaTurmaMentoria, useMeuProgressoAulas, useToggleProgressoAula, useMeuCheckin, useSalvarCheckin } from '../../../hooks/useData'
import { useAuthStore } from '../../../store/authStore'
import { Card, CardHeader, Btn } from '../../ui'

// Link "Adicionar ao Google Calendar" — com horário quando a aula tiver um
// definido, ou evento de dia inteiro quando não tiver. Sem precisar de
// login nem permissão nenhuma, o Google Calendar cuida de tudo sozinho.
function googleCalendarUrl({ titulo, data, horario, detalhes }) {
  if (!data) return null
  const diaBase = data.replace(/-/g, '')
  let dates
  if (horario) {
    const [h, m] = horario.split(':').map(Number)
    const p = n => String(n).padStart(2, '0')
    const inicio = `${diaBase}T${p(h)}${p(m)}00`
    const fim = `${diaBase}T${p(h + 1)}${p(m)}00`
    dates = `${inicio}/${fim}`
  } else {
    const fimDate = new Date(data + 'T12:00:00')
    fimDate.setDate(fimDate.getDate() + 1)
    dates = `${diaBase}/${fimDate.toLocaleDateString('en-CA').replace(/-/g, '')}`
  }
  const params = new URLSearchParams({ action: 'TEMPLATE', text: titulo, dates })
  if (detalhes) params.set('details', detalhes)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function BotaoAgenda({ titulo, data, horario, detalhes }) {
  const url = googleCalendarUrl({ titulo, data, horario, detalhes })
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: '#0EA5E9', textDecoration: 'none', border: '1px solid #0EA5E9', borderRadius: 8, padding: '6px 12px', whiteSpace: 'nowrap' }}>
      📅 Agenda
    </a>
  )
}

function AulaConcluidaCheck({ aula, concluida }) {
  const toggle = useToggleProgressoAula()
  return (
    <button
      onClick={() => toggle.mutate({ aula_id: aula.id, concluido: !concluida })}
      disabled={toggle.isPending}
      title={concluida ? 'Marcar como não concluída' : 'Marcar como concluída'}
      style={{
        width: 28, height: 28, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
        background: concluida ? '#22C55E' : 'rgba(99,102,241,.1)', color: concluida ? '#fff' : '#6366F1',
        transition: 'all .15s',
      }}
    >
      {concluida ? <i className="fa-solid fa-check" /> : aula.numero}
    </button>
  )
}

const DIAS_SEMANA_MIN = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtDataLocal(d) { return d.toLocaleDateString('en-CA') }
function startOfMonthLocal(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonthLocal(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function fmtHorario(h) {
  if (!h) return ''
  const [hh, mm] = h.split(':')
  return mm === '00' ? `${hh}h` : `${hh}h${mm}`
}

function CalendarioAulas({ aulas, concluidas, onSelecionar, aulaSelecionadaId }) {
  const hoje = fmtDataLocal(new Date())
  const porData = {}
  aulas.forEach(a => { if (a.data) (porData[a.data] ||= []).push(a) })

  const primeiraComData = aulas.find(a => a.data)
  const mesInicial = primeiraComData ? new Date(primeiraComData.data + 'T12:00:00') : new Date()
  const [mesBase, setMesBase] = useState(() => startOfMonthLocal(mesInicial))

  const diasMes = (() => {
    const ini = startOfMonthLocal(mesBase), fim = endOfMonthLocal(mesBase), dias = []
    const off = ini.getDay() === 0 ? 6 : ini.getDay() - 1
    for (let i = 0; i < off; i++) dias.push(null)
    for (let d = new Date(ini); d <= fim; d.setDate(d.getDate() + 1)) dias.push(new Date(d))
    while (dias.length % 7 !== 0) dias.push(null)
    return dias
  })()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button onClick={() => setMesBase(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          style={{ border: '1px solid var(--bo)', background: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}>‹</button>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', minWidth: 150, textAlign: 'center' }}>
          {MESES_NOME[mesBase.getMonth()]} {mesBase.getFullYear()}
        </div>
        <button onClick={() => setMesBase(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          style={{ border: '1px solid var(--bo)', background: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
        {DIAS_SEMANA_MIN.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {diasMes.map((d, i) => {
          if (!d) return <div key={`e${i}`} style={{ minHeight: 46 }} />
          const key = fmtDataLocal(d)
          const aulasDoDia = porData[key] || []
          const isHoje = key === hoje
          const temSelecionada = aulasDoDia.some(a => a.id === aulaSelecionadaId)
          return (
            <div
              key={key}
              onClick={() => aulasDoDia.length && onSelecionar(aulasDoDia[0].id)}
              style={{
                minHeight: 46, borderRadius: 8, padding: 4, cursor: aulasDoDia.length ? 'pointer' : 'default',
                background: temSelecionada ? '#EEF2FF' : aulasDoDia.length ? '#F5F3FF' : isHoje ? '#F8FAFC' : 'transparent',
                border: `1.5px solid ${temSelecionada ? '#6366F1' : aulasDoDia.length ? '#DDD6FE' : isHoje ? '#CBD5E1' : 'transparent'}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: isHoje ? 800 : 600, color: isHoje ? '#4338CA' : 'var(--tx2)' }}>{d.getDate()}</div>
              {aulasDoDia.map(a => (
                <div key={a.id} style={{
                  fontSize: 8.5, marginTop: 2, padding: '1px 3px', borderRadius: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  background: concluidas.has(a.id) ? '#DCFCE7' : '#EEF2FF', color: concluidas.has(a.id) ? '#15803D' : '#4338CA', fontWeight: 700,
                }}>
                  {concluidas.has(a.id) ? '✓ ' : ''}{a.numero}. {a.titulo}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CardAula({ a, concluida, destacada }) {
  return (
    <div style={{ border: `1.5px solid ${destacada ? '#6366F1' : 'var(--bo)'}`, background: destacada ? '#EEF2FF' : 'transparent', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <AulaConcluidaCheck aula={a} concluida={concluida} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{a.titulo}</div>
        {a.exercicio && <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>Exercício: {a.exercicio}</div>}
        <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4 }}>
          {a.data ? new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) + (a.horario ? ` às ${fmtHorario(a.horario)}` : '') : 'Data a combinar'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
        <BotaoAgenda titulo={`Aula ${a.numero}: ${a.titulo}`} data={a.data} horario={a.horario} detalhes={a.video_url || a.material_url || ''} />
        {a.material_url && (
          <a href={a.material_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)', textDecoration: 'none', border: '1px solid var(--bo)', borderRadius: 8, padding: '6px 12px' }}>
            📄 Material
          </a>
        )}
        {a.video_url ? (
          <a href={a.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: '#6366F1', textDecoration: 'none', border: '1px solid #6366F1', borderRadius: 8, padding: '6px 12px' }}>
            ▶ Assistir
          </a>
        ) : (
          !a.material_url && <span style={{ fontSize: 11, color: 'var(--tx3)' }}>Em breve</span>
        )}
      </div>
    </div>
  )
}

function CardCheckin() {
  const { empresa } = useAuthStore()
  const { data: checkin, isLoading } = useMeuCheckin()
  const salvar = useSalvarCheckin()
  const [texto, setTexto] = useState('')

  useEffect(() => { setTexto(checkin?.texto || '') }, [checkin?.texto])

  if (!empresa?.mentorado_bpo_lucrativo || isLoading) return null

  const mudou = texto !== (checkin?.texto || '')

  return (
    <div style={{ border: '1px solid var(--bo)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', marginBottom: 6 }}>Como você está indo com a mentoria?</div>
      <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 8 }}>
        Um espaço livre pra registrar como está sua evolução, dúvidas ou travas. Só sua mentora vê isso.
      </div>
      <textarea
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--bo)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', minHeight: 60, resize: 'vertical', boxSizing: 'border-box' }}
        placeholder="Ex: essa semana travei em como precificar um cliente maior..."
        value={texto}
        onChange={e => setTexto(e.target.value)}
      />
      {mudou && (
        <div style={{ marginTop: 8 }}>
          <Btn small variant="primary" disabled={salvar.isPending} onClick={() => salvar.mutate(texto)}>
            {salvar.isPending ? 'Salvando...' : 'Salvar'}
          </Btn>
        </div>
      )}
      {checkin?.atualizado_em && !mudou && (
        <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 6 }}>
          Atualizado em {new Date(checkin.atualizado_em).toLocaleDateString('pt-BR')}
        </div>
      )}
    </div>
  )
}

export default function SecaoAulasDaTurma() {
  const { empresa, profile } = useAuthStore()
  const { data, isLoading } = useMinhaTurmaMentoria()
  const { data: concluidas = new Set() } = useMeuProgressoAulas()
  const [modo, setModo] = useState('calendario') // 'calendario' | 'lista'
  const [aulaSelecionadaId, setAulaSelecionadaId] = useState(null)
  const turma = data?.turma
  const aulas = data?.aulas ?? []
  const totalConcluidas = aulas.filter(a => concluidas.has(a.id)).length

  if (!empresa?.mentorado_bpo_lucrativo && !profile?.fluxe_staff) return null
  if (isLoading) return null
  if (!turma) return null

  const aulaSelecionada = aulas.find(a => a.id === aulaSelecionadaId)
  const hoje = fmtDataLocal(new Date())
  const proximaAula = aulas.filter(a => a.data && a.data >= hoje).sort((a, b) => a.data.localeCompare(b.data))[0]

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title={`Aulas da Turma${turma.nome ? ` — ${turma.nome}` : ''}`} icon="fa-solid fa-calendar-days" />
      <div style={{ padding: 16 }}>
        <div style={{ border: '1px solid #C7D2FE', background: '#EEF2FF', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Próximo evento</div>
          {proximaAula ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>Aula {proximaAula.numero}: {proximaAula.titulo}</div>
                <div style={{ fontSize: 11, color: 'var(--tx2)' }}>
                  {new Date(proximaAula.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  {proximaAula.horario && ` às ${fmtHorario(proximaAula.horario)}`}
                </div>
              </div>
              <BotaoAgenda titulo={`Aula ${proximaAula.numero}: ${proximaAula.titulo}`} data={proximaAula.data} horario={proximaAula.horario} detalhes={proximaAula.video_url || proximaAula.material_url || ''} />
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Nenhum evento agendado</div>
          )}
        </div>
        <CardCheckin />
        {turma.grupo_whatsapp_url && (
          <a href={turma.grupo_whatsapp_url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff',
            background: '#25D366', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 14,
          }}>
            <i className="fa-brands fa-whatsapp" style={{ fontSize: 16 }} /> Entrar no grupo da turma no WhatsApp
          </a>
        )}
        {aulas.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: 20 }}>Cronograma da turma em breve.</div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx2)', marginBottom: 5, fontWeight: 600 }}>
                <span>Seu progresso</span>
                <span>{totalConcluidas} de {aulas.length} aulas concluídas</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'var(--s2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${aulas.length ? (totalConcluidas / aulas.length) * 100 : 0}%`, background: '#22C55E', transition: 'width .2s' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[['calendario', '📅 Calendário'], ['lista', '📋 Lista']].map(([v, l]) => (
                <button key={v} onClick={() => setModo(v)} style={{
                  padding: '6px 12px', borderRadius: 8, border: modo === v ? '2px solid #6366F1' : '1px solid var(--bo)',
                  background: modo === v ? 'rgba(99,102,241,.08)' : 'transparent', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{l}</button>
              ))}
            </div>

            {modo === 'calendario' ? (
              <>
                <CalendarioAulas aulas={aulas} concluidas={concluidas} onSelecionar={setAulaSelecionadaId} aulaSelecionadaId={aulaSelecionadaId} />
                {aulaSelecionada && (
                  <div style={{ marginTop: 14 }}>
                    <CardAula a={aulaSelecionada} concluida={concluidas.has(aulaSelecionada.id)} destacada />
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aulas.map(a => <CardAula key={a.id} a={a} concluida={concluidas.has(a.id)} />)}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
