import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import DashPage from '../../pages/DashPage'
import ClientsPage from '../../pages/ClientsPage'
import TasksPage from '../../pages/TasksPage'
import CRMPage from '../../pages/CRMPage'
import PendenciasPage from '../../pages/PendenciasPage'
import ExecPage from '../../pages/ExecPage'
import RentPage from '../../pages/RentPage'
import CofrePage from '../../pages/CofrePage'
import AprovPage from '../../pages/AprovPage'
import ConfigPage from '../../pages/ConfigPage'
import TimerBar from './TimerBar'

const NAV = [
  { section: 'Principal' },
  { path: '/',          icon: '⬡',  label: 'Dashboard'    },
  { path: '/exec',      icon: '◉',  label: 'Executivo'    },
  { section: 'Operação' },
  { path: '/tasks',     icon: '✓',  label: 'Tarefas'      },
  { path: '/clientes',  icon: '⬡',  label: 'Clientes'     },
  { path: '/pendencias',icon: '⚠',  label: 'Pendências'   },
  { section: 'Financeiro' },
  { path: '/rent',      icon: '$',  label: 'Rentabilidade'},
  { path: '/aprov',     icon: '↑',  label: 'Aprovações'   },
  { path: '/cofre',     icon: '🔒', label: 'Cofre'        },
  { section: 'Comercial' },
  { path: '/crm',       icon: '◎',  label: 'CRM'          },
  { section: 'Sistema' },
  { path: '/config',    icon: '⚙',  label: 'Config'       },
]

const TITLES = {
  '/':'Dashboard', '/exec':'Executivo', '/tasks':'Tarefas',
  '/clientes':'Clientes', '/pendencias':'Pendências',
  '/rent':'Rentabilidade', '/aprov':'Aprovações', '/cofre':'Cofre Digital',
  '/crm':'CRM', '/config':'Configurações',
}

export default function AppShell() {
  const { profile, empresa, signOut } = useAuthStore()
  const nav = useNavigate()
  const loc = useLocation()
  const [sbOpen, setSbOpen] = useState(true)

  const initials = profile?.nome?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'U'
  const title = TITLES[loc.pathname] || 'Fluxe BPO'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#F8FAFC' }}>
      {/* ── SIDEBAR ─────────────────────────────────── */}
      <aside style={{
        width: sbOpen ? 200 : 52, flexShrink:0,
        background:'#0F172A', display:'flex', flexDirection:'column',
        transition:'width .2s', overflow:'hidden',
        borderRight:'1px solid #1E293B',
      }}>
        {/* Logo */}
        <div style={{ padding:'16px 12px 12px', borderBottom:'1px solid #1E293B', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}
          onClick={() => nav('/')}>
          <svg viewBox="256 22 137 191" width="28" height="28" style={{flexShrink:0}} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lt2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b070ff"/><stop offset="100%" stopColor="#8855f5"/>
              </linearGradient>
              <linearGradient id="lb2" x1="0%" y1="0%" x2="30%" y2="100%">
                <stop offset="0%" stopColor="#5585ff"/><stop offset="45%" stopColor="#38aaff"/>
                <stop offset="100%" stopColor="#2dd4ff"/>
              </linearGradient>
            </defs>
            <path d="M 8 65 C 8 32 32 4 64 4 L 160 4 C 183 4 200 21 200 44 C 200 67 183 84 160 84 L 56 84 C 50 84 46 88 46 94 L 46 107 C 46 109.5 44 111 42 111 L 18 111 C 14.5 111 13 109 13 107 L 13 83 C 11 75 8 70 8 65 Z" fill="url(#lt2)"/>
            <path d="M 13 120 C 13 116 16 113 20 113 L 155 113 C 178 113 196 131 196 154 C 196 177 178 195 155 195 L 68 195 C 62 195 59 199 59 205 L 59 242 C 59 248 54 252 48 252 L 22 252 C 16 252 13 248 13 242 Z" fill="url(#lb2)"/>
          </svg>
          {sbOpen && <div style={{ fontWeight:800, fontSize:15, color:'#F1F5F9', letterSpacing:'-.3px' }}>
            Fluxe <span style={{ background:'linear-gradient(90deg,#A855F7,#22D3EE)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>BPO</span>
          </div>}
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 6px' }}>
          {NAV.map((item, i) => {
            if (item.section) return sbOpen ? (
              <div key={i} style={{ fontSize:9, fontWeight:700, color:'#334155', textTransform:'uppercase', letterSpacing:'.1em', padding:'12px 6px 4px' }}>
                {item.section}
              </div>
            ) : <div key={i} style={{ height:1, background:'#1E293B', margin:'6px 0' }} />

            const active = loc.pathname === item.path
            return (
              <button key={item.path} onClick={() => nav(item.path)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10,
                  padding:'7px 8px', borderRadius:8, border:'none', cursor:'pointer',
                  background: active ? '#6366F1' : 'transparent',
                  color: active ? '#fff' : '#94A3B8',
                  transition:'all .15s', textAlign:'left', marginBottom:1,
                }}
                onMouseEnter={e => { if(!active) e.currentTarget.style.background='#1E293B'; e.currentTarget.style.color='#F1F5F9' }}
                onMouseLeave={e => { if(!active) e.currentTarget.style.background='transparent'; if(!active) e.currentTarget.style.color='#94A3B8' }}
              >
                <span style={{ fontSize:13, width:20, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                {sbOpen && <span style={{ fontSize:12, fontWeight: active?600:400 }}>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding:'10px 8px', borderTop:'1px solid #1E293B' }}>
          <button onClick={() => { if(confirm('Sair do sistema?')) signOut() }}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'6px 8px',
              borderRadius:8, border:'none', cursor:'pointer', background:'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background='#1E293B'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <div style={{ width:28, height:28, borderRadius:'50%', background:'#6366F1',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {initials}
            </div>
            {sbOpen && <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {profile?.nome || 'Usuário'}
              </div>
              <div style={{ fontSize:9, color:'#64748B' }}>{profile?.perfil || 'admin'}</div>
            </div>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Topbar */}
        <header style={{ height:48, background:'#fff', borderBottom:'1px solid #E2E8F0',
          display:'flex', alignItems:'center', padding:'0 20px', gap:12, flexShrink:0 }}>
          <button onClick={() => setSbOpen(v=>!v)}
            style={{ border:'none', background:'none', cursor:'pointer', color:'#64748B', fontSize:18, lineHeight:1 }}>
            ☰
          </button>
          <span style={{ fontWeight:600, fontSize:14, color:'#0F172A', flex:1 }}>{title}</span>
          {empresa && (
            <span style={{ fontSize:10, background:'#EEF2FF', color:'#4338CA', padding:'3px 10px', borderRadius:99, fontWeight:600 }}>
              {empresa.nome}
            </span>
          )}
        </header>

        {/* Timer bar */}
        <TimerBar />

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', padding:20 }} className="fade-in">
          <Routes>
            <Route path="/"          element={<DashPage />} />
            <Route path="/exec"      element={<ExecPage />} />
            <Route path="/tasks"     element={<TasksPage />} />
            <Route path="/clientes"  element={<ClientsPage />} />
            <Route path="/pendencias"element={<PendenciasPage />} />
            <Route path="/rent"      element={<RentPage />} />
            <Route path="/aprov"     element={<AprovPage />} />
            <Route path="/cofre"     element={<CofrePage />} />
            <Route path="/crm"       element={<CRMPage />} />
            <Route path="/config"    element={<ConfigPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
