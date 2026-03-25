import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '数据看板', icon: 'DataAnalysis' }
      },
      {
        path: 'organizer',
        name: 'Organizer',
        component: () => import('../views/Organizer.vue'),
        meta: { title: '主办方管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('../views/Role.vue'),
        meta: { title: '角色权限', icon: 'Lock' }
      },
      {
        path: 'package',
        name: 'Package',
        component: () => import('../views/Package.vue'),
        meta: { title: '套餐管理', icon: 'Box' }
      },
      {
        path: 'exhibition',
        name: 'Exhibition',
        component: () => import('../views/Exhibition.vue'),
        meta: { title: '展会管理', icon: 'Calendar' }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('../views/User.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('../views/Finance.vue'),
        meta: { title: '财务管理', icon: 'Money' }
      },
      {
        path: 'log',
        name: 'Log',
        component: () => import('../views/Log.vue'),
        meta: { title: '操作日志', icon: 'Document' }
      },
      {
        path: 'miniprogram',
        name: 'Miniprogram',
        component: () => import('../views/Miniprogram.vue'),
        meta: { title: '小程序管理', icon: 'Monitor' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '平台SaaS管理后台';
  const token = localStorage.getItem('token');
  if (to.path !== '/login' && !token) {
    next('/login');
  } else if (to.path === '/login' && token) {
    next('/');
  } else {
    next();
  }
});

export default router;
