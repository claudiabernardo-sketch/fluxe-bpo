import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import AppShell from './components/layout/AppShell'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AuthGuard({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Splash() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#0B1220,#1E293B)',
    }}>
      <svg viewBox="256 22 137 191" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b070ff"/><stop offset="100%" stopColor="#8855f5"/>
          </linearGradient>
          <linearGradient id="lb" x1="0%" y1="0%" x2="30%" y2="100%">
            <stop offset="0%" stopColor="#5585ff"/><stop offset="45%" stopColor="#38aaff"/>
            <stop offset="100%" stopColor="#2dd4ff"/>
          </linearGradient>
        </defs>
        <path d="M 8 65 C 8 32 32 4 64 4 L 160 4 C 183 4 200 21 200 44 C 200 67 183 84 160 84 L 56 84 C 50 84 46 88 46 94 L 46 107 C 46 109.5 44 111 42 111 L 18 111 C 14.5 111 13 109 13 107 L 13 83 C 11 75 8 70 8 65 Z" fill="url(#lt)"/>
        <path d="M 13 120 C 13 116 16 113 20 113 L 155 113 C 178 113 196 131 196 154 C 196 177 178 195 155 195 L 68 195 C 62 195 59 199 59 205 L 59 242 C 59 248 54 252 48 252 L 22 252 C 16 252 13 248 13 242 Z" fill="url(#lb)"/>
      </svg>
      <div style={{ marginTop:16, color:'#6366F1', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:14, height:14, border:'2px solid #6366F1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
        Carregando…
      </div>
    </div>
  )
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
