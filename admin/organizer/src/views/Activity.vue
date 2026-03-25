<template>
  <div class="activity">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>活动管理</span>
          <el-button type="primary" @click="showCreateDialog">创建活动</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索活动名称"
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
        <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 120px">
          <el-option label="未开始" value="upcoming" />
          <el-option label="进行中" value="ongoing" />
          <el-option label="已结束" value="ended" />
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

      <el-table :data="activityList" stripe v-loading="loading">
        <el-table-column prop="activityId" label="ID" width="80" />
        <el-table-column prop="name" label="活动名称" min-width="180" />
        <el-table-column prop="exhibitionName" label="展会" width="150" />
        <el-table-column label="活动时间" width="200">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }} - {{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="活动地点" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="participantCount" label="参与人数" width="90" />
        <el-table-column prop="maxParticipants" label="最大人数" width="90" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="editActivity(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="viewParticipants(row)">参与者</el-button>
            <el-button type="danger" link size="small" @click="deleteActivity(row)">删除</el-button>
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
          @size-change="loadActivities"
          @current-change="loadActivities"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="展会" prop="exhibitionId">
          <el-select v-model="form.exhibitionId" placeholder="选择展会" style="width: 100%">
            <el-option
              v-for="exhibition in exhibitionList"
              :key="exhibition.exhibitionId"
              :label="exhibition.name"
              :value="exhibition.exhibitionId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入活动名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-select v-model="form.type" placeholder="选择活动类型" style="width: 100%">
            <el-option label="论坛" value="forum" />
            <el-option label="发布会" value="launch" />
            <el-option label="交流会" value="meetup" />
            <el-option label="抽奖活动" value="lottery" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="form.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入活动地点" maxlength="100" />
        </el-form-item>
        <el-form-item label="最大人数" prop="maxParticipants">
          <el-input-number v-model="form.maxParticipants" :min="1" :max="10000" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入活动描述"
            :rows="4"
            maxlength="500"
          />
        </el-form-item>
        <el-form-item label="活动图片" prop="images">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :file-list="imageList"
            list-type="picture-card"
            :on-success="handleImageSuccess"
            :on-remove="handleImageRemove"
            :before-upload="beforeUpload"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="奖品设置" v-if="form.type === 'lottery'">
          <div class="prize-list">
            <div v-for="(prize, index) in form.prizes" :key="index" class="prize-item">
              <el-input v-model="prize.name" placeholder="奖品名称" style="width: 150px; margin-right: 10px" />
              <el-input-number v-model="prize.quantity" :min="1" placeholder="数量" style="width: 120px; margin-right: 10px" />
              <el-button type="danger" icon="Delete" circle size="small" @click="removePrize(index)" />
            </div>
            <el-button type="primary" size="small" @click="addPrize">添加奖品</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="活动详情" width="800px">
      <div class="detail-content" v-if="currentActivity">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="活动名称" :span="2">{{ currentActivity.name }}</el-descriptions-item>
          <el-descriptions-item label="展会">{{ currentActivity.exhibitionName }}</el-descriptions-item>
          <el-descriptions-item label="活动类型">{{ getActivityTypeText(currentActivity.type) }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatDateTime(currentActivity.startTime) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatDateTime(currentActivity.endTime) }}</el-descriptions-item>
          <el-descriptions-item label="活动地点" :span="2">{{ currentActivity.location }}</el-descriptions-item>
          <el-descriptions-item label="参与人数">{{ currentActivity.participantCount }}</el-descriptions-item>
          <el-descriptions-item label="最大人数">{{ currentActivity.maxParticipants }}</el-descriptions-item>
          <el-descriptions-item label="活动描述" :span="2">
            {{ currentActivity.description || '暂无描述' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="section-title" v-if="currentActivity.images?.length">活动图片</div>
        <div class="image-list" v-if="currentActivity.images?.length">
          <el-image
            v-for="(image, index) in currentActivity.images"
            :key="index"
            :src="image"
            :preview-src-list="currentActivity.images"
            fit="cover"
            style="width: 150px; height: 100px; margin-right: 10px; border-radius: 4px"
          />
        </div>

        <div class="section-title" v-if="currentActivity.type === 'lottery' && currentActivity.prizes?.length">奖品设置</div>
        <div class="prize-display" v-if="currentActivity.type === 'lottery' && currentActivity.prizes?.length">
          <div v-for="(prize, index) in currentActivity.prizes" :key="index" class="prize-item">
            <el-tag>{{ prize.name }}</el-tag>
            <span class="prize-quantity">× {{ prize.quantity }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="participantsVisible" title="参与者列表" width="800px">
      <el-table :data="participantsList" stripe>
        <el-table-column prop="userId" label="ID" width="80" />
        <el-table-column label="参与者" min-width="150">
          <template #default="{ row }">
            <div class="participant-info">
              <el-avatar :src="row.avatar || '/default-avatar.png'" size="small" />
              <span class="participant-name">{{ row.nickName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="company" label="公司" />
        <el-table-column label="参与时间" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.joinTime) }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="participantsList.length === 0" description="暂无参与者" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import { request } from '../utils/request';
import dayjs from 'dayjs';

const loading = ref(false);
const dialogVisible = ref(false);
const detailVisible = ref(false);
const participantsVisible = ref(false);
const dialogTitle = ref('创建活动');
const submitting = ref(false);
const formRef = ref(null);
const currentActivity = ref(null);
const participantsList = ref([]);
const imageList = ref([]);

const searchForm = reactive({
  keyword: '',
  exhibitionId: '',
  status: '',
  dateRange: []
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0
});

const activityList = ref([]);
const exhibitionList = ref([]);

const form = reactive({
  activityId: null,
  exhibitionId: '',
  name: '',
  type: '',
  timeRange: [],
  location: '',
  maxParticipants: 100,
  description: '',
  images: [],
  prizes: []
});

const rules = {
  exhibitionId: [{ required: true, message: '请选择展会', trigger: 'change' }],
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  timeRange: [{ required: true, message: '请选择活动时间', trigger: 'change' }],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
  maxParticipants: [{ required: true, message: '请输入最大人数', trigger: 'blur' }],
  description: [{ required: true, message: '请输入活动描述', trigger: 'blur' }]
};

const uploadUrl = computed(() => `${import.meta.env.VITE_API_BASE_URL}/upload/image`);
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}));

onMounted(() => {
  loadExhibitions();
  loadActivities();
});

async function loadExhibitions() {
  try {
    const data = await request.get('/organizer/exhibitions', { pageSize: 100 });
    exhibitionList.value = data.list;
  } catch (error) {
    console.error('Load exhibitions error:', error);
  }
}

async function loadActivities() {
  loading.value = true;
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      exhibitionId: searchForm.exhibitionId || undefined,
      status: searchForm.status || undefined,
      startDate: searchForm.dateRange?.[0] || undefined,
      endDate: searchForm.dateRange?.[1] || undefined
    };

    const result = await request.get('/organizer/activities', params);
    activityList.value = result.list;
    pagination.total = result.total;
  } catch (error) {
    console.error('Load activities error:', error);
    ElMessage.error('加载活动列表失败');
  } finally {
    loading.value = false;
  }
}

function search() {
  pagination.pageNum = 1;
  loadActivities();
}

function resetSearch() {
  searchForm.keyword = '';
  searchForm.exhibitionId = '';
  searchForm.status = '';
  searchForm.dateRange = [];
  pagination.pageNum = 1;
  loadActivities();
}

function showCreateDialog() {
  dialogTitle.value = '创建活动';
  resetForm();
  dialogVisible.value = true;
}

function editActivity(row) {
  dialogTitle.value = '编辑活动';
  form.activityId = row.activityId;
  form.exhibitionId = row.exhibitionId;
  form.name = row.name;
  form.type = row.type;
  form.timeRange = [row.startTime, row.endTime];
  form.location = row.location;
  form.maxParticipants = row.maxParticipants;
  form.description = row.description;
  form.images = row.images || [];
  form.prizes = row.prizes || [];
  imageList.value = (row.images || []).map(url => ({ name: '', url }));
  dialogVisible.value = true;
}

function resetForm() {
  form.activityId = null;
  form.exhibitionId = '';
  form.name = '';
  form.type = '';
  form.timeRange = [];
  form.location = '';
  form.maxParticipants = 100;
  form.description = '';
  form.images = [];
  form.prizes = [];
  imageList.value = [];
}

function addPrize() {
  form.prizes.push({ name: '', quantity: 1 });
}

function removePrize(index) {
  form.prizes.splice(index, 1);
}

async function submitForm() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data = {
        exhibitionId: form.exhibitionId,
        name: form.name,
        type: form.type,
        startTime: form.timeRange[0],
        endTime: form.timeRange[1],
        location: form.location,
        maxParticipants: form.maxParticipants,
        description: form.description,
        images: JSON.stringify(form.images),
        prizes: JSON.stringify(form.prizes)
      };

      if (form.activityId) {
        await request.put(`/organizer/activities/${form.activityId}`, data);
        ElMessage.success('更新成功');
      } else {
        await request.post('/organizer/activities', data);
        ElMessage.success('创建成功');
      }

      dialogVisible.value = false;
      loadActivities();
    } catch (error) {
      console.error('Submit form error:', error);
      ElMessage.error(form.activityId ? '更新失败' : '创建失败');
    } finally {
      submitting.value = false;
    }
  });
}

function viewDetail(row) {
  currentActivity.value = row;
  detailVisible.value = true;
}

async function viewParticipants(row) {
  try {
    const data = await request.get(`/organizer/activities/${row.activityId}/participants`);
    participantsList.value = data;
    participantsVisible.value = true;
  } catch (error) {
    console.error('Load participants error:', error);
    ElMessage.error('加载参与者列表失败');
  }
}

async function deleteActivity(row) {
  try {
    await ElMessageBox.confirm(`确定要删除活动"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await request.delete(`/organizer/activities/${row.activityId}`);
    ElMessage.success('删除成功');
    loadActivities();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete activity error:', error);
      ElMessage.error('删除失败');
    }
  }
}

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB');
    return false;
  }
  return true;
}

function handleImageSuccess(res) {
  if (res.code === 200) {
    form.images.push(res.data.url);
    imageList.value.push({ name: '', url: res.data.url });
    ElMessage.success('上传成功');
  } else {
    ElMessage.error('上传失败');
  }
}

function handleImageRemove(file) {
  const index = form.images.indexOf(file.url);
  if (index > -1) {
    form.images.splice(index, 1);
  }
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

function formatTime(date) {
  return dayjs(date).format('HH:mm');
}

function getStatusType(status) {
  const types = {
    upcoming: 'info',
    ongoing: 'success',
    ended: 'info'
  };
  return types[status] || 'info';
}

function getStatusText(status) {
  const texts = {
    upcoming: '未开始',
    ongoing: '进行中',
    ended: '已结束'
  };
  return texts[status] || '未知';
}

function getActivityTypeText(type) {
  const texts = {
    forum: '论坛',
    launch: '发布会',
    meetup: '交流会',
    lottery: '抽奖活动',
    other: '其他'
  };
  return texts[type] || '未知';
}
</script>

<style scoped lang="scss">
.activity {
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

  .detail-content {
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin: 20px 0 10px 0;
    }

    .image-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .prize-display {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .prize-item {
        display: flex;
        align-items: center;
        gap: 4px;

        .prize-quantity {
          color: #666;
        }
      }
    }
  }

  .prize-list {
    .prize-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
  }

  .participant-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .participant-name {
      font-weight: bold;
    }
  }
}
</style>
