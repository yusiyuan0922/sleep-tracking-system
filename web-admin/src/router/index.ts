import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/Index.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/',
      component: MainLayout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/dashboard/Index.vue'),
          meta: { title: '仪表盘' },
        },
        {
          path: 'hospital',
          name: 'Hospital',
          component: () => import('../views/hospital/Index.vue'),
          meta: { title: '医院管理' },
        },
        {
          path: 'doctor',
          name: 'Doctor',
          component: () => import('../views/doctor/Index.vue'),
          meta: { title: '医生管理' },
        },
        {
          path: 'patient',
          name: 'Patient',
          component: () => import('../views/patient/Index.vue'),
          meta: { title: '患者列表' },
        },
        {
          path: 'stage-record',
          name: 'StageRecord',
          component: () => import('../views/stage-record/Index.vue'),
          meta: { title: '阶段记录' },
        },
        {
          path: 'scale',
          name: 'Scale',
          component: () => import('../views/scale/Index.vue'),
          meta: { title: '量表管理' },
        },
        {
          path: 'medication',
          name: 'Medication',
          component: () => import('../views/medication/Index.vue'),
          meta: { title: '用药记录' },
        },
        {
          path: 'adverse-event',
          name: 'AdverseEvent',
          component: () => import('../views/adverse-event/Index.vue'),
          meta: { title: '不良事件' },
        },
        {
          path: 'medical-file',
          name: 'MedicalFile',
          component: () => import('../views/medical-file/Index.vue'),
          meta: { title: '病历文件' },
        },
      ],
    },
  ],
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (!token && to.path !== '/login') {
    next('/login');
  } else if (token && to.path === '/login') {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
