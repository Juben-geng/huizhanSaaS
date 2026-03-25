<template>
  <div class="visitor">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>访客管理</span>
          <el-button type="primary" @click="exportData">导出数据</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索姓名/手机号/公司"
          clearable
          style="width: 200px"
        />
        <el-select v-model="searchForm.exhibitionId" placeholder="展会" clearable style="width: 150px">
          <el-option
            v-for="exhibition in exhibitionList"
            :key="exhibition.exhibitionId"
            :label="exhibition.name"
            :value="exhibition.exhibitionId"
          />
        </el-select>
        <el-select v-model="searchForm.industry" placeholder="行业" clearable style="width: 120px">
          <el-option label="科技" value="科技" />
          <el-option label="金融" value="金融" />
          <el-option label="制造" value="制造" />
          <el-option label="教育" value="教育" />
          <el-option label="医疗" value="医疗" />
          <el-option label="其他" value="其他" />
        </el-select>
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
        <el-button type="primary" @click="search">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="visitorList" stripe v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="userId" label="ID" width="80" />
        <el-table-column label="访客信息" min-width="200">
          <template #default="{ row }">
            <div class="visitor-info">
              <el-avatar :src="row.avatar || '/default-avatar.png'" size="small" />
              <div>
                <div class="visitor-name">{{ row.nickName }}</div>
                <div class="visitor-phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="company" label="公司" width="150" />
        <el-table-column prop="industry" label="行业" width="100" />
        <el-table-column prop="position" label="职位" width="100" />
        <el-table-column prop="scanCount" label="扫码次数" width="80" />
        <el-table-column prop="connectionCount" label="连接数" width="80" />
        <el-table-column label="首次访问" width="120">
          <template #default="{ row }">
            {{ formatDate(row.firstVisitTime) }}
          </template>
        </el-table-column>
        <el-table-column label="最后访问" width="120">
          <template #default="{ row }">
            {{ formatDate(row.lastVisitTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="viewTrajectory(row)">轨迹</el-button>
            <el-button type="primary" link size="small" @click="viewConnections(row)">连接</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadVisitors"
          @current-change="loadVisitors"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="访客详情" width="800px">
      <div class="detail-content" v-if="currentVisitor">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ currentVisitor.nickName }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentVisitor.phone }}</el-descriptions-item>
          <el-descriptions-item label="公司">{{ currentVisitor.company }}</el-descriptions-item>
          <el-descriptions-item label="行业">{{ currentVisitor.industry }}</el-descriptions-item>
          <el-descriptions-item label="职位">{{ currentVisitor.position }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentVisitor.email }}</el-descriptions-item>
          <el-descriptions-item label="扫码次数">{{ currentVisitor.scanCount }}</el-descriptions-item>
          <el-descriptions-item label="连接数">{{ currentVisitor.connectionCount }}</el-descriptions-item>
          <el-descriptions-item label="首次访问">{{ formatDate(currentVisitor.firstVisitTime) }}</el-descriptions-item>
          <el-descriptions-item label="最后访问">{{ formatDate(currentVisitor.lastVisitTime) }}</el-descriptions-item>
          <el-descriptions-item label="个人简介" :span="2">
            {{ currentVisitor.introduction || '暂无简介' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="section-title">扫码记录</div>
        <el-table :data="currentVisitor.scanRecords" stripe max-height="300">
          <el-table-column prop="boothNumber" label="展位号" width="100" />
          <el-table-column prop="merchantName" label="商家名称" />
          <el-table-column label="扫码时间" width="150">
            <template #default="{ row }">
              {{ formatDateTime(row.scanTime) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="trajectoryVisible" title="访问轨迹" width="800px">
      <div class="trajectory-content" v-if="currentVisitor">
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in trajectoryList"
            :key="index"
            :timestamp="formatDateTime(item.timestamp)"
            placement="top"
          >
            <el-card>
              <div class="trajectory-item">
                <div class="trajectory-action">{{ item.action }}</div>
                <div class="trajectory-detail">{{ item.detail }}</div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="trajectoryList.length === 0" description="暂无轨迹记录" />
      </div>
    </el-dialog>

    <el-dialog v-model="connectionsVisible" title="连接记录" width="800px">
      <div class="connections-content" v-if="currentVisitor">
        <el-table :data="connectionsList" stripe>
          <el-table-column label="商家信息" min-width="200">
            <template #default="{ row }">
              <div class="connection-info">
                <el-avatar :src="row.avatar || '/default-avatar.png'" size="small" />
                <div>
                  <div class="merchant-name">{{ row.companyName }}</div>
                  <div class="contact-name">{{ row.contactName }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="boothNumber" label="展位号" width="100" />
          <el-table-column prop="industry" label="行业" width="100" />
          <el-table-column label="连接时间" width="150">
            <template #default="{ row }">
              {{ formatDateTime(row.connectionTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewMerchant(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="connectionsList.length === 0" description="暂无连接记录" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { request } from '../utils/request';
import dayjs from 'dayjs';

const loading = ref(false);
const detailVisible = ref(false);
const trajectoryVisible = ref(false);
const connectionsVisible = ref(false);
const currentVisitor = ref(null);
const trajectoryList = ref([]);
const connectionsList = ref([]);

const searchForm = reactive({
  keyword: '',
  exhibitionId: '',
  industry: '',
  dateRange: []
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0
});

const visitorList = ref([]);
const exhibitionList = ref([]);

onMounted(() => {
  loadExhibitions();
  loadVisitors();
});

async function loadExhibitions() {
  try {
    const data = await request.get('/organizer/exhibitions', { pageSize: 100 });
    exhibitionList.value = data.list;
  } catch (error) {
    console.error('Load exhibitions error:', error);
  }
}

async function loadVisitors() {
  loading.value = true;
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      exhibitionId: searchForm.exhibitionId || undefined,
      industry: searchForm.industry || undefined,
      startDate: searchForm.dateRange?.[0] || undefined,
      endDate: searchForm.dateRange?.[1] || undefined
    };

    const result = await request.get('/organizer/visitors', params);
    visitorList.value = result.list;
    pagination.total = result.total;
  } catch (error) {
    console.error('Load visitors error:', error);
    ElMessage.error('加载访客列表失败');
  } finally {
    loading.value = false;
  }
}

function search() {
  pagination.pageNum = 1;
  loadVisitors();
}

function resetSearch() {
  searchForm.keyword = '';
  searchForm.exhibitionId = '';
  searchForm.industry = '';
  searchForm.dateRange = [];
  pagination.pageNum = 1;
  loadVisitors();
}

async function viewDetail(row) {
  try {
    const data = await request.get(`/organizer/visitors/${row.userId}/detail`);
    currentVisitor.value = data;
    detailVisible.value = true;
  } catch (error) {
    console.error('Load visitor detail error:', error);
    ElMessage.error('加载访客详情失败');
  }
}

async function viewTrajectory(row) {
  try {
    const data = await request.get(`/organizer/visitors/${row.userId}/trajectory`);
    currentVisitor.value = row;
    trajectoryList.value = data;
    trajectoryVisible.value = true;
  } catch (error) {
    console.error('Load visitor trajectory error:', error);
    ElMessage.error('加载访问轨迹失败');
  }
}

async function viewConnections(row) {
  try {
    const data = await request.get(`/organizer/visitors/${row.userId}/connections`);
    currentVisitor.value = row;
    connectionsList.value = data;
    connectionsVisible.value = true;
  } catch (error) {
    console.error('Load visitor connections error:', error);
    ElMessage.error('加载连接记录失败');
  }
}

function viewMerchant(row) {
  ElMessage.info('跳转到商家详情');
}

async function exportData() {
  try {
    await request.get('/organizer/visitors/export', {
      responseType: 'blob'
    });
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('Export data error:', error);
    ElMessage.error('导出失败');
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}
</script>

<style scoped lang="scss">
.visitor {
  .search-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .visitor-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .visitor-name {
      font-weight: bold;
    }

    .visitor-phone {
      font-size: 12px;
      color: #999;
    }
  }

  .detail-content {
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin: 20px 0 10px 0;
    }
  }

  .trajectory-content {
    .trajectory-item {
      .trajectory-action {
        font-weight: bold;
        margin-bottom: 4px;
      }

      .trajectory-detail {
        color: #666;
        font-size: 14px;
      }
    }
  }

  .connections-content {
    .connection-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .merchant-name {
        font-weight: bold;
      }

      .contact-name {
        font-size: 12px;
        color: #999;
      }
    }
  }
}
</style>
