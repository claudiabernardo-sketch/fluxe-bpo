const fs = require('fs')
let c = fs.readFileSync('src/pages/ClientsPage.jsx', 'utf8')

// 1. Adicionar imports dos novos hooks
c = c.replace(
  "import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useRotinas, useCreateRotina, useDeleteRotina, useTasks, useCreateTask, useUpdateTask, useTarefaModelos } from '../hooks/useData'",
  "import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useRotinas, useCreateRotina, useDeleteRotina, useTasks, useCreateTask, useUpdateTask, useTarefaModelos, useClienteModelos, useVincularModelo, useDesvincularModelo } from '../hooks/useData'"
)

// 2. Adicionar tab 'tarefas' na lista de tabs
c = c.replace(
  "const [tab, setTab] = useState('dados') // dados | financeiro | bancos | rotina",
  "const [tab, setTab] = useState('dados') // dados | financeiro | bancos | tarefas | rotina\n  const [showAddModelo, setShowAddModelo] = useState(false)"
)

// 3. Adicionar hooks de cliente_modelos após os hooks de rotinas
c = c.replace(
  "  const { data: rotinas = [] } = useRotinas(modal?.id)\n  const createRotina  = useCreateRotina()\n  const deleteRotina  = useDeleteRotina()",
  `  const { data: rotinas = [] } = useRotinas(modal?.id)
  const createRotina  = useCreateRotina()
  const deleteRotina  = useDeleteRotina()
  const { data: clienteModelos = [] } = useClienteModelos(modal?.mode === 'edit' ? modal?.id : null)
  const vincularModelo   = useVincularModelo()
  const desvincularModelo = useDesvincularModelo()
  const { data: todosModelos = [] } = useTarefaModelos()`
)

fs.writeFileSync('src/pages/ClientsPage.jsx', c)
console.log('OK - imports e hooks adicionados')
console.log('clienteModelos:', c.includes('clienteModelos'))
console.log('vincularModelo:', c.includes('vincularModelo'))
console.log('showAddModelo:', c.includes('showAddModelo'))