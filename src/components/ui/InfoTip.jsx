import { useState } from 'react'

// ── InfoTip ──────────────────────────────────────────────────────────────
// Ícone ⓘ que, ao clicar, abre um balão com uma explicação — usado pra
// documentar campos/áreas de tela sem poluir o layout. Clique (não hover)
// porque tooltip nativo do navegador (`title`) fica pequeno demais e some
// rápido, difícil de ler.
export default function InfoTip({ text, width = 240 }) {
  const [open, setOpen] = useState(false)

  return (
    <span style={{ position:'relative', display:'inline-flex', verticalAlign:'middle' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        style={{
          border:'none', background:'var(--s2, #F1F5F9)', color:'var(--tx3)', cursor:'pointer',
          width:16, height:16, borderRadius:'50%', fontSize:11, lineHeight:1,
          display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0, flexShrink:0,
        }}
        aria-label="Ver explicação"
      >i</button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:1199 }} />
          <div style={{
            position:'absolute', top:'calc(100% + 8px)', left:0, zIndex:1200,
            width, maxWidth:'80vw', padding:'10px 12px', borderRadius:10,
            background:'var(--sur)', border:'1px solid var(--bo)', boxShadow:'0 8px 24px rgba(0,0,0,.18)',
            fontSize:12, lineHeight:1.5, color:'var(--tx)', fontWeight:400, textTransform:'none',
            letterSpacing:'normal', whiteSpace:'normal',
          }}>
            {text}
          </div>
        </>
      )}
    </span>
  )
}
