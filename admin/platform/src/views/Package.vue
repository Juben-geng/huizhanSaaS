<template>
  <div class="package">
    <el-card v-sound:hover>
      <template #header>
        <div class="card-header">
          <span>套餐管理</span>
          <el-button type="primary" @click="showCreateDialog" v-sound:click>添加套餐</el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="6" v-for="item in packages" :key="item.id">
          <el-card class="package-card" :class="`package-${item.type}`" v-sound:hover>
            <div class="package-header">
              <div class="package-name">{{ item.name }}</div>
              <div class="package-price">¥{{ item.price }}<span class="unit">/年</span></div>
            </div>
            <div class="package-features">
              <div class="feature-item" v-for="feature in item.features" :key="feature">
                <el-icon><Check /></el-icon>
                <span>{{ feature }}</span>
              </div>
            </div>
            <div class="package-limits">
              <div class="limit-item">
                <span class="label">展会数量</span>
                <span class="value">{{ item.limitExhibitions }}个</span>
              </div>
              <div class="limit-item">
                <span class="label">商家数量</span>
                <span class="value">{{ item.limitMerchants }}个</span>
              </div>
              <div class="limit-item">
                <span class="label">访客数量</span>
                <span class="value">{{ item.limitVisitors }}个</span>
              </div>
              <div class="limit-item">
                <span class="label">存储空间</span>
                <span class="value">{{ item.limitStorage }}GB</span>
              </div>
            </div>
            <div class="package-actions">
              <el-button type="primary" size="small" @click="handleEdit(item)" v-sound:click>编辑</el-button>
              <el-button size="small" @click="handleView(item)" v-sound:click>查看</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入套餐名称" maxlength="50" v-sound:focus />
        </el-form-item>
        <el-form-item label="套餐类型" prop="type">
          <el-select v-model="form.type" placeholder="选择套餐类型" style="width: 100%" v-sound:focus>
            <el-option label="免费版" value="free" v-sound:hover />
            <el-option label="专业版" value="professional" v-sound:hover />
            <el-option label="企业版" value="enterprise" v-sound:hover />
            <el-option label="旗舰版" value="flagship" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" v-sound:focus />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="展会数量" prop="limitExhibitions">
              <el-input-number v-model="form.limitExhibitions" :min="0" style="width: 100%" v-sound:focus />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商家数量" prop="limitMerchants">
              <el-input-number v-model="form.limitMerchants" :min="0" style="width: 100%" v-sound:focus />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="访客数量" prop="limitVisitors">
              <el-input-number v-model="form.limitVisitors" :min="0" style="width: 100%" v-sound:focus />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存储空间" prop="limitStorage">
              <el-input-number v-model="form.limitStorage" :min="0" style="width: 100%" v-sound:focus />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="功能特性" prop="features">
          <el-input
            v-model="featureInput"
            placeholder="输入功能特性后按回车添加"
            @keyup.enter="addFeature"
            v-sound:focus
          >
            <template #append>
              <el-button @click="addFeature" v-sound:click>添加</el-button>
            </template>
          </el-input>
          <div class="feature-tags">
            <el-tag
              v-for="(feature, index) in form.features"
              :key="index"
              closable
              @close="removeFeature(index)"
              style="margin: 8px 8px 0 0"
              v-sound:hover
            >
              {{ feature }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" :active-value="'active'" :inactive-value="'inactive'" v-sound:click />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" v-sound:click>取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" v-sound:click>确定</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="套餐详情" width="700px">
      <el-descriptions :column="2" border v-if="currentPackage">
        <el-descriptions-item label="套餐名称">{{ currentPackage.name }}</el-descriptions-item>
        <el-descriptions-item label="套餐类型">
          <el-tag :type="getPackageType(currentPackage.type)">{{ getPackageName(currentPackage.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="价格">¥{{ currentPackage.price }}/年</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentPackage.status === 'active' ? 'success' : 'info'">
            {{ currentPackage.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="展会数量">{{ currentPackage.limitExhibitions }}个</el-descriptions-item>
        <el-descriptions-item label="商家数量">{{ currentPackage.limitMerchants }}个</el-descriptions-item>
        <el-descriptions-item label="访客数量">{{ currentPackage.limitVisitors }}个</el-descriptions-item>
        <el-descriptions-item label="存储空间">{{ currentPackage.limitStorage }}GB</el-descriptions-item>
        <el-descriptions-item label="功能特性" :span="2">
          <el-tag v-for="feature in currentPackage.features" :key="feature" style="margin-right: 8px; margin-bottom: 8px">
            {{ feature }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="使用人数">{{ currentPackage.userCount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentPackage.createTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import request from '../utils/request';
import dayjs from 'dayjs';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const formRef = ref(null);
const packages = ref([]);
const currentPackage = ref(null);
const featureInput = ref('');

const form = reactive({
  id: null,
  name: '',
  type: '',
  price: 0,
  limitExhibitions: 0,
  limitMerchants: 0,
  limitVisitors: 0,
  limitStorage: 0,
  features: [],
  status: 'active'
});

const rules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择套餐类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  features: [
    {
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一个功能特性'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ]
};

const dialogTitle = computed(() => (form.id ? '编辑套餐' : '添加套餐'));

onMounted(() => {
  loadPackages();
});

async function loadPackages() {
  loading.value = true;
  try {
    const data = await request.get('/platform/packages');
    packages.value = data;
  } catch (error) {
    console.error('Load packages error:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

function showCreateDialog() {
  dialogVisible.value = true;
}

function handleEdit(row) {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    type: row.type,
    price: row.price,
    limitExhibitions: row.limitExhibitions,
    limitMerchants: row.limitMerchants,
    limitVisitors: row.limitVisitors,
    limitStorage: row.limitStorage,
    features: [...row.features],
    status: row.status
  });
  dialogVisible.value = true;
}

function handleView(row) {
  currentPackage.value = row;
  detailDialogVisible.value = true;
}

function addFeature() {
  const feature = featureInput.value.trim();
  if (feature && !form.features.includes(feature)) {
    form.features.push(feature);
    featureInput.value = '';
  }
}

function removeFeature(index) {
  form.features.splice(index, 1);
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data = {
        name: form.name,
        type: form.type,
        price: form.price,
        limitExhibitions: form.limitExhibitions,
        limitMerchants: form.limitMerchants,
        limitVisitors: form.limitVisitors,
        limitStorage: form.limitStorage,
        features: form.features,
        status: form.status
      };

      if (form.id) {
        await request.put(`/platform/packages/${form.id}`, data);
        ElMessage.success('更新成功');
      } else {
        await request.post('/platform/packages', data);
        ElMessage.success('创建成功');
      }

      dialogVisible.value = false;
      loadPackages();
    } catch (error) {
      console.error('Submit package error:', error);
      ElMessage.error('操作失败');
    } finally {
      submitting.value = false;
    }
  });
}

function resetForm() {
  formRef.value?.resetFields();
  form.id = null;
  form.features = [];
  featureInput.value = '';
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

function getPackageType(type) {
  const map = {
    free: '',
    professional: 'warning',
    enterprise: 'success',
    flagship: 'danger'
  };
  return map[type] || '';
}

function getPackageName(type) {
  const map = {
    free: '免费版',
    professional: '专业版',
    enterprise: '企业版',
    flagship: '旗舰版'
  };
  return map[type] || type;
}
</script>

<style scoped lang="scss">
.package {
  .package-card {
    margin-bottom: 20px;
    text-align: center;

    .package-header {
      margin-bottom: 20px;

      .package-name {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .package-price {
        font-size: 32px;
        color: #409eff;
        font-weight: bold;

        .unit {
          font-size: 14px;
          color: #909399;
        }
      }
    }

    .package-features {
      text-align: left;
      margin-bottom: 20px;

      .feature-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: #606266;

        .el-icon {
          color: #67c23a;
        }
      }
    }

    .package-limits {
      background: #f5f7fa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;

      .limit-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          color: #909399;
        }

        .value {
          font-weight: bold;
          color: #303133;
        }
      }
    }

    .package-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    &.package-free {
      border-top: 4px solid #909399;
    }

    &.package-professional {
      border-top: 4px solid #e6a23c;
    }

    &.package-enterprise {
      border-top: 4px solid #67c23a;
    }

    &.package-flagship {
      border-top: 4px solid #f56c6c;
    }
  }

  .feature-tags {
    margin-top: 12px;
  }
}
</style>
