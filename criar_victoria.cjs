const {createClient}=require('@supabase/supabase-js');
const s=createClient(
  'https://zwvmprcuxhvhbuvdcybs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dm1wcmN1eGh2aGJ1dmRjeWJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1NjE1MSwiZXhwIjoyMDk1NjMyMTUxfQ.HIF8yfsLgiGdAfXOEmr_AR6TgOqKuWZeVzlV4NQ6wjY',
  {auth:{autoRefreshToken:false,persistSession:false}}
);

async function main() {
  // 1. Cria usuário no Auth
  const {data,error} = await s.auth.admin.createUser({
    email:'victoria@empreendabpo.com.br',
    password:'Fluxe2024',
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
