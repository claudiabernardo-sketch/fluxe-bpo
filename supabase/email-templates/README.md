# Templates de E-mail — Fluxe BPO

Cole cada template em: Supabase Dashboard → Authentication → Email Templates

---

## 1. Confirm signup (Confirmação de cadastro)

Assunto: `Confirme seu cadastro no Fluxe BPO`

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0B0E1A;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0E1A;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#131929;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 40px;text-align:center">
          <p style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px">Fluxe <span style="opacity:.8">BPO</span></p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,.75)">Gestão inteligente para BPOs</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#F1F5F9">Bem-vindo(a)! 🎉</p>
          <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;line-height:1.6">
            Sua conta foi criada com sucesso. Clique no botão abaixo para confirmar seu e-mail e acessar o sistema.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="{{ .ConfirmationURL }}"
               style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:.02em">
              ✅ Confirmar meu e-mail
            </a>
          </div>
          <p style="margin:24px 0 0;font-size:12px;color:#64748B;line-height:1.6">
            Se você não criou uma conta no Fluxe BPO, ignore este e-mail com segurança.<br>
            O link expira em <strong style="color:#94A3B8">24 horas</strong>.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,.06);text-align:center">
          <p style="margin:0;font-size:11px;color:#475569">© Fluxe BPO · Gestão para Empresas de Terceirização</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## 2. Invite user (Convite de funcionário)

Assunto: `Você foi convidado(a) para o Fluxe BPO`

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0B0E1A;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0E1A;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#131929;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 40px;text-align:center">
          <p style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px">Fluxe <span style="opacity:.8">BPO</span></p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,.75)">Gestão inteligente para BPOs</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#F1F5F9">Você foi convidado(a)! 👋</p>
          <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;line-height:1.6">
            Um administrador adicionou você ao sistema <strong style="color:#F1F5F9">Fluxe BPO</strong>.<br>
            Clique no botão abaixo para definir sua senha e acessar o sistema pela primeira vez.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="{{ .ConfirmationURL }}"
               style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:.02em">
              🔐 Criar minha senha
            </a>
          </div>
          <!-- Info box -->
          <div style="background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:10px;padding:16px 20px;margin-top:24px">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#818CF8;text-transform:uppercase;letter-spacing:.06em">Seu acesso</p>
            <p style="margin:0;font-size:13px;color:#CBD5E1">E-mail: <strong style="color:#F1F5F9">{{ .Email }}</strong></p>
          </div>
          <p style="margin:24px 0 0;font-size:12px;color:#64748B;line-height:1.6">
            Se você não esperava este convite, ignore este e-mail.<br>
            O link expira em <strong style="color:#94A3B8">24 horas</strong>.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,.06);text-align:center">
          <p style="margin:0;font-size:11px;color:#475569">© Fluxe BPO · Gestão para Empresas de Terceirização</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## 3. Reset password (Recuperação de senha)

Assunto: `Redefinição de senha — Fluxe BPO`

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0B0E1A;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0E1A;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#131929;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 40px;text-align:center">
          <p style="margin:0 0 8px;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px">Fluxe <span style="opacity:.8">BPO</span></p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,.75)">Gestão inteligente para BPOs</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#F1F5F9">Redefinir senha 🔑</p>
          <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;line-height:1.6">
            Recebemos uma solicitação para redefinir a senha da sua conta no Fluxe BPO.<br>
            Clique no botão abaixo para criar uma nova senha.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="{{ .ConfirmationURL }}"
               style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:.02em">
              🔐 Redefinir minha senha
            </a>
          </div>
          <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:14px 18px;margin-top:16px">
            <p style="margin:0;font-size:12px;color:#FCA5A5;line-height:1.6">
              ⚠️ Se você não solicitou a redefinição de senha, ignore este e-mail. Sua conta está segura.
            </p>
          </div>
          <p style="margin:24px 0 0;font-size:12px;color:#64748B;line-height:1.6">
            O link expira em <strong style="color:#94A3B8">1 hora</strong>.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,.06);text-align:center">
          <p style="margin:0;font-size:11px;color:#475569">© Fluxe BPO · Gestão para Empresas de Terceirização</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```
