// Categorias usadas pra agrupar os Materiais Gerais da Mentoria (Biblioteca).
// As primeiras seguem o ciclo de vida do cliente no BPO — "IA" é diferente,
// é transversal (serve pra qualquer etapa), por isso fica à parte, não é
// mais uma etapa do cliente.
export const ETAPAS_BPO = [
  { v: 'comercial', label: 'Comercial' },
  { v: 'pre_ob', label: 'Pré-Onboarding' },
  { v: 'onboarding', label: 'Onboarding' },
  { v: 'implantacao', label: 'Implantação' },
  { v: 'operacional', label: 'Operacional' },
  { v: 'estrategico', label: 'Estratégico' },
  { v: 'acompanhamento', label: 'Acompanhamento' },
  { v: 'encerramento', label: 'Encerramento' },
  { v: 'ia', label: 'IA' },
]

export function labelEtapa(v) {
  return ETAPAS_BPO.find(e => e.v === v)?.label || v
}
