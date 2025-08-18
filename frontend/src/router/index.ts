import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import UserTasksView from '../views/UserTasksView.vue';
import AllTasksView from '../views/AllTasksView.vue';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { title: '实时任务' }
  },
  {
    path: '/users',
    name: 'UserList',
    component: UserTasksView,
    meta: { title: '用户列表' }
  },
  {
    path: '/tasks',
    name: 'TaskSearch',
    component: AllTasksView,
    meta: { title: '用户任务查询' }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
