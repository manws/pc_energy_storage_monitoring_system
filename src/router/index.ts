import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import EnergyLoginView from '@/views/EnergyLoginView.vue';
import { setEnergyScope, stopEnergyLoop } from '@/composables/useEnergy';
import DeskView from '@/views/DeskView.vue';
import MeterDataView from '@/views/MeterDataView.vue';
import DeviceInfoView from '@/views/DeviceInfoView.vue';
import ConfigView from '@/views/ConfigView.vue';
import AlarmListView from '@/views/AlarmListView.vue';
import UserListView from '@/views/UserListView.vue';
import { DUTY_HIDDEN, deskMenus, menusFor, type DeskMenu } from '@/core/deskNav';
import { hasSession, isDutyUser, syncUserGroup } from '@/core/session';

export type { DeskMenu };
export { deskMenus, menusFor };

// true：旧版登录页；false：新版登录页。
const USE_LEGACY_LOGIN: boolean = false;

interface DeskPage extends DeskMenu {
  component: RouteRecordRaw['component'];
  props?: Record<string, string>;
}

const deskViews: Record<string, RouteRecordRaw['component']> = {
  meters: MeterDataView,
  devices: DeviceInfoView,
  stats: AlarmListView,
  config: ConfigView,
  users: UserListView
};

const deskPages: DeskPage[] = deskMenus.map((item) => ({ ...item, component: deskViews[item.name] }));

const [entry, ...rest] = deskPages;

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: USE_LEGACY_LOGIN ? LoginView : EnergyLoginView },
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

router.beforeEach(async (to) => {
  const signedIn = hasSession();
  if (to.name === 'login') return signedIn ? { name: 'home' } : true;
  if (!signedIn) {
    const redirect = to.fullPath === '/' ? undefined : to.fullPath;
    return { name: 'login', query: redirect ? { redirect } : {} };
  }
  await syncUserGroup();
  if (DUTY_HIDDEN.has(String(to.name)) && isDutyUser()) return { name: 'meters' };
  return true;
});

router.afterEach((to) => {
  if (to.name === 'login') {
    stopEnergyLoop();
    return;
  }
  const name = String(to.name ?? '');
  setEnergyScope(
    name === 'home' ? 'screen'
      : name === 'meters' ? 'meter'
        : name === 'devices' ? 'device'
          : 'idle'
  );
});

export default router;
