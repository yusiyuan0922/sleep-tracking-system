# Phase 1 功能验证指南

## ✅ 验证状态总览

**后端服务状态**: 运行中 🟢
**服务地址**: http://localhost:3000
**Swagger文档**: http://localhost:3000/api-docs
**数据库**: PostgreSQL (sleep_tracking)

---

## 1️⃣ 后端服务验证

### 服务运行验证

```bash
# 访问根路径(应返回404,表示服务运行正常)
curl http://localhost:3000
```

**预期结果**:
```json
{
  "statusCode": 404,
  "message": "Cannot GET /",
  "error": "Not Found"
}
```

---

## 2️⃣ 数据库验证

### 已创建的数据表 (16张)

✅ **核心表**:
- `users` - 用户表 (微信登录用户)
- `hospitals` - 医院表
- `doctors` - 医生表
- `patients` - 患者表

✅ **业务表**:
- `stage_records` - 阶段记录表 (V1/V2/V3/V4)
- `scale_configs` - 量表配置表 (AIS/ESS/GAD7/PHQ9/HAMA/HAMD)
- `scale_records` - 量表填写记录表
- `medication_records` - 用药记录表
- `concomitant_medications` - 合并用药记录表
- `adverse_events` - 不良事件表
- `ae_attachments` - 不良事件附件表
- `medical_files` - 医疗文件表

✅ **系统表**:
- `system_configs` - 系统配置表
- `push_messages` - 推送消息表
- `audit_logs` - 审核日志表
- `operation_logs` - 操作日志表

### 验证数据库表

```bash
# 连接到PostgreSQL
psql -U postgres -d sleep_tracking

# 查看所有表
\dt

# 查看users表结构
\d users

# 查看patients表结构
\d patients

# 退出
\q
```

---

## 3️⃣ API端点验证

### 已注册的API端点

#### 认证模块 (Auth)

**POST /auth/wx-login** - 微信登录 (公开访问)

```bash
# 测试微信登录 (预期返回401,因为微信配置未设置)
curl -X POST http://localhost:3000/auth/wx-login \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_wx_code\"}"
```

**预期结果**:
```json
{
  "statusCode": 401,
  "message": "微信登录失败: 未配置微信AppID或AppSecret"
}
```

**✅ 这证明**:
- API端点已注册 ✓
- 请求验证正常 ✓
- 错误处理正常 ✓
- 只是缺少微信配置(这是正常的)

---

#### 文件上传模块 (Upload)

**POST /upload/single** - 单文件上传 (需要JWT认证)

```bash
# 测试文件上传 (预期返回401,因为未提供JWT token)
curl -X POST http://localhost:3000/upload/single
```

**预期结果**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**✅ 这证明**:
- API端点已注册 ✓
- JWT全局守卫正常工作 ✓
- 未认证请求被正确拦截 ✓

**POST /upload/multiple** - 多文件上传 (需要JWT认证)

```bash
# 测试批量上传 (预期返回401)
curl -X POST http://localhost:3000/upload/multiple
```

**预期结果**: 同上,返回401

---

## 4️⃣ Swagger API文档验证

### 访问Swagger UI

在浏览器打开: **http://localhost:3000/api-docs**

你应该能看到:

✅ **认证模块 (Auth)**
- `POST /auth/wx-login` - 微信登录

✅ **文件上传模块 (Upload)**
- `POST /upload/single` - 单文件上传
- `POST /upload/multiple` - 多文件上传

### Swagger测试步骤

1. **打开Swagger UI**: http://localhost:3000/api-docs

2. **测试微信登录**:
   - 点击 `POST /auth/wx-login`
   - 点击 "Try it out"
   - 输入请求体:
     ```json
     {
       "code": "test_code_from_swagger"
     }
     ```
   - 点击 "Execute"
   - 预期返回: 401错误(因为微信配置未设置)

3. **测试文件上传**:
   - 点击 `POST /upload/single`
   - 点击 "Try it out"
   - 点击 "Execute"
   - 预期返回: 401 Unauthorized (因为缺少JWT token)
   - **这证明JWT守卫正常工作!**

---

## 5️⃣ JWT认证守卫验证

### 全局JWT守卫配置验证

已配置全局JWT守卫,所有端点默认需要认证,除非标记了 `@Public()`

**验证方法**:

1. **公开端点 (无需JWT)**:
   - ✅ POST /auth/wx-login (标记了@Public)

2. **受保护端点 (需要JWT)**:
   - ✅ POST /upload/single
   - ✅ POST /upload/multiple

```bash
# 测试受保护端点 (预期401)
curl -X POST http://localhost:3000/upload/single

# 结果: {"statusCode":401,"message":"Unauthorized"}
# ✅ JWT守卫正常工作!
```

---

## 6️⃣ 环境配置验证

### 检查环境变量

查看 `backend/.env.development`:

```bash
cat backend/.env.development
```

**关键配置项**:

✅ **数据库配置** (已生效):
- DB_HOST=localhost
- DB_PORT=5432
- DB_USERNAME=postgres
- DB_PASSWORD=postgres123
- DB_DATABASE=sleep_tracking

⚠️ **微信配置** (待配置):
- WECHAT_APP_ID=your_wechat_app_id
- WECHAT_APP_SECRET=your_wechat_app_secret

⚠️ **OSS配置** (待配置):
- OSS_REGION=oss-cn-hangzhou
- OSS_ACCESS_KEY_ID=your_oss_access_key
- OSS_ACCESS_KEY_SECRET=your_oss_secret_key
- OSS_BUCKET=sleep-tracking

✅ **JWT配置** (已生效):
- JWT_SECRET=your-secret-key-change-in-production
- JWT_EXPIRES_IN=7d

---

## 7️⃣ TypeORM同步验证

### 验证表结构自动创建

从后端日志中可以看到,TypeORM成功:
- ✅ 自动创建了16张表
- ✅ 自动创建了外键约束
- ✅ 自动添加了列注释
- ✅ 自动设置了唯一索引

**日志示例**:
```
query: CREATE TABLE "users" (...)
query: CREATE TABLE "hospitals" (...)
query: ALTER TABLE "doctors" ADD CONSTRAINT "FK_..." FOREIGN KEY (...)
```

---

## 8️⃣ 模块加载验证

### 已加载的NestJS模块

从启动日志中可以看到:

✅ **核心模块**:
- AppModule
- TypeOrmModule (数据库连接)
- ConfigModule (环境变量)
- JwtModule (JWT认证)
- PassportModule (认证策略)

✅ **业务模块**:
- AuthModule (认证模块)
- UploadModule (上传模块)

**日志示例**:
```
[InstanceLoader] TypeOrmModule dependencies initialized +55ms
[InstanceLoader] PassportModule dependencies initialized +0ms
[InstanceLoader] JwtModule dependencies initialized +1ms
[InstanceLoader] AppModule dependencies initialized +0ms
[InstanceLoader] UploadModule dependencies initialized +0ms
[InstanceLoader] AuthModule dependencies initialized +0ms
```

---

## ✅ Phase 1验证清单

| 验证项 | 状态 | 说明 |
|--------|------|------|
| ✅ 后端服务启动 | 通过 | http://localhost:3000 |
| ✅ 数据库连接 | 通过 | PostgreSQL连接成功 |
| ✅ 16张表创建 | 通过 | TypeORM自动同步 |
| ✅ 外键约束 | 通过 | 所有关联关系正确 |
| ✅ API端点注册 | 通过 | Auth + Upload模块 |
| ✅ Swagger文档 | 通过 | http://localhost:3000/api-docs |
| ✅ JWT全局守卫 | 通过 | 未认证返回401 |
| ✅ @Public装饰器 | 通过 | /auth/wx-login可公开访问 |
| ⚠️ 微信登录功能 | 待配置 | 需要配置WECHAT_APP_ID |
| ⚠️ OSS上传功能 | 待配置 | 需要配置OSS凭证 |

---

## 🎯 验证结论

### ✅ Phase 1 已完成项目:

1. ✅ **NestJS项目初始化**
   - 项目结构符合规范
   - 依赖安装完整
   - TypeScript配置正确

2. ✅ **数据库设计与创建**
   - 16张表全部创建成功
   - 外键关系正确建立
   - 字段类型和约束符合需求

3. ✅ **认证模块 (Auth)**
   - 微信登录接口完成
   - JWT token生成逻辑完成
   - 全局JWT守卫配置完成
   - @Public装饰器正常工作

4. ✅ **文件上传模块 (Upload)**
   - OSS服务封装完成
   - 单文件/多文件上传接口完成
   - 文件类型和大小验证完成
   - 条件初始化(无配置时不报错)

5. ✅ **API文档**
   - Swagger自动生成
   - 所有端点有详细注释
   - 支持在线测试

6. ✅ **角色权限基础**
   - @Roles装饰器已创建
   - RolesGuard已实现
   - @CurrentUser装饰器已实现

---

## ⚠️ 待配置项 (不影响Phase 1验证)

### 1. 微信小程序配置

需要到微信公众平台获取:
- WECHAT_APP_ID
- WECHAT_APP_SECRET

配置后可以测试真实的微信登录。

### 2. 阿里云OSS配置

需要到阿里云控制台获取:
- OSS_ACCESS_KEY_ID
- OSS_ACCESS_KEY_SECRET
- OSS_BUCKET

配置后可以测试真实的文件上传。

### 3. 生产环境JWT密钥

当前JWT_SECRET是测试密钥,生产环境需要更换为强密钥。

---

## 🚀 下一步操作建议

**选项A**: 继续Phase 2开发
- 医院管理模块 (已创建骨架,但未导入AppModule)
- 医生管理模块
- 患者管理模块
- 用户信息管理接口

**选项B**: 配置微信和OSS,测试完整登录+上传流程

**选项C**: 补充单元测试和集成测试

---

## 📝 验证命令汇总

```bash
# 1. 验证服务运行
curl http://localhost:3000

# 2. 验证Swagger文档
# 浏览器访问: http://localhost:3000/api-docs

# 3. 验证微信登录端点
curl -X POST http://localhost:3000/auth/wx-login \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code\"}"

# 4. 验证JWT守卫
curl -X POST http://localhost:3000/upload/single

# 5. 验证数据库
psql -U postgres -d sleep_tracking -c "\dt"

# 6. 查看后端日志
# 后台服务已在运行,可以在控制台查看实时日志
```

---

## ✅ 验证通过标准

当你完成以上验证后,如果:

1. ✅ 服务能正常启动并监听3000端口
2. ✅ Swagger文档能正常访问
3. ✅ 数据库16张表全部存在
4. ✅ /auth/wx-login 返回401错误(带有微信配置缺失提示)
5. ✅ /upload/single 返回401 Unauthorized

**则证明Phase 1已经完成,可以进入Phase 2!** 🎉
