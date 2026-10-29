<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { EmsApi } from '@/core/api';
import type { RawUser } from '@/core/api';

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
  active: boolean;
  groupId: number;
}

const ROLE = '监控人员';
const pageSize = ref(50);
type ActiveFilter = 'all' | 'on' | 'off';

const users = ref<UserRow[]>([]);
const loading = ref(false);
const saving = ref(false);
const listError = ref('');

const open = ref(false);
const error = ref('');
const keyword = ref('');
const activeFilter = ref<ActiveFilter>('all');
const page = ref(1);
const form = reactive<UserForm>(blank());

function rowOf(u: RawUser): UserRow {
  return {
    id: u.id,
    name: u.userName,
    login: u.userCode,
    phone: u.phone ?? '',
    email: u.email ?? '',
    role: ROLE,
    active: u.enabled === 1,
    updatedAt: (u.updateOn ?? '').slice(0, 10),
    updatedBy: u.updateBy ?? '',
    groupId: u.usergroupId ?? 1
  };
}

async function load() {
  loading.value = true;
  listError.value = '';
  try {
    const res = await EmsApi.userPage({ pageIndex: 1, pageSize: 500 });
    users.value = (res.userList ?? []).map(rowOf);
  } catch (e) {
    listError.value = e instanceof Error ? e.message : String(e);
    users.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const matched = computed(() => {
  const word = keyword.value.trim().toLowerCase();
  return users.value.filter((item) => {
    if (activeFilter.value === 'on' && !item.active) return false;
    if (activeFilter.value === 'off' && item.active) return false;
    if (!word) return true;
    return [item.name, item.login, item.phone, item.email].some((field) => field.toLowerCase().includes(word));
  });
});
const pages = computed(() => Math.max(1, Math.ceil(matched.value.length / pageSize.value)));
const shown = computed(() => matched.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

watch([keyword, activeFilter], () => { page.value = 1; });
watch(pages, (n) => { if (page.value > n) page.value = n; });

function blank(): UserForm {
  return { id: null, name: '', login: '', phone: '', email: '', password: '', active: true, groupId: 1 };
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
    active: row.active,
    groupId: row.groupId
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
  if (form.id == null && !form.password.trim()) {
    error.value = '新增用户需要设置初始密码';
    return;
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
  if (form.password.trim()) payload.userPwd = form.password.trim();

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
        <button type="button" :class="{ on: activeFilter === 'all' }" @click="activeFilter = 'all'">全部</button>
        <button type="button" :class="{ on: activeFilter === 'on' }" @click="activeFilter = 'on'">已激活</button>
        <button type="button" :class="{ on: activeFilter === 'off' }" @click="activeFilter = 'off'">未激活</button>
      </nav>
      <label class="find">
        关键词
        <el-input v-model="keyword" class="desk-field word" placeholder="登录名称、姓名、手机号、邮箱" clearable />
      </label>
      <button type="button" class="add" @click="create">新增</button>
    </header>

    <div class="board">
      <table v-if="shown.length">
        <thead>
          <tr>
            <th>登录名称</th>
            <th>姓名</th>
            <th>手机号</th>
            <th>邮箱</th>
            <th>权限</th>
            <th>是否激活</th>
            <th>更新人员</th>
            <th>更新日期</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in shown" :key="row.id" :class="{ off: !row.active }">
            <td class="num">{{ row.login }}</td>
            <td class="who">{{ row.name }}</td>
            <td class="num">{{ row.phone }}</td>
            <td>{{ row.email }}</td>
            <td class="role-col">{{ row.role }}</td>
            <td><span class="state" :class="{ off: !row.active }">{{ row.active ? '是' : '否' }}</span></td>
            <td>{{ row.updatedBy }}</td>
            <td class="num time">{{ row.updatedAt }}</td>
            <td><button type="button" class="link" @click="edit(row)">编辑</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="loading" class="empty">加载中…<span>正在获取用户列表</span></p>
      <p v-else-if="listError" class="empty">用户列表加载失败<span>{{ listError }}</span></p>
      <p v-else class="empty">没有符合条件的用户<span>换个状态，或改一下关键字</span></p>
    </div>
    <footer class="foot">
      <p>共 <b class="num">{{ matched.length }}</b> 人</p>
      <ListPager v-model:page="page" v-model:size="pageSize" :pages="pages" />
    </footer>

    <el-dialog
      v-model="open"
      :title="form.id == null ? '新增用户' : '编辑用户'"
      width="440px"
      align-center
      :append-to-body="false"
      @closed="error = ''"
    >
      <form class="form" @submit.prevent="save">
        <label>登录名称<el-input v-model="form.login" class="desk-field" maxlength="20" :disabled="form.id != null" /></label>
        <label>姓名<el-input v-model="form.name" class="desk-field" maxlength="20" /></label>
        <label>{{ form.id == null ? '初始密码' : '重置密码' }}<el-input v-model="form.password" class="desk-field" type="password" maxlength="40" show-password :placeholder="form.id == null ? '请输入初始密码' : '留空则不修改'" /></label>
        <label>手机号<el-input v-model="form.phone" class="desk-field" maxlength="11" /></label>
        <label>邮箱<el-input v-model="form.email" class="desk-field" maxlength="40" /></label>
        <p class="role"><span>权限</span><b>{{ ROLE }}</b></p>
        <label class="check">是否激活<el-checkbox v-model="form.active" /></label>
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
  padding: 14px 18px 16px;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.filters { display: flex; gap: 8px; }

.filters button {
  height: 32px;
  padding: 0 14px;
  border: 1px solid rgba(90, 196, 255, 0.35);
  background: rgba(6, 28, 52, 0.55);
  color: #c5e6f5;
  font: inherit;
  letter-spacing: 0.06em;
  cursor: pointer;
}

.filters button.on {
  color: #04101c;
  background: #3ad4ff;
  border-color: #7ee7ff;
}

.find {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  color: #9fd0e6;
  font-size: 13px;
}

.find :deep(.word) { width: 260px; }


.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.foot p { margin: 0; color: #7eb4cc; font-size: 13px; }
.foot b { color: #e7f6ff; font-weight: 500; }

.empty {
  margin: 0;
  padding: 56px 16px;
  display: grid;
  justify-items: center;
  gap: 6px;
  color: #e7f6ff;
}

.empty span { color: #7eb4cc; font-size: 13px; }

tr.off .link { color: #9adfff; }

.add, .link {
  border: 1px solid rgba(90, 196, 255, 0.45);
  background: transparent;
  color: #c5e6f5;
  font: inherit;
  cursor: pointer;
}

.add {
  height: 32px;
  padding: 0 16px;
  letter-spacing: 0.08em;
}

.add:hover, .link:hover { color: #e7f6ff; border-color: #7ee7ff; }


.board {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid rgba(90, 196, 255, 0.28);
  background: #06182e;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th, td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(90, 196, 255, 0.14);
  text-align: left;
  white-space: nowrap;
}

th {
  position: sticky;
  top: 0;
  color: #7eb4cc;
  font-weight: 500;
  letter-spacing: 0.08em;
  background: #06182e;
}

td { color: #d7eef8; }
.who { font-weight: 600; color: #e7f6ff; }
.role-col { color: #7eb4cc; }
.time { color: #9fd0e6; }
tr.off .who,
tr.off td { color: #7eb4cc; }

.state { color: #7dffc3; }
tr.off .state { color: #f5c15a; }

.link {
  padding: 0 0 2px;
  border: 0;
  border-bottom: 1px dashed rgba(122, 212, 255, 0.7);
  color: #9adfff;
  letter-spacing: 0.08em;
}

tbody tr:hover td { background: rgba(58, 212, 255, 0.06); }

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

.check {
  grid-template-columns: 80px auto;
  justify-content: start;
}

.role {
  margin: 0;
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 10px;
  align-items: center;
  color: #9fd0e6;
  font-size: 13px;
}

.role b { color: #e7f6ff; font-weight: 500; }
.error { margin: 0; color: #ff8a8a; font-size: 13px; }

</style>
