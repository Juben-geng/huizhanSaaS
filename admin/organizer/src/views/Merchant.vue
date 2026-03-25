<template>
  <div class="merchant">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商家管理</span>
          <el-button type="primary" @click="showAddDialog">添加商家</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索商家名称/公司"
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
        <el-button type="primary" @click="search">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="merchantList" stripe v-loading="loading">
        <el-table-column prop="merchantId" label="ID" width="80" />
        <el-table-column label="商家信息" min-width="200">
          <template #default="{ row }">
            <div class="merchant-info">
              <el-avatar :src="row.avatar || '/default-avatar.png'" size="small" />
              <div>
                <div class="merchant-name">{{ row.companyName }}</div>
                <div class="merchant-contact">{{ row.contactName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="industry" label="行业" width="100" />
        <el-table-column prop="boothNumber" label="展位号" width="100" />
        <el-table-column prop="visitorCount" label="访客数" width="80" />
        <el-table-column prop="connectionCount" label="连接数" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="额度" width="120">
          <template #default="{ row }">
            <div class="quota-info">
              <el-progress
                :percentage="getQuotaPercentage(row)"
                :color="getQuotaColor(row)"
                :stroke-width="8"
              />
              <span class="quota-text">{{ row.usedQuota }}/{{ row.totalQuota }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="editMerchant(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="viewData(row)">数据</el-button>
            <el-button
              :type="row.status === 'active' ? 'danger' : 'success'"
              link
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
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
          @size-change="loadMerchants"
          @current-change="loadMerchants"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
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
        <el-form-item label="公司名称" prop="companyName">
          <el-input v-model="form.companyName" placeholder="请输入公司名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="form.contactName" placeholder="请输入联系人姓名" maxlength="50" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" maxlength="20" />
        </el-form-item>
        <el-form-item label="行业" prop="industry">
          <el-select v-model="form.industry" placeholder="选择行业" style="width: 100%">
            <el-option label="科技" value="科技" />
            <el-option label="金融" value="金融" />
            <el-option label="制造" value="制造" />
            <el-option label="教育" value="教育" />
            <el-option label="医疗" value="医疗" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="展位号" prop="boothNumber">
          <el-input v-model="form.boothNumber" placeholder="请输入展位号" maxlength="20" />
        </el-form-item>
        <el-form-item label="公司简介" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入公司简介"
            :rows="4"
            maxlength="500"
          />
        </el-form-item>
        <el-form-item label="套餐" prop="packageId">
          <el-select v-model="form.packageId" placeholder="选择套餐" style="width: 100%">
            <el-option label="免费版" value="free" />
            <el-option label="专业版" value="professional" />
            <el-option label="企业版" value="enterprise" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="商家详情" width="800px">
      <div class="detail-content" v-if="currentMerchant">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="公司名称">{{ currentMerchant.companyName }}</el-descriptions-item>
          <el-descriptions-item label="行业">{{ currentMerchant.industry }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentMerchant.contactName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentMerchant.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="展位号">{{ currentMerchant.boothNumber }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentMerchant.status === 'active' ? 'success' : 'info'">
              {{ currentMerchant.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="访客数">{{ currentMerchant.visitorCount }}</el-descriptions-item>
          <el-descriptions-item label="连接数">{{ currentMerchant.connectionCount }}</el-descriptions-item>
          <el-descriptions-item label="使用额度">{{ currentMerchant.usedQuota }}</el-descriptions-item>
          <el-descriptions-item label="总额度">{{ currentMerchant.totalQuota }}</el-descriptions-item>
          <el-descriptions-item label="套餐" :span="2">{{ getPackageName(currentMerchant.packageId) }}</el-descriptions-item>
          <el-descriptions-item label="公司简介" :span="2">
            {{ currentMerchant.description || '暂无简介' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { request } from '../utils/request';

const loading = ref(false);
const dialogVisible = ref(false);
const detailVisible = ref(false);
const dialogTitle = ref('添加商家');
const submitting = ref(false);
const formRef = ref(null);
const currentMerchant = ref(null);

const searchForm = reactive({
  keyword: '',
  exhibitionId: '',
  industry: ''
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0
});

const merchantList = ref([]);
const exhibitionList = ref([]);

const form = reactive({
  merchantId: null,
  exhibitionId: '',
  companyName: '',
  contactName: '',
  contactPhone: '',
  industry: '',
  boothNumber: '',
  description: '',
  packageId: 'free'
});

const rules = {
  exhibitionId: [{ required: true, message: '请选择展会', trigger: 'change' }],
  companyName: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  industry: [{ required: true, message: '请选择行业', trigger: 'change' }],
  boothNumber: [{ required: true, message: '请输入展位号', trigger: 'blur' }],
  packageId: [{ required: true, message: '请选择套餐', trigger: 'change' }]
};

onMounted(() => {
  loadExhibitions();
  loadMerchants();
});

async function loadExhibitions() {
  try {
    const data = await request.get('/organizer/exhibitions', { pageSize: 100 });
    exhibitionList.value = data.list;
  } catch (error) {
    console.error('Load exhibitions error:', error);
  }
}

async function loadMerchants() {
  loading.value = true;
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      exhibitionId: searchForm.exhibitionId || undefined,
      industry: searchForm.industry || undefined
    };

    const result = await request.get('/organizer/merchants', params);
    merchantList.value = result.list;
    pagination.total = result.total;
  } catch (error) {
    console.error('Load merchants error:', error);
    ElMessage.error('加载商家列表失败');
  } finally {
    loading.value = false;
  }
}

function search() {
  pagination.pageNum = 1;
  loadMerchants();
}

function resetSearch() {
  searchForm.keyword = '';
  searchForm.exhibitionId = '';
  searchForm.industry = '';
  pagination.pageNum = 1;
  loadMerchants();
}

function showAddDialog() {
  dialogTitle.value = '添加商家';
  resetForm();
  dialogVisible.value = true;
}

function editMerchant(row) {
  dialogTitle.value = '编辑商家';
  form.merchantId = row.merchantId;
  form.exhibitionId = row.exhibitionId;
  form.companyName = row.companyName;
  form.contactName = row.contactName;
  form.contactPhone = row.contactPhone;
  form.industry = row.industry;
  form.boothNumber = row.boothNumber;
  form.description = row.description;
  form.packageId = row.packageId;
  dialogVisible.value = true;
}

function resetForm() {
  form.merchantId = null;
  form.exhibitionId = '';
  form.companyName = '';
  form.contactName = '';
  form.contactPhone = '';
  form.industry = '';
  form.boothNumber = '';
  form.description = '';
  form.packageId = 'free';
}

async function submitForm() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      if (form.merchantId) {
        await request.put(`/organizer/merchants/${form.merchantId}`, form);
        ElMessage.success('更新成功');
      } else {
        await request.post('/organizer/merchants', form);
        ElMessage.success('添加成功');
      }

      dialogVisible.value = false;
      loadMerchants();
    } catch (error) {
      console.error('Submit form error:', error);
      ElMessage.error(form.merchantId ? '更新失败' : '添加失败');
    } finally {
      submitting.value = false;
    }
  });
}

function viewDetail(row) {
  currentMerchant.value = row;
  detailVisible.value = true;
}

function viewData(row) {
  ElMessage.info('数据详情功能开发中');
}

async function toggleStatus(row) {
  const action = row.status === 'active' ? '禁用' : '启用';
  try {
    await ElMessageBox.confirm(`确定要${action}该商家吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await request.put(`/organizer/merchants/${row.merchantId}/status`, {
      status: row.status === 'active' ? 'inactive' : 'active'
    });

    ElMessage.success(`${action}成功`);
    loadMerchants();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Toggle status error:', error);
      ElMessage.error(`${action}失败`);
    }
  }
}

function getQuotaPercentage(row) {
  return row.totalQuota > 0 ? Math.round((row.usedQuota / row.totalQuota) * 100) : 0;
}

function getQuotaColor(row) {
  const percentage = getQuotaPercentage(row);
  if (percentage >= 90) return '#f56c6c';
  if (percentage >= 70) return '#e6a23c';
  return '#67c23a';
}

function getPackageName(packageId) {
  const names = {
    free: '免费版',
    professional: '专业版',
    enterprise: '企业版'
  };
  return names[packageId] || '未知';
}
</script>

<style scoped lang="scss">
.merchant {
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

  .merchant-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .merchant-name {
      font-weight: bold;
    }

    .merchant-contact {
      font-size: 12px;
      color: #999;
    }
  }

  .quota-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .quota-text {
      font-size: 12px;
      color: #666;
    }
  }

  .detail-content {
    padding: 20px 0;
  }
}
</style>
