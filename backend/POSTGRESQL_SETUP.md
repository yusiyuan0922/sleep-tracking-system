# PostgreSQL 安装和配置指南 (Windows)

## 方法一: 使用PostgreSQL官方安装包 (推荐)

### 步骤1: 下载PostgreSQL

访问官方网站下载: https://www.postgresql.org/download/windows/

**推荐版本:** PostgreSQL 14 或 15

点击 "Download the installer" 会跳转到 EnterpriseDB 下载页面。

**直接下载链接:**
- PostgreSQL 15: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

选择适合你系统的版本:
- Windows x86-64 (64位系统)
- Windows x86-32 (32位系统)

### 步骤2: 运行安装程序

1. **双击下载的安装包** (例如: postgresql-15.x-windows-x64.exe)

2. **点击 "Next"**

3. **选择安装目录** (默认即可)
   - 默认路径: `C:\Program Files\PostgreSQL\15`

4. **选择要安装的组件** (全部勾选)
   - ✅ PostgreSQL Server (数据库服务器)
   - ✅ pgAdmin 4 (图形化管理工具)
   - ✅ Stack Builder (可选,用于安装额外工具)
   - ✅ Command Line Tools (命令行工具)

5. **选择数据目录** (默认即可)
   - 默认路径: `C:\Program Files\PostgreSQL\15\data`

6. **设置超级用户密码** ⚠️ **重要!**
   - 用户名固定为: `postgres`
   - 输入你的密码,例如: `postgres123` (请记住这个密码!)
   - 确认密码

7. **选择端口号** (默认 5432,直接点Next)

8. **选择区域设置** (默认即可,或选择 "Chinese (Simplified), China")

9. **点击 "Next" 开始安装**

10. **等待安装完成** (大约2-5分钟)

11. **取消勾选 "Stack Builder"** (暂时不需要),点击 "Finish"

### 步骤3: 验证安装

打开命令提示符(CMD):

```bash
# 检查PostgreSQL版本
psql --version

# 应该显示类似: psql (PostgreSQL) 15.x
```

如果提示 "psql 不是内部或外部命令",需要添加环境变量:

**添加到PATH:**
1. 右键 "此电脑" → "属性"
2. 点击 "高级系统设置"
3. 点击 "环境变量"
4. 在 "系统变量" 中找到 "Path",双击编辑
5. 点击 "新建",添加: `C:\Program Files\PostgreSQL\15\bin`
6. 点击 "确定" 保存
7. 重新打开CMD

### 步骤4: 连接到PostgreSQL

```bash
# 连接到PostgreSQL (会提示输入密码)
psql -U postgres

# 输入你安装时设置的密码
```

如果成功,会看到:
```
psql (15.x)
Type "help" for help.

postgres=#
```

### 步骤5: 创建项目数据库

在 `postgres=#` 提示符下执行:

```sql
-- 创建数据库
CREATE DATABASE sleep_tracking;

-- 验证数据库创建成功
\l

-- 连接到新数据库
\c sleep_tracking

-- 退出
\q
```

### 步骤6: 配置后端环境变量

编辑 `backend/.env.development` 文件:

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=你刚才设置的密码 (例如: postgres123)
DB_DATABASE=sleep_tracking
```

## 方法二: 使用 Docker (适合有Docker经验的用户)

### 步骤1: 确保Docker已安装

下载Docker Desktop: https://www.docker.com/products/docker-desktop/

### 步骤2: 运行PostgreSQL容器

```bash
docker run --name postgres-sleep \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=sleep_tracking \
  -p 5432:5432 \
  -d postgres:15
```

### 步骤3: 验证容器运行

```bash
docker ps

# 连接到数据库
docker exec -it postgres-sleep psql -U postgres -d sleep_tracking
```

### 步骤4: 配置环境变量

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=sleep_tracking
```

## 方法三: 使用 pgAdmin (图形化界面)

如果你安装了PostgreSQL官方包,会自带pgAdmin 4。

### 启动pgAdmin 4

1. 在开始菜单搜索 "pgAdmin 4"
2. 首次启动需要设置主密码
3. 左侧 "Servers" → 右键 → "Create" → "Server"

**配置连接:**
- Name: Local PostgreSQL
- Host: localhost
- Port: 5432
- Username: postgres
- Password: (你安装时设置的密码)

### 创建数据库

1. 右键 "Databases" → "Create" → "Database"
2. Database name: `sleep_tracking`
3. Owner: postgres
4. 点击 "Save"

## 验证PostgreSQL配置

创建一个测试脚本: `backend/test-db.js`

```javascript
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '你的密码',
  database: 'sleep_tracking',
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ 数据库连接成功!');

    const res = await client.query('SELECT NOW()');
    console.log('当前时间:', res.rows[0].now);

    await client.end();
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
  }
}

testConnection();
```

运行测试:
```bash
cd backend
node test-db.js
```

## 常见问题

### 1. 端口5432被占用

**查看占用进程:**
```bash
netstat -ano | findstr :5432
```

**解决方案:**
- 停止占用端口的程序
- 或修改PostgreSQL端口 (修改 `postgresql.conf`)

### 2. 密码忘记了

**重置postgres密码:**

1. 找到 `pg_hba.conf` 文件 (通常在 `C:\Program Files\PostgreSQL\15\data\`)
2. 找到这一行:
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   ```
3. 改为:
   ```
   host    all             all             127.0.0.1/32            trust
   ```
4. 重启PostgreSQL服务
5. 连接并修改密码:
   ```sql
   psql -U postgres
   ALTER USER postgres WITH PASSWORD '新密码';
   ```
6. 改回 `pg_hba.conf` 为 `scram-sha-256`
7. 再次重启服务

### 3. 服务未启动

**Windows服务管理器:**
1. 按 `Win + R`,输入 `services.msc`
2. 找到 `postgresql-x64-15` 服务
3. 右键 → "启动"
4. 右键 → "属性" → 启动类型设置为 "自动"

**或使用命令行:**
```bash
# 启动服务
net start postgresql-x64-15

# 停止服务
net stop postgresql-x64-15
```

### 4. 找不到psql命令

确保已添加到PATH: `C:\Program Files\PostgreSQL\15\bin`

## 下一步

配置完成后:

1. ✅ PostgreSQL已安装并运行
2. ✅ 数据库 `sleep_tracking` 已创建
3. ✅ `.env.development` 已配置
4. ✅ 可以启动后端项目了!

运行:
```bash
cd backend
npm run start:dev
```

访问: http://localhost:3000/api-docs
