# Playlist Manager（酷狗歌单管理器）

一个独立的子项目，用于：

- 扫码登录酷狗账号
- 获取并展示个人歌单列表
- 查看歌单歌曲、导出 JSON/CSV/Excel
- 将歌单备份到 SQLite 数据库，并支持对比当前歌单与历史备份差异

前端基于 **Vue 3 + Vite**，后端是一个独立的 **Express** 服务（Node ESM），与主项目的 API 解耦。

* 体验地址
  * https://kgmusic.123916.xyz/
* 项目源码地址
  * https://github.com/superBiuBiuMan/copyKgSong

* 参考加密和效果
  * https://github.com/MoeKoeMusic/MoeKoeMusic

* 注意
  * 服务器是国外的,接口比较慢,感兴趣可以自己下载到本地来

---

# 效果浏览

![](https://dreamos.oss-cn-beijing.aliyuncs.com/gitblog/202511251110650.png)

![](https://dreamos.oss-cn-beijing.aliyuncs.com/gitblog/202511251104156.png)![](https://dreamos.oss-cn-beijing.aliyuncs.com/gitblog/202511251111350.png)

![](https://dreamos.oss-cn-beijing.aliyuncs.com/gitblog/202511251057116.png)

![](https://dreamos.oss-cn-beijing.aliyuncs.com/gitblog/202511251111472.png)

![](https://dreamos.oss-cn-beijing.aliyuncs.com/gitblog/202511251112586.png)

## 目录结构概览

- `src/`
  - `views/`：登录页、歌单列表、歌单详情、备份管理、对比页面
  - `utils/`：请求封装、导出工具、备份 API 封装等
- `server/`
  - `index.js`：Express 入口
  - `routes/`
    - `kugou.js`：酷狗相关接口（登录二维码、用户歌单、歌单歌曲）
    - `backup.js`：备份相关接口（创建/查询/删除/统计）
  - `module/`：酷狗 API 模块（二维码登录、歌单列表、歌单歌曲）
  - `util/`：请求签名、加密、配置等工具（独立于主项目）
  - `db.js`：SQLite 数据库封装
- `index.html`：前端入口模板
- `vite.config.mjs`：Vite 配置
- `.env.*`：前端环境变量
- `package.json`：脚本与依赖

---

## 环境要求

- Node.js：建议使用 Volta 中指定的版本（例如 `20.18.1`），或 >= 18
- npm 或 pnpm（项目当前包含 `pnpm-lock.yaml`，你可以选择其中一种包管理工具）

安装依赖（在 `playlist-manager` 目录下）：

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

---

## 开发环境启动

在 `playlist-manager` 目录下：

### 一键启动前端 + 后端

```bash
npm run dev
```

该命令会同时启动：

- **后端 Express 服务**：`node server/index.js`
  - 默认端口：`6522`（可通过 `server/.env` 中的 `PORT` 修改，例如 `PORT=16522`）
  - 暴露的主要路由：
    - 酷狗代理：`/login/qr/*`、`/user/playlist`、`/playlist/track/all`
    - 备份服务：`/api/backup/*`
    - 健康检查：`/api/health`
- **前端开发服务器（Vite）**：默认 `http://localhost:5173`

前端通过环境变量 `VITE_API_BASE_URL` 访问后端（见下文）。

### 单独启动后端

```bash
npm run server
```

- 默认监听 `http://localhost:6522`（或 `http://localhost:${PORT}`，当在环境变量或 `server/.env` 中设置了 `PORT` 时）
- 推荐在 `server/.env` 中设置端口，例如：`PORT=16522`；也可以在启动前通过环境变量 `PORT` 覆盖，或直接修改 `server/index.js` 中的端口逻辑。

### 单独启动前端

```bash
npm run client
```

默认访问地址：`http://localhost:5173`

---

## 前端与后端的连接方式（环境变量）

前端通过一个统一的环境变量 `VITE_API_BASE_URL` 来访问 Express 后端。

在 `src/utils/request.js` 中：

```js
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:6522";
```

- 所有酷狗相关接口（登录 / 歌单 / 歌曲）都以 `API_BASE_URL` 为前缀
- 备份相关接口也基于 `API_BASE_URL`：
  - `BACKUP_API_BASE = `${API_BASE_URL}/api/backup``

### 开发环境配置

在 `playlist-manager/.env.development` 中：

```env
VITE_API_BASE_URL=http://localhost:6522
```

确保后端 Express 服务监听在 `6522` 端口即可。

### 生产环境配置

在 `playlist-manager/.env.production` 中，将 `VITE_API_BASE_URL` 设置为部署后端的访问地址，例如：

```env
VITE_API_BASE_URL=https://kgmusic-server.123916.xyz
```

> 注意：请根据实际情况替换为你自己的域名，保持与实际部署的 Express 服务地址一致。

---

## 构建与部署前端

### 构建前端静态资源

```bash
npm run build
```

构建产物会输出到 `dist/` 目录，你可以选择：

- 使用任意静态文件服务（Nginx、静态托管平台等）直接部署 `dist/` 内容
- 或集成到更大的主应用中

### 典型部署方案示例

1. **部署 Express 后端**

   - 在服务器上拉取代码
   - 安装依赖：`npm install`
   - （可选）在 `server/.env` 中配置 `PORT`、`FRONTEND_URL` 等环境变量
   - 确保 SQLite 数据文件（如果有）路径正确、目录可写
   - 使用进程管理工具启动：
     ```bash
     node server/index.js
     # 或
     pm2 start server/index.js --name playlist-manager-server
     ```
   - 确保外部可以访问到该服务，例如通过 `https://kgmusic-server.123916.xyz` 或你自己的域名反向代理到本服务

2. **部署前端静态文件**

   - 在本地或 CI 中执行：`npm run build`
   - 将 `dist/` 目录内容上传到静态资源服务器（Nginx、CDN 或前端托管平台）
   - 确保构建前已经正确设置 `VITE_API_BASE_URL`（指向线上 Express 服务地址）

3. **反向代理示例（Nginx 思路）**

   - 静态资源：

     ```nginx
     location / {
       root /path/to/playlist-manager/dist;
       try_files $uri /index.html;
     }
     ```

   - API 反向代理：

     ```nginx
     # 注意：以下示例假设后端监听在 6522 端口，如果在 server/.env 中修改了 PORT，请同步调整这里的端口
     location /api/ {
       proxy_pass http://127.0.0.1:6522/api/;
     }
     
     location /login/qr/ {
       proxy_pass http://127.0.0.1:6522/login/qr/;
     }
     
     location /user/playlist {
       proxy_pass http://127.0.0.1:6522/user/playlist;
     }
     
     location /playlist/track/all {
       proxy_pass http://127.0.0.1:6522/playlist/track/all;
     }
     ```

以上仅为示例，请根据实际域名与部署环境调整。

---

## 开发调试建议

- 如果歌单列表或歌曲接口返回 `status: 0` 或 HTTP 502，可以检查：
  - 登录是否仍然有效（二维码登录重新扫码）
  - `VITE_API_BASE_URL` 是否正确指向当前后端
- 如果备份相关接口报错，优先检查：
  - `server/db.js` 指定的 SQLite 文件路径是否存在、目录是否可写
  - `server/routes/backup.js` 中的日志输出（Node 控制台）

如需扩展更多酷狗接口，可以在 `server/module/` 中按照主项目的模式新增模块，再通过 `routes/kugou.js` 暴露路由即可。
