# 数据库环境搭建指南

## 1. 安装PostgreSQL

### Windows
下载并安装 PostgreSQL 14+:
https://www.postgresql.org/download/windows/

### MacOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install postgresql-14
sudo systemctl start postgresql
```

## 2. 创建数据库

```bash
# 登录PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE sleep_tracking WITH ENCODING 'UTF8' LC_COLLATE='zh_CN.UTF-8' LC_CTYPE='zh_CN.UTF-8';

# 退出
\q
```

## 3. 配置环境变量

复制 `.env.example` 到 `.env.development`:
```bash
cp .env.example .env.development
```

修改数据库配置:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=sleep_tracking
```

## 4. 运行项目

```bash
# 安装依赖
npm install

# 启动开发服务器(TypeORM会自动同步表结构)
npm run start:dev
```

## 5. 验证数据库连接

启动后查看终端输出,应该看到:
```
[Nest] LOG [TypeOrmModule] Mapped {User, Hospital, Doctor, Patient, StageRecord} entities
Application is running on: http://localhost:3000
```

## 6. 查看数据表

```bash
psql -U postgres -d sleep_tracking

# 查看所有表
\dt

# 查看表结构
\d users
\d hospitals
\d doctors
\d patients
\d stage_records
```

## 注意事项

- **开发环境**: `synchronize: true` 会自动同步实体到数据库(仅限开发环境)
- **生产环境**: 必须使用migration迁移文件管理数据库变更
- **数据备份**: 定期备份数据库,建议每天凌晨3点自动备份
