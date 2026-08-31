import { useState } from 'react'
import LOGO_SRC from '../assets/logo-fluxe.png'

const AREAS = [
  ['onboarding', 'Onboarding de clientes'],
  ['padronizacao', 'Padronização dos processos'],
  ['distribuicao', 'Distribuição de responsabilidades'],
  ['prazos', 'Gestão de prazos'],
  ['conciliacao', 'Conciliação e conferências'],
  ['aprovacoes', 'Aprovações do cliente'],
  ['comunicacao', 'Comunicação com clientes'],
  ['erros', 'Controle de erros e retrabalho'],
  ['indicadores', 'Indicadores da operação'],
  ['capacidade', 'Capacidade para receber novos clientes'],
]

const NOTA_LABELS = ['0', '1', '2', '3', '4', '5']

const FUNCTION_URL = 'https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/diagnostico-caos'

function resultadoFaixa(total) {
  if (total <= 20) return { titulo: 'Sua operação cresce acumulando caos', cor: '#DC2626', texto: 'A maior parte das áreas ainda não tem estrutura. Todo cliente novo aumenta o risco, não só o faturamento.' }
  if (total <= 35) return { titulo: 'Você tem estrutura, mas ainda depende de você', cor: '#D97706', texto: 'Boa parte da operação já funciona, mas ainda passa pela sua cabeça. Isso trava o quanto você consegue crescer.' }
  return { titulo: 'Sua operação já tem controle real', cor: '#15803D', texto: 'A maioria das áreas está estruturada. O próximo passo é escalar sem perder esse controle.' }
}

const fi = { width: '100%', padding: '11px 13px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }
const lbl = { fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }

function Campo({ label, children, required }) {
  return <div style={{ marginBottom: 16 }}><label style={lbl}>{label}{required && <span style={{ color: '#DC2626' }}> *</span>}</label>{children}</div>
}

function NotaArea({ area, valor, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 6 }}>{area}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {NOTA_LABELS.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(Number(n))}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: valor === Number(n) ? '2px solid #4F46E5' : '1px solid #E2E8F0',
              background: valor === Number(n) ? '#EEF2FF' : '#fff',
              color: valor === Number(n) ? '#4338CA' : '#94A3B8',
            }}
          >{n}</button>
        ))}
      </div>
    </div>
  )
}

export default function DiagnosticoCaosPage() {
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', empresa: '', quebraria_primeiro: '' })
  const [notas, setNotas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setNota = (k, v) => setNotas(n => ({ ...n, [k]: v }))

  const faltamNotas = AREAS.filter(([key]) => notas[key] === undefined).length
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

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 16px' }}>
      <img src={LOGO_SRC} alt="Fluxe" style={{ height: 30, marginBottom: 20 }} />

      <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 26, boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
        {resultado !== null ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
            <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Sua pontuação</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#1E293B', marginBottom: 16 }}>{resultado}<span style={{ fontSize: 20, color: '#94A3B8' }}> / 50</span></div>
            {(() => { const r = resultadoFaixa(resultado); return (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, color: r.cor, marginBottom: 8 }}>{r.titulo}</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>{r.texto}</div>
              </>
            )})()}
            <div style={{ fontSize: 12, color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
              Obrigada por participar! Cláudia vai te chamar em breve com os próximos passos.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>PlayBPO Summit</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Diagnóstico do Caos</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 22, lineHeight: 1.6 }}>
              Dê uma nota de 0 a 5 pro nível de estrutura atual de cada área do seu BPO. Leva menos de 3 minutos.
            </div>

            <Campo label="Seu nome" required>
              <input style={fi} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
            </Campo>
            <Campo label="Seu e-mail" required>
              <input type="email" style={fi} value={form.email} onChange={e => set('email', e.target.value)} placeholder="voce@email.com" />
            </Campo>
            <Campo label="WhatsApp">
              <input style={fi} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" />
            </Campo>
            <Campo label="Seu BPO / empresa">
              <input style={fi} value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome do seu negócio" />
            </Campo>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', margin: '20px 0 12px' }}>Raio-X da sua operação</div>
            {AREAS.map(([key, label]) => (
              <NotaArea key={key} area={label} valor={notas[key]} onChange={v => setNota(key, v)} />
            ))}

            <Campo label="Se você dobrasse sua carteira de clientes amanhã, o que quebraria primeiro?">
              <textarea style={{ ...fi, minHeight: 70, resize: 'vertical' }} value={form.quebraria_primeiro} onChange={e => set('quebraria_primeiro', e.target.value)} placeholder="Opcional" />
            </Campo>

            {erro && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 12 }}>{erro}</div>}

            <button
              onClick={enviar}
              disabled={enviando}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none', marginTop: 6,
                background: 'linear-gradient(135deg,#4F46E5,#8B5CF6)', color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: enviando ? 'default' : 'pointer', opacity: enviando ? .7 : 1,
              }}
            >
              {enviando ? 'Enviando...' : 'Ver meu diagnóstico'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
