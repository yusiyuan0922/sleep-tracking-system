# Backend - Nest.js 后端服务

## 技术栈

- Node.js + Nest.js
- PostgreSQL 14+
- TypeORM
- JWT认证
- Swagger API文档

## 开发环境配置

1. 复制环境变量配置文件:
```bash
cp .env.example .env.development
```

2. 修改 `.env.development` 中的数据库配置

3. 安装依赖:
```bash
npm install
```

## 启动项目

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

## API文档

启动项目后访问: http://localhost:3000/api-docs

## 目录结构

```
src/
├── common/           # 通用模块
│   ├── guards/       # 守卫
│   ├── interceptors/ # 拦截器
│   └── decorators/   # 装饰器
├── config/           # 配置
├── database/         # 数据库
│   ├── entities/     # 实体类
│   ├── migrations/   # 迁移文件
│   └── seeds/        # 种子数据
├── modules/          # 业务模块
├── app.module.ts     # 根模块
└── main.ts           # 入口文件
```
