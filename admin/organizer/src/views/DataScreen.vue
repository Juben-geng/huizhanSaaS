<template>
  <div class="data-screen">
    <div class="screen-header">
      <h1>{{ exhibitionName }} - 数据大屏</h1>
      <div class="header-info">
        <span class="time">{{ currentTime }}</span>
        <span class="date">{{ currentDate }}</span>
      </div>
    </div>

    <div class="screen-content">
      <div class="top-row">
        <div class="card stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ realtimeStats.totalVisitors }}</div>
              <div class="stat-label">总访客数</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ realtimeStats.onlineVisitors }}</div>
              <div class="stat-label">在线访客</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <el-icon><Shop /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ realtimeStats.totalMerchants }}</div>
              <div class="stat-label">参展商家</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ realtimeStats.totalConnections }}</div>
              <div class="stat-label">建立连接</div>
            </div>
          </div>
        </div>
      </div>

      <div class="middle-row">
        <div class="card chart-card">
          <div class="card-title">访客实时趋势</div>
          <div ref="visitorTrendChartRef" class="chart"></div>
        </div>
        <div class="card chart-card">
          <div class="card-title">行业分布</div>
          <div ref="industryChartRef" class="chart"></div>
        </div>
      </div>

      <div class="bottom-row">
        <div class="card map-card">
          <div class="card-title">展位热力图</div>
          <div class="heatmap-container">
            <div
              v-for="booth in boothHeatmap"
              :key="booth.boothId"
              class="heatmap-item"
              :class="getHeatmapClass(booth.visitorCount)"
              :title="`${booth.boothNumber}: ${booth.visitorCount}人`"
              @click="showBoothDetail(booth)"
            >
              <span class="booth-number">{{ booth.boothNumber }}</span>
              <span class="visitor-count">{{ booth.visitorCount }}</span>
            </div>
          </div>
        </div>

        <div class="card ranking-card">
          <div class="card-title">热门展位TOP10</div>
          <div class="ranking-list">
            <div v-for="(item, index) in topBooths" :key="item.boothId" class="ranking-item">
              <div class="rank" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
              <div class="booth-info">
                <div class="booth-number">{{ item.boothNumber }}</div>
                <div class="merchant-name">{{ item.merchantName }}</div>
              </div>
              <div class="visitor-count">{{ item.visitorCount }}</div>
            </div>
          </div>
        </div>

        <div class="card activity-card">
          <div class="card-title">实时活动</div>
          <div class="activity-list">
            <div v-for="activity in realtimeActivities" :key="activity.activityId" class="activity-item">
              <el-tag :type="activity.status === 'ongoing' ? 'danger' : 'success'" size="small">
                {{ activity.status === 'ongoing' ? '进行中' : '即将开始' }}
              </el-tag>
              <div class="activity-info">
                <div class="activity-name">{{ activity.name }}</div>
                <div class="activity-time">{{ activity.startTime }}</div>
              </div>
              <div class="activity-participants">{{ activity.participantCount }}人</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { request } from '../utils/request';
import dayjs from 'dayjs';

const exhibitionName = ref('2024智能科技展');
const currentDate = ref('');
const currentTime = ref('');
const visitorTrendChartRef = ref(null);
const industryChartRef = ref(null);

const realtimeStats = reactive({
  totalVisitors: 0,
  onlineVisitors: 0,
  totalMerchants: 0,
  totalConnections: 0
});

const boothHeatmap = ref([]);
const topBooths = ref([]);
const realtimeActivities = ref([]);

let visitorTrendChart = null;
let industryChart = null;
let updateTimer = null;
let socket = null;

onMounted(() => {
  updateTime();
  updateTimer = setInterval(updateTime, 1000);
  initCharts();
  loadRealtimeData();
  initSocket();
});

onUnmounted(() => {
  if (updateTimer) clearInterval(updateTimer);
  if (socket) socket.disconnect();
  visitorTrendChart?.dispose();
  industryChart?.dispose();
});

function updateTime() {
  currentDate.value = dayjs().format('YYYY年MM月DD日');
  currentTime.value = dayjs().format('HH:mm:ss');
}

function initCharts() {
  visitorTrendChart = echarts.init(visitorTrendChartRef.value);
  industryChart = echarts.init(industryChartRef.value);

  initVisitorTrendChart();
  initIndustryChart();

  window.addEventListener('resize', () => {
    visitorTrendChart?.resize();
    industryChart?.resize();
  });
}

function initVisitorTrendChart() {
  visitorTrendChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [],
      axisLabel: {
        color: '#999'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#999'
      },
      splitLine: {
        lineStyle: {
          color: '#eee'
        }
      }
    },
    series: [{
      name: '访客数',
      type: 'line',
      smooth: true,
      data: [],
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.1)' }
          ]
        }
      },
      itemStyle: {
        color: '#667eea'
      },
      lineStyle: {
        width: 3
      }
    }]
  });
}

function initIndustryChart() {
  industryChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      textStyle: {
        color: '#333'
      }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        formatter: '{b}: {c} ({d}%)'
      }
    }]
  });
}

async function loadRealtimeData() {
  try {
    const [stats, trend, industry, heatmap, top, activities] = await Promise.all([
      request.get('/organizer/data-screen/realtime-stats'),
      request.get('/organizer/data-screen/visitor-trend'),
      request.get('/organizer/data-screen/industry-distribution'),
      request.get('/organizer/data-screen/booth-heatmap'),
      request.get('/organizer/data-screen/top-booths'),
      request.get('/organizer/data-screen/realtime-activities')
    ]);

    Object.assign(realtimeStats, stats);
    boothHeatmap.value = heatmap;
    topBooths.value = top;
    realtimeActivities.value = activities;

    updateVisitorTrendChart(trend);
    updateIndustryChart(industry);
  } catch (error) {
    console.error('Load realtime data error:', error);
  }
}

function updateVisitorTrendChart(data) {
  visitorTrendChart.setOption({
    xAxis: {
      data: data.map(d => d.time)
    },
    series: [{
      data: data.map(d => d.count)
    }]
  });
}

function updateIndustryChart(data) {
  industryChart.setOption({
    series: [{
      data: data.map(d => ({
        name: d.industry,
        value: d.count
      }))
    }]
  });
}

function initSocket() {
  socket = io(`${import.meta.env.VITE_API_BASE_URL}`, {
    auth: { token: localStorage.getItem('token') }
  });

  socket.on('connect', () => {
    console.log('Data screen socket connected');
  });

  socket.on('realtime-update', (data) => {
    Object.assign(realtimeStats, data.stats);
    if (data.visitorTrend) {
      updateVisitorTrendChart(data.visitorTrend);
    }
  });

  socket.on('visitor-arrived', (data) => {
    realtimeStats.totalVisitors++;
    realtimeStats.onlineVisitors++;
  });

  socket.on('connection-created', (data) => {
    realtimeStats.totalConnections++;
  });

  socket.on('disconnect', () => {
    console.log('Data screen socket disconnected');
  });
}

function getHeatmapClass(count) {
  if (count >= 50) return 'heatmap-high';
  if (count >= 20) return 'heatmap-medium';
  if (count >= 5) return 'heatmap-low';
  return 'heatmap-cold';
}

function showBoothDetail(booth) {
  console.log('Booth detail:', booth);
}
</script>

<style scoped lang="scss">
.data-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;

  .screen-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 30px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);

    h1 {
      font-size: 28px;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-info {
      display: flex;
      gap: 20px;
      font-size: 16px;

      .time {
        font-weight: bold;
        font-size: 24px;
      }
    }
  }

  .screen-content {
    padding: 20px 30px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);

    .card-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .top-row {
    .stat-card {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;

      .stat-item {
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

          .el-icon {
            font-size: 28px;
            color: #fff;
          }
        }

        .stat-info {
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 14px;
            opacity: 0.8;
          }
        }
      }
    }
  }

  .middle-row {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;

    .chart-card {
      .chart {
        height: 300px;
      }
    }
  }

  .bottom-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 20px;

    .map-card {
      .heatmap-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 12px;

        .heatmap-item {
          aspect-ratio: 1;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            transform: scale(1.05);
          }

          .booth-number {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 4px;
          }

          .visitor-count {
            font-size: 12px;
            opacity: 0.8;
          }

          &.heatmap-high {
            background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
          }

          &.heatmap-medium {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.heatmap-low {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.heatmap-cold {
            background: rgba(255, 255, 255, 0.1);
          }
        }
      }
    }

    .ranking-card {
      .ranking-list {
        .ranking-item {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);

          &:last-child {
            border-bottom: none;
          }

          .rank {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 12px;
            background: rgba(255, 255, 255, 0.1);

            &.rank-1 {
              background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
              color: #000;
            }

            &.rank-2 {
              background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
              color: #000;
            }

            &.rank-3 {
              background: linear-gradient(135deg, #cd7f32 0%, #daa06d 100%);
            }
          }

          .booth-info {
            flex: 1;

            .booth-number {
              font-weight: bold;
              margin-bottom: 2px;
            }

            .merchant-name {
              font-size: 12px;
              opacity: 0.7;
            }
          }

          .visitor-count {
            font-weight: bold;
            font-size: 18px;
            color: #4facfe;
          }
        }
      }
    }

    .activity-card {
      .activity-list {
        .activity-item {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);

          &:last-child {
            border-bottom: none;
          }

          .activity-info {
            flex: 1;
            margin: 0 12px;

            .activity-name {
              font-weight: bold;
              margin-bottom: 2px;
            }

            .activity-time {
              font-size: 12px;
              opacity: 0.7;
            }
          }

          .activity-participants {
            font-weight: bold;
            color: #4facfe;
          }
        }
      }
    }
  }
}
</style>
