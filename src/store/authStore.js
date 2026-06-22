import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  empresa: null,
  loading: true,
  error: null,

  init: async () => {
    // 1. Carrega sessão atual imediatamente (confiável, sem depender de eventos)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await get().loadProfile(session.user)
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }

    // 2. Escuta mudanças futuras (login, logout, refresh de token)
    //    Ignora INITIAL_SESSION — já foi tratado acima
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' && !session?.user) return
      if (session?.user) {
        await get().loadProfile(session.user)
      } else {
        set({ user: null, profile: null, empresa: null, loading: false })
      }
    })
  },

  loadProfile: async (user) => {
    try {
      const { data: profile } = await supabase
        .from('usuarios')
        .select('*, empresas(*)')
        .eq('id', user.id)
        .single()

      set({
        user,
        profile: profile || null,
        empresa: profile?.empresas || null,
        loading: false,
        error: null,
      })
    } catch {
      // Profile not found — still allow access, just without profile
      set({ user, profile: null, empresa: null, loading: false })
    }
  },

  signIn: async (email, password) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ error: error.message }); return { error } }
    return { data }
  },

  signUp: async (email, password, nome, nomeEmpresa) => {
    set({ error: null })

    // Validação mínima de senha no cliente
    if (password.length < 6) {
      const err = { message: 'A senha deve ter pelo menos 6 caracteres.' }
      set({ error: err.message }); return { error: err }
    }

    // nome e nomeEmpresa são passados como metadata →
    // o trigger handle_new_user() no banco cria empresa + usuario
    // com SECURITY DEFINER (sem depender de sessão/RLS)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome, nomeEmpresa },
      },
    })
    if (error) { set({ error: error.message }); return { error } }
    return { data }
  },

  signOut: async () => {
    set({ user: null, profile: null, empresa: null, loading: false })
    try { await supabase.auth.signOut({ scope: 'local' }) } catch {}
    window.location.href = '/login'
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  },

  // ── MFA / 2FA ────────────────────────────────────────────
  mfaEnroll: async () => {
    // Retorna { qrCode, secret, factorId } pra mostrar pro usuário configurar
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Fluxe BPO' })
    if (error) return { error }
    return {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    }
  },

  mfaVerifyEnroll: async (factorId, code) => {
    // Confirma que o usuário digitou o código certo do app autenticador
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeErr) return { error: challengeErr }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
    return { error }
  },

  mfaUnenroll: async (factorId) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    return { error }
  },

  mfaListFactors: async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) return { factors: [] }
    return { factors: data?.totp || [] }
  },

  mfaChallenge: async () => {
    // Chamado no login quando o usuário tem 2FA ativo
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const totp = factors?.totp?.[0]
    if (!totp) return { error: { message: 'Nenhum fator 2FA cadastrado' } }
    const { data: challenge, error } = await supabase.auth.mfa.challenge({ factorId: totp.id })
    if (error) return { error }
    return { factorId: totp.id, challengeId: challenge.id }
  },

  mfaVerifyLogin: async (factorId, challengeId, code) => {
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
    if (error) return { error }
    // Após verificar, recarrega o perfil com a sessão AAL2
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await get().loadProfile(user)
    return { error: null }
  },

  temPermissao: (acao) => {
    const perfil = get().profile?.perfil || 'sem_perfil'
    const map = {
      ver_senhas:    ['admin', 'gestor'],
      ver_todos:     ['admin', 'gestor', 'supervisor'],
      aprov_pagar:   ['admin', 'gestor', 'supervisor'],
      edit_config:   ['admin'],
      ver_rent:      ['admin', 'gestor'],
      delete_client: ['admin', 'gestor'],
    }
    return (map[acao] || []).includes(perfil)
  },
}))
