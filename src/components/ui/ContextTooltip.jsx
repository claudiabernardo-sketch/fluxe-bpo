import { useState } from 'react'

/**
 * Tooltip educacional — aparece na primeira visita à página.
 *
 * Props:
 *   pageKey   string  — chave única, ex: 'tarefas' (persiste em localStorage)
 *   icon      string  — emoji ou texto
 *   title     string  — título do tooltip
 *   tips      string[] — lista de dicas
 *   color     string  — cor de destaque (hex), default #6366F1
 */
const PREFIX = 'fluxe_tip_seen_'

export default function ContextTooltip({ pageKey, icon = '💡', title, tips = [], color = '#6366F1' }) {
  const key = PREFIX + pageKey
  const [visible, setVisible] = useState(() => localStorage.getItem(key) !== 'true')

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(key, 'true')
    setVisible(false)
  }

  return (
    <div style={{
      background: `${color}08`,
      border: `1px solid ${color}30`,
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 4,
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
    }}>
      {/* Ícone */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {icon}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
          {title}
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tips.map((tip, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              <span style={{ color, flexShrink: 0, marginTop: 1 }}>›</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Botão fechar */}
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#94A3B8', fontSize: 18, lineHeight: 1, padding: '2px 4px',
          flexShrink: 0,
        }}
        title="Dispensar dica"
      >×</button>
    </div>
  )
}
