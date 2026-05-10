# 1. 基础镜像
FROM node:20-alpine

# 2. 设置工作目录
WORKDIR /app

# 3. 仅拷贝 package.json 依赖配置，利用缓存
COPY package*.json ./

# 4. 安装依赖 (包括开发依赖以执行 Vite 构建)
RUN npm install

# 5. 拷贝项目源码
COPY . .

# 6. 构建前端 Vite 静态产物到 dist/
RUN npm run build

# 7. 暴露服务运行端口
EXPOSE 3000

# 8. 启动全栈服务器 (Express 会提供静态文件和 API 服务)
CMD ["npx", "tsx", "server.ts"]
