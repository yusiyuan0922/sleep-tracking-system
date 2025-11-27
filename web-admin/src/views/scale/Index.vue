<template>
  <div class="scale-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>量表管理</span>
          <el-button type="primary" @click="handleAdd">新增量表</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="量表名称" min-width="150" />
        <el-table-column prop="code" label="量表代码" width="100" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            {{ row.type === 'self' ? '自评' : '他评' }}
          </template>
        </el-table-column>
        <el-table-column prop="stage" label="适用阶段" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.stage">{{ row.stage }}</el-tag>
            <span v-else>全部</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
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
              {{ row.status === 'active' ? '停用' : '启用' }}
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
        <el-form-item label="量表名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入量表名称" />
        </el-form-item>
        <el-form-item label="量表代码" prop="code">
          <el-select v-model="formData.code" placeholder="请选择量表代码" style="width: 100%">
            <el-option label="AIS (雅典失眠量表)" value="AIS" />
            <el-option label="ESS (Epworth嗜睡量表)" value="ESS" />
            <el-option label="GAD-7 (广泛性焦虑量表)" value="GAD7" />
            <el-option label="PHQ-9 (患者健康问卷)" value="PHQ9" />
            <el-option label="HAMA (汉密尔顿焦虑量表)" value="HAMA" />
            <el-option label="HAMD (汉密尔顿抑郁量表)" value="HAMD" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio label="self">自评</el-radio>
            <el-radio label="doctor">他评</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="适用阶段" prop="stage">
          <el-select v-model="formData.stage" placeholder="请选择适用阶段" clearable style="width: 100%">
            <el-option label="V1" value="V1" />
            <el-option label="V2" value="V2" />
            <el-option label="V3" value="V3" />
            <el-option label="V4" value="V4" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入量表描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">启用</el-radio>
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
import { scaleAPI } from '@/api/scale';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增量表');
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
  code: '' as 'AIS' | 'ESS' | 'GAD7' | 'PHQ9' | 'HAMA' | 'HAMD' | '',
  type: 'self' as 'self' | 'doctor',
  stage: '' as 'V1' | 'V2' | 'V3' | 'V4' | '',
  description: '',
  status: 'active' as 'active' | 'inactive',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入量表名称', trigger: 'blur' }],
  code: [{ required: true, message: '请选择量表代码', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
};

const fetchData = async () => {
  try {
    loading.value = true;
    const res = await scaleAPI.getConfigList({
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    tableData.value = res.items || res || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败');
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  dialogTitle.value = '新增量表';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑量表';
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active';
  const action = newStatus === 'active' ? '启用' : '停用';

  try {
    await ElMessageBox.confirm(`确定要${action}该量表吗？`, '提示', {
      type: 'warning',
    });
    await scaleAPI.updateConfig(row.id, { status: newStatus });
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
    await ElMessageBox.confirm('确定要删除该量表吗？此操作不可恢复！', '警告', {
      type: 'warning',
    });
    await scaleAPI.deleteConfig(row.id);
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
          await scaleAPI.updateConfig(id, data);
          ElMessage.success('更新成功');
        } else {
          await scaleAPI.createConfig(data);
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
  formData.type = 'self';
  formData.stage = '';
  formData.description = '';
  formData.status = 'active';
  formRef.value?.clearValidate();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.scale-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
