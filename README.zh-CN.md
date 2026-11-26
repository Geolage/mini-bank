# MiniBank · 网上银行控制台

[English](README.md) · **简体中文**

一个全栈网上银行演示项目。覆盖登录认证、账户余额、流水对账、幂等转账、审计日志、
收款人簿、概览仪表盘、中英双语、主题与无障碍——写出来是为了让开发者读得懂一家网上
银行是怎么搭起来的，并照着亲手实现一遍。

> 当前状态：认证、账户、交易流水、转账、转账复核、审计日志、收款人、概览仪表盘、
> 对账单导出、中英双语与用户设置均已端到端实现，运行在最终的前端技术栈上。剩余工作是
> 部署与扩展目标（见[构建进度](#构建进度)）。
>
> 前端技术栈：React Router + TanStack Query + Zustand + Ant Design/ProComponents。

## 架构

```
React SPA (web)  ──/api──▶  NestJS API (api)  ──▶  PostgreSQL
Vite · TanStack Query       JWT · RBAC · Swagger      Prisma · migrations
                                   │
                                   └──▶ Pino 结构化日志
```

## 技术选型

| 层次       | 选择                                                                            |
| ---------- | ------------------------------------------------------------------------------- |
| 前端       | React 19、TypeScript、Vite 8                                                    |
| 路由       | React Router 7                                                                  |
| 服务端状态 | TanStack Query 5                                                                |
| 会话状态   | Zustand 5                                                                       |
| 表单       | Ant Design Form                                                                 |
| UI         | Ant Design 5 + ProComponents（ProLayout、ProCard、ProTable）                    |
| 国际化     | 自建的类型化中英字典 + Ant Design 与 dayjs 语言包（不引 i18n 库）；默认简体中文 |
| 主题       | `ConfigProvider` 预设 token（6 套 AA 对比度校验的配色）+ ProLayout 侧栏 token   |
| 图表       | 手写 SVG（不依赖图表库），支持键盘与悬停读数                                    |
| 前端测试   | Vitest 5 + React Testing Library + jest-dom（Jest 兼容 API）                    |
| E2E        | Cypress 16                                                                      |
| 后端       | NestJS 12（ESM）、Passport JWT                                                  |
| 数据库     | PostgreSQL 16 + Prisma 6                                                        |
| API 文档   | Swagger / OpenAPI                                                               |
| 日志       | Pino（nestjs-pino）                                                             |
| CI         | GitHub Actions                                                                  |

## 目录结构

```
mini-bank/
├── web/                     # React SPA
│   ├── src/app/             # Provider、认证与偏好 store、QueryClient
│   ├── src/i18n/            # 类型化 t()、locales/en-US.ts 与 locales/zh-CN.ts
│   ├── src/theme/           # 主题预设与 useTheme
│   ├── src/services/        # 带类型的请求客户端与 queryOptions
│   ├── src/pages/           # 按路由拆分的页面
│   └── cypress/             # E2E 用例与辅助函数
├── api/                     # NestJS API
│   ├── src/auth/            # 登录、JWT 策略、守卫
│   ├── src/accounts/        # 账户读模型
│   ├── src/transactions/    # 分页交易流水接口
│   ├── src/transfers/       # 转账与幂等
│   ├── src/audit/           # 审计日志查询
│   └── prisma/              # schema、迁移、种子数据
├── docker-compose.yml       # 本地开发用 PostgreSQL
└── .github/workflows/ci.yml
```

## 快速开始

### 环境要求

- Node.js 20+（以 Node 24 验证）
- pnpm 12（`corepack enable pnpm`；仓库通过 `packageManager: pnpm@12.16.1` 锁定版本）
- Docker Desktop **或** 本地 PostgreSQL 16 实例

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 API 环境变量

```bash
# macOS / Linux
cp api/.env.example api/.env

# Windows（PowerShell）
Copy-Item api/.env.example api/.env
```

### 3. 启动 PostgreSQL

方式 A —— Docker（推荐）：

```bash
pnpm db:up
```

方式 B —— 本地 PostgreSQL：

```sql
CREATE USER minibank WITH PASSWORD 'minibank' CREATEDB;
CREATE DATABASE minibank OWNER minibank;
```

确认 `api/.env` 里的 `DATABASE_URL` 指向你的实例。

### 4. 建表并写入演示数据

```bash
pnpm db:migrate
pnpm db:seed
```

种子脚本可重复执行。如果演示过程中转过账、想恢复初始余额与流水，重置后重新灌入：

```bash
pnpm db:reset
```

### 5. 启动

```bash
pnpm dev
```

| 服务     | 地址                             |
| -------- | -------------------------------- |
| Web 应用 | http://localhost:8080            |
| API      | http://localhost:3000/api        |
| Swagger  | http://localhost:3000/docs       |
| 健康检查 | http://localhost:3000/api/health |

### 演示账号

| 角色                       | 用户名    | 邮箱                   | 昵称    | 密码       |
| -------------------------- | --------- | ---------------------- | ------- | ---------- |
| 管理员（可转账、可看审计） | `admin`   | `admin@minibank.dev`   | Admin   | `11111111` |
| 访客（只读）               | `visitor` | `visitor@minibank.dev` | Visitor | `00000000` |
| 复核员（批准大额转账）     | `checker` | `checker@minibank.dev` | Checker | `22222222` |

用户名或邮箱都能登录，且不区分大小写。登录页还有「填入管理员」「填入访客」
「填入复核员」三个按钮，会按当前界面语言自动填好表单。

## 常用脚本

| 命令                           | 说明                                           |
| ------------------------------ | ---------------------------------------------- |
| `pnpm dev`                     | 同时以 watch 模式启动 web 与 API               |
| `pnpm build`                   | 构建两个应用                                   |
| `pnpm --filter web size`       | 校验首屏 gzip 体积是否在 400 kB 预算内         |
| `pnpm lint`                    | 对两个应用运行 Oxlint                          |
| `pnpm format` / `format:check` | Prettier 写入 / 校验（根配置，按包覆盖）       |
| `pnpm typecheck`               | TypeScript 类型检查                            |
| `pnpm test`                    | 单元测试（Vitest）                             |
| `pnpm --filter api test:e2e`   | API 端到端测试（无需数据库）                   |
| `pnpm db:up` / `db:down`       | 启动 / 停止 PostgreSQL                         |
| `pnpm db:migrate`              | `prisma migrate dev`（同时生成 Prisma Client） |
| `pnpm db:generate`             | 只生成 Prisma Client（CI 使用）                |
| `pnpm db:seed`                 | 灌入演示用户、账户与交易                       |
| `pnpm db:reset`                | 重置数据库结构并重新写入演示数据               |
| `pnpm db:studio`               | 打开 Prisma Studio                             |
| `pnpm --filter web cy:open`    | Cypress 交互式运行器                           |
| `pnpm --filter web cy:run`     | Cypress 无头模式（需 web + API + 数据库就绪）  |
| `pnpm --filter web cy:clean`   | 永久删除 Cypress 截图与下载产物                |

## 构建进度

核心流程与加固工作已经完成，剩下的是部署与扩展目标。

### 1. 交易流水（已实现）

- API：`GET /api/accounts/:accountId/transactions`
- 分页（`page`、`pageSize`），筛选（`from`、`to`、`type=INCOMING|OUTGOING`）
- 归属校验、稳定排序、空页处理
- UI：ProTable，分页与方向/日期筛选状态同步在 URL 里
- 测试：service 单测 + Supertest e2e、URL 状态与组件测试、Cypress 全流程

### 2. 转账（已实现）

- API：`POST /api/transfers`（仅管理员，必须带 `Idempotency-Key` 请求头）
- 单个数据库事务内完成：扣款、入账、交易记录、审计日志
- 按账户 id 排序执行 `SELECT ... FOR UPDATE` 行锁
- 余额不足、同账户、币种不匹配都返回明确的 4xx
- 相同幂等键重复提交返回原始结果
- UI：Ant Design Form + TanStack mutation；成功后失效账户、流水与审计查询

### 3. 审计日志（已实现）

- API：`GET /api/audit-logs`（仅管理员），支持分页与操作人/动作/日期筛选
- UI：ProTable，筛选与分页状态同步在 URL 里
- 测试：RBAC（访客返回 403）以及转账产生的记录

### 4. 测试深度（已实现）

- 已完成：认证 store、偏好 store、i18n 解析、本地化格式化、路由守卫与各页面状态的
  Vitest 覆盖；所有页面的 axe-core 检查（含双语的设置页与复核页）；认证、流水、转账、
  转账指令、审计的 Supertest e2e；35 条 Cypress 场景，覆盖登录（用户名与邮箱）、外壳、
  流水、审计、转账、转账复核、设置、收款人与仪表盘
- 当前规模：56 条 API 单测 + 46 条 API e2e + 145 条 web 单测
- 此前遗留的「针对真实数据库、带自动数据重置的 Cypress 场景」已关闭：复核场景会重置
  数据库、真实移动资金，并在结束后恢复种子数据

### 5. 无障碍（已实现）

- 已完成：Vitest 中的 axe-core（wcag2a/wcag2aa/best-practice，critical 与 serious
  直接失败）、跳转链接的 Tab 顺序、`aria-invalid` / `aria-describedby` 关联、加载播报
- 已完成：生产构建上的 Lighthouse —— 移动端与桌面端 Accessibility / Best Practices /
  SEO 均为 100（模拟慢速 4G 下移动端 Performance 81，桌面端 99）。审计抓到了 jsdom
  看不见的对比度问题，因此主题用满足 AA 的取值覆盖了 `colorPrimary` 与
  `colorTextDescription`
- 待办：真实浏览器里的弹窗与 ProLayout 移动端抽屉

### 6. 多语言、主题与设置（已实现）

- 所有文案（包括 Ant Design 语言数据与 `dayjs`）都经过同一个类型化 `t()`；
  `MessageKey` 从英文字典推导，拼错或缺失的 key 会直接让类型检查失败，而不是显示空白
- 界面默认简体中文；语言切换器在包括登录页在内的每个页面右上角，选择存入
  `localStorage`（`mini-bank.preferences`）并同步 `<html lang>`
- 主题、语言与账户菜单固定在顶栏右上角同一行（ProLayout `mix` 布局），任何页面一键换肤
- 设置页：语言、6 套 AA 校验配色（沉稳蓝、优雅蓝、极光紫、翡翠绿、火山橙、石板灰）
  以及 **恢复默认**
- 表格表头与单元格居中；会溢出的内容（审计详情、流水备注）以 `…` 截断，悬停显示完整值
- 侧栏 logo 与标题点击回到概览（`/dashboard`），不再是死链
- 登录标识：`POST /api/auth/login` 只收一个 `identifier` 字段（用户名或邮箱）；
  用户不存在与密码错误返回同一条 401
- 存储的令牌被拒绝时，请求层统一登出、清空查询缓存，登录页给出「登录状态已过期」，
  被踢回登录页不再毫无解释
- 已验证：把默认语言设为中文、最弱的一套配色（火山橙）设为默认，Lighthouse 无障碍仍为 100

### 7. 收款人、概览与对账单（已实现）

- 收款人：每用户独立地址簿，搜索与排序同步在 URL；新建/编辑抽屉、详情抽屉（完整账号 +
  一键预填转账）、乐观删除并支持撤销（单条与批量）、每次变更写入审计日志
- 概览（`/dashboard`，登录后的首页）：问候语、按币种分开的余额卡、本月收支、近 30 天
  SVG 现金流图（悬停/键盘读数 + 币种切换）、最近动态直链对账单；服务端以整数分聚合
- 对账单：导出完整筛选结果的 CSV（RFC 4180 引号 + UTF-8 BOM，Excel 打开中文不乱码），
  以及通过 `@media print` 与应用外壳隔离的打印版

### 8. 转账双人复核（已实现）

- API：金额达到 `TRANSFER_APPROVAL_THRESHOLD`（默认 5,000）的转账不再直接记账，而是生成
  `TransferOrder` 待审指令
- CHECKER 角色：批准时在行锁内重新校验余额并记账，或驳回并填写理由；经办人可撤销自己的
  待审指令
- 幂等覆盖两条路径；提交、批准、驳回、撤销均写入审计
- 界面：复核队列支持 URL 同步的状态筛选；转账页会提示已提交复核
- 测试：服务单测、Supertest e2e、中英双语的页面与 axe 测试、带自动数据重置的 Cypress
  全流程

### 9. 扩展目标

- Refresh token / httpOnly cookie
- 账户汇总的 Redis 缓存
- 深分页的 keyset 分页
- 部署：Vercel（web）+ Render（API）+ Neon（PostgreSQL）

## 值得了解的设计决策

- **金额全程是十进制字符串，绝不用浮点。** Prisma `Decimal(14, 2)` 端到端一致。
- **余额用 ISO 4217 代码而不是货币符号。** `Intl` 配 `currencyDisplay: 'code'`，两种语言
  都显示 `USD 12,500.00` / `HKD 48,000.00`；用符号的话同一个账户英文显示 `$`、中文显示
  `US$`，HKD 与 CNY 还会互相混淆。
- **TanStack Query + 手写请求客户端。** 一个 `apiFetch` 负责 JWT、错误解析与 401 登出；
  query key 与前缀失效保证转账后余额、流水、审计彼此一致。
- **幂等键 + 数据库事务 + 行锁。** 专为重试与并发转账设计。
- **RBAC 在 API 强制执行，UI 只是镜像。** 隐藏按钮从不是安全边界。
- **用 Vitest 而不是 Jest。** Jest 兼容 API + 原生 Vite 集成；E2E 交给 Cypress。
- **只有一个登录标识。** `identifier` 同时接受用户名或邮箱，与 GitHub、Google 等主流账户
  体系一致；表单保持两个字段，查询只需一次归一化（`trim().toLowerCase()`）。
- **偏好只存在浏览器。** 语言与主题是使用偏好而非银行数据，放在 `localStorage` 里由一个
  Zustand store 管理，不占用任何 API 往返。
- **类型化消息键，不引 i18n 库。** 字典就是一个普通对象，`t()` 约 40 行；键的联合类型由
  字典推导，整个界面本地化却不需要运行时依赖或语言包加载瀑布。
- **Ant Design 语言包从 `antd/es/locale/*` 导入。** 文档里的 `antd/locale/*` 是 CommonJS
  shim，Vite 预打包会把它的默认导出再包一层 `{ default: … }`，导致 `ConfigProvider`
  静默回退英文——日期选择器、分页、表格文案全变英文，而自有字典仍是中文。jsdom 复现
  不出这个问题，所以由一条 Cypress 用例断言日期占位符是「开始日期」、「条/页」。
- **AA 对比度是测试，不是备注。** `theme/presets.test.ts` 为每套配色重算白字/主色、
  链接/白底、侧栏选中文字/淡底三组比值，新颜色低于 4.5:1 直接让测试失败。`#0088ff`
  （3.52:1）就是因此被否决作主色的。
- **聚合绝不跨币种相加。** 概览按币种分组、以整数分累加，两位小数保持精确，美元总额
  永远不会混入港币。
- **导出跟随筛选，而不是当前页。** CSV 与打印都会走完当前查询的每一页，CSV 带 BOM，
  Excel 打开中文备注不会乱码。
- **支付指令与账本分离。** 大额转账先生成 `TransferOrder`，只有复核人批准后才出现
  `Transaction` 流水，因此余额、对账单与导出永远不会包含尚未发生的资金流动。
- **四眼原则由角色保证，而非约定。** 只有 CHECKER 能批准、只有 OPERATOR 能提交，API 还会
  拒绝自查自批，所有决策均有审计。
- **可配置的单一限额。** `TRANSFER_APPROVAL_THRESHOLD` 默认 5,000，按金额数值在演示币种
  之间统一比较。

## 已知限制

- JWT 存在 `localStorage` 里，为了演示简单。生产环境应使用 httpOnly、Secure Cookie 并配
  CSRF 防护。
- 演示密码（`11111111` / `00000000`）刻意简单、重复数字，方便任何人零配置试用。API 只
  校验 `@MinLength(8)`；真实部署还需要密码策略、MFA、复用检查与速率限制。
- 没有 refresh token、限流或账户锁定。
- 审批限额是所有币种共用的一个数字，待审指令既不冻结资金也不会过期；生产系统需要按币种
  限额、资金冻结与过期任务。
- 只有种子数据，未接入真实银行。
- 本地 API 不走 HTTPS。

## 无障碍

- 语言切换（默认简体中文，可切英文），Ant Design 与 dayjs 语言包经 `ConfigProvider`
  贯通；每套主题都经过 AA 对比度校验
- 跳转主内容链接、地标结构、语义化标题
- 表单控件均有标签，并正确关联 `aria-invalid` / `aria-describedby`
- 可见的焦点环，支持 `prefers-reduced-motion`
- 提示通过 `role="alert"` / `role="status"` 播报
- `<html lang>` 跟随所选语言，每套配色在浅色背景与侧栏上都有对比度校验
- `pnpm --filter web test` 对每个页面跑 axe-core，critical 或 serious 直接失败
- axe 同时渲染英文与中文的设置页，翻译后的标签不会破坏可访问名称
- 生产构建的 Lighthouse 无障碍得分 100（移动端与桌面端）

## 这个项目是怎么做出来的

由开发者完成设计、范围界定与评审，用 AI 结对编程实现。每个功能都从一份简短的书面说明
开始，代码与测试一起落地，并且必须通过你在这里能看到的同一套门禁——lint、格式化、
类型检查、单元与 API 测试、体积预算、axe 与对比度校验——才可以提交。提交历史按主题分
组，读得懂推理过程，而不是一次性生成的大提交。

## 参与协作

- [CONTRIBUTING.md](CONTRIBUTING.md)（英文）说明环境搭建、命令矩阵、分支/提交/PR
  规范与评审清单；[SECURITY.md](SECURITY.md)（英文）说明私密上报渠道。
- `pnpm install` 会通过 lefthook 安装 Git 钩子：`pre-commit` 格式化暂存文件并 lint，
  `commit-msg` 强制执行 Conventional Commits（commitlint），`pre-push` 跑类型检查与单测。
- Issue 与 PR 模板位于 `.github/`；Dependabot 每周提 npm、每月提 GitHub Actions 的
  分组更新（`chore`/`ci` 提交）。
- CI（`.github/workflows/ci.yml`）在每次推送到 `main` 和每个 PR 上运行 lint、格式校验、
  类型检查、单元测试、API e2e、构建与体积预算，并带有并发取消，过期的运行会提前终止。

## 许可证

MIT —— 见 [LICENSE](LICENSE)。演示数据均为合成数据，不含任何真实银行或个人信息。
