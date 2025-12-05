-- 数据库迁移脚本：为 adverse_events 表添加新字段
-- 日期: 2025-12-03
-- 描述: 添加 AE序号(ae_number) 和 是否持续(is_ongoing) 字段

-- 1. 添加 ae_number 字段（AE序号）
ALTER TABLE adverse_events
ADD COLUMN IF NOT EXISTS ae_number VARCHAR(50);

-- 2. 为 ae_number 添加唯一约束
ALTER TABLE adverse_events
ADD CONSTRAINT UQ_adverse_events_ae_number UNIQUE (ae_number);

-- 3. 为现有数据生成 ae_number（如果存在数据）
-- 格式: AE-{patient_id}-{序号}
WITH numbered_events AS (
  SELECT
    id,
    patient_id,
    ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY id) as seq
  FROM adverse_events
  WHERE ae_number IS NULL
)
UPDATE adverse_events ae
SET ae_number = CONCAT('AE-', ne.patient_id, '-', LPAD(ne.seq::text, 3, '0'))
FROM numbered_events ne
WHERE ae.id = ne.id;

-- 4. 将 ae_number 设置为 NOT NULL（在填充数据后）
ALTER TABLE adverse_events
ALTER COLUMN ae_number SET NOT NULL;

-- 5. 添加 is_ongoing 字段（是否持续中）
ALTER TABLE adverse_events
ADD COLUMN IF NOT EXISTS is_ongoing BOOLEAN NOT NULL DEFAULT false;

-- 6. 添加字段注释
COMMENT ON COLUMN adverse_events.ae_number IS 'AE序号，格式：AE-{患者ID}-{序号}';
COMMENT ON COLUMN adverse_events.is_ongoing IS '是否持续中：true=持续中，false=已结束';

-- 验证修改
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'adverse_events'
  AND column_name IN ('ae_number', 'is_ongoing')
ORDER BY ordinal_position;
