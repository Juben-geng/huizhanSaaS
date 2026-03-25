<template>
  <div class="exhibition">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>展会管理</span>
          <el-button type="primary" @click="showCreateDialog">创建展会</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索展会名称"
          clearable
          style="width: 200px"
        />
        <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 120px">
          <el-option label="筹备中" value="preparing" />
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

      <el-table :data="exhibitionList" stripe v-loading="loading">
        <el-table-column prop="exhibitionId" label="ID" width="80" />
        <el-table-column prop="name" label="展会名称" min-width="200" />
        <el-table-column prop="venue" label="举办地点" width="150" />
        <el-table-column label="展会时间" width="200">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }} - {{ formatDate(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="merchantCount" label="参展商家" width="100" />
        <el-table-column prop="visitorCount" label="访客数量" width="100" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editExhibition(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="manageMerchants(row)">商家管理</el-button>
            <el-button type="danger" link size="small" @click="deleteExhibition(row)">删除</el-button>
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
          @size-change="loadExhibitions"
          @current-change="loadExhibitions"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="展会名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入展会名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="举办地点" prop="venue">
          <el-input v-model="form.venue" placeholder="请输入举办地点" maxlength="100" />
        </el-form-item>
        <el-form-item label="展会时间" prop="dateRange">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="展会描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入展会描述"
            :rows="4"
            maxlength="500"
          />
        </el-form-item>
        <el-form-item label="封面图片" prop="coverImage">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
          >
            <img v-if="form.coverImage" :src="form.coverImage" class="cover-image" />
            <el-button v-else type="primary">上传封面</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="最大商家数" prop="maxMerchants">
          <el-input-number v-model="form.maxMerchants" :min="1" :max="10000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { request } from '../utils/request';
import dayjs from 'dayjs';

const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('创建展会');
const submitting = ref(false);
const formRef = ref(null);

const searchForm = reactive({
  keyword: '',
  status: '',
  dateRange: []
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0
});

const exhibitionList = ref([]);
const form = reactive({
  exhibitionId: null,
  name: '',
  venue: '',
  dateRange: [],
  description: '',
  coverImage: '',
  maxMerchants: 100
});

const rules = {
  name: [{ required: true, message: '请输入展会名称', trigger: 'blur' }],
  venue: [{ required: true, message: '请输入举办地点', trigger: 'blur' }],
  dateRange: [{ required: true, message: '请选择展会时间', trigger: 'change' }],
  description: [{ required: true, message: '请输入展会描述', trigger: 'blur' }],
  maxMerchants: [{ required: true, message: '请输入最大商家数', trigger: 'blur' }]
};

const uploadUrl = computed(() => `${import.meta.env.VITE_API_BASE_URL}/upload/image`);
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}));

onMounted(() => {
  loadExhibitions();
});

async function loadExhibitions() {
  loading.value = true;
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      startDate: searchForm.dateRange?.[0] || undefined,
      endDate: searchForm.dateRange?.[1] || undefined
    };

    const result = await request.get('/organizer/exhibitions', params);
    exhibitionList.value = result.list;
    pagination.total = result.total;
  } catch (error) {
    console.error('Load exhibitions error:', error);
    ElMessage.error('加载展会列表失败');
  } finally {
    loading.value = false;
  }
}

function search() {
  pagination.pageNum = 1;
  loadExhibitions();
}

function resetSearch() {
  searchForm.keyword = '';
  searchForm.status = '';
  searchForm.dateRange = [];
  pagination.pageNum = 1;
  loadExhibitions();
}

function showCreateDialog() {
  dialogTitle.value = '创建展会';
  resetForm();
  dialogVisible.value = true;
}

function editExhibition(row) {
  dialogTitle.value = '编辑展会';
  form.exhibitionId = row.exhibitionId;
  form.name = row.name;
  form.venue = row.venue;
  form.dateRange = [row.startDate, row.endDate];
  form.description = row.description;
  form.coverImage = row.coverImage;
  form.maxMerchants = row.maxMerchants;
  dialogVisible.value = true;
}

function resetForm() {
  form.exhibitionId = null;
  form.name = '';
  form.venue = '';
  form.dateRange = [];
  form.description = '';
  form.coverImage = '';
  form.maxMerchants = 100;
}

async function submitForm() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data = {
        name: form.name,
        venue: form.venue,
        startDate: form.dateRange[0],
        endDate: form.dateRange[1],
        description: form.description,
        coverImage: form.coverImage,
        maxMerchants: form.maxMerchants
      };

      if (form.exhibitionId) {
        await request.put(`/organizer/exhibitions/${form.exhibitionId}`, data);
        ElMessage.success('更新成功');
      } else {
        await request.post('/organizer/exhibitions', data);
        ElMessage.success('创建成功');
      }

      dialogVisible.value = false;
      loadExhibitions();
    } catch (error) {
      console.error('Submit form error:', error);
      ElMessage.error(form.exhibitionId ? '更新失败' : '创建失败');
    } finally {
      submitting.value = false;
    }
  });
}

function viewDetail(row) {
  ElMessageBox.alert(
    `
    <div style="text-align: left;">
      <p><strong>展会名称:</strong> ${row.name}</p>
      <p><strong>举办地点:</strong> ${row.venue}</p>
      <p><strong>展会时间:</strong> ${formatDate(row.startDate)} - ${formatDate(row.endDate)}</p>
      <p><strong>展会描述:</strong> ${row.description}</p>
      <p><strong>参展商家:</strong> ${row.merchantCount} / ${row.maxMerchants}</p>
      <p><strong>访客数量:</strong> ${row.visitorCount}</p>
    </div>
    `,
    '展会详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  );
}

function manageMerchants(row) {
  ElMessage.info('商家管理功能开发中');
}

async function deleteExhibition(row) {
  try {
    await ElMessageBox.confirm(`确定要删除展会"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await request.delete(`/organizer/exhibitions/${row.exhibitionId}`);
    ElMessage.success('删除成功');
    loadExhibitions();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete exhibition error:', error);
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

function handleUploadSuccess(res) {
  if (res.code === 200) {
    form.coverImage = res.data.url;
    ElMessage.success('上传成功');
  } else {
    ElMessage.error('上传失败');
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

function getStatusType(status) {
  const types = {
    preparing: 'info',
    ongoing: 'success',
    ended: 'info'
  };
  return types[status] || 'info';
}

function getStatusText(status) {
  const texts = {
    preparing: '筹备中',
    ongoing: '进行中',
    ended: '已结束'
  };
  return texts[status] || '未知';
}
</script>

<style scoped lang="scss">
.exhibition {
  .search-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .cover-image {
    width: 200px;
    height: 120px;
    object-fit: cover;
    border-radius: 4px;
  }
}
</style>
