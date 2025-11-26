<template>
  <div class="hospital-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>医院管理</span>
          <el-button type="primary" @click="handleAdd">新增医院</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="医院名称" min-width="200" />
        <el-table-column prop="code" label="医院代码" width="120" />
        <el-table-column prop="level" label="医院等级" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '激活' : '停用' }}
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
              {{ row.status === 'active' ? '停用' : '激活' }}
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
        <el-form-item label="医院名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入医院名称" />
        </el-form-item>
        <el-form-item label="医院代码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入医院代码" />
        </el-form-item>
        <el-form-item label="医院等级" prop="level">
          <el-select v-model="formData.level" placeholder="请选择医院等级" style="width: 100%">
            <el-option label="三级甲等" value="三级甲等" />
            <el-option label="三级乙等" value="三级乙等" />
            <el-option label="二级甲等" value="二级甲等" />
            <el-option label="二级乙等" value="二级乙等" />
            <el-option label="一级甲等" value="一级甲等" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入医院地址" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">激活</el-radio>
            <el-radio label="inactive">停用</el-radio>
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
import { hospitalAPI } from '@/api/hospital';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增医院');
const formRef = ref<FormInstance>();

const tableData = ref([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const formData = reactive({
  id: null as number | null,
  name: '',
  code: '',
  level: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  status: 'active' as 'active' | 'inactive',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入医院名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入医院代码', trigger: 'blur' }],
  level: [{ required: true, message: '请选择医院等级', trigger: 'change' }],
  address: [{ required: true, message: '请输入医院地址', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
};

const fetchData = async () => {
  try {
    loading.value = true;
    const res = await hospitalAPI.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    tableData.value = res.items || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败');
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  dialogTitle.value = '新增医院';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑医院';
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active';
  const action = newStatus === 'active' ? '激活' : '停用';

  try {
    await ElMessageBox.confirm(`确定要${action}该医院吗？`, '提示', {
      type: 'warning',
    });
    await hospitalAPI.updateStatus(row.id, newStatus);
    ElMessage.success(`${action}成功`);
    fetchData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || `${action}失败`);
    }
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该医院吗？此操作不可恢复！', '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    await hospitalAPI.delete(row.id);
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
          await hospitalAPI.update(id, data);
          ElMessage.success('更新成功');
        } else {
          await hospitalAPI.create(data);
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
  formData.name = '';
  formData.code = '';
  formData.level = '';
  formData.address = '';
  formData.contactPerson = '';
  formData.contactPhone = '';
  formData.status = 'active';
  formRef.value?.clearValidate();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.hospital-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
