export default function PrivacidadePage() {
  const updated = '17 de junho de 2026'
  const empresa = 'Empreenda BPO - Serviços de Terceirização Financeira e Treinamentos LTDA'
  const cnpj = '56.933.442/0001-45'
  const endereco = 'Avenida Zélia, 1075, Andar 2, Parque dos Camargos, Barueri/SP, CEP 06436-000'

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:'#0B0E1A', color:'#CBD5E1', minHeight:'100vh', padding:'80px 24px' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <a href="/" style={{ color:'#6366F1', fontSize:13, textDecoration:'none', display:'inline-block', marginBottom:32 }}>← Voltar</a>
        <h1 style={{ fontSize:32, fontWeight:900, color:'#F1F5F9', marginBottom:6 }}>Política de Privacidade</h1>
        <p style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Última atualização: {updated} · LGPD — Lei 13.709/2018</p>
        <p style={{ fontSize:12, color:'#475569', marginBottom:40 }}>{empresa} · CNPJ {cnpj}</p>

        {[
          ['1. Controlador dos Dados',
            `Os dados pessoais coletados no âmbito do Fluxe BPO são controlados por:\n\nRazão Social: ${empresa}\nCNPJ: ${cnpj}\nEndereço: ${endereco}\nE-mail: privacidade@fluxebpo.com.br\nEncarregado de Dados (DPO): Cláudia Fernanda Bernardo Venâncio`],
          ['2. Papéis na LGPD',
            `Na relação com nossos clientes (escritórios de BPO), o Fluxe BPO atua como Operador de Dados, processando informações em nome do Controlador (o escritório contratante). Cada escritório é o Controlador dos dados de seus próprios clientes finais e responsável pela base legal de tratamento perante a LGPD.`],
          ['3. Dados que Coletamos',
            `Dados do Contratante (empresa usuária):\n- Razão social, CNPJ, endereço, dados de contato\n- E-mails e nomes dos usuários cadastrados\n- Dados de pagamento (processados pelo gateway Asaas — não armazenamos dados de cartão)\n\nDados inseridos pelo Contratante:\n- Nomes, e-mails e telefones de clientes do BPO\n- Credenciais de sistemas (armazenadas de forma criptografada no Cofre Digital)\n- Informações operacionais inseridas na plataforma\n\nDados coletados automaticamente:\n- Endereço IP e logs de acesso (segurança)\n- Logs de auditoria de operações críticas\n- Dados de uso agregados (sem identificação individual)`],
          ['4. Finalidade e Base Legal',
            `Os dados são tratados com as seguintes finalidades e bases legais (art. 7 da LGPD):\n- Execução do contrato de prestação de serviços (art. 7, V)\n- Cumprimento de obrigações legais e regulatórias (art. 7, II)\n- Legítimo interesse: segurança e melhoria dos serviços (art. 7, IX)\n- Consentimento do titular, quando aplicável (art. 7, I)\n\nNão vendemos, alugamos ou compartilhamos dados com terceiros para fins comerciais.`],
          ['5. Compartilhamento de Dados',
            `Os dados poderão ser compartilhados com:\n- Supabase (banco de dados e autenticação)\n- Vercel (hospedagem)\n- Resend (e-mail transacional)\n- Asaas (processamento de cobranças)\n- Meta/WhatsApp Business API (quando habilitado pelo Contratante)\n- Autoridades públicas, quando exigido por lei ou ordem judicial\n\nTodos os fornecedores são contratados com cláusulas de proteção de dados adequadas à LGPD.`],
          ['6. Segurança dos Dados',
            `Adotamos as seguintes medidas técnicas:\n- Criptografia em trânsito (TLS/HTTPS) e em repouso\n- Isolamento total de dados por empresa (Row Level Security no banco de dados)\n- Credenciais do Cofre Digital criptografadas com AES-256 via pgcrypto\n- Controle de acesso por perfil de usuário\n- Logs de auditoria de todas as operações críticas\n- Backups automáticos com PITR (Point-in-Time Recovery)`],
          ['7. Retenção dos Dados',
            `Os dados são mantidos pelo período necessário à prestação dos serviços. Após encerramento do contrato:\n- Dados operacionais: disponíveis para exportação por 30 dias\n- Logs de auditoria: retidos por 12 meses\n- Dados fiscais: retidos pelo prazo legal de 5 anos`],
          ['8. Direitos dos Titulares (Art. 18 LGPD)',
            `Os titulares têm os seguintes direitos, exercíveis via privacidade@fluxebpo.com.br:\n- Confirmação da existência de tratamento\n- Acesso aos dados\n- Correção de dados incorretos ou desatualizados\n- Anonimização, bloqueio ou eliminação de dados desnecessários\n- Portabilidade dos dados a outro fornecedor\n- Eliminação dos dados tratados com consentimento\n- Informação sobre compartilhamentos realizados\n- Revogação do consentimento\n\nRespondemos em até 15 (quinze) dias corridos.`],
          ['9. Cookies',
            `Utilizamos apenas cookies estritamente necessários para autenticação e funcionamento da plataforma. Não utilizamos cookies de rastreamento ou publicidade.`],
          ['10. Transferência Internacional',
            `Alguns fornecedores (Supabase, Vercel) podem processar dados em servidores fora do Brasil. Nesses casos, exigimos nível de proteção equivalente ao da LGPD, nos termos do art. 33 da Lei 13.709/2018.`],
          ['11. Incidentes de Segurança',
            `Em caso de incidente de segurança com risco relevante aos titulares, notificaremos a ANPD e os titulares afetados no prazo e forma previstos na LGPD.`],
          ['12. Encarregado de Dados (DPO)',
            `Nome: Cláudia Fernanda Bernardo Venâncio\nE-mail: privacidade@fluxebpo.com.br\n\nOs titulares podem contatar o Encarregado para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados pessoais.`],
          ['13. Alterações nesta Política',
            `Esta Política poderá ser atualizada periodicamente. Alterações significativas serão comunicadas por e-mail ou aviso na Plataforma com antecedência mínima de 15 dias. A versão mais recente estará sempre disponível em www.fluxebpo.com.br/privacidade.`],
          ['14. Lei Aplicável',
            `Esta Política é regida pela Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD) e pelo Marco Civil da Internet (Lei 12.965/2014). Foro competente: Comarca de Barueri/SP.`],
        ].map(([title, body], i) => (
          <div key={i} style={{ marginBottom:36 }}>
            <h2 style={{ fontSize:18, fontWeight:800, color:'#F1F5F9', marginBottom:12 }}>{title}</h2>
            <div style={{ fontSize:14, lineHeight:1.8, color:'#94A3B8', whiteSpace:'pre-line' }}>{body}</div>
          </div>
        ))}

        <div style={{ marginTop:48, paddingTop:24, borderTop:'1px solid #1E293B', fontSize:12, color:'#334155' }}>
          © {new Date().getFullYear()} Fluxe BPO · <a href="/termos" style={{ color:'#6366F1', textDecoration:'none' }}>Termos de Uso</a>
        </div>
      </div>
    </div>
  )
}
