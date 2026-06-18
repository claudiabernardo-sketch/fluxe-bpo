const fs = require('fs')
let c = fs.readFileSync('src/pages/ModelosPage.jsx', 'utf8')

// 1. Adicionar imports necessários
c = c.replace(
  "import { useState } from 'react'",
  "import { useState, useCallback } from 'react'"
)

c = c.replace(
  "import { useTarefaModelos, useCreateModelo, useUpdateModelo, useDeleteModelo, useClients } from '../hooks/useData'",
  "import { useTarefaModelos, useCreateModelo, useUpdateModelo, useDeleteModelo, useClients } from '../hooks/useData'\nimport { supabase } from '../lib/supabase'\nimport { useAuthStore } from '../store/authStore'"
)

// 2. Adicionar estado e função de geração após o useState inicial do componente
const INSERT_AFTER = "  const deleteModelo = useDeleteModelo()\n\n  const [modal, setModal]"
const NEW_CODE = `  const deleteModelo = useDeleteModelo()
  const { empresa } = useAuthStore()
  const [gerando, setGerando] = useState(false)
  const [geracaoModal, setGeracaoModal] = useState(false)
  const [mesGeracao, setMesGeracao] = useState(() => {
    const d = new Date()
    return \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}\`
  })
  const [geracaoLog, setGeracaoLog] = useState([])

  async function gerarMes() {
    if (!mesGeracao) return alert('Selecione o mês')
    setGerando(true)
    setGeracaoLog([])
    const log = []

    try {
      // Buscar todos os modelos ativos
      const { data: modelosAtivos } = await supabase
        .from('tarefa_modelos')
        .select('*')
        .eq('ativo', true)
        .eq('empresa_id', empresa?.id)

      // Buscar todos os clientes ativos
      const { data: clientesAtivos } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', empresa?.id)

      if (!modelosAtivos?.length) {
        setGeracaoLog(['Nenhum modelo ativo encontrado.'])
        setGerando(false)
        return
      }

      let totalGeradas = 0

      for (const modelo of modelosAtivos) {
        // Determinar quais clientes esse modelo se aplica
        const clientes = modelo.cliente_id
          ? clientesAtivos.filter(c => c.id === modelo.cliente_id)
          : clientesAtivos

        for (const cliente of clientes) {
          // Verificar se já foi gerado para esse mês
          const { data: jaGerado } = await supabase
            .from('tarefa_geracoes')
            .select('id')
            .eq('modelo_id', modelo.id)
            .eq('cliente_id', cliente.id)
            .eq('mes_ano', mesGeracao)
            .maybeSingle()

          if (jaGerado) {
            log.push(\`⏭ \${modelo.titulo} → \${cliente.fantasia||cliente.razao_social} (já gerado)\`)
            continue
          }

          // Calcular data de execução baseada no dia_mes e mês selecionado
          const [ano, mes] = mesGeracao.split('-').map(Number)
          const diaExec = modelo.dia_mes || 5
          const dataExec = \`\${mesGeracao}-\${String(diaExec).padStart(2,'0')}\`

          // Para conciliação bancária — gerar uma tarefa por banco
          const ehConciliacao = modelo.categoria === 'Conciliação Bancária'
          const bancos = cliente.bancos || []

          if (ehConciliacao && bancos.length > 0) {
            for (const banco of bancos) {
              const { data: tarefa } = await supabase
                .from('tarefas')
                .insert({
                  titulo: \`\${modelo.titulo} — \${banco}\`,
                  categoria: modelo.categoria,
                  prioridade: modelo.prioridade || 'media',
                  status: 'aberta',
                  cliente_id: cliente.id,
                  empresa_id: empresa?.id,
                  modelo_id: modelo.id,
                  data_execucao: dataExec,
                  prazo: dataExec,
                })
                .select().single()

              if (tarefa?.id && modelo.checklist_items?.length) {
                await supabase.from('tarefa_checklists').insert(
                  modelo.checklist_items.map((texto, ordem) => ({
                    tarefa_id: tarefa.id,
                    empresa_id: empresa?.id,
                    texto, ordem
                  }))
                )
              }
              totalGeradas++
            }
          } else {
            // Tarefa normal
            const { data: tarefa } = await supabase
              .from('tarefas')
              .insert({
                titulo: modelo.titulo,
                categoria: modelo.categoria,
                prioridade: modelo.prioridade || 'media',
                status: 'aberta',
                cliente_id: cliente.id,
                empresa_id: empresa?.id,
                modelo_id: modelo.id,
                data_execucao: dataExec,
                prazo: dataExec,
              })
              .select().single()

            if (tarefa?.id && modelo.checklist_items?.length) {
              await supabase.from('tarefa_checklists').insert(
                modelo.checklist_items.map((texto, ordem) => ({
                  tarefa_id: tarefa.id,
                  empresa_id: empresa?.id,
                  texto, ordem
                }))
              )
            }
            totalGeradas++
          }

          // Registrar geração para evitar duplicatas
          await supabase.from('tarefa_geracoes').insert({
            modelo_id: modelo.id,
            cliente_id: cliente.id,
            empresa_id: empresa?.id,
            mes_ano: mesGeracao,
            tarefas_geradas: ehConciliacao && bancos.length > 0 ? bancos.length : 1
          })

          log.push(\`✅ \${modelo.titulo} → \${cliente.fantasia||cliente.razao_social}\`)
        }
      }

      log.push(\`\\n🎉 Total: \${totalGeradas} tarefas geradas para \${mesGeracao}\`)
      setGeracaoLog(log)
    } catch (err) {
      log.push(\`❌ Erro: \${err.message}\`)
      setGeracaoLog(log)
    }

    setGerando(false)
  }

  const [modal, setModal]`

c = c.replace(INSERT_AFTER, NEW_CODE)

// 3. Adicionar botão "Gerar mês" no header da página
c = c.replace(
  "  const fi = { width:'100%'",
  `  const mesLabel = mesGeracao ? new Date(mesGeracao + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : ''

  const fi = { width:'100%'`
)

fs.writeFileSync('src/pages/ModelosPage.jsx', c)
console.log('OK1 - imports e funcao gerarMes adicionados')
console.log('gerarMes:', c.includes('gerarMes'))
console.log('geracaoModal:', c.includes('geracaoModal'))