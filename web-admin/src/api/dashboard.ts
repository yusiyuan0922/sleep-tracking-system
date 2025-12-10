import request from '@/utils/request';

export interface Statistics {
  totalPatients: number;
  weeklyNewPatients: number;
  pendingAudits: number;
  overduePatients: number;
  seriousAE: number;
}

export interface StageDistribution {
  value: number;
  name: string;
}

export interface ComparisonSeries {
  name: string;
  data: number[];
}

export interface WeeklyMonthlyComparisonData {
  categories: string[];
  series: ComparisonSeries[];
}

export interface AEStatsSeries {
  name: string;
  data: number[];
}

export interface AEStatsData {
  stages: string[];
  series: AEStatsSeries[];
}

export interface Activity {
  content: string;
  timestamp: string;
}

export interface DailyActivityTrendData {
  dates: string[];
  patients: number[];
  scales: number[];
}

export const dashboardAPI = {
  // 获取统计数据
  getStatistics() {
    return request.get<Statistics>('/dashboard/statistics');
  },

  // 获取患者阶段分布
  getStageDistribution() {
    return request.get<StageDistribution[]>('/dashboard/stage-distribution');
  },

  // 获取周月数据对比
  getWeeklyMonthlyComparison() {
    return request.get<WeeklyMonthlyComparisonData>('/dashboard/weekly-monthly-comparison');
  },

  // 获取不良事件统计
  getAdverseEventStats() {
    return request.get<AEStatsData>('/dashboard/adverse-event-stats');
  },

  // 获取最近动态
  getRecentActivities(limit?: number) {
    return request.get<Activity[]>('/dashboard/recent-activities', {
      params: { limit },
    });
  },

  // 获取最近7天活跃趋势
  getDailyActivityTrend() {
    return request.get<DailyActivityTrendData>('/dashboard/daily-activity-trend');
  },
};
