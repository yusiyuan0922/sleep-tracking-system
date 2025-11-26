<template>
  <div class="stage-record-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>阶段记录管理</span>
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
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="草稿" value="draft" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
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
        <el-table-column prop="visitDate" label="随访日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 'draft' ? 'info' :
                row.status === 'submitted' ? 'warning' :
                row.status === 'approved' ? 'success' : 'danger'
              "
            >
              {{
                row.status === 'draft' ? '草稿' :
                row.status === 'submitted' ? '已提交' :
                row.status === 'approved' ? '已批准' : '已拒绝'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submittedBy.name" label="提交人" width="100" />
        <el-table-column prop="submittedAt" label="提交时间" width="160" />
        <el-table-column prop="auditedBy.name" label="审核人" width="100" />
        <el-table-column prop="auditedAt" label="审核时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button
              v-if="row.status === 'submitted'"
              link
              type="success"
              size="small"
              @click="handleAudit(row, 'approved')"
            >
              批准
            </el-button>
            <el-button
              v-if="row.status === 'submitted'"
              link
              type="danger"
              size="small"
              @click="handleAudit(row, 'rejected')"
            >
              拒绝
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
    <el-dialog v-model="dialogVisible" title="阶段记录详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="患者">{{ detailData.patient?.name }}</el-descriptions-item>
        <el-descriptions-item label="阶段">{{ detailData.stage }}</el-descriptions-item>
        <el-descriptions-item label="随访日期">{{ detailData.visitDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag
            :type="
              detailData.status === 'draft' ? 'info' :
              detailData.status === 'submitted' ? 'warning' :
              detailData.status === 'approved' ? 'success' : 'danger'
            "
          >
            {{
              detailData.status === 'draft' ? '草稿' :
              detailData.status === 'submitted' ? '已提交' :
              detailData.status === 'approved' ? '已批准' : '已拒绝'
            }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交人">{{ detailData.submittedBy?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ detailData.submittedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核人">{{ detailData.auditedBy?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ detailData.auditedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核备注" :span="2">{{ detailData.auditRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.status === 'rejected'" label="拒绝原因" :span="2">
          {{ detailData.rejectReason || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" :title="auditTitle" width="500px">
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="审核备注">
          <el-input
            v-model="auditForm.auditRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入审核备注"
          />
        </el-form-item>
        <el-form-item v-if="auditForm.auditResult === 'rejected'" label="拒绝原因">
          <el-input
            v-model="auditForm.rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { stageRecordAPI } from '@/api/stage-record';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const auditDialogVisible = ref(false);
const auditTitle = ref('');

const tableData = ref([]);
const detailData = ref<any>({});
const currentRecord = ref<any>(null);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const searchForm = reactive({
  patientId: '',
  stage: '',
  status: '',
});

const auditForm = reactive({
  auditResult: '' as 'approved' | 'rejected',
  auditRemark: '',
  rejectReason: '',
});

const fetchData = async () => {
  try {
    loading.value = true;
    const res = await stageRecordAPI.getList({
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
  searchForm.status = '';
  fetchData();
};

const handleView = (row: any) => {
  detailData.value = row;
  dialogVisible.value = true;
};

const handleAudit = (row: any, result: 'approved' | 'rejected') => {
  currentRecord.value = row;
  auditForm.auditResult = result;
  auditForm.auditRemark = '';
  auditForm.rejectReason = '';
  auditTitle.value = result === 'approved' ? '批准阶段记录' : '拒绝阶段记录';
  auditDialogVisible.value = true;
};

const submitAudit = async () => {
  try {
    submitting.value = true;
    await stageRecordAPI.audit(currentRecord.value.id, auditForm);
    ElMessage.success('审核成功');
    auditDialogVisible.value = false;
    fetchData();
  } catch (error: any) {
    ElMessage.error(error.message || '审核失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.stage-record-container {
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
