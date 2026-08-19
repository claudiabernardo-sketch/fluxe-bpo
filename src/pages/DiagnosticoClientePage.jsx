import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDiagnosticoClientePublico, useSalvarDiagnosticoClientePublico } from '../hooks/useData'
import LOGO_SRC from '../assets/logo-fluxe.png'

const fi = { width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff' }
const lbl = { fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }

function Campo({ label, children }) {
  return <div style={{ marginBottom: 16 }}><label style={lbl}>{label}</label>{children}</div>
}

export default function DiagnosticoClientePage() {
  const { clienteId } = useParams()
  const { data, isLoading, error } = useDiagnosticoClientePublico(clienteId)
  const salvar = useSalvarDiagnosticoClientePublico()
  const [form, setForm] = useState(null)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    if (data && !form) {
      setForm({
        regime_tributario: data.diagnostico?.regime_tributario || '',
        porte: data.diagnostico?.porte || '',
        faturamento_medio: data.diagnostico?.faturamento_medio ?? '',
        funcionarios_clt: data.diagnostico?.funcionarios_clt ?? '',
        socios: data.diagnostico?.socios ?? '',
        tem_dividas: data.diagnostico?.tem_dividas ?? '',
        dividas_valor: data.diagnostico?.dividas_valor ?? '',
        conta_vermelho: data.diagnostico?.conta_vermelho ?? '',
        separa_pj_pf: data.diagnostico?.separa_pj_pf || '',
        retirada_prolabore: data.diagnostico?.retirada_prolabore || '',
        reserva_emergencia: data.diagnostico?.reserva_emergencia || '',
        bancos_utilizados: data.diagnostico?.bancos_utilizados || '',
        qtd_contas_bancarias: data.diagnostico?.qtd_contas_bancarias ?? '',
        aceita_open_finance: data.diagnostico?.aceita_open_finance || '',
      })
      if (data.diagnostico?.diagnostico_preenchido_em) setEnviado(true)
    }
  }, [data, form])

  async function enviar() {
    await salvar.mutateAsync({
      clienteId,
      ...form,
      faturamento_medio: form.faturamento_medio === '' ? null : Number(form.faturamento_medio),
      funcionarios_clt: form.funcionarios_clt === '' ? null : Number(form.funcionarios_clt),
      socios: form.socios === '' ? null : Number(form.socios),
      dividas_valor: form.dividas_valor === '' ? null : Number(form.dividas_valor),
      qtd_contas_bancarias: form.qtd_contas_bancarias === '' ? null : Number(form.qtd_contas_bancarias),
      tem_dividas: form.tem_dividas === '' ? null : form.tem_dividas === 'sim',
      conta_vermelho: form.conta_vermelho === '' ? null : form.conta_vermelho === 'sim',
    })
    setEnviado(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' }}>
      <img src={LOGO_SRC} alt="Fluxe" style={{ height: 32, marginBottom: 24 }} />

      <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
        {isLoading || (!error && !form) ? (
          <div style={{ textAlign: 'center', color: '#94A3B8', padding: 40 }}>Carregando...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#991B1B', padding: 40 }}>Link inválido ou cliente não encontrado.</div>
        ) : enviado ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Diagnóstico enviado!</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>Obrigado, {data.cliente.nome}. Sua equipe já recebeu essas informações e vai usar pra estruturar o começo do trabalho com você.</div>
            <button onClick={() => setEnviado(false)} style={{ marginTop: 20, background: 'none', border: 'none', color: '#6366F1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Editar respostas</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Diagnóstico Financeiro</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
              Olá, {data.cliente.nome}! Pra começar seu atendimento com o pé direito, preencha essas informações sobre a situação financeira da sua empresa. Leva menos de 5 minutos.
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', marginBottom: 12 }}>Sobre a empresa</div>
            <Campo label="Regime tributário">
              <select style={fi} value={form.regime_tributario} onChange={e => setForm(f => ({ ...f, regime_tributario: e.target.value }))}>
                <option value="">Selecione</option>
                <option value="Simples Nacional">Simples Nacional</option>
                <option value="Lucro Presumido">Lucro Presumido</option>
                <option value="Lucro Real">Lucro Real</option>
              </select>
            </Campo>
            <Campo label="Porte da empresa">
              <select style={fi} value={form.porte} onChange={e => setForm(f => ({ ...f, porte: e.target.value }))}>
                <option value="">Selecione</option>
                <option value="MEI">MEI</option>
                <option value="ME">ME</option>
                <option value="EPP">EPP</option>
                <option value="Médio">Médio</option>
                <option value="Grande">Grande</option>
              </select>
            </Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Funcionários (CLT)">
                <input style={fi} type="number" min={0} value={form.funcionarios_clt} onChange={e => setForm(f => ({ ...f, funcionarios_clt: e.target.value }))} />
              </Campo>
              <Campo label="Quantidade de sócios">
                <input style={fi} type="number" min={0} value={form.socios} onChange={e => setForm(f => ({ ...f, socios: e.target.value }))} />
              </Campo>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', margin: '20px 0 12px' }}>Situação financeira</div>
            <Campo label="Faturamento médio mensal (R$)">
              <input style={fi} type="number" min={0} value={form.faturamento_medio} onChange={e => setForm(f => ({ ...f, faturamento_medio: e.target.value }))} />
            </Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Possui dívidas em aberto?">
                <select style={fi} value={form.tem_dividas} onChange={e => setForm(f => ({ ...f, tem_dividas: e.target.value }))}>
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </Campo>
              {form.tem_dividas === 'sim' && (
                <Campo label="Valor aproximado (R$)">
                  <input style={fi} type="number" min={0} value={form.dividas_valor} onChange={e => setForm(f => ({ ...f, dividas_valor: e.target.value }))} />
                </Campo>
              )}
            </div>
            <Campo label="Está com alguma conta no vermelho?">
              <select style={fi} value={form.conta_vermelho} onChange={e => setForm(f => ({ ...f, conta_vermelho: e.target.value }))}>
                <option value="">Selecione</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </Campo>
            <Campo label="Separa conta PJ de PF hoje?">
              <select style={fi} value={form.separa_pj_pf} onChange={e => setForm(f => ({ ...f, separa_pj_pf: e.target.value }))}>
                <option value="">Selecione</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </Campo>
            <Campo label="Faz retirada de pró-labore ou distribuição de lucros?">
              <select style={fi} value={form.retirada_prolabore} onChange={e => setForm(f => ({ ...f, retirada_prolabore: e.target.value }))}>
                <option value="">Selecione</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
                <option value="Irregular">Irregular</option>
              </select>
            </Campo>
            <Campo label="Tem reserva de emergência empresarial?">
              <select style={fi} value={form.reserva_emergencia} onChange={e => setForm(f => ({ ...f, reserva_emergencia: e.target.value }))}>
                <option value="">Selecione</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
                <option value="Parcial">Parcial</option>
              </select>
            </Campo>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', margin: '20px 0 12px' }}>Bancos e contas</div>
            <Campo label="Banco(s) utilizado(s)">
              <input style={fi} placeholder="Ex: Nubank, Itaú, Bradesco" value={form.bancos_utilizados} onChange={e => setForm(f => ({ ...f, bancos_utilizados: e.target.value }))} />
            </Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Quantidade de contas PJ">
                <input style={fi} type="number" min={0} value={form.qtd_contas_bancarias} onChange={e => setForm(f => ({ ...f, qtd_contas_bancarias: e.target.value }))} />
              </Campo>
              <Campo label="Aceita conexão via Open Finance?">
                <select style={fi} value={form.aceita_open_finance} onChange={e => setForm(f => ({ ...f, aceita_open_finance: e.target.value }))}>
                  <option value="">Selecione</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                  <option value="Verificar">Verificar</option>
                </select>
              </Campo>
            </div>

            {salvar.isError && <div style={{ color: '#991B1B', fontSize: 12, marginBottom: 12 }}>Não foi possível enviar. Tente de novo.</div>}
            <button
              onClick={enviar}
              disabled={salvar.isPending}
              style={{ width: '100%', marginTop: 8, padding: '12px 16px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              {salvar.isPending ? 'Enviando...' : 'Enviar diagnóstico'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
