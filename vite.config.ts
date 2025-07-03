
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    proxy: {
      // Requisições para /api serão encaminhadas para a API do Resend
      '/api': {
        target: 'https://api.resend.com', // URL da API
        changeOrigin: true,  // Isso faz o proxy funcionar corretamente com CORS
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove o prefixo /api da URL antes de encaminhar
      },
    },
    host: "::",
    port: 8080,
    fs: {
      strict: false,
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
