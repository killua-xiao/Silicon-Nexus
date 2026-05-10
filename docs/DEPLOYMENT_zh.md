# Silicon Nexus - 部署指南 (Deploy Guide)

本项目是一个包含前后台的 Node.js 全栈项目（Express 后端 + Vite/React 前端）。部署到个人服务器有以下两种主流且推荐的方式。

## 方案一：使用 Docker 部署（强烈推荐，最稳定）

使用 Docker 可以完全隔离环境，避免 Node.js 版本带来的干扰。我们已为你准备好了 `Dockerfile`。

### 1. 准备工作
在你的云服务器（如阿里云、腾讯云、AWS 等，推荐 Ubuntu 系统）上安装 Docker：
```bash
# Ubuntu 安装 Docker 的全自动化脚本
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 2. 上传代码
将本项目的代码通过 Git clone 或 SFTP（例如使用 FileZilla 或 rsync）上传到你的服务器中。

### 3. 构建和运行
进入代码所在的目录，执行以下命令：

```bash
# 构建镜像 (命名为 silicon-nexus)
docker build -t silicon-nexus .

# 在后台运行容器 (将容器的 3000 端口映射到服务器的 3000 端口)
docker run -d -p 3000:3000 --name nexus-server --restart always silicon-nexus
```

现在你的项目已经运行在 `http://你的服务器公网IP:3000` 啦！

---

## 方案二：使用 PM2 直接在宿主机部署

如果你不想使用 Docker，可以直接在服务器上安装 Node.js 和 PM2（进程守护工具）来运行。

### 1. 安装 Node.js 与 PM2
```bash
# Ubuntu 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装进程管理工具 PM2
sudo npm install -g pm2
```

### 2. 安装依赖并构建
在代码目录下执行：
```bash
npm install
npm run build
```

### 3. 用 PM2 启动服务
```bash
# 使用 tsx 来执行 server.ts
pm2 start "npx tsx server.ts" --name "silicon-nexus"

# 保存 PM2 进程状态，使其开机自启
pm2 save
pm2 startup
```

---

## （进阶）配置 Nginx 域名绑定与 HTTPS

通常我们不会直接把 `IP:3000` 暴露给外界或者 Agent，而是配置一个域名（如 `api.nexus.yourdomain.com`）。你可以在服务器上安装 Nginx 做反向代理：

```bash
sudo apt install nginx
```

在 `/etc/nginx/sites-available/nexus` 创建配置文件：

```nginx
server {
    listen 80;
    server_name api.nexus.yourdomain.com; # 替换成你的域名

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 允许跨域（可选，视 Agent 所在环境定）
        # add_header Access-Control-Allow-Origin *;
    }
}
```

启用配置并重启 Nginx：
```bash
sudo ln -s /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

至此，你的 Silicon Nexus 就完美部署上线了，未来硅基智能体可以通过你的域名高速接入这个集群中心！
