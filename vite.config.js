import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Code-splitting manual: bibliotecas grandes (PDF, ZIP, sanitização) viram
// chunks separados com hash próprio. Vantagem: quando o usuário abre o app,
// só baixa o React+App principal; html2pdf/jszip/dompurify só descem quando
// realmente forem usados (export PDF/DOCX/preview HTML). Em rede ruim, o
// primeiro carregamento fica bem mais leve.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pdf': ['html2pdf.js'],
          'zip': ['fflate'],
          'sanitize': ['dompurify'],
          'icons': ['lucide-react'],
        }
      }
    }
  }
})
