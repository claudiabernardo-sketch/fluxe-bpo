-- ============================================================
-- WhatsApp Integration Schema — Fluxe BPO
-- Rodar no Supabase SQL Editor
-- ============================================================

-- Contatos do WhatsApp (quem envia mensagens)
CREATE TABLE IF NOT EXISTS whatsapp_contatos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  phone         TEXT NOT NULL,           -- número no formato internacional, ex: 5511999999999
  nome          TEXT,
  cliente_id    UUID REFERENCES clientes(id),
  avatar_url    TEXT,
  ultimo_msg_em TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (empresa_id, phone)
);

-- Mensagens recebidas e enviadas
CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  contato_id     UUID NOT NULL REFERENCES whatsapp_contatos(id) ON DELETE CASCADE,
  wamid          TEXT UNIQUE,            -- ID da mensagem na Meta (evita duplicatas)
  direcao        TEXT NOT NULL CHECK (direcao IN ('recebida','enviada')),
  tipo           TEXT NOT NULL DEFAULT 'text', -- text | image | document | audio | video
  corpo          TEXT,                   -- texto da mensagem
  midia_url      TEXT,                   -- URL do arquivo (imagem, PDF, etc.)
  midia_mime     TEXT,                   -- MIME type do arquivo
  midia_nome     TEXT,                   -- nome original do arquivo
  midia_id       TEXT,                   -- ID da mídia na Meta (para download)
  -- IA
  ai_resumo      TEXT,                   -- resumo/leitura feita pela IA
  ai_tipo_doc    TEXT,                   -- tipo detectado: boleto | nf | contrato | outro
  ai_valor       NUMERIC,               -- valor extraído pela IA
  ai_vencimento  DATE,                  -- vencimento extraído
  -- Status
  lida           BOOLEAN DEFAULT false,
  tarefa_id      UUID,                   -- se foi transformada em tarefa
  enviado_em     TIMESTAMPTZ DEFAULT NOW(),
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- Mensagens agendadas para envio futuro
CREATE TABLE IF NOT EXISTS whatsapp_agendados (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  contato_id   UUID NOT NULL REFERENCES whatsapp_contatos(id) ON DELETE CASCADE,
  corpo        TEXT NOT NULL,
  enviar_em    TIMESTAMPTZ NOT NULL,
  enviado      BOOLEAN DEFAULT false,
  erro         TEXT,
  criado_por   UUID REFERENCES usuarios(id),
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_wamsg_empresa_contato ON whatsapp_mensagens(empresa_id, contato_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_wamsg_wamid ON whatsapp_mensagens(wamid);
CREATE INDEX IF NOT EXISTS idx_waag_enviar_em ON whatsapp_agendados(enviar_em) WHERE enviado = false;
CREATE INDEX IF NOT EXISTS idx_wacont_empresa ON whatsapp_contatos(empresa_id, ultimo_msg_em DESC);

-- RLS
ALTER TABLE whatsapp_contatos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_agendados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_isolamento_contatos"  ON whatsapp_contatos  FOR ALL USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));
CREATE POLICY "empresa_isolamento_mensagens" ON whatsapp_mensagens FOR ALL USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));
CREATE POLICY "empresa_isolamento_agendados" ON whatsapp_agendados FOR ALL USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));
