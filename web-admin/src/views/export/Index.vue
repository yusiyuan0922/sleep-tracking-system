<template>
  <div class="export-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据导出</span>
          <el-tag type="warning" size="small">仅超级管理员可用</el-tag>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="card">
        <!-- Tab1: 医院维度 -->
        <el-tab-pane label="医院维度" name="hospital">
          <div class="tab-content">
            <el-form :inline="true" :model="hospitalForm" class="filter-form">
              <el-form-item label="医院">
                <el-select
                  v-model="hospitalForm.hospitalId"
                  placeholder="全部医院"
                  clearable
                  style="width: 250px"
                >
                  <el-option
                    v-for="h in hospitals"
                    :key="h.id"
                    :label="h.name"
                    :value="h.id"
                  />
                </el-select>
              </el-form-item>
            </el-form>

            <div class="export-buttons">
              <el-button
                type="primary"
                :loading="loading.hospitalSummary"
                @click="handleExportHospitalSummary"
              >
                <el-icon><Download /></el-icon>
                导出医院患者汇总
              </el-button>
            </div>

            <el-alert
              type="info"
              :closable="false"
              style="margin-top: 20px"
            >
              <template #title>
                导出内容说明
              </template>
              <ul class="export-desc">
                <li>医院患者汇总：包含各医院的患者总数、阶段分布、不良事件统计</li>
              </ul>
            </el-alert>
          </div>
        </el-tab-pane>

        <!-- Tab2: 医生维度 -->
        <el-tab-pane label="医生维度" name="doctor">
          <div class="tab-content">
            <el-form :inline="true" :model="doctorForm" class="filter-form">
              <el-form-item label="医院">
                <el-select
                  v-model="doctorForm.hospitalId"
                  placeholder="全部医院"
                  clearable
                  style="width: 200px"
                  @change="onDoctorHospitalChange"
                >
                  <el-option
                    v-for="h in hospitals"
                    :key="h.id"
                    :label="h.name"
                    :value="h.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="医生">
                <el-select
                  v-model="doctorForm.doctorId"
                  placeholder="全部医生"
                  clearable
                  style="width: 150px"
                >
                  <el-option
                    v-for="d in filteredDoctors"
                    :key="d.id"
                    :label="d.user?.name || d.name"
                    :value="d.id"
                  />
                </el-select>
              </el-form-item>
            </el-form>

            <div class="export-buttons">
              <el-button
                type="primary"
                :loading="loading.doctorSummary"
                @click="handleExportDoctorSummary"
              >
                <el-icon><Download /></el-icon>
                导出医生工作量统计
              </el-button>
            </div>

            <el-alert
              type="info"
              :closable="false"
              style="margin-top: 20px"
            >
              <template #title>
                导出内容说明
              </template>
              <ul class="export-desc">
                <li>医生工作量统计：包含医生负责患者数、量表填写数、审核数</li>
              </ul>
            </el-alert>
          </div>
        </el-tab-pane>

        <!-- Tab3: 患者维度 -->
        <el-tab-pane label="患者维度" name="patient">
          <div class="tab-content">
            <el-form :model="patientForm" label-width="80px" class="filter-form">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-form-item label="医院">
                    <el-select
                      v-model="patientForm.hospitalId"
                      placeholder="全部"
                      clearable
                      style="width: 100%"
                      @change="onPatientHospitalChange"
                    >
                      <el-option
                        v-for="h in hospitals"
                        :key="h.id"
                        :label="h.name"
                        :value="h.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="医生">
                    <el-select
                      v-model="patientForm.doctorId"
                      placeholder="全部"
                      clearable
                      style="width: 100%"
                    >
                      <el-option
                        v-for="d in patientDoctors"
                        :key="d.id"
                        :label="d.user?.name || d.name"
                        :value="d.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="阶段">
                    <el-select
                      v-model="patientForm.stage"
                      placeholder="全部"
                      clearable
                      style="width: 100%"
                    >
                      <el-option label="V1" value="V1" />
                      <el-option label="V2" value="V2" />
                      <el-option label="V3" value="V3" />
                      <el-option label="V4" value="V4" />
                      <el-option label="已完成" value="completed" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="状态">
                    <el-select
                      v-model="patientForm.status"
                      placeholder="全部"
                      clearable
                      style="width: 100%"
                    >
                      <el-option label="活跃" value="active" />
                      <el-option label="已完成" value="completed" />
                      <el-option label="退出" value="withdrawn" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="6">
                  <el-form-item label="开始日期">
                    <el-date-picker
                      v-model="patientForm.startDate"
                      type="date"
                      placeholder="选择日期"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="结束日期">
                    <el-date-picker
                      v-model="patientForm.endDate"
                      type="date"
                      placeholder="选择日期"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="量表类型">
                    <el-select
                      v-model="patientForm.scaleCode"
                      placeholder="全部"
                      clearable
                      style="width: 100%"
                    >
                      <el-option label="AIS (雅典失眠)" value="AIS" />
                      <el-option label="ESS (嗜睡)" value="ESS" />
                      <el-option label="GAD7 (焦虑)" value="GAD7" />
                      <el-option label="PHQ9 (抑郁)" value="PHQ9" />
                      <el-option label="HAMA (汉密尔顿焦虑)" value="HAMA" />
                      <el-option label="HAMD (汉密尔顿抑郁)" value="HAMD" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label=" ">
                    <el-button @click="resetPatientForm">重置筛选</el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>

            <div class="export-buttons">
              <el-button
                type="primary"
                :loading="loading.patients"
                @click="handleExportPatients"
              >
                <el-icon><Download /></el-icon>
                导出患者列表
              </el-button>
              <el-button
                type="success"
                :loading="loading.scaleRecords"
                @click="handleExportScaleRecords"
              >
                <el-icon><Download /></el-icon>
                导出量表记录
              </el-button>
              <el-button
                type="warning"
                :loading="loading.medicationRecords"
                @click="handleExportMedicationRecords"
              >
                <el-icon><Download /></el-icon>
                导出用药记录
              </el-button>
              <el-button
                type="danger"
                :loading="loading.adverseEvents"
                @click="handleExportAdverseEvents"
              >
                <el-icon><Download /></el-icon>
                导出不良事件
              </el-button>
            </div>

            <!-- 患者列表（用于选择单个患者导出） -->
            <el-divider content-position="left">选择患者导出完整档案</el-divider>

            <el-table
              :data="patientList"
              v-loading="patientLoading"
              border
              max-height="350"
              style="width: 100%"
            >
              <el-table-column prop="patientNo" label="患者编号" width="130" />
              <el-table-column label="姓名" width="100">
                <template #default="{ row }">
                  {{ row.user?.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="医院" min-width="180">
                <template #default="{ row }">
                  {{ row.hospital?.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="主治医生" width="100">
                <template #default="{ row }">
                  {{ row.doctor?.user?.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="当前阶段" width="90">
                <template #default="{ row }">
                  <el-tag :type="getStageTagType(row.currentStage)" size="small">
                    {{ formatStage(row.currentStage) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="80">
                <template #default="{ row }">
                  {{ formatStatus(row.status) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    size="small"
                    :loading="loading.patientProfile === row.id"
                    @click="handleExportPatientProfile(row.id)"
                  >
                    导出档案
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @size-change="fetchPatients"
              @current-change="fetchPatients"
              style="margin-top: 15px; justify-content: flex-end"
            />
          </div>
        </el-tab-pane>

        <!-- Tab4: 统计报表 -->
        <el-tab-pane label="统计报表" name="stats">
          <div class="tab-content">
            <div class="export-buttons">
              <el-button
                type="primary"
                size="large"
                :loading="loading.dashboardStats"
                @click="handleExportDashboardStats"
              >
                <el-icon><Download /></el-icon>
                导出 Dashboard 统计数据
              </el-button>
            </div>

            <el-alert
              type="info"
              :closable="false"
              style="margin-top: 20px"
            >
              <template #title>
                导出内容说明
              </template>
              <ul class="export-desc">
                <li>总体统计：患者总数、各状态患者数、不良事件统计、量表记录统计</li>
                <li>阶段分布：各阶段患者数量及占比</li>
                <li>医院统计：各医院患者数和医生数</li>
                <li>量表统计：各量表填写次数和平均分</li>
              </ul>
            </el-alert>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import { exportAPI, downloadFile, generateFilename } from '@/api/export';
import { hospitalAPI } from '@/api/hospital';
import { doctorAPI } from '@/api/doctor';
import { patientAPI } from '@/api/patient';

// Tab 状态
const activeTab = ref('hospital');

// 加载状态
const loading = reactive({
  hospitalSummary: false,
  doctorSummary: false,
  patients: false,
  patientProfile: null as number | null,
  scaleRecords: false,
  medicationRecords: false,
  adverseEvents: false,
  dashboardStats: false,
});

// 基础数据
const hospitals = ref<any[]>([]);
const doctors = ref<any[]>([]);

// 医院维度表单
const hospitalForm = reactive({
  hospitalId: null as number | null,
});

// 医生维度表单
const doctorForm = reactive({
  hospitalId: null as number | null,
  doctorId: null as number | null,
});

// 患者维度表单
const patientForm = reactive({
  hospitalId: null as number | null,
  doctorId: null as number | null,
  stage: '',
  status: '',
  startDate: '',
  endDate: '',
  scaleCode: '',
});

// 患者列表数据
const patientList = ref<any[]>([]);
const patientLoading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 医生筛选
const filteredDoctors = computed(() => {
  if (!doctorForm.hospitalId) {
    return doctors.value;
  }
  return doctors.value.filter((d) => d.hospitalId === doctorForm.hospitalId);
});

const patientDoctors = computed(() => {
  if (!patientForm.hospitalId) {
    return doctors.value;
  }
  return doctors.value.filter((d) => d.hospitalId === patientForm.hospitalId);
});

// 初始化
onMounted(async () => {
  await Promise.all([fetchHospitals(), fetchDoctors()]);
  fetchPatients();
});

// 获取医院列表
const fetchHospitals = async () => {
  try {
    const res = await hospitalAPI.getList({ pageSize: 100 });
    hospitals.value = res.list || [];
  } catch (error: any) {
    console.error('获取医院列表失败:', error);
  }
};

// 获取医生列表
const fetchDoctors = async () => {
  try {
    const res = await doctorAPI.getList({ pageSize: 500, auditStatus: 'approved' });
    doctors.value = res.list || [];
  } catch (error: any) {
    console.error('获取医生列表失败:', error);
  }
};

// 获取患者列表
const fetchPatients = async () => {
  patientLoading.value = true;
  try {
    const res = await patientAPI.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      hospitalId: patientForm.hospitalId || undefined,
      doctorId: patientForm.doctorId || undefined,
      currentStage: patientForm.stage || undefined,
      status: patientForm.status || undefined,
    });
    patientList.value = res.list || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    console.error('获取患者列表失败:', error);
  } finally {
    patientLoading.value = false;
  }
};

// 医生维度医院变化
const onDoctorHospitalChange = () => {
  doctorForm.doctorId = null;
};

// 患者维度医院变化
const onPatientHospitalChange = () => {
  patientForm.doctorId = null;
  pagination.page = 1;
  fetchPatients();
};

// 重置患者筛选
const resetPatientForm = () => {
  patientForm.hospitalId = null;
  patientForm.doctorId = null;
  patientForm.stage = '';
  patientForm.status = '';
  patientForm.startDate = '';
  patientForm.endDate = '';
  patientForm.scaleCode = '';
  pagination.page = 1;
  fetchPatients();
};

// 格式化阶段
const formatStage = (stage: string) => {
  if (stage === 'completed') return '已完成';
  return stage || '-';
};

// 格式化状态
const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '活跃',
    completed: '已完成',
    withdrawn: '退出',
  };
  return statusMap[status] || status || '-';
};

// 获取阶段标签类型
const getStageTagType = (stage: string) => {
  const typeMap: Record<string, string> = {
    V1: 'info',
    V2: 'warning',
    V3: 'success',
    V4: 'danger',
    completed: '',
  };
  return typeMap[stage] || 'info';
};

// ==================== 导出处理函数 ====================

// 导出医院患者汇总
const handleExportHospitalSummary = async () => {
  loading.hospitalSummary = true;
  try {
    const blob = await exportAPI.exportHospitalSummary({
      hospitalId: hospitalForm.hospitalId || undefined,
    });
    downloadFile(blob, generateFilename('医院患者汇总'));
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  } finally {
    loading.hospitalSummary = false;
  }
};

// 导出医生工作量统计
const handleExportDoctorSummary = async () => {
  loading.doctorSummary = true;
  try {
    const blob = await exportAPI.exportDoctorSummary({
      hospitalId: doctorForm.hospitalId || undefined,
      doctorId: doctorForm.doctorId || undefined,
    });
    downloadFile(blob, generateFilename('医生工作量统计'));
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  } finally {
    loading.doctorSummary = false;
  }
};

// 导出患者列表
const handleExportPatients = async () => {
  loading.patients = true;
  try {
    const blob = await exportAPI.exportPatients({
      hospitalId: patientForm.hospitalId || undefined,
      doctorId: patientForm.doctorId || undefined,
      stage: patientForm.stage || undefined,
      status: patientForm.status || undefined,
      startDate: patientForm.startDate || undefined,
      endDate: patientForm.endDate || undefined,
    });
    downloadFile(blob, generateFilename('患者列表'));
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  } finally {
    loading.patients = false;
  }
};

// 导出单患者完整档案
const handleExportPatientProfile = async (patientId: number) => {
  loading.patientProfile = patientId;
  try {
    const blob = await exportAPI.exportPatientProfile(patientId);
    downloadFile(blob, generateFilename(`患者档案_${patientId}`));
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  } finally {
    loading.patientProfile = null;
  }
};

// 导出量表记录
const handleExportScaleRecords = async () => {
  loading.scaleRecords = true;
  try {
    const blob = await exportAPI.exportScaleRecords({
      hospitalId: patientForm.hospitalId || undefined,
      doctorId: patientForm.doctorId || undefined,
      stage: patientForm.stage || undefined,
      startDate: patientForm.startDate || undefined,
      endDate: patientForm.endDate || undefined,
      scaleCode: patientForm.scaleCode || undefined,
    });
    downloadFile(blob, generateFilename('量表记录'));
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  } finally {
    loading.scaleRecords = false;
  }
};

// 导出用药记录
const handleExportMedicationRecords = async () => {
  loading.medicationRecords = true;
  try {
    const blob = await exportAPI.exportMedicationRecords({
      hospitalId: patientForm.hospitalId || undefined,
      doctorId: patientForm.doctorId || undefined,
      stage: patientForm.stage || undefined,
      startDate: patientForm.startDate || undefined,
      endDate: patientForm.endDate || undefined,
    });
    downloadFile(blob, generateFilename('用药记录'));
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  } finally {
    loading.medicationRecords = false;
  }
};

// 导出不良事件
const handleExportAdverseEvents = async () => {
  loading.adverseEvents = true;
  try {
    const blob = await exportAPI.exportAdverseEvents({
      hospitalId: patientForm.hospitalId || undefined,
      doctorId: patientForm.doctorId || undefined,
      stage: patientForm.stage || undefined,
      startDate: patientForm.startDate || undefined,
      endDate: patientForm.endDate || undefined,
    });
    downloadFile(blob, generateFilename('不良事件'));
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  } finally {
    loading.adverseEvents = false;
  }
};

// 导出 Dashboard 统计数据
const handleExportDashboardStats = async () => {
  loading.dashboardStats = true;
  try {
    const blob = await exportAPI.exportDashboardStats();
    downloadFile(blob, generateFilename('统计报表'));
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  } finally {
    loading.dashboardStats = false;
  }
};
</script>

<style scoped>
.export-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tab-content {
  padding: 10px 0;
}

.filter-form {
  margin-bottom: 20px;
}

.export-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.export-desc {
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
}

.export-desc li {
  margin: 5px 0;
}

:deep(.el-tabs__content) {
  padding: 15px;
}

:deep(.el-divider__text) {
  font-weight: bold;
  color: #409eff;
}
</style>
