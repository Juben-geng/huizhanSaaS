<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #1890ff">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalVisitors }}</div>
            <div class="stat-label">总访客数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #52c41a">
            <el-icon><Shop /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalMerchants }}</div>
            <div class="stat-label">参展商家</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #faad14">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalConnections }}</div>
            <div class="stat-label">建立连接</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #ff4d4f">
            <el-icon><ChatLineRound /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalMessages }}</div>
            <div class="stat-label">消息总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>访客趋势</span>
              <el-radio-group v-model="visitorChartPeriod" size="small">
                <el-radio-button label="day">日</el-radio-button>
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="visitorChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>行业分布</span>
          </template>
          <div ref="industryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="tables-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>实时访客</span>
              <el-button type="primary" link size="small" @click="viewAllVisitors">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentVisitors" stripe>
            <el-table-column prop="nickName" label="姓名" width="100" />
            <el-table-column prop="company" label="公司" />
            <el-table-column prop="industry" label="行业" width="80" />
            <el-table-column prop="scanTime" label="扫描时间" width="120" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>热门展位</span>
              <el-button type="primary" link size="small" @click="viewAllMerchants">查看全部</el-button>
            </div>
          </template>
          <el-table :data="hotBooths" stripe>
            <el-table-column prop="boothNumber" label="展位号" width="100" />
            <el-table-column prop="merchantName" label="商家名称" />
            <el-table-column prop="visitorCount" label="访客数" width="80" />
            <el-table-column label="热度" width="80">
              <template #default="{ row }">
                <el-tag :type="row.visitorCount >= 50 ? 'danger' : row.visitorCount >= 20 ? 'warning' : 'success'">
                  {{ row.visitorCount >= 50 ? '高' : row.visitorCount >= 20 ? '中' : '低' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="activity-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>正在进行的活动</span>
              <el-button type="primary" link size="small" @click="manageActivities">管理活动</el-button>
            </div>
          </template>
          <div class="activity-list">
            <div v-for="activity in ongoingActivities" :key="activity.activityId" class="activity-item">
              <div class="activity-info">
                <el-tag :type="activity.status === 'ongoing' ? 'danger' : 'success'" size="small">
                  {{ activity.status === 'ongoing' ? '进行中' : '即将开始' }}
                </el-tag>
                <span class="activity-name">{{ activity.name }}</span>
                <span class="activity-time">{{ activity.startTime }} - {{ activity.endTime }}</span>
                <span class="activity-participants">{{ activity.participantCount }}人参与</span>
              </div>
              <div class="activity-actions">
                <el-button type="primary" size="small" @click="viewActivity(activity.activityId)">查看详情</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { request } from '../utils/request';

const router = useRouter();

const stats = ref({
  totalVisitors: 0,
  totalMerchants: 0,
  totalConnections: 0,
  totalMessages: 0
});

const visitorChartPeriod = ref('day');
const visitorChartRef = ref(null);
const industryChartRef = ref(null);
const recentVisitors = ref([]);
const hotBooths = ref([]);
const ongoingActivities = ref([]);

let visitorChart = null;
let industryChart = null;

onMounted(async () => {
  await loadStats();
  initCharts();
  loadRecentVisitors();
  loadHotBooths();
  loadOngoingActivities();
});

watch(visitorChartPeriod, () => {
  loadVisitorChartData();
});

async function loadStats() {
  try {
    const data = await request.get('/organizer/dashboard/stats');
    stats.value = data;
  } catch (error) {
    console.error('Load stats error:', error);
  }
}

function initCharts() {
  visitorChart = echarts.init(visitorChartRef.value);
  industryChart = echarts.init(industryChartRef.value);

  loadVisitorChartData();
  loadIndustryChartData();

  window.addEventListener('resize', () => {
    visitorChart?.resize();
    industryChart?.resize();
  });
}

async function loadVisitorChartData() {
  try {
    const data = await request.get('/organizer/dashboard/visitor-trend', {
      period: visitorChartPeriod.value
    });

    visitorChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.label)
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: data.map(d => d.value),
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
            ]
          }
        },
        itemStyle: {
          color: '#1890ff'
        }
      }]
    });
  } catch (error) {
    console.error('Load visitor chart data error:', error);
  }
}

async function loadIndustryChartData() {
  try {
    const data = await request.get('/organizer/dashboard/industry-distribution');

    industryChart.setOption({
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data.map(d => ({
          name: d.industry,
          value: d.count
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    });
  } catch (error) {
    console.error('Load industry chart data error:', error);
  }
}

async function loadRecentVisitors() {
  try {
    const data = await request.get('/organizer/dashboard/recent-visitors', {
      limit: 5
    });
    recentVisitors.value = data;
  } catch (error) {
    console.error('Load recent visitors error:', error);
  }
}

async function loadHotBooths() {
  try {
    const data = await request.get('/organizer/dashboard/hot-booths', {
      limit: 5
    });
    hotBooths.value = data;
  } catch (error) {
    console.error('Load hot booths error:', error);
  }
}

async function loadOngoingActivities() {
  try {
    const data = await request.get('/organizer/dashboard/ongoing-activities', {
      limit: 5
    });
    ongoingActivities.value = data;
  } catch (error) {
    console.error('Load ongoing activities error:', error);
  }
}

function viewAllVisitors() {
  router.push('/visitor');
}

function viewAllMerchants() {
  router.push('/merchant');
}

function manageActivities() {
  router.push('/activity');
}

function viewActivity(activityId) {
  router.push(`/activity/detail/${activityId}`);
}
</script>

<style scoped lang="scss">
.dashboard {
  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      display: flex;
      align-items: center;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;

        .el-icon {
          font-size: 28px;
          color: #fff;
        }
      }

      .stat-content {
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .stat-label {
          color: #666;
          font-size: 14px;
        }
      }
    }
  }

  .charts-row,
  .tables-row,
  .activity-row {
    margin-bottom: 20px;

    .chart-container {
      height: 300px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .activity-list {
    .activity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .activity-info {
        display: flex;
        align-items: center;
        gap: 16px;

        .activity-name {
          font-weight: bold;
        }

        .activity-time,
        .activity-participants {
          color: #666;
        }
      }
    }
  }
}
</style>
