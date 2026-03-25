import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '数据概览', icon: 'DataAnalysis' }
      },
      {
        path: '/exhibition',
        name: 'Exhibition',
        component: () => import('../views/Exhibition.vue'),
        meta: { title: '展会管理', icon: 'OfficeBuilding' }
      },
      {
        path: '/merchant',
        name: 'Merchant',
        component: () => import('../views/Merchant.vue'),
        meta: { title: '商家管理', icon: 'Shop' }
      },
      {
        path: '/visitor',
        name: 'Visitor',
        component: () => import('../views/Visitor.vue'),
        meta: { title: '访客管理', icon: 'User' }
      },
      {
        path: '/activity',
        name: 'Activity',
        component: () => import('../views/Activity.vue'),
        meta: { title: '活动管理', icon: 'Trophy' }
      },
      {
        path: '/data-screen',
        name: 'DataScreen',
        component: () => import('../views/DataScreen.vue'),
        meta: { title: '数据大屏', icon: 'Monitor' }
      },
      {
        path: '/settings',
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
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.path === '/login' && token) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
