<template>
  <div class="exhibition">
    <el-card v-sound:hover>
      <template #header>
        <div class="card-header">
          <span>展会管理</span>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="展会名称/主办方" clearable v-sound:focus />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable v-sound:focus>
            <el-option label="未开始" value="upcoming" v-sound:hover />
            <el-option label="进行中" value="ongoing" v-sound:hover />
            <el-option label="已结束" value="ended" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
            v-sound:focus
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" v-sound:click>搜索</el-button>
          <el-button @click="handleReset" v-sound:click>重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe v-loading="loading" v-sound:hover>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="展会名称" min-width="150" />
        <el-table-column prop="organizer" label="主办方" width="150" />
        <el-table-column prop="startDate" label="开始日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="endDate" label="结束日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="merchantCount" label="商家数" width="80" />
        <el-table-column prop="visitorCount" label="访客数" width="80" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)" v-sound:click>查看</el-button>
            <el-button link type="danger" @click="handleDelete(row)" v-sound:click>删除</el-button>
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

    <el-dialog v-model="detailDialogVisible" title="展会详情" width="800px">
      <el-descriptions :column="2" border v-if="currentExhibition">
        <el-descriptions-item label="展会名称">{{ currentExhibition.name }}</el-descriptions-item>
        <el-descriptions-item label="主办方">{{ currentExhibition.organizer }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ formatDate(currentExhibition.startDate) }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ formatDate(currentExhibition.endDate) }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{ currentExhibition.location }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentExhibition.status)">{{ getStatusText(currentExhibition.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="商家数量">{{ currentExhibition.merchantCount }}</el-descriptions-item>
        <el-descriptions-item label="访客数量">{{ currentExhibition.visitorCount }}</el-descriptions-item>
        <el-descriptions-item label="连接数量">{{ currentExhibition.connectionCount }}</el-descriptions-item>
        <el-descriptions-item label="活动数量">{{ currentExhibition.activityCount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDate(currentExhibition.createTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../utils/request';
import dayjs from 'dayjs';

const loading = ref(false);
const detailDialogVisible = ref(false);
const tableData = ref([]);
const currentExhibition = ref(null);

const searchForm = reactive({
  keyword: '',
  status: '',
  dateRange: []
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
      keyword: searchForm.keyword,
      status: searchForm.status,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1]
    };
    const data = await request.get('/platform/exhibitions', params);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error('Load exhibitions error:', error);
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
  searchForm.keyword = '';
  searchForm.status = '';
  searchForm.dateRange = [];
  pagination.page = 1;
  loadData();
}

function handleView(row) {
  currentExhibition.value = row;
  detailDialogVisible.value = true;
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该展会吗？删除后无法恢复！', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await request.delete(`/platform/exhibitions/${row.id}`);
    ElMessage.success('删除成功');
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete exhibition error:', error);
      ElMessage.error('删除失败');
    }
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

function getStatusType(status) {
  const map = {
    upcoming: 'info',
    ongoing: 'success',
    ended: ''
  };
  return map[status] || '';
}

function getStatusText(status) {
  const map = {
    upcoming: '未开始',
    ongoing: '进行中',
    ended: '已结束'
  };
  return map[status] || status;
}
</script>

<style scoped lang="scss">
.exhibition {
  .search-form {
    margin-bottom: 20px;
  }
}
</style>
