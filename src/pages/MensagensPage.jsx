import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useClients } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { Loader } from '../components/ui'

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const hoje = new Date()
  if (d.toDateString() === hoje.toDateString()) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function Avatar({ nome, size = 40 }) {
  const initials = (nome || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444']
  const color = colors[(nome || '').charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
    }}>{initials}</div>
  )
}

function DocChip({ msg }) {
  const cores = { boleto: '#EF4444', nf: '#8B5CF6', contrato: '#F59E0B', recibo: '#14B8A6', outro: '#64748B' }
  const icons = { boleto: '🏦', nf: '🧾', contrato: '📋', recibo: '✅', outro: '📎' }
  const tipo = msg.ai_tipo_doc || 'outro'
  return (
    <div style={{ background: '#F8FAFC', border: `1px solid ${cores[tipo]}33`, borderRadius: 8, padding: '8px 12px', marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span>{icons[tipo]}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cores[tipo], textTransform: 'uppercase' }}>{tipo}</span>
        {msg.ai_valor && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', marginLeft: 'auto' }}>
            R$ {Number(msg.ai_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
      {msg.ai_resumo && <div style={{ fontSize: 11, color: '#64748B' }}>{msg.ai_resumo}</div>}
      {msg.ai_vencimento && (
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
          Vencimento: {new Date(msg.ai_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
        </div>
      )}
    </div>
  )
}

// ─── Modal: Criar tarefa a partir de mensagem ──────────────────────────────

function ModalCriarTarefa({ msg, contato, onClose, onSuccess }) {
  const { empresa } = useAuthStore()
  const { data: clients = [] } = useClients()
  const [form, setForm] = useState({
    titulo: msg.ai_resumo || (msg.corpo ? msg.corpo.slice(0, 80) : 'Tarefa do WhatsApp'),
    cliente_id: contato.cliente_id || '',
    prazo: msg.ai_vencimento || '',
    prioridade: 'media',
    observacao: msg.corpo || '',
  })
  const [saving, setSaving] = useState(false)

  const fi = { width: '100%', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }

  async function salvar() {
    if (!form.titulo) return alert('Título obrigatório')
    setSaving(true)
    try {
      const { data: tarefa, error } = await supabase
        .from('tarefas_avulsas')
        .insert({
          titulo: form.titulo,
          empresa_id: empresa?.id,
          cliente_id: form.cliente_id || null,
          prazo: form.prazo || null,
          prioridade: form.prioridade,
          observacao: form.observacao,
          status: 'aberta',
        })
        .select()
        .single()

      if (error) throw error

      // Marca mensagem como transformada em tarefa
      await supabase.from('whatsapp_mensagens')
        .update({ tarefa_id: tarefa.id })
        .eq('id', msg.id)

      onSuccess(tarefa)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Criar tarefa</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>A partir da mensagem de {contato.nome || contato.phone}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>

        {msg.midia_url && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 11, color: '#15803D', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📎</span>
            <span>Anexo do WhatsApp será vinculado à tarefa</span>
            {msg.ai_valor && <strong style={{ marginLeft: 'auto' }}>R$ {Number(msg.ai_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>Título *</label>
            <input style={fi} value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>Cliente</label>
            <select style={fi} value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
              <option value="">— Sem cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>Prazo</label>
              <input type="date" style={fi} value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>Prioridade</label>
              <select style={fi} value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}>
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🟢 Baixa</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>Observação</label>
            <textarea style={{ ...fi, resize: 'vertical', minHeight: 60 }} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
            {saving ? 'Salvando…' : '✓ Criar tarefa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Agendar mensagem ───────────────────────────────────────────────

function ModalAgendar({ contato, onClose }) {
  const { empresa, usuario } = useAuthStore()
  const [corpo, setCorpo] = useState('')
  const [enviarEm, setEnviarEm] = useState('')
  const [saving, setSaving] = useState(false)

  async function agendar() {
    if (!corpo.trim()) return alert('Escreva a mensagem')
    if (!enviarEm) return alert('Defina a data e hora')
    setSaving(true)
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: { action: 'schedule', contato_id: contato.id, empresa_id: empresa?.id, corpo, enviar_em: enviarEm, criado_por: usuario?.id }
      })
      if (error || data?.error) throw new Error(data?.error || error?.message)
      onClose()
      alert('Mensagem agendada com sucesso!')
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const fi = { width: '100%', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>⏰</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Agendar mensagem</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Para: {contato.nome || contato.phone}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>Mensagem *</label>
            <textarea style={{ ...fi, resize: 'vertical', minHeight: 80 }} value={corpo} onChange={e => setCorpo(e.target.value)} placeholder="Digite a mensagem que será enviada..." />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>Enviar em *</label>
            <input type="datetime-local" style={fi} value={enviarEm} onChange={e => setEnviarEm(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={agendar} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#8B5CF6', color: '#fff', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
            {saving ? 'Agendando…' : '⏰ Agendar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────

export default function MensagensPage() {
  const { empresa } = useAuthStore()
  const qc = useQueryClient()
  const [contatoAtivo, setContatoAtivo] = useState(null)
  const [textoEnvio, setTextoEnvio] = useState('')
  const [modalTarefa, setModalTarefa] = useState(null)  // mensagem selecionada
  const [modalAgendar, setModalAgendar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const msgEndRef = useRef(null)

  // Lista de contatos
  const { data: contatos = [], isLoading } = useQuery({
    queryKey: ['wa_contatos', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_contatos')
        .select('*')
        .eq('empresa_id', empresa?.id)
        .order('ultimo_msg_em', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!empresa?.id,
    refetchInterval: 15000,
  })

  // Mensagens do contato ativo
  const { data: mensagens = [] } = useQuery({
    queryKey: ['wa_mensagens', contatoAtivo?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('contato_id', contatoAtivo.id)
        .order('enviado_em', { ascending: true })
      if (error) throw error
      // Marca como lidas
      await supabase.from('whatsapp_mensagens')
        .update({ lida: true })
        .eq('contato_id', contatoAtivo.id)
        .eq('lida', false)
      return data
    },
    enabled: !!contatoAtivo?.id,
    refetchInterval: 8000,
  })

  // Conta não lidas por contato
  const naoLidasPorContato = {}
  for (const m of mensagens) {
    if (!m.lida && m.direcao === 'recebida') {
      naoLidasPorContato[m.contato_id] = (naoLidasPorContato[m.contato_id] || 0) + 1
    }
  }

  // Scroll automático para última mensagem
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  // Enviar mensagem
  async function enviar() {
    if (!textoEnvio.trim() || !contatoAtivo) return
    setEnviando(true)
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: { action: 'send', contato_id: contatoAtivo.id, empresa_id: empresa?.id, corpo: textoEnvio }
      })
      if (error || data?.error) throw new Error(data?.error || error?.message)
      setTextoEnvio('')
      qc.invalidateQueries({ queryKey: ['wa_mensagens', contatoAtivo.id] })
      qc.invalidateQueries({ queryKey: ['wa_contatos'] })
    } catch (e) {
      alert('Erro ao enviar: ' + e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (isLoading) return <Loader />

  const semConfig = contatos.length === 0

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 0, background: '#F8FAFC', borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0' }}>

      {/* ── Lista de contatos ──────────────────────────────────────────── */}
      <div style={{ width: 300, borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', background: '#fff', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Mensagens</div>
            <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} title="WhatsApp conectado" />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {semConfig ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>WhatsApp não configurado</div>
              <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
                Configure suas credenciais da Meta API em Configurações → Integrações para começar a receber mensagens.
              </div>
            </div>
          ) : (
            contatos.map(ct => {
              const ativo = contatoAtivo?.id === ct.id
              const naoLidas = naoLidasPorContato[ct.id] || 0
              return (
                <div
                  key={ct.id}
                  onClick={() => setContatoAtivo(ct)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    cursor: 'pointer', background: ativo ? '#F0F0FF' : 'transparent',
                    borderLeft: ativo ? '3px solid #6366F1' : '3px solid transparent',
                    transition: 'background .15s',
                  }}
                >
                  <Avatar nome={ct.nome || ct.phone} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ct.nome || ct.phone}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>{ct.phone}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ fontSize: 9, color: '#94A3B8' }}>{fmtTime(ct.ultimo_msg_em)}</div>
                    {naoLidas > 0 && (
                      <div style={{ background: '#22C55E', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 999, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>{naoLidas}</div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Área de conversa ───────────────────────────────────────────── */}
      {contatoAtivo ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header do contato */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar nome={contatoAtivo.nome || contatoAtivo.phone} size={36} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{contatoAtivo.nome || contatoAtivo.phone}</div>
              <div style={{ fontSize: 10, color: '#94A3B8' }}>{contatoAtivo.phone}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button
                onClick={() => setModalAgendar(true)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#64748B' }}
              >⏰ Agendar</button>
            </div>
          </div>

          {/* Mensagens */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC' }}>
            {mensagens.map(msg => {
              const enviada = msg.direcao === 'enviada'
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: enviada ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6 }}>
                  {!enviada && <Avatar nome={contatoAtivo.nome} size={26} />}
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{
                      background: enviada ? '#6366F1' : '#fff',
                      color: enviada ? '#fff' : '#0F172A',
                      borderRadius: enviada ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '8px 12px',
                      fontSize: 12,
                      boxShadow: '0 1px 3px rgba(0,0,0,.08)',
                      border: enviada ? 'none' : '1px solid #E2E8F0',
                      position: 'relative',
                    }}>
                      {/* Imagem */}
                      {msg.tipo === 'image' && msg.midia_url && (
                        <img src={msg.midia_url} alt="imagem" style={{ maxWidth: 220, borderRadius: 8, display: 'block', marginBottom: msg.corpo ? 6 : 0 }} />
                      )}
                      {/* Documento */}
                      {msg.tipo === 'document' && msg.midia_url && (
                        <a href={msg.midia_url} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, color: enviada ? '#fff' : '#6366F1', fontSize: 11, textDecoration: 'none', marginBottom: msg.corpo ? 4 : 0 }}>
                          <span>📄</span>
                          <span style={{ textDecoration: 'underline' }}>{msg.midia_nome || 'Documento'}</span>
                        </a>
                      )}
                      {/* Audio */}
                      {msg.tipo === 'audio' && msg.midia_url && (
                        <audio controls src={msg.midia_url} style={{ maxWidth: 200, marginBottom: msg.corpo ? 4 : 0 }} />
                      )}
                      {/* Texto */}
                      {msg.corpo && <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.corpo}</div>}
                      {/* IA chip (só para documentos recebidos) */}
                      {!enviada && msg.ai_tipo_doc && <DocChip msg={msg} />}
                      {/* Criar tarefa */}
                      {!enviada && !msg.tarefa_id && (
                        <button
                          onClick={() => setModalTarefa(msg)}
                          style={{
                            marginTop: 6, padding: '3px 8px', borderRadius: 6,
                            border: '1px solid #E2E8F0', background: '#F8FAFC',
                            fontSize: 10, color: '#6366F1', cursor: 'pointer',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >📋 Criar tarefa</button>
                      )}
                      {!enviada && msg.tarefa_id && (
                        <div style={{ marginTop: 4, fontSize: 9, color: '#94A3B8' }}>✓ Tarefa criada</div>
                      )}
                    </div>
                    <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2, textAlign: enviada ? 'right' : 'left' }}>{fmtTime(msg.enviado_em)}</div>
                  </div>
                </div>
              )
            })}
            <div ref={msgEndRef} />
          </div>

          {/* Input de envio */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', background: '#fff', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={textoEnvio}
              onChange={e => setTextoEnvio(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
              placeholder="Digite uma mensagem... (Enter para enviar)"
              rows={1}
              style={{
                flex: 1, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 12,
                fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none',
                maxHeight: 100, overflowY: 'auto', lineHeight: 1.4,
              }}
            />
            <button
              onClick={enviar}
              disabled={enviando || !textoEnvio.trim()}
              style={{
                padding: '8px 14px', borderRadius: 12, border: 'none',
                background: enviando || !textoEnvio.trim() ? '#E2E8F0' : '#6366F1',
                color: enviando || !textoEnvio.trim() ? '#94A3B8' : '#fff',
                fontWeight: 700, fontSize: 13, cursor: enviando ? 'not-allowed' : 'pointer',
                transition: 'background .15s',
              }}
            >{enviando ? '…' : '→'}</button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94A3B8' }}>
          <span style={{ fontSize: 48 }}>💬</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B' }}>Selecione uma conversa</div>
          <div style={{ fontSize: 12 }}>Escolha um contato à esquerda para ver as mensagens</div>
        </div>
      )}

      {/* Modais */}
      {modalTarefa && (
        <ModalCriarTarefa
          msg={modalTarefa}
          contato={contatoAtivo}
          onClose={() => setModalTarefa(null)}
          onSuccess={() => {
            setModalTarefa(null)
            qc.invalidateQueries({ queryKey: ['wa_mensagens'] })
            qc.invalidateQueries({ queryKey: ['avulsas'] })
          }}
        />
      )}
      {modalAgendar && (
        <ModalAgendar
          contato={contatoAtivo}
          onClose={() => setModalAgendar(false)}
        />
      )}
    </div>
  )
}
