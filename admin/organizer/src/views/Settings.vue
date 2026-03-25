<template>
  <div class="settings">
    <el-card>
      <template #header>
        <span>系统设置</span>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础信息" name="basic">
          <el-form :model="basicForm" :rules="basicRules" ref="basicFormRef" label-width="120px">
            <el-form-item label="主办方名称" prop="name">
              <el-input v-model="basicForm.name" placeholder="请输入主办方名称" maxlength="100" />
            </el-form-item>
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="basicForm.contactName" placeholder="请输入联系人姓名" maxlength="50" />
            </el-form-item>
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="basicForm.contactPhone" placeholder="请输入联系电话" maxlength="20" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="basicForm.email" placeholder="请输入邮箱" maxlength="100" />
            </el-form-item>
            <el-form-item label="地址" prop="address">
              <el-input v-model="basicForm.address" placeholder="请输入地址" maxlength="200" />
            </el-form-item>
            <el-form-item label="Logo" prop="logo">
              <el-upload
                :action="uploadUrl"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleLogoSuccess"
                :before-upload="beforeUpload"
              >
                <img v-if="basicForm.logo" :src="basicForm.logo" class="logo-image" />
                <el-button v-else type="primary">上传Logo</el-button>
              </el-upload>
            </el-form-item>
            <el-form-item label="简介" prop="introduction">
              <el-input
                v-model="basicForm.introduction"
                type="textarea"
                placeholder="请输入主办方简介"
                :rows="4"
                maxlength="500"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasic" :loading="saving">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="账号安全" name="security">
          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="120px">
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword" :loading="changing">修改密码</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div class="login-history">
            <div class="section-title">登录记录</div>
            <el-table :data="loginHistory" stripe max-height="400">
              <el-table-column prop="loginTime" label="登录时间" width="180" />
              <el-table-column prop="ip" label="IP地址" width="150" />
              <el-table-column prop="location" label="登录地点" />
              <el-table-column prop="device" label="设备信息" />
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="套餐管理" name="package">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前套餐">
              <el-tag type="success">{{ packageInfo.packageName }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="到期时间">{{ formatDate(packageInfo.expireTime) }}</el-descriptions-item>
            <el-descriptions-item label="展会数量">{{ packageInfo.usedExhibitions }} / {{ packageInfo.maxExhibitions }}</el-descriptions-item>
            <el-descriptions-item label="商家数量">{{ packageInfo.usedMerchants }} / {{ packageInfo.maxMerchants }}</el-descriptions-item>
            <el-descriptions-item label="访客数量">{{ packageInfo.usedVisitors }} / {{ packageInfo.maxVisitors }}</el-descriptions-item>
            <el-descriptions-item label="数据存储">{{ packageInfo.usedStorage }}GB / {{ packageInfo.maxStorage }}GB</el-descriptions-item>
            <el-descriptions-item label="功能权限" :span="2">
              <el-tag v-for="feature in packageInfo.features" :key="feature" style="margin-right: 8px; margin-bottom: 8px">
                {{ feature }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="package-actions" style="margin-top: 20px">
            <el-button type="primary" @click="showUpgradeDialog">升级套餐</el-button>
            <el-button @click="showRenewDialog">续费</el-button>
          </div>

          <el-dialog v-model="upgradeDialogVisible" title="选择套餐" width="600px">
            <div class="package-options">
              <div
                v-for="pkg in packages"
                :key="pkg.packageId"
                class="package-option"
                :class="{ selected: selectedPackage === pkg.packageId }"
                @click="selectPackage(pkg.packageId)"
              >
                <div class="package-header">
                  <div class="package-name">{{ pkg.name }}</div>
                  <div class="package-price">¥{{ pkg.price }}/年</div>
                </div>
                <div class="package-features">
                  <div v-for="feature in pkg.features" :key="feature" class="feature-item">
                    <el-icon><Check /></el-icon>
                    <span>{{ feature }}</span>
                  </div>
                </div>
              </div>
            </div>
            <template #footer>
              <el-button @click="upgradeDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="upgradePackage" :loading="upgrading">确认升级</el-button>
            </template>
          </el-dialog>
        </el-tab-pane>

        <el-tab-pane label="通知设置" name="notification">
          <el-form :model="notificationForm" label-width="180px">
            <el-form-item label="访客扫码通知">
              <el-switch v-model="notificationForm.visitorScan" />
            </el-form-item>
            <el-form-item label="新连接通知">
              <el-switch v-model="notificationForm.newConnection" />
            </el-form-item>
            <el-form-item label="额度预警通知">
              <el-switch v-model="notificationForm.quotaAlert" />
            </el-form-item>
            <el-form-item label="活动提醒">
              <el-switch v-model="notificationForm.activityReminder" />
            </el-form-item>
            <el-form-item label="系统消息">
              <el-switch v-model="notificationForm.systemMessage" />
            </el-form-item>
            <el-form-item label="邮箱通知">
              <el-switch v-model="notificationForm.emailNotification" />
            </el-form-item>
            <el-form-item label="短信通知">
              <el-switch v-model="notificationForm.smsNotification" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveNotification" :loading="saving">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import { request } from '../utils/request';
import dayjs from 'dayjs';

const activeTab = ref('basic');
const saving = ref(false);
const changing = ref(false);
const upgrading = ref(false);
const basicFormRef = ref(null);
const passwordFormRef = ref(null);
const upgradeDialogVisible = ref(false);
const selectedPackage = ref('');

const basicForm = reactive({
  name: '',
  contactName: '',
  contactPhone: '',
  email: '',
  address: '',
  logo: '',
  introduction: ''
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const notificationForm = reactive({
  visitorScan: true,
  newConnection: true,
  quotaAlert: true,
  activityReminder: true,
  systemMessage: true,
  emailNotification: false,
  smsNotification: false
});

const basicRules = {
  name: [{ required: true, message: '请输入主办方名称', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

const packageInfo = ref({});
const loginHistory = ref([]);
const packages = ref([]);

const uploadUrl = computed(() => `${import.meta.env.VITE_API_BASE_URL}/upload/image`);
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}));

onMounted(() => {
  loadBasicInfo();
  loadPackageInfo();
  loadLoginHistory();
  loadNotificationSettings();
  loadPackages();
});

async function loadBasicInfo() {
  try {
    const data = await request.get('/organizer/settings/basic');
    Object.assign(basicForm, data);
  } catch (error) {
    console.error('Load basic info error:', error);
  }
}

async function saveBasic() {
  if (!basicFormRef.value) return;

  await basicFormRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      await request.put('/organizer/settings/basic', basicForm);
      ElMessage.success('保存成功');
    } catch (error) {
      console.error('Save basic info error:', error);
      ElMessage.error('保存失败');
    } finally {
      saving.value = false;
    }
  });
}

async function changePassword() {
  if (!passwordFormRef.value) return;

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return;

    changing.value = true;
    try {
      await request.post('/organizer/settings/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      ElMessage.success('密码修改成功');
      resetPasswordForm();
    } catch (error) {
      console.error('Change password error:', error);
      ElMessage.error('密码修改失败');
    } finally {
      changing.value = false;
    }
  });
}

function resetPasswordForm() {
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
}

async function loadPackageInfo() {
  try {
    const data = await request.get('/organizer/settings/package');
    packageInfo.value = data;
  } catch (error) {
    console.error('Load package info error:', error);
  }
}

function showUpgradeDialog() {
  upgradeDialogVisible.value = true;
}

function showRenewDialog() {
  ElMessage.info('续费功能开发中');
}

async function loadPackages() {
  try {
    const data = await request.get('/organizer/settings/packages');
    packages.value = data;
  } catch (error) {
    console.error('Load packages error:', error);
  }
}

function selectPackage(packageId) {
  selectedPackage.value = packageId;
}

async function upgradePackage() {
  if (!selectedPackage.value) {
    ElMessage.warning('请选择套餐');
    return;
  }

  upgrading.value = true;
  try {
    await request.post('/organizer/settings/upgrade-package', {
      packageId: selectedPackage.value
    });
    ElMessage.success('升级成功');
    upgradeDialogVisible.value = false;
    loadPackageInfo();
  } catch (error) {
    console.error('Upgrade package error:', error);
    ElMessage.error('升级失败');
  } finally {
    upgrading.value = false;
  }
}

async function loadLoginHistory() {
  try {
    const data = await request.get('/organizer/settings/login-history', { limit: 20 });
    loginHistory.value = data;
  } catch (error) {
    console.error('Load login history error:', error);
  }
}

async function loadNotificationSettings() {
  try {
    const data = await request.get('/organizer/settings/notification');
    Object.assign(notificationForm, data);
  } catch (error) {
    console.error('Load notification settings error:', error);
  }
}

async function saveNotification() {
  saving.value = true;
  try {
    await request.put('/organizer/settings/notification', notificationForm);
    ElMessage.success('保存成功');
  } catch (error) {
    console.error('Save notification settings error:', error);
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
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

function handleLogoSuccess(res) {
  if (res.code === 200) {
    basicForm.logo = res.data.url;
    ElMessage.success('上传成功');
  } else {
    ElMessage.error('上传失败');
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}
</script>

<style scoped lang="scss">
.settings {
  .logo-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }

  .section-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .package-options {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .package-option {
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #1890ff;
      }

      &.selected {
        border-color: #1890ff;
        background-color: #f0f9ff;
      }

      .package-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .package-name {
          font-size: 18px;
          font-weight: bold;
        }

        .package-price {
          font-size: 24px;
          color: #f5222d;
          font-weight: bold;
        }
      }

      .package-features {
        .feature-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #666;

          .el-icon {
            color: #52c41a;
          }
        }
      }
    }
  }

  .package-actions {
    display: flex;
    gap: 12px;
  }
}
</style>
