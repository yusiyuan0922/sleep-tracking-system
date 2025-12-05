# Database Seed Scripts

## 量表配置初始化脚本

### init-scales.sql

此脚本用于初始化系统中的 6 个临床量表配置，包含完整的题目、选项和评分规则。

#### 包含的量表

1. **AIS (雅典失眠量表)** - 患者自评
   - 8 道题目，每题 0-3 分，总分 24 分
   - 评估失眠严重程度

2. **ESS (Epworth嗜睡量表)** - 患者自评
   - 8 道题目，每题 0-3 分，总分 24 分
   - 评估日间嗜睡程度

3. **GAD7 (广泛性焦虑障碍量表)** - 患者自评
   - 7 道题目，每题 0-3 分，总分 21 分
   - 筛查广泛性焦虑障碍

4. **PHQ9 (抑郁症筛查量表)** - 患者自评
   - 9 道题目，每题 0-3 分，总分 27 分
   - 筛查抑郁症状

5. **HAMA (汉密尔顿焦虑量表)** - 医生评定
   - 14 道题目，每题 0-4 分，总分 56 分
   - 评定焦虑症状严重程度

6. **HAMD (汉密尔顿抑郁量表)** - 医生评定
   - 17 道题目，总分 54 分
   - 评定抑郁症状严重程度

#### 使用方法

**在 Docker 环境中运行：**

```bash
# 方法 1: 直接从本地文件执行
docker cp backend/src/database/seeds/init-scales.sql sleep-postgres:/tmp/
docker exec sleep-postgres psql -U postgres -d sleep_tracking -f /tmp/init-scales.sql

# 方法 2: 使用标准输入
cat backend/src/database/seeds/init-scales.sql | docker exec -i sleep-postgres psql -U postgres -d sleep_tracking
```

**在本地 PostgreSQL 中运行：**

```bash
psql -U postgres -d sleep_tracking -f backend/src/database/seeds/init-scales.sql
```

#### 注意事项

- 脚本会先删除已存在的同名量表配置，然后插入新数据
- 建议在数据库初始化时运行一次
- 如果需要更新量表配置，可以修改此文件后重新运行
- 生产环境部署前请确保已运行此脚本

#### 数据结构

每个量表配置包含以下字段：
- `code`: 量表代码（唯一标识）
- `name`: 量表名称
- `type`: 量表类型（self: 患者自评, doctor: 医生评定）
- `total_items`: 题目总数
- `max_score`: 最高分数
- `questions`: 题目数组（JSONB 格式）
  - `question`: 题目文本
  - `options`: 选项数组
    - `label`: 选项文本
    - `value`: 选项分值
- `scoring_rules`: 评分规则（JSONB 格式）
  - `ranges`: 分数区间数组
    - `min`: 最低分
    - `max`: 最高分
    - `level`: 严重程度级别
    - `description`: 描述
- `stages`: 适用的访视阶段数组 (V1, V2, V3, V4)
- `status`: 状态（active: 启用, inactive: 禁用）
