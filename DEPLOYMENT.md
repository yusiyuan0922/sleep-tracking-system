# 部署指南

## 系统架构变更

已成功将项目从阿里云OSS迁移到本地MinIO对象存储,并支持Docker容器化部署。

### 核心变更
1. **对象存储**: 阿里云OSS → MinIO (S3兼容)
2. **部署方式**: 单机部署 → Docker Compose容器编排
3. **开发模式**: 支持代码热更新的混合开发环境

## 环境要求

- Docker Desktop (已安装并运行)
- Node.js 18+ (本地开发需要)
- PostgreSQL 14 (Docker容器提供)
- MinIO (Docker容器提供)

## 快速开始

### 1. 开发环境部署

#### 方式一:完全容器化(推荐用于生产测试)
```bash
# 启动所有服务(PostgreSQL + MinIO + Backend + Web-Admin)
docker-compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f backend
```

#### 方式二:混合开发模式(推荐用于日常开发)
```bash
# 1. 启动基础服务(PostgreSQL + MinIO)
docker-compose -f docker-compose.dev.yml up -d postgres minio minio-init

# 2. 等待MinIO初始化完成
docker ps  # 确认sleep-minio-dev状态为healthy

# 3. 本地启动Backend(支持热更新)
cd backend
npm run start:dev

# 4. 本地启动Web-Admin(支持热更新)
cd web-admin
npm run dev
```

### 2. 生产环境部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker ps

# 查看日志
docker-compose logs -f
```

## 服务访问地址

| 服务 | 地址 | 用途 |
|-----|------|-----|
| Backend API | http://localhost:3000 | NestJS后端API |
| Swagger文档 | http://localhost:3000/api-docs | API接口文档 |
| Web Admin | http://localhost:5173 | 管理后台 |
| MinIO API | http://localhost:9000 | 对象存储API |
| MinIO Console | http://localhost:9001 | MinIO管理控制台 |
| PostgreSQL | localhost:5432 | 数据库(仅本地访问) |

## MinIO配置

### 默认凭证
- Access Key: `minioadmin`
- Secret Key: `minioadmin123`
- Bucket: `sleep-tracking` (自动创建,公开读权限)

### 环境变量(.env.development)
```env
MINIO_ENDPOINT=localhost          # 开发环境
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=sleep-tracking
MINIO_PUBLIC_ENDPOINT=http://localhost:9000
```

注意:生产环境需要修改默认密码!

## 当前系统状态

✅ **已完成**:
- [x] PostgreSQL容器运行正常(端口5432)
- [x] Backend本地开发环境启动成功
- [x] 数据库自动创建所有表结构
- [x] MinIO SDK集成完成
- [x] Docker配置文件创建完成
- [x] 环境变量配置完成

⏳ **进行中**:
- [ ] MinIO镜像下载(网络较慢,需等待)
- [ ] MinIO容器启动
- [ ] 文件上传功能测试

## 代码热更新说明

### Backend热更新
使用`docker-compose.dev.yml`时,代码文件已通过volume映射:
```yaml
volumes:
  - ./backend:/app/backend
  - ./shared:/app/shared
```
修改代码后,NestJS会自动重新编译并重启。

### Web-Admin热更新
Vite开发服务器支持HMR(Hot Module Replacement):
```yaml
volumes:
  - ./web-admin:/app/web-admin
  - ./shared:/app/shared
```
保存代码后浏览器自动刷新。

## 故障排查

### 1. PostgreSQL无法连接
```bash
# 检查容器状态
docker ps | grep postgres

# 查看日志
docker logs sleep-postgres-dev

# 重启容器
docker-compose -f docker-compose.dev.yml restart postgres
```

### 2. MinIO下载缓慢
由于网络原因,MinIO镜像下载可能较慢。可以:

**方案一:等待下载完成**
```bash
# 查看下载进度
docker pull minio/minio:latest
```

**方案二:使用国内镜像源**
编辑Docker Desktop设置,添加镜像加速器:
- 阿里云: https://your-id.mirror.aliyuncs.com
- 网易: https://hub-mirror.c.163.com

**方案三:离线导入镜像**
从其他机器导出镜像并导入:
```bash
# 在有镜像的机器上
docker save minio/minio:latest > minio.tar

# 在当前机器上
docker load < minio.tar
```

### 3. Backend启动失败
```bash
# 检查环境变量
cat backend/.env.development

# 重新安装依赖
cd backend
npm install

# 查看详细错误
npm run start:dev
```

### 4. 端口冲突
如果端口被占用,修改`docker-compose.dev.yml`中的端口映射:
```yaml
ports:
  - "5433:5432"  # 将5432改为5433
```

## 数据持久化

Docker volumes确保数据不会因容器重启而丢失:

```yaml
volumes:
  postgres-dev-data:  # PostgreSQL数据
  minio-dev-data:     # MinIO对象存储数据
```

查看volumes:
```bash
docker volume ls
docker volume inspect sleep_postgres-dev-data
```

## 测试文件上传

等MinIO启动后,可以通过以下方式测试:

### 1. 使用Swagger UI
访问 http://localhost:3000/api-docs,找到上传接口测试

### 2. 使用curl
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg"
```

### 3. 查看MinIO控制台
访问 http://localhost:9001,使用minioadmin/minioadmin123登录,查看上传的文件

## 生产部署检查清单

- [ ] 修改MinIO默认密码
- [ ] 配置HTTPS(使用Nginx反向代理)
- [ ] 设置合适的CORS策略
- [ ] 配置数据库备份
- [ ] 配置MinIO数据备份
- [ ] 设置资源限制(memory/cpu limits)
- [ ] 配置监控和日志收集
- [ ] 设置防火墙规则
- [ ] 配置域名和SSL证书

## 下一步行动

1. **等待MinIO下载完成**
   ```bash
   # 查看下载进度
   docker ps -a | grep minio
   ```

2. **启动MinIO服务**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d minio minio-init
   ```

3. **验证系统集成**
   - 访问Backend健康检查: http://localhost:3000
   - 访问Swagger文档: http://localhost:3000/api-docs
   - 测试文件上传接口
   - 在MinIO控制台验证文件存储

4. **启动Web-Admin**
   ```bash
   cd web-admin
   npm run dev
   ```

## 联系与支持

如遇到问题,请检查:
1. Docker Desktop是否正常运行
2. 端口是否被占用
3. 环境变量配置是否正确
4. Docker日志输出
