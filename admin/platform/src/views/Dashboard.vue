<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" v-sound:hover>
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalOrganizers }}</div>
              <div class="stat-label">{{ t('dashboard.totalOrganizers') }}</div>
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
              <div class="stat-value">{{ stats.totalExhibitions }}</div>
              <div class="stat-label">{{ t('dashboard.totalExhibitions') }}</div>
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
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">{{ t('dashboard.totalUsers') }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" v-sound:hover>
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatRevenue(stats.totalRevenue) }}</div>
              <div class="stat-label">{{ t('dashboard.totalRevenue') }}</div>
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
              <span>{{ t('dashboard.revenueTrend') }}</span>
            </div>
          </template>
          <div ref="revenueChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card v-sound:hover>
          <template #header>
            <div class="card-header">
              <span>{{ t('dashboard.packageDistribution') }}</span>
            </div>
          </template>
          <div ref="packageChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card v-sound:hover>
          <template #header>
            <div class="card-header">
              <el-radio-group v-model="rankingPeriod" @change="loadRankings" v-sound:click>
                <el-radio-button value="week" v-sound:click>周排名</el-radio-button>
                <el-radio-button value="month" v-sound:click>月排名</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-tabs v-model="rankingTab" @tab-change="loadRankings" v-sound:click>
            <el-tab-pane :label="t('dashboard.usageRanking')" name="usage">
              <el-table :data="usageRankings" stripe v-loading="loadingRankings">
                <el-table-column type="index" label="排名" width="80" />
                <el-table-column prop="name" :label="t('dashboard.userName')" />
                <el-table-column prop="usageCount" :label="t('dashboard.usageCount')" width="120" />
              </el-table>
            </el-tab-pane>
            <el-tab-pane :label="t('dashboard.loginRanking')" name="login">
              <el-table :data="loginRankings" stripe v-loading="loadingRankings">
                <el-table-column type="index" label="排名" width="80" />
                <el-table-column prop="name" :label="t('dashboard.userName')" />
                <el-table-column prop="loginCount" :label="t('dashboard.loginCount')" width="120" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card v-sound:hover>
          <template #header>
            <div class="card-header">
              <span>{{ t('dashboard.recentData') }}</span>
            </div>
          </template>
          <el-tabs v-model="recentTab" v-sound:click>
            <el-tab-pane :label="t('menu.organizer')" name="organizer">
              <el-table :data="recentOrganizers" stripe>
                <el-table-column prop="name" :label="t('log.organizer')" />
                <el-table-column prop="package" :label="t('log.package')">
                  <template #default="{ row }">
                    <el-tag :type="getPackageType(row.package)">{{ getPackageName(row.package) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" :label="t('common.createTime')">
                  <template #default="{ row }">
                    {{ formatDate(row.createTime) }}
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane :label="t('menu.exhibition')" name="exhibition">
              <el-table :data="recentExhibitions" stripe>
                <el-table-column prop="name" :label="t('log.exhibition')" />
                <el-table-column prop="organizer" :label="t('log.organizer')" />
                <el-table-column prop="startDate" :label="t('dashboard.startDate')">
                  <template #default="{ row }">
                    {{ formatDate(row.startDate) }}
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import request from '../utils/request';
import * as echarts from 'echarts';
import dayjs from 'dayjs';

const { t, locale } = useI18n();

const stats = ref({
  totalOrganizers: 0,
  totalExhibitions: 0,
  totalUsers: 0,
  totalRevenue: 0
});

const revenueChartRef = ref(null);
const packageChartRef = ref(null);
const recentOrganizers = ref([]);
const recentExhibitions = ref([]);
const usageRankings = ref([]);
const loginRankings = ref([]);
const rankingPeriod = ref('week');
const rankingTab = ref('usage');
const recentTab = ref('organizer');
const loadingRankings = ref(false);

let revenueChart = null;
let packageChart = null;

onMounted(() => {
  loadStats();
  loadRecentOrganizers();
  loadRecentExhibitions();
  loadRankings();
  initCharts();
});

onUnmounted(() => {
  if (revenueChart) revenueChart.dispose();
  if (packageChart) packageChart.dispose();
});

async function loadStats() {
  try {
    const data = await request.get('/platform/dashboard/stats');
    stats.value = data;
  } catch (error) {
    console.error('Load stats error:', error);
  }
}

async function loadRecentOrganizers() {
  try {
    const data = await request.get('/platform/dashboard/recent-data');
    recentOrganizers.value = data.organizers || [];
  } catch (error) {
    console.error('Load recent organizers error:', error);
    recentOrganizers.value = [];
  }
}

async function loadRecentExhibitions() {
  try {
    const data = await request.get('/platform/dashboard/recent-data');
    recentExhibitions.value = data.exhibitions || [];
  } catch (error) {
    console.error('Load recent exhibitions error:', error);
    recentExhibitions.value = [];
  }
}

async function loadRankings() {
  loadingRankings.value = true;
  try {
    const period = rankingPeriod.value;
    const data = await request.get(`/platform/dashboard/rankings?period=${period}`);
    usageRankings.value = data.usage || [];
    loginRankings.value = data.login || [];
  } catch (error) {
    console.error('Load rankings error:', error);
    usageRankings.value = [];
    loginRankings.value = [];
  } finally {
    loadingRankings.value = false;
  }
}

function initCharts() {
  initRevenueChart();
  initPackageChart();
}

async function initRevenueChart() {
  revenueChart = echarts.init(revenueChartRef.value);
  
  let dates = [];
  let values = [];
  
  try {
    const data = await request.get('/platform/dashboard/revenue-trend');
    dates = data.dates || [];
    values = data.values || [];
  } catch (error) {
    console.error('Load revenue trend error:', error);
    dates = ['1月', '2月', '3月', '4月', '5月', '6月'];
    values = [0, 0, 0, 0, 0, 0];
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value',
      name: locale.value === 'zh' ? '收入(元)' : 'Revenue (CNY)'
    },
    series: [
      {
        name: locale.value === 'zh' ? '收入' : 'Revenue',
        type: 'line',
        data: values,
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

async function initPackageChart() {
  packageChart = echarts.init(packageChartRef.value);
  
  let data = [];
  
  try {
    const rawData = await request.get('/platform/dashboard/package-distribution');
    const packageNames = {
      free: locale.value === 'zh' ? '免费版' : 'Free',
      professional: locale.value === 'zh' ? '专业版' : 'Professional',
      enterprise: locale.value === 'zh' ? '企业版' : 'Enterprise',
      flagship: locale.value === 'zh' ? '旗舰版' : 'Flagship'
    };
    data = rawData.map(item => ({
      ...item,
      name: packageNames[item.code] || item.name
    }));
  } catch (error) {
    console.error('Load package distribution error:', error);
    const packageNames = {
      free: locale.value === 'zh' ? '免费版' : 'Free',
      professional: locale.value === 'zh' ? '专业版' : 'Professional',
      enterprise: locale.value === 'zh' ? '企业版' : 'Enterprise',
      flagship: locale.value === 'zh' ? '旗舰版' : 'Flagship'
    };
    data = [
      { value: 0, name: packageNames.free },
      { value: 0, name: packageNames.professional },
      { value: 0, name: packageNames.enterprise },
      { value: 0, name: packageNames.flagship }
    ];
  }
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: locale.value === 'zh' ? '套餐分布' : 'Package Distribution',
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
  
  packageChart.setOption(option);
}

function formatRevenue(num) {
  if (locale.value === 'zh') {
    return '¥' + (num / 10000).toFixed(2) + '万';
  }
  return '¥' + num.toLocaleString();
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

function getPackageType(packageCode) {
  const map = {
    'free': 'info',
    'professional': 'warning',
    'enterprise': 'success',
    'flagship': 'danger'
  };
  return map[packageCode] || '';
}

function getPackageName(packageCode) {
  const map = locale.value === 'zh' ? {
    'free': '免费版',
    'professional': '专业版',
    'enterprise': '企业版',
    'flagship': '旗舰版'
  } : {
    'free': 'Free',
    'professional': 'Professional',
    'enterprise': 'Enterprise',
    'flagship': 'Flagship'
  };
  return map[packageCode] || packageCode;
}
</script>

<style scoped lang="scss">
.dashboard {
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

  .data-row {
    :deep(.el-table) {
      font-size: 13px;
    }
  }
}
</style>
