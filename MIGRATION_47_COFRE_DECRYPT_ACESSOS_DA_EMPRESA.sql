-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 47: cofre_decrypt passa a funcionar para os acessos da
-- própria empresa (Configurações > Cofre da Empresa)
--
-- PROBLEMA: cofre_decrypt validava o dono do acesso por JOIN com clientes.
-- Os acessos internos do BPO (sistema contábil, e-mail, bancos) têm
-- cliente_id NULL, então o JOIN não achava linha, v_empresa ficava NULL e a
-- função levantava "Acesso não autorizado" para QUALQUER usuário, inclusive
-- admin: o botão Revelar do Cofre da Empresa sempre falhava.
--
-- CORREÇÃO: o dono do acesso é a empresa do cliente (quando há cliente) ou, se
-- não há cliente, a própria empresa_id do acesso. A checagem contra
-- auth_empresa_id() continua igual, então o isolamento entre empresas é o mesmo.
-- Idempotente. Já aplicada no projeto zwvmprcuxhvhbuvdcybs.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.cofre_decrypt(acesso_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key     text;
  v_enc     text;
  v_empresa uuid;
BEGIN
  SELECT COALESCE(c.empresa_id, a.empresa_id) INTO v_empresa
  FROM acessos a
  LEFT JOIN clientes c ON c.id = a.cliente_id
  WHERE a.id = acesso_id;

  IF v_empresa IS NULL OR v_empresa != auth_empresa_id() THEN
    RAISE EXCEPTION 'Acesso não autorizado';
  END IF;

  SELECT senha_enc INTO v_enc FROM acessos WHERE id = acesso_id;
  IF v_enc IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'cofre_encryption_key';

  RETURN pgp_sym_decrypt(decode(v_enc, 'base64'), v_key);
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Erro ao descriptografar: %', SQLERRM;
END;
$$;
