// ── UI Components compartilhados ──────────────────────

export function Card({ children, style, className }) {
  return (
    <div className={className} style={{
      background:'#fff', border:'1px solid #E2E8F0',
      borderRadius:12, ...style
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ title, icon, right, style }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'12px 16px', borderBottom:'1px solid #F1F5F9', ...style }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:13, color:'#0F172A' }}>
        {icon && <span style={{ fontSize:14 }}>{icon}</span>}
        {title}
      </div>
      {right && <div style={{ display:'flex', gap:6, alignItems:'center' }}>{right}</div>}
    </div>
  )
}

export function KpiCard({ label, value, sub, trend, color = '#6366F1', style }) {
  const colors = {
    blue:'#6366F1', green:'#22C55E', red:'#EF4444',
    yellow:'#F59E0B', purple:'#8B5CF6', cyan:'#22D3EE', orange:'#F97316',
  }
  const c = colors[color] || color
  return (
    <div style={{
      background:'#fff', border:'1px solid #E2E8F0', borderRadius:12,
      padding:'14px 16px', position:'relative', overflow:'hidden', ...style
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:c }} />
      <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>
        {label}
      </div>
      <div style={{ fontSize:24, fontWeight:800, color:'#0F172A', letterSpacing:'-.5px', lineHeight:1, marginBottom:4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize:10, color:'#64748B' }}>{sub}</div>}
      {trend && <div style={{ fontSize:10, fontWeight:700, color: trend > 0 ? '#15803D' : '#991B1B', marginTop:2 }}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mês ant.
      </div>}
    </div>
  )
}

export function Badge({ label, color = 'gray' }) {
  const map = {
    gray:   { bg:'#F1F5F9', text:'#475569' },
    blue:   { bg:'#EEF2FF', text:'#4338CA' },
    green:  { bg:'#F0FDF4', text:'#166534' },
    red:    { bg:'#FEF2F2', text:'#991B1B' },
    yellow: { bg:'#FFFBEB', text:'#92400E' },
    purple: { bg:'#F5F3FF', text:'#5B21B6' },
    cyan:   { bg:'#ECFEFF', text:'#0E7490' },
    orange: { bg:'#FFF7ED', text:'#9A3412' },
  }
  const { bg, text } = map[color] || map.gray
  return (
    <span style={{ display:'inline-block', fontSize:10, fontWeight:700, padding:'2px 8px',
      borderRadius:99, background:bg, color:text }}>
      {label}
    </span>
  )
}

const PRIO_COLOR = { alta:'red', media:'yellow', baixa:'green' }
const PRIO_LABEL = { alta:'Alta', media:'Média', baixa:'Baixa' }
const STATUS_COLOR = { aberta:'blue', andamento:'yellow', aguardando:'purple', revisao:'orange', concluida:'green', impedimento:'red' }
const STATUS_LABEL = { aberta:'Aberta', andamento:'Em andamento', aguardando:'Ag. cliente', revisao:'Revisão', concluida:'Concluída', impedimento:'Impedimento' }

export function PrioBadge({ v }) { return <Badge label={PRIO_LABEL[v]||v} color={PRIO_COLOR[v]||'gray'} /> }
export function StatusBadge({ v }) { return <Badge label={STATUS_LABEL[v]||v} color={STATUS_COLOR[v]||'gray'} /> }

export function Btn({ children, onClick, variant = 'outline', small, disabled, style }) {
  const base = {
    border:'none', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius:8,
    fontWeight:600, fontFamily:'inherit', fontSize: small ? 11 : 12,
    padding: small ? '4px 10px' : '7px 14px', transition:'all .15s',
    opacity: disabled ? .55 : 1, ...style,
  }
  const variants = {
    primary: { background:'#6366F1', color:'#fff' },
    danger:  { background:'#FEF2F2', color:'#991B1B', border:'1px solid #FECDD3' },
    outline: { background:'transparent', color:'#475569', border:'1px solid #E2E8F0' },
    success: { background:'#F0FDF4', color:'#166534', border:'1px solid #BBF7D0' },
  }
  return (
    <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  )
}

export function Loader({ size = 20 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
      <div style={{
        width:size, height:size, border:`2px solid #E2E8F0`,
        borderTopColor:'#6366F1', borderRadius:'50%',
        animation:'spin 1s linear infinite',
      }} />
    </div>
  )
}

export function EmptyState({ icon = '📭', title, sub, action }) {
  return (
    <div style={{ padding:'40px 20px', textAlign:'center' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>{icon}</div>
      <div style={{ fontWeight:600, fontSize:14, color:'#334155', marginBottom:4 }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:'#94A3B8', marginBottom:16 }}>{sub}</div>}
      {action}
    </div>
  )
}

export function Avatar({ initials, color = '#6366F1', size = 32 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:color,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.32, fontWeight:700, color:'#fff', flexShrink:0,
    }}>
      {initials}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type='text', style }) {
  return (
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0',
        borderRadius:8, fontSize:12, fontFamily:'inherit', outline:'none',
        background:'#fff', color:'#0F172A', ...style }}
      onFocus={e=>e.target.style.borderColor='#6366F1'}
      onBlur={e=>e.target.style.borderColor='#E2E8F0'}
    />
  )
}

export function Select({ value, onChange, options, style }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8,
        fontSize:12, fontFamily:'inherit', background:'#fff', color:'#0F172A',
        cursor:'pointer', outline:'none', ...style }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
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
