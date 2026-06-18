import { useAuthStore } from '../../store/authStore'

export default function TrialGuard() {
  const { empresa, signOut } = useAuthStore()
  if (!empresa) return null

  const plano = empresa.plano || 'trial'
  const paymentUrl = empresa.asaas_payment_url

  // Trial expirou mas Asaas ainda não criou cobrança (janela de processamento ~8h)
  const trialManualExp = plano === 'trial' && empresa.trial_expira_em && new Date(empresa.trial_expira_em) < new Date()

  // Asaas já criou a cobrança ou bloqueou
  const bloqueado     = plano === 'bloqueado'
  const aguardando    = plano === 'trial_expirado'

  if (!trialManualExp && !bloqueado && !aguardando) return null

  // ── Conteúdo do overlay ─────────────────────────────────────────

  const isBloqueado = bloqueado
  const diasAtras   = trialManualExp && empresa.trial_expira_em
    ? Math.max(0, Math.ceil((new Date() - new Date(empresa.trial_expira_em)) / (1000*60*60*24)))
    : 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: 24,
    }}>
      <div style={{
        background: '#1E293B',
        border: '1px solid #334155',
        borderRadius: 20,
        padding: '48px 40px',
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
      }}>

        {/* Ícone */}
        <div style={{
          width: 72, height: 72,
          background: isBloqueado ? 'rgba(239,68,68,.15)' : 'rgba(251,191,36,.15)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 32,
        }}>
          {isBloqueado ? '🔒' : '⏰'}
        </div>

        {/* Título */}
        <h1 style={{ color: '#F1F5F9', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          {isBloqueado
            ? 'Acesso suspenso'
            : 'Seu período de teste encerrou'}
        </h1>

        {/* Descrição */}
        <p style={{ color: '#94A3B8', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
          {isBloqueado
            ? 'Identificamos uma pendência no pagamento. Regularize para continuar usando o Fluxe BPO.'
            : aguardando
              ? 'Geramos sua cobrança automática. Pague para continuar — seus dados estão seguros.'
              : diasAtras > 0
                ? `Seu trial expirou há ${diasAtras} ${diasAtras === 1 ? 'dia' : 'dias'}. Continue sem perder nenhum dado.`
                : 'Os 14 dias de teste chegaram ao fim. Continue com o Fluxe BPO.'}
        </p>

        {/* Preço */}
        <div style={{
          background: '#0F172A',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
          border: '1px solid #334155',
        }}>
          <p style={{ color: '#64748B', fontSize: 13, marginBottom: 4 }}>Plano Essencial</p>
          <p style={{ color: '#F1F5F9', fontSize: 36, fontWeight: 800, lineHeight: 1 }}>
            R$ 59<span style={{ fontSize: 18, fontWeight: 400, color: '#94A3B8' }}>/mês</span>
          </p>
          <p style={{ color: '#64748B', fontSize: 12, marginTop: 8 }}>Boleto, PIX ou cartão</p>
        </div>

        {/* Botão de pagamento */}
        {paymentUrl ? (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#fff',
              borderRadius: 10,
              padding: '14px 24px',
              fontSize: 16,
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: 12,
            }}
          >
            Pagar agora →
          </a>
        ) : (
          <a
            href={`https://wa.me/5511917101173?text=Quero+ativar+o+Fluxe+BPO+-+Empresa:+${encodeURIComponent(empresa.nome || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#fff',
              borderRadius: 10,
              padding: '14px 24px',
              fontSize: 16,
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: 12,
            }}
          >
            Ativar meu plano →
          </a>
        )}

        {/* Suporte */}
        <a
          href="https://wa.me/5511917101173?text=Preciso+de+ajuda+com+o+pagamento+do+Fluxe+BPO"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', color: '#818CF8', fontSize: 14, textDecoration: 'none', marginBottom: 24 }}
        >
          Dúvidas? Fale no WhatsApp
        </a>

        {/* Sair */}
        <button
          onClick={signOut}
          style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer' }}
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}
