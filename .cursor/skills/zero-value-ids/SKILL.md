---
name: zero-value-ids
description: >-
  Prevents treating numeric 0 as missing or falsy in this EMS project. 0 is a
  valid backend value: usergroupId 0 is admin, channel/index/step may also be 0.
  Use when writing or reviewing Vue/TypeScript conditionals, defaults, menus,
  permissions, usergroupId, userGroupId, channelId, Index, nStepCode, enabled,
  or any `||` / `??` / `if (!id)` fallback. Triggers: 用户组, 管理员, 值班,
  菜单不见, 刷新丢菜单, 0值, 假值.
---

# 数值 0 是合法值

本项目后端大量用 `0` 表示真实含义，**不能当空值或假值丢掉**。

刷新后管理员菜单消失，就是因为 `usergroupId === 0` 被写成了值班人员。

## 领域约定

| 字段 | `0` 的含义 | `1` 的含义 | 缺省 |
| --- | --- | --- | --- |
| `usergroupId` / `userGroupId` | 管理员，显示全部菜单 | 值班人员，隐藏「配置信息」「用户管理」 | 管理员 `0` |
| `channelId` / `Index` / `nStepCode` | 合法编号或工步 | — | 不要改写成 `1` |
| `enabled` / `eventTypeCode` | 未激活 / 事件 | 激活 / 报警 | 用 `===` 比较 |

用户组只通过 `userGroupId()`（`src/core/session.ts`）读取。菜单用 `menusFor()`（`src/core/deskNav.ts`）。

## 禁止

```ts
if (!user.usergroupId) { /* 0 管理员会进来 */ }
const group = user.usergroupId || 1;
const group = user.usergroupId ?? 1; // 后端省略 0 时也会变成值班
const channel = item.channelId || '—';
const step = num(raw.nStepCode, 1) || 1;
if (channelId) { /* 通道 0 会当成没有 */ }
```

## 必须

```ts
import { userGroupId, isDutyUser } from '@/core/session';

const group = userGroupId(user);          // 只认 0 / 1
if (isDutyUser(user)) { /* 仅 === 1 */ }
if (group === 0) { /* 管理员 */ }

item.channelId == null || String(item.channelId).trim() === ''
  ? '—'
  : String(item.channelId);

num(raw.nStepCode, 1);                   // 不要再 `|| 1`
```

缺字段时按后台默认补 **`0`（管理员）**，不要补 `1`。

## 改代码时检查

- 条件、默认值、过滤菜单、路由守卫是否用了 `!id` / `|| 1` / `?? 1`
- `usergroupId` 是否经过 `userGroupId()`，比较是否写成 `=== 0` / `=== 1`
- 刷新后会话是否还能读到数字 `0`（不要靠 `if (usergroupId)` 判断已登录权限）
- `channelId`、`Index`、`nStepCode`、`enabled`、`eventTypeCode` 是否同样被假值判断误伤
