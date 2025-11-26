# Phase 1 功能验证指南

## 准备工作

### 1. 数据库配置

**检查PostgreSQL是否安装并运行:**
```bash
# Windows (检查服务状态)
pg_ctl status -D "C:\Program Files\PostgreSQL\14\data"

# 或使用服务管理器查看PostgreSQL服务是否运行
```

**创建数据库:**
```bash
# 连接到PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE sleep_tracking;

# 退出
\q
```

### 2. 更新环境变量

编辑 `backend/.env.development` 文件,至少需要配置:

```env
# 数据库配置 - 必须配置!
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=你的PostgreSQL密码
DB_DATABASE=sleep_tracking

# JWT配置 - 必须配置!
JWT_SECRET=your-super-secret-key-please-change-this-in-production
JWT_EXPIRES_IN=7d

# 微信小程序配置 - 暂时可以保持默认,不影响启动
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# OSS配置 - 暂时可以保持默认,不影响启动
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_oss_access_key
OSS_ACCESS_KEY_SECRET=your_oss_secret_key
OSS_BUCKET=sleep-tracking
```

⚠️ **注意:** 如果没有配置微信和OSS,相关功能会报错,但不影响服务启动。

## 验证步骤

### Step 1: 启动后端服务

```bash
cd backend
npm run start:dev
```

**预期输出:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] INFO [InstanceLoader] ConfigModule dependencies initialized
[Nest] INFO [InstanceLoader] AuthModule dependencies initialized
[Nest] INFO [InstanceLoader] UploadModule dependencies initialized
...
[Nest] INFO [NestApplication] Nest application successfully started
Application is running on: http://localhost:3000
```

如果看到错误,请检查:
- PostgreSQL是否运行
- 数据库密码是否正确
- 数据库 `sleep_tracking` 是否已创建

### Step 2: 访问Swagger API文档

打开浏览器访问: **http://localhost:3000/api-docs**

你应该能看到:
- **认证** 模块
  - `POST /auth/wx-login` - 微信登录
- **文件上传** 模块
  - `POST /upload/single` - 上传单个文件
  - `POST /upload/multiple` - 批量上传文件

### Step 3: 检查数据库表是否自动创建

由于开发环境配置了 `synchronize: true`,TypeORM会自动创建所有表。

**连接数据库查看:**
```bash
psql -U postgres -d sleep_tracking
```

**查看所有表:**
```sql
\dt
```

**预期看到16个表:**
```
 users                    -- 用户表
 hospitals                -- 医院表
 doctors                  -- 医生表
 patients                 -- 患者表
 stage_records            -- 阶段记录表
 scale_configs            -- 量表配置表
 scale_records            -- 量表记录表
 medication_records       -- 用药记录表
 concomitant_medications  -- 合并用药表
 adverse_events           -- 不良事件表
 ae_attachments           -- 不良事件附件表
 medical_files            -- 病例文件表
 audit_logs               -- 审核记录表
 push_messages            -- 推送消息表
 system_configs           -- 系统配置表
 operation_logs           -- 操作日志表
```

**查看某个表的结构:**
```sql
\d users
```

**退出:**
```sql
\q
```

## 功能测试

### 测试1: 健康检查

**请求:**
```bash
curl http://localhost:3000
```

**预期响应:**
服务正常运行

### 测试2: 微信登录API (模拟测试)

由于没有真实的微信code,这个测试会失败,但可以验证API是否可访问。

**使用Postman或curl测试:**
```bash
curl -X POST http://localhost:3000/auth/wx-login \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code\"}"
```

**预期响应:**
```json
{
  "statusCode": 401,
  "message": "微信配置未设置" 或 "微信登录失败"
}
```

这个错误是正常的,说明API可以访问,只是缺少真实配置。

### 测试3: 受保护的API (测试JWT守卫)

尝试访问一个需要认证的端点(目前只有上传端点):

```bash
curl -X POST http://localhost:3000/upload/single
```

**预期响应:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

说明JWT守卫正常工作!

### 测试4: 数据库操作测试

创建一个测试用户(使用psql):

```sql
-- 连接数据库
psql -U postgres -d sleep_tracking

-- 插入测试用户
INSERT INTO users (openid, role, name, status)
VALUES ('test_openid_123', 'patient', '测试患者', 'active');

-- 查询用户
SELECT * FROM users;

-- 查看结果
```

**预期结果:**
能成功插入并查询到用户数据,且 `created_at` 和 `updated_at` 字段自动填充。

## 验证清单

完成以下检查项:

- [ ] PostgreSQL数据库运行正常
- [ ] 数据库 `sleep_tracking` 创建成功
- [ ] `.env.development` 配置正确(至少DB和JWT)
- [ ] `npm run start:dev` 启动成功,无错误
- [ ] 访问 http://localhost:3000/api-docs 能看到Swagger文档
- [ ] 数据库中自动创建了16个表
- [ ] 表结构正确(包含字段、索引、外键等)
- [ ] 微信登录API可访问(即使返回错误)
- [ ] JWT守卫正常工作(未认证返回401)
- [ ] 能手动插入和查询数据

## 常见问题

### 1. 启动报错: "database does not exist"
**解决:** 手动创建数据库
```bash
psql -U postgres -c "CREATE DATABASE sleep_tracking;"
```

### 2. 启动报错: "password authentication failed"
**解决:** 检查 `.env.development` 中的 `DB_PASSWORD` 是否正确

### 3. 启动报错: "ECONNREFUSED ::1:5432"
**解决:** PostgreSQL服务未启动,请启动服务

### 4. 表没有自动创建
**解决:** 确认 `NODE_ENV=development` 且 `synchronize: true`

### 5. Swagger页面打不开
**解决:**
- 确认服务启动成功
- 检查端口3000是否被占用
- 尝试访问 http://localhost:3000 先确认服务可访问

## 下一步

如果所有验证通过,说明Phase 1基础架构搭建成功!

可以继续:
1. 配置真实的微信小程序凭证
2. 配置阿里云OSS凭证
3. 开始Phase 2: 用户管理模块开发
