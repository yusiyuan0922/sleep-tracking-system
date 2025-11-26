<template>
  <div class="medical-file-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>病历文件管理</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="患者">
          <el-input
            v-model="searchForm.patientId"
            placeholder="请输入患者ID"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="文件分类">
          <el-select
            v-model="searchForm.fileCategory"
            placeholder="请选择文件分类"
            clearable
            style="width: 150px"
          >
            <el-option label="知情同意书" value="informed_consent" />
            <el-option label="病历记录" value="medical_record" />
            <el-option label="检验报告" value="lab_report" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="patient.name" label="患者" width="100" />
        <el-table-column prop="stage" label="阶段" width="80" />
        <el-table-column prop="fileCategory" label="文件分类" width="120">
          <template #default="{ row }">
            {{
              row.fileCategory === 'informed_consent' ? '知情同意书' :
              row.fileCategory === 'medical_record' ? '病历记录' :
              row.fileCategory === 'lab_report' ? '检验报告' : '其他'
            }}
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名称" min-width="200" />
        <el-table-column prop="fileType" label="文件类型" width="100" />
        <el-table-column prop="fileSize" label="文件大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="uploadedAt" label="上传时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleDownload(row)">
              下载
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { medicalFileAPI } from '@/api/medical-file';

const loading = ref(false);

const tableData = ref([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const searchForm = reactive({
  patientId: '',
  fileCategory: '',
});

const formatFileSize = (bytes: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const fetchData = async () => {
  try {
    loading.value = true;
    const res = await medicalFileAPI.getList({
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
  searchForm.patientId = '';
  searchForm.fileCategory = '';
  fetchData();
};

const handleDownload = (row: any) => {
  window.open(row.fileUrl, '_blank');
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该文件吗？此操作不可恢复！', '警告', {
      type: 'warning',
    });
    await medicalFileAPI.delete(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.medical-file-container {
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
