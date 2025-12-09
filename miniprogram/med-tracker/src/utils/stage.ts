/**
 * 阶段相关工具函数
 */

// 阶段中文名称映射
export const STAGE_NAME_MAP: Record<string, string> = {
  V1: 'V1',
  V2: 'V2',
  V3: 'V3',
  V4: 'V4',
  completed: '已完成',
};

/**
 * 获取阶段的显示名称
 * @param stage 阶段值 (V1/V2/V3/V4/completed)
 * @returns 显示名称
 */
export function getStageDisplayName(stage: string | undefined | null): string {
  if (!stage) return '';
  return STAGE_NAME_MAP[stage] || stage;
}
