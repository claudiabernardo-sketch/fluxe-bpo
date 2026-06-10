const fs = require('fs')
let c = fs.readFileSync('src/pages/ConfigPage.jsx', 'utf8')

// 1. Adicionar aba Proposta nas tabs
c = c.replace(
  "[['empresa','🏢 Empresa'],['equipe','👥 Equipe'],['operacional','⚙️ Operacional']]",
  "[['empresa','🏢 Empresa'],['equipe','👥 Equipe'],['operacional','⚙️ Operacional'],['proposta','📊 Proposta']]"
)

// 2. Adicionar state da proposta após o state do opForm
c = c.replace(
  "  // Usuários da empresa",
  `  // Config proposta
  const [propForm, setPropForm] = useState({
    quemSomos: '',
    instagram: '',
    representante: '',
    cargo: '',
    cpf_rep: '',
    endereco: '',
    cidade: '',
    foro: '',
    num1_valor: '+120', num1_label: 'Rotinas financeiras geridas',
    num2_valor: '+200', num2_label: 'Empresas impactadas',
    num3_valor: '+95%', num3_label: 'De satisfação dos clientes',
    num4_valor: '+3 anos', num4_label: 'De experiência',
    dep1_nome: '', dep1_texto: '',
    dep2_nome: '', dep2_texto: '',
    dep3_nome: '', dep3_texto: '',
  })

  // Usuários da empresa`
)

// 3. Carregar propForm no useEffect
c = c.replace(
  "      if (empresa.config) {\n        try { setOpForm(o => ({ ...o, ...empresa.config })) } catch{}\n      }",
  `      if (empresa.config) {
        try { setOpForm(o => ({ ...o, ...empresa.config })) } catch{}
        try { if (empresa.config.proposta) setPropForm(o => ({ ...o, ...empresa.config.proposta })) } catch{}
      }`
)

// 4. Adicionar função salvarProposta após salvarOp
c = c.replace(
  "  const fi = {",
  `  async function salvarProposta() {
    if (!empresa) return
    const configAtual = empresa.config || {}
    await supabase.from('empresas').update({ config: { ...configAtual, proposta: propForm } }).eq('id', empresa.id)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const fi = {`
)

// 5. Adicionar aba Proposta antes do fechamento do return
c = c.replace(
  "    </div>\n  )\n}",
  `
      {/* ABA PROPOSTA */}
      {tab === 'proposta' && (
        <>
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#1E40AF' }}>
            📊 Esses dados aparecem automaticamente na sua Proposta Visual gerada pelo sistema.
          </div>

          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:20, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:14 }}>🏢 Identidade do BPO</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Quem somos (aparece na proposta)</label>
                <textarea style={{ ...fi, minHeight:80, resize:'vertical' }} value={propForm.quemSomos} onChange={e=>setPropForm(f=>({...f,quemSomos:e.target.value}))} placeholder="Ex: Na [Sua Empresa], transformamos números em estratégia. Atuamos como o braço financeiro das empresas..." />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Instagram</label>
                <input style={fi} value={propForm.instagram} onChange={e=>setPropForm(f=>({...f,instagram:e.target.value}))} placeholder="@seubpo" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Representante Legal</label>
                <input style={fi} value={propForm.representante} onChange={e=>setPropForm(f=>({...f,representante:e.target.value}))} placeholder="Nome completo" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Cargo</label>
                <input style={fi} value={propForm.cargo} onChange={e=>setPropForm(f=>({...f,cargo:e.target.value}))} placeholder="Ex: Sócia Administradora" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>CPF do Representante</label>
                <input style={fi} value={propForm.cpf_rep} onChange={e=>setPropForm(f=>({...f,cpf_rep:e.target.value}))} placeholder="000.000.000-00" />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Endereço completo</label>
                <input style={fi} value={propForm.endereco} onChange={e=>setPropForm(f=>({...f,endereco:e.target.value}))} placeholder="Rua, número, bairro, cidade/UF, CEP" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Cidade (para assinatura)</label>
                <input style={fi} value={propForm.cidade} onChange={e=>setPropForm(f=>({...f,cidade:e.target.value}))} placeholder="Ex: Barueri/SP" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Foro (cláusula contratual)</label>
                <input style={fi} value={propForm.foro} onChange={e=>setPropForm(f=>({...f,foro:e.target.value}))} placeholder="Ex: Barueri/SP" />
              </div>
            </div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:20, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:14 }}>📊 Números da empresa (aparecem na proposta)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                ['num1_valor','num1_label'],
                ['num2_valor','num2_label'],
                ['num3_valor','num3_label'],
                ['num4_valor','num4_label'],
              ].map(([vk, lk], i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:8 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Número {i+1}</label>
                    <input style={fi} value={propForm[vk]} onChange={e=>setPropForm(f=>({...f,[vk]:e.target.value}))} placeholder="+120" />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Descrição</label>
                    <input style={fi} value={propForm[lk]} onChange={e=>setPropForm(f=>({...f,[lk]:e.target.value}))} placeholder="Rotinas geridas" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:20, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:4 }}>💬 Depoimentos (até 3)</div>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:14 }}>Aparecem na proposta visual. Se vazio, a seção é omitida.</div>
            {[1,2,3].map(n => (
              <div key={n} style={{ borderTop: n>1 ? '1px solid #F1F5F9' : 'none', paddingTop: n>1 ? 14 : 0, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#6366F1', marginBottom:8 }}>Depoimento {n}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:8 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Nome do cliente</label>
                    <input style={fi} value={propForm['dep'+n+'_nome']} onChange={e=>setPropForm(f=>({...f,['dep'+n+'_nome']:e.target.value}))} placeholder="Ex: João Silva" />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Depoimento</label>
                    <textarea style={{ ...fi, minHeight:60, resize:'vertical' }} value={propForm['dep'+n+'_texto']} onChange={e=>setPropForm(f=>({...f,['dep'+n+'_texto']:e.target.value}))} placeholder="O que o cliente disse..." />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={salvarProposta} style={{ padding:'10px 24px', background:'#6366F1', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Salvar configurações da proposta
            </button>
          </div>
        </>
      )}

    </div>
  )
}`
)

fs.writeFileSync('src/pages/ConfigPage.jsx', c)
console.log('OK - Config proposta adicionada')
console.log('Aba proposta:', c.includes("'proposta','📊 Proposta'"))
console.log('salvarProposta:', c.includes('salvarProposta'))