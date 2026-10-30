// 登录态：登录接口返回的用户信息 + JWT token 的本地存取
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
  const session: Session = { user, loginAt: Date.now() };
  writeStored(SESSION_KEY, JSON.stringify(session), remember);
  writeStored(TOKEN_KEY, user.token ?? '', remember);
}

export function readSession(): Session | null {
  const raw = readStored(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    return parsed?.user?.userCode ? parsed : null;
  } catch {
    return null;
  }
}

/** 当前登录用户；未登录返回 null。 */
export function currentUser(): CurrentUser | null {
  return readSession()?.user ?? null;
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
}
