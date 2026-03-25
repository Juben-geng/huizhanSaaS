<template>
  <div class="login-container">
    <div class="login-box" v-sound:hover>
      <div class="login-header">
        <h1>会展智能建联SaaS平台</h1>
        <p>平台管理后台</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            v-sound:focus
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
            v-sound:focus
          />
        </el-form-item>

        <el-form-item prop="captcha" v-if="showCaptcha">
          <div class="captcha-box">
            <el-input
              v-model="form.captcha"
              placeholder="请输入验证码"
              size="large"
              :prefix-icon="Key"
              v-sound:focus
            />
            <div class="captcha-img" @click="refreshCaptcha" v-sound:click>
              <img :src="captchaUrl" alt="验证码" />
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
            v-sound:click
          >
            登录
          </el-button>
        </el-form-item>

        <div class="login-footer">
          <el-checkbox v-model="rememberMe" v-sound:click>记住我</el-checkbox>
          <el-link type="primary" :underline="false" v-sound:click>忘记密码？</el-link>
        </div>
      </el-form>

      <div class="login-tips">
        <p>默认账号：admin / admin123456</p>
      </div>
    </div>

    <div class="login-bg">
      <div class="bg-content">
        <h2>智能连接，共创未来</h2>
        <p>一站式会展智能建联解决方案</p>
        <div class="bg-features">
          <div class="feature-item">
            <el-icon><DataLine /></el-icon>
            <span>数据驱动</span>
          </div>
          <div class="feature-item">
            <el-icon><Connection /></el-icon>
            <span>智能匹配</span>
          </div>
          <div class="feature-item">
            <el-icon><TrendCharts /></el-icon>
            <span>实时分析</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Key, DataLine, Connection, TrendCharts } from '@element-plus/icons-vue';
import request from '../utils/request';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const formRef = ref(null);
const loading = ref(false);
const showCaptcha = ref(false);
const captchaUrl = ref('');
const rememberMe = ref(false);

const form = reactive({
  username: '',
  password: '',
  captcha: ''
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
};

onMounted(() => {
  checkRememberMe();
});

function checkRememberMe() {
  const remembered = localStorage.getItem('platform_remember');
  if (remembered) {
    const data = JSON.parse(remembered);
    form.username = data.username;
    form.password = data.password;
    rememberMe.value = true;
  }
}

async function handleLogin() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      const data = await request.post('/platform/auth/login', {
        username: form.username,
        password: form.password,
        captcha: form.captcha
      });

      userStore.setToken(data.token);
      userStore.setUserInfo(data.user);

      if (rememberMe.value) {
        localStorage.setItem('platform_remember', JSON.stringify({
          username: form.username,
          password: form.password
        }));
      } else {
        localStorage.removeItem('platform_remember');
      }

      ElMessage.success('登录成功');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.code === 'CAPTCHA_REQUIRED') {
        showCaptcha.value = true;
        refreshCaptcha();
      }
      ElMessage.error(error.response?.data?.message || '登录失败');
    } finally {
      loading.value = false;
    }
  });
}

function refreshCaptcha() {
  captchaUrl.value = `/api/platform/captcha?t=${Date.now()}`;
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
}

.login-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background: #fff;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 28px;
    color: #303133;
    margin-bottom: 12px;
  }

  p {
    font-size: 16px;
    color: #909399;
  }
}

.login-form {
  width: 100%;
  max-width: 400px;

  .captcha-box {
    display: flex;
    gap: 12px;
    width: 100%;

    .el-input {
      flex: 1;
    }

    .captcha-img {
      width: 120px;
      height: 40px;
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }

  .login-button {
    width: 100%;
    margin-top: 10px;
  }

  .login-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.login-tips {
  margin-top: 30px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.login-bg {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
}

.bg-content {
  text-align: center;
  color: #fff;

  h2 {
    font-size: 36px;
    margin-bottom: 16px;
  }

  p {
    font-size: 18px;
    margin-bottom: 40px;
    opacity: 0.9;
  }

  .bg-features {
    display: flex;
    justify-content: center;
    gap: 40px;

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .el-icon {
        font-size: 40px;
        background: rgba(255, 255, 255, 0.2);
        padding: 16px;
        border-radius: 12px;
      }

      span {
        font-size: 14px;
        opacity: 0.9;
      }
    }
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-bg {
    display: none;
  }
}
</style>
