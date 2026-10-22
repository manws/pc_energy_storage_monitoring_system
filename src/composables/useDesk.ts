import { computed, markRaw, ref, type Component } from 'vue';
import MeterDataView from '@/views/MeterDataView.vue';
import DeviceInfoView from '@/views/DeviceInfoView.vue';

export interface DeskMenu {
  id: string;
  label: string;
  title: string;
  view?: Component;
}

export const deskMenus: DeskMenu[] = [
  { id: 'meters', label: '电表数据', title: '五路有功功率', view: markRaw(MeterDataView) },
  { id: 'devices', label: '设备信息', title: '充放电机与 BMS', view: markRaw(DeviceInfoView) },
  { id: 'stats', label: '统计', title: '运行统计' },
  { id: 'config', label: '配置', title: '系统配置' },
  { id: 'users', label: '用户管理', title: '用户管理' }
];

const menuId = ref(deskMenus[0].id);

export function useDesk() {
  const current = computed(() => deskMenus.find((item) => item.id === menuId.value) ?? deskMenus[0]);

  function go(id: string) {
    if (deskMenus.some((item) => item.id === id)) menuId.value = id;
  }

  return { menuId, current, go, deskMenus };
}
