# 快速验证脚本

## 验证步骤

### 1. 检查构建是否成功 ✅
```bash
cd backend
npm run build
```
**状态:** ✅ 已通过

### 2. 启动开发服务器

**方式一:直接启动(需要先配置数据库)**
```bash
cd backend
npm run start:dev
```

**方式二:使用默认配置快速测试(不连接真实数据库)**
如果暂时没有PostgreSQL,可以注释掉TypeORM配置先测试其他功能。

### 3. 验证项目是否可以正常运行

打开新的命令行窗口,运行:

```bash
# 测试服务是否启动
curl http://localhost:3000

# 或在浏览器访问
# http://localhost:3000
```

### 4. 访问Swagger API文档

在浏览器打开: **http://localhost:3000/api-docs**

你应该能看到:
- 认证模块: POST /auth/wx-login
- 文件上传模块: POST /upload/single, POST /upload/multiple

### 5. 测试API端点

**测试公开API(不需要认证):**
```bash
curl -X POST http://localhost:3000/auth/wx-login \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"test_code\"}"
```

预期返回401错误(因为缺少微信配置),但这证明API可以访问。

**测试受保护API(需要JWT):**
```bash
curl -X POST http://localhost:3000/upload/single
```

预期返回401 Unauthorized - 说明JWT守卫正常工作!

## 常见问题

### 问题1: 启动时报错 "database does not exist"

**原因:** 数据库未创建

**解决方案:**
```bash
# 创建数据库
psql -U postgres -c "CREATE DATABASE sleep_tracking;"
```

### 问题2: 启动时报错 "password authentication failed"

**原因:** 数据库密码配置错误

**解决方案:**
编辑 `backend/.env.development`,修改:
```env
DB_PASSWORD=你的真实PostgreSQL密码
```

### 问题3: PostgreSQL未安装

**临时解决方案:**
1. 先注释掉 `app.module.ts` 中的 TypeOrmModule 配置
2. 测试其他功能(JWT、Swagger等)
3. 后续再安装PostgreSQL

### 问题4: 端口3000被占用

**解决方案:**
编辑 `.env.development`:
```env
PORT=3001
```

## 验证清单

- [x] 项目构建成功 (npm run build)
- [ ] 启动开发服务器成功
- [ ] 访问 http://localhost:3000 有响应
- [ ] Swagger文档可访问
- [ ] API端点可以调用(即使返回错误也OK)
- [ ] JWT守卫正常工作(未认证返回401)

## 下一步

如果以上验证都通过,说明基础架构已经搭建完成!

你可以:
1. 配置真实的PostgreSQL数据库
2. 配置微信小程序凭证
3. 测试完整的登录流程
4. 开始Phase 2开发
