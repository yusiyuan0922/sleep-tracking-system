# Database Migration Scripts

数据库迁移脚本目录，记录所有数据库结构变更。

## 迁移脚本规范

### 命名规范
- 格式：`YYYYMMDD-description.sql`
- 示例：`20251203-add-adverse-event-fields.sql`

### 文件内容要求
1. 包含迁移日期和描述注释
2. 使用 `IF NOT EXISTS` 等幂等操作，确保脚本可重复执行
3. 包含回滚说明（如适用）
4. 为现有数据提供数据迁移逻辑
5. 包含验证查询

## 现有迁移脚本

### 20251203-add-adverse-event-fields.sql
**日期**: 2025-12-03
**描述**: 为 adverse_events 表添加 AE序号 和 是否持续 字段

**变更内容**:
- 添加 `ae_number` 字段（VARCHAR(50)，唯一，非空）
  - 格式：`AE-{患者ID}-{序号}`
  - 为现有记录自动生成序号
- 添加 `is_ongoing` 字段（BOOLEAN，非空，默认false）
  - 表示不良事件是否持续中

**当前状态**:
- ✅ 开发环境已通过 TypeORM synchronize 自动应用
- ⚠️ 生产环境需要手动执行此迁移脚本

**使用方法**:

Docker 环境：
```bash
# 复制脚本到容器
docker cp backend/src/database/migrations/20251203-add-adverse-event-fields.sql sleep-postgres:/tmp/

# 执行迁移
docker exec sleep-postgres psql -U postgres -d sleep_tracking -f /tmp/20251203-add-adverse-event-fields.sql
```

本地 PostgreSQL：
```bash
psql -U postgres -d sleep_tracking -f backend/src/database/migrations/20251203-add-adverse-event-fields.sql
```

**影响范围**:
- 表：`adverse_events`
- 现有数据：自动生成 AE序号
- 应用：后端 API 已同步更新
- 前端：小程序已同步更新

**验证方法**:
```sql
-- 检查字段是否添加成功
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'adverse_events'
  AND column_name IN ('ae_number', 'is_ongoing');

-- 检查现有数据的 ae_number 是否生成
SELECT id, patient_id, ae_number, is_ongoing
FROM adverse_events
ORDER BY patient_id, id;
```

## 迁移执行流程

### 开发环境
TypeORM 的 `synchronize: true` 会自动同步实体变更到数据库。迁移脚本作为记录和生产环境使用。

### 生产环境
1. **备份数据库**
   ```bash
   docker exec sleep-postgres pg_dump -U postgres sleep_tracking > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **测试迁移脚本**（在测试环境）
   ```bash
   docker exec sleep-postgres psql -U postgres -d sleep_tracking_test -f /tmp/migration.sql
   ```

3. **执行迁移**
   ```bash
   docker cp backend/src/database/migrations/YYYYMMDD-description.sql sleep-postgres:/tmp/
   docker exec sleep-postgres psql -U postgres -d sleep_tracking -f /tmp/YYYYMMDD-description.sql
   ```

4. **验证结果**
   - 检查字段是否正确添加
   - 检查约束是否生效
   - 检查现有数据是否正确迁移
   - 测试应用功能

5. **部署应用代码**
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```

## 注意事项

1. **迁移顺序**: 按文件名日期顺序执行
2. **幂等性**: 所有迁移脚本应可重复执行
3. **数据安全**: 生产环境迁移前务必备份
4. **测试**: 在测试环境充分测试后再应用到生产环境
5. **回滚计划**: 重要迁移应准备回滚脚本
6. **文档**: 每次迁移后更新此 README

## 回滚脚本

如需回滚某个迁移，创建对应的回滚脚本：
- 命名：`YYYYMMDD-rollback-description.sql`
- 示例：`20251203-rollback-add-adverse-event-fields.sql`

### 回滚 20251203-add-adverse-event-fields.sql

```sql
-- 回滚：移除 adverse_events 表的新字段
-- 警告：这将删除 ae_number 和 is_ongoing 字段的所有数据

-- 1. 删除 ae_number 唯一约束
ALTER TABLE adverse_events
DROP CONSTRAINT IF EXISTS UQ_adverse_events_ae_number;

-- 2. 删除 ae_number 字段
ALTER TABLE adverse_events
DROP COLUMN IF EXISTS ae_number;

-- 3. 删除 is_ongoing 字段
ALTER TABLE adverse_events
DROP COLUMN IF EXISTS is_ongoing;

-- 验证回滚
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'adverse_events'
  AND column_name IN ('ae_number', 'is_ongoing');
-- 应返回空结果
```
