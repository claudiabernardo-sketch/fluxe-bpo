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
    <a href={url} target="_blank" rel="noopener noreferrer" title="Abre o Google Calendar já preenchido, clique em Salvar lá pra confirmar"
      style={{ fontSize: 12, fontWeight: 600, color: '#0EA5E9', textDecoration: 'none', border: '1px solid #0EA5E9', borderRadius: 8, padding: '6px 12px', whiteSpace: 'nowrap' }}>
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

const GRAD_FLUXE = 'linear-gradient(135deg,#A855F7,#6366F1 55%,#22D3EE)'

function NavMesBtn({ onClick, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: 'none', background: hover ? '#EEF2FF' : 'var(--s2)', color: hover ? '#4F46E5' : 'var(--tx2)',
        borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontWeight: 800, fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
      }}
    >{children}</button>
  )
}

function DiaCalendario({ d, aulasDoDia, isHoje, temSelecionada, concluidas, onSelecionar, ultimaColuna, ultimaLinha }) {
  const [hover, setHover] = useState(false)
  const temAula = aulasDoDia.length > 0

  let background = 'transparent'
  if (temSelecionada) background = GRAD_FLUXE
  else if (temAula) background = hover ? '#EEF2FF' : '#FAFAFF'
  else if (hover) background = 'var(--s2)'

  return (
    <div
      onClick={() => temAula && onSelecionar(aulasDoDia[0].id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        minHeight: 88, padding: '8px 8px', cursor: temAula ? 'pointer' : 'default',
        background, transition: 'background .15s',
        borderRight: ultimaColuna ? 'none' : '1px solid var(--bo)',
        borderBottom: ultimaLinha ? 'none' : '1px solid var(--bo)',
        position: 'relative',
      }}
    >
      {isHoje && !temSelecionada && (
        <div style={{ position: 'absolute', top: 6, left: 6, width: 7, height: 7, borderRadius: '50%', background: '#6366F1' }} />
      )}
      <div style={{
        fontSize: 16, fontWeight: isHoje || temSelecionada ? 800 : 600,
        color: temSelecionada ? '#fff' : isHoje ? '#4F46E5' : 'var(--tx2)',
        marginLeft: isHoje && !temSelecionada ? 12 : 0,
      }}>
        {d.getDate()}
      </div>
      {aulasDoDia.map(a => (
        <div key={a.id} style={{
          fontSize: 10, marginTop: 4, padding: '3px 5px', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3,
          background: temSelecionada ? 'rgba(255,255,255,.22)' : concluidas.has(a.id) ? '#DCFCE7' : '#EEF2FF',
          color: temSelecionada ? '#fff' : concluidas.has(a.id) ? '#15803D' : '#4338CA',
        }}>
          {concluidas.has(a.id) ? '✓' : `${a.numero}.`} {a.titulo}
        </div>
      ))}
    </div>
  )
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
    <div style={{ background: 'var(--sur, #fff)', border: '1px solid var(--bo)', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <NavMesBtn onClick={() => setMesBase(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>‹</NavMesBtn>
        <div style={{
          fontSize: 22, fontWeight: 800, textAlign: 'center',
          backgroundImage: GRAD_FLUXE, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}>
          {MESES_NOME[mesBase.getMonth()]} {mesBase.getFullYear()}
        </div>
        <NavMesBtn onClick={() => setMesBase(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>›</NavMesBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 0, marginBottom: 8 }}>
        {DIAS_SEMANA_MIN.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', paddingBottom: 8 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 0, border: '1px solid var(--bo)', borderRadius: 10, overflow: 'hidden' }}>
        {diasMes.map((d, i) => {
          const ultimaColuna = i % 7 === 6
          const ultimaLinha = i >= diasMes.length - 7
          if (!d) return <div key={`e${i}`} style={{ minHeight: 56, borderRight: ultimaColuna ? 'none' : '1px solid var(--bo)', borderBottom: ultimaLinha ? 'none' : '1px solid var(--bo)' }} />
          const key = fmtDataLocal(d)
          const aulasDoDia = porData[key] || []
          return (
            <DiaCalendario
              key={key}
              d={d}
              aulasDoDia={aulasDoDia}
              isHoje={key === hoje}
              temSelecionada={aulasDoDia.some(a => a.id === aulaSelecionadaId)}
              concluidas={concluidas}
              onSelecionar={onSelecionar}
              ultimaColuna={ultimaColuna}
              ultimaLinha={ultimaLinha}
            />
          )
        })}
      </div>
    </div>
  )
}

function CardAula({ a, concluida, destacada }) {
  const hoje = fmtDataLocal(new Date())
  const jaPassou = a.data && a.data < hoje
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
        {!jaPassou && a.link_meet && (
          <a href={a.link_meet} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none', background: '#16A34A', borderRadius: 8, padding: '6px 12px' }}>
            🎥 Entrar na aula
          </a>
        )}
        {!jaPassou && (
          <BotaoAgenda titulo={`Aula ${a.numero}: ${a.titulo}`} data={a.data} horario={a.horario} detalhes={a.link_meet || a.video_url || a.material_url || ''} />
        )}
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
          jaPassou && !a.material_url && <span style={{ fontSize: 11, color: 'var(--tx3)' }}>Gravação em breve</span>
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
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {proximaAula.link_meet && (
                  <a href={proximaAula.link_meet} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none', background: '#16A34A', borderRadius: 8, padding: '6px 12px', whiteSpace: 'nowrap' }}>
                    🎥 Entrar na aula
                  </a>
                )}
                <BotaoAgenda titulo={`Aula ${proximaAula.numero}: ${proximaAula.titulo}`} data={proximaAula.data} horario={proximaAula.horario} detalhes={proximaAula.link_meet || proximaAula.video_url || proximaAula.material_url || ''} />
              </div>
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
