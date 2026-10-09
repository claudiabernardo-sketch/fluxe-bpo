import { useEffect, useState } from 'react'

// O Fluxe é uma página única: quem deixa a aba aberta o dia todo continua
// rodando a versão antiga depois de uma publicação, e só vê as mudanças (por
// exemplo uma aba liberada pro perfil dela) depois de recarregar. Aqui o app
// compara o arquivo principal carregado com o que está no ar agora, ao voltar
// pra aba e a cada 10 minutos, e avisa que tem versão nova.
const nomeDoBundle = texto => texto.match(/assets\/(index-[^"'/.]+)\.js/)?.[1] || null

export default function AvisoNovaVersao() {
  const [nova, setNova] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) return
    const atual = nomeDoBundle([...document.scripts].map(s => s.src).join(' '))
    if (!atual) return

    async function checar() {
      if (document.visibilityState === 'hidden') return
      try {
        const res = await fetch('/?v=' + Date.now(), { cache: 'no-store' })
        if (!res.ok) return
        const publicado = nomeDoBundle(await res.text())
        if (publicado && publicado !== atual) setNova(true)
      } catch { /* sem rede: tenta de novo na próxima */ }
    }

    const intervalo = setInterval(checar, 10 * 60 * 1000)
    window.addEventListener('focus', checar)
    document.addEventListener('visibilitychange', checar)
    return () => {
      clearInterval(intervalo)
      window.removeEventListener('focus', checar)
      document.removeEventListener('visibilitychange', checar)
    }
  }, [])

  if (!nova) return null
  return (
    <div role="status" style={{
      position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', zIndex: 3000,
      background: '#1E1B4B', color: '#fff', borderRadius: 12, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 10px 30px rgba(0,0,0,.28)',
      fontSize: 13, maxWidth: '92vw',
    }}>
      <span>Tem uma versão nova do Fluxe com melhorias.</span>
      <button onClick={() => window.location.reload()}
        style={{ border: 'none', background: '#6366F1', color: '#fff', fontWeight: 700, fontSize: 12, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        Atualizar agora
      </button>
    </div>
  )
}
