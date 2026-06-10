const fs = require('fs')
let c = fs.readFileSync('src/pages/PrecificacaoPage.jsx', 'utf8')
const idx = c.lastIndexOf('<div className="prec-btn-row">', c.indexOf('window.print()'))
c = c.substring(0, idx)
c += `            <div className="prec-btn-row">
              <button className="prec-btn prec-btn-ghost" onClick={() => irPara(4)}>← Ajustar valor</button>
              <button className="prec-btn prec-btn-ghost" onClick={() => window.print()}>🖨 Imprimir proposta</button>
              <button className="prec-btn prec-btn-primary" onClick={() => irPara(6)}>Gerar contrato →</button>
            </div>
          </div>
        )}

        {/* ETAPA 6: CONTRATO */}
        {etapa === 6 && calc && (() => {
          const emp = empresa || {}
          const nomeEmp = emp.nome || 'SUA EMPRESA'
          const cnpjEmp = emp.cnpj || '00.000.000/0001-00'
          const emailEmp = emp.email || 'contato@suaempresa.com.br'
          const repEmp = emp.representante || emp.nome || 'Representante Legal'
          const cidadeEmp = emp.cidade || 'Sua Cidade/UF'
          const foro = emp.foro || cidadeEmp
          const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
          const val = parseFloat(valorProposta)
          const fmt2 = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
          const servicos = calc.items.filter(it => !it.nome.includes('Ajuste de porte'))
          return (
            <div>
              <style>{\`
                @media print { .prec-btn-row, .prec-progress { display:none!important; } }
                .ctr { background:#fff; max-width:760px; margin:0 auto; padding:40px; border:1px solid #E8E5DE; border-radius:12px; font-size:13px; line-height:1.7; color:#1a1a1a; }
                .ctr-header { border-bottom:3px solid #1A4D3A; padding-bottom:20px; margin-bottom:24px; display:flex; justify-content:space-between; }
                .ctr-emp { font-size:20px; font-weight:700; color:#1A4D3A; }
                .ctr-titulo { text-align:center; font-size:15px; font-weight:700; color:#1A4D3A; text-transform:uppercase; margin:24px 0 4px; }
                .ctr-subtit { text-align:center; font-size:11px; color:#6A6760; font-style:italic; margin-bottom:24px; }
                .ctr-sec { font-size:11px; font-weight:700; color:#1A4D3A; letter-spacing:.08em; text-transform:uppercase; margin:24px 0 10px; padding-bottom:5px; border-bottom:2px solid #1A4D3A; }
                .ctr-cl { font-weight:700; font-size:13px; margin:16px 0 4px; }
                .ctr-p { margin:6px 0; text-align:justify; }
                .ctr-li { margin:4px 0 4px 20px; }
                .ctr-li::before { content:'• '; color:#1A4D3A; font-weight:700; }
                .ctr-tb { width:100%; border-collapse:collapse; margin:12px 0; font-size:12px; }
                .ctr-tb th { background:#1A4D3A; color:#fff; padding:8px 10px; text-align:left; font-size:11px; }
                .ctr-tb td { padding:7px 10px; border-bottom:1px solid #E8E5DE; }
                .ctr-tb tr:nth-child(even) td { background:#F9F8F5; }
                .ctr-val { background:#EAF2ED; border:2px solid #2D7A5A; border-radius:10px; padding:18px; text-align:center; margin:16px 0; }
                .ctr-val-num { font-size:32px; font-weight:700; color:#1A4D3A; font-family:'DM Mono',monospace; }
                .ctr-assin { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:40px; }
                .ctr-assin-bl { text-align:center; border-top:1px solid #1a1a1a; padding-top:8px; }
              \`}</style>
              <div className="ctr">
                <div className="ctr-header">
                  <div>
                    <div className="ctr-emp">{nomeEmp}</div>
                    <div style={{fontSize:11,color:'#6A6760'}}>CNPJ: {cnpjEmp} | {emailEmp}</div>
                  </div>
                  <div style={{textAlign:'right',fontSize:11,color:'#6A6760'}}><div>{dataHoje}</div></div>
                </div>
                <div className="ctr-titulo">Contrato de Prestação de Serviços de Apoio Administrativo Financeiro</div>
                <div className="ctr-subtit">Instrumento Particular com Força Executiva</div>

                <div className="ctr-sec">I — Das Partes</div>
                <p className="ctr-p"><strong>CONTRATANTE:</strong></p>
                <p className="ctr-p">Razão Social: <strong>{calc.d.nome || '___________________________'}</strong></p>
                <p className="ctr-p">CNPJ: ___________________________ | E-mail: ___________________________</p>
                <p className="ctr-p">Endereço: ___________________________________________________________________</p>
                <p className="ctr-p">Representado(a) por: ___________________________________ CPF: _______________</p>
                <p className="ctr-p" style={{marginTop:12}}><strong>CONTRATADA:</strong></p>
                <p className="ctr-p">Razão Social: <strong>{nomeEmp}</strong> | CNPJ: {cnpjEmp}</p>
                <p className="ctr-p">E-mail: {emailEmp} | Representada por: <strong>{repEmp}</strong></p>

                <div className="ctr-sec">II — Do Objeto</div>
                <p className="ctr-cl">CLÁUSULA 1ª — Do Objeto</p>
                <p className="ctr-p">O presente contrato tem por objeto a prestação de serviços especializados de apoio administrativo financeiro, compreendendo:</p>
                <table className="ctr-tb">
                  <thead><tr><th>Serviço</th><th>Descrição</th></tr></thead>
                  <tbody>{servicos.map((it,i)=><tr key={i}><td><strong>{it.nome}</strong></td><td style={{fontSize:11,color:'#6A6760'}}>{it.motivo}</td></tr>)}</tbody>
                </table>
                <p className="ctr-p"><strong>Parágrafo Único:</strong> A disponibilização de funcionalidades específicas está condicionada ao plano do sistema de gestão financeira contratado pela CONTRATANTE.</p>

                <div className="ctr-sec">III — Das Condições de Execução</div>
                <p className="ctr-cl">CLÁUSULA 2ª — Do Horário e Entregas</p>
                <p className="ctr-p">Os serviços serão prestados remotamente, de segunda a sexta-feira, das 09h00 às 17h00 (horário de Brasília). Os relatórios mensais serão entregues até o 10º dia útil do mês subsequente, desde que a CONTRATANTE envie os documentos até o dia 5.</p>
                <p className="ctr-cl">CLÁUSULA 3ª — Das Responsabilidades da CONTRATANTE</p>
                <div className="ctr-li">Fornecer documentos e acessos até o dia 5 de cada mês</div>
                <div className="ctr-li">Responder às solicitações em até 48 horas úteis</div>
                <div className="ctr-li">Manter atualizados os acessos às plataformas utilizadas</div>
                {calc.d.agend > 0 && <div className="ctr-li">Manter saldo bancário suficiente para os agendamentos</div>}
                {calc.d.nfs > 0 && <div className="ctr-li">Fornecer dados completos para emissão de notas fiscais</div>}
                <p className="ctr-cl">CLÁUSULA 4ª — Das Vedações à CONTRATADA</p>
                <p className="ctr-p">Não integram o escopo: negociação com terceiros em nome da CONTRATANTE; tomada de decisões gerenciais; cobranças a clientes; controle de caixa físico; obrigações fiscais acessórias (SPED, EFD, DCTF), salvo se expressamente previsto.</p>

                <div className="ctr-sec">IV — Dos Valores e Reajuste</div>
                <p className="ctr-cl">CLÁUSULA 5ª — Dos Honorários</p>
                <div className="ctr-val">
                  <div style={{fontSize:11,fontWeight:600,color:'#1A4D3A',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Mensalidade contratada</div>
                  <div className="ctr-val-num">{fmt2(val)}</div>
                  <div style={{fontSize:11,color:'#2D7A5A',marginTop:4}}>Pagamento até o dia 05 de cada mês via boleto bancário</div>
                </div>
                <p className="ctr-p">O primeiro honorário será pago no ato da assinatura. Os demais serão pagos até o dia 05 de cada mês via boleto.</p>
                <p className="ctr-cl">CLÁUSULA 6ª — Do Volume de Serviços</p>
                <table className="ctr-tb">
                  <thead><tr><th>Serviço</th><th>Limite Mensal</th></tr></thead>
                  <tbody>
                    {calc.d.bancos > 0 && <tr><td>Contas bancárias monitoradas</td><td>Até {calc.d.bancos} conta{calc.d.bancos>1?'s':''}</td></tr>}
                    {calc.d.capag > 0 && <tr><td>Contas a pagar / agendamentos</td><td>Até {Math.ceil(calc.d.capag*1.5)} títulos/mês</td></tr>}
                    {calc.d.nfs > 0 && <tr><td>Notas fiscais</td><td>Até {Math.ceil(calc.d.nfs*1.5)} NFs/mês</td></tr>}
                    {calc.d.boletos > 0 && <tr><td>Boletos emitidos</td><td>Até {Math.ceil(calc.d.boletos*1.5)}/mês</td></tr>}
                    {calc.d.reuniao > 0 && <tr><td>Reunião estratégica</td><td>1 reunião/mês</td></tr>}
                  </tbody>
                </table>
                <p className="ctr-cl">CLÁUSULA 7ª — Da Mora e Reajuste</p>
                <p className="ctr-p">Pagamento em atraso: multa de 2% + juros de 0,08% ao dia + correção pelo IGPM/FGV. Atraso superior a 15 dias faculta à CONTRATADA suspender os serviços. Reajuste anual pelo IGPM/FGV, piso 5% e teto 15%.</p>

                <div className="ctr-sec">V — Da Vigência e Rescisão</div>
                <p className="ctr-cl">CLÁUSULA 8ª — Da Vigência</p>
                <p className="ctr-p">Vigência de 12 (doze) meses a partir da assinatura, com renovação automática, salvo aviso prévio por escrito de 30 (trinta) dias. O descumprimento do aviso implica multa de 1 (um) honorário mensal.</p>

                <div className="ctr-sec">VI — Confidencialidade e LGPD</div>
                <p className="ctr-cl">CLÁUSULA 9ª — Da Confidencialidade e LGPD (Lei 13.709/2018)</p>
                <p className="ctr-p">As partes mantêm sigilo absoluto por 5 anos após o término. A CONTRATANTE é Controladora e a CONTRATADA é Operadora dos dados. Em caso de incidente, a CONTRATADA notificará em até 72 horas.</p>

                <div className="ctr-sec">VII — Do Foro</div>
                <p className="ctr-cl">CLÁUSULA 10ª — Do Foro</p>
                <p className="ctr-p">Fica eleito o Foro da Comarca de <strong>{foro}</strong>, com expressa renúncia a qualquer outro.</p>

                <p style={{textAlign:'center',marginTop:32,marginBottom:24,fontSize:12,color:'#6A6760'}}>{cidadeEmp}, {dataHoje}.</p>
                <div className="ctr-assin">
                  <div className="ctr-assin-bl">
                    <div style={{fontWeight:600,fontSize:12}}>{nomeEmp}</div>
                    <div style={{fontSize:11,color:'#6A6760'}}>{repEmp} — CONTRATADA</div>
                  </div>
                  <div className="ctr-assin-bl">
                    <div style={{fontWeight:600,fontSize:12}}>{calc.d.nome || '___________________________'}</div>
                    <div style={{fontSize:11,color:'#6A6760'}}>Nome / CPF: _______________________ — CONTRATANTE</div>
                  </div>
                </div>
                <div style={{marginTop:32,paddingTop:16,borderTop:'1px solid #E8E5DE'}}>
                  <p style={{fontSize:11,color:'#6A6760',fontWeight:600,marginBottom:8}}>TESTEMUNHAS:</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:40}}>
                    <div style={{borderTop:'1px solid #ccc',paddingTop:6,fontSize:11,color:'#6A6760'}}>
                      <div>1ª Testemunha</div><div>Nome: ____________________________</div><div>CPF: _____________________________</div>
                    </div>
                    <div style={{borderTop:'1px solid #ccc',paddingTop:6,fontSize:11,color:'#6A6760'}}>
                      <div>2ª Testemunha</div><div>Nome: ____________________________</div><div>CPF: _____________________________</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="prec-btn-row" style={{marginTop:16}}>
                <button className="prec-btn prec-btn-ghost" onClick={() => irPara(5)}>← Voltar</button>
                <button className="prec-btn prec-btn-ghost" onClick={() => { irPara(1); setCalc(null); setValorProposta('') }}>Novo cliente</button>
                <button className="prec-btn prec-btn-primary" onClick={() => window.print()}>🖨 Imprimir / PDF</button>
              </div>
            </div>
          )
        })()}

      </div>
    </>
  )
}`

fs.writeFileSync('src/pages/PrecificacaoPage.jsx', c)
console.log('OK4 - tamanho:', c.length)