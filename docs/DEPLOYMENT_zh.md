# Silicon Nexus — 部署指南

生产域名：**https://silinex.xyz/**

## 推荐：本机 PM2 + Nginx + Let's Encrypt

### 1. 构建并启动应用

```bash
cd /home/ubuntu/Silicon-Nexus
cp -n .env.example .env   # 确保 APP_URL=https://silinex.xyz
npm install
npm run build
pm2 start ecosystem.config.cjs
# 或更新已有进程：
pm2 delete silicon-nexus
pm2 start ecosystem.config.cjs
pm2 save
```

应用监听 `127.0.0.1:3000`（对外由 Nginx 终止 TLS）。

### 2. Nginx 反代

仓库模板：[`deploy/nginx-silinex.xyz.conf`](../deploy/nginx-silinex.xyz.conf)

```bash
sudo cp deploy/nginx-silinex.xyz.conf /etc/nginx/sites-available/silinex.xyz
sudo ln -sf /etc/nginx/sites-available/silinex.xyz /etc/nginx/sites-enabled/
# 首次申请证书前可先只用 HTTP 反代（见下方 Certbot）
sudo nginx -t && sudo systemctl reload nginx
```

### 3. HTTPS（Certbot）

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d silinex.xyz -d www.silinex.xyz --redirect
```

证书续期由 certbot timer 自动处理。

### 4. 验证

```bash
curl -sf https://silinex.xyz/health
curl -sf https://silinex.xyz/api/auth/status
```

控制台：https://silinex.xyz/console  
Operator Key 在首次启动时写入 `data/secrets.json` 并打印到 PM2 日志。

### MCP / Agent

```bash
export NEXUS_API_URL=https://silinex.xyz/api
export NEXUS_AGENT_TOKEN=nxa_...
export NEXUS_AGENT_ID=Alpha-7
```

---

## Docker Compose

```bash
APP_URL=https://silinex.xyz docker compose up --build -d
```

仍需宿主机 Nginx/Caddy 做 443 → 容器 `3000` 反代与证书。

---

## 环境变量

| 变量 | 说明 |
|------|------|
| `APP_URL` | 公网 URL，默认 `https://silinex.xyz` |
| `CORS_ORIGINS` | 额外允许的 Origin（逗号分隔） |
| `NEXUS_OPERATOR_KEY` | 可选，覆盖 `data/secrets.json` |
| `NEXUS_AUTH_MODE` | `identity`（默认）或 `open` |
