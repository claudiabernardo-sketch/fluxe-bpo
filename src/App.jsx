import { useEffect } from 'react'
import { supabase } from './lib/supabase'

// Refresh de sessão quando a aba volta ao foco
function SessionRefresher() {
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        await supabase.auth.refreshSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])
  return null
}
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PrivacidadePage from './pages/PrivacidadePage'
import TermosPage from './pages/TermosPage'
import MentoriaGrupoPage from './pages/MentoriaGrupoPage'
import DiagnosticoClientePage from './pages/DiagnosticoClientePage'
import DiagnosticoCaosPage from './pages/DiagnosticoCaosPage'
import AppShell from './components/layout/AppShell'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 3 * 60 * 1000,
      gcTime:    10 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
})

function AuthGuard({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#0B1220,#1E293B)',
    }}>
      <div style={{ width:14, height:14, border:'2px solid #6366F1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', marginBottom:16 }} />
      <div style={{ color:'#6366F1', fontSize:13 }}>Carregando...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])

  return (
    <QueryClientProvider client={qc}>
      <SessionRefresher />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacidade" element={<PrivacidadePage />} />
          <Route path="/termos" element={<TermosPage />} />
          <Route path="/mentoriaBPOlucrativo" element={<MentoriaGrupoPage />} />
          <Route path="/diagnostico/:clienteId" element={<DiagnosticoClientePage />} />
          <Route path="/diagnostico-caos" element={<DiagnosticoCaosPage />} />
          <Route path="/*" element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
