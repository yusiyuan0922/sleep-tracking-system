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
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="hospital.name" label="所属医院" min-width="180" />
        <el-table-column prop="title" label="职称" width="120" />
        <el-table-column prop="department" label="科室" width="120" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              link
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '离职' : '在职' }}
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
        <el-form-item label="职称" prop="title">
          <el-input v-model="formData.title" placeholder="请输入职称" />
        </el-form-item>
        <el-form-item label="科室" prop="department">
          <el-input v-model="formData.department" placeholder="请输入科室" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">在职</el-radio>
            <el-radio label="inactive">离职</el-radio>
          </el-radio-group>
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
  title: '',
  department: '',
  phone: '',
  email: '',
  status: 'active' as 'active' | 'inactive',
});

const rules: FormRules = {
  hospitalId: [{ required: true, message: '请选择所属医院', trigger: 'change' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  title: [{ required: true, message: '请输入职称', trigger: 'blur' }],
  department: [{ required: true, message: '请输入科室', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
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
    ...row,
    hospitalId: row.hospital?.id,
  });
  dialogVisible.value = true;
};

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active';
  const action = newStatus === 'active' ? '在职' : '离职';

  try {
    await ElMessageBox.confirm(`确定要将该医生设置为${action}吗？`, '提示', {
      type: 'warning',
    });
    await doctorAPI.updateStatus(row.id, newStatus);
    ElMessage.success('操作成功');
    fetchData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败');
    }
  }
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
  formData.title = '';
  formData.department = '';
  formData.phone = '';
  formData.email = '';
  formData.status = 'active';
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
