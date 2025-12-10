<template>
  <div class="medical-file-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>病历文件管理</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="患者姓名">
          <el-input
            v-model="searchForm.patientName"
            placeholder="请输入患者姓名"
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

      <!-- 按患者分组展示 -->
      <el-collapse v-model="activePatients" v-loading="loading">
        <el-collapse-item
          v-for="patient in patientList"
          :key="patient.id"
          :name="patient.id"
        >
          <template #title>
            <div class="patient-header">
              <el-avatar :size="32" :src="patient.avatar">
                {{ patient.name?.charAt(0) || '?' }}
              </el-avatar>
              <span class="patient-name">{{ patient.name || '未知患者' }}</span>
              <el-tag size="small" type="info">{{ patient.patientNo }}</el-tag>
              <el-tag size="small">{{ patient.currentStage }}</el-tag>
              <span class="file-count">{{ patient.files.length }} 个文件</span>
            </div>
          </template>

          <el-table :data="patient.files" border size="small">
            <el-table-column prop="stage" label="阶段" width="80" />
            <el-table-column prop="fileCategory" label="文件分类" width="120">
              <template #default="{ row }">
                {{ formatCategory(row.fileCategory) }}
              </template>
            </el-table-column>
            <el-table-column prop="fileName" label="文件名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="fileType" label="类型" width="80" />
            <el-table-column prop="fileSize" label="大小" width="100">
              <template #default="{ row }">
                {{ formatFileSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="120" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="上传时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handlePreview(row)">
                  预览
                </el-button>
                <el-button link type="primary" size="small" @click="handleDownload(row)">
                  下载
                </el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row, patient)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>

      <el-empty v-if="!loading && patientList.length === 0" description="暂无数据" />
    </el-card>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <div class="preview-container">
        <!-- 图片预览 -->
        <template v-if="isImageFile(previewFile.fileType)">
          <el-image
            :src="previewFile.fileUrl"
            fit="contain"
            style="max-width: 100%; max-height: 70vh;"
            :preview-src-list="[previewFile.fileUrl]"
          />
        </template>
        <!-- PDF 预览 -->
        <template v-else-if="isPdfFile(previewFile.fileType)">
          <iframe
            :src="previewFile.fileUrl"
            style="width: 100%; height: 70vh; border: none;"
          />
        </template>
        <!-- 其他文件类型 -->
        <template v-else>
          <div class="unsupported-preview">
            <el-icon :size="64"><Document /></el-icon>
            <p>该文件类型不支持在线预览</p>
            <p>文件名：{{ previewFile.fileName }}</p>
            <p>文件类型：{{ previewFile.fileType }}</p>
            <el-button type="primary" @click="handleDownload(previewFile)">
              下载文件
            </el-button>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Document } from '@element-plus/icons-vue';
import { medicalFileAPI } from '@/api/medical-file';

const loading = ref(false);
const previewVisible = ref(false);
const previewTitle = ref('');
const previewFile = ref<any>({});
const activePatients = ref<number[]>([]);

const patientList = ref<any[]>([]);

const searchForm = reactive({
  patientName: '',
  fileCategory: '',
});

const formatFileSize = (bytes: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const formatCategory = (category: string) => {
  const map: Record<string, string> = {
    informed_consent: '知情同意书',
    medical_record: '病历记录',
    lab_report: '检验报告',
    other: '其他',
  };
  return map[category] || category;
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

const isImageFile = (fileType: string) => {
  if (!fileType) return false;
  const imageTypes = ['image', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  return imageTypes.some(type => fileType.toLowerCase().includes(type));
};

const isPdfFile = (fileType: string) => {
  if (!fileType) return false;
  return fileType.toLowerCase().includes('pdf');
};

const fetchData = async () => {
  try {
    loading.value = true;
    // 获取所有文件（不分页，获取全部）
    const res = await medicalFileAPI.getList({
      page: 1,
      pageSize: 1000,
      fileCategory: searchForm.fileCategory || undefined,
    });

    const files = res.data || [];

    // 按患者分组
    const patientMap = new Map<number, any>();

    files.forEach((file: any) => {
      const patient = file.patient;
      if (!patient) return;

      const patientId = patient.id;
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          id: patientId,
          name: patient.user?.name || '未知',
          patientNo: patient.patientNo || '-',
          currentStage: patient.currentStage || '-',
          avatar: patient.user?.avatarUrl || '',
          files: [],
        });
      }
      patientMap.get(patientId).files.push(file);
    });

    // 转为数组并根据搜索条件过滤
    let result = Array.from(patientMap.values());

    if (searchForm.patientName) {
      result = result.filter(p =>
        p.name.includes(searchForm.patientName) ||
        p.patientNo.includes(searchForm.patientName)
      );
    }

    // 按文件数量排序
    result.sort((a, b) => b.files.length - a.files.length);

    patientList.value = result;

    // 默认展开第一个患者
    if (result.length > 0 && activePatients.value.length === 0) {
      activePatients.value = [result[0].id];
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败');
  } finally {
    loading.value = false;
  }
};

const resetSearch = () => {
  searchForm.patientName = '';
  searchForm.fileCategory = '';
  fetchData();
};

const handlePreview = (row: any) => {
  previewFile.value = row;
  previewTitle.value = `预览: ${row.fileName}`;
  previewVisible.value = true;
};

const handleDownload = (row: any) => {
  window.open(row.fileUrl, '_blank');
};

const handleDelete = async (row: any, patient: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该文件吗？此操作不可恢复！', '警告', {
      type: 'warning',
    });
    await medicalFileAPI.delete(row.id);
    ElMessage.success('删除成功');
    // 从本地列表中移除
    const index = patient.files.findIndex((f: any) => f.id === row.id);
    if (index > -1) {
      patient.files.splice(index, 1);
    }
    // 如果该患者没有文件了，从列表中移除
    if (patient.files.length === 0) {
      const patientIndex = patientList.value.findIndex(p => p.id === patient.id);
      if (patientIndex > -1) {
        patientList.value.splice(patientIndex, 1);
      }
    }
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

.patient-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.patient-name {
  font-weight: 600;
  font-size: 15px;
}

.file-count {
  color: #909399;
  font-size: 13px;
  margin-left: auto;
  margin-right: 20px;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.unsupported-preview {
  text-align: center;
  color: #909399;
}

.unsupported-preview p {
  margin: 10px 0;
}

:deep(.el-collapse-item__header) {
  height: 60px;
  line-height: 60px;
}

:deep(.el-collapse-item__content) {
  padding: 10px 20px 20px;
}
</style>
