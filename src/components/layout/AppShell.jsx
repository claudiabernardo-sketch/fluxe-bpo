import { useState, useRef, useEffect, lazy, Suspense, Component } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import LOGO_SRC from '../../assets/logo-fluxe.png'
import TimerBar from './TimerBar'
import TrialGuard from '../ui/TrialGuard'
import RadarPanelOverlay from '../ui/RadarPanelOverlay'
import { podeAcessarRota } from '../../config/permissoes'


// Captura erros de render em páginas lazy — evita tela em branco
class PageErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err) { console.error('[Fluxe] Erro ao renderizar página:', err) }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          height:'100%', gap:12, color:'var(--tx2)', padding:32 }}>
          <span style={{ fontSize:32 }}>!</span>
          <p style={{ margin:0, fontWeight:600 }}>Algo deu errado nesta página.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer' }}
          >Recarregar</button>
        </div>
      )
    }
    return this.props.children
  }
}

// Barra a rota se o perfil do usuário não tiver permissão — usada em toda
// rota que não seja "comum a todos" (ver ROTAS_POR_PERFIL em config/permissoes.js).
function RotaProtegida({ path, perfil, children }) {
  if (!podeAcessarRota(perfil, path)) return <Navigate to="/" replace />
  return children
}

// Lazy load — cada página vira chunk separado, carrega só quando o usuário navega
const DashPage        = lazy(() => import('../../pages/DashPage'))
const ClientsPage     = lazy(() => import('../../pages/ClientsPage'))
const TasksPage       = lazy(() => import('../../pages/TasksPage'))
const AvulsasPage     = lazy(() => import('../../pages/AvulsasPage'))
const EsteirasPage    = lazy(() => import('../../pages/EsteirasPage'))
const CRMPage         = lazy(() => import('../../pages/CRMPage'))
const PendenciasPage  = lazy(() => import('../../pages/PendenciasPage'))
const ExecPage        = lazy(() => import('../../pages/ExecPage'))
const RentPage        = lazy(() => import('../../pages/RentPage'))
const CofrePage       = lazy(() => import('../../pages/CofrePage'))
const CapPage         = lazy(() => import('../../pages/CapPage'))
const AgendaPage      = lazy(() => import('../../pages/AgendaPage'))
const RelatoriosPage  = lazy(() => import('../../pages/RelatoriosPage'))
const ConfigPage      = lazy(() => import('../../pages/ConfigPage'))
const MensagensPage   = lazy(() => import('../../pages/MensagensPage'))
const ModelosPage     = lazy(() => import('../../pages/ModelosPage'))
const ClientePage     = lazy(() => import('../../pages/ClientePage'))
const MeuPainelPage      = lazy(() => import('../../pages/MeuPainelPage'))
const AjudaPage          = lazy(() => import('../../pages/AjudaPage'))
const PrecificacaoPage   = lazy(() => import('../../pages/PrecificacaoPage'))
const AdminPage          = lazy(() => import('../../pages/AdminPage'))
const MentoriaPage       = lazy(() => import('../../pages/MentoriaPage'))
const PlanoNegocioPage   = lazy(() => import('../../pages/PlanoNegocioPage'))

const PageLoader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
    <div style={{ textAlign:'center' }}>
      <div style={{ width:32, height:32, border:'3px solid #E2E8F0', borderTopColor:'#6366F1', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 12px' }} />
      <div style={{ fontSize:12, color:'#94A3B8' }}>Carregando…</div>
    </div>
  </div>
)

const NAV = [
  { path:'/',           icon:'fa-solid fa-house',               label:'Início'    },
  { path:'/tasks',      icon:'fa-solid fa-list-check',          label:'Tarefas'   },
  { path:'/modelos',    icon:'fa-solid fa-rotate',              label:'Modelos'   },
  { path:'/pendencias', icon:'fa-solid fa-circle-exclamation',  label:'Pendências'},
  { path:'/avulsas',    icon:'fa-solid fa-file-pen',            label:'Avulsas'   },
  { grp:'COMERCIAL' },
  { path:'/crm',        icon:'fa-solid fa-chart-line',          label:'CRM'       },
  { path:'/precificacao', icon:'fa-solid fa-tag',               label:'Precif.'   },
  { grp:'CLIENTES' },
  { path:'/clientes',   icon:'fa-solid fa-building',            label:'Clientes'  },
  { path:'/esteiras',   icon:'fa-solid fa-sitemap',             label:'Esteiras'  },
  { path:'/agenda',     icon:'fa-solid fa-rocket',              label:'Central'   },
  { grp:'ANÁLISE' },
  { path:'/exec',       icon:'fa-solid fa-gauge-high',          label:'Executivo' },
  { path:'/rent',       icon:'fa-solid fa-chart-pie',           label:'Rent.'     },
  { path:'/cap',        icon:'fa-solid fa-users-gear',          label:'Equipe'    },
  { path:'/cofre',      icon:'fa-solid fa-shield-halved',       label:'Cofre'     },
  { grp:'FERRAMENTAS' },
  { path:'/mensagens',  icon:'fa-brands fa-whatsapp',           label:'Mensagens' },
  { path:'/relatorios', icon:'fa-solid fa-chart-column',        label:'Relatórios'},
  { path:'/mentoria',   icon:'fa-solid fa-graduation-cap',      label:'Mentoria'  },
  { path:'/plano-negocio', icon:'fa-solid fa-compass',          label:'Meu Plano' },
  { path:'/meu-painel', icon:'fa-solid fa-circle-user',         label:'Meu Painel'},
  { path:'/ajuda',      icon:'fa-solid fa-circle-question',     label:'Ajuda'     },
  { path:'/config',     icon:'fa-solid fa-gear',                label:'Config'    },
]

const TITLES = {
  '/':           'Dashboard',
  '/exec':       'Painel Executivo',
  '/tasks':      'Tarefas',
  '/avulsas':    'Tarefas Avulsas',
  '/esteiras':   'Esteiras Operacionais',
  '/clientes':   'Clientes',
  '/clientes/:id': 'Cliente',
  '/pendencias': 'Pendências',
  '/agenda':     'Central Operacional',
  '/rent':       'Rentabilidade',
  '/cap':        'Capacidade da Equipe',
  '/cofre':      'Cofre Digital',
  '/crm':          'CRM Comercial',
  '/precificacao': 'Precificação',
  '/relatorios': 'Relatórios',
  '/config':     'Configurações',
  '/mensagens':  'Mensagens WhatsApp',
  '/modelos':    'Modelos',
  '/meu-painel': 'Meu Painel',
  '/ajuda':      'Central de Ajuda',
  '/admin':      'Painel Admin Fluxe',
  '/mentoria':   'Mentoria',
  '/plano-negocio': 'Plano de Negócio em 6 Etapas',
}

const MOB_NAV = [
  { path:'/',         icon:'fa-solid fa-house',       label:'Início'  },
  { path:'/tasks',    icon:'fa-solid fa-list-check',  label:'Tarefas' },
  { path:'/agenda',   icon:'fa-solid fa-rocket',      label:'Central' },
  { path:'/clientes', icon:'fa-solid fa-building',    label:'Clientes'},
  { more:true,        icon:'fa-solid fa-ellipsis',    label:'Mais'    },
]
// Itens já fixos na barra mobile — não repetir no menu "Mais"
const MOB_NAV_PATHS = new Set(MOB_NAV.map(i => i.path).filter(Boolean))

export default function AppShell() {
  const { profile, empresa, signOut } = useAuthStore()
  const nav = useNavigate()
  const loc = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const menuRef = useRef(null)
  const title = TITLES[loc.pathname] || 'Fluxe BPO'
  const initials = profile?.nome?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const navBase = profile?.fluxe_staff
    ? [...NAV, { grp:'FLUXE STAFF' }, { path:'/admin', icon:'fa-solid fa-user-shield', label:'Admin' }]
    : NAV
  // Filtra itens (e remove separadores de grupo que ficariam sem nenhum item embaixo)
  const navItems = navBase.filter((item, i) => {
    if (item.grp) {
      const proximo = navBase.slice(i + 1).findIndex(x => x.grp)
      const fatia = proximo === -1 ? navBase.slice(i + 1) : navBase.slice(i + 1, i + 1 + proximo)
      return fatia.some(x => x.path && podeAcessarRota(profile?.perfil, x.path))
    }
    if (item.path === '/admin') return !!profile?.fluxe_staff // rota da equipe Fluxe, independe do perfil dentro da empresa
    return podeAcessarRota(profile?.perfil, item.path)
  })

  // Fecha menu ao clicar fora
  useEffect(() => {
    if (!showMenu) return
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  // Fecha menu ao navegar
  useEffect(() => { setShowMenu(false); setShowMore(false) }, [loc.pathname])

  const handleSignOut = async () => {
    setShowMenu(false)
    await signOut()
  }

  const goTo = path => { nav(path); setShowMenu(false) }

  return (
    <>
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden', background:'var(--bg)' }}>

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <aside className="sb">

        {/* Logo — click → Central Operacional */}
        <div className="sb-logo" onClick={() => nav('/agenda')} title="Central Operacional">
          <img src={LOGO_SRC} alt="Fluxe BPO" style={{ height:38, width:'auto', maxWidth:160, objectFit:'contain', objectPosition:'left' }} />
        </div>

        {/* Navegação */}
        <nav style={{ flex:1, overflowY:'auto', padding:'2px 0', scrollbarWidth:'none' }}>
          {navItems.map((item, i) => {
            if (item.grp) return (
              <div key={i} style={{ padding:'8px 0 2px' }}>
                <div className="sb-grp-sep" />
                <div className="sb-grp-lbl">{item.grp}</div>
              </div>
            )
            const active = loc.pathname === item.path
            return (
              <div key={item.path}
                className={`si${active ? ' on' : ''}`}
                onClick={() => nav(item.path)}
                title={item.label}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </div>
            )
          })}
        </nav>

        {/* Área do usuário */}
        <div style={{ padding:'6px', borderTop:'1px solid var(--bo)', position:'relative' }} ref={menuRef}>

          {/* Dropdown */}
          {showMenu && (
            <div className="user-menu">
              <div className="user-menu-hd">
                <div className="user-menu-name">{profile?.nome || 'Usuário'}</div>
                <div className="user-menu-role">{profile?.perfil}</div>
              </div>
              <button className="user-menu-item" onClick={() => goTo('/meu-painel')}>
                <i className="fa-solid fa-circle-user"></i> Meu Painel
              </button>
              {podeAcessarRota(profile?.perfil, '/config') && (
                <button className="user-menu-item" onClick={() => goTo('/config')}>
                  <i className="fa-solid fa-gear"></i> Configurações
                </button>
              )}
              <div className="user-menu-sep" />
              <button className="user-menu-item" onClick={() => goTo('/ajuda')}>
                <i className="fa-solid fa-circle-question"></i> Central de Ajuda
              </button>
              <div className="user-menu-sep" />
              <button className="user-menu-item danger" onClick={handleSignOut}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Sair
              </button>
            </div>
          )}

          {/* Trigger do usuário */}
          <div
            className="si"
            onClick={() => setShowMenu(v => !v)}
            title={`${profile?.nome || 'Usuário'} — opções`}
            style={{ cursor:'pointer', width:'100%', background: showMenu ? 'var(--brl)' : undefined, height:40 }}
          >
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background:'linear-gradient(135deg,#6366F1,#A855F7)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:10, fontWeight:700, color:'#fff', flexShrink:0,
            }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--tx)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {profile?.nome?.split(' ')[0] || 'Usuário'}
              </div>
              <div style={{ fontSize:9, color:'var(--tx3)', textTransform:'capitalize' }}>{profile?.perfil}</div>
            </div>
            <i className="fa-solid fa-ellipsis-vertical" style={{ fontSize:9, color:'var(--tx3)' }}></i>
          </div>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ──────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Topbar */}
        <div className="topbar">
          <div style={{ fontWeight:600, fontSize:14, color:'var(--tx)', flex:1 }}>{title}</div>
          {empresa && (
            <span style={{ fontSize:10, background:'var(--brl)', color:'var(--br)', padding:'3px 10px', borderRadius:99, fontWeight:600 }}>
              {empresa.nome}
            </span>
          )}
        </div>

        {/* Timer */}
        <TimerBar />

        {/* Páginas */}
        <div className="pgs fade-in" style={{ flex:1, overflow:'auto', padding:'16px', width:'100%', minWidth:0 }}>
          <PageErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"           element={<DashPage />} />
                <Route path="/exec"       element={<RotaProtegida path="/exec" perfil={profile?.perfil}><ExecPage /></RotaProtegida>} />
                <Route path="/tasks"      element={<RotaProtegida path="/tasks" perfil={profile?.perfil}><TasksPage /></RotaProtegida>} />
                <Route path="/avulsas"    element={<RotaProtegida path="/avulsas" perfil={profile?.perfil}><AvulsasPage /></RotaProtegida>} />
                <Route path="/modelos"    element={<RotaProtegida path="/modelos" perfil={profile?.perfil}><ModelosPage /></RotaProtegida>} />
                <Route path="/esteiras"   element={<RotaProtegida path="/esteiras" perfil={profile?.perfil}><EsteirasPage /></RotaProtegida>} />
                <Route path="/clientes"   element={<RotaProtegida path="/clientes" perfil={profile?.perfil}><ClientsPage /></RotaProtegida>} />
                <Route path="/clientes/:id" element={<RotaProtegida path="/clientes" perfil={profile?.perfil}><ClientePage /></RotaProtegida>} />
                <Route path="/pendencias" element={<RotaProtegida path="/pendencias" perfil={profile?.perfil}><PendenciasPage /></RotaProtegida>} />
                <Route path="/agenda"     element={<AgendaPage />} />
                <Route path="/rent"       element={<RotaProtegida path="/rent" perfil={profile?.perfil}><RentPage /></RotaProtegida>} />
                <Route path="/cap"        element={<RotaProtegida path="/cap" perfil={profile?.perfil}><CapPage /></RotaProtegida>} />
                <Route path="/cofre"      element={<RotaProtegida path="/cofre" perfil={profile?.perfil}><CofrePage /></RotaProtegida>} />
                <Route path="/crm"          element={<RotaProtegida path="/crm" perfil={profile?.perfil}><CRMPage /></RotaProtegida>} />
                <Route path="/precificacao" element={<RotaProtegida path="/precificacao" perfil={profile?.perfil}><PrecificacaoPage /></RotaProtegida>} />
                <Route path="/mensagens"  element={<RotaProtegida path="/mensagens" perfil={profile?.perfil}><MensagensPage /></RotaProtegida>} />
                <Route path="/relatorios" element={<RotaProtegida path="/relatorios" perfil={profile?.perfil}><RelatoriosPage /></RotaProtegida>} />
                <Route path="/config"     element={<RotaProtegida path="/config" perfil={profile?.perfil}><ConfigPage /></RotaProtegida>} />
                <Route path="/meu-painel" element={<MeuPainelPage />} />
                <Route path="/ajuda"      element={<AjudaPage />} />
                <Route path="/mentoria"   element={<RotaProtegida path="/mentoria" perfil={profile?.perfil}><MentoriaPage /></RotaProtegida>} />
                <Route path="/plano-negocio" element={<RotaProtegida path="/plano-negocio" perfil={profile?.perfil}><PlanoNegocioPage /></RotaProtegida>} />
                <Route path="/admin"      element={profile?.fluxe_staff ? <AdminPage /> : <Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </PageErrorBoundary>
        </div>
      </div>
    </div>

    {/* Nav mobile */}
    <nav className="mob-nav">
      {MOB_NAV.map(item => {
        const active = !item.more && loc.pathname === item.path
        return (
          <button key={item.path || 'more'}
            className={`mob-nav-item${active ? ' on' : ''}${item.more && showMore ? ' on' : ''}`}
            onClick={() => item.more ? setShowMore(v => !v) : nav(item.path)}
          >
            <i className={item.icon} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>

    {/* Menu "Mais" mobile — todo o resto do menu que não cabe na barra */}
    {showMore && (
      <div className="mob-more-ov" onClick={() => setShowMore(false)}>
        <div className="mob-more-sheet" onClick={e => e.stopPropagation()}>
          <div className="mob-more-hd">
            <span>Menu</span>
            <button className="mob-more-close" onClick={() => setShowMore(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="mob-more-list">
            {navItems.map((item, i) => {
              if (item.grp) return <div key={i} className="sb-grp-lbl">{item.grp}</div>
              if (MOB_NAV_PATHS.has(item.path)) return null
              return (
                <button key={item.path} className="mob-more-item" onClick={() => nav(item.path)}>
                  <i className={item.icon} />
                  <span>{item.label}</span>
                </button>
              )
            })}
            <div className="sb-grp-lbl">CONTA</div>
            <button className="mob-more-item" onClick={() => nav('/meu-painel')}>
              <i className="fa-solid fa-circle-user" /> <span>Meu Painel</span>
            </button>
            {podeAcessarRota(profile?.perfil, '/config') && (
              <button className="mob-more-item" onClick={() => nav('/config')}>
                <i className="fa-solid fa-gear" /> <span>Configurações</span>
              </button>
            )}
            <button className="mob-more-item" onClick={() => nav('/ajuda')}>
              <i className="fa-solid fa-circle-question" /> <span>Central de Ajuda</span>
            </button>
            <button className="mob-more-item danger" onClick={handleSignOut}>
              <i className="fa-solid fa-arrow-right-from-bracket" /> <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    )}

    <RadarPanelOverlay />
    <TrialGuard />
    </>
  )
}
