# 储能监控系统

储能电站监控大屏（Vue 3 + Vite + TypeScript + ECharts + Element Plus）。

## 快速开始

```bash
npm install          # Node >= 18（推荐 20）
npm run dev          # 开发：http://localhost:32991
npm run build        # 生产构建，产物在 dist/
npm run preview       # 本地预览构建产物
npm run typecheck    # 类型检查（vue-tsc）
```

## 后端接口接入

后端服务：`YT.EMSWebViewApiServer`，Swagger 文档 `http://8.140.182.55:26029/swagger/v1/swagger.json`。
所有业务接口均为 `POST` + `application/json`，统一响应信封 `{ code, message, result }`（`workSpaceNameList` 例外，直接返回数组）。

### 已接入的接口

| 页面 / 模块 | 接口 | 说明 |
|---|---|---|
| 实时监控大屏 / 电表 / 储能 | `POST /api/v1/Device/deviceData` | 通道实时电压/电流/功率、BMS、功率曲线 |
| | `POST /api/v1/Meter/meterData` | 五路有功功率 720 点历史曲线 |
| | `POST /api/v1/BigScreen/bigScreen` | 大屏汇总（电表、SOC、告警数、节省电量） |
| | `POST /api/v1/Event/current` | 当前事件/告警滚动 |
| 告警信息 | `POST /api/v1/Event/pageList` | 事件分页（支持 `eventType` / `eventDate` 过滤） |
| 配置信息 | `POST /api/v1/WorkSpace/workSpaceNameList` | 工作单元列表 |
| | `POST /api/v1/Param/paramData/{workSpaceName}` | 电表/BMS/设备/阈值/协议配置 |
| 用户管理 | `POST /api/v1/User/pageList` | 用户分页 |
| | `POST /api/v1/User/insert` | 新增用户 |
| | `POST /api/v1/User/update/{userId}` | 更新用户 |
| | `POST /api/v1/User/single/{userId}` | 用户详情 |
| 登录（**待接入**） | `POST /api/v1/User/login` | 需后端提供签名 key，见下文 |

### 代码结构

- `src/core/api.ts` —— 统一请求层与原始响应类型。
- `src/core/apiMapper.ts` —— 接口数据 → 前端 `EnergyState` / `WorkspaceCfg` 映射。
- `src/composables/useEnergy.ts` —— 实时数据轮询（默认 10s），所有监控组件的数据源。

## 环境变量

| 变量 | 默认 | 作用 |
|---|---|---|
| `VITE_API_BASE` | 空（走同源 `/api`） | 生产环境后端地址前缀。留空时请求 `/api/...`，由部署侧反代转发；也可直接填后端地址（需后端允许跨域）。 |
| `VITE_API_PROXY` | `http://8.140.182.55:26029` | **仅开发/preview**：vite dev server `/api` 代理目标。 |
| `VITE_USE_MOCK` | 空 | 置 `1` 时强制使用本地模拟器数据（不请求后端），用于离线演示。 |

示例（项目根目录新建 `.env.local`，不提交）：

```bash
# 开发时切换后端
VITE_API_PROXY=http://8.140.182.55:26029

# 生产构建指向独立后端域名（需后端开启 CORS）
# VITE_API_BASE=https://ems.example.com
```

## 生产部署

构建产物为纯静态文件（`dist/`），接口通过 `/api` 前缀访问。推荐由 Nginx 同源反代，避免跨域：

```nginx
server {
    listen 80;
    server_name ems.example.com;

    root /var/www/ems/dist;
    index index.html;

    # 前端路由（history 模式）回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 接口反代到后端
    location /api/ {
        proxy_pass http://8.140.182.55:26029;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

此时 `VITE_API_BASE` 保持为空即可（前端请求 `/api/...` 被 Nginx 转发）。
若后端与前端不同源且不走反代，则构建前设置 `VITE_API_BASE=<后端地址>`，并由后端开启 CORS。

## 登录接入（待后端提供 key）

登录接口 `POST /api/v1/User/login` 使用签名校验，签名算法（同宣海系其它系统，已验证）：

```
loginOn = Math.floor(Date.now() / 1000)        // 秒级时间戳
sign = md5(`userCode=${userCode}&&userPwd=${userPwd}&&loginOn=${loginOn}&&key=${KEY}`)
body = { userCode, userPwd, loginOn, sign }
```

校验顺序：先验签名、后验账号密码。

- 签名错误 → `code 255`「登录失败，指令令牌错误」
- 签名正确、账号密码错误 → `code 500`「用户名、密码错误…」
- 成功 → `code 200`，`result.userInfo`

**阻塞点**：本机 EMS 服务的 `KEY` 与其它宣海系统不同，需向后端索取。拿到后在接入时注入该 KEY 即可打通真实登录（当前登录页暂用本地座席逻辑）。

## 已知数据情况（2026-10-29 实测）

- BMS 明细字段（SOC/单体/温度）后端暂为空，相关面板显示 0 或整包视图（前端已降级处理）。
- 电表瞬时量测（大屏五表对象）当前全 0，历史功率曲线正常。
- 采集端时间戳存在滞后，实时值可能非当前时刻；前端以数据时间戳对齐曲线。
