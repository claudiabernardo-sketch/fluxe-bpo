import { useEffect, useState } from 'react'
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
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#0B1220,#1E293B)',
    }}>
      <div style={{ width:14, height:14, border:'2px solid #6366F1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', marginBottom:16 }} />
      <div style={{ color:'#6366F1', fontSize:13 }}>
        {slow ? 'Conectando ao banco de dados...' : 'Carregando...'}
      </div>
      {slow && (
        <button onClick={() => window.location.reload()}
          style={{ marginTop:16, padding:'6px 14px', background:'#6366F1', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:12 }}>
          Tentar novamente
        </button>
      )}
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
