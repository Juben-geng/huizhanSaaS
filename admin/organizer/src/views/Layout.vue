<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <img src="/logo.png" alt="logo" />
        <span>主办方管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        :collapse="isCollapse"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#1890ff"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item :index="route.path" v-if="!route.hidden">
            <el-icon><component :is="route.meta.icon" /></el-icon>
            <template #title>{{ route.meta.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0">
            <el-icon class="header-icon" @click="showNotifications">
              <Bell />
            </el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :src="userInfo.avatar || '/default-avatar.png'" />
              <span class="username">{{ userInfo.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <el-drawer v-model="notificationDrawer" title="消息通知" size="400px">
      <div class="notification-list">
        <div 
          v-for="item in notifications" 
          :key="item.id" 
          class="notification-item"
          :class="{ unread: !item.read }"
          @click="readNotification(item.id)"
        >
          <div class="notification-icon">
            <el-icon><component :is="item.type === 'visitor' ? 'User' : 'Warning'" /></el-icon>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ item.title }}</div>
            <div class="notification-message">{{ item.message }}</div>
            <div class="notification-time">{{ item.time }}</div>
          </div>
        </div>
        <el-empty v-if="notifications.length === 0" description="暂无消息" />
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from '../stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useStore();

const isCollapse = ref(false);
const notificationDrawer = ref(false);
const unreadCount = ref(0);
const notifications = ref([]);
const userInfo = computed(() => userStore.userInfo);

const menuRoutes = computed(() => {
  return router.options.routes.find(r => r.path === '/')?.children || [];
});

const activeMenu = computed(() => route.path);
const currentTitle = computed(() => route.meta?.title || '');

function toggleCollapse() {
  isCollapse.value = !isCollapse.value;
}

function showNotifications() {
  notificationDrawer.value = true;
}

function readNotification(id) {
  const notification = notifications.value.find(n => n.id === id);
  if (notification) {
    notification.read = true;
    unreadCount.value = notifications.value.filter(n => !n.read).length;
  }
}

async function handleCommand(command) {
  switch (command) {
    case 'profile':
      router.push('/profile');
      break;
    case 'settings':
      router.push('/settings');
      break;
    case 'logout':
      await userStore.logout();
      router.push('/login');
      break;
  }
}

onMounted(() => {
  loadNotifications();
});

function loadNotifications() {
  notifications.value = [
    {
      id: 1,
      type: 'visitor',
      title: '新访客提醒',
      message: '张三刚刚扫描了展位A001',
      time: '5分钟前',
      read: false
    },
    {
      id: 2,
      type: 'warning',
      title: '额度预警',
      message: '商家001的访客额度已使用90%',
      time: '1小时前',
      read: true
    }
  ];
  unreadCount.value = notifications.value.filter(n => !n.read).length;
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;

  .sidebar {
    background-color: #001529;
    overflow-x: hidden;

    .logo {
      height: 64px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      color: #fff;
      font-size: 18px;
      font-weight: bold;

      img {
        width: 32px;
        height: 32px;
        margin-right: 12px;
      }
    }

    .el-menu {
      border-right: none;
    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #fff;
    border-bottom: 1px solid #f0f0f0;
    padding: 0 20px;

    .header-left {
      display: flex;
      align-items: center;

      .collapse-btn {
        font-size: 20px;
        cursor: pointer;
        margin-right: 16px;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;

      .header-icon {
        font-size: 20px;
        cursor: pointer;
      }

      .user-info {
        display: flex;
        align-items: center;
        cursor: pointer;

        .username {
          margin: 0 8px;
        }
      }
    }
  }

  .main-content {
    background-color: #f5f5f5;
    padding: 20px;
  }

  .notification-list {
    .notification-item {
      display: flex;
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;

      &.unread {
        background-color: #f0f9ff;
      }

      &:hover {
        background-color: #fafafa;
      }

      .notification-icon {
        margin-right: 12px;
        font-size: 20px;
        color: #1890ff;
      }

      .notification-content {
        flex: 1;

        .notification-title {
          font-weight: bold;
          margin-bottom: 4px;
        }

        .notification-message {
          color: #666;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .notification-time {
          color: #999;
          font-size: 12px;
        }
      }
    }
  }
}
</style>
