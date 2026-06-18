-- ============================================================
-- FLUXE BPO — Criptografia do Cofre de Senhas
-- Execute este arquivo no SQL Editor do Supabase
-- APÓS ter executado o rls_policies.sql
-- ============================================================
-- Propósito: criptografar as senhas armazenadas no cofre de
-- acessos usando pgcrypto (AES-256). A chave nunca toca o
-- frontend — fica apenas no banco (Supabase Vault).
-- ============================================================

-- ── PASSO 1: Habilitar extensões ────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- pgsodium já vem habilitado no Supabase

-- ── PASSO 2: Criar a chave de criptografia no Vault ─────────
-- Gera uma chave segura aleatória e armazena no Vault
-- (só precisa rodar uma vez)
SELECT vault.create_secret(
  encode(gen_random_bytes(32), 'hex'),  -- chave AES-256 aleatória
  'cofre_encryption_key',               -- nome da chave no Vault
  'Chave de criptografia do cofre de senhas do Fluxe BPO'
);

-- ── PASSO 3: Função para criptografar ───────────────────────
-- Usada ao salvar uma senha no cofre
CREATE OR REPLACE FUNCTION cofre_encrypt(plaintext text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'cofre_encryption_key';

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Chave de criptografia não encontrada no Vault';
  END IF;

  -- pgp_sym_encrypt retorna bytea; codificamos em base64 para armazenar como text
  RETURN encode(pgp_sym_encrypt(plaintext, v_key), 'base64');
END;
$$;

-- ── PASSO 4: Função para descriptografar ────────────────────
-- Chamada pelo frontend para revelar uma senha específica.
-- Valida que o usuário tem acesso ao registro via RLS.
CREATE OR REPLACE FUNCTION cofre_decrypt(acesso_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key     text;
  v_enc     text;
  v_empresa uuid;
BEGIN
  -- Verificar que o usuário pertence à empresa dona deste acesso
  SELECT c.empresa_id INTO v_empresa
  FROM acessos a
  JOIN clientes c ON c.id = a.cliente_id
  WHERE a.id = acesso_id;

  IF v_empresa IS NULL OR v_empresa != auth_empresa_id() THEN
    RAISE EXCEPTION 'Acesso não autorizado';
  END IF;

  -- Buscar a senha criptografada
  SELECT senha_enc INTO v_enc FROM acessos WHERE id = acesso_id;

  IF v_enc IS NULL THEN
    RETURN NULL;
  END IF;

  -- Buscar chave do Vault
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'cofre_encryption_key';

  -- Descriptografar e retornar
  RETURN pgp_sym_decrypt(decode(v_enc, 'base64'), v_key);
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Erro ao descriptografar: %', SQLERRM;
END;
$$;

-- ── PASSO 5: Migrar senhas existentes ───────────────────────
-- Se já há registros com senhas em texto puro, criptografá-los
-- ATENÇÃO: rode isto apenas uma vez
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, senha_enc FROM acessos WHERE senha_enc IS NOT NULL LOOP
    BEGIN
      -- Se não estiver em base64 válido (ou seja, é texto puro), criptografar
      PERFORM decode(rec.senha_enc, 'base64');
      -- Se chegou aqui sem erro, pode já estar criptografado — pular
    EXCEPTION WHEN others THEN
      -- É texto puro: criptografar
      UPDATE acessos
      SET senha_enc = cofre_encrypt(rec.senha_enc)
      WHERE id = rec.id;
    END;
  END LOOP;
END;
$$;

-- ── PASSO 6: Verificação ────────────────────────────────────
-- Confira se as funções foram criadas:
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_name IN ('cofre_encrypt', 'cofre_decrypt');

-- Para testar:
-- SELECT cofre_decrypt('<uuid-de-um-acesso>');
