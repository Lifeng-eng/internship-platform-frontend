import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 注意：根据你的提示，这里使用的是新版的 rolldownOptions（如果是旧版 Vite 则写 rollupOptions）
    rolldownOptions: {
      output: {
        // 分包策略：将 node_modules 中的第三方库单独打包
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; 
          }
        }
      }
    }
  }
})