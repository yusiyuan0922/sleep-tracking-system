<template>
  <div class="adverse-event-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>不良事件管理</span>
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
        <el-form-item label="严重程度">
          <el-select
            v-model="searchForm.severity"
            placeholder="请选择严重程度"
            clearable
            style="width: 120px"
          >
            <el-option label="轻度" value="mild" />
            <el-option label="中度" value="moderate" />
            <el-option label="重度" value="severe" />
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
        <el-table-column prop="eventName" label="事件名称" min-width="150" />
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.severity === 'mild' ? 'success' : row.severity === 'moderate' ? 'warning' : 'danger'"
            >
              {{ row.severity === 'mild' ? '轻度' : row.severity === 'moderate' ? '中度' : '重度' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isSerious" label="严重不良事件" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isSerious ? 'danger' : 'info'">
              {{ row.isSerious ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="onsetDate" label="发生日期" width="120" />
        <el-table-column prop="endDate" label="结束日期" width="120" />
        <el-table-column prop="relatedDrug" label="相关药物" width="150" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              查看
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

    <!-- 查看详情对话框 -->
    <el-dialog v-model="dialogVisible" title="不良事件详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="患者">{{ detailData.patient?.name }}</el-descriptions-item>
        <el-descriptions-item label="阶段">{{ detailData.stage }}</el-descriptions-item>
        <el-descriptions-item label="事件名称">{{ detailData.eventName }}</el-descriptions-item>
        <el-descriptions-item label="严重程度">
          <el-tag
            :type="detailData.severity === 'mild' ? 'success' : detailData.severity === 'moderate' ? 'warning' : 'danger'"
          >
            {{ detailData.severity === 'mild' ? '轻度' : detailData.severity === 'moderate' ? '中度' : '重度' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="严重不良事件">
          <el-tag :type="detailData.isSerious ? 'danger' : 'info'">
            {{ detailData.isSerious ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发生日期">{{ detailData.onsetDate }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ detailData.endDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="相关药物">{{ detailData.relatedDrug || '-' }}</el-descriptions-item>
        <el-descriptions-item label="因果关系">{{ detailData.causality || '-' }}</el-descriptions-item>
        <el-descriptions-item label="采取措施">{{ detailData.action || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结果">{{ detailData.outcome || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detailData.description }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adverseEventAPI } from '@/api/adverse-event';

const loading = ref(false);
const dialogVisible = ref(false);

const tableData = ref([]);
const detailData = ref<any>({});
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const searchForm = reactive({
  patientId: '',
  severity: '',
});

const fetchData = async () => {
  try {
    loading.value = true;
    const res = await adverseEventAPI.getList({
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
  searchForm.severity = '';
  fetchData();
};

const handleView = (row: any) => {
  detailData.value = row;
  dialogVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该不良事件记录吗？此操作不可恢复！', '警告', {
      type: 'warning',
    });
    await adverseEventAPI.delete(row.id);
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
.adverse-event-container {
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
