import { create } from 'zustand'

// Painel lateral do Radar do Cliente — pode ser aberto de qualquer lugar do
// app (lista de Clientes, insights do Dashboard, Executivo) sem navegar pra
// uma rota nova, então não carrega o resto da ficha do cliente (Dados,
// Financeiro, Bancos, Cofre, Rotina, Escopo) — só o que a pessoa veio ver.
export const useRadarPanelStore = create((set) => ({
  clienteId: null,
  clienteNome: null,
  abrir: (clienteId, clienteNome) => set({ clienteId, clienteNome }),
  fechar: () => set({ clienteId: null, clienteNome: null }),
}))
