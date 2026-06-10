const fs = require('fs')
let c = fs.readFileSync('src/pages/PrecificacaoPage.jsx', 'utf8')

// Substituir o botão imprimir proposta para abrir janela limpa
c = c.replace(
  `<button className="prec-btn prec-btn-ghost" onClick={() => window.print()}>🖨 Imprimir proposta</button>`,
  `<button className="prec-btn prec-btn-ghost" onClick={() => {
                const w = window.open('', '_blank', 'width=900,height=700')
                const el = document.getElementById('proposta-print')
                w.document.write('<html><head><title>Proposta</title><style>body{font-family:DM Sans,sans-serif;margin:0;padding:32px;color:#1a1a1a;font-size:13px;line-height:1.7}@page{margin:1.5cm}*{box-sizing:border-box}.prec-scope-block{background:#F9F8F5;border:1px solid #E8E5DE;border-radius:8px;padding:16px;margin-bottom:12px}.prec-scope-title{font-size:11px;font-weight:600;color:#6A6760;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;display:flex;align-items:center;gap:6px}.prec-scope-item{font-size:12px;color:#6A6760;padding:4px 0;display:flex;gap:6px}.prec-scope-item::before{content:"→";color:#1A4D3A;flex-shrink:0}</style></head><body>' + el.innerHTML + '</body></html>')
                w.document.close()
                setTimeout(() => { w.print() }, 500)
              }}>🖨 Imprimir proposta</button>`
)

// Adicionar id no container da proposta
c = c.replace(
  `{/* PROPOSTA */}
            <div className="prec-card">`,
  `{/* PROPOSTA */}
            <div id="proposta-print" className="prec-card">`
)

fs.writeFileSync('src/pages/PrecificacaoPage.jsx', c)
console.log('OK:', c.includes('proposta-print'))