import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@scenes': resolve(__dirname, 'src/scenes'),
      '@systems': resolve(__dirname, 'src/game/systems'),
      '@data': resolve(__dirname, 'src/game/data'),
      '@views': resolve(__dirname, 'src/scenes/views'),
      '@utils': resolve(__dirname, 'src/game/utils'),
      '@assets': resolve(__dirname, 'assets'),
    }
  },
  build: {
    // 构建前清空dist目录
    emptyOutDir: true,
    // 提高chunk大小警告阈值（Phaser引擎本身较大）
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Phaser引擎单独分包（利用浏览器缓存）
        manualChunks: {
          'phaser': ['phaser'],
        }
      }
    },
    // 启用CSS代码分割（为后续DOM UI做准备）
    cssCodeSplit: true,
    // 设置资源内联阈值（4KB以下内联base64）
    assetsInlineLimit: 4096,
  },
  // 开发服务器配置
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  // 预览服务器配置
  preview: {
    host: '0.0.0.0',
    port: 4173,
  }
});
