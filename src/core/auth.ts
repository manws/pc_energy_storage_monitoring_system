// 登录签名与登录态：与 admin-das / 宣海系各系统保持一致（js-md5 + 固定拼接串）
import md5 from 'js-md5';
import type { BLoginModel } from './api';

/**
 * 签名 key，由服务端登录接口的 String.Format 硬编码决定。
 * 本机 EMS 服务为 `bjxy_...`，与宣海系其它系统的 `xhedc_...` 不同，混用会返回 255。
 * 部署其它环境可用 VITE_LOGIN_KEY 覆盖。
 */
const LOGIN_KEY = (import.meta.env.VITE_LOGIN_KEY as string | undefined) || 'bjxy_jiangbo_zhuhui_123!@#';

/** 生成带签名的登录参数：先验签名、后验账号密码。 */
export function signLogin(userCode: string, userPwd: string): BLoginModel {
  const loginOn = Math.floor(Date.now() / 1000);
  const raw = `userCode=${userCode}&&userPwd=${userPwd}&&loginOn=${loginOn}&&key=${LOGIN_KEY}`;
  return { userCode, userPwd, loginOn, sign: md5(raw) };
}
