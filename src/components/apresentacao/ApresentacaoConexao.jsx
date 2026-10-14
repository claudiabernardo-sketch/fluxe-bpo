import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Modelo visual das aulas "Construindo relatórios que geram decisão"
// (DRE, Fluxo de Caixa…), no estilo dos materiais da Conexão BPO: azul
// marinho, título serifado com itálico, tabela Etapa / O que é / Pergunta.
// Cada aula só passa a lista de slides (dados); o layout fica aqui.

const NAVY = '#0B2A5B'
const NAVY2 = '#071C3F'
const AZUL = '#1E9BFF'
const AZUL_CLARO = '#BFDDF7'
const PAPEL = '#F4F8FD'
const TINTA = '#0B2A5B'
const SERIF = '"Cormorant Garamond", Georgia, serif'
const SANS = 'Montserrat, "Segoe UI", system-ui, sans-serif'

function Topo({ escuro, rotulo }) {
  const cor = escuro ? 'rgba(255,255,255,.55)' : '#64748B'
  return (
    <div style={{ position: 'absolute', top: 28, left: 48, right: 48, display: 'flex', alignItems: 'center', gap: 16, fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: cor }}>
      <span>{rotulo}</span>
      <span style={{ flex: 1, height: 1, background: escuro ? 'rgba(255,255,255,.25)' : '#CBD5E1' }} />
      <span>CONEXÃO BPO</span>
    </div>
  )
}

function TituloDuplo({ normal, italico, escuro, tamanho = 40 }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      {normal && <div style={{ fontFamily: SANS, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', fontSize: tamanho * 0.48, color: escuro ? '#fff' : TINTA }}>{normal}</div>}
      {italico && <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: tamanho, lineHeight: 1.05, color: escuro ? AZUL_CLARO : AZUL }}>{italico}</div>}
    </div>
  )
}

function Capa({ s }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(900px 600px at 80% 30%, #12407F 0%, ${NAVY} 55%, ${NAVY2} 100%)`, display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ height: '100%', position: 'relative' }}>
        <img src={s.foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(11,42,91,0) 55%, ${NAVY} 100%)` }} />
      </div>
      <div style={{ padding: '0 64px' }}>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: 4, color: AZUL_CLARO, marginBottom: 18 }}>CONEXÃO BPO · {s.rotulo}</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: s.tituloTamanho || 120, lineHeight: .95, color: '#fff' }}>{s.titulo}</div>
        <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, letterSpacing: 5, color: AZUL, marginTop: 22, textTransform: 'uppercase', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{s.sub}</div>
      </div>
    </div>
  )
}

function Frase({ s }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})`, display: 'grid', placeItems: 'center', padding: '0 120px' }}>
      <Topo escuro rotulo={s.rotulo} />
      <div style={{ textAlign: 'center', maxWidth: 1000 }}>
        <div style={{ fontFamily: SERIF, fontSize: 46, lineHeight: 1.3, color: '#fff' }}>
          {s.texto}{' '}<span style={{ fontStyle: 'italic', fontWeight: 700, color: AZUL_CLARO }}>{s.destaque}</span>
        </div>
      </div>
    </div>
  )
}

function Lista({ s }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: PAPEL, padding: '90px 80px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Topo rotulo={s.rotulo} />
      <TituloDuplo normal={s.titulo} italico={s.italico} />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.itens.length}, 1fr)`, gap: 18, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {s.itens.map((t, i) => (
          <div key={t} style={{ background: '#fff', borderRadius: 18, padding: '22px 20px', boxShadow: '0 14px 34px -22px rgba(11,42,91,.5)', borderTop: `4px solid ${AZUL}` }}>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, fontWeight: 700, color: AZUL, lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ fontFamily: SANS, fontSize: 15.5, color: TINTA, marginTop: 10, lineHeight: 1.5 }}>{t}</div>
          </div>
        ))}
      </div>
      {s.virada && (
        <div style={{ maxWidth: 1100, margin: '24px auto 0', width: '100%', background: NAVY, color: '#fff', borderRadius: 18, padding: '18px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 800, letterSpacing: 2, color: AZUL, whiteSpace: 'nowrap' }}>A VIRADA DE CHAVE</div>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontStyle: 'italic' }}>{s.virada}</div>
        </div>
      )}
      {s.rodape && <div style={{ textAlign: 'center', fontFamily: SANS, fontSize: 15, color: '#475569', marginTop: 20, maxWidth: 900, alignSelf: 'center' }}>{s.rodape}</div>}
    </div>
  )
}

function Perguntas({ s }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})`, padding: '90px 90px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Topo escuro rotulo={s.rotulo} />
      <div style={{ textAlign: 'center', fontFamily: SANS, color: '#CBD5E1', fontSize: 17, marginBottom: 8 }}>{s.antes}</div>
      <TituloDuplo normal={s.titulo} italico={s.italico} escuro />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        {s.perguntas.map((p, i) => (
          <div key={p} style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(191,221,247,.25)', borderRadius: 18, padding: '20px 22px' }}>
            <div style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', background: AZUL, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 24, fontStyle: 'italic' }}>{i + 1}</div>
            <div style={{ fontFamily: SERIF, fontSize: 25, color: '#fff', lineHeight: 1.25 }}>{p}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Tabela({ s }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: PAPEL, padding: '84px 80px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Topo rotulo={s.rotulo} />
      <TituloDuplo normal={s.titulo} italico={s.italico} tamanho={36} />
      <div style={{ maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: s.larguras || '1fr 1.4fr 1.4fr', gap: 0, fontFamily: SANS }}>
          {s.colunas.map(c => (
            <div key={c} style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: TINTA, textAlign: 'center', padding: '0 0 8px', textTransform: 'uppercase' }}>{c}</div>
          ))}
          {s.linhas.map((l, li) => l.map((cel, ci) => {
            const ultima = ci === l.length - 1
            return (
              <div key={li + '-' + ci} style={{
                padding: '11px 14px', fontSize: 14, lineHeight: 1.35, display: 'flex', alignItems: 'center',
                background: ultima ? AZUL : ci === 0 ? '#fff' : '#DCEBFA',
                color: ultima ? '#fff' : TINTA, fontWeight: ci === 0 || ultima ? 700 : 500,
                borderBottom: '2px solid ' + PAPEL, borderRight: ci < l.length - 1 ? '2px solid ' + PAPEL : 'none',
                borderTopLeftRadius: li === 0 && ci === 0 ? 12 : 0, borderTopRightRadius: li === 0 && ultima ? 12 : 0,
                borderBottomLeftRadius: li === s.linhas.length - 1 && ci === 0 ? 12 : 0, borderBottomRightRadius: li === s.linhas.length - 1 && ultima ? 12 : 0,
              }}>{cel}</div>
            )
          }))}
        </div>
        {s.rodape && <div style={{ textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 22, color: TINTA, marginTop: 20 }}>{s.rodape}</div>}
      </div>
    </div>
  )
}

function Dica({ s }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${AZUL}, #0E6FD0)`, display: 'grid', placeItems: 'center', padding: '0 140px' }}>
      <Topo escuro rotulo={s.rotulo} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-block', fontFamily: SANS, fontWeight: 800, letterSpacing: 4, fontSize: 13, color: NAVY, background: '#fff', borderRadius: 999, padding: '8px 22px', marginBottom: 26 }}>{s.etiqueta || 'DICA'}</div>
        <div style={{ fontFamily: SERIF, fontSize: 50, color: '#fff', lineHeight: 1.25, fontWeight: 600 }}>{s.texto}</div>
      </div>
    </div>
  )
}

function Dois({ s }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: PAPEL, padding: '90px 80px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Topo rotulo={s.rotulo} />
      {s.kicker && <div style={{ textAlign: 'center', fontFamily: SANS, fontSize: 12, fontWeight: 800, letterSpacing: 3, color: '#64748B', marginBottom: 6 }}>{s.kicker}</div>}
      <TituloDuplo normal={s.titulo} italico={s.italico} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, maxWidth: 1060, margin: '0 auto', width: '100%' }}>
        {s.lados.map((l, i) => (
          <div key={l.titulo} style={{ background: i === 0 ? '#fff' : NAVY, color: i === 0 ? TINTA : '#fff', borderRadius: 22, padding: '28px 30px', boxShadow: '0 18px 40px -26px rgba(11,42,91,.6)' }}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>{l.icone}</div>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 34, marginTop: 12, color: i === 0 ? AZUL : AZUL_CLARO }}>{l.titulo}</div>
            <div style={{ fontFamily: SANS, fontSize: 16.5, marginTop: 8, lineHeight: 1.5 }}>{l.texto}</div>
            {l.exemplos && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {l.exemplos.map(e => <span key={e} style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, borderRadius: 999, padding: '6px 12px', background: i === 0 ? '#DCEBFA' : 'rgba(255,255,255,.12)', color: i === 0 ? TINTA : '#fff' }}>{e}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
      {s.rodape && <div style={{ textAlign: 'center', fontFamily: SANS, fontSize: 15.5, color: '#334155', marginTop: 22, maxWidth: 900, alignSelf: 'center' }}>{s.rodape}</div>}
    </div>
  )
}

function Indicadores({ s }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {s.itens.map((it, i) => (
        <div key={it.nome} style={{ background: i === 0 ? '#2B4D86' : NAVY2, padding: '86px 48px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#fff' }}>
          {i === 0 && <Topo escuro rotulo={s.rotulo} />}
          {i === 0 && <div style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: 1, fontSize: 18, marginBottom: 18 }}>{s.titulo || 'INDICADORES NA PRÁTICA'}</div>}
          {i === 1 && <div style={{ height: 41 }} />}
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 40, color: AZUL }}>{it.nome}</div>
          <div style={{ fontFamily: SANS, fontSize: 17, marginTop: 8, lineHeight: 1.5 }}>{it.desc}</div>
          <div style={{ marginTop: 16, background: '#fff', color: TINTA, borderRadius: 10, padding: '10px 14px', fontFamily: SANS, fontSize: 13, fontWeight: 700 }}>
            <div style={{ fontSize: 10.5, letterSpacing: 1.5, color: '#64748B' }}>FÓRMULA</div>{it.formula}
          </div>
          {it.faixas && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: AZUL_CLARO, marginBottom: 8 }}>{it.faixasTitulo || 'PARÂMETROS MÉDIOS'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {it.faixas.map(f => <span key={f} style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, background: 'rgba(255,255,255,.12)', borderRadius: 999, padding: '6px 12px' }}>{f}</span>)}
              </div>
            </div>
          )}
          <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6 }}>
            {it.baixo && <div><b style={{ color: '#FCA5A5' }}>Se estiver baixo:</b> {it.baixo}</div>}
            {it.alto && <div><b style={{ color: '#86EFAC' }}>Se estiver alto:</b> {it.alto}</div>}
            {it.extra && <div style={{ marginTop: 6, color: AZUL_CLARO, fontWeight: 600 }}>{it.extra}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function Final({ s }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(900px 600px at 20% 30%, #12407F 0%, ${NAVY} 55%, ${NAVY2} 100%)`, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ padding: '0 70px' }}>
        <div style={{ fontFamily: SERIF, fontSize: 44, lineHeight: 1.3, color: '#fff' }}>
          {s.texto}{' '}<span style={{ fontStyle: 'italic', fontWeight: 700, color: AZUL_CLARO }}>{s.destaque}</span>
        </div>
      </div>
      <div style={{ height: '100%', position: 'relative' }}>
        <img src={s.foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(270deg, rgba(11,42,91,0) 55%, ${NAVY} 100%)` }} />
      </div>
    </div>
  )
}

const TIPOS = { capa: Capa, frase: Frase, lista: Lista, perguntas: Perguntas, tabela: Tabela, dica: Dica, dois: Dois, indicadores: Indicadores, final: Final }

export default function ApresentacaoConexao({ slides, rotulo }) {
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

  // escala do palco 1440x810 pra caber na tela inteira, como um slide
  const calcEsc = () => Math.min(window.innerWidth / 1440, window.innerHeight / 810)
  const [esc, setEsc] = useState(calcEsc)
  useEffect(() => {
    const onResize = () => setEsc(calcEsc())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const s = { rotulo, ...slides[i] }
  const Slide = TIPOS[s.tipo]
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'grid', placeItems: 'center' }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Montserrat:wght@400;500;600;700;800&display=swap');@keyframes entraConexao{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}"}</style>
      {/* palco 16:9 que se ajusta à tela, como um slide de verdade */}
      <div style={{ position: 'relative', width: 1440 * esc, height: 810 * esc, overflow: 'hidden' }}>
        <div key={i} style={{ position: 'absolute', left: 0, top: 0, width: 1440, height: 810, transformOrigin: 'top left', transform: `scale(${esc})`, animation: 'entraConexao .4s ease' }}>
          <Slide s={s} />
        </div>
      </div>
      <button onClick={() => navigate('/materiais-apoio')} title="Sair (Esc)" style={{ position: 'fixed', top: 14, right: 16, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 18, width: 34, height: 34, borderRadius: 8, cursor: 'pointer', zIndex: 2 }}>×</button>
      <div style={{ position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(0,0,0,.45)', borderRadius: 999, padding: '6px 12px', zIndex: 2 }}>
        <button onClick={anterior} disabled={i === 0} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', opacity: i === 0 ? .3 : 1 }}>←</button>
        <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, fontFamily: SANS }}>{i + 1} / {slides.length}</span>
        <button onClick={proxima} disabled={i === slides.length - 1} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', opacity: i === slides.length - 1 ? .3 : 1 }}>→</button>
      </div>
    </div>
  )
}
