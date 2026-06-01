import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import DashPage from '../../pages/DashPage'
import ClientsPage from '../../pages/ClientsPage'
import TasksPage from '../../pages/TasksPage'
import AvulsasPage from '../../pages/AvulsasPage'
import EsteirasPage from '../../pages/EsteirasPage'
import CRMPage from '../../pages/CRMPage'
import PendenciasPage from '../../pages/PendenciasPage'
import ExecPage from '../../pages/ExecPage'
import RentPage from '../../pages/RentPage'
import CofrePage from '../../pages/CofrePage'
import AprovPage from '../../pages/AprovPage'
import CapPage from '../../pages/CapPage'
import AgendaPage from '../../pages/AgendaPage'
import RelatoriosPage from '../../pages/RelatoriosPage'
import PrecificacaoPage from '../../pages/PrecificacaoPage'
import ConfigPage from '../../pages/ConfigPage'
import TimerBar from './TimerBar'

const LOGO = "data:image/png;base64,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"

const NAV = [
  { path:'/',           icon:'fa-solid fa-house',               label:'Início'      },
  { path:'/tasks',      icon:'fa-solid fa-check',                label:'Tarefas'     },
  { path:'/pendencias', icon:'fa-solid fa-triangle-exclamation', label:'Pendênc.'    },
  { path:'/avulsas',    icon:'fa-solid fa-bolt',                 label:'Livres'      },
  { sep:true },
  { path:'/crm',        icon:'fa-solid fa-chart-line',           label:'CRM'         },
  { path:'/prec',       icon:'fa-solid fa-tag',                  label:'Preço'       },
  { sep:true },
  { path:'/clientes',   icon:'fa-solid fa-building',             label:'Clientes'    },
  { path:'/esteiras',   icon:'fa-solid fa-layer-group',          label:'Esteiras'    },
  { path:'/agenda',     icon:'fa-regular fa-calendar',           label:'Agenda'      },
  { sep:true },
  { path:'/exec',       icon:'fa-solid fa-gauge-high',           label:'Exec'        },
  { path:'/rent',       icon:'fa-solid fa-chart-pie',            label:'Rent.'       },
  { path:'/cap',        icon:'fa-solid fa-gauge',                label:'Cap.'        },
  { path:'/cofre',      icon:'fa-solid fa-shield-halved',        label:'Cofre'       },
  { path:'/aprov',      icon:'fa-solid fa-circle-check',         label:'Aprovac.'    },
  { sep:true },
  { path:'/relatorios', icon:'fa-solid fa-chart-column',         label:'Relatórios'  },
  { path:'/config',     icon:'fa-solid fa-gear',                 label:'Config'      },
]

const TITLES = {
  '/':'Dashboard', '/exec':'Executivo', '/tasks':'Tarefas', '/avulsas':'Tarefas Livres',
  '/esteiras':'Esteiras Operacionais', '/clientes':'Clientes', '/pendencias':'Pendências',
  '/agenda':'Agenda', '/rent':'Rentabilidade', '/cap':'Capacidade Operacional',
  '/aprov':'Aprovações', '/cofre':'Cofre Digital', '/crm':'CRM Comercial', '/prec':'Precificação',
  '/relatorios':'Relatórios', '/config':'Configurações',
}

export default function AppShell() {
  const { profile, empresa, signOut } = useAuthStore()
  const nav = useNavigate()
  const loc = useLocation()
  const initials = profile?.nome?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'U'
  const title = TITLES[loc.pathname] || 'Fluxe BPO'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      {/* ── SIDEBAR ─── */}
      <aside className="sb">
        {/* Logo */}
        <div className="sb-logo" onClick={() => nav('/')} title="Ir para o Dashboard">
          <img src={LOGO} alt="Fluxe BPO" style={{ width:32, height:32, objectFit:'contain' }} />
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'4px 0' }}>
          {NAV.map((item, i) => {
            if (item.sep) return <div key={i} className="sb-sep" />
            const active = loc.pathname === item.path
            return (
              <div key={item.path}
                className={`si${active?' on':''}`}
                onClick={() => nav(item.path)}
                title={item.label}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </div>
            )
          })}
        </nav>

        {/* User avatar */}
        <div style={{ padding:'8px 6px', borderTop:'1px solid var(--sb2)' }}>
          <div
            className="si"
            onClick={() => { if(confirm('Sair do sistema?')) signOut() }}
            title={`${profile?.nome || 'Usuário'} — Clique para sair`}
            style={{ cursor:'pointer' }}
          >
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background:'var(--br)', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0
            }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--tx)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {profile?.nome || 'Usuário'}
              </div>
              <div style={{ fontSize:9, color:'var(--tx3)' }}>{profile?.perfil}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ─── */}
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

        {/* Pages */}
        <div className="pgs fade-in" style={{ flex:1, overflow:'auto', padding:'16px', width:'100%', minWidth:0 }}>
          <Routes>
            <Route path="/"           element={<DashPage />} />
            <Route path="/exec"       element={<ExecPage />} />
            <Route path="/tasks"      element={<TasksPage />} />
            <Route path="/avulsas"    element={<AvulsasPage />} />
            <Route path="/esteiras"   element={<EsteirasPage />} />
            <Route path="/clientes"   element={<ClientsPage />} />
            <Route path="/pendencias" element={<PendenciasPage />} />
            <Route path="/agenda"     element={<AgendaPage />} />
            <Route path="/rent"       element={<RentPage />} />
            <Route path="/cap"        element={<CapPage />} />
            <Route path="/aprov"      element={<AprovPage />} />
            <Route path="/cofre"      element={<CofrePage />} />
            <Route path="/crm"        element={<CRMPage />} />
            <Route path="/prec"       element={<PrecificacaoPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/config"     element={<ConfigPage />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}


