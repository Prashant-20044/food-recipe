import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/login': 'http://localhost:5000',
      '/signUp': 'http://localhost:5000',
      '/google-login': 'http://localhost:5000',
      '/send-verification-code': 'http://localhost:5000',
      '/user': 'http://localhost:5000',
      '/recipe': 'http://localhost:5000',
      '/message': 'http://localhost:5000',
      '/chatbot': 'http://localhost:5000',
      '/api/turn': 'http://localhost:5000',
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
      '/images': 'http://localhost:5000',
      '/profiles': 'http://localhost:5000',
      '/follow': 'http://localhost:5000',
      '/follow-requests': 'http://localhost:5000',
      '/follow-request': 'http://localhost:5000',
      '/remove-follower': 'http://localhost:5000',
      '/unfollow': 'http://localhost:5000',
      '/followers-following': 'http://localhost:5000',
    },
  },
})
