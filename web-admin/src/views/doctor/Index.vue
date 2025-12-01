<template>
  <div class="doctor-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>医生管理</span>
          <el-button type="primary" @click="handleAdd">新增医生</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="医院">
          <el-select
            v-model="searchForm.hospitalId"
            placeholder="请选择医院"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="hospital in hospitals"
              :key="hospital.id"
              :label="hospital.name"
              :value="hospital.id"
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
        <el-table-column prop="user.name" label="姓名" width="100" />
        <el-table-column prop="hospital.name" label="所属医院" min-width="180" />
        <el-table-column prop="employeeNo" label="工号" width="120" />
        <el-table-column prop="department" label="科室" width="120" />
        <el-table-column prop="title" label="职称" width="120" />
        <el-table-column prop="user.phone" label="电话" width="120" />
        <el-table-column prop="auditStatus" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.auditStatus === 'approved' ? 'success' : row.auditStatus === 'pending' ? 'warning' : 'info'">
              {{ row.auditStatus === 'approved' ? '已审核' : row.auditStatus === 'pending' ? '待审核' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="微信绑定" width="100">
          <template #default="{ row }">
            <el-tag :type="row.user?.openid?.startsWith('admin_created_') ? 'warning' : 'success'">
              {{ row.user?.openid?.startsWith('admin_created_') ? '未绑定' : '已绑定' }}
            </el-tag>
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
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="所属医院" prop="hospitalId">
          <el-select
            v-model="formData.hospitalId"
            placeholder="请选择医院"
            style="width: 100%"
          >
            <el-option
              v-for="hospital in hospitals"
              :key="hospital.id"
              :label="hospital.name"
              :value="hospital.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="工号" prop="employeeNo">
          <el-input v-model="formData.employeeNo" placeholder="请输入工号(选填)" />
        </el-form-item>
        <el-form-item label="科室" prop="department">
          <el-input v-model="formData.department" placeholder="请输入科室(选填)" />
        </el-form-item>
        <el-form-item label="职称" prop="title">
          <el-input v-model="formData.title" placeholder="请输入职称(选填)" />
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
import { doctorAPI } from '@/api/doctor';
import { hospitalAPI } from '@/api/hospital';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增医生');
const formRef = ref<FormInstance>();

const tableData = ref([]);
const hospitals = ref([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const searchForm = reactive({
  hospitalId: null as number | null,
});

const formData = reactive({
  id: null as number | null,
  hospitalId: null as number | null,
  name: '',
  phone: '',
  employeeNo: '',
  department: '',
  title: '',
});

const rules: FormRules = {
  hospitalId: [{ required: true, message: '请选择所属医院', trigger: 'change' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
};

const fetchHospitals = async () => {
  try {
    const res = await hospitalAPI.getActive();
    hospitals.value = res;
  } catch (error: any) {
    ElMessage.error(error.message || '获取医院列表失败');
  }
};

const fetchData = async () => {
  try {
    loading.value = true;
    const res = await doctorAPI.getList({
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
  fetchData();
};

const handleAdd = () => {
  dialogTitle.value = '新增医生';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑医生';
  Object.assign(formData, {
    id: row.id,
    hospitalId: row.hospital?.id,
    name: row.user?.name || '',
    phone: row.user?.phone || '',
    employeeNo: row.employeeNo || '',
    department: row.department || '',
    title: row.title || '',
  });
  dialogVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该医生吗？此操作不可恢复！', '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    await doctorAPI.delete(row.id);
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
          await doctorAPI.update(id, data);
          ElMessage.success('更新成功');
        } else {
          await doctorAPI.create(data);
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
  formData.hospitalId = null;
  formData.name = '';
  formData.phone = '';
  formData.employeeNo = '';
  formData.department = '';
  formData.title = '';
  formRef.value?.clearValidate();
};

onMounted(() => {
  fetchHospitals();
  fetchData();
});
</script>

<style scoped>
.doctor-container {
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
