import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// IMPORTANT: project pages live at https://<user>.github.io/KNOWNET/
// so assets must be prefixed with /KNOWNET/
export default defineConfig({
  base: '/KNOWNET/',
  plugins: [react()],
})
