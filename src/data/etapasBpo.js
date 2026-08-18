// Etapas do ciclo do cliente no BPO — mesma taxonomia usada em ModelosPage.jsx
// (campo `etapa` dos modelos de tarefa), reaproveitada aqui pra agrupar os
// Materiais Gerais da Mentoria.
export const ETAPAS_BPO = [
  { v: 'comercial', label: 'Comercial' },
  { v: 'pre_ob', label: 'Pré-Onboarding' },
  { v: 'onboarding', label: 'Onboarding' },
  { v: 'implantacao', label: 'Implantação' },
  { v: 'operacional', label: 'Operacional' },
  { v: 'estrategico', label: 'Estratégico' },
  { v: 'acompanhamento', label: 'Acompanhamento' },
  { v: 'encerramento', label: 'Encerramento' },
]

export function labelEtapa(v) {
  return ETAPAS_BPO.find(e => e.v === v)?.label || v
}
