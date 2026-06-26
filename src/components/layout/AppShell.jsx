import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import LOGO_SRC from '../../assets/logo-fluxe.png'
import TimerBar from './TimerBar'
import TrialGuard from '../ui/TrialGuard'

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
const MeuPainelPage      = lazy(() => import('../../pages/MeuPainelPage'))
const AjudaPage          = lazy(() => import('../../pages/AjudaPage'))
const PrecificacaoPage   = lazy(() => import('../../pages/PrecificacaoPage'))

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
  { path:'/modelos',    icon:'fa-solid fa-rotate',              label:'Rotinas'   },
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
  '/modelos':    'Rotinas',
  '/meu-painel': 'Meu Painel',
  '/ajuda':      'Central de Ajuda',
}

const MOB_NAV = [
  { path:'/',         icon:'fa-solid fa-house',       label:'Início'  },
  { path:'/tasks',    icon:'fa-solid fa-list-check',  label:'Tarefas' },
  { path:'/agenda',   icon:'fa-solid fa-rocket',      label:'Central' },
  { path:'/clientes', icon:'fa-solid fa-building',    label:'Clientes'},
  { path:'/config',   icon:'fa-solid fa-gear',        label:'Mais'    },
]

export default function AppShell() {
  const { profile, empresa, signOut } = useAuthStore()
  const nav = useNavigate()
  const loc = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const title = TITLES[loc.pathname] || 'Fluxe BPO'
  const initials = profile?.nome?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

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
  useEffect(() => { setShowMenu(false) }, [loc.pathname])

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
          {NAV.map((item, i) => {
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
              <button className="user-menu-item" onClick={() => goTo('/config')}>
                <i className="fa-solid fa-gear"></i> Configurações
              </button>
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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"           element={<DashPage />} />
              <Route path="/exec"       element={<ExecPage />} />
              <Route path="/tasks"      element={<TasksPage />} />
              <Route path="/avulsas"    element={<AvulsasPage />} />
              <Route path="/modelos"    element={<ModelosPage />} />
              <Route path="/esteiras"   element={<EsteirasPage />} />
              <Route path="/clientes"   element={<ClientsPage />} />
              <Route path="/pendencias" element={<PendenciasPage />} />
              <Route path="/agenda"     element={<AgendaPage />} />
              <Route path="/rent"       element={<RentPage />} />
              <Route path="/cap"        element={<CapPage />} />
              <Route path="/cofre"      element={<CofrePage />} />
              <Route path="/crm"          element={<CRMPage />} />
              <Route path="/precificacao" element={<PrecificacaoPage />} />
              <Route path="/mensagens"  element={<MensagensPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
              <Route path="/config"     element={<ConfigPage />} />
              <Route path="/meu-painel" element={<MeuPainelPage />} />
              <Route path="/ajuda"      element={<AjudaPage />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>

    {/* Nav mobile */}
    <nav className="mob-nav">
      {MOB_NAV.map(item => {
        const active = loc.pathname === item.path
        return (
          <button key={item.path}
            className={`mob-nav-item${active ? ' on' : ''}`}
            onClick={() => nav(item.path)}
          >
            <i className={item.icon} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
    </>
  )
}
