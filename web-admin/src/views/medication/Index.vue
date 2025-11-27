<template>
  <div class="medication-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用药记录</span>
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
        <el-form-item label="阶段">
          <el-select
            v-model="searchForm.stage"
            placeholder="请选择阶段"
            clearable
            style="width: 120px"
          >
            <el-option label="V1" value="V1" />
            <el-option label="V2" value="V2" />
            <el-option label="V3" value="V3" />
            <el-option label="V4" value="V4" />
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
        <el-table-column prop="drugName" label="药品名称" min-width="150" />
        <el-table-column prop="specification" label="规格" width="100" />
        <el-table-column prop="dosage" label="剂量" width="80" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="frequency" label="频次" width="100" />
        <el-table-column prop="route" label="给药途径" width="100" />
        <el-table-column prop="startDate" label="开始日期" width="120" />
        <el-table-column prop="endDate" label="结束日期" width="120" />
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
    <el-dialog v-model="dialogVisible" title="用药记录详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="患者">{{ detailData.patient?.name }}</el-descriptions-item>
        <el-descriptions-item label="阶段">{{ detailData.stage }}</el-descriptions-item>
        <el-descriptions-item label="药品名称">{{ detailData.drugName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ detailData.specification }}</el-descriptions-item>
        <el-descriptions-item label="剂量">{{ detailData.dosage }} {{ detailData.unit }}</el-descriptions-item>
        <el-descriptions-item label="频次">{{ detailData.frequency }}</el-descriptions-item>
        <el-descriptions-item label="给药途径">{{ detailData.route }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ detailData.startDate }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ detailData.endDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { medicationAPI } from '@/api/medication';

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
  stage: '',
});

const fetchData = async () => {
  try {
    loading.value = true;
    const res = await medicationAPI.getRecordList({
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
  searchForm.stage = '';
  fetchData();
};

const handleView = (row: any) => {
  detailData.value = row;
  dialogVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该用药记录吗？此操作不可恢复！', '警告', {
      type: 'warning',
    });
    await medicationAPI.deleteRecord(row.id);
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
.medication-container {
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
