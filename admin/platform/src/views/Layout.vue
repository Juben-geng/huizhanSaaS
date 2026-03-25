<template>
  <el-container class="layout-container">
    <div v-if="mobileSidebarOpen" class="mobile-overlay" @click="mobileSidebarOpen = false"></div>
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar" :class="{ 'mobile-open': mobileSidebarOpen }">
      <div class="logo">
        <el-icon :size="28" color="#409eff"><DataAnalysis /></el-icon>
        <span v-show="!isCollapse">SaaS管理平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard" v-sound:hover>
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>
        <el-menu-item index="/organizer" v-sound:hover>
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>主办方管理</template>
        </el-menu-item>
        <el-menu-item index="/package" v-sound:hover>
          <el-icon><Box /></el-icon>
          <template #title>套餐管理</template>
        </el-menu-item>
        <el-menu-item index="/exhibition" v-sound:hover>
          <el-icon><Calendar /></el-icon>
          <template #title>展会管理</template>
        </el-menu-item>
        <el-menu-item index="/user" v-sound:hover>
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/finance" v-sound:hover>
          <el-icon><Money /></el-icon>
          <template #title>财务管理</template>
        </el-menu-item>
        <el-menu-item index="/log" v-sound:hover>
          <el-icon><Document /></el-icon>
          <template #title>操作日志</template>
        </el-menu-item>
        <el-menu-item index="/miniprogram" v-sound:hover>
          <el-icon><Monitor /></el-icon>
          <template #title>小程序管理</template>
        </el-menu-item>
        <el-menu-item index="/settings" v-sound:hover>
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse" v-sound:click>
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-icon class="notification-icon" @click="showNotificationDrawer" v-sound:click>
              <Bell />
            </el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userStore.avatar" />
              <span class="username">{{ userStore.userName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile" v-sound:click>个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" v-sound:click>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>

    <el-drawer v-model="notificationDrawerVisible" title="消息通知" size="400px">
      <div class="notification-list">
        <div v-if="notifications.length === 0" class="empty">暂无消息</div>
        <div
          v-for="item in notifications"
          :key="item.id"
          class="notification-item"
          :class="{ unread: !item.read }"
          @click="markAsRead(item)"
        >
          <div class="notification-content">{{ item.content }}</div>
          <div class="notification-time">{{ formatTime(item.time) }}</div>
        </div>
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../stores/user';
import request from '../utils/request';
import dayjs from 'dayjs';
import { io } from 'socket.io-client';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const isCollapse = ref(false);
const mobileSidebarOpen = ref(false);
const notificationDrawerVisible = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);

const activeMenu = computed(() => route.path);

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta.title);
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title
  }));
});

onMounted(() => {
  loadNotifications();
  initSocket();
});

function toggleCollapse() {
  if (window.innerWidth <= 768) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value;
  } else {
    isCollapse.value = !isCollapse.value;
  }
}

async function loadNotifications() {
  try {
    const data = await request.get('/platform/notifications');
    notifications.value = data;
    unreadCount.value = notifications.value.filter(n => !n.read).length;
  } catch (error) {
    console.error('Load notifications error:', error);
  }
}

function showNotificationDrawer() {
  notificationDrawerVisible.value = true;
}

async function markAsRead(item) {
  if (!item.read) {
    try {
      await request.put(`/platform/notifications/${item.id}/read`);
      item.read = true;
      unreadCount.value--;
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  }
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm');
}

function handleCommand(command) {
  if (command === 'logout') {
    userStore.logout();
    router.push('/login');
  } else if (command === 'profile') {
    router.push('/settings');
  }
}

let socket = null;

function initSocket() {
  if (socket) {
    return;
  }

  socket = io(`${import.meta.env.VITE_API_BASE_URL}`, {
    auth: { token: localStorage.getItem('token') }
  });

  socket.on('notification', (data) => {
    notifications.value.unshift(data);
    unreadCount.value++;
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
}

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
});
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
  position: relative;

  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    animation: fadeIn 0.3s ease;
  }

  .sidebar {
    background-color: #304156;
    transition: width 0.3s;
    position: relative;
    z-index: 100;

    @media (max-width: 768px) {
      position: fixed;
      height: 100%;
      left: 0;
      top: 0;
      z-index: 1000;
      transform: translateX(-100%);
      transition: transform 0.3s ease;

      &.mobile-open {
        transform: translateX(0);
      }
    }

    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      border-bottom: 1px solid #1f2d3d;

      @media (max-width: 576px) {
        padding: 0 12px;
        font-size: 16px;
      }

      img {
        width: 32px;
        height: 32px;
        margin-right: 10px;
      }

      span {
        white-space: nowrap;
        overflow: hidden;
      }
    }

    .el-menu {
      border-right: none;

      @media (max-width: 768px) {
        width: 220px !important;
      }
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    border-bottom: 1px solid #e6e6e6;
    padding: 0 20px;

    @media (max-width: 768px) {
      padding: 0 12px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      @media (max-width: 576px) {
        gap: 8px;
      }

      .collapse-btn {
        font-size: 20px;
        cursor: pointer;
        color: #606266;

        @media (max-width: 576px) {
          font-size: 18px;
        }
      }

      :deep(.el-breadcrumb) {
        @media (max-width: 576px) {
          font-size: 12px;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;

      @media (max-width: 576px) {
        gap: 12px;
      }

      .notification-badge {
        cursor: pointer;

        @media (max-width: 576px) {
          display: none;
        }

        .notification-icon {
          font-size: 20px;
          color: #606266;
        }
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        @media (max-width: 576px) {
          gap: 4px;

          .username {
            display: none;
          }
        }

        .username {
          color: #606266;
        }
      }
    }
  }

  .main {
    background-color: #f0f2f5;
    padding: 20px;
    overflow-y: auto;

    @media (max-width: 768px) {
      padding: 12px;
    }

    @media (max-width: 576px) {
      padding: 8px;
    }
  }

  .notification-list {
    .empty {
      text-align: center;
      color: #909399;
      padding: 40px 0;
    }

    .notification-item {
      padding: 16px;
      border-bottom: 1px solid #ebeef5;
      cursor: pointer;

      @media (max-width: 576px) {
        padding: 12px;
      }

      &.unread {
        background-color: #f5f7fa;
      }

      &:hover {
        background-color: #f5f7fa;
      }

      .notification-content {
        margin-bottom: 8px;
        color: #303133;

        @media (max-width: 576px) {
          font-size: 13px;
        }
      }

      .notification-time {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

@media (max-width: 768px) {
  :deep(.el-drawer) {
    width: 100% !important;
  }
}

@media (max-width: 576px) {
  :deep(.el-dropdown-menu) {
    min-width: 120px;
  }
}
</style>
