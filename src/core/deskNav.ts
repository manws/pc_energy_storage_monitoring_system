import { isDutyUser, type CurrentUser } from './session';

export interface DeskMenu {
  name: string;
  label: string;
  title: string;
}

export const deskMenus: DeskMenu[] = [
  { name: 'meters', label: '电表数据', title: '五路有功功率' },
  { name: 'devices', label: '储能监控', title: '储能通道监控' },
  { name: 'stats', label: '告警信息', title: '告警信息' },
  { name: 'config', label: '配置信息', title: '配置信息' },
  { name: 'users', label: '用户管理', title: '用户管理' }
];

/** 值班人员不可见；管理员（usergroupId === 0）全部可见。 */
export const DUTY_HIDDEN = new Set(['config', 'users']);

export function menusFor(user: CurrentUser | null): DeskMenu[] {
  if (isDutyUser(user)) return deskMenus.filter((item) => !DUTY_HIDDEN.has(item.name));
  return deskMenus;
}
