import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import DeskView from '@/views/DeskView.vue';
import MeterDataView from '@/views/MeterDataView.vue';
import DeviceInfoView from '@/views/DeviceInfoView.vue';
import SoonView from '@/views/SoonView.vue';

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
  { name: 'devices', label: '设备信息', title: '充放电机与 BMS', component: DeviceInfoView },
  { name: 'stats', label: '统计', title: '运行统计', component: SoonView, props: { note: '统计' } },
  { name: 'config', label: '配置', title: '系统配置', component: SoonView, props: { note: '配置' } },
  { name: 'users', label: '用户管理', title: '用户管理', component: SoonView, props: { note: '用户管理' } }
];

export const deskMenus: DeskMenu[] = deskPages.map(({ name, label, title }) => ({ name, label, title }));

const [entry, ...rest] = deskPages;

const router = createRouter({
  history: createWebHistory(),
  routes: [
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

export default router;
