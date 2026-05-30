// ── UI Components — usando classes CSS do v5 ─────────────────────

export function Card({ children, style, className }) {
  return (
    <div className={`card${className?' '+className:''}`} style={style}>
      {children}
    </div>
  )
}

export function CardHeader({ title, icon, right, style }) {
  return (
    <div className="ch" style={style}>
      <div className="ct">
        {icon && <i className={icon} style={{ marginRight:6, fontSize:13 }}></i>}
        {title}
      </div>
      {right && <div style={{ display:'flex', gap:6, alignItems:'center' }}>{right}</div>}
    </div>
  )
}

const COLORS = {
  blue:'#6366F1', green:'#22C55E', red:'#EF4444',
  yellow:'#F59E0B', purple:'#A855F7', cyan:'#22D3EE', orange:'#F97316',
}

export function KpiCard({ label, value, sub, trend, color = 'blue', style }) {
  const c = COLORS[color] || color
  return (
    <div className="kpi-card" style={{ position:'relative', overflow:'hidden', ...style }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:c }} />
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color:c }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {trend && <div className="kpi-sub" style={{ color: trend > 0 ? 'var(--grt)' : 'var(--rdt)', fontWeight:700 }}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>}
    </div>
  )
}

const BADGE_MAP = {
  gray:   'b-gy', blue: 'b-bl', green: 'b-gr',
  red:    'b-rd', yellow: 'b-yw', purple: 'b-pu',
  cyan:   'b-cy', orange: 'b-or',
}
export function Badge({ label, color = 'gray' }) {
  return <span className={`b ${BADGE_MAP[color] || 'b-gy'}`}>{label}</span>
}

const PRIO_MAP = { alta:'rd', media:'yw', baixa:'gr' }
const PRIO_LABEL = { alta:'Alta', media:'Média', baixa:'Baixa' }
const STATUS_MAP = { aberta:'bl', andamento:'yw', aguardando:'pu', revisao:'or', concluida:'gr', impedimento:'rd' }
const STATUS_LABEL = { aberta:'Aberta', andamento:'Em andamento', aguardando:'Ag. cliente', revisao:'Revisão', concluida:'Concluída', impedimento:'Impedimento' }

export function PrioBadge({ v }) {
  return <span className={`b b-${PRIO_MAP[v]||'gy'}`}>{PRIO_LABEL[v]||v}</span>
}
export function StatusBadge({ v }) {
  return <span className={`b b-${STATUS_MAP[v]||'gy'}`}>{STATUS_LABEL[v]||v}</span>
}

export function Btn({ children, onClick, variant = 'outline', small, disabled, style, className }) {
  const cls = {
    primary: 'btn bp',
    danger:  'btn btn-danger',
    outline: 'btn bo',
    success: 'btn btn-success',
  }[variant] || 'btn bo'
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      className={`${cls}${small?' bsm':''}${className?' '+className:''}`}
      disabled={disabled}
      style={{ opacity: disabled ? .55 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {children}
    </button>
  )
}

export function Loader({ size = 20 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
      <div style={{
        width:size, height:size, border:`2px solid var(--s3)`,
        borderTopColor:'var(--br)', borderRadius:'50%',
        animation:'spin 1s linear infinite',
      }} />
    </div>
  )
}

export function EmptyState({ icon = '📭', title, sub, action }) {
  return (
    <div style={{ padding:'48px 20px', textAlign:'center' }}>
      <div style={{ fontSize:36, marginBottom:14 }}>{icon}</div>
      <div style={{ fontWeight:600, fontSize:14, color:'var(--tx)', marginBottom:6 }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:'var(--tx3)', marginBottom:18 }}>{sub}</div>}
      {action}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type='text', style }) {
  return (
    <input
      type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder}
      className="fi"
      style={style}
    />
  )
}

export function fmt(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

export function fmtR(v) {
  if (v == null) return '—'
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits:2 })
}

export function isVencida(prazo, status) {
  if (!prazo || status === 'concluida') return false
  return prazo < new Date().toISOString().slice(0,10)
}
