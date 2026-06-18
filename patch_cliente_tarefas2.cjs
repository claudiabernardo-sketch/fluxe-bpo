const fs = require('fs')
let c = fs.readFileSync('src/pages/ClientsPage.jsx', 'utf8')

// Adicionar hooks após deleteRotina
c = c.replace(
  "  const deleteRotina  = useDeleteRotina()",
  `  const deleteRotina  = useDeleteRotina()
  const { data: clienteModelos = [] } = useClienteModelos(modal?.mode === 'edit' ? modal?.id : null)
  const vincularModelo    = useVincularModelo()
  const desvincularModelo = useDesvincularModelo()
  const { data: todosModelos = [] } = useTarefaModelos()`
)

fs.writeFileSync('src/pages/ClientsPage.jsx', c)
console.log('OK')
console.log('clienteModelos:', c.includes('clienteModelos'))