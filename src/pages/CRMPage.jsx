import { useLeads, useCreateLead, useUpdateLead, useConvertLeadToClient } from '../hooks/useData'
import { Card, Loader, EmptyState, Badge, Btn, fmtR } from '../components/ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ETAPAS = [
  { id:'novo',        label:'Lead novo',   color:'#94A3B8' },
  { id:'contato',     label:'Contato',     color:'#8B5CF6' },
  { id:'diagnostico', label:'Diagnóstico', color:'#06B6D4' },
  { id:'proposta',    label:'Proposta',    color:'#F59E0B' },
  { id:'fechado',     label:'Fechado',     color:'#22C55E' },
  { id:'perdido',     label:'Perdido',     color:'#EF4444' },
]

function formatCNPJ(v) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function displayCNPJ(raw = '') {
  const d = raw.replace(/\D/g, '')
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export default function CRMPage() {
  const { data: leads = [], isLoading } = useLeads()
  const create  = useCreateLead()
  const update  = useUpdateLead()
  const convert = useConvertLeadToClient()
  const nav     = useNavigate()

  const [modal, setModal]             = useState(false)   // 'new' | 'edit' | false
  const [form, setForm]               = useState({})
  const [editId, setEditId]           = useState(null)
  const [erro, setErro]               = useState('')
  const [cnpjBusy, setCnpjBusy]       = useState(false)
  const [cnpjErro, setCnpjErro]       = useState('')
  const [convertErro, setConvertErro] = useState('')

  if (isLoading) return <Loader />

  const totalPrev = leads
    .filter(l => l.etapa !== 'perdido')
    .reduce((a, l) => a + (l.valor_estimado || 0), 0)

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function openNew() {
    setEditId(null)
    setForm({})
    setErro('')
    setCnpjErro('')
    setModal('new')
  }

  function openEdit(lead) {
    setEditId(lead.id)
    setForm({
      nome:           lead.nome           || '',
      fantasia:       lead.fantasia        || '',
      cnpj:           lead.cnpj ? formatCNPJ(lead.cnpj) : '',
      contato:        lead.contato         || '',
      whatsapp:       lead.whatsapp        || '',
      segmento:       lead.segmento        || '',
      valor_estimado: lead.valor_estimado  || '',
      etapa:          lead.etapa           || 'novo',
    })
    setErro('')
    setCnpjErro('')
    setModal('edit')
  }

  function closeModal() {
    setModal(false)
    setForm({})
    setEditId(null)
    setErro('')
    setCnpjErro('')
  }

  async function buscarCNPJ() {
    const cnpj = (form.cnpj || '').replace(/\D/g, '')
    if (cnpj.length !== 14) { setCnpjErro('CNPJ inválido — deve ter 14 dígitos'); return }
    setCnpjErro('')
    setCnpjBusy(true)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      if (!res.ok) throw new Error('CNPJ não encontrado na Receita Federal')
      const d = await res.json()
      const segmento = d.cnae_fiscal_descricao || d.descricao_atividade_principal?.[0]?.text || ''
      setForm(f => ({
        ...f,
        nome:     d.razao_social  || f.nome,
        fantasia: d.nome_fantasia || '',
        segmento: segmento.slice(0, 80),
        contato:  d.nome_fantasia || d.razao_social || f.contato || '',
        whatsapp: d.ddd_telefone_1
          ? d.ddd_telefone_1.replace(/\D/g, '').replace(/^(\d{2})(\d+)/, '($1) $2')
          : f.whatsapp || '',
      }))
    } catch (e) {
      setCnpjErro(e.message || 'Erro ao consultar Receita Federal')
    } finally {
      setCnpjBusy(false)
    }
  }

  async function save() {
    if (!form.nome) { setErro('Informe o nome / empresa'); return }
    setErro('')
    const cnpjDigits = (form.cnpj || '').replace(/\D/g, '')
    const payload = {
      nome:           form.nome,
      ...(cnpjDigits    ? { cnpj: cnpjDigits }         : {}),
      ...(form.fantasia ? { fantasia: form.fantasia }   : {}),
      contato:        form.contato   || '',
      whatsapp:       form.whatsapp  || '',
      segmento:       form.segmento  || '',
      valor_estimado: parseFloat(form.valor_estimado) || 0,
    }
    try {
      if (modal === 'edit') {
        await update.mutateAsync({ id: editId, ...payload, etapa: form.etapa })
      } else {
        await create.mutateAsync({ ...payload, etapa: 'novo' })
      }
      closeModal()
    } catch (e) {
      setErro(e?.message || 'Erro ao salvar. Tente novamente.')
    }
  }

  async function handleConvert(lead) {
    if (!window.confirm(`Converter "${lead.nome}" em cliente? Os dados serão copiados para a aba Clientes.`)) return
    setConvertErro('')
    try {
      await convert.mutateAsync(lead)
      window.location.href = '/clientes'
    } catch (e) {
      setConvertErro(e?.message || 'Erro ao converter. Tente novamente.')
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
    borderRadius: 8, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const labelStyle = {
    fontSize: 10, fontWeight: 700, color: '#94A3B8', display: 'block',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em',
  }
  const isSaving = create.isPending || update.isPending

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#64748B' }}>
          Receita prevista: <strong style={{ color: '#15803D' }}>{fmtR(totalPrev)}</strong>
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="primary" onClick={openNew}>+ Novo lead</Btn>
      </div>

      {convertErro && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>
          ⚠ {convertErro}
        </div>
      )}

      {/* Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, overflowX: 'auto' }}>
        {ETAPAS.map(et => {
          const etLeads = leads.filter(l =>
            et.id === 'fechado'
              ? (l.etapa === 'fechado' || l.etapa === 'convertido')
              : l.etapa === et.id
          )
          return (
            <div key={et.id} style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: et.color }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', flex: 1 }}>{et.label}</span>
                <span style={{ fontSize: 9, background: '#E2E8F0', color: '#475569', padding: '1px 5px', borderRadius: 99 }}>{etLeads.length}</span>
              </div>
              <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 80 }}>
                {etLeads.map(l => {
                  const isConvertido = l.etapa === 'convertido'
                  return (
                    <div key={l.id} style={{
                      background: '#fff', borderRadius: 8, padding: '8px 10px',
                      border: isConvertido ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                      fontSize: 11,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 2, flex: 1 }}>{l.nome}</div>
                        {!isConvertido && (
                          <button
                            onClick={() => openEdit(l)}
                            title="Editar lead"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 11, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>
                            ✎
                          </button>
                        )}
                      </div>
                      {l.cnpj && (
                        <div style={{ color: '#94A3B8', fontSize: 9, marginBottom: 2, fontFamily: 'monospace' }}>
                          {displayCNPJ(l.cnpj)}
                        </div>
                      )}
                      {l.segmento && <div style={{ color: '#94A3B8', fontSize: 10 }}>{l.segmento}</div>}
                      {l.valor_estimado > 0 && (
                        <div style={{ color: '#15803D', fontWeight: 600, fontSize: 10, marginTop: 4 }}>
                          {fmtR(l.valor_estimado)}/mês
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                        {et.id !== 'fechado' && et.id !== 'perdido' && (
                          <button onClick={() => {
                            const nextIdx = ETAPAS.findIndex(e => e.id === et.id) + 1
                            if (nextIdx < ETAPAS.length) update.mutate({ id: l.id, etapa: ETAPAS[nextIdx].id })
                          }} style={{ fontSize: 9, padding: '2px 6px', border: '1px solid #E2E8F0', borderRadius: 5, cursor: 'pointer', background: '#fff', color: '#475569' }}>
                            Avançar →
                          </button>
                        )}
                        {et.id === 'fechado' && !isConvertido && (
                          <button
                            onClick={() => handleConvert(l)}
                            disabled={convert.isPending}
                            style={{ fontSize: 9, padding: '2px 8px', border: '1px solid #22C55E', borderRadius: 5, cursor: 'pointer', background: '#F0FDF4', color: '#15803D', fontWeight: 600 }}>
                            ✦ Converter em cliente
                          </button>
                        )}
                        {isConvertido && (
                          <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 5, background: '#DCFCE7', color: '#15803D', fontWeight: 700 }}>
                            ✓ Cliente ativo
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal novo / editar lead */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 480, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              {modal === 'edit' ? 'Editar lead' : 'Novo lead'}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 20 }}>
              {modal === 'edit'
                ? 'Atualize os dados do lead.'
                : 'Informe o CNPJ para buscar os dados automaticamente, ou preencha manualmente.'}
            </div>

            {/* CNPJ com busca */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>CNPJ</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={form.cnpj || ''}
                  onChange={e => { setCnpjErro(''); setF('cnpj', formatCNPJ(e.target.value)) }}
                  onKeyDown={e => e.key === 'Enter' && buscarCNPJ()}
                  placeholder="00.000.000/0001-00"
                  style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                />
                <button
                  onClick={buscarCNPJ}
                  disabled={cnpjBusy}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: 'none', cursor: cnpjBusy ? 'not-allowed' : 'pointer',
                    background: cnpjBusy ? '#E2E8F0' : '#6366F1', color: '#fff', fontSize: 12, fontWeight: 700,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  {cnpjBusy ? 'Buscando…' : '🔍 Buscar'}
                </button>
              </div>
              {cnpjErro && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{cnpjErro}</div>}
            </div>

            <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0 14px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['nome',     'Razão Social / Nome *'],
                ['fantasia', 'Nome Fantasia'],
                ['contato',  'Nome do Contato'],
                ['whatsapp', 'WhatsApp'],
                ['segmento', 'Segmento / Atividade'],
              ].map(([k, l]) => (
                <div key={k}>
                  <label style={labelStyle}>{l}</label>
                  <input value={form[k] || ''} onChange={e => setF(k, e.target.value)} style={inputStyle} />
                </div>
              ))}

              <div>
                <label style={labelStyle}>MRR estimado (R$)</label>
                <input
                  type="number"
                  value={form.valor_estimado || ''}
                  onChange={e => setF('valor_estimado', e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>

              {modal === 'edit' && (
                <div>
                  <label style={labelStyle}>Etapa</label>
                  <select value={form.etapa || 'novo'} onChange={e => setF('etapa', e.target.value)} style={inputStyle}>
                    {ETAPAS.map(et => (
                      <option key={et.id} value={et.id}>{et.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {erro && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>
                {erro}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <Btn onClick={closeModal}>Cancelar</Btn>
              <Btn variant="primary" onClick={save} disabled={isSaving}>
                {isSaving ? 'Salvando…' : modal === 'edit' ? 'Salvar alterações' : 'Salvar lead'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
