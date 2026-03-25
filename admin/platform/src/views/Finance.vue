<template>
  <div class="finance">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" v-sound:hover>
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatNumber(stats.totalRevenue) }}</div>
              <div class="stat-label">总收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" v-sound:hover>
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatNumber(stats.monthRevenue) }}</div>
              <div class="stat-label">本月收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" v-sound:hover>
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalOrders }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" v-sound:hover>
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeOrganizers }}</div>
              <div class="stat-label">活跃主办方</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card v-sound:hover>
          <template #header>
            <div class="card-header">
              <span>收入趋势</span>
              <el-radio-group v-model="revenuePeriod" size="small" @change="loadRevenueChart">
                <el-radio-button label="week" v-sound:click>本周</el-radio-button>
                <el-radio-button label="month" v-sound:click>本月</el-radio-button>
                <el-radio-button label="year" v-sound:click>本年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="revenueChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card v-sound:hover>
          <template #header>
            <div class="card-header">
              <span>套餐收入占比</span>
            </div>
          </template>
          <div ref="packageRevenueChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card v-sound:hover>
      <template #header>
        <div class="card-header">
          <span>订单记录</span>
          <el-button type="primary" @click="showExportDialog" v-sound:click>导出</el-button>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="输入订单号" clearable v-sound:focus />
        </el-form-item>
        <el-form-item label="主办方">
          <el-input v-model="searchForm.organizer" placeholder="输入主办方名称" clearable v-sound:focus />
        </el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="searchForm.package" placeholder="选择套餐" clearable v-sound:focus>
            <el-option label="免费版" value="free" v-sound:hover />
            <el-option label="专业版" value="professional" v-sound:hover />
            <el-option label="企业版" value="enterprise" v-sound:hover />
            <el-option label="旗舰版" value="flagship" v-sound:hover />
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
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="organizer" label="主办方" width="150" />
        <el-table-column prop="package" label="套餐" width="100">
          <template #default="{ row }">
            <el-tag :type="getPackageType(row.package)">{{ getPackageName(row.package) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusType(row.status)">{{ getOrderStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payTime" label="支付时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.payTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)" v-sound:click>查看</el-button>
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
          @size-change="loadOrders"
          @current-change="loadOrders"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="订单详情" width="600px">
      <el-descriptions :column="1" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="主办方">{{ currentOrder.organizer }}</el-descriptions-item>
        <el-descriptions-item label="套餐">
          <el-tag :type="getPackageType(currentOrder.package)">{{ getPackageName(currentOrder.package) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ currentOrder.amount }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ getPayMethodText(currentOrder.payMethod) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getOrderStatusType(currentOrder.status)">{{ getOrderStatusText(currentOrder.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDateTime(currentOrder.payTime) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentOrder.createTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="exportDialogVisible" title="导出数据" width="500px">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="exportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="exportForm.package" placeholder="选择套餐" clearable style="width: 100%">
            <el-option label="免费版" value="free" />
            <el-option label="专业版" value="professional" />
            <el-option label="企业版" value="enterprise" />
            <el-option label="旗舰版" value="flagship" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="exportForm.status" placeholder="选择状态" clearable style="width: 100%">
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleExport" :loading="exporting">导出</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../utils/request';
import * as echarts from 'echarts';
import dayjs from 'dayjs';

const loading = ref(false);
const exporting = ref(false);
const detailDialogVisible = ref(false);
const exportDialogVisible = ref(false);
const revenuePeriod = ref('month');
const tableData = ref([]);
const currentOrder = ref(null);

const stats = ref({
  totalRevenue: 0,
  monthRevenue: 0,
  totalOrders: 0,
  activeOrganizers: 0
});

const searchForm = reactive({
  orderNo: '',
  organizer: '',
  package: '',
  dateRange: []
});

const exportForm = reactive({
  dateRange: [],
  package: '',
  status: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const revenueChartRef = ref(null);
const packageRevenueChartRef = ref(null);
let revenueChart = null;
let packageRevenueChart = null;

onMounted(() => {
  loadStats();
  loadOrders();
  initCharts();
});

onUnmounted(() => {
  if (revenueChart) revenueChart.dispose();
  if (packageRevenueChart) packageRevenueChart.dispose();
});

async function loadStats() {
  try {
    const data = await request.get('/platform/finance/stats');
    stats.value = data;
  } catch (error) {
    console.error('Load finance stats error:', error);
  }
}

async function loadOrders() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      orderNo: searchForm.orderNo,
      organizer: searchForm.organizer,
      package: searchForm.package,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1]
    };
    const data = await request.get('/platform/finance/orders', params);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error('Load orders error:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadOrders();
}

function handleReset() {
  searchForm.orderNo = '';
  searchForm.organizer = '';
  searchForm.package = '';
  searchForm.dateRange = [];
  pagination.page = 1;
  loadOrders();
}

function handleView(row) {
  currentOrder.value = row;
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
      package: exportForm.package,
      status: exportForm.status
    };
    await request.get('/platform/finance/export', params, { responseType: 'blob' });
    ElMessage.success('导出成功');
    exportDialogVisible.value = false;
  } catch (error) {
    console.error('Export error:', error);
    ElMessage.error('导出失败');
  } finally {
    exporting.value = false;
  }
}

function initCharts() {
  initRevenueChart();
  initPackageRevenueChart();
}

async function initRevenueChart() {
  revenueChart = echarts.init(revenueChartRef.value);
  
  const data = await request.get('/platform/finance/revenue-trend', { period: revenuePeriod.value });
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.dates
    },
    yAxis: {
      type: 'value',
      name: '收入(元)'
    },
    series: [
      {
        name: '收入',
        type: 'line',
        data: data.values,
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.5)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        itemStyle: {
          color: '#667eea'
        }
      }
    ]
  };
  
  revenueChart.setOption(option);
}

async function initPackageRevenueChart() {
  packageRevenueChart = echarts.init(packageRevenueChartRef.value);
  
  const data = await request.get('/platform/finance/package-revenue');
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '套餐收入',
        type: 'pie',
        radius: ['40%', '70%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
  
  packageRevenueChart.setOption(option);
}

async function loadRevenueChart() {
  await initRevenueChart();
}

function formatNumber(num) {
  return (num / 10000).toFixed(2) + '万';
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

function getPackageType(pkg) {
  const map = {
    free: '',
    professional: 'warning',
    enterprise: 'success',
    flagship: 'danger'
  };
  return map[pkg] || '';
}

function getPackageName(pkg) {
  const map = {
    free: '免费版',
    professional: '专业版',
    enterprise: '企业版',
    flagship: '旗舰版'
  };
  return map[pkg] || pkg;
}

function getOrderStatusType(status) {
  const map = {
    pending: 'warning',
    paid: 'success',
    cancelled: 'info'
  };
  return map[status] || '';
}

function getOrderStatusText(status) {
  const map = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消'
  };
  return map[status] || status;
}

function getPayMethodText(method) {
  const map = {
    wechat: '微信支付',
    alipay: '支付宝',
    bank: '银行转账'
  };
  return map[method] || method;
}
</script>

<style scoped lang="scss">
.finance {
  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 24px;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .charts-row {
    margin-bottom: 20px;

    .chart {
      height: 350px;
    }
  }

  .search-form {
    margin-bottom: 20px;
  }
}
</style>
