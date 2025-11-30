# ========== 构建阶段 ==========
FROM node:20-alpine AS builder

# 安装编译依赖 (bcrypt 需要)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 复制 monorepo 配置
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/ ./shared/

# 安装所有依赖 (包括 devDependencies)
RUN npm ci --workspace=backend --workspace=shared

# 复制源码
COPY backend/ ./backend/
COPY shared/ ./shared/

# 构建 TypeScript
WORKDIR /app/backend
RUN npm run build

# ========== 运行阶段 ==========
FROM node:20-alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

WORKDIR /app

# 复制 monorepo 配置
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/ ./shared/

# 只安装生产依赖
RUN npm ci --workspace=backend --workspace=shared --only=production

# 从构建阶段复制编译产物
COPY --from=builder /app/backend/dist ./backend/dist

WORKDIR /app/backend

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# 启动命令
CMD ["node", "dist/main.js"]
