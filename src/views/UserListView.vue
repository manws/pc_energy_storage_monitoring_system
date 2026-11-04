<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { EmsApi } from '@/core/api';
import type { RawUser } from '@/core/api';
import { userGroupId } from '@/core/session';
import ListPager from '@/components/ListPager.vue';

interface UserRow {
  id: number;
  name: string;
  login: string;
  phone: string;
  email: string;
  role: string;
  active: boolean;
  updatedAt: string;
  updatedBy: string;
  groupId: number;
}

interface UserForm {
  id: number | null;
  name: string;
  login: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirm: string;
  active: boolean;
  groupId: number;
}

const ROLE_OPTIONS = [
  { id: 0, label: '管理员' },
  { id: 1, label: '值班人员' }
] as const;

function roleOf(groupId: number): string {
  return ROLE_OPTIONS.find((item) => item.id === groupId)?.label ?? '值班人员';
}

function groupIdOf(groupId: number): number {
  return groupId === 0 ? 0 : 1;
}
const pageSize = ref(50);
type ActiveFilter = 'all' | 'on' | 'off';

const users = ref<UserRow[]>([]);
const total = ref(0);
const loading = ref(false);
const saving = ref(false);
const listError = ref('');

const open = ref(false);
const error = ref('');
const userCode = ref('');
const userName = ref('');
const activeFilter = ref<ActiveFilter>('all');
const appliedUserCode = ref('');
const appliedUserName = ref('');
const page = ref(1);
const form = reactive<UserForm>(blank());

function rowOf(u: RawUser): UserRow {
  return {
    id: u.id,
    name: u.userName,
    login: u.userCode,
    phone: u.phone ?? '',
    email: u.email ?? '',
    role: roleOf(userGroupId(u) ?? 0),
    active: u.enabled === 1,
    updatedAt: (u.updateOn ?? '').slice(0, 10),
    updatedBy: u.updateBy ?? '',
    groupId: userGroupId(u) ?? 0
  };
}

function applyEnabled(list: UserRow[]): UserRow[] {
  if (activeFilter.value === 'on') return list.filter((item) => item.active);
  if (activeFilter.value === 'off') return list.filter((item) => !item.active);
  return list;
}

async function load() {
  loading.value = true;
  listError.value = '';
  try {
    const res = await EmsApi.userPage({
      userCode: appliedUserCode.value.trim(),
      userName: appliedUserName.value.trim(),
      pageIndex: page.value,
      pageSize: pageSize.value
    });
    const list = applyEnabled((res.userList ?? []).map(rowOf));
    users.value = list;
    total.value = activeFilter.value === 'all' ? (res.page?.totalCount ?? list.length) : list.length;
  } catch (e) {
    listError.value = e instanceof Error ? e.message : String(e);
    users.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

function reloadFromFirstPage() {
  if (page.value === 1) void load();
  else page.value = 1;
}

function selectFilter(next: ActiveFilter) {
  if (activeFilter.value === next) return;
  activeFilter.value = next;
  reloadFromFirstPage();
}

function search() {
  appliedUserCode.value = userCode.value;
  appliedUserName.value = userName.value;
  reloadFromFirstPage();
}

function reset() {
  userCode.value = '';
  userName.value = '';
  activeFilter.value = 'all';
  appliedUserCode.value = '';
  appliedUserName.value = '';
  reloadFromFirstPage();
}

watch([page, pageSize], () => { void load(); });
watch(pages, (n) => { if (page.value > n) page.value = n; });

function blank(): UserForm {
  return { id: null, name: '', login: '', phone: '', email: '', password: '', passwordConfirm: '', active: true, groupId: 1 };
}

function create() {
  Object.assign(form, blank());
  error.value = '';
  open.value = true;
}

function edit(row: UserRow) {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    login: row.login,
    phone: row.phone,
    email: row.email,
    password: '',
    passwordConfirm: '',
    active: row.active,
    groupId: groupIdOf(row.groupId)
  });
  error.value = '';
  open.value = true;
}

function close() {
  open.value = false;
}

async function save() {
  const name = form.name.trim();
  const login = form.login.trim();
  const phone = form.phone.trim();
  const email = form.email.trim();
  if (!name || !login) {
    error.value = '请填写登录名称和姓名';
    return;
  }
  if (phone && !/^1\d{10}$/.test(phone)) {
    error.value = '手机号需要 11 位数字';
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    error.value = '邮箱格式不正确';
    return;
  }
  const password = form.password.trim();
  const passwordConfirm = form.passwordConfirm.trim();
  if (form.id == null || password || passwordConfirm) {
    if (!password) {
      error.value = '请输入密码';
      return;
    }
    if (password !== passwordConfirm) {
      error.value = '两次输入的密码不一致';
      return;
    }
  }
  const duplicated = users.value.some((item) => item.login === login && item.id !== form.id);
  if (duplicated) {
    error.value = '登录名称已存在';
    return;
  }

  const payload: Partial<RawUser> = {
    usergroupId: form.groupId,
    userCode: login,
    userName: name,
    phone,
    email,
    enabled: form.active ? 1 : 0
  };
  if (password) payload.userPwd = password;

  saving.value = true;
  error.value = '';
  try {
    if (form.id == null) {
      await EmsApi.userInsert(payload);
    } else {
      await EmsApi.userUpdate(form.id, { ...payload, userId: form.id });
    }
    close();
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="page">
    <header class="bar">
      <nav class="filters" aria-label="激活状态">
        <button type="button" :class="{ on: activeFilter === 'all' }" @click="selectFilter('all')">全部</button>
        <button type="button" :class="{ on: activeFilter === 'on' }" @click="selectFilter('on')">已激活</button>
        <button type="button" :class="{ on: activeFilter === 'off' }" @click="selectFilter('off')">未激活</button>
      </nav>
      <div class="tools">
        <label class="find">
          登录名称
          <el-input v-model="userCode" class="desk-field word" placeholder="输入登录名称" clearable @keyup.enter="search" />
        </label>
        <label class="find">
          姓名
          <el-input v-model="userName" class="desk-field word" placeholder="输入姓名" clearable @keyup.enter="search" />
        </label>
        <button type="button" class="ghost" @click="reset">重置</button>
        <button type="button" class="search" @click="search">搜索</button>
        <button type="button" class="add" @click="create">新增</button>
      </div>
    </header>

    <div class="data">
    <div class="board">
      <table v-if="users.length">
        <thead>
          <tr>
            <th class="idx">序号</th>
            <th>登录名称</th>
            <th>姓名</th>
            <th>手机号</th>
            <th>邮箱</th>
            <th>权限</th>
            <th>是否激活</th>
            <th>更新人员</th>
            <th>更新日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in users" :key="row.id" :class="{ off: !row.active }">
            <td class="num idx">{{ (page - 1) * pageSize + index + 1 }}</td>
            <td class="num">{{ row.login }}</td>
            <td class="who">{{ row.name }}</td>
            <td class="num">{{ row.phone }}</td>
            <td>{{ row.email }}</td>
            <td><span class="role" :class="{ admin: row.groupId === 0 }">{{ row.role }}</span></td>
            <td><span class="state" :class="{ off: !row.active }">{{ row.active ? '是' : '否' }}</span></td>
            <td>{{ row.updatedBy }}</td>
            <td class="num time">{{ row.updatedAt }}</td>
            <td><button type="button" class="link" @click="edit(row)">编辑</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="loading" class="empty">加载中…<span>正在获取用户列表</span></p>
      <p v-else-if="listError" class="empty">用户列表加载失败<span>{{ listError }}</span></p>
      <p v-else class="empty">没有符合条件的用户<span>换个状态，或改一下登录名称、姓名后再搜索</span></p>
    </div>
    <footer class="foot">
      <p>共 <b class="num">{{ total }}</b> 人</p>
      <ListPager v-model:page="page" v-model:size="pageSize" :pages="pages" />
    </footer>
    </div>

    <el-dialog
      v-model="open"
      :title="form.id == null ? '新增用户' : '编辑用户'"
      width="480px"
      align-center
      :append-to-body="false"
      @closed="error = ''"
    >
      <form class="form" @submit.prevent="save">
        <label>登录名称<el-input v-model="form.login" class="desk-field" maxlength="20" :disabled="form.id != null" /></label>
        <label>姓名<el-input v-model="form.name" class="desk-field" maxlength="20" :disabled="form.id != null" /></label>
        <label>手机号<el-input v-model="form.phone" class="desk-field" maxlength="11" /></label>
        <label>邮箱<el-input v-model="form.email" class="desk-field" maxlength="40" /></label>
        <label>权限
          <el-select v-model="form.groupId" class="desk-field" popper-class="desk-select">
            <el-option v-for="item in ROLE_OPTIONS" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </label>
        <label class="check">是否激活<el-checkbox v-model="form.active" /></label>
        <label>密码<el-input v-model="form.password" class="desk-field" type="password" maxlength="40" show-password :placeholder="form.id == null ? '请输入密码' : '留空则不修改'" /></label>
        <label>确认密码<el-input v-model="form.passwordConfirm" class="desk-field" type="password" maxlength="40" show-password :placeholder="form.id == null ? '请再次输入密码' : '留空则不修改'" /></label>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      <template #footer>
        <el-button @click="close" :disabled="saving">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 16px;
  min-height: 60px;
  padding: 11px 12px;
  border: 1px solid var(--desk-line);
  border-radius: 8px;
  background: var(--desk-surface);
}

.filters {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 36px;
  padding: 3px;
  border: 1px solid var(--desk-line-strong);
  border-radius: 8px;
  background: #06101b;
}

.filters button {
  height: 28px;
  padding: 0 14px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--desk-muted);
  font: inherit;
  cursor: pointer;
}

.filters button.on {
  color: #06101b;
  background: var(--desk-accent);
  font-weight: 500;
}

.tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-left: auto;
}

.find {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--desk-muted);
  font-size: 12px;
}

.find :deep(.word) { width: 148px; }

.ghost,
.search,
.add {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.ghost {
  color: var(--desk-text-2);
  background: var(--desk-surface);
  border: 1px solid var(--desk-line-strong);
}

.ghost:hover { border-color: var(--desk-accent); color: var(--desk-text); }

.search,
.add {
  border: 0;
  background: var(--desk-accent);
  color: #06101b;
  font-weight: 500;
}

.search:hover,
.add:hover { filter: brightness(1.08); }


.data {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--desk-line);
  border-radius: 8px;
  background: var(--desk-surface);
  overflow: hidden;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 48px;
  padding: 0 16px;
  background: var(--desk-deep);
}

.foot p { margin: 0; color: var(--desk-muted); font-size: 13px; }
.foot b { color: var(--desk-text); font-weight: 500; }

.empty {
  margin: 0;
  padding: 56px 16px;
  display: grid;
  justify-items: center;
  gap: 6px;
  color: var(--desk-text);
}

.empty span { color: var(--desk-dim); font-size: 13px; }

tr.off .link { color: var(--desk-accent); }

.link {
  border: 0;
  background: none;
  color: var(--desk-accent);
  font: inherit;
  cursor: pointer;
}

.link:hover { color: var(--desk-text); }

.board {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

th, td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--desk-line);
  text-align: left;
  white-space: nowrap;
}

th {
  position: sticky;
  top: 0;
  z-index: 2;
  color: var(--desk-muted);
  font-weight: 500;
  background: var(--desk-deep);
  box-shadow: 0 1px 0 var(--desk-line);
}

td { color: var(--desk-text-2); }
.idx { width: 64px; color: var(--desk-dim); }
.who { font-weight: 600; color: var(--desk-text); }
.time { color: #a9cfe3; }
.role {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 4px;
  color: #a9cfe3;
  background: var(--desk-line);
  border: 1px solid var(--desk-line-strong);
}
.role.admin {
  color: #06101b;
  background: var(--desk-accent);
  border-color: var(--desk-accent);
}
tr.off .who,
tr.off td { color: var(--desk-muted); }

.state { color: #7dffc3; }
tr.off .state { color: #f5c15a; }

.link {
  padding: 0;
  border: 0;
  color: var(--desk-accent);
}

tbody tr:hover td { background: rgba(109, 209, 250, 0.04); }

.form {
  display: grid;
  gap: 12px;
}

.form label {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
  gap: 10px;
  color: #9fd0e6;
  font-size: 13px;
}

.form :deep(.el-select) { width: 100%; }

.check {
  grid-template-columns: 80px auto;
  justify-content: start;
}

.error { margin: 0; color: #ff8a8a; font-size: 13px; }

</style>
