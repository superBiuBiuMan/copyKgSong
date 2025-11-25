import "dotenv/config";
import express from "express";
import cors from "cors";
import backupRoutes from "./routes/backup.js";
import kugouRoutes from "./routes/kugou.js";

const app = express();
const PORT = process.env.PORT || 6522; // 后端使用 6522（避免与父级 API 6521 冲突）

// CORS 配置 - 允许前端域名访问
const allowedOrigins = [
  "http://localhost:5288", // 前端开发端口
  "http://localhost:5289", // 备用端口
  "http://localhost:5173",
  process.env.FRONTEND_URL, // 生产环境前端地址
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // 允许没有 origin 的请求（如 Postman）
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes("*")
      ) {
        callback(null, true);
      } else {
        callback(null, true); // 开发阶段允许所有，生产环境建议限制
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" })); // 支持大数据量

// 路由
app.use("/api/backup", backupRoutes);
app.use("", kugouRoutes); // 酷狗 API 代理路由

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "服务运行正常",
    services: {
      backup: "运行中",
      kugouProxy: "运行中",
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 服务已启动: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`💾 备份服务: http://localhost:${PORT}/api/backup`);
  console.log(`🎵 酷狗代理: http://localhost:${PORT}/login/qr/key`);
});
