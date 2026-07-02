# Fluxe BPO — Deploy: Operação de Clientes
## Ordem de execução

### PASSO 1 — Rodar as migrations no Supabase SQL Editor
Execute na ordem, uma de cada vez. Cada arquivo tem um SELECT no final para confirmar.

1. `MIGRATION_01_CLIENTES_STATUS.sql`
   → Adiciona `status_operacional` e `operacao_iniciada_em` na tabela `clientes`

2. `MIGRATION_02_CLIENTE_MODELOS_OVERRIDES.sql`
   → Adiciona colunas de override na `cliente_modelos`
   → Migra automaticamente modelos com `cliente_id` direto para `cliente_modelos`

3. `MIGRATION_03_TASK_GENERATION_DETAILS.sql`
   → Cria tabela `task_generation_details` para auditoria granular

---

### PASSO 2 — Deploy da Edge Function (terminal)

```
cd C:\Users\Cliente\Downloads\fluxe-bpo
npx supabase functions deploy gerar-tarefas --project-ref zwvmprcuxhvhbuvdcybs
```

---

### PASSO 3 — Deploy do frontend (terminal)

```
cd C:\Users\Cliente\Downloads\fluxe-bpo
npx vercel --prod
```

---

### PASSO 4 — Iniciar operação da Infinance

Após o deploy:
1. Abra o Fluxe → Clientes
2. Clique na Infinance → editar
3. No header do modal, clique **▶ Iniciar Operação**
4. Escolha a data de início (ex: 01/06/2026)
5. Confirme — as tarefas serão geradas automaticamente para o período

---

### Como verificar se funcionou

No Supabase SQL Editor:

```sql
-- Verificar status operacional dos clientes
SELECT razao_social, status_operacional, operacao_iniciada_em
FROM clientes
WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629';

-- Verificar vínculos migrados
SELECT COUNT(*) FROM cliente_modelos
WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629';

-- Ver últimos logs de geração
SELECT * FROM task_generation_logs ORDER BY executado_em DESC LIMIT 5;

-- Ver auditoria detalhada (após primeira geração com nova Edge Function)
SELECT resultado, COUNT(*) as total
FROM task_generation_details
WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629'
GROUP BY resultado;
```

---

### O que mudou no sistema

| Funcionalidade | Antes | Depois |
|---|---|---|
| Status do cliente | Só status comercial (ativo/inativo) | + status operacional (em_configuracao/operacional/pausado/encerrado) |
| Início da operação | Tarefas geradas ao vincular modelo | Operador clica "Iniciar Operação" e escolhe a data |
| Escopo — modelos | Só visualização + desvincular | Editar override (recorrência, dia, hora), pausar, reativar, excluir |
| Auditoria | Contagem total por execução | Linha por decisão com motivo |
| Dry run | Não existia | Simula geração sem salvar no banco |
| Geração manual | Não existia | Modal "Gerenciar Geração" com range de datas |
