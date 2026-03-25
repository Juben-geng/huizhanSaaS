<template>
  <div class="settings">
    <el-card v-sound:hover>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="basicForm" :rules="basicRules" ref="basicFormRef" label-width="120px" style="max-width: 600px">
            <el-form-item label="平台名称" prop="platformName">
              <el-input v-model="basicForm.platformName" placeholder="请输入平台名称" maxlength="50" v-sound:focus />
            </el-form-item>
            <el-form-item label="平台Logo" prop="logo">
              <el-upload
                class="logo-uploader"
                :action="uploadAction"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleLogoSuccess"
                :before-upload="beforeLogoUpload"
                v-sound:click
              >
                <img v-if="basicForm.logo" :src="basicForm.logo" class="logo" />
                <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="平台简介" prop="description">
              <el-input
                v-model="basicForm.description"
                type="textarea"
                :rows="4"
                placeholder="请输入平台简介"
                maxlength="500"
                show-word-limit
                v-sound:focus
              />
            </el-form-item>
            <el-form-item label="客服电话" prop="servicePhone">
              <el-input v-model="basicForm.servicePhone" placeholder="请输入客服电话" maxlength="20" v-sound:focus />
            </el-form-item>
            <el-form-item label="客服邮箱" prop="serviceEmail">
              <el-input v-model="basicForm.serviceEmail" placeholder="请输入客服邮箱" maxlength="100" v-sound:focus />
            </el-form-item>
            <el-form-item label="公司地址" prop="address">
              <el-input v-model="basicForm.address" placeholder="请输入公司地址" maxlength="200" v-sound:focus />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasic" :loading="saving" v-sound:click>保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="安全设置" name="security">
          <el-form :model="securityForm" :rules="securityRules" ref="securityFormRef" label-width="120px" style="max-width: 600px">
            <el-form-item label="密码强度" prop="passwordStrength">
              <el-select v-model="securityForm.passwordStrength" placeholder="选择密码强度要求" v-sound:focus>
                <el-option label="低（至少6位）" value="low" v-sound:hover />
                <el-option label="中（至少8位，包含数字和字母）" value="medium" v-sound:hover />
                <el-option label="高（至少10位，包含大小写字母、数字和特殊字符）" value="high" v-sound:hover />
              </el-select>
            </el-form-item>
            <el-form-item label="登录限制" prop="loginLimit">
              <el-switch v-model="securityForm.loginLimit" v-sound:click />
            </el-form-item>
            <el-form-item label="最大登录失败次数" prop="maxLoginAttempts" v-if="securityForm.loginLimit">
              <el-input-number v-model="securityForm.maxLoginAttempts" :min="3" :max="10" v-sound:focus />
            </el-form-item>
            <el-form-item label="锁定时间（分钟）" prop="lockTime" v-if="securityForm.loginLimit">
              <el-input-number v-model="securityForm.lockTime" :min="5" :max="120" v-sound:focus />
            </el-form-item>
            <el-form-item label="两步验证" prop="twoFactorAuth">
              <el-switch v-model="securityForm.twoFactorAuth" v-sound:click />
            </el-form-item>
            <el-form-item label="会话超时（分钟）" prop="sessionTimeout">
              <el-input-number v-model="securityForm.sessionTimeout" :min="30" :max="480" v-sound:focus />
            </el-form-item>
            <el-form-item label="IP白名单" prop="ipWhitelist">
              <el-input
                v-model="securityForm.ipWhitelist"
                type="textarea"
                :rows="4"
                placeholder="每行一个IP地址或IP段"
                v-sound:focus
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSecurity" :loading="saving" v-sound:click>保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="通知设置" name="notification">
          <el-form :model="notificationForm" ref="notificationFormRef" label-width="120px" style="max-width: 600px">
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationForm.emailEnabled" v-sound:click />
            </el-form-item>
            <el-form-item label="SMTP服务器" prop="smtpHost" v-if="notificationForm.emailEnabled">
              <el-input v-model="notificationForm.smtpHost" placeholder="请输入SMTP服务器地址" v-sound:focus />
            </el-form-item>
            <el-form-item label="SMTP端口" prop="smtpPort" v-if="notificationForm.emailEnabled">
              <el-input-number v-model="notificationForm.smtpPort" :min="1" :max="65535" v-sound:focus />
            </el-form-item>
            <el-form-item label="发件人邮箱" prop="smtpFrom" v-if="notificationForm.emailEnabled">
              <el-input v-model="notificationForm.smtpFrom" placeholder="请输入发件人邮箱" v-sound:focus />
            </el-form-item>
            <el-form-item label="邮箱密码" prop="smtpPassword" v-if="notificationForm.emailEnabled">
              <el-input v-model="notificationForm.smtpPassword" type="password" placeholder="请输入邮箱密码" show-password v-sound:focus />
            </el-form-item>
            <el-form-item label="短信通知">
              <el-switch v-model="notificationForm.smsEnabled" v-sound:click />
            </el-form-item>
            <el-form-item label="短信服务商" prop="smsProvider" v-if="notificationForm.smsEnabled">
              <el-select v-model="notificationForm.smsProvider" placeholder="选择短信服务商" v-sound:focus>
                <el-option label="阿里云" value="aliyun" v-sound:hover />
                <el-option label="腾讯云" value="tencent" v-sound:hover />
                <el-option label="华为云" value="huawei" v-sound:hover />
              </el-select>
            </el-form-item>
            <el-form-item label="AccessKey" prop="smsAccessKey" v-if="notificationForm.smsEnabled">
              <el-input v-model="notificationForm.smsAccessKey" placeholder="请输入AccessKey" v-sound:focus />
            </el-form-item>
            <el-form-item label="SecretKey" prop="smsSecretKey" v-if="notificationForm.smsEnabled">
              <el-input v-model="notificationForm.smsSecretKey" type="password" placeholder="请输入SecretKey" show-password v-sound:focus />
            </el-form-item>
            <el-form-item label="签名" prop="smsSign" v-if="notificationForm.smsEnabled">
              <el-input v-model="notificationForm.smsSign" placeholder="请输入短信签名" v-sound:focus />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveNotification" :loading="saving" v-sound:click>保存</el-button>
              <el-button @click="testNotification" :loading="testing" v-sound:click>测试通知</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="存储设置" name="storage">
          <el-form :model="storageForm" ref="storageFormRef" label-width="120px" style="max-width: 600px">
            <el-form-item label="存储方式">
              <el-radio-group v-model="storageForm.type">
                <el-radio value="local" v-sound:click>本地存储</el-radio>
                <el-radio value="oss" v-sound:click>阿里云OSS</el-radio>
                <el-radio value="cos" v-sound:click>腾讯云COS</el-radio>
                <el-radio value="s3" v-sound:click>AWS S3</el-radio>
              </el-radio-group>
            </el-form-item>
            <template v-if="storageForm.type === 'oss'">
              <el-form-item label="Bucket名称" prop="ossBucket">
                <el-input v-model="storageForm.ossBucket" placeholder="请输入Bucket名称" v-sound:focus />
              </el-form-item>
              <el-form-item label="Region" prop="ossRegion">
                <el-input v-model="storageForm.ossRegion" placeholder="请输入Region" v-sound:focus />
              </el-form-item>
              <el-form-item label="AccessKey" prop="ossAccessKey">
                <el-input v-model="storageForm.ossAccessKey" placeholder="请输入AccessKey" v-sound:focus />
              </el-form-item>
              <el-form-item label="SecretKey" prop="ossSecretKey">
                <el-input v-model="storageForm.ossSecretKey" type="password" placeholder="请输入SecretKey" show-password v-sound:focus />
              </el-form-item>
            </template>
            <template v-if="storageForm.type === 'cos'">
              <el-form-item label="Bucket名称" prop="cosBucket">
                <el-input v-model="storageForm.cosBucket" placeholder="请输入Bucket名称" v-sound:focus />
              </el-form-item>
              <el-form-item label="Region" prop="cosRegion">
                <el-input v-model="storageForm.cosRegion" placeholder="请输入Region" v-sound:focus />
              </el-form-item>
              <el-form-item label="SecretId" prop="cosSecretId">
                <el-input v-model="storageForm.cosSecretId" placeholder="请输入SecretId" v-sound:focus />
              </el-form-item>
              <el-form-item label="SecretKey" prop="cosSecretKey">
                <el-input v-model="storageForm.cosSecretKey" type="password" placeholder="请输入SecretKey" show-password v-sound:focus />
              </el-form-item>
            </template>
            <template v-if="storageForm.type === 's3'">
              <el-form-item label="Bucket名称" prop="s3Bucket">
                <el-input v-model="storageForm.s3Bucket" placeholder="请输入Bucket名称" v-sound:focus />
              </el-form-item>
              <el-form-item label="Region" prop="s3Region">
                <el-input v-model="storageForm.s3Region" placeholder="请输入Region" v-sound:focus />
              </el-form-item>
              <el-form-item label="AccessKey" prop="s3AccessKey">
                <el-input v-model="storageForm.s3AccessKey" placeholder="请输入AccessKey" v-sound:focus />
              </el-form-item>
              <el-form-item label="SecretKey" prop="s3SecretKey">
                <el-input v-model="storageForm.s3SecretKey" type="password" placeholder="请输入SecretKey" show-password v-sound:focus />
              </el-form-item>
            </template>
            <el-form-item>
              <el-button type="primary" @click="saveStorage" :loading="saving" v-sound:click>保存</el-button>
              <el-button @click="testStorage" :loading="testing" v-sound:click>测试连接</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="其他设置" name="other">
          <el-form :model="otherForm" ref="otherFormRef" label-width="120px" style="max-width: 600px">
            <el-form-item label="默认时区" prop="timezone">
              <el-select v-model="otherForm.timezone" placeholder="选择时区" v-sound:focus>
                <el-option label="UTC+08:00 北京时间" value="Asia/Shanghai" v-sound:hover />
                <el-option label="UTC+09:00 东京时间" value="Asia/Tokyo" v-sound:hover />
                <el-option label="UTC+00:00 格林威治时间" value="Europe/London" v-sound:hover />
                <el-option label="UTC-05:00 纽约时间" value="America/New_York" v-sound:hover />
              </el-select>
            </el-form-item>
            <el-form-item label="语言" prop="language">
              <el-select v-model="otherForm.language" placeholder="选择语言" v-sound:focus>
                <el-option label="简体中文" value="zh-CN" v-sound:hover />
                <el-option label="繁体中文" value="zh-TW" v-sound:hover />
                <el-option label="English" value="en-US" v-sound:hover />
              </el-select>
            </el-form-item>
            <el-form-item label="默认套餐" prop="defaultPackage">
              <el-select v-model="otherForm.defaultPackage" placeholder="选择默认套餐" v-sound:focus>
                <el-option label="免费版" value="free" v-sound:hover />
                <el-option label="专业版" value="professional" v-sound:hover />
                <el-option label="企业版" value="enterprise" v-sound:hover />
              </el-select>
            </el-form-item>
            <el-form-item label="注册开关">
              <el-switch v-model="otherForm.allowRegister" v-sound:click />
            </el-form-item>
            <el-form-item label="维护模式">
              <el-switch v-model="otherForm.maintenanceMode" v-sound:click />
            </el-form-item>
            <el-form-item label="维护公告" prop="maintenanceNotice" v-if="otherForm.maintenanceMode">
              <el-input
                v-model="otherForm.maintenanceNotice"
                type="textarea"
                :rows="4"
                placeholder="请输入维护公告"
                v-sound:focus
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveOther" :loading="saving" v-sound:click>保存</el-button>
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
import { Plus } from '@element-plus/icons-vue';
import request from '../utils/request';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
const activeTab = ref('basic');
const saving = ref(false);
const testing = ref(false);

const basicFormRef = ref(null);
const securityFormRef = ref(null);
const notificationFormRef = ref(null);
const storageFormRef = ref(null);
const otherFormRef = ref(null);

const basicForm = reactive({
  platformName: '',
  logo: '',
  description: '',
  servicePhone: '',
  serviceEmail: '',
  address: ''
});

const securityForm = reactive({
  passwordStrength: 'medium',
  loginLimit: true,
  maxLoginAttempts: 5,
  lockTime: 30,
  twoFactorAuth: false,
  sessionTimeout: 120,
  ipWhitelist: ''
});

const notificationForm = reactive({
  emailEnabled: true,
  smtpHost: '',
  smtpPort: 465,
  smtpFrom: '',
  smtpPassword: '',
  smsEnabled: false,
  smsProvider: 'aliyun',
  smsAccessKey: '',
  smsSecretKey: '',
  smsSign: ''
});

const storageForm = reactive({
  type: 'local',
  ossBucket: '',
  ossRegion: '',
  ossAccessKey: '',
  ossSecretKey: '',
  cosBucket: '',
  cosRegion: '',
  cosSecretId: '',
  cosSecretKey: '',
  s3Bucket: '',
  s3Region: '',
  s3AccessKey: '',
  s3SecretKey: ''
});

const otherForm = reactive({
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  defaultPackage: 'free',
  allowRegister: true,
  maintenanceMode: false,
  maintenanceNotice: ''
});

const basicRules = {
  platformName: [{ required: true, message: '请输入平台名称', trigger: 'blur' }],
  serviceEmail: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

const securityRules = {
  maxLoginAttempts: [{ required: true, message: '请输入最大登录失败次数', trigger: 'blur' }],
  lockTime: [{ required: true, message: '请输入锁定时间', trigger: 'blur' }],
  sessionTimeout: [{ required: true, message: '请输入会话超时时间', trigger: 'blur' }]
};

const uploadAction = computed(() => '/api/platform/upload/logo');
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}));

onMounted(() => {
  loadSettings();
});

async function loadSettings() {
  try {
    const data = await request.get('/platform/settings');
    Object.assign(basicForm, data.basic);
    Object.assign(securityForm, data.security);
    Object.assign(notificationForm, data.notification);
    Object.assign(storageForm, data.storage);
    Object.assign(otherForm, data.other);
  } catch (error) {
    console.error('Load settings error:', error);
  }
}

async function saveBasic() {
  if (!basicFormRef.value) return;
  await basicFormRef.value.validate(async (valid) => {
    if (!valid) return;
    await saveSettings('basic', basicForm);
  });
}

async function saveSecurity() {
  if (!securityFormRef.value) return;
  await securityFormRef.value.validate(async (valid) => {
    if (!valid) return;
    await saveSettings('security', securityForm);
  });
}

async function saveNotification() {
  await saveSettings('notification', notificationForm);
}

async function saveStorage() {
  await saveSettings('storage', storageForm);
}

async function saveOther() {
  await saveSettings('other', otherForm);
}

async function saveSettings(type, data) {
  saving.value = true;
  try {
    await request.put('/platform/settings', { type, data });
    ElMessage.success('保存成功');
  } catch (error) {
    console.error('Save settings error:', error);
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
}

async function testNotification() {
  testing.value = true;
  try {
    await request.post('/platform/settings/test-notification');
    ElMessage.success('测试通知已发送，请检查邮箱');
  } catch (error) {
    console.error('Test notification error:', error);
    ElMessage.error('测试失败');
  } finally {
    testing.value = false;
  }
}

async function testStorage() {
  testing.value = true;
  try {
    await request.post('/platform/settings/test-storage');
    ElMessage.success('存储连接测试成功');
  } catch (error) {
    console.error('Test storage error:', error);
    ElMessage.error('存储连接测试失败');
  } finally {
    testing.value = false;
  }
}

function beforeLogoUpload(file) {
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

function handleLogoSuccess(response) {
  basicForm.logo = response.url;
  ElMessage.success('上传成功');
}
</script>

<style scoped lang="scss">
.settings {
  .logo-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s;

      &:hover {
        border-color: #409eff;
      }
    }
  }

  .logo-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 148px;
    height: 148px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo {
    width: 148px;
    height: 148px;
    display: block;
    object-fit: cover;
  }
}
</style>
