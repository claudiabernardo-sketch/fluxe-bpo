import { useState, useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

// Timer global store
export const useTimerStore = create((set, get) => ({
  active: null,   // { taskId, taskTitle, clientId, clientName, start, paused, totalPaused }
  elapsed: 0,

  start: (taskId, taskTitle, clientId, clientName) => {
    const { active } = get()
    if (active) get().stop(false)
    set({ active: { taskId, taskTitle, clientId, clientName, start: Date.now(), paused: false, totalPaused: 0 }, elapsed: 0 })
  },
  pause: () => {
    const { active } = get()
    if (!active || active.paused) return
    set({ active: { ...active, paused: true, pauseAt: Date.now() } })
  },
  resume: () => {
    const { active } = get()
    if (!active || !active.paused) return
    const added = Date.now() - active.pauseAt
    set({ active: { ...active, paused: false, pauseAt: null, totalPaused: active.totalPaused + added } })
  },
  stop: async (save = true) => {
    const { active, elapsed } = get()
    if (!active) return
    if (save && elapsed > 10) {
      const profile = useAuthStore.getState().profile
      await supabase.from('apontamentos').insert({
        tarefa_id:   active.taskId   || null,
        cliente_id:  active.clientId || null,
        usuario_id:  profile?.id     || null,
        inicio:      new Date(active.start).toISOString(),
        fim:         new Date().toISOString(),
        segundos:    elapsed,
      })
      // cache invalidation handled by TimerBar component
    }
    set({ active: null, elapsed: 0 })
  },
  tick: () => {
    const { active } = get()
    if (!active || active.paused) return
    const elapsed = Math.round((Date.now() - active.start - active.totalPaused) / 1000)
    set({ elapsed })
  },
}))

function fmtHHMM(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
}

export default function TimerBar() {
  const { active, elapsed, pause, resume, stop } = useTimerStore()
  const tick = useTimerStore(s => s.tick)
  const intRef = useRef(null)
  const qc = useQueryClient()

  const handleStop = async () => {
    await stop(true)
    qc.invalidateQueries({ queryKey: ['apontamentos'] })
  }

  useEffect(() => {
    if (active && !active.paused) {
      intRef.current = setInterval(tick, 1000)
    } else {
      clearInterval(intRef.current)
    }
    return () => clearInterval(intRef.current)
  }, [active?.paused, !!active])

  if (!active) return null

  return (
    <div style={{
      background: '#F0FDF4', borderBottom:'1px solid #BBF7D0',
      padding:'6px 20px', display:'flex', alignItems:'center', gap:12,
    }}>
      {/* Pulse dot */}
      <div style={{ position:'relative', width:10, height:10, flexShrink:0 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background: active.paused ? '#F59E0B' : '#22C55E' }} />
        {!active.paused && <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#22C55E', opacity:.4, animation:'ping 1.5s infinite' }} />}
      </div>

      <div style={{ fontFamily:'monospace', fontSize:17, fontWeight:700, color: active.paused ? '#92400E' : '#166534', minWidth:80 }}>
        {fmtHHMM(elapsed)}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#15803D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {active.taskTitle || 'Tarefa sem título'}
        </div>
        {active.clientName && (
          <div style={{ fontSize:10, color:'#4B7D5A' }}>{active.clientName}</div>
        )}
      </div>

      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        {active.paused ? (
          <button onClick={resume} style={{ padding:'4px 12px', borderRadius:8, border:'none', cursor:'pointer', background:'#6366F1', color:'#fff', fontSize:11, fontWeight:600 }}>
            ▶ Retomar
          </button>
        ) : (
          <button onClick={pause} style={{ padding:'4px 12px', borderRadius:8, border:'1px solid #BBF7D0', cursor:'pointer', background:'transparent', color:'#15803D', fontSize:11, fontWeight:600 }}>
            ⏸ Pausar
          </button>
        )}
        <button onClick={handleStop} style={{ padding:'4px 12px', borderRadius:8, border:'1px solid #FECDD3', cursor:'pointer', background:'#FEF2F2', color:'#991B1B', fontSize:11, fontWeight:600 }}>
          ⏹ Parar
        </button>
      </div>
    </div>
  )
}
