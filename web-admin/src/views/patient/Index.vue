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
        <el-table-column prop="patientCode" label="患者编号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="hospital.name" label="所属医院" min-width="150" />
        <el-table-column prop="doctor.name" label="主治医生" width="100" />
        <el-table-column prop="enrollmentDate" label="入组日期" width="120" />
        <el-table-column prop="currentStage" label="当前阶段" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.currentStage">{{ row.currentStage }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
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
    const res = await doctorAPI.getList({ hospitalId });
    return res.items || [];
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
    tableData.value = res.items || [];
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
