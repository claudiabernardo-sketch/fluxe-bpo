export default function TermosPage() {
  const updated = '17 de junho de 2026'
  const empresa = 'Empreenda BPO - Serviços de Terceirização Financeira e Treinamentos LTDA'
  const cnpj = '56.933.442/0001-45'
  const endereco = 'Avenida Zélia, 1075, Andar 2, Parque dos Camargos, Barueri/SP, CEP 06436-000'

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:'#0B0E1A', color:'#CBD5E1', minHeight:'100vh', padding:'80px 24px' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <a href="/" style={{ color:'#6366F1', fontSize:13, textDecoration:'none', display:'inline-block', marginBottom:32 }}>← Voltar</a>
        <h1 style={{ fontSize:32, fontWeight:900, color:'#F1F5F9', marginBottom:6 }}>Termos de Uso</h1>
        <p style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Última atualização: {updated}</p>
        <p style={{ fontSize:12, color:'#475569', marginBottom:40 }}>{empresa} · CNPJ {cnpj}</p>

        {[
          ['1. Aceitação',
            `Ao criar uma conta no Fluxe BPO, você concorda com estes Termos de Uso e com a nossa Política de Privacidade. Se você estiver criando uma conta em nome de uma empresa, declara ter autoridade para vinculá-la a estes termos.\n\nCaso não concorde com qualquer disposição, não utilize a plataforma.`],
          ['2. A Plataforma',
            `O Fluxe BPO é uma plataforma SaaS de gestão operacional voltada a escritórios de BPO (Business Process Outsourcing), oferecida por:\n\nRazão Social: ${empresa}\nCNPJ: ${cnpj}\nEndereço: ${endereco}\nSite: www.fluxebpo.com.br`],
          ['3. Funcionalidades',
            `O Fluxe BPO oferece, conforme o plano contratado:\n- Gestão de tarefas, rotinas e checklists\n- Gestão de carteira de clientes\n- Apontamentos de tempo por tarefa\n- Aprovações digitais de documentos\n- Cofre digital de credenciais (criptografado)\n- Painel de rentabilidade por cliente\n- CRM simplificado (pipeline de leads)\n- Gestão de equipe e permissões por perfil`],
          ['4. Trial e Cobrança',
            `Novos usuários têm 14 (quatorze) dias de acesso gratuito completo, sem necessidade de cartão de crédito. Após o período de trial, o acesso é suspenso até a contratação de um plano pago.\n\nOs valores dos planos estão disponíveis na página de preços (www.fluxebpo.com.br/precos) e podem ser alterados com aviso prévio de 30 dias por e-mail. O faturamento é realizado mensalmente e processado pelo gateway Asaas.`],
          ['5. Responsabilidades do Contratante',
            `O Contratante é responsável por:\n- Manter a confidencialidade das credenciais de acesso de seus usuários\n- Usar a plataforma apenas para fins legítimos e lícitos\n- Não inserir dados de terceiros sem base legal adequada (conforme LGPD)\n- Manter suas informações de pagamento atualizadas\n- Garantir que os usuários cadastrados estejam cientes e concordem com estes termos`],
          ['6. Dados, Privacidade e LGPD',
            `O tratamento de dados pessoais é regido pela nossa Política de Privacidade (www.fluxebpo.com.br/privacidade), em conformidade com a Lei 13.709/2018 (LGPD).\n\nO Fluxe BPO atua como Operador de Dados em relação aos dados dos clientes finais do BPO. O Contratante (escritório de BPO) é o Controlador e deve garantir a base legal para o tratamento desses dados.`],
          ['7. Cofre de Acessos',
            `As senhas e credenciais armazenadas no Cofre Digital são criptografadas com AES-256 via pgcrypto. O Fluxe BPO não tem acesso ao conteúdo descriptografado em condições normais de operação.\n\nO Contratante é responsável por garantir que possui autorização para armazenar as credenciais de terceiros e que faz uso dessas credenciais de acordo com a legislação aplicável.`],
          ['8. Propriedade Intelectual',
            `Todos os direitos sobre a plataforma Fluxe BPO — incluindo software, marca, design e documentação — são de propriedade da ${empresa}.\n\nO Contratante recebe uma licença de uso não exclusiva, intransferível e revogável, limitada ao uso da plataforma conforme estes termos. Não é permitido copiar, modificar, distribuir ou fazer engenharia reversa da plataforma.`],
          ['9. Disponibilidade e SLA',
            `Buscamos manter disponibilidade de 99,5% mensal, excluindo janelas de manutenção programada, que serão comunicadas com antecedência mínima de 24 horas. Não garantimos disponibilidade ininterrupta. Interrupções emergenciais por segurança não se enquadram no SLA.`],
          ['10. Limitação de Responsabilidade',
            `O Fluxe BPO não se responsabiliza por:\n- Perdas de receita ou lucros cessantes decorrentes de indisponibilidade da plataforma\n- Perda ou corrupção de dados causadas por ação do próprio usuário\n- Danos indiretos, incidentais ou consequentes\n\nNossa responsabilidade máxima fica limitada ao valor pago pelo Contratante nos últimos 3 (três) meses de contrato.`],
          ['11. Cancelamento',
            `O Contratante pode cancelar a conta a qualquer momento, sem multa, desde que não haja cobrança em aberto. Não há reembolso proporcional de mensalidades já pagas.\n\nApós o cancelamento, os dados ficam disponíveis para exportação por 30 dias. Após esse prazo, são excluídos permanentemente.`],
          ['12. Suspensão e Rescisão',
            `O Fluxe BPO pode suspender ou encerrar o acesso em caso de:\n- Inadimplência superior a 15 dias\n- Violação destes Termos\n- Uso da plataforma para fins ilícitos\n- Risco de segurança para outros usuários\n\nEm caso de rescisão por infração, não há reembolso.`],
          ['13. Alterações nos Termos',
            `Podemos alterar estes Termos a qualquer momento, com aviso por e-mail ao Contratante com antecedência mínima de 15 (quinze) dias. O uso continuado da plataforma após esse prazo implica aceitação dos novos termos.`],
          ['14. Contato',
            `Dúvidas sobre estes Termos:\nE-mail: privacidade@fluxebpo.com.br\nSite: www.fluxebpo.com.br\n\nForo competente: Comarca de Barueri/SP, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`],
        ].map(([title, body], i) => (
          <div key={i} style={{ marginBottom:36 }}>
            <h2 style={{ fontSize:18, fontWeight:800, color:'#F1F5F9', marginBottom:12 }}>{title}</h2>
            <div style={{ fontSize:14, lineHeight:1.8, color:'#94A3B8', whiteSpace:'pre-line' }}>{body}</div>
          </div>
        ))}

        <div style={{ marginTop:48, paddingTop:24, borderTop:'1px solid #1E293B', fontSize:12, color:'#334155' }}>
          © {new Date().getFullYear()} Fluxe BPO · <a href="/privacidade" style={{ color:'#6366F1', textDecoration:'none' }}>Política de Privacidade</a>
        </div>
      </div>
    </div>
  )
}
