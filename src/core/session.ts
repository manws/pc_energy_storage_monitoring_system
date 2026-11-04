// 登录态：登录接口返回的用户信息 + JWT token 的本地存取
import { computed, shallowRef } from 'vue';
import type { RawLoginUser } from './api';

/** 当前登录用户，字段完全以登录接口返回的 userInfo 为准。 */
export type CurrentUser = RawLoginUser;

export interface Session {
  user: CurrentUser;
  /** 登录成功时间（毫秒），仅本地记录 */
  loginAt: number;
}

const SESSION_KEY = 'manws-session';
const TOKEN_KEY = 'manws-token';
const sessionUser = shallowRef<CurrentUser | null>(null);
let groupSynced = false;

/** 0 是管理员，不能当假值丢掉。只认 0 / 1，以及同义字段名。 */
export function userGroupId(user: object | null | undefined): number | null {
  if (!user) return null;
  const rec = user as Record<string, unknown>;
  for (const raw of [rec.usergroupId, rec.userGroupId, rec.UserGroupId]) {
    if (raw === 0 || raw === 1) return raw;
    if (raw === '0' || raw === '1') return Number(raw);
  }
  return null;
}

function rememberFlag(): boolean {
  try {
    return !!localStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}

function withGroup(user: CurrentUser): CurrentUser {
  const group = userGroupId(user);
  return group == null ? user : { ...user, usergroupId: group };
}

function readStored(key: string): string {
  try {
    const fromSession = sessionStorage.getItem(key);
    if (fromSession) return fromSession;
    const saved = localStorage.getItem(key);
    if (!saved) return '';
    // 「记住登录」的账号，本次会话内复用，避免每次读 localStorage
    sessionStorage.setItem(key, saved);
    return saved;
  } catch {
    return '';
  }
}

function writeStored(key: string, value: string, remember: boolean): void {
  sessionStorage.setItem(key, value);
  if (remember) localStorage.setItem(key, value);
  else localStorage.removeItem(key);
}

function clearStored(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* 存储被浏览器禁用时忽略 */
  }
}

/** 登录成功后写入用户信息与 token。 */
export function saveSession(user: CurrentUser, remember: boolean): void {
  const next = withGroup(user);
  const session: Session = { user: next, loginAt: Date.now() };
  writeStored(SESSION_KEY, JSON.stringify(session), remember);
  writeStored(TOKEN_KEY, next.token ?? '', remember);
  sessionUser.value = next;
}

export function readSession(): Session | null {
  const raw = readStored(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.user?.userCode) return null;
    parsed.user = withGroup(parsed.user);
    return parsed;
  } catch {
    return null;
  }
}

sessionUser.value = readSession()?.user ?? null;

/** 当前登录用户；未登录返回 null。 */
export function currentUser(): CurrentUser | null {
  return sessionUser.value;
}

export function useSessionUser() {
  return computed(() => sessionUser.value);
}

/** 登录返回的 usergroupId：0 管理员，1 值班人员。0 必须按数字比较，不能当假值。 */
export function isDutyUser(user: CurrentUser | null = currentUser()): boolean {
  return userGroupId(user) === 1;
}

/** 刷新后按后台用户详情校正用户组，避免本地会话把 0 弄丢。 */
export async function syncUserGroup(): Promise<void> {
  const user = sessionUser.value;
  if (groupSynced || !user?.userId) return;
  groupSynced = true;
  try {
    const { EmsApi } = await import('./api');
    const res = await EmsApi.userSingle(user.userId);
    const group = userGroupId(res?.userInfo);
    if (group == null || group === userGroupId(user)) return;
    saveSession({ ...user, usergroupId: group }, rememberFlag());
  } catch {
    /* 校正失败时沿用本地会话 */
  }
}

/** 当前 token，用于请求头 Authorization。 */
export function authToken(): string {
  return readStored(TOKEN_KEY);
}

export function hasSession(): boolean {
  return !!readSession();
}

export function clearSession(): void {
  clearStored();
  sessionUser.value = null;
  groupSynced = false;
}
