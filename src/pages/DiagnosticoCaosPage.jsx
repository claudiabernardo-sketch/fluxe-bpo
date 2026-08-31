import { useEffect, useState } from 'react'
import LOGO_SRC from '../assets/logo-fluxe.png'

const AREAS = [
  ['onboarding', 'Onboarding de clientes', 'fa-solid fa-handshake'],
  ['padronizacao', 'Padronização dos processos', 'fa-solid fa-list-check'],
  ['distribuicao', 'Distribuição de responsabilidades', 'fa-solid fa-users'],
  ['prazos', 'Gestão de prazos', 'fa-solid fa-calendar-days'],
  ['conciliacao', 'Conciliação e conferências', 'fa-solid fa-scale-balanced'],
  ['aprovacoes', 'Aprovações do cliente', 'fa-solid fa-stamp'],
  ['comunicacao', 'Comunicação com clientes', 'fa-solid fa-comments'],
  ['erros', 'Controle de erros e retrabalho', 'fa-solid fa-triangle-exclamation'],
  ['indicadores', 'Indicadores da operação', 'fa-solid fa-chart-line'],
  ['capacidade', 'Capacidade para receber novos clientes', 'fa-solid fa-arrow-up-right-dots'],
]

const NOTA_LABELS = ['0', '1', '2', '3', '4', '5']

const FUNCTION_URL = 'https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/diagnostico-caos'

function resultadoFaixa(total) {
  if (total <= 20) return { titulo: 'Sua operação cresce acumulando caos', cor: '#DC2626', bg: '#FEF2F2', texto: 'A maior parte das áreas ainda não tem estrutura. Todo cliente novo aumenta o risco, não só o faturamento.' }
  if (total <= 35) return { titulo: 'Você tem estrutura, mas ainda depende de você', cor: '#D97706', bg: '#FFFBEB', texto: 'Boa parte da operação já funciona, mas ainda passa pela sua cabeça. Isso trava o quanto você consegue crescer.' }
  return { titulo: 'Sua operação já tem controle real', cor: '#15803D', bg: '#F0FDF4', texto: 'A maioria das áreas está estruturada. O próximo passo é escalar sem perder esse controle.' }
}

const NOTA_COR = ['#DC2626', '#DC2626', '#EA580C', '#D97706', '#65A30D', '#15803D']

export default function DiagnosticoCaosPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640)
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', empresa: '', quebraria_primeiro: '' })
  const [notas, setNotas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const root = document.getElementById('root')
    const prev = {
      bodyOverflow: document.body.style.overflow,
      bodyHeight: document.body.style.height,
      rootOverflow: root?.style.overflow,
      rootHeight: root?.style.height,
      title: document.title,
    }
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    if (root) {
      root.style.overflow = 'auto'
      root.style.height = 'auto'
    }
    document.title = 'Diagnóstico do Caos | PlayBPO Summit'
    return () => {
      document.body.style.overflow = prev.bodyOverflow
      document.body.style.height = prev.bodyHeight
      if (root) {
        root.style.overflow = prev.rootOverflow
        root.style.height = prev.rootHeight
      }
      document.title = prev.title
    }
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setNota = (k, v) => setNotas(n => ({ ...n, [k]: v }))

  const respondidas = AREAS.filter(([key]) => notas[key] !== undefined).length
  const faltamNotas = AREAS.length - respondidas
  const podeEnviar = form.nome.trim() && form.email.trim() && faltamNotas === 0

  async function enviar() {
    if (!podeEnviar) { setErro('Preencha nome, e-mail e todas as notas antes de enviar.'); return }
    setErro(''); setEnviando(true)
    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, notas }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Falha ao enviar')
      setResultado(data.pontuacaoTotal)
    } catch (e) {
      setErro('Não foi possível enviar. Tente de novo em alguns segundos.')
    } finally {
      setEnviando(false)
    }
  }

  const fi = { width: '100%', padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontFamily: "'Poppins',sans-serif", background: '#fff', boxSizing: 'border-box', outline: 'none', transition: 'border-color .15s, box-shadow .15s' }
  const lbl = { fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }

  return (
    <div style={{
      minHeight: '100vh', width: '100%', background: 'linear-gradient(180deg,#EEF2FF 0%,#F8FAFC 260px,#F8FAFC 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: isMobile ? '28px 14px 60px' : '44px 16px 80px',
      fontFamily: "'Poppins',sans-serif", boxSizing: 'border-box',
    }}>
      <img src={LOGO_SRC} alt="Fluxe" style={{ height: 30, marginBottom: 22 }} />

      <div style={{ width: '100%', maxWidth: 600 }}>
        <div style={{
          width: '100%', background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0',
          padding: isMobile ? '26px 20px' : '36px 40px', boxShadow: '0 12px 40px rgba(79,70,229,.10), 0 2px 10px rgba(0,0,0,.04)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg,#A855F7,#4F46E5 50%,#22D3EE)' }} />

          {resultado !== null ? (
            <div style={{ textAlign: 'center', padding: '20px 0 4px' }}>
              {(() => { const r = resultadoFaixa(resultado); const pct = Math.round((resultado / 50) * 100); return (
                <>
                  <div style={{ width: 128, height: 128, margin: '0 auto 22px', position: 'relative' }}>
                    <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                      <circle cx="64" cy="64" r="56" fill="none" stroke={r.cor} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 56}`} strokeDashoffset={`${2 * Math.PI * 56 * (1 - pct / 100)}`}
                        style={{ transition: 'stroke-dashoffset 1s ease' }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 30, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{resultado}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>de 50</div>
                    </div>
                  </div>
                  <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 99, background: r.bg, color: r.cor, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 14 }}>
                    Resultado do diagnóstico
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: r.cor, marginBottom: 10, lineHeight: 1.35 }}>{r.titulo}</div>
                  <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 24, maxWidth: 440, margin: '0 auto 24px' }}>{r.texto}</div>
                </>
              )})()}
              <div style={{ fontSize: 12, color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 18, lineHeight: 1.6 }}>
                Obrigada por participar! Cláudia vai te chamar em breve com os próximos passos.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>PlayBPO Summit</div>
              <div style={{ fontSize: isMobile ? 22 : 25, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-.02em' }}>Diagnóstico do Caos</div>
              <div style={{ fontSize: 13.5, color: '#64748B', marginBottom: 26, lineHeight: 1.65 }}>
                Dê uma nota de 0 a 5 pro nível de estrutura atual de cada área do seu BPO. Leva menos de 3 minutos.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 4 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Seu nome<span style={{ color: '#DC2626' }}> *</span></label>
                  <input style={fi} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" onFocus={e => { e.target.style.borderColor = '#6366F1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)' }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Seu e-mail<span style={{ color: '#DC2626' }}> *</span></label>
                  <input type="email" style={fi} value={form.email} onChange={e => set('email', e.target.value)} placeholder="voce@email.com" onFocus={e => { e.target.style.borderColor = '#6366F1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)' }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>WhatsApp</label>
                  <input style={fi} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" onFocus={e => { e.target.style.borderColor = '#6366F1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)' }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Seu BPO / empresa</label>
                  <input style={fi} value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome do seu negócio" onFocus={e => { e.target.style.borderColor = '#6366F1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)' }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '.06em' }}>Raio-X da sua operação</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>{respondidas}/{AREAS.length}</div>
              </div>
              <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ height: '100%', width: `${(respondidas / AREAS.length) * 100}%`, background: 'linear-gradient(90deg,#A855F7,#4F46E5,#22D3EE)', borderRadius: 99, transition: 'width .25s ease' }} />
              </div>

              {AREAS.map(([key, label, icon]) => (
                <div key={key} style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: notas[key] !== undefined ? '#FAFAFF' : 'transparent', border: `1px solid ${notas[key] !== undefined ? '#EEF2FF' : 'transparent'}`, transition: 'all .15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 9 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
                      <i className={icon} />
                    </div>
                    {label}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {NOTA_LABELS.map(n => {
                      const sel = notas[key] === Number(n)
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNota(key, Number(n))}
                          style={{
                            flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                            border: sel ? `2px solid ${NOTA_COR[Number(n)]}` : '1.5px solid #E2E8F0',
                            background: sel ? NOTA_COR[Number(n)] : '#fff',
                            color: sel ? '#fff' : '#94A3B8',
                            transition: 'all .12s',
                          }}
                        >{n}</button>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div style={{ marginBottom: 16, marginTop: 6 }}>
                <label style={lbl}>Se você dobrasse sua carteira de clientes amanhã, o que quebraria primeiro?</label>
                <textarea style={{ ...fi, minHeight: 78, resize: 'vertical' }} value={form.quebraria_primeiro} onChange={e => set('quebraria_primeiro', e.target.value)} placeholder="Opcional" onFocus={e => { e.target.style.borderColor = '#6366F1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,.12)' }} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }} />
              </div>

              {erro && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 12, fontWeight: 600 }}>{erro}</div>}

              <button
                onClick={enviar}
                disabled={enviando}
                style={{
                  width: '100%', padding: '15px', borderRadius: 12, border: 'none', marginTop: 6,
                  background: 'linear-gradient(135deg,#4F46E5,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: enviando ? 'default' : 'pointer', opacity: enviando ? .7 : 1,
                  boxShadow: '0 8px 24px rgba(99,102,241,.35)', transition: 'transform .1s',
                }}
                onMouseDown={e => { if (!enviando) e.currentTarget.style.transform = 'scale(.98)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'none' }}
              >
                {enviando ? 'Enviando...' : 'Ver meu diagnóstico →'}
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 20 }}>
          Fluxe BPO · PlayBPO Summit
        </div>
      </div>
    </div>
  )
}
