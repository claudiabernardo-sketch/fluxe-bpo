// Rode com as credenciais no ambiente, nunca escritas no arquivo:
//   SUPABASE_SERVICE_ROLE_KEY=... NOVO_USUARIO_SENHA=... node criar_victoria.cjs
const {createClient}=require('@supabase/supabase-js');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NOVO_USUARIO_SENHA) {
  console.error('Defina SUPABASE_SERVICE_ROLE_KEY e NOVO_USUARIO_SENHA no ambiente.');
  process.exit(1);
}
const s=createClient(
  'https://zwvmprcuxhvhbuvdcybs.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {auth:{autoRefreshToken:false,persistSession:false}}
);

async function main() {
  // 1. Cria usuário no Auth
  const {data,error} = await s.auth.admin.createUser({
    email:'victoria@empreendabpo.com.br',
    password: process.env.NOVO_USUARIO_SENHA,
    email_confirm:true
  });
  if(error){console.log('ERRO AUTH:',error.message);return;}
  console.log('Auth OK - ID:',data.user.id);

  // 2. Busca empresa
  const {data:emp} = await s.from('empresas').select('id').limit(1).single();
  console.log('Empresa ID:',emp?.id);

  // 3. Insere perfil
  const {error:e2} = await s.from('usuarios').insert({
    id: data.user.id,
    empresa_id: emp?.id,
    nome: 'Victoria Negreiro',
    email: 'victoria@empreendabpo.com.br',
    perfil: 'operador',
    custo_hora: 35
  });
  if(e2) console.log('ERRO PERFIL:',e2.message);
  else console.log('Perfil OK! Victoria criada com sucesso.');
}
main();
