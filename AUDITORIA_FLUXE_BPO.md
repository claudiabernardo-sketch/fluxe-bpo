# Auditoria Técnica — Fluxe BPO
**Data:** 17/06/2026 | **Status:** ETAPA 1 concluída

---

## 1. MAPEAMENTO DE TABELAS

| Tabela | Soft Delete | RLS | Índices | Observação |
|--------|-------------|-----|---------|------------|
| `empresas` | ❌ (não precisa) | ✅ | ✅ | Root multi-tenant |
| `usuarios` | via `ativo` | ✅ | ✅ idx_usuarios_id_empresa |  |
| `clientes` | ✅ `deleted_at` | ✅ | ✅ | etapa, status, valor_mrr, segmento, cnpj |
| `tarefas` | ✅ `deleted_at` | ✅ | ✅ | modelo_id, data_execucao, motivo_pendencia |
| `tarefas_avulsas` | ❌ | ✅ | ❌ sem índice | Tabela separada, sem soft delete |
| `tarefa_checklists` | ❌ | ✅ via JOIN | ❌ | |
| `tarefa_historico` | ❌ | ✅ via JOIN | ❌ | |
| `tarefa_modelos` | via `ativo` | ✅ | ✅ | etapa ✅, **descricao ❌ falta** |
| `leads` | ✅ `deleted_at` | ✅ | ✅ | cnpj ✅ |
| `pendencias` | ❌ | ✅ | ✅ | Sem soft delete |
| `apontamentos` | ❌ | ✅ | ✅ | Timer, capped 6 meses |
| `rotinas` | via `ativo` | ✅ | ✅ | semanal/mensal, linked a cliente |
| `mensagens_whatsapp` | ❌ | ✅ | ❌ | |
| `aprovacoes` | ❌ | ✅ | ✅ | + aprovacao_historico |
| `acessos` | ❌ | ✅ via JOIN | ❌ | Cofre — criptografado |
| `audit_log` | ❌ | ✅ | ❌ | Trigger automático |

---

## 2. MAPEAMENTO DE HOOKS (useData.js)

### Funcionando ✅
- `useClients` / `useCreateClient` / `useUpdateClient` / `useDeleteClient`
- `useTasks` / `useCreateTask` / `useUpdateTask` / `useDeleteTask`
- `useTarefaModelos` / `useCreateModelo` / `useUpdateModelo` / `useDeleteModelo`
- `useLeads` / `useCreateLead` / `useUpdateLead` / `useConvertLeadToClient`
- `usePendencias` / `useCreatePendencia` / `useUpdatePendencia`
- `useApontamentos` / `useSaveApontamento`
- `useAprovacoes` / `useUpdateAprovacao`
- `useUsuarios`
- `useAcessos` / `useSaveAcesso`
- `useRotinas` / `useCreateRotina` / `useUpdateRotina`

### Ausentes ⚠️
- `useDeleteRotina` — existe só soft delete via `ativo=false` em `useUpdateRotina`, sem hook dedicado
- `useDeletePendencia` — pendência não tem exclusão na UI
- `useDeleteApontamento` — apontamento não tem exclusão na UI

---

## 3. MAPEAMENTO DE PÁGINAS E ROTAS

| Rota | Componente | Status | Observação |
|------|-----------|--------|------------|
| `/` | DashPage | ✅ | KPIs, onboarding, insights |
| `/tasks` | TasksPage | ✅ | Auto-geração de tarefas por modelos |
| `/modelos` | ModelosPage | ✅⚠️ | Label sidebar "Rotinas" — confuso |
| `/pendencias` | PendenciasPage | ✅ | |
| `/avulsas` | AvulsasPage | ⚠️ | Sem hooks, sem soft delete, sem audit log |
| `/crm` | CRMPage | ✅ | Busca CNPJ, conversão lead→cliente |
| `/prec` | PrecificacaoPage | ✅ | |
| `/clientes` | ClientsPage | ✅ | 6 abas: info, financeiro, tarefas, rotina, cofre, apontamentos |
| `/esteiras` | EsteirasPage | ✅⚠️ | Dados hardcoded (by design), criação via supabase direto |
| `/agenda` | AgendaPage | ✅ | Central Operacional — Kanban, calendário, saúde clientes |
| `/exec` | ExecPage | ✅ | |
| `/rent` | RentPage | ✅ | |
| `/cap` | CapPage | ✅ | |
| `/cofre` | CofrePage | ✅ | Credenciais criptografadas |
| `/mensagens` | MensagensPage | ✅ | |
| `/relatorios` | RelatoriosPage | ✅ | |
| `/config` | ConfigPage | ✅ | |
| `/meu-painel` | MeuPainelPage | ❌ ÓRFÃO | Rota existe, **não está no sidebar** |
| `/ajuda` | AjudaPage | ❌ ÓRFÃO | Rota existe, **não está no sidebar** |

---

## 4. INCONSISTÊNCIAS ENCONTRADAS

### 🔴 CRÍTICO — Etapas fora de sincronia entre ClientsPage e ModelosPage

**ClientsPage** (`ETAPA_LABEL`) define:
`comercial`, `pre_ob`, `onboarding`, `implantacao`, `operacional`, `estrategico`, `acompanhamento`

**ModelosPage** (`ETAPAS_MODELO`) define:
`onboarding`, `implantacao`, `operacional`, `estrategico`, `acompanhamento`, `encerramento`

**ClientsPage** (`ETAPA_LABEL_M` — usado para sugestão de tarefas) define:
`onboarding`, `implantacao`, `operacional`, `estrategico`, `acompanhamento`, `encerramento`

**Resultado:**
- Cliente em etapa `comercial` ou `pre_ob` → nenhuma sugestão de tarefa aparece (ETAPA_LABEL_M não tem esses valores)
- Cliente em etapa `encerramento` → não existe opção no select de etapa do cliente (ETAPA_LABEL não tem `encerramento`)
- Templates com `etapa = 'encerramento'` nunca são sugeridos

**Correção necessária:**
Unificar as etapas. ClientsPage deve incluir `encerramento` e ter ETAPA_LABEL_M completo.
Etapas corretas (ordem da jornada BPO): `comercial` → `pre_ob` → `onboarding` → `implantacao` → `operacional` → `estrategico` → `acompanhamento` → `encerramento`

---

### 🔴 CRÍTICO — `tarefa_modelos` sem coluna `descricao`

A tabela não tem campo de descrição operacional. O formulário de ModelosPage também não tem esse campo.
ETAPA 2 precisa adicionar descrições detalhadas para cada template da biblioteca BPO.

**SQL necessário:**
```sql
ALTER TABLE tarefa_modelos ADD COLUMN IF NOT EXISTS descricao TEXT;
```

---

### 🟡 MÉDIO — Recorrências incompletas

Opções atuais no ModelosPage e no banco: `diaria`, `dias_uteis`, `semanal`, `mensal`, `dias_especificos`

**Ausentes:** `quinzenal`, `bimestral`, `trimestral`, `semestral`, `anual`

O campo `recorrencia` é TEXT sem CHECK constraint, então o banco aceita qualquer valor. Falta apenas:
1. Adicionar as opções na UI (ModelosPage)
2. Implementar a lógica de geração em `gerarTarefasRecorrentes()` no TasksPage

---

### 🟡 MÉDIO — AvulsasPage fora do padrão arquitetural

- Usa `supabase.from('tarefas_avulsas')` diretamente (sem hooks useData.js)
- `tarefas_avulsas` não tem soft delete
- Não registra audit log
- A query de fetch não tem `.limit()` (risco de volume)
- MensagensPage também lê `tarefas_avulsas` diretamente

Não é erro crítico (a tabela tem RLS), mas é inconsistente com o restante do código.

---

### 🟡 MÉDIO — MeuPainelPage e AjudaPage são rotas órfãs

Ambas têm rota registrada no AppShell mas não aparecem no array `NAV`. O usuário não tem como navegar até elas pela sidebar.

---

### 🟢 BAIXO — Sidebar: "Rotinas" → /modelos (nomenclatura confusa)

O sidebar chama ModelosPage de "Rotinas", mas a tabela `rotinas` é um conceito diferente (agenda semanal/mensal por cliente). ModelosPage gerencia `tarefa_modelos` (templates que geram tarefas automaticamente).

A aba dentro de ClientsPage também se chama "Rotina" e aponta para a tabela `rotinas`.
Usuário pode se confundir entre os dois conceitos.

Sugestão de renomeação: ModelosPage → "Modelos" ou "Templates" na sidebar.

---

### 🟢 BAIXO — EsteirasPage cria tarefas via supabase direto

No modal de aplicar tarefas de uma esteira, usa `supabase.from('tarefas').insert()` em vez de `useCreateTask`. Funciona, mas não gera audit log.

---

## 5. O QUE FUNCIONA BEM ✅

- **Multi-tenancy total:** RLS em todas as tabelas críticas com `auth_empresa_id()`
- **Soft delete:** clientes, tarefas, leads, tarefa_modelos (via ativo), rotinas (via ativo)
- **Performance:** Índices compostos em todas as queries frequentes
- **Segurança:** Cofre com criptografia, audit_log com trigger automático, storage com prefixo empresa_id
- **Auto-geração de tarefas:** TasksPage gera tarefas dos modelos ao abrir (evita duplicatas com Set)
- **Sugestão de tarefas por etapa:** ClientsPage sugere templates ao mudar etapa do cliente
- **Central Operacional:** AgendaPage completa — Kanban, calendário, saúde dos clientes, rotinas do dia
- **Esteiras BPO:** 9 jornadas hardcoded com checklists completos (Comercial, Onboarding, Implantação, etc.)
- **CRM:** Conversão lead → cliente funcionando corretamente
- **Timer:** Apontamentos com totalização por cliente/período
- **Lazy loading + cache:** Todas as páginas com code splitting, staleTime otimizado

---

## 6. LISTA DE AÇÕES PARA ETAPA 2

### SQL (rodar antes do código)
1. `ALTER TABLE tarefa_modelos ADD COLUMN IF NOT EXISTS descricao TEXT;`
2. `DELETE FROM tarefa_modelos WHERE empresa_id IS NULL;` ← limpar templates sem empresa (se houver lixo de testes)
3. Inserir biblioteca BPO completa com `descricao` para cada tarefa

### Código — ModelosPage
4. Adicionar campo `descricao` (textarea) ao formulário
5. Adicionar recorrências: quinzenal, bimestral, trimestral, semestral, anual

### Código — TasksPage
6. Implementar lógica de geração para quinzenal, bimestral, trimestral, semestral, anual em `gerarTarefasRecorrentes()`

### Código — ClientsPage
7. Unificar etapas: adicionar `encerramento` ao select e ao ETAPA_COLOR/ETAPA_LABEL
8. Completar `ETAPA_LABEL_M` para incluir `comercial` e `pre_ob` (para que sugestões funcionem nessas etapas)

### Código — AppShell
9. Adicionar `MeuPainelPage` e `AjudaPage` ao array NAV da sidebar

### Conteúdo — Biblioteca BPO
10. Substituir os 21 templates existentes pela biblioteca completa (Comercial, Onboarding, Implantação, Operação diária/semanal/mensal/por vencimento, Estratégico) com títulos específicos e descrições operacionais
11. Adicionar templates por segmento: Infoproduto, Clínica, Prestação de Serviços, Agência, E-commerce

---

## 7. CONCLUSÃO

O sistema está **funcionalmente sólido**. Multi-tenancy, RLS, soft delete, hooks, auto-geração de tarefas, Central Operacional — tudo implementado e consistente. Os problemas encontrados são de **grau médio a baixo** e não bloqueiam a operação atual.

**Ponto de atenção principal:** o bug de etapas fora de sincronia (item 4.1) faz com que clientes em etapa `comercial`, `pre_ob` ou `encerramento` não recebam sugestões de tarefas — isso precisa ser corrigido antes de popular a biblioteca.

**Ordem de execução recomendada para ETAPA 2:**
1. SQL: adicionar `descricao` → corrigir etapas no código → popular biblioteca BPO → testar sugestões
