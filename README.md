# 培正森林 · 微信小程序前端（pzsl）

广东培正学院校园墙/表白墙小程序「培正森林」的前端（Taro 3 + Vue3 + NutUI 4，微信小程序）。

- 后端：`../pzsl-server`（Spring Boot WebFlux + R2DBC，见其 README）
- 本仓库：`github.com/SwtaoCyt/pzforest-weapp`

---

## 技术栈

| 项 | 选型 |
|---|---|
| 框架 | Taro 3 + Vue3（`<script setup>`）+ TypeScript |
| UI | NutUI 4（`@nutui/nutui-taro`） |
| 状态 | Pinia（user store） |
| 请求 | Taro.request 封装（`src/services/api.ts`） |

## 构建

```bash
# 注意：WorkBuddy safe-delete 钩子会拦中文路径下的 dist，
# 构建前必须置空两个会话 ID（否则构建在清理 dist 阶段失败）
CODEBUDDY_SESSION_ID= CLAUDE_SESSION_ID= npm run build:weapp
# 产物：dist/（微信开发者工具导入此目录预览/上传）
```

## 目录

```
src/pages/index/index.vue   # 首页 + 课表弹窗（课表全部逻辑在此文件）
src/pages/...               # 其余页面（设置/微博投稿等）
src/services/api.ts         # 后端接口封装
src/store/user.ts           # 登录态（openid / 学校绑定状态）
```

---

## 课表模块关键设计（重要，改动前先读）

课表相关代码集中在 `src/pages/index/index.vue`，以下是沉淀下来的核心语义，防止改出回归：

### 1. weeks 位掩码语义（前后端一致）
- 数据库 `schedules.weeks` 为位掩码：**第 N 周 = bit(N-1)**（`1 << (week - 1)`）。
- 查询：后端 `findScheduleByOpenidAndWeek` 与前端 `isCourseInWeek` 均为 `(weeks & (1 << (week-1))) != 0`。
- ⚠️ 历史教训：前端曾用 `1 << week`（偏移 +1 位）导致周次错位，**必须用 `1 << (week-1)`**。
- 真实教务数据的 `weeks` 从第 2 周起的课占多数（分段课），但也有全学期课（`weeks=65535`，第 1 周就有课）——**不要假设"第 1 周无课"**。

### 2. 学期 / 周次来源（只读后端）
- `getCurrentWeek` 返回 `{week, semester}`，由后端按开学基准日算（秋季 09-01 → 最近周一为第 1 周周一）。
- **2026 秋季**：第 1 周周一 = `nearestMonday(2026-09-01)` = **08-31**，即 08-31 当天 `currentWeek=1`，前端课表自动恢复显示。
- 未开学（`currentWeek ≤ 0`）时：`todayGroups` / `courseGroupsByDay` 直接返回空，UI 显示"未开学"占位（`semesterNotStarted`），**不展示第 1 周口径的课**。

### 3. 连堂合并与展开（buildGroups）
- `buildGroups(list)`：把按天+周过滤后的课程合并为"连堂组"——**同名 + 同教室 + 同老师 + 节次相邻（中文节次序号差 1）**。
- 组字段：`start/end`（首节开始~末节结束）、`count`、`courses[]`、`breaks[]`（相邻两节休息分钟，课间休息才 >0）。
- 组进度/进行中：按**组首开始 ~ 组末结束**整体区间算（课间休息也算"正在上课"）。
- 展开明细：合并卡片可点击展开，逐节显示节次名+起止时间，间隙>0 时显示"课间休息 X 分钟"。
- 首页"正在上课/已上 X%/还有多久结束"同样基于 `ongoingGroup`（连堂组），非单节。

### 4. 星期 tab 用自绘（不用 nut-tabs）
- ⚠️ NutUI 4.3 `tabs` 的 tab-pane 全部常驻 DOM（非激活 `display:none`），在微信小程序下 activeKey 切换疑似不生效（曾出现"只显示第一个 tab"）。
- 已改为**自绘 tab 栏**：`@click="currentDay = String(i+1)"` + computed `courseGroupsByDay` 响应式渲染，不再依赖 NutUI 事件时序。

### 5. 周导航（viewWeek）
- `viewWeekOffset`（±周偏移）+ `viewWeek = currentWeek + viewWeekOffset`；`prevWeek/nextWeek` 切换，标题显示"本周/下周/第 N 周课表"。
- 周课表严格按 `viewWeek` 过滤（该周该天没课就显示空状态，不 fallback）。

### 6. 早八问候
- `hasEarlyClassToday`：当天最早一节课开始 ≤ 09:00 视为早八；早间问候语替换为早八文案。

---

## 与后端联动的接口

| 接口 | 说明 |
|---|---|
| `/class/getMyClass` | 按 openid→user_student→schedules 查课表（位掩码按周过滤，开学前钳到 week=1） |
| `/class/getCurrentWeek` | 当前教学周 + 学期名 |
| `/class/getClassVerifyCode` | 教务验证码（绑定用） |
| `/class/cleanCache` | 清除课表缓存（会同时删除 DB 课表） |

> 调试注意：`getMyClass` 返回的 `dayOfWeek` 字段为小写 `dayofweek`（R2DBC `@Column("dayOfWeek")` 实体字段名），前端 `getCourseDayOfWeek` 做了 `dayOfWeek || dayofweek` 兜底。
