import { useAuthStore } from '../store/authStore'

export default function PagamentoPage() {
  const { empresa, signOut } = useAuthStore()
  const paymentUrl = empresa?.asaas_payment_url
  const plano      = empresa?.plano

  const isBloqueado     = plano === 'bloqueado'
  const isTrialExpirado = plano === 'trial_expirado'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
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
          margin: '0 auto 24px',
          fontSize: 32,
        }}>
          {isBloqueado ? '🔒' : '⏰'}
        </div>

        {/* Título */}
        <h1 style={{ color: '#F1F5F9', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          {isBloqueado ? 'Acesso suspenso' : 'Seu período de teste encerrou'}
        </h1>

        {/* Subtítulo */}
        <p style={{ color: '#94A3B8', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
          {isBloqueado
            ? 'Identificamos uma pendência no seu pagamento. Regularize para continuar usando o Fluxe BPO.'
            : 'Os 14 dias de teste gratuito chegaram ao fim. Continue usando o Fluxe BPO — sem perder nenhum dado cadastrado.'}
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
            R$ 97<span style={{ fontSize: 18, fontWeight: 400, color: '#94A3B8' }}>/mês</span>
          </p>
          <p style={{ color: '#64748B', fontSize: 12, marginTop: 8 }}>
            Boleto, PIX ou cartão de crédito
          </p>
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
          <div style={{
            background: '#0F172A',
            borderRadius: 10,
            padding: '14px 24px',
            marginBottom: 12,
            color: '#64748B',
            fontSize: 14,
          }}>
            Gerando link de pagamento… aguarde alguns minutos ou contate o suporte.
          </div>
        )}

        {/* Suporte */}
        <a
          href="https://wa.me/5511917101173?text=Preciso+de+ajuda+com+o+pagamento+do+Fluxe+BPO"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', color: '#818CF8', fontSize: 14, textDecoration: 'none', marginBottom: 24 }}
        >
          Precisa de ajuda? Fale conosco no WhatsApp
        </a>

        {/* Sair */}
        <button
          onClick={signOut}
          style={{
            background: 'none',
            border: 'none',
            color: '#475569',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}
