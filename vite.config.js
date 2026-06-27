import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Supabase separado
          if (id.includes('@supabase')) return 'supabase'
          // Recharts separado
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          // XLSX separado (só carrega quando exportar/importar)
          if (id.includes('xlsx')) return 'xlsx'
          // Docx separado (só carrega quando gerar contrato)
          if (id.includes('docx')) return 'docx'
          // Demais libs vendor juntas
          if (id.includes('node_modules')) return 'vendor'
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
})
