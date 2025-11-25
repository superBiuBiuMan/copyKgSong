import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5288, // 使用不常用的端口
    strictPort: false, // 如果端口被占用，自动尝试下一个
    // 不再需要代理，直接请求后端服务器 6522
  },
});
