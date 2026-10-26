import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import { startEnergyLoop, stopEnergyLoop } from '@/composables/useEnergy';
import DeskView from '@/views/DeskView.vue';
import MeterDataView from '@/views/MeterDataView.vue';
import DeviceInfoView from '@/views/DeviceInfoView.vue';
import ConfigView from '@/views/ConfigView.vue';
import AlarmListView from '@/views/AlarmListView.vue';
import UserListView from '@/views/UserListView.vue';

export interface DeskMenu {
  name: string;
  label: string;
  title: string;
}

interface DeskPage extends DeskMenu {
  component: RouteRecordRaw['component'];
  props?: Record<string, string>;
}

const deskPages: DeskPage[] = [
  { name: 'meters', label: '电表数据', title: '五路有功功率', component: MeterDataView },
  { name: 'devices', label: '储能监控', title: '储能通道监控', component: DeviceInfoView },
  { name: 'stats', label: '告警信息', title: '告警信息', component: AlarmListView },
  { name: 'config', label: '配置信息', title: '配置信息', component: ConfigView },
  { name: 'users', label: '用户管理', title: '用户管理', component: UserListView }
];

export const deskMenus: DeskMenu[] = deskPages.map(({ name, label, title }) => ({ name, label, title }));

const [entry, ...rest] = deskPages;

const SEAT_KEY = 'manws-seat';

function currentSeat() {
  const session = sessionStorage.getItem(SEAT_KEY);
  if (session) return session;
  const saved = localStorage.getItem(SEAT_KEY);
  if (!saved) return '';
  sessionStorage.setItem(SEAT_KEY, saved);
  return saved;
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'home', component: HomeView },
    {
      path: `/${entry.name}`,
      component: DeskView,
      children: [
        {
          path: '',
          name: entry.name,
          component: entry.component!,
          props: entry.props,
          meta: { label: entry.label, title: entry.title }
        },
        ...rest.map((page): RouteRecordRaw => ({
          path: `/${page.name}`,
          name: page.name,
          component: page.component!,
          props: page.props,
          meta: { label: page.label, title: page.title }
        }))
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
});

router.beforeEach((to) => {
  const signedIn = !!currentSeat();
  if (to.name === 'login') return signedIn ? { name: 'home' } : true;
  if (!signedIn) {
    const redirect = to.fullPath === '/' ? undefined : to.fullPath;
    return { name: 'login', query: redirect ? { redirect } : {} };
  }
  return true;
});

router.afterEach((to) => {
  if (to.name === 'login') stopEnergyLoop();
  else startEnergyLoop();
});

export default router;
