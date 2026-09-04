import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import LOGO_SRC from '../../../assets/logo-fluxe.png'

export const INDIGO = '#4F46E5'
export const AMBER = '#D97706'
export const GREEN = '#16A34A'
export const RED = '#DC2626'
export const INK = '#0F172A'

export function Passos({ itens, cols = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
      {itens.map((p, i) => (
        <div key={p} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: INDIGO, color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{i + 1}</div>
          <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>{p}</div>
        </div>
      ))}
    </div>
  )
}

export function Callout({ label, labelColor = '#A5B4FC', children, bg = 'rgba(255,255,255,.08)', border }) {
  return (
    <div style={{ background: bg, border: border ? `1px solid ${border}` : 'none', borderRadius: 10, padding: '16px 20px' }}>
      {label && <div style={{ color: labelColor, fontWeight: 800, fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ color: '#fff', fontSize: 15, lineHeight: 1.55 }}>{children}</div>
    </div>
  )
}

export function Eyebrow({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: '#A5B4FC', letterSpacing: 3, marginBottom: 14, textAlign: 'center' }}>{children}</div>
}

export function Codigo({ children }) {
  return (
    <pre style={{
      background: '#020617', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '14px 18px',
      color: '#A5F3FC', fontSize: 12.5, lineHeight: 1.6, fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
      whiteSpace: 'pre-wrap', margin: 0, textAlign: 'left',
    }}>{children}</pre>
  )
}

// Casco reutilizável de apresentação em tela cheia: logo, navegação por
// teclado/setas, dots de progresso. Cada aula só precisa definir os slides.
export function ApresentacaoShell({ slides }) {
  const navigate = useNavigate()
  const [i, setI] = useState(0)

  const proxima = useCallback(() => setI(n => Math.min(slides.length - 1, n + 1)), [slides.length])
  const anterior = useCallback(() => setI(n => Math.max(0, n - 1)), [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); proxima() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); anterior() }
      if (e.key === 'Escape') navigate('/materiais-apoio')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [proxima, anterior, navigate])

  const Slide = slides[i].render

  return (
    <div style={{
      position: 'fixed', inset: 0, background: `linear-gradient(135deg, ${INK}, #1E1B4B)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 80px', zIndex: 1000,
    }}>
      <button onClick={() => navigate('/materiais-apoio')} style={{
        position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,.1)', border: 'none',
        color: '#fff', fontSize: 20, width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
      }} title="Sair (Esc)">×</button>

      <div style={{ position: 'absolute', top: 20, left: 32, background: '#fff', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
        <img src={LOGO_SRC} alt="Fluxe" style={{ height: 20, width: 'auto' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Slide />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }}>
        <button onClick={anterior} disabled={i === 0} style={{
          background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%',
          cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: 18,
        }}>←</button>
        <div style={{ display: 'flex', gap: 6 }}>
          {slides.map((_, idx) => (
            <div key={idx} onClick={() => setI(idx)} style={{
              width: idx === i ? 20 : 7, height: 7, borderRadius: 99, cursor: 'pointer',
              background: idx === i ? '#818CF8' : 'rgba(255,255,255,.25)', transition: 'all .2s',
            }} />
          ))}
        </div>
        <button onClick={proxima} disabled={i === slides.length - 1} style={{
          background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%',
          cursor: i === slides.length - 1 ? 'default' : 'pointer', opacity: i === slides.length - 1 ? 0.3 : 1, fontSize: 18,
        }}>→</button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 10 }}>{i + 1} / {slides.length} · setas do teclado ou espaço pra avançar</div>
    </div>
  )
}
