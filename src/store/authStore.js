import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  empresa: null,
  loading: true,
  error: null,

  init: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await get().loadProfile(session.user)
      } else {
        set({ loading: false })
      }
    } catch (e) {
      console.error('Auth init error:', e)
      set({ loading: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
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
    if (error) { set({ error: error.message }); return { error: error.message } }
    return { data }
  },

  signUp: async (email, password, nome, nomeEmpresa) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { set({ error: error.message }); return { error: error.message } }

    if (data.user) {
      const { data: empresa } = await supabase
        .from('empresas')
        .insert({ nome: nomeEmpresa, email, plano: 'pro' })
        .select().single()

      if (empresa) {
        await supabase.from('usuarios').insert({
          id: data.user.id,
          empresa_id: empresa.id,
          nome, email, perfil: 'admin',
        })
      }
    }
    return { data }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, empresa: null })
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    })
    return { error }
  },

temPermissao: (acao) => {
    try {
      const raw = get().profile?.perfil
      const perfil = raw ? String(raw) : 'admin'
      const map = {
        ver_senhas:    ['admin'],
        ver_todos:     ['admin'],
        aprov_pagar:   ['admin'],
        edit_config:   ['admin'],
        ver_rent:      ['admin'],
        delete_client: ['admin'],
      }
      const lista = map[acao]
      if (!Array.isArray(lista)) return false
      return lista.includes(perfil)
    } catch {
      return false
    }
  },
  isAdmin: () => String(get().profile?.perfil || '') === 'admin',
  isOperador: () => String(get().profile?.perfil || '') === 'operador',
  getPerfil: () => String(get().profile?.perfil || 'admin'),
}))

