<template>
  <div class="dashboard">
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="8" :md="4" :lg="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon patient">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">患者总数</div>
              <div class="stat-value">{{ statistics.totalPatients }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="8" :md="4" :lg="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon stage">
              <el-icon><Plus /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">本周新增</div>
              <div class="stat-value">{{ statistics.weeklyNewPatients }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="8" :md="4" :lg="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">待审核</div>
              <div class="stat-value">{{ statistics.pendingAudits }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="8" :md="4" :lg="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon overdue">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">逾期患者</div>
              <div class="stat-value">{{ statistics.overduePatients }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="8" :md="4" :lg="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">严重AE</div>
              <div class="stat-value">{{ statistics.seriousAE }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>患者阶段分布</span>
            </div>
          </template>
          <div ref="stageChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>周月数据对比</span>
            </div>
          </template>
          <div ref="comparisonChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>不良事件统计</span>
            </div>
          </template>
          <div ref="aeChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近7天活跃趋势</span>
            </div>
          </template>
          <div ref="activityTrendChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近动态</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.timestamp"
              placement="top"
            >
              <el-card>
                <p>{{ activity.content }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import { dashboardAPI } from '@/api/dashboard';
import { ElMessage } from 'element-plus';

const loading = ref(false);

const statistics = ref({
  totalPatients: 0,
  weeklyNewPatients: 0,
  pendingAudits: 0,
  overduePatients: 0,
  seriousAE: 0,
});

const stageChartRef = ref<HTMLDivElement>();
const comparisonChartRef = ref<HTMLDivElement>();
const aeChartRef = ref<HTMLDivElement>();
const activityTrendChartRef = ref<HTMLDivElement>();

let stageChart: echarts.ECharts | null = null;
let comparisonChart: echarts.ECharts | null = null;
let aeChart: echarts.ECharts | null = null;
let activityTrendChart: echarts.ECharts | null = null;

const recentActivities = ref<Array<{ content: string; timestamp: string }>>([]);

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      fetchStatistics(),
      fetchStageDistribution(),
      fetchWeeklyMonthlyComparison(),
      fetchAEStats(),
      fetchRecentActivities(),
      fetchDailyActivityTrend(),
    ]);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    loading.value = false;
  }
});

const fetchStatistics = async () => {
  try {
    const res = await dashboardAPI.getStatistics();
    if (res) {
      statistics.value = res as any;
    }
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
  }
};

const fetchStageDistribution = async () => {
  try {
    const res = await dashboardAPI.getStageDistribution();
    if (res) {
      initStageChart(res as any);
    }
  } catch (error) {
    console.error('Failed to fetch stage distribution:', error);
    initStageChart([]);
  }
};

const fetchWeeklyMonthlyComparison = async () => {
  try {
    const res = await dashboardAPI.getWeeklyMonthlyComparison();
    if (res) {
      initComparisonChart(res as any);
    }
  } catch (error) {
    console.error('Failed to fetch weekly monthly comparison:', error);
    initComparisonChart({ categories: [], series: [] });
  }
};

const fetchAEStats = async () => {
  try {
    const res = await dashboardAPI.getAdverseEventStats();
    if (res) {
      initAEChart(res as any);
    }
  } catch (error) {
    console.error('Failed to fetch AE stats:', error);
    initAEChart({ stages: ['V1', 'V2', 'V3', 'V4'], series: [] });
  }
};

const fetchRecentActivities = async () => {
  try {
    const res = await dashboardAPI.getRecentActivities(10);
    if (res) {
      recentActivities.value = res as any;
    }
  } catch (error) {
    console.error('Failed to fetch recent activities:', error);
  }
};

const fetchDailyActivityTrend = async () => {
  try {
    const res = await dashboardAPI.getDailyActivityTrend();
    if (res) {
      initActivityTrendChart(res as any);
    }
  } catch (error) {
    console.error('Failed to fetch daily activity trend:', error);
    initActivityTrendChart({ dates: [], patients: [], scales: [] });
  }
};

const initStageChart = (data: Array<{ value: number; name: string }>) => {
  if (!stageChartRef.value) return;

  stageChart = echarts.init(stageChartRef.value);
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '患者阶段',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: data.length > 0 ? data : [{ value: 0, name: '暂无数据' }],
      },
    ],
  };
  stageChart.setOption(option);
};

const initComparisonChart = (data: { categories: string[]; series: Array<{ name: string; data: number[] }> }) => {
  if (!comparisonChartRef.value) return;

  comparisonChart = echarts.init(comparisonChartRef.value);
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666'];
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: data.series.map((s) => s.name),
      top: 0,
      left: 'center',
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '15%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.categories,
    },
    yAxis: {
      type: 'value',
      name: '数量',
    },
    series: data.series.map((s, index) => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      itemStyle: {
        color: colors[index % colors.length],
      },
    })),
  };
  comparisonChart.setOption(option);
};

const initAEChart = (data: { stages: string[]; series: Array<{ name: string; data: number[] }> }) => {
  if (!aeChartRef.value) return;

  aeChart = echarts.init(aeChartRef.value);
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: data.series.map((s) => s.name),
    },
    xAxis: {
      type: 'category',
      data: data.stages,
    },
    yAxis: {
      type: 'value',
      name: '事件数',
    },
    series: data.series.map((s) => ({
      name: s.name,
      type: 'bar',
      stack: 'total',
      data: s.data,
    })),
  };
  aeChart.setOption(option);
};

const initActivityTrendChart = (data: { dates: string[]; patients: number[]; scales: number[] }) => {
  if (!activityTrendChartRef.value) return;

  activityTrendChart = echarts.init(activityTrendChartRef.value);
  const option = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['活跃患者', '量表填写'],
      top: 5,
      right: 20,
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '18%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.dates,
    },
    yAxis: {
      type: 'value',
      name: '数量',
    },
    series: [
      {
        name: '活跃患者',
        type: 'line',
        data: data.patients,
        smooth: true,
        itemStyle: { color: '#5470c6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
            { offset: 1, color: 'rgba(84, 112, 198, 0.05)' },
          ]),
        },
      },
      {
        name: '量表填写',
        type: 'line',
        data: data.scales,
        smooth: true,
        itemStyle: { color: '#91cc75' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(145, 204, 117, 0.3)' },
            { offset: 1, color: 'rgba(145, 204, 117, 0.05)' },
          ]),
        },
      },
    ],
  };
  activityTrendChart.setOption(option);
};
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-left: 4px solid #409eff;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-icon.patient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.stage {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.overdue {
  background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.charts {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
}

:deep(.el-timeline-item__content) {
  margin-left: 10px;
}
</style>
