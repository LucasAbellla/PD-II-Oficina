import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Em desenvolvimento, /api é encaminhado ao backend (evita CORS).
// Em produção (Vercel), defina VITE_API_URL apontando para a API no Render.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3333' } },
});
