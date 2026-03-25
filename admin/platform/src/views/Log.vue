<template>
  <div class="log">
    <el-card v-sound:hover>
      <template #header>
        <div class="card-header">
          <span>{{ t('log.title') }}</span>
          <el-button type="primary" @click="showExportDialog" v-sound:click>{{ t('log.exportLog') }}</el-button>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item :label="t('log.user')">
          <el-input v-model="searchForm.user" :placeholder="t('common.search')" clearable v-sound:focus />
        </el-form-item>
        <el-form-item :label="t('log.type')">
          <el-select v-model="searchForm.type" :placeholder="t('common.search')" clearable v-sound:focus>
            <el-option :label="t('log.login')" value="login" v-sound:hover />
            <el-option :label="t('log.create')" value="create" v-sound:hover />
            <el-option :label="t('log.update')" value="update" v-sound:hover />
            <el-option :label="t('log.delete')" value="delete" v-sound:hover />
            <el-option :label="t('log.export')" value="export" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('log.module')">
          <el-select v-model="searchForm.module" :placeholder="t('common.search')" clearable v-sound:focus>
            <el-option :label="t('log.organizer')" value="organizer" v-sound:hover />
            <el-option :label="t('log.exhibition')" value="exhibition" v-sound:hover />
            <el-option :label="t('log.user')" value="user" v-sound:hover />
            <el-option :label="t('log.package')" value="package" v-sound:hover />
            <el-option :label="t('log.finance')" value="finance" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('log.dateRange')">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            range-separator="至"
            :start-placeholder="t('log.startTime')"
            :end-placeholder="t('log.endTime')"
            style="width: 300px"
            v-sound:focus
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" v-sound:click>{{ t('common.search') }}</el-button>
          <el-button @click="handleReset" v-sound:click>{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe v-loading="loading" v-sound:hover>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user" :label="t('log.user')" width="120" />
        <el-table-column prop="type" :label="t('log.type')" width="90">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" :label="t('log.module')" width="90">
          <template #default="{ row }">
            <el-tag :type="getModuleColor(row.module)">{{ getModuleText(row.module) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="t('log.description')" min-width="200" />
        <el-table-column prop="ip" :label="t('log.ip')" width="140" />
        <el-table-column prop="userAgent" :label="t('log.userAgent')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" :label="t('common.status')" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? t('log.success') : t('log.fail') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" :label="t('common.createTime')" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operation')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)" v-sound:click>{{ t('common.view') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" :title="t('log.detail')" width="800px">
      <el-descriptions :column="1" border v-if="currentLog">
        <el-descriptions-item :label="t('log.user')">{{ currentLog.user }}</el-descriptions-item>
        <el-descriptions-item label="ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item :label="t('log.type')">
          <el-tag :type="getTypeColor(currentLog.type)">{{ getTypeText(currentLog.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('log.module')">
          <el-tag :type="getModuleColor(currentLog.module)">{{ getModuleText(currentLog.module) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('log.description')">{{ currentLog.description }}</el-descriptions-item>
        <el-descriptions-item :label="t('log.ip')">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item :label="t('log.userAgent')">{{ currentLog.userAgent }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.status')">
          <el-tag :type="currentLog.status === 'success' ? 'success' : 'danger'">
            {{ currentLog.status === 'success' ? t('log.success') : t('log.fail') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Method">{{ currentLog.method }}</el-descriptions-item>
        <el-descriptions-item label="Path">{{ currentLog.path }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.createTime')">{{ formatDateTime(currentLog.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="Duration">{{ currentLog.duration }}ms</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="exportDialogVisible" :title="t('log.exportTitle')" width="500px">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item :label="t('log.dateRange')">
          <el-date-picker
            v-model="exportForm.dateRange"
            type="datetimerange"
            range-separator="至"
            :start-placeholder="t('log.startTime')"
            :end-placeholder="t('log.endTime')"
            style="width: 100%"
            v-sound:focus
          />
        </el-form-item>
        <el-form-item :label="t('log.type')">
          <el-select v-model="exportForm.type" :placeholder="t('common.search')" clearable style="width: 100%" v-sound:focus>
            <el-option :label="t('log.login')" value="login" v-sound:hover />
            <el-option :label="t('log.create')" value="create" v-sound:hover />
            <el-option :label="t('log.update')" value="update" v-sound:hover />
            <el-option :label="t('log.delete')" value="delete" v-sound:hover />
            <el-option :label="t('log.export')" value="export" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('log.module')">
          <el-select v-model="exportForm.module" :placeholder="t('common.search')" clearable style="width: 100%" v-sound:focus>
            <el-option :label="t('log.organizer')" value="organizer" v-sound:hover />
            <el-option :label="t('log.exhibition')" value="exhibition" v-sound:hover />
            <el-option :label="t('log.user')" value="user" v-sound:hover />
            <el-option :label="t('log.package')" value="package" v-sound:hover />
            <el-option :label="t('log.finance')" value="finance" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.status')">
          <el-select v-model="exportForm.status" :placeholder="t('common.search')" clearable style="width: 100%" v-sound:focus>
            <el-option :label="t('log.success')" value="success" v-sound:hover />
            <el-option :label="t('log.fail')" value="failed" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('log.format')">
          <el-radio-group v-model="exportForm.format" v-sound:click>
            <el-radio value="excel" v-sound:click>Excel</el-radio>
            <el-radio value="csv" v-sound:click>CSV</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportDialogVisible = false" v-sound:click>{{ t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleExport" :loading="exporting" v-sound:click>{{ t('common.export') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import request from '../utils/request';
import dayjs from 'dayjs';

const { t } = useI18n();

const loading = ref(false);
const exporting = ref(false);
const detailDialogVisible = ref(false);
const exportDialogVisible = ref(false);
const tableData = ref([]);
const currentLog = ref(null);

const searchForm = reactive({
  user: '',
  type: '',
  module: '',
  dateRange: []
});

const exportForm = reactive({
  dateRange: [],
  type: '',
  module: '',
  status: '',
  format: 'excel'
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      user: searchForm.user,
      type: searchForm.type,
      module: searchForm.module,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1]
    };
    const data = await request.get('/platform/logs', params);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error('Load logs error:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadData();
}

function handleReset() {
  searchForm.user = '';
  searchForm.type = '';
  searchForm.module = '';
  searchForm.dateRange = [];
  pagination.page = 1;
  loadData();
}

function handleView(row) {
  currentLog.value = row;
  detailDialogVisible.value = true;
}

function showExportDialog() {
  exportDialogVisible.value = true;
}

async function handleExport() {
  exporting.value = true;
  try {
    const params = {
      startDate: exportForm.dateRange?.[0],
      endDate: exportForm.dateRange?.[1],
      type: exportForm.type,
      module: exportForm.module,
      status: exportForm.status,
      format: exportForm.format
    };
    await request.get('/platform/logs/export', params, { responseType: 'blob' });
    ElMessage.success('导出成功');
    exportDialogVisible.value = false;
  } catch (error) {
    console.error('Export error:', error);
    ElMessage.error('导出失败');
  } finally {
    exporting.value = false;
  }
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

function getTypeColor(type) {
  const map = {
    login: 'success',
    create: 'primary',
    update: 'warning',
    delete: 'danger',
    export: 'info'
  };
  return map[type] || '';
}

function getTypeText(type) {
  const map = {
    login: t('log.login'),
    create: t('log.create'),
    update: t('log.update'),
    delete: t('log.delete'),
    export: t('log.export')
  };
  return map[type] || type;
}

function getModuleColor(module) {
  const map = {
    organizer: 'danger',
    exhibition: 'warning',
    user: 'success',
    package: 'primary',
    finance: 'info'
  };
  return map[module] || '';
}

function getModuleText(module) {
  const map = {
    organizer: t('log.organizer'),
    exhibition: t('log.exhibition'),
    user: t('log.user'),
    package: t('log.package'),
    finance: t('log.finance')
  };
  return map[module] || module;
}
</script>

<style scoped lang="scss">
.log {
  .search-form {
    margin-bottom: 20px;
  }

  .json-preview {
    background: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    margin: 0;
    max-height: 300px;
    overflow: auto;
    font-size: 12px;
  }

  .error-info {
    color: #f56c6c;
    padding: 12px;
    background: #fef0f0;
    border-radius: 4px;
  }
}
</style>
