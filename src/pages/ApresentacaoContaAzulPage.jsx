import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import LOGO_SRC from '../assets/logo-fluxe-white.png'

const INDIGO = '#4F46E5'
const AMBER = '#D97706'
const GREEN = '#16A34A'
const RED = '#DC2626'
const INK = '#0F172A'

function Passos({ itens, cols = 4 }) {
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

function Callout({ label, labelColor = '#A5B4FC', children, bg = 'rgba(255,255,255,.08)', border }) {
  return (
    <div style={{ background: bg, border: border ? `1px solid ${border}` : 'none', borderRadius: 10, padding: '16px 20px' }}>
      {label && <div style={{ color: labelColor, fontWeight: 800, fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ color: '#fff', fontSize: 15, lineHeight: 1.55 }}>{children}</div>
    </div>
  )
}

function Eyebrow({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: '#A5B4FC', letterSpacing: 3, marginBottom: 14, textAlign: 'center' }}>{children}</div>
}

function Codigo({ children }) {
  return (
    <pre style={{
      background: '#020617', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '14px 18px',
      color: '#A5F3FC', fontSize: 12.5, lineHeight: 1.6, fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
      whiteSpace: 'pre-wrap', margin: 0, textAlign: 'left',
    }}>{children}</pre>
  )
}

// ── 01 · Capa ──────────────────────────────────────────────────────────
function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ANÁLISES ESTRATÉGICAS COM IA</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Integração Conta Azul + Claude Code</div>
      <div style={{ fontSize: 19, color: '#C7D2FE', marginBottom: 28 }}>Do zero a uma arquitetura multicliente segura, pronta pra Controladoria e FP&A</div>
      <Callout label="O que a turma sai sabendo fazer">
        Conectar a API da Conta Azul via OAuth 2.0 usando o Claude Code como par de programação, com segurança, e escalar essa mesma integração pra atender vários clientes do BPO ao mesmo tempo.
      </Callout>
    </div>
  )
}

// ── 02 · Como funciona a conexão ─────────────────────────────────────
function SlideConceito() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>O CONCEITO CENTRAL</Eyebrow>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 24 }}>
        "O Claude Code não recebe simplesmente uma chave da Conta Azul."
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', marginBottom: 18 }}>
        Você cria um projeto que implementa a autenticação OAuth 2.0 da Conta Azul, e só depois usa os tokens gerados por essa autenticação pra consultar a API.
      </div>
      <div style={{ fontSize: 14, color: '#94A3B8', fontStyle: 'italic' }}>
        É um processo, não uma senha. Autoriza, gera token, usa o token, renova o token quando expira.
      </div>
    </div>
  )
}

// ── 03 · Crie a aplicação + a dúvida comum ────────────────────────────
function SlideAplicacao() {
  return (
    <div style={{ width: '100%', maxWidth: 920 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Crie a aplicação na Conta Azul</h2>
      <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 20 }}>Portal de Desenvolvedores da Conta Azul → criar aplicação → duas credenciais:</div>
      <Passos itens={['CLIENT_ID', 'CLIENT_SECRET']} cols={2} />
      <div style={{ marginTop: 20 }}>
        <Callout label="⚠ A dúvida que todo mundo tem" labelColor="#FCA5A5" bg="rgba(220,38,38,.14)" border="rgba(220,38,38,.4)">
          Isso <strong>não é uma API por cliente</strong>. É uma aplicação única, criada uma vez só. O que muda de cliente pra cliente não é o CLIENT_ID/CLIENT_SECRET, é a <strong>autorização</strong>: cada cliente loga na Conta Azul dele (não na sua) e autoriza essa mesma aplicação. Uma aplicação, uma autorização e um par de tokens por cliente.
        </Callout>
      </div>
    </div>
  )
}

// ── 04 · Primeiro prompt ──────────────────────────────────────────────
function SlidePrompt1() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Primeiro prompt pro Claude Code</h2>
      <Codigo>{`Quero criar uma integração em Python com a API v2 da Conta Azul.
A aplicação deve usar OAuth 2.0 Authorization Code.
Crie uma estrutura segura para:
1. armazenar CLIENT_ID e CLIENT_SECRET em arquivo .env;
2. gerar a URL de autorização da Conta Azul;
3. receber o authorization code;
4. trocar o authorization code por access_token e refresh_token;
5. armazenar os tokens localmente sem colocá-los no Git;
6. renovar automaticamente o access_token usando o refresh_token;
7. criar um cliente reutilizável para consultar a API Conta Azul.
Crie também .gitignore e requirements.txt.
Não coloque nenhuma credencial diretamente no código.`}</Codigo>
    </div>
  )
}

// ── 05 · Fluxo OAuth (com o endpoint corrigido) ───────────────────────
function SlideFluxoOAuth() {
  const passos = [
    ['1', 'Usuário abre a URL de autorização', 'auth.contaazul.com/login'],
    ['2', 'Loga na Conta Azul do cliente e autoriza', '— não na sua conta —'],
    ['3', 'Conta Azul redireciona com ?code=...', 'pro seu redirect_uri'],
    ['4', 'Troca o code pelos tokens', 'POST auth.contaazul.com/oauth2/token'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>O fluxo de autorização, passo a passo</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {passos.map(([n, t, s]) => (
          <div key={n} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '14px 14px', textAlign: 'center' }}>
            <div style={{ background: INDIGO, color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, margin: '0 auto 10px' }}>{n}</div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t}</div>
            <div style={{ color: '#93C5FD', fontSize: 11, fontFamily: 'monospace' }}>{s}</div>
          </div>
        ))}
      </div>
      <Callout label="⚠ Ponto que costuma dar errado" labelColor="#FCA5A5" bg="rgba(220,38,38,.14)" border="rgba(220,38,38,.4)">
        O endpoint de token <strong>não fica</strong> em <code>api-v2.contaazul.com</code>. Ele fica em outro domínio: <strong>auth.contaazul.com/oauth2/token</strong>. A requisição também precisa de um header <code>Authorization: Basic</code> com CLIENT_ID:CLIENT_SECRET em base64.
      </Callout>
    </div>
  )
}

// ── 06 · Segurança de credenciais ─────────────────────────────────────
function SlideEnv() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Proteja suas credenciais</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ color: '#A5B4FC', fontWeight: 700, fontSize: 12, marginBottom: 8, textTransform: 'uppercase' }}>.env</div>
          <Codigo>{`CONTA_AZUL_CLIENT_ID=...
CONTA_AZUL_CLIENT_SECRET=...
CONTA_AZUL_REDIRECT_URI=
  http://localhost:8000/callback`}</Codigo>
        </div>
        <div>
          <div style={{ color: '#A5B4FC', fontWeight: 700, fontSize: 12, marginBottom: 8, textTransform: 'uppercase' }}>.gitignore</div>
          <Codigo>{`.env
tokens.json`}</Codigo>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Callout>Nunca exponha CLIENT_ID, CLIENT_SECRET ou tokens no terminal, em prints, ou no Git. Se vazou, revogue e gere de novo.</Callout>
      </div>
    </div>
  )
}

// ── 07 · Primeira consulta ────────────────────────────────────────────
function SlideConsulta() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Teste a primeira consulta</h2>
      <Codigo>{`GET /v1/conta-financeira
  ?pagina=1
  &tamanho_pagina=100
  &apenas_ativo=true

Authorization: Bearer {access_token}`}</Codigo>
      <div style={{ marginTop: 16 }}>
        <Callout label="Se der 401">Token expirado. Renove com o refresh_token e repita a mesma chamada, automaticamente, sem precisar de intervenção manual.</Callout>
      </div>
    </div>
  )
}

// ── 08 · Regra de ouro ─────────────────────────────────────────────────
function SlideRegraOuro() {
  const linhas = [['GET', 'LIBERADO', GREEN], ['POST', 'BLOQUEADO', RED], ['PUT', 'BLOQUEADO', RED], ['PATCH', 'BLOQUEADO', RED], ['DELETE', 'BLOQUEADO', RED]]
  return (
    <div style={{ width: '100%', maxWidth: 780, textAlign: 'center' }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>A regra de ouro do início</h2>
      <div style={{ fontSize: 16, color: '#FCD34D', marginBottom: 24, fontWeight: 700 }}>Comece só de leitura. Sempre.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {linhas.map(([op, status, cor]) => (
          <div key={op} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '14px 8px' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{op}</div>
            <div style={{ color: cor, fontWeight: 700, fontSize: 11 }}>{status}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, fontSize: 14, color: '#94A3B8' }}>Isso reduz o risco de um erro de código alterar o financeiro do cliente, antes de você confiar 100% na integração.</div>
    </div>
  )
}

// ── 09 · Módulos financeiros pro BPO ──────────────────────────────────
function SlideModulos() {
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Módulos financeiros pro BPO</h2>
      <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 20 }}>Consultas independentes, cada uma com sua própria função.</div>
      <Passos cols={5} itens={['Contas financeiras', 'Categorias', 'Centros de custo', 'Contas a pagar', 'Contas a receber', 'Recebimentos', 'Pagamentos', 'Clientes', 'Fornecedores', 'Vendas']} />
      <div style={{ marginTop: 18 }}>
        <Callout label="Regra">Não invente endpoints. Consulte a documentação oficial atual antes de implementar, e peça paginação automática, dados normalizados em DataFrame.</Callout>
      </div>
    </div>
  )
}

// ── 10 · Controladoria e FP&A ──────────────────────────────────────────
function SlideFPA() {
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Evolua pra Controladoria e FP&A</h2>
      <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 20 }}>Com os dados já extraídos, a camada analítica de verdade.</div>
      <Passos cols={4} itens={['DRE gerencial', 'Fluxo de caixa realizado', 'Fluxo de caixa projetado', 'Receita por cliente', 'Despesa por fornecedor', 'Análise vertical/horizontal', 'Margem operacional', 'Inadimplência', 'Concentração de receita', 'Evolução do faturamento', 'Realizado x orçamento', 'Indicadores financeiros']} />
    </div>
  )
}

// ── 11 · Arquitetura multicliente ─────────────────────────────────────
function SlideArquiteturaMulti() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Uma aplicação, N clientes</h2>
      <Codigo>{`SEU SISTEMA / BPO
 ├── Cliente A → OAuth Conta Azul → tokens do Cliente A
 ├── Cliente B → OAuth Conta Azul → tokens do Cliente B
 ├── Cliente C → OAuth Conta Azul → tokens do Cliente C
 └── Cliente D → OAuth Conta Azul → tokens do Cliente D`}</Codigo>
      <div style={{ marginTop: 16 }}>
        <Callout label="Ponto-chave">A aplicação é única. A autorização é por empresa. Cada cliente conectado tem sua própria autorização OAuth e seus próprios tokens, isolados dos demais.</Callout>
      </div>
    </div>
  )
}

// ── 12 · Único x por cliente ───────────────────────────────────────────
function SlideUnicoPorCliente() {
  const linhas = [
    ['Aplicação da integração', 'Único'], ['CLIENT_ID / CLIENT_SECRET', 'Único'],
    ['Autorização OAuth', 'Por cliente'], ['Access token', 'Por cliente'],
    ['Refresh token', 'Por cliente'], ['Dados financeiros', 'Por cliente'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>O que é único, o que é por cliente</h2>
      <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden' }}>
        {linhas.map(([item, tipo], i) => (
          <div key={item} style={{ display: 'flex', padding: '11px 18px', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.04)' }}>
            <div style={{ flex: 2, color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>{item}</div>
            <div style={{ flex: 1, textAlign: 'right', color: tipo === 'Único' ? '#93C5FD' : '#FCD34D', fontWeight: 800, fontSize: 12 }}>{tipo}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 13 · Seletor de cliente + carteira consolidada ────────────────────
function SlidePainel() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Painel do BPO com carteira inteira</h2>
      <Codigo>{`CLIENTE: [ Empresa ABC ▾ ]   Período: [ Jan a Ago/2026 ]
Faturamento · Resultado · Margem · Saldo · Inadimplência
DRE · Fluxo de Caixa · Contas a Receber · Contas a Pagar`}</Codigo>
      <div style={{ marginTop: 16 }}>
        <Callout label="Visão consolidada da carteira">Depois de conectados e normalizados, os dados isolados de cada cliente também alimentam uma camada agregada: clientes com caixa crítico, inadimplência elevada, queda de faturamento, sem misturar os dados operacionais entre eles.</Callout>
      </div>
    </div>
  )
}

// ── 14 · Segurança final ───────────────────────────────────────────────
function SlideSeguranca() {
  return (
    <div style={{ width: '100%', maxWidth: 780, textAlign: 'center' }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Segurança em produção</h2>
      <div style={{ fontSize: 17, color: '#FCA5A5', marginBottom: 22, fontWeight: 700 }}>Isolamento de dados é requisito básico, não um extra.</div>
      <Callout label="Regra inegociável" labelColor="#FCA5A5" bg="rgba(220,38,38,.14)" border="rgba(220,38,38,.4)">
        Uma requisição do Cliente A nunca pode usar os tokens, identificadores ou dados do Cliente B. Em produção, use banco de dados, criptografia de segredos, controle de acesso e logs que nunca exponham credenciais.
      </Callout>
    </div>
  )
}

// ── 15 · Encerramento ───────────────────────────────────────────────────
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>PROVOCAÇÃO FINAL</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 22 }}>
        Uma integração que só funciona pra um cliente não é produto. É gambiarra com prazo de validade.
      </div>
      <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>
        A diferença entre os dois está inteira no que você viu hoje: uma aplicação, autorização isolada por cliente, tokens que nunca se misturam.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideConceito }, { render: SlideAplicacao }, { render: SlidePrompt1 },
  { render: SlideFluxoOAuth }, { render: SlideEnv }, { render: SlideConsulta }, { render: SlideRegraOuro },
  { render: SlideModulos }, { render: SlideFPA }, { render: SlideArquiteturaMulti }, { render: SlideUnicoPorCliente },
  { render: SlidePainel }, { render: SlideSeguranca }, { render: SlideEncerramento },
]

export default function ApresentacaoContaAzulPage() {
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
    <div style={{
      position: 'fixed', inset: 0, background: `linear-gradient(135deg, ${INK}, #1E1B4B)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 80px', zIndex: 1000,
    }}>
      <button onClick={() => navigate('/materiais-apoio')} style={{
        position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,.1)', border: 'none',
        color: '#fff', fontSize: 20, width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
      }} title="Sair (Esc)">×</button>

      <img src={LOGO_SRC} alt="Fluxe" style={{ position: 'absolute', top: 22, left: 32, height: 26, width: 'auto', opacity: .85 }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Slide />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }}>
        <button onClick={anterior} disabled={i === 0} style={{
          background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%',
          cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: 18,
        }}>←</button>
        <div style={{ display: 'flex', gap: 6 }}>
          {SLIDES.map((_, idx) => (
            <div key={idx} onClick={() => setI(idx)} style={{
              width: idx === i ? 20 : 7, height: 7, borderRadius: 99, cursor: 'pointer',
              background: idx === i ? '#818CF8' : 'rgba(255,255,255,.25)', transition: 'all .2s',
            }} />
          ))}
        </div>
        <button onClick={proxima} disabled={i === SLIDES.length - 1} style={{
          background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%',
          cursor: i === SLIDES.length - 1 ? 'default' : 'pointer', opacity: i === SLIDES.length - 1 ? 0.3 : 1, fontSize: 18,
        }}>→</button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 10 }}>{i + 1} / {SLIDES.length} · setas do teclado ou espaço pra avançar</div>
    </div>
  )
}
