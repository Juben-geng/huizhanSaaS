<template>
  <div class="miniprogram">
    <el-card v-sound:hover>
      <template #header>
        <div class="card-header">
          <span>小程序管理</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" v-sound:click>
        <el-tab-pane label="发布管理" name="publish">
          <div class="publish-section">
            <el-form :model="publishForm" label-width="120px" style="max-width: 600px">
              <el-form-item label="小程序类型">
                <el-radio-group v-model="publishForm.type" v-sound:click>
                  <el-radio value="attendee" v-sound:click>访客端</el-radio>
                  <el-radio value="merchant" v-sound:click>商家端</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="版本号">
                <el-input v-model="publishForm.version" placeholder="如: 1.0.1" v-sound:focus />
              </el-form-item>
              <el-form-item label="发布说明">
                <el-input
                  v-model="publishForm.desc"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入本次更新的内容说明"
                  v-sound:focus
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handlePublish" :loading="publishing" v-sound:click>
                  一键发布
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="publish-progress" v-if="currentPublishTask">
            <el-divider>发布进度</el-divider>
            <el-progress
              :percentage="publishProgress"
              :status="publishStatus === 'success' ? 'success' : publishStatus === 'failed' ? 'exception' : ''"
            />
            <div class="publish-logs" v-if="publishLogs.length > 0">
              <div v-for="(log, index) in publishLogs" :key="index" class="log-item">
                <span class="log-time">{{ formatTime(log.time) }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>

          <div class="publish-history">
            <el-divider>发布历史</el-divider>
            <el-table :data="publishHistory" stripe v-loading="historyLoading" v-sound:hover>
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.type === 'attendee' ? 'primary' : 'success'" v-sound:hover>
                    {{ row.type === 'attendee' ? '访客端' : '商家端' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="version" label="版本" width="100" />
              <el-table-column prop="desc" label="说明" min-width="200" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'success' ? 'success' : 'danger'" v-sound:hover>
                    {{ row.status === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="publishTime" label="发布时间" width="180">
                <template #default="{ row }">
                  {{ formatDateTime(row.publishTime) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button link type="danger" @click="handleDeleteHistory(row)" v-sound:click>
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="小程序配置" name="config">
          <el-form :model="configForm" :rules="configRules" ref="configFormRef" label-width="120px" style="max-width: 600px">
            <el-form-item label="AppID" prop="appId">
              <el-input v-model="configForm.appId" placeholder="请输入微信小程序AppID" v-sound:focus />
            </el-form-item>
            <el-form-item label="App名称" prop="appName">
              <el-input v-model="configForm.appName" placeholder="请输入小程序名称" v-sound:focus />
            </el-form-item>
            <el-form-item label="当前版本">
              <el-tag type="info" v-sound:hover>{{ configForm.version }}</el-tag>
            </el-form-item>
            <el-form-item label="上次发布">
              <span>{{ configForm.lastPublishTime ? formatDateTime(configForm.lastPublishTime) : '暂无' }}</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveConfig" :loading="saving" v-sound:click>
                保存配置
              </el-button>
              <el-button @click="loadConfig" v-sound:click>刷新</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../utils/request';
import dayjs from 'dayjs';

const activeTab = ref('publish');
const publishing = ref(false);
const historyLoading = ref(false);
const saving = ref(false);

const configFormRef = ref(null);

const publishForm = reactive({
  type: 'attendee',
  version: '',
  desc: ''
});

const configForm = reactive({
  appId: '',
  appName: '',
  version: '1.0.0',
  lastPublishTime: null
});

const configRules = {
  appId: [{ required: true, message: '请输入AppID', trigger: 'blur' }],
  appName: [{ required: true, message: '请输入小程序名称', trigger: 'blur' }]
};

const currentPublishTask = ref(null);
const publishProgress = ref(0);
const publishStatus = ref('pending');
const publishLogs = ref([]);
const publishHistory = ref([]);

onMounted(() => {
  loadConfig();
  loadPublishHistory();
});

async function loadConfig() {
  try {
    const data = await request.get('/platform/miniprogram/config');
    Object.assign(configForm, data);
  } catch (error) {
    console.error('Load config error:', error);
  }
}

async function handleSaveConfig() {
  if (!configFormRef.value) return;
  await configFormRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      const data = await request.put('/platform/miniprogram/config', {
        appId: configForm.appId,
        appName: configForm.appName
      });
      Object.assign(configForm, data);
      ElMessage.success('保存成功');
    } catch (error) {
      console.error('Save config error:', error);
      ElMessage.error('保存失败');
    } finally {
      saving.value = false;
    }
  });
}

async function handlePublish() {
  if (!publishForm.version) {
    ElMessage.warning('请输入版本号');
    return;
  }
  
  publishing.value = true;
  currentPublishTask.value = null;
  publishProgress.value = 0;
  publishStatus.value = 'pending';
  publishLogs.value = [];

  try {
    const data = await request.post('/platform/miniprogram/publish', {
      type: publishForm.type,
      version: publishForm.version,
      desc: publishForm.desc
    });

    currentPublishTask.value = data;
    ElMessage.success('发布任务已提交');

    pollPublishStatus(data.taskId);
  } catch (error) {
    console.error('Publish error:', error);
    ElMessage.error('提交发布任务失败');
    publishing.value = false;
  }
}

async function pollPublishStatus(taskId) {
  const interval = setInterval(async () => {
    try {
      const data = await request.get(`/platform/miniprogram/publish/status/${taskId}`);
      
      publishProgress.value = data.progress;
      publishStatus.value = data.status;
      publishLogs.value = data.logs || [];

      if (data.status === 'success' || data.status === 'failed') {
        clearInterval(interval);
        publishing.value = false;
        
        if (data.status === 'success') {
          ElMessage.success('发布成功');
          loadPublishHistory();
          loadConfig();
        } else {
          ElMessage.error('发布失败');
        }
      }
    } catch (error) {
      console.error('Poll publish status error:', error);
      clearInterval(interval);
      publishing.value = false;
    }
  }, 2000);
}

async function loadPublishHistory() {
  historyLoading.value = true;
  try {
    const data = await request.get('/platform/miniprogram/publish/history');
    publishHistory.value = data;
  } catch (error) {
    console.error('Load publish history error:', error);
  } finally {
    historyLoading.value = false;
  }
}

async function handleDeleteHistory(row) {
  try {
    await ElMessageBox.confirm('确认删除这条发布记录吗?', '提示', {
      type: 'warning'
    });

    await request.delete(`/platform/miniprogram/publish/${row.id}`);
    ElMessage.success('删除成功');
    loadPublishHistory();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete history error:', error);
      ElMessage.error('删除失败');
    }
  }
}

function formatTime(date) {
  return dayjs(date).format('HH:mm:ss');
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}
</script>

<style scoped lang="scss">
.miniprogram {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .publish-section {
    margin-bottom: 40px;
  }

  .publish-progress {
    margin-bottom: 40px;

    .publish-logs {
      margin-top: 20px;
      max-height: 300px;
      overflow-y: auto;
      background: #f5f7fa;
      padding: 16px;
      border-radius: 4px;

      .log-item {
        display: flex;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #e4e7ed;

        &:last-child {
          border-bottom: none;
        }

        .log-time {
          color: #909399;
          font-size: 12px;
          min-width: 80px;
        }

        .log-message {
          color: #303133;
          font-size: 14px;
        }
      }
    }
  }

  .publish-history {
    :deep(.el-table) {
      border-radius: 4px;
      overflow: hidden;
    }
  }
}
</style>
