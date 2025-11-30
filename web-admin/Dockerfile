# ========== 构建阶段 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 复制配置
COPY package*.json ./
COPY web-admin/package*.json ./web-admin/
COPY shared/ ./shared/

# 安装依赖
RUN npm ci --workspace=web-admin --workspace=shared

# 复制源码
COPY web-admin/ ./web-admin/
COPY shared/ ./shared/

WORKDIR /app/web-admin

# 构建参数
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 构建生产版本
RUN npm run build

# ========== 运行阶段 ==========
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/web-admin/dist /usr/share/nginx/html

# 复制 nginx 配置 (SPA 路由支持)
COPY web-admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
