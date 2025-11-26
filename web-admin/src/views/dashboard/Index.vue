<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
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

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon stage">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">V1阶段患者</div>
              <div class="stat-value">{{ statistics.v1Patients }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
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

      <el-col :span="6">
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
              <span>量表得分趋势</span>
            </div>
          </template>
          <div ref="scaleChartRef" style="height: 300px"></div>
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

const statistics = ref({
  totalPatients: 156,
  v1Patients: 45,
  pendingAudits: 12,
  seriousAE: 3,
});

const stageChartRef = ref<HTMLDivElement>();
const scaleChartRef = ref<HTMLDivElement>();
const aeChartRef = ref<HTMLDivElement>();

const recentActivities = ref([
  {
    content: '患者张三完成了V1阶段审核',
    timestamp: '2025-11-26 10:30',
  },
  {
    content: '医生李四提交了新的患者注册',
    timestamp: '2025-11-26 09:15',
  },
  {
    content: '患者王五填写了AIS量表',
    timestamp: '2025-11-26 08:45',
  },
  {
    content: '检测到1例中度不良事件',
    timestamp: '2025-11-25 16:20',
  },
  {
    content: '患者赵六完成了V2阶段',
    timestamp: '2025-11-25 14:10',
  },
]);

onMounted(() => {
  initStageChart();
  initScaleChart();
  initAEChart();
});

const initStageChart = () => {
  if (!stageChartRef.value) return;

  const chart = echarts.init(stageChartRef.value);
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
        data: [
          { value: 45, name: 'V1阶段' },
          { value: 38, name: 'V2阶段' },
          { value: 32, name: 'V3阶段' },
          { value: 25, name: 'V4阶段' },
          { value: 16, name: '已完成' },
        ],
      },
    ],
  };
  chart.setOption(option);
};

const initScaleChart = () => {
  if (!scaleChartRef.value) return;

  const chart = echarts.init(scaleChartRef.value);
  const option = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['AIS', 'ESS', 'GAD-7', 'PHQ-9'],
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['V1', 'V2', 'V3', 'V4'],
    },
    yAxis: {
      type: 'value',
      name: '平均分',
    },
    series: [
      {
        name: 'AIS',
        type: 'line',
        data: [18, 15, 12, 9],
        smooth: true,
      },
      {
        name: 'ESS',
        type: 'line',
        data: [14, 12, 10, 8],
        smooth: true,
      },
      {
        name: 'GAD-7',
        type: 'line',
        data: [12, 10, 8, 6],
        smooth: true,
      },
      {
        name: 'PHQ-9',
        type: 'line',
        data: [15, 12, 9, 7],
        smooth: true,
      },
    ],
  };
  chart.setOption(option);
};

const initAEChart = () => {
  if (!aeChartRef.value) return;

  const chart = echarts.init(aeChartRef.value);
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['轻度', '中度', '重度'],
    },
    xAxis: {
      type: 'category',
      data: ['V1', 'V2', 'V3', 'V4'],
    },
    yAxis: {
      type: 'value',
      name: '事件数',
    },
    series: [
      {
        name: '轻度',
        type: 'bar',
        stack: 'total',
        data: [12, 10, 8, 6],
      },
      {
        name: '中度',
        type: 'bar',
        stack: 'total',
        data: [5, 4, 3, 2],
      },
      {
        name: '重度',
        type: 'bar',
        stack: 'total',
        data: [1, 1, 0, 1],
      },
    ],
  };
  chart.setOption(option);
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
