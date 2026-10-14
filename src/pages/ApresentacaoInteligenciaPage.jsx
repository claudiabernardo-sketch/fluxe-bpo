import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Encontro 10 da Mentoria BPO Lucrativo. Apresentação visual: gráficos e
// ícones grandes no lugar de listas de texto (pedido da Cláudia, out/2026).

const INDIGO = '#6366F1'
const AMBER = '#F59E0B'
const GREEN = '#22C55E'
const RED = '#EF4444'
const SKY = '#38BDF8'
const PINK = '#F472B6'
const INK = '#0F172A'

function Eyebrow({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 800, color: '#A5B4FC', letterSpacing: 3, marginBottom: 12, textAlign: 'center' }}>{children}</div>
}
function Titulo({ children, sub }) {
  return (
    <>
      <h2 style={{ fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: sub ? 8 : 26, textAlign: 'center', lineHeight: 1.15 }}>{children}</h2>
      {sub && <div style={{ fontSize: 16, color: '#94A3B8', textAlign: 'center', marginBottom: 26 }}>{sub}</div>}
    </>
  )
}
function Destaque({ children, cor = '#FCD34D' }) {
  return <div style={{ textAlign: 'center', color: cor, fontSize: 18, fontWeight: 800, marginTop: 22 }}>{children}</div>
}
function Card({ cor = INDIGO, children, style }) {
  return <div style={{ background: 'rgba(255,255,255,.06)', border: `1px solid ${cor}55`, borderTop: `4px solid ${cor}`, borderRadius: 16, padding: '18px 18px', ...style }}>{children}</div>
}
function Icone({ e, size = 46 }) {
  return <div style={{ fontSize: size, lineHeight: 1 }}>{e}</div>
}
const brl = v => 'R$ ' + v.toLocaleString('pt-BR')

// Gráfico em cascata: total → subtrações → subtotal...
function Cascata({ passos, max }) {
  let acumulado = 0
  const barras = passos.map(p => {
    if (p.tipo === 'total') { acumulado = p.valor; return { ...p, base: 0, altura: p.valor } }
    acumulado -= p.valor
    return { ...p, base: acumulado, altura: p.valor }
  })
  const H = 230
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: H + 70, padding: '0 10px' }}>
      {barras.map(b => (
        <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', width: '100%', height: H }}>
            <div style={{ position: 'absolute', left: '12%', right: '12%', bottom: (b.base / max) * H, height: Math.max(4, (b.altura / max) * H), background: b.cor, borderRadius: 8, boxShadow: `0 8px 24px -10px ${b.cor}` }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: ((b.base + b.altura) / max) * H + 6, textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
              {b.tipo === 'total' ? '' : '− '}{brl(b.valor)}
            </div>
          </div>
          <div style={{ marginTop: 10, color: b.tipo === 'total' ? '#fff' : '#CBD5E1', fontWeight: b.tipo === 'total' ? 800 : 600, fontSize: 13, textAlign: 'center', lineHeight: 1.25, minHeight: 34 }}>{b.label}</div>
        </div>
      ))}
    </div>
  )
}

// Barra horizontal empilhada (composição de um total)
function Empilhada({ partes }) {
  const total = partes.reduce((s, p) => s + p.valor, 0)
  return (
    <div>
      <div style={{ display: 'flex', height: 54, borderRadius: 14, overflow: 'hidden' }}>
        {partes.map(p => (
          <div key={p.label} style={{ width: `${(p.valor / total) * 100}%`, background: p.cor, display: 'grid', placeItems: 'center', color: INK, fontWeight: 900, fontSize: 15 }}>
            {Math.round((p.valor / total) * 100)}%
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12, justifyContent: 'center' }}>
        {partes.map(p => (
          <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E2E8F0', fontSize: 14 }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: p.cor }} />{p.e} {p.label} <b style={{ color: '#fff' }}>{brl(p.valor)}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 900 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 10</Eyebrow>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 22, fontSize: 54, marginBottom: 22 }}>
        <span>📊</span><span>💡</span><span>🎯</span>
      </div>
      <div style={{ fontSize: 50, fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>
        O BPO que entrega <span style={{ background: 'linear-gradient(90deg,#818CF8,#F472B6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>inteligência</span>
      </div>
      <div style={{ fontSize: 20, color: '#C7D2FE' }}>DRE, custo direto, categorização e indicadores, na linguagem do dono</div>
    </div>
  )
}

function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, marginBottom: 30 }}>
        <Card cor={RED} style={{ width: 260 }}><Icone e="📄" size={60} /><div style={{ color: '#FCA5A5', fontWeight: 800, marginTop: 10, fontSize: 18 }}>Relatório</div><div style={{ color: '#CBD5E1', fontSize: 14, marginTop: 4 }}>"Toma, os números do mês."</div></Card>
        <div style={{ fontSize: 44, color: '#64748B' }}>→</div>
        <Card cor={GREEN} style={{ width: 260 }}><Icone e="💡" size={60} /><div style={{ color: '#86EFAC', fontWeight: 800, marginTop: 10, fontSize: 18 }}>Inteligência</div><div style={{ color: '#CBD5E1', fontSize: 14, marginTop: 4 }}>"Isso aconteceu, e é isso que você deve fazer."</div></Card>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
        "Eu entrego relatório todo mês. Por que o cliente não usa pra decidir nada?"
      </div>
    </div>
  )
}

function SlideDRE() {
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo sub="Exemplo: loja de calçados. Cada degrau é uma pergunta que o dono deveria entender.">A DRE em cascata</Titulo>
      <Cascata max={120000} passos={[
        { label: 'Receita bruta', valor: 120000, tipo: 'total', cor: INDIGO },
        { label: 'Impostos e devoluções', valor: 10000, cor: '#94A3B8' },
        { label: 'Receita líquida', valor: 110000, tipo: 'total', cor: SKY },
        { label: 'Custo direto (CMV)', valor: 65000, cor: RED },
        { label: 'Lucro bruto', valor: 45000, tipo: 'total', cor: AMBER },
        { label: 'Despesas fixas', valor: 30000, cor: PINK },
        { label: 'EBITDA', valor: 15000, tipo: 'total', cor: GREEN },
      ]} />
      <Destaque>Vendeu R$ 120 mil e sobraram R$ 15 mil: de cada R$ 100, ficam R$ 12,50.</Destaque>
    </div>
  )
}

function SlideCustoDireto() {
  const tipos = [
    ['🛍️', 'Comércio', 'CMV', 'Custo da Mercadoria Vendida', 'Compra pronto e revende', INDIGO],
    ['🏭', 'Indústria', 'CPV', 'Custo do Produto Vendido', 'Matéria-prima + produção', AMBER],
    ['💼', 'Serviços', 'CSP', 'Custo do Serviço Prestado', 'Tempo da equipe que entrega', GREEN],
    ['🚚', 'Transportadora', 'CSP', 'Não tem CMV!', 'Combustível, motorista, pedágio', RED],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <Titulo sub="Logo abaixo da receita vem o custo direto. Ele muda de nome e de conteúdo conforme o negócio.">Cada negócio, um custo direto</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {tipos.map(([e, seg, sigla, nome, txt, cor]) => (
          <Card key={seg} cor={cor} style={{ textAlign: 'center', padding: '22px 14px' }}>
            <Icone e={e} size={58} />
            <div style={{ color: '#CBD5E1', fontWeight: 700, fontSize: 14, marginTop: 10 }}>{seg}</div>
            <div style={{ color: cor, fontWeight: 900, fontSize: 40, lineHeight: 1.1, marginTop: 4 }}>{sigla}</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 13.5 }}>{nome}</div>
            <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 8 }}>{txt}</div>
          </Card>
        ))}
      </div>
      <Destaque>Errou o custo direto, errou a margem inteira.</Destaque>
    </div>
  )
}

function Caixinha({ e, rot, val, cor }) {
  return (
    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.07)', border: `2px solid ${cor}`, borderRadius: 18, padding: '16px 18px', minWidth: 150 }}>
      <Icone e={e} size={44} />
      <div style={{ color: '#CBD5E1', fontSize: 13, marginTop: 8 }}>{rot}</div>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{val}</div>
    </div>
  )
}
function SlideCMV() {
  const op = s => <div style={{ fontSize: 40, fontWeight: 900, color: '#94A3B8' }}>{s}</div>
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <Titulo sub="Compra não é custo. Compra vira estoque. Custo é o que saiu vendido.">🛍️ CMV na prática</Titulo>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Caixinha e="📦" rot="Estoque no início" val="R$ 40.000" cor={SKY} />
        {op('+')}
        <Caixinha e="🛒" rot="Compras do mês" val="R$ 60.000" cor={AMBER} />
        {op('−')}
        <Caixinha e="📦" rot="Estoque no fim" val="R$ 35.000" cor={SKY} />
        {op('=')}
        <Caixinha e="🏷️" rot="CMV" val="R$ 65.000" cor={GREEN} />
      </div>
      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', borderRadius: 16, padding: '14px 20px' }}>
        <div style={{ fontSize: 38 }}>🚫</div>
        <div style={{ color: '#FECACA', fontSize: 16 }}><b>Erro clássico:</b> lançar a compra (R$ 60 mil) como custo. O lucro aparece <b>R$ 5 mil maior</b> e esconde que o estoque encolheu.</div>
      </div>
    </div>
  )
}

function SlideTransportadora() {
  const custoKm = 1.6, receitaKm = 2.5
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <Titulo sub="Ela não vende mercadoria, vende o frete. O custo direto é o custo de fazer o caminhão rodar.">🚚 Transportadora: por que não tem CMV</Titulo>
      <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 13, letterSpacing: 1, marginBottom: 10 }}>PRA ONDE VAI O CUSTO DIRETO (R$ 96 MIL)</div>
      <Empilhada partes={[
        { label: 'Combustível', e: '⛽', valor: 45000, cor: AMBER },
        { label: 'Motoristas', e: '👷', valor: 30000, cor: SKY },
        { label: 'Manutenção e pneus', e: '🔧', valor: 12000, cor: PINK },
        { label: 'Pedágios', e: '🛣️', valor: 9000, cor: '#A78BFA' },
      ]} />
      <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 13, letterSpacing: 1, margin: '26px 0 10px' }}>O NÚMERO QUE MANDA: POR KM RODADO</div>
      {[['Custo por km', custoKm, RED], ['Receita por km', receitaKm, GREEN]].map(([rot, v, cor]) => (
        <div key={rot} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{ width: 130, color: '#E2E8F0', fontSize: 15, fontWeight: 700 }}>{rot}</div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 10, height: 34 }}>
            <div style={{ width: `${(v / 3) * 100}%`, height: '100%', background: cor, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12, color: INK, fontWeight: 900 }}>R$ {v.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>
      ))}
      <Destaque>Sobram R$ 0,90 por km. Caminhão que volta vazio come essa diferença.</Destaque>
    </div>
  )
}

function SlideIndicadores() {
  const itens = [
    ['📈', 'MARGEM', 'Quanto sobra de cada venda depois do custo direto', '"De cada R$ 100, sobram R$ 41"', INDIGO],
    ['💰', 'EBITDA', 'Quanto a operação gera de caixa, antes de juros e impostos', '"A operação gerou R$ 15 mil"', AMBER],
    ['⚖️', 'PONTO DE EQUILÍBRIO', 'Quanto precisa vender só pra empatar', '"Abaixo de R$ 80 mil, dá prejuízo"', GREEN],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <Titulo sub="Três números que todo dono deveria entender, e a maioria não entende.">Os 3 indicadores</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {itens.map(([e, nome, txt, frase, cor]) => (
          <Card key={nome} cor={cor} style={{ textAlign: 'center', padding: '24px 18px' }}>
            <Icone e={e} size={56} />
            <div style={{ color: cor, fontWeight: 900, fontSize: 18, marginTop: 12 }}>{nome}</div>
            <div style={{ color: '#CBD5E1', fontSize: 14, marginTop: 8 }}>{txt}</div>
            <div style={{ marginTop: 14, background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '10px 12px', color: '#fff', fontWeight: 700, fontSize: 14, fontStyle: 'italic' }}>{frase}</div>
          </Card>
        ))}
      </div>
      <Destaque>"Sua margem caiu 3%" não muda decisão. Mostrar o que causou muda.</Destaque>
    </div>
  )
}

function SlidePorSetor() {
  const itens = [
    ['🛍️', 'Comércio', 'Giro de estoque', '"Seu estoque leva 90 dias pra virar dinheiro."', INDIGO],
    ['🏭', 'Indústria', 'Custo por unidade', '"Cada pote custa R$ 3,30 pra produzir."', AMBER],
    ['💼', 'Serviços', 'Margem por cliente', '"Esse cliente usa 30% das horas e paga 12%."', GREEN],
    ['🚚', 'Transportadora', 'Custo por km', '"Cada km custa R$ 1,60 e o frete paga R$ 2,50."', RED],
    ['🩺', 'Clínica', 'Repasse e glosa', '"O convênio X glosa 7% e paga em 60 dias."', SKY],
    ['💻', 'Infoproduto', 'Lucro por lançamento', '"Faturou R$ 200 mil, ficaram R$ 22 mil."', PINK],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 1040 }}>
      <Titulo sub="Um indicador-chave por negócio, e a frase que você leva pra reunião.">O número que cada dono precisa ver</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {itens.map(([e, seg, ind, frase, cor]) => (
          <Card key={seg} cor={cor} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px' }}>
            <Icone e={e} size={40} />
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{seg} · <span style={{ color: cor }}>{ind}</span></div>
              <div style={{ color: '#CBD5E1', fontSize: 13.5, marginTop: 4, fontStyle: 'italic' }}>{frase}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function SlideMapa() {
  const passos = [
    ['🔁', 'Passou de uma conta da empresa pra outra?', 'Transferência', '#94A3B8', false],
    ['🏦', 'Dinheiro de banco ou de sócio? (empréstimo, aporte, retirada)', 'Não operacional', '#94A3B8', false],
    ['🛠️', 'Compra que dura mais de 1 ano?', 'Investimento', SKY, false],
    ['🧾', 'Imposto, devolução, glosa, parte que não é sua?', 'Dedução', AMBER, true],
    ['🏷️', 'Só existe porque vendeu?', 'Custo direto / variável', RED, true],
    ['🏢', 'Existe mesmo sem vender nada?', 'Despesa fixa', PINK, true],
    ['💳', 'Juros, tarifa, IOF, antecipação?', 'Financeiro', '#A78BFA', true],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <Titulo sub="Pergunte nesta ordem. O primeiro SIM diz onde o lançamento vai.">🗺️ Mapa de categorização</Titulo>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {passos.map(([e, perg, dest, cor, dre], i) => (
          <div key={perg} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 40px 220px 110px', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: '8px 14px' }}>
            <div style={{ fontSize: 28 }}>{e}</div>
            <div style={{ color: '#fff', fontSize: 15.5, fontWeight: 600 }}><span style={{ color: '#64748B', fontWeight: 800, marginRight: 8 }}>{i + 1}</span>{perg}</div>
            <div style={{ color: GREEN, fontWeight: 900, fontSize: 13 }}>SIM →</div>
            <div style={{ background: cor, color: INK, fontWeight: 900, fontSize: 14, borderRadius: 999, padding: '8px 12px', textAlign: 'center' }}>{dest}</div>
            <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: dre ? '#86EFAC' : '#FCA5A5' }}>{dre ? '✓ entra na DRE' : '✗ fora da DRE'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideArmadilhas() {
  const itens = [
    ['🏦', 'Empréstimo recebido lançado como receita'],
    ['🔁', 'Transferência entre contas virando receita e despesa'],
    ['🛠️', 'Equipamento comprado entrando como despesa do mês'],
    ['👛', 'Retirada da sócia lançada como despesa'],
    ['🛒', 'Compra de estoque lançada como custo'],
    ['💻', 'Venda da plataforma pelo valor que caiu no banco'],
    ['🩺', 'Glosa de convênio esquecida (receita que nunca vai entrar)'],
    ['🗑️', 'Tudo em "despesas diversas"'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo sub="As 8 que mais distorcem a DRE dos clientes.">⚠️ Armadilhas de categorização</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {itens.map(([e, t]) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 14, padding: '12px 16px' }}>
            <div style={{ fontSize: 30 }}>{e}</div>
            <div style={{ color: '#FEE2E2', fontSize: 15.5, fontWeight: 600 }}>{t}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideCaixaLucro() {
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo sub="Caso de clínica: a operação vai bem, mas o caixa caiu. Por quê?">🩺 Lucro não é caixa</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card cor={GREEN} style={{ textAlign: 'center', padding: '26px 18px' }}>
          <div style={{ color: '#86EFAC', fontWeight: 800, fontSize: 15 }}>LUCRO DO MÊS (DRE)</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 50, marginTop: 6 }}>+ R$ 43.900</div>
          <div style={{ fontSize: 46, marginTop: 6 }}>😀</div>
        </Card>
        <Card cor={RED} style={{ textAlign: 'center', padding: '26px 18px' }}>
          <div style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 15 }}>CAIXA DO MÊS</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 50, marginTop: 6 }}>− R$ 14.300</div>
          <div style={{ fontSize: 46, marginTop: 6 }}>😰</div>
        </Card>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
        {[['🛠️', 'Ultrassom à vista', 45000], ['🏦', 'Principal do empréstimo', 3200], ['👛', 'Retirada da sócia', 10000]].map(([e, t, v]) => (
          <div key={t} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 14, padding: '10px 16px', color: '#E2E8F0', fontSize: 15 }}>{e} {t} <b style={{ color: '#fff' }}>{brl(v)}</b></div>
        ))}
      </div>
      <Destaque>Nada disso é despesa, mas tudo isso saiu do caixa.</Destaque>
    </div>
  )
}

function SlideApresentar() {
  const pares = [
    ['Sua margem bruta foi de 22%.', 'De cada R$ 100 que entram, sobram R$ 22 depois de pagar a mercadoria.'],
    ['O EBITDA caiu 18% no mês.', 'A operação gerou R$ 4 mil a menos, porque o frete subiu.'],
    ['Segue a DRE em anexo.', 'Três números importam este mês, e um deles pede uma decisão sua.'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <Titulo sub="A linguagem do dono não é a linguagem do financeiro.">🗣️ Antes e depois: como falar com o dono</Titulo>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {pares.map(([antes, depois]) => (
          <div key={antes} style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1.3fr', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', color: '#FECACA', fontSize: 15 }}>❌ {antes}</div>
            <div style={{ textAlign: 'center', fontSize: 26, color: '#64748B' }}>→</div>
            <div style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.35)', borderRadius: '16px 16px 4px 16px', padding: '12px 16px', color: '#DCFCE7', fontSize: 15, fontWeight: 600 }}>✅ {depois}</div>
          </div>
        ))}
      </div>
      <Destaque>No máximo 3 números por reunião, e sempre uma recomendação.</Destaque>
    </div>
  )
}

function SlideFluxe() {
  const navigate = useNavigate()
  const passos = [
    ['📡', 'Radar', 'Relatório 360 do cliente: DRE, indicadores e alertas', INDIGO],
    ['🧭', 'Executivo', 'Visão da carteira, pra comparar clientes', AMBER],
    ['🤖', 'Skill de IA', 'Prompts de análise estratégica da Biblioteca', GREEN],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo sub="Onde a análise estratégica já sai pronta pra reunião.">Na prática, dentro do Fluxe</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {passos.map(([e, nome, txt, cor]) => (
          <Card key={nome} cor={cor} style={{ textAlign: 'center', padding: '24px 18px' }}>
            <Icone e={e} size={52} />
            <div style={{ color: cor, fontWeight: 900, fontSize: 19, marginTop: 10 }}>{nome}</div>
            <div style={{ color: '#CBD5E1', fontSize: 14, marginTop: 6 }}>{txt}</div>
          </Card>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button onClick={() => navigate('/clientes')} style={{ background: INDIGO, border: 'none', color: '#fff', fontSize: 15, fontWeight: 800, padding: '12px 24px', borderRadius: 12, cursor: 'pointer' }}>Abrir Clientes no Fluxe →</button>
      </div>
    </div>
  )
}

function SlideExercicios() {
  const casos = [
    ['🛍️', '1', 'Loja de roupas', 'CMV e margem', INDIGO],
    ['🏭', '2', 'Fábrica de doces', 'Custo por unidade', AMBER],
    ['💼', '3', 'Agência', 'Custo por hora', GREEN],
    ['🚚', '4', 'Transportadora', 'Custo por km', RED],
    ['🩺', '5', 'Clínica médica', 'Lucro x caixa', SKY],
    ['💻', '6', 'Infoproduto', 'Lucro do lançamento', PINK],
    ['🍔', '7', 'Restaurante', 'Salão x iFood', '#A78BFA'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 1040 }}>
      <Titulo sub="Os números estão no material de apoio. Em duplas: categorize, monte a DRE e escreva a frase pro dono.">✍️ Mão na massa: 7 casos</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {casos.map(([e, n, emp, tema, cor]) => (
          <Card key={n} cor={cor} style={{ textAlign: 'center', padding: '18px 12px' }}>
            <Icone e={e} size={44} />
            <div style={{ color: cor, fontWeight: 900, fontSize: 13, marginTop: 8 }}>CASO {n}</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15.5 }}>{emp}</div>
            <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>{tema}</div>
          </Card>
        ))}
        <Card cor="#64748B" style={{ textAlign: 'center', padding: '18px 12px', display: 'grid', placeItems: 'center' }}>
          <div><Icone e="📄" size={40} /><div style={{ color: '#CBD5E1', fontSize: 13, marginTop: 8 }}>Material no Fluxe, dentro da aula</div></div>
        </Card>
      </div>
    </div>
  )
}

function SlideAtividade() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 860 }}>
      <Icone e="📡" size={70} />
      <Titulo sub="Tarefa pra próxima aula">O Relatório 360 de um cliente seu</Titulo>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
        {[['1', 'Gere o Relatório 360 no Radar do Fluxe'], ['2', 'Escolha 3 números pra destacar'], ['3', 'Escreva a frase pro dono, sem jargão']].map(([n, t]) => (
          <div key={n} style={{ width: 240, background: 'rgba(255,255,255,.07)', borderRadius: 16, padding: '18px 16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: INDIGO, color: '#fff', fontWeight: 900, display: 'grid', placeItems: 'center', margin: '0 auto 10px', fontSize: 18 }}>{n}</div>
            <div style={{ color: '#E2E8F0', fontSize: 15 }}>{t}</div>
          </div>
        ))}
      </div>
      <Destaque>Traga pronto, que a gente corrige junto.</Destaque>
    </div>
  )
}

function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 900 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1.3, marginBottom: 30 }}>
        Relatório informa.<br /><span style={{ color: '#86EFAC' }}>Análise estratégica decide.</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
        {[['🧾', 'Categorizar certo'], ['📊', 'DRE'], ['📈', 'Indicadores'], ['🗣️', 'Tradução pro dono'], ['🎯', 'Decisão']].map(([e, t], i, arr) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.45)', borderRadius: 999, padding: '10px 18px', color: '#E0E7FF', fontSize: 15, fontWeight: 700 }}>{e} {t}</div>
            {i < arr.length - 1 && <span style={{ color: '#64748B', fontSize: 20 }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideDRE },
  { render: SlideCustoDireto }, { render: SlideCMV }, { render: SlideTransportadora },
  { render: SlideMapa }, { render: SlideArmadilhas }, { render: SlideCaixaLucro },
  { render: SlideIndicadores }, { render: SlidePorSetor }, { render: SlideApresentar },
  { render: SlideFluxe }, { render: SlideExercicios }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoInteligenciaPage() {
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const proxima = useCallback(() => setI(n => Math.min(SLIDES.length - 1, n + 1)), [])
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

  const Slide = SLIDES[i].render
  return (
    <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(1000px 600px at 85% 0%, rgba(244,114,182,.12), transparent 60%), radial-gradient(900px 600px at 0% 100%, rgba(99,102,241,.18), transparent 60%), linear-gradient(135deg, ${INK}, #1E1B4B)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 70px', zIndex: 1000, overflow: 'auto' }}>
      <button onClick={() => navigate('/materiais-apoio')} style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 20, width: 36, height: 36, borderRadius: 8, cursor: 'pointer' }} title="Sair (Esc)">×</button>
      <div style={{ position: 'absolute', top: 24, left: 32, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: 2 }}>FLUXE BPO</div>
      <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', animation: 'entraSlide .45s ease' }}><Slide /></div>
      <style>{'@keyframes entraSlide{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }}>
        <button onClick={anterior} disabled={i === 0} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: 18 }}>←</button>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 440, justifyContent: 'center' }}>
          {SLIDES.map((_, idx) => (
            <div key={idx} onClick={() => setI(idx)} style={{ width: idx === i ? 20 : 7, height: 7, borderRadius: 99, cursor: 'pointer', background: idx === i ? '#818CF8' : 'rgba(255,255,255,.25)', transition: 'all .2s' }} />
          ))}
        </div>
        <button onClick={proxima} disabled={i === SLIDES.length - 1} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: i === SLIDES.length - 1 ? 'default' : 'pointer', opacity: i === SLIDES.length - 1 ? 0.3 : 1, fontSize: 18 }}>→</button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 10 }}>{i + 1} / {SLIDES.length} · setas do teclado ou espaço pra avançar</div>
    </div>
  )
}
