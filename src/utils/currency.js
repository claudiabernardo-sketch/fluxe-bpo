// ── currency.js ──────────────────────────────────────────────────────────
// Conversão entre o formato brasileiro ("15.000,00") e número puro, usada em
// todo campo de valor em dinheiro do Fluxe. Antes cada tela tinha sua própria
// cópia dessa lógica (ou nem tinha, usando <input type="number"> que só
// aceita ponto decimal e não mostra separador de milhar).

// "15.000,00" ou "15000" → 15000
export function parseBRL(str) {
  if (str === '' || str == null) return null
  const clean = String(str).trim().replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(clean)
  return Number.isNaN(n) ? null : n
}

// 15000 → "15.000,00" — pra mostrar um valor salvo no mesmo formato que a
// pessoa digita.
export function formatBRL(n) {
  if (n === null || n === undefined || n === '') return ''
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
