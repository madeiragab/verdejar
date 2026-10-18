import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em dev o Vite repassa /api e /uploads para a API → mesmo domínio, cookie de refresh funciona sem CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3333',
      '/uploads': 'http://localhost:3333',
    },
  },
});
