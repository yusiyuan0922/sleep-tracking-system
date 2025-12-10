<template>
  <div class="patient-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>患者管理</span>
          <el-button type="primary" @click="handleAdd">新增患者</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="医院">
          <el-select
            v-model="searchForm.hospitalId"
            placeholder="请选择医院"
            clearable
            style="width: 200px"
            @change="onHospitalChange"
          >
            <el-option
              v-for="hospital in hospitals"
              :key="hospital.id"
              :label="hospital.name"
              :value="hospital.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="医生">
          <el-select
            v-model="searchForm.doctorId"
            placeholder="请选择医生"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="doctor in doctors"
              :key="doctor.id"
              :label="doctor.name"
              :value="doctor.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="patientNo" label="患者编号" width="140" />
        <el-table-column prop="user.name" label="姓名" width="100" />
        <el-table-column label="性别" width="80">
          <template #default="{ row }">
            {{ row.user?.gender === 'male' ? '男' : row.user?.gender === 'female' ? '女' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="user.phone" label="电话" width="130" />
        <el-table-column prop="hospital.name" label="所属医院" min-width="150" />
        <el-table-column prop="doctor.user.name" label="主治医生" width="100" />
        <el-table-column prop="enrollmentDate" label="入组日期" width="120" />
        <el-table-column prop="currentStage" label="当前阶段" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.currentStage">{{ row.currentStage }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="success">进行中</el-tag>
            <el-tag v-else-if="row.status === 'completed'" type="info">已完成</el-tag>
            <el-tag v-else-if="row.status === 'withdrawn'" type="danger">已退出</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              link
              type="warning"
              size="small"
              @click="handleAdvanceStage(row)"
              :disabled="row.currentStage === 'completed' || row.status === 'withdrawn'"
            >
              推进阶段
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleWithdraw(row)"
              :disabled="row.status !== 'active'"
            >
              提前退出
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="患者编号" prop="patientCode">
              <el-input v-model="formData.patientCode" placeholder="请输入患者编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="formData.gender">
                <el-radio label="male">男</el-radio>
                <el-radio label="female">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生日期" prop="birthDate">
              <el-date-picker
                v-model="formData.birthDate"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急联系人" prop="emergencyContact">
              <el-input v-model="formData.emergencyContact" placeholder="请输入紧急联系人" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属医院" prop="hospitalId">
              <el-select
                v-model="formData.hospitalId"
                placeholder="请选择医院"
                style="width: 100%"
                @change="onFormHospitalChange"
              >
                <el-option
                  v-for="hospital in hospitals"
                  :key="hospital.id"
                  :label="hospital.name"
                  :value="hospital.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主治医生" prop="doctorId">
              <el-select
                v-model="formData.doctorId"
                placeholder="请选择医生"
                style="width: 100%"
              >
                <el-option
                  v-for="doctor in formDoctors"
                  :key="doctor.id"
                  :label="doctor.name"
                  :value="doctor.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="入组日期" prop="enrollmentDate">
          <el-date-picker
            v-model="formData.enrollmentDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="诊断" prop="diagnosis">
          <el-input
            v-model="formData.diagnosis"
            type="textarea"
            :rows="3"
            placeholder="请输入诊断信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 推进阶段对话框 -->
    <el-dialog
      v-model="advanceDialogVisible"
      title="手动推进阶段"
      width="500px"
    >
      <el-alert
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #title>
          此功能用于测试或特殊情况，将跳过必填项检查直接推进阶段
        </template>
      </el-alert>

      <el-form label-width="100px">
        <el-form-item label="患者姓名">
          <span>{{ advanceForm.patientName }}</span>
        </el-form-item>
        <el-form-item label="当前阶段">
          <el-tag>{{ advanceForm.currentStage }}</el-tag>
        </el-form-item>
        <el-form-item label="目标阶段" required>
          <el-select v-model="advanceForm.targetStage" placeholder="请选择目标阶段" style="width: 100%">
            <el-option
              v-for="stage in availableTargetStages"
              :key="stage.value"
              :label="stage.label"
              :value="stage.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input
            v-model="advanceForm.remark"
            type="textarea"
            :rows="2"
            placeholder="可选，填写推进原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="advanceDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmAdvanceStage" :loading="advanceLoading">
          确认推进
        </el-button>
      </template>
    </el-dialog>

    <!-- 提前退出对话框 -->
    <el-dialog
      v-model="withdrawDialogVisible"
      title="患者提前退出"
      width="500px"
    >
      <el-alert
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #title>
          提前退出需要先完成当前阶段的4个量表：AIS、ESS、GAD7、PHQ9
        </template>
      </el-alert>

      <el-form label-width="100px">
        <el-form-item label="患者姓名">
          <span>{{ withdrawForm.patientName }}</span>
        </el-form-item>
        <el-form-item label="当前阶段">
          <el-tag>{{ withdrawForm.currentStage }}</el-tag>
        </el-form-item>
        <el-form-item label="量表完成状态">
          <div v-if="withdrawCheckLoading">
            <el-icon class="is-loading"><Loading /></el-icon> 检查中...
          </div>
          <div v-else>
            <el-tag
              v-for="scale in withdrawCheckResult.completedScales"
              :key="scale"
              type="success"
              style="margin-right: 5px; margin-bottom: 5px"
            >
              {{ scale }} ✓
            </el-tag>
            <el-tag
              v-for="scale in withdrawCheckResult.missingScales"
              :key="scale"
              type="danger"
              style="margin-right: 5px; margin-bottom: 5px"
            >
              {{ scale }} ✗
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="退出原因" required>
          <el-input
            v-model="withdrawForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入退出原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="withdrawDialogVisible = false">取消</el-button>
        <el-button
          type="danger"
          @click="confirmWithdraw"
          :loading="withdrawLoading"
          :disabled="!withdrawCheckResult.canWithdraw"
        >
          确认退出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { patientAPI } from '@/api/patient';
import { hospitalAPI } from '@/api/hospital';
import { doctorAPI } from '@/api/doctor';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增患者');
const formRef = ref<FormInstance>();

const tableData = ref([]);
const hospitals = ref([]);
const doctors = ref([]);
const formDoctors = ref([]);

// 推进阶段相关
const advanceDialogVisible = ref(false);
const advanceLoading = ref(false);
const advanceForm = reactive({
  patientId: null as number | null,
  patientName: '',
  currentStage: '',
  targetStage: '',
  remark: '',
});

const allStages = [
  { value: 'V1', label: 'V1阶段' },
  { value: 'V2', label: 'V2阶段' },
  { value: 'V3', label: 'V3阶段' },
  { value: 'V4', label: 'V4阶段' },
  { value: 'completed', label: '已完成' },
];

const availableTargetStages = computed(() => {
  const currentIndex = allStages.findIndex(s => s.value === advanceForm.currentStage);
  return allStages.slice(currentIndex + 1);
});

// 提前退出相关
const withdrawDialogVisible = ref(false);
const withdrawLoading = ref(false);
const withdrawCheckLoading = ref(false);
const withdrawForm = reactive({
  patientId: null as number | null,
  patientName: '',
  currentStage: '',
  reason: '',
});
const withdrawCheckResult = reactive({
  canWithdraw: false,
  missingScales: [] as string[],
  completedScales: [] as string[],
  message: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const searchForm = reactive({
  hospitalId: null as number | null,
  doctorId: null as number | null,
});

const formData = reactive({
  id: null as number | null,
  patientCode: '',
  name: '',
  gender: 'male' as 'male' | 'female',
  birthDate: '',
  phone: '',
  emergencyContact: '',
  hospitalId: null as number | null,
  doctorId: null as number | null,
  enrollmentDate: '',
  diagnosis: '',
});

const rules: FormRules = {
  patientCode: [{ required: true, message: '请输入患者编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  birthDate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
  hospitalId: [{ required: true, message: '请选择所属医院', trigger: 'change' }],
  doctorId: [{ required: true, message: '请选择主治医生', trigger: 'change' }],
  enrollmentDate: [{ required: true, message: '请选择入组日期', trigger: 'change' }],
};

const fetchHospitals = async () => {
  try {
    const res = await hospitalAPI.getActive();
    hospitals.value = res;
  } catch (error: any) {
    ElMessage.error(error.message || '获取医院列表失败');
  }
};

const fetchDoctors = async (hospitalId?: number) => {
  try {
    const res = await doctorAPI.getList({ hospitalId, auditStatus: 'approved' });
    return res.list || [];
  } catch (error: any) {
    ElMessage.error(error.message || '获取医生列表失败');
    return [];
  }
};

const onHospitalChange = async () => {
  if (searchForm.hospitalId) {
    doctors.value = await fetchDoctors(searchForm.hospitalId);
  } else {
    doctors.value = [];
  }
  searchForm.doctorId = null;
};

const onFormHospitalChange = async () => {
  if (formData.hospitalId) {
    formDoctors.value = await fetchDoctors(formData.hospitalId);
  } else {
    formDoctors.value = [];
  }
  formData.doctorId = null;
};

const fetchData = async () => {
  try {
    loading.value = true;
    const res = await patientAPI.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm,
    });
    tableData.value = res.list || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败');
  } finally {
    loading.value = false;
  }
};

const resetSearch = () => {
  searchForm.hospitalId = null;
  searchForm.doctorId = null;
  doctors.value = [];
  fetchData();
};

const handleAdd = () => {
  dialogTitle.value = '新增患者';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = async (row: any) => {
  dialogTitle.value = '编辑患者';
  Object.assign(formData, {
    ...row,
    hospitalId: row.hospital?.id,
    doctorId: row.doctor?.id,
  });

  if (formData.hospitalId) {
    formDoctors.value = await fetchDoctors(formData.hospitalId);
  }

  dialogVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该患者吗？此操作不可恢复！', '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    await patientAPI.delete(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true;
        const { id, ...data } = formData;
        if (id) {
          await patientAPI.update(id, data);
          ElMessage.success('更新成功');
        } else {
          await patientAPI.create(data);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        fetchData();
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

const resetForm = () => {
  formData.id = null;
  formData.patientCode = '';
  formData.name = '';
  formData.gender = 'male';
  formData.birthDate = '';
  formData.phone = '';
  formData.emergencyContact = '';
  formData.hospitalId = null;
  formData.doctorId = null;
  formData.enrollmentDate = '';
  formData.diagnosis = '';
  formDoctors.value = [];
  formRef.value?.clearValidate();
};

// 推进阶段相关方法
const handleAdvanceStage = (row: any) => {
  advanceForm.patientId = row.id;
  advanceForm.patientName = row.user?.name || '-';
  advanceForm.currentStage = row.currentStage || 'V1';
  advanceForm.targetStage = '';
  advanceForm.remark = '';
  advanceDialogVisible.value = true;
};

const confirmAdvanceStage = async () => {
  if (!advanceForm.targetStage) {
    ElMessage.warning('请选择目标阶段');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要将患者 "${advanceForm.patientName}" 从 ${advanceForm.currentStage} 推进到 ${advanceForm.targetStage} 吗？此操作将跳过必填项检查。`,
      '确认推进',
      {
        type: 'warning',
        confirmButtonText: '确定推进',
        cancelButtonText: '取消',
      }
    );

    advanceLoading.value = true;
    await patientAPI.advanceStage(
      advanceForm.patientId!,
      advanceForm.targetStage,
      advanceForm.remark
    );
    ElMessage.success('阶段推进成功');
    advanceDialogVisible.value = false;
    fetchData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '推进阶段失败');
    }
  } finally {
    advanceLoading.value = false;
  }
};

// 提前退出相关方法
const handleWithdraw = async (row: any) => {
  withdrawForm.patientId = row.id;
  withdrawForm.patientName = row.user?.name || '-';
  withdrawForm.currentStage = row.currentStage || 'V1';
  withdrawForm.reason = '';

  // 重置检查结果
  withdrawCheckResult.canWithdraw = false;
  withdrawCheckResult.missingScales = [];
  withdrawCheckResult.completedScales = [];
  withdrawCheckResult.message = '';

  withdrawDialogVisible.value = true;

  // 检查退出条件
  await checkWithdrawRequirements(row.id);
};

const checkWithdrawRequirements = async (patientId: number) => {
  try {
    withdrawCheckLoading.value = true;
    const res = await patientAPI.checkWithdrawRequirements(patientId);
    withdrawCheckResult.canWithdraw = res.canWithdraw;
    withdrawCheckResult.missingScales = res.missingScales || [];
    withdrawCheckResult.completedScales = res.completedScales || [];
    withdrawCheckResult.message = res.message || '';
  } catch (error: any) {
    ElMessage.error(error.message || '检查退出条件失败');
  } finally {
    withdrawCheckLoading.value = false;
  }
};

const confirmWithdraw = async () => {
  if (!withdrawForm.reason) {
    ElMessage.warning('请输入退出原因');
    return;
  }

  if (!withdrawCheckResult.canWithdraw) {
    ElMessage.warning('请先完成所有必需的量表');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要让患者 "${withdrawForm.patientName}" 提前退出吗？此操作不可撤销。`,
      '确认退出',
      {
        type: 'warning',
        confirmButtonText: '确认退出',
        cancelButtonText: '取消',
      }
    );

    withdrawLoading.value = true;
    await patientAPI.withdrawPatient(withdrawForm.patientId!, withdrawForm.reason);
    ElMessage.success('患者已成功退出');
    withdrawDialogVisible.value = false;
    fetchData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '退出操作失败');
    }
  } finally {
    withdrawLoading.value = false;
  }
};

onMounted(() => {
  fetchHospitals();
  fetchData();
});
</script>

<style scoped>
.patient-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
