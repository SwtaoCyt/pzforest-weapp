<template>
  <view class="page">
    <!-- 顶部问候横幅 -->
    <view class="hero">
      <view class="hero__glow"></view>
      <view class="hero__content">
        <view class="hero__greeting">{{ greeting }}，同学</view>
        <view class="hero__date">{{ todayText }}</view>
      </view>
    </view>

    <!-- 课程卡片：正在上课 / 下一节 / 下次上课 -->
    <view
      class="course-card"
      :class="{
        'course-card--empty': !nextCourse && !ongoingCourse,
        'course-card--ongoing': ongoingCourse
      }"
      @click="handleCourseCardClick"
    >
      <view
        class="course-card__icon"
        :class="{
          'course-card__icon--empty': !nextCourse && !ongoingCourse,
          'course-card__icon--ongoing': ongoingCourse
        }"
      >
        <Clock v-if="nextCourse || ongoingCourse" color="#5b7cfa" size="36px" />
        <Tips v-else color="#ff9f43" size="36px" />
      </view>
      <view class="course-card__info">
        <view class="course-card__label">{{ ongoingCourse ? '正在上课' : (nextCourse ? '下一节课' : (nextClassSummary ? '下次上课' : '我的课表')) }}</view>
        <view class="course-card__name">{{ cardName }}</view>
        <view class="course-card__meta">
          <template v-if="ongoingCourse">
            <view class="course-card__meta-item">
              <Location color="#9aa5b8" size="16px" />
              <text>{{ ongoingCourse.classroom }}</text>
            </view>
            <view class="course-card__meta-item">
              <Clock color="#9aa5b8" size="16px" />
              <text>{{ courseStart(ongoingCourse.time) }} · 已上 {{ ongoingProgress }}%</text>
            </view>
          </template>
          <template v-else-if="nextCourse">
            <view class="course-card__meta-item">
              <Location color="#9aa5b8" size="16px" />
              <text>{{ nextCourse.classroom }}</text>
            </view>
            <view class="course-card__meta-item">
              <Clock color="#9aa5b8" size="16px" />
              <text>{{ courseStart(nextCourse.time) }}-{{ courseEnd(nextCourse.time) }}</text>
            </view>
          </template>
          <template v-else-if="nextClassSummary">
            <view class="course-card__meta-item">
              <Clock color="#9aa5b8" size="16px" />
              <text>{{ nextClassSummary.day }} {{ nextClassSummary.start }}</text>
            </view>
            <view class="course-card__meta-item" v-if="nextClassSummary.classroom">
              <Location color="#9aa5b8" size="16px" />
              <text>{{ nextClassSummary.classroom }}</text>
            </view>
          </template>
          <text v-else class="course-card__tip">早点休息，养精蓄锐～</text>
        </view>
        <view v-if="ongoingCourse && nextCourse" class="course-card__next">
          下节：{{ nextCourse.name }} {{ courseStart(nextCourse.time) }}
        </view>
        <view v-if="ongoingCourse" class="course-card__progress">
          <view class="course-card__progress-inner" :style="{ width: ongoingProgress + '%' }"></view>
        </view>
      </view>
      <ArrowRight v-if="nextCourse || ongoingCourse" class="course-card__arrow" color="#c2c9d6" size="28px" />
    </view>

    <!-- 常用功能 -->
    <view class="section">
      <view class="section__title">常用功能</view>
      <view class="menu-card">
        <nut-grid :gutter="8" :clickable="false" :column-num="3" :border="false">
          <nut-grid-item text="微博投稿" @click="navigateTo('sendweibo','')">
            <view class="menu-icon menu-icon--coral">
              <Photograph color="#ffffff" size="40px" />
            </view>
          </nut-grid-item>
          <nut-grid-item text="我的课表" @click="handleCheckMyClass">
            <view class="menu-icon menu-icon--teal">
              <DateIcon color="#ffffff" size="40px" />
            </view>
          </nut-grid-item>
          <nut-grid-item text="设置" @click="navigateTo('setting','')">
            <view class="menu-icon menu-icon--blue">
              <Setting color="#ffffff" size="40px" />
            </view>
          </nut-grid-item>
        </nut-grid>
      </view>
    </view>

    <!-- 校园动态 -->
    <view class="section">
      <view class="section__title">校园动态</view>
      <Listitem />
    </view>

    <notify ref="notifyRef" />

    <!-- 验证码登录弹窗 -->
    <nut-popup
      v-model:visible="verifyCodeView"
      position="bottom"
      closeable
      round
      :style="{ height: '62%' }"
      class="login-popup"
    >
      <view class="login-head">
        <view class="login-head__title">教务系统登录</view>
        <view class="login-head__subtitle">登录后自动同步你的课表到小程序</view>
      </view>

      <div class="form-wrapper">
        <nut-form :model-value="loginForm" ref="loginFormRef">
          <nut-form-item label="学号" prop="username">
            <nut-input v-model="loginForm.username" placeholder="请输入学号" type="text" />
          </nut-form-item>
          <nut-form-item label="密码" prop="password">
            <nut-input v-model="loginForm.password" placeholder="请输入密码" type="password" />
          </nut-form-item>
          <nut-form-item label="验证码" prop="verifyCode">
              <view class="verify-code-row">
                <nut-input v-model="loginForm.verifyCode" placeholder="请输入验证码" class="verify-code-input" />
                <view @click="updateVerifyCode()" class="verify-code-wrapper">
                  <img v-if="verifyCodeUrl" :src="verifyCodeUrl" class="verify-code-image" />
                  <view v-else class="verify-code-placeholder">点击获取</view>
                </view>
              </view>
          </nut-form-item>
          <div class="login-button-wrapper">
            <nut-button :loading="isLoading" type="primary" class="login-btn" @click="handleSchoolLogin" block round>
              立即登录
            </nut-button>
          </div>
        </nut-form>
      </div>
    </nut-popup>

    <!-- 查看每周课程 -->
    <nut-popup
      v-model:visible="classView"
      position="bottom"
      closeable
      round
      :style="{ height: '72%' }"
    >
      <view class="schedule">
        <view class="schedule__header">
          <view class="schedule__title-row">
            <view class="schedule__title">{{ schedulePopupTitle }}</view>
          </view>
          <!-- 周导航：支持浏览整学期任意一周（数据本身就是全学期的） -->
          <view class="schedule__week-nav">
            <view
              class="schedule__week-arrow"
              :class="{ 'schedule__week-arrow--disabled': !canPrevWeek }"
              @click="prevWeek"
            >‹</view>
            <view class="schedule__week-nav-label">{{ weekNavLabel }}</view>
            <view
              class="schedule__week-arrow"
              :class="{ 'schedule__week-arrow--disabled': !canNextWeek }"
              @click="nextWeek"
            >›</view>
            <view v-if="viewWeekOffset !== 0" class="schedule__week-back" @click="viewWeekOffset = 0">回到本周</view>
          </view>
          <view class="schedule__subtitle">{{ currentDayText }}</view>
          <view v-if="todayNextText" class="schedule__next">{{ todayNextText }}</view>
        </view>
        <!-- 自绘 tab 栏：绕开 nut-tabs（小程序下 tab-pane 常驻 DOM + display 切换在部分环境不生效，导致只显示第一个 tab） -->
        <view class="schedule__tabs">
          <view
            v-for="(day, i) in weekDays"
            :key="i"
            class="schedule__tab"
            :class="{
              'schedule__tab--active': currentDay === String(i + 1),
              'schedule__tab--today': String(i + 1) === todayIndex() && currentDay !== String(i + 1)
            }"
            @click="currentDay = String(i + 1)"
          >
            <view class="schedule__tab-name">{{ day.charAt(2) }}</view>
            <view class="schedule__tab-date">{{ tabDates[i] }}</view>
            <view v-if="String(i + 1) === todayIndex()" class="schedule__tab-dot"></view>
          </view>
        </view>
        <view class="schedule-list">
          <view
            v-for="course in weekCoursesByDay"
            :key="course.id"
            class="course-item"
            :class="{ 'course-item--now': isNowCourse(course) }"
          >
            <view class="course-item__time">
              <text class="course-item__time-start">{{ courseStart(course.time) }}</text>
              <text class="course-item__time-end">{{ courseEnd(course.time) }}</text>
            </view>
            <view class="course-item__body">
              <view class="course-item__name">{{ course.name }}</view>
              <view class="course-item__meta">
                <view v-if="course.classroom" class="course-item__meta-item">
                  <Location2 color="#9aa5b8" size="24px" />
                  <text>{{ course.classroom }}</text>
                </view>
                <view v-if="course.teacher" class="course-item__meta-item">
                  <People color="#9aa5b8" size="24px" />
                  <text>{{ course.teacher }}</text>
                </view>
                <text v-if="course.weeks" class="course-item__weeks">{{ formatWeeks(course.weeks) }}</text>
              </view>
              <view v-if="isNowCourse(course)" class="course-item__progress">
                <view class="course-item__progress-track">
                  <view class="course-item__progress-inner" :style="{ width: courseProgress(course) + '%' }"></view>
                </view>
                <text class="course-item__progress-text">已上 {{ courseProgress(course) }}%</text>
              </view>
            </view>
          </view>
          <view v-if="!weekCoursesByDay.length" class="schedule-empty">
            <Tips color="#c2c9d6" size="60px" />
            <view v-if="viewWeekOffset === 0 && currentDay === todayIndex() && nextClassSummary" class="schedule-empty__info">
              <text class="schedule-empty__hint">今天没课，下次上课</text>
              <text class="schedule-empty__main">{{ nextClassSummary.day }} {{ nextClassSummary.start }} · {{ nextClassSummary.name }}</text>
            </view>
            <text v-else class="schedule-empty__hint">这天没有课程，好好休息～</text>
          </view>
        </view>
      </view>
    </nut-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, reactive } from 'vue';
import { useDidShow } from '@tarojs/taro'
import Taro from '@tarojs/taro';
import {
  Date as DateIcon, Photograph, Setting,
  Clock, Location, ArrowRight, Tips,
  Location2, People
} from '@nutui/icons-vue-taro';

// 组件导入
import Listitem from '../../components/listitem.vue';
import notify from '../../components/notify.vue';

// Store
import { useUserStore } from '../../stores/user';

// 工具函数和API导入
import { navigateTo } from '../../router/index';
import {
  API_ROOT,
  getClassVerifyCode,
  loginToStudy,
  getMyClass,
  getLoginId,
  getCurrentWeek
} from "../../services/api";

// 类型定义（兼容驼峰与小写）
interface Schedule {
  id: number;
  name: string;
  time: string;
  weeks: number;
  classroom?: string;
  teacher?: string;
  semester?: string;
  studentId?: string;
  studentid?: string;
  dayOfWeek?: string;
  dayofweek?: string;
}

interface LoginForm {
  username: string;
  password: string;
  verifyCode: string;
}

// 常量定义
const WEEK_DAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const CACHE_KEYS = {
  SCHEDULES: 'myClass',
  SCHEDULE_DATE: 'myClassDate',
  SESSION_ID: 'JSESSIONID',
  NO_SCHEDULE_TS: 'noScheduleTs',
};

// 未绑定时本地标记的保鲜时间（分钟）：过期后才会再次尝试拉取
const NO_SCHEDULE_TTL_MIN = 30;

// 课表绑定受限窗口（MM-DD）：命中期间禁止绑定，避免拉到错误的教务数据。
// 结束日取「开学前 7 天」——与后端 semester.fall-start=09-01 / spring-start=03-01 对齐：
// 秋季开学 09-01 → 08-25 解除；春季开学 03-01 → 02-22 解除（开学前一周起允许绑定）。
const HOLIDAY_RANGES: Array<[string, string]> = [
  ['01-20', '02-22'], // 寒假（开学前一周 02-22 解除）
  ['07-01', '08-25'], // 暑假（开学前一周 08-25 解除）
];

// [TEST-ONLY] 模拟开学周：强制当前教学周为指定值（1=开学第一周，2=开学第二周…），用于正式开学前的联调测试。
// 正式发布前务必改回 0（或删除本常量及下方覆盖逻辑），否则线上永远显示固定的周次。
const TEST_FORCE_WEEK = 2;
// [TEST-ONLY] 模拟当前时间：用于验证“周日晚上”等跨周场景，格式 'YYYY/MM/DD HH:mm:ss'（iOS 需用斜杠）。
// 正式发布前务必改回 null，否则页面所有时间相关逻辑都会固定在这个时刻。
const TEST_FAKE_NOW: string | null = null;
// 统一取当前时间（发布时等价于 new Date()）
const fakeNow = (): Date => (TEST_FAKE_NOW ? new Date(TEST_FAKE_NOW) : new Date());

// 响应式数据
const schedules = ref<Schedule[]>([]);
const verifyCodeUrl = ref<string>('');
const verifyCodeView = ref(false);
const classView = ref(false);
const isLoading = ref(false);
const currentDay = ref(String(fakeNow().getDay() === 0 ? 7 : fakeNow().getDay()));
// 弹窗查看的周偏移：0=本周，1=下周（周日晚上也能提前看下周课表）
const viewWeekOffset = ref(0);
// 弹窗实际过滤用的教学周（currentWeek 未知时为 0，此时不过滤周次）
const viewWeek = computed(() => (currentWeek.value > 0 ? currentWeek.value + viewWeekOffset.value : 0));

// 周导航：整学期任意周切换（数据为全学期课表，weeks 位掩码覆盖 1-25 周）
const TOTAL_WEEKS = 25;
const canPrevWeek = computed(() => (currentWeek.value > 0 ? viewWeek.value > 1 : viewWeekOffset.value > -3));
const canNextWeek = computed(() => (currentWeek.value > 0 ? viewWeek.value < TOTAL_WEEKS : viewWeekOffset.value < 8));
const prevWeek = (): void => { if (canPrevWeek.value) viewWeekOffset.value -= 1; };
const nextWeek = (): void => { if (canNextWeek.value) viewWeekOffset.value += 1; };

// 导航中间的文案：显示所选周的日期范围（如 8/24 - 8/30），周次信息只在标题展示，避免重复
const weekNavLabel = computed<string>(() => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const mondayTs = getMondayTimestamp(fakeNow()) + viewWeekOffset.value * 7 * DAY_MS;
  const monday = new Date(mondayTs);
  const sunday = new Date(mondayTs + 6 * DAY_MS);
  return `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`;
});

// 弹窗标题
const schedulePopupTitle = computed<string>(() => {
  if (viewWeekOffset.value === 0) return '本周课表';
  if (viewWeekOffset.value === 1) return '下周课表';
  return viewWeek.value > 0 ? `第${viewWeek.value}周课表` : '课表';
});
const weekCourses = ref<Schedule[]>([]);
const notifyRef = ref(null);
// 当前教学周（后端统一计算，与课表过滤一致）
const currentWeek = ref(0);
const currentSemester = ref('');

// Store 实例
const userStore = useUserStore();

// 表单数据
const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
  verifyCode: ''
});

// 常量数据
const weekDays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];

// 工具函数
const getDayOfWeek = (day: number): string => WEEK_DAYS[day === 7 ? 0 : day];

const getCourseDayOfWeek = (course: Schedule): string => {
  return course.dayOfWeek || course.dayofweek || '';
};

// 今天的 tab 索引（周一=1 … 周日=7）
const todayIndex = (): string => String(fakeNow().getDay() === 0 ? 7 : fakeNow().getDay());

// 本周一至周日的日期标签（如 8/24），与星期 tab 一一对应（查看下周时整体偏移一周）
const tabDates = computed(() => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const monday = getMondayTimestamp(fakeNow()) + viewWeekOffset.value * 7 * DAY_MS;
  return weekDays.map((_, i) => {
    const d = new Date(monday + i * DAY_MS);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
});

// 从数据库格式如 "第五节课 14:20-15:05" 或 "14:20-15:05" 中精准提取开始/结束时间
const courseStart = (time: string): string => {
  if (!time) return '';
  const match = time.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  return match ? match[1] : '';
};

const courseEnd = (time: string): string => {
  if (!time) return '';
  const match = time.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  return match ? match[2] : '';
};

// "14:20" -> 分钟数
const parseMinutes = (t: string): number => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// 判断课程是否在指定周开课（数据库 bitmask 规则：第 n 位对应第 n+1 周，即 week 周 = bit(week-1)；
// 与后端 MyBatis/R2DBC 的 (weeks & (1 << (week-1))) != 0 保持一致，2026-08-25 修复偏移一位的 bug）
const isCourseInWeek = (course: Schedule, week: number): boolean => {
  if (!course) return false;
  if (!week || week <= 0 || !course.weeks) return true; // 未获取到教学周或无周次限制时默认展示
  return (course.weeks & (1 << (week - 1))) !== 0;
};

// 课程是否正在上课（仅当天生效）
const isNowCourse = (course: Schedule): boolean => {
  if (currentDay.value !== todayIndex()) return false;
  const start = courseStart(course.time);
  const end = courseEnd(course.time);
  if (!start || !end) return false;
  const now = fakeNow();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= parseMinutes(start) && nowMin < parseMinutes(end);
};

// 周次 bitmask -> 可读文案（例如 65534 -> "第2-16周"；bit(n-1)=1 表示第 n 周有课）
const formatWeeks = (mask: number): string => {
  if (!mask) return '';
  const weeks: number[] = [];
  for (let i = 1; i <= 25; i++) {
    if (mask & (1 << (i - 1))) weeks.push(i);
  }
  if (!weeks.length) return '';
  const ranges: string[] = [];
  let start = weeks[0];
  let prev = weeks[0];
  for (let i = 1; i <= weeks.length; i++) {
    if (i === weeks.length || weeks[i] !== prev + 1) {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = weeks[i];
      prev = weeks[i];
    } else {
      prev = weeks[i];
    }
  }
  return '第' + ranges.join('、') + '周';
};

// 按星期和时间升序排序课程
const sortCoursesByTime = (list: Schedule[]): Schedule[] => {
  return [...list].sort((a, b) => {
    return parseMinutes(courseStart(a.time)) - parseMinutes(courseStart(b.time));
  });
};

// 获取本周一零点的日期时间戳
const getMondayTimestamp = (d: Date): number => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const isNewWeek = (): boolean => {
  try {
    const lastUpdateStr = Taro.getStorageSync(CACHE_KEYS.SCHEDULE_DATE);
    if (!lastUpdateStr) return true;

    const lastUpdate = new Date(lastUpdateStr);
    const now = fakeNow();

    // 跨过周一零点即视为新的一周
    return getMondayTimestamp(now) > getMondayTimestamp(lastUpdate);
  } catch (error) {
    console.error('检查周期失败:', error);
    return true;
  }
};

// 是否处于绑定受限窗口：当前月日落在任一 HOLIDAY_RANGES 区间内即禁止绑定。
// 半开区间 [start, end)：结束日当天起放行（即"开学前一周当天"即可开始绑定），结束日必须与后端开学日（09-01/03-01）保持 -7 天耦合。
const isHoliday = (): boolean => {
  const now = fakeNow();
  const md = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return HOLIDAY_RANGES.some(([start, end]) => md >= start && md < end);
};

// 计算属性：当前周（如果已知）且当天的课程
const todayCourses = computed(() => {
  if (!schedules.value.length) return [];

  const currentDayOfWeek = getDayOfWeek(new Date(nowTick.value).getDay());

  const list = schedules.value.filter(course => {
    const matchDay = getCourseDayOfWeek(course) === currentDayOfWeek;
    const matchWeek = isCourseInWeek(course, currentWeek.value);
    return matchDay && matchWeek;
  });

  return sortCoursesByTime(list);
});

// 今天正在上课的课程
const ongoingCourse = computed<Schedule | null>(() => {
  const nowMin = nowMinutes.value;
  const course = todayCourses.value.find(c => {
    const s = parseMinutes(courseStart(c.time));
    const e = parseMinutes(courseEnd(c.time));
    return s <= nowMin && nowMin < e;
  });
  return course || null;
});

// 今天接下来（尚未开始）的第一节课
const nextCourse = computed<Schedule | null>(() => {
  const upcoming = todayCourses.value
    .filter(course => parseMinutes(courseStart(course.time)) > nowMinutes.value)
    .sort((a, b) => parseMinutes(courseStart(a.time)) - parseMinutes(courseStart(b.time)));
  return upcoming.length ? upcoming[0] : null;
});

// 进行中课程的进度（0-100），驱动进度条
const courseProgress = (course: Schedule): number => {
  const start = parseMinutes(courseStart(course.time));
  const end = parseMinutes(courseEnd(course.time));
  if (!end || end <= start) return 0;
  const p = Math.round(((nowMinutes.value - start) / (end - start)) * 100);
  return Math.min(100, Math.max(0, p));
};

const ongoingProgress = computed(() => (ongoingCourse.value ? courseProgress(ongoingCourse.value) : 0));

// 问候语，根据当前时间动态变化
const greeting = computed(() => {
  const hour = fakeNow().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

// 今天的日期文案，例如：8月14日 · 星期五 · 第2周
const todayText = computed(() => {
  const now = fakeNow();
  const base = `${now.getMonth() + 1}月${now.getDate()}日 · ${WEEK_DAYS[now.getDay()]}`;
  return currentWeek.value > 0 ? `${base} · 第${currentWeek.value}周` : base;
});

// 课表弹窗副标题：当前选中日 + 是否今天（仅查看本周时标注“今天”）
const currentDayText = computed(() => {
  const idx = Number(currentDay.value) - 1;
  const day = weekDays[idx] || '';
  const suffix = viewWeekOffset.value === 0 && currentDay.value === todayIndex() ? ' · 今天' : '';
  return day + suffix;
});

// 实时时钟：驱动“正在上课”进度条动态刷新（每 30 秒一跳）
const nowTick = ref(Date.now());
let tickTimer: ReturnType<typeof setInterval> | null = null;
const nowMinutes = computed(() => {
  const d = new Date(nowTick.value);
  return d.getHours() * 60 + d.getMinutes();
});
const startTick = (): void => {
  if (tickTimer) return;
  tickTimer = setInterval(() => { nowTick.value = TEST_FAKE_NOW ? new Date(TEST_FAKE_NOW).getTime() : Date.now(); }, 30000);
  nowTick.value = TEST_FAKE_NOW ? new Date(TEST_FAKE_NOW).getTime() : Date.now();
};
const stopTick = (): void => {
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
};
onMounted(() => { startTick(); });
onUnmounted(stopTick);

// 星期映射（文案 -> 数字，0=周日，1=周一... 6=周六）
const DAY_INDEX: Record<string, number> = {
  '星期日': 0, '星期一': 1, '星期二': 2, '星期三': 3,
  '星期四': 4, '星期五': 5, '星期六': 6,
};
const DAY_NAME: Record<number, string> = { 0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六' };

// 计算指定天数偏移后的日期所对应的教学周（周一为每周第一天）
const getWeekForDayOffset = (baseDate: Date, distDays: number, currentWk: number): number => {
  if (!currentWk || currentWk <= 0) return 0;
  const targetDate = new Date(baseDate.getTime() + distDays * 86400000);
  const baseMonday = getMondayTimestamp(baseDate);
  const targetMonday = getMondayTimestamp(targetDate);
  const weekDiff = Math.round((targetMonday - baseMonday) / (7 * 86400000));
  return currentWk + weekDiff;
};

// 全周范围内“下一节”课（根据相对天数精准推导目标教学周，完美支持周日晚上看下周一及跨周）
const nextClass = computed<Schedule | null>(() => {
  if (!schedules.value.length) return null;
  const now = new Date(nowTick.value);
  const nowDay = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let best: Schedule | null = null;
  let bestKey = Infinity;

  for (const c of schedules.value) {
    const start = courseStart(c.time);
    if (!start) continue;
    const cDayName = getCourseDayOfWeek(c);
    const cDay = DAY_INDEX[cDayName];
    if (cDay === undefined) continue;
    const cStart = parseMinutes(start);

    let dist = (cDay - nowDay + 7) % 7;
    if (dist === 0 && cStart <= nowMin) dist = 7; // 今天已结束的同一星期课，视为 7 天后

    // 精确获取该课程对应目标日期的教学周并进行过滤
    const targetWeek = getWeekForDayOffset(now, dist, currentWeek.value);
    if (!isCourseInWeek(c, targetWeek)) {
      continue;
    }

    const key = dist * 10000 + cStart;
    if (key < bestKey) {
      bestKey = key;
      best = c;
    }
  }

  // 兜底策略：如果当前周及紧随周期无匹配课，降级为不限周次选择最近的一节课
  if (!best) {
    for (const c of schedules.value) {
      const start = courseStart(c.time);
      if (!start) continue;
      const cDayName = getCourseDayOfWeek(c);
      const cDay = DAY_INDEX[cDayName];
      if (cDay === undefined) continue;
      const cStart = parseMinutes(start);
      let dist = (cDay - nowDay + 7) % 7;
      if (dist === 0 && cStart <= nowMin) dist = 7;
      const key = dist * 10000 + cStart;
      if (key < bestKey) {
        bestKey = key;
        best = c;
      }
    }
  }

  return best;
});

// 下一次上课的摘要（日期 + 时间 + 课程）
const nextClassSummary = computed<{ name: string; day: string; start: string; classroom: string } | null>(() => {
  const nc = nextClass.value;
  if (!nc) return null;
  const now = new Date(nowTick.value);
  const nowDay = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const cDayName = getCourseDayOfWeek(nc);
  const cDay = DAY_INDEX[cDayName];
  const cStart = parseMinutes(courseStart(nc.time));
  let dist = (cDay - nowDay + 7) % 7;
  if (dist === 0 && cStart <= nowMin) dist = 7;
  const date = new Date(now.getTime() + dist * 86400000);
  return {
    name: nc.name,
    day: `${date.getMonth() + 1}月${date.getDate()}日 ${DAY_NAME[cDay]}`,
    start: courseStart(nc.time),
    classroom: nc.classroom || '',
  };
});

// 弹窗头部“今日”附加行：下节课预告
const todayNextText = computed<string>(() => {
  if (viewWeekOffset.value !== 0 || currentDay.value !== todayIndex()) return '';
  if (!todayCourses.value.length) return '今日无课';
  const next = nextCourse.value;
  if (next) return `下节：${next.name} ${courseStart(next.time)}${next.classroom ? ' · ' + next.classroom : ''}`;
  return '今日课程已结束';
});

// 主页课程卡标题文案
const cardName = computed<string>(() => {
  if (ongoingCourse.value) return ongoingCourse.value.name;
  if (nextCourse.value) return nextCourse.value.name;
  if (nextClassSummary.value) return `下次上课 · ${nextClassSummary.value.name}`;
  return '今天已经没有课程啦！';
});

// 存储管理
const storage = {
  getSchedules(): Schedule[] | null {
    try {
      const data = Taro.getStorageSync(CACHE_KEYS.SCHEDULES);
      return Array.isArray(data) && data.length > 0 ? data : null;
    } catch (error) {
      console.error('获取缓存课表失败:', error);
      return null;
    }
  },

  setSchedules(data: Schedule[]): boolean {
    try {
      Taro.setStorageSync(CACHE_KEYS.SCHEDULES, data);
      Taro.setStorageSync(CACHE_KEYS.SCHEDULE_DATE, new Date().toISOString());
      Taro.removeStorageSync(CACHE_KEYS.NO_SCHEDULE_TS);
      return true;
    } catch (error) {
      console.error('缓存课表失败:', error);
      return false;
    }
  },

  clearSchedules(): void {
    try {
      Taro.removeStorageSync(CACHE_KEYS.SCHEDULES);
      Taro.removeStorageSync(CACHE_KEYS.SCHEDULE_DATE);
      Taro.removeStorageSync(CACHE_KEYS.NO_SCHEDULE_TS);
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  },

  hasRecentEmpty(): boolean {
    try {
      const ts = Taro.getStorageSync(CACHE_KEYS.NO_SCHEDULE_TS);
      if (!ts) return false;
      const diff = Date.now() - new Date(ts).getTime();
      return diff < NO_SCHEDULE_TTL_MIN * 60 * 1000;
    } catch (error) {
      return false;
    }
  },

  markEmpty(): void {
    try {
      Taro.setStorageSync(CACHE_KEYS.NO_SCHEDULE_TS, new Date().toISOString());
    } catch (error) {
      console.error('标记未绑定失败:', error);
    }
  },
};

// 登录相关方法
const handleWeChatLogin = async (): Promise<void> => {
  try {
    const { code } = await Taro.login();
    const response = await Taro.request({
      url: `${API_ROOT}/user/login`,
      method: "POST",
      data: { code },
    });

    if (response.data?.data) {
      const { tokenName, tokenValue } = response.data.data;
      userStore.login(tokenName, tokenValue);
      await getLoginId();
      await loadSchedules();
    } else {
      triggerNotify('danger', '微信登录失败，请重试');
    }
  } catch (error) {
    console.error('微信登录失败:', error);
    triggerNotify('danger', '微信登录失败，请重试');
  }
};

const handleSchoolLogin = async (): Promise<void> => {
  if (!loginForm.username || !loginForm.password || !loginForm.verifyCode) {
    triggerNotify('warning', '请填写完整信息');
    return;
  }

  isLoading.value = true;

  try {
    const response = await loginToStudy(
      loginForm.username,
      loginForm.password,
      loginForm.verifyCode
    );

    const { code, data } = response.data;

    if (code === 200) {
      userStore.loginSchool();
      triggerNotify("success", "登录成功！");
      verifyCodeView.value = false;
      Object.assign(loginForm, { username: '', password: '', verifyCode: '' });
      await loadSchedules();
    } else {
      triggerNotify("danger", data || '登录失败');
      await updateVerifyCode();
    }
  } catch (error) {
    console.error('教务系统登录失败:', error);
    triggerNotify("danger", "网络错误，请稍后重试");
    await updateVerifyCode();
  } finally {
    isLoading.value = false;
  }
};

// 课表相关方法
const loadSchedules = async (): Promise<void> => {
  try {
    if (isNewWeek()) {
      storage.clearSchedules();
    }

    let cachedSchedules = storage.getSchedules();

    if (cachedSchedules) {
      schedules.value = cachedSchedules;
      return;
    }

    if (storage.hasRecentEmpty()) {
      schedules.value = [];
      return;
    }

    if (userStore.isWeChatLoggedIn) {
      const response: any = await getMyClass();
      const list = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : null);

      if (list && list.length > 0) {
        const fetchedSchedules = list as Schedule[];
        schedules.value = fetchedSchedules;
        // [DEBUG] 打印拉取到的课表总量与字段样例
        console.log('[SCHEDULE] fetched=', fetchedSchedules.length,
          'sample=', fetchedSchedules.slice(0, 3).map(c => ({ name: c.name, dayofweek: c.dayofweek, dayOfWeek: c.dayOfWeek, weeks: c.weeks })));
        storage.setSchedules(fetchedSchedules);
        userStore.loginSchool();
      } else {
        schedules.value = [];
        userStore.logoutSchool();
        storage.markEmpty();
      }
    }
  } catch (error) {
    console.warn('静默获取课表未成功:', error);
    schedules.value = [];
    storage.markEmpty();
  }
};

// 拉取当前教学周
const loadCurrentWeek = async (): Promise<void> => {
  if (currentWeek.value && currentWeek.value > 0) return;
  try {
    const data = await getCurrentWeek();
    currentWeek.value = data.week || 0;
    if (TEST_FORCE_WEEK > 0) currentWeek.value = TEST_FORCE_WEEK; // [TEST-ONLY] 模拟开学第一天覆盖
    currentSemester.value = data.semester || '';
  } catch (error) {
    console.error('获取当前教学周失败:', error);
  }
};

const updateVerifyCode = async (): Promise<void> => {
  try {
    const response = await getClassVerifyCode();
    if (response?.data?.url) {
      verifyCodeUrl.value = response.data.url;
      if (response.data.JSESSIONID) {
        Taro.setStorageSync(CACHE_KEYS.SESSION_ID, response.data.JSESSIONID);
      }
    }
  } catch (error) {
    console.error('获取验证码失败:', error);
    triggerNotify('danger', '获取验证码失败');
  }
};

// 界面交互方法
const handleCourseCardClick = (): void => {
  handleCheckMyClass();
};

const handleCheckMyClass = async (): Promise<void> => {
  if (!schedules.value || schedules.value.length === 0) {
    await loadSchedules();
  }

  if (schedules.value && schedules.value.length > 0) {
    const today = fakeNow().getDay();
    const paneKey = String(today === 0 ? 7 : today);
    viewWeekOffset.value = 0;
    updateWeekCourses(paneKey);
    currentDay.value = paneKey;
    classView.value = true;
  } else if (userStore.isSchoolLoggedIn) {
    triggerNotify('warning', '课表加载失败，请稍后重试');
  } else {
    if (isHoliday()) {
      triggerNotify('warning', '课表绑定将在开学前一周开放，现在还早，到时再来绑定吧~');
      return;
    }
    verifyCodeView.value = true;
    await updateVerifyCode();
  }
};

// 周课表（弹窗 tab 内容）：按当前选中 tab（currentDay）响应式计算。
// 修复：原实现是手动维护共享 weekCourses，NutUI 的 tab-pane 全部常驻 DOM（display 切换），
// 共享数组切换 tab 时界面不跟随刷新；改为 computed 后 currentDay 一变即自动重算，不依赖事件时序。
const weekCoursesByDay = computed<Schedule[]>(() => {
  if (!schedules.value.length) return [];
  const dayOfWeek = getDayOfWeek(parseInt(currentDay.value, 10));
  const coursesOfDay = schedules.value.filter(c => getCourseDayOfWeek(c) === dayOfWeek);
  const active = coursesOfDay.filter(c => isCourseInWeek(c, viewWeek.value));
  // [DEBUG] 打印 computed 计算结果（与弹窗 100% 对应）
  console.log('[SCHEDULE] computed day=', currentDay.value, 'dayOfWeek=', dayOfWeek,
    'currentWeek=', viewWeek.value,
    'total=', schedules.value.length,
    'coursesOfDay=', coursesOfDay.length,
    'active=', active.length,
    'result=', sortCoursesByTime(active.length > 0 ? active : coursesOfDay).map(c => ({ name: c.name, dayofweek: c.dayofweek, time: c.time })));
  return sortCoursesByTime(active.length > 0 ? active : coursesOfDay);
});

const updateWeekCourses = (dayKey: string): void => {
  const dayOfWeek = getDayOfWeek(parseInt(dayKey, 10));
  const coursesOfDay = schedules.value.filter(c => getCourseDayOfWeek(c) === dayOfWeek);
  // 周课表优先过滤出当前查看周有课的课程
  const activeCourses = coursesOfDay.filter((course: Schedule) => isCourseInWeek(course, viewWeek.value));
  const result = activeCourses.length > 0 ? activeCourses : coursesOfDay;
  weekCourses.value = sortCoursesByTime(result);
};

const handleTabClick = ({ paneKey }: { paneKey: string }): void => {
  updateWeekCourses(paneKey);
};

// 通知方法
const triggerNotify = (type: string, message: string): void => {
  if (notifyRef.value) {
    (notifyRef.value as any).show({ type: type, desc: message });
  }
};

// 生命周期
onMounted(async () => {
  userStore.init();
  await loadCurrentWeek();
  if (!userStore.isWeChatLoggedIn) {
    await handleWeChatLogin();
  } else {
    await loadSchedules();
  }
});

useDidShow(async () => {
  userStore.init();
  await loadCurrentWeek();
  if (userStore.isWeChatLoggedIn && (!schedules.value || schedules.value.length === 0)) {
    loadSchedules();
  }
});
</script>

<style>
/* 页面整体 */
.page {
  min-height: 100vh;
  padding: 48px 48px 80px;
  background: linear-gradient(180deg, #eef2ff 0%, #f6f7fb 45%);
  box-sizing: border-box;
}

/* 顶部问候横幅 */
.hero {
  position: relative;
  overflow: hidden;
  padding: 52px 48px;
  border-radius: 40px;
  background: linear-gradient(135deg, #5b7cfa 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 20px 48px rgba(91, 124, 250, 0.28);
}

.hero__glow {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
}

.hero__content {
  position: relative;
  z-index: 1;
}

.hero__greeting {
  font-size: 44px;
  font-weight: 600;
  letter-spacing: 2px;
}

.hero__date {
  margin-top: 16px;
  font-size: 26px;
  opacity: 0.85;
}

/* 下一节课卡片 */
.course-card {
  display: flex;
  align-items: center;
  margin-top: -28px;
  padding: 36px;
  background: #fff;
  border-radius: 32px;
  box-shadow: 0 12px 36px rgba(60, 74, 116, 0.08);
}

.course-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92px;
  height: 92px;
  border-radius: 28px;
  background: #eef1ff;
  flex-shrink: 0;
}

.course-card__icon--empty {
  background: #fff3e6;
}

.course-card__info {
  flex: 1;
  min-width: 0;
  margin-left: 28px;
}

.course-card__label {
  font-size: 24px;
  color: #9aa5b8;
}

.course-card__name {
  margin-top: 6px;
  font-size: 34px;
  font-weight: 600;
  color: #2b3245;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-card__meta {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

.course-card__meta-item {
  display: flex;
  align-items: center;
  margin-right: 32px;
  font-size: 24px;
  color: #6b7486;
}

.course-card__meta-item text {
  margin-left: 6px;
}

.course-card__tip {
  font-size: 24px;
  color: #9aa5b8;
}

.course-card__arrow {
  flex-shrink: 0;
}

.course-card--ongoing {
  border: 2px solid #5b7cfa;
  box-shadow: 0 12px 36px rgba(91, 124, 250, 0.18);
}

.course-card__next {
  margin-top: 10px;
  font-size: 24px;
  color: #9aa5b8;
}

.course-card__progress {
  margin-top: 14px;
  height: 8px;
  border-radius: 4px;
  background: #eef1ff;
  overflow: hidden;
}

.course-card__progress-inner {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #5b7cfa 0%, #8b5cf6 100%);
  transition: width 0.8s ease;
}

/* 分区标题 */
.section {
  margin-top: 44px;
}

.section__title {
  position: relative;
  padding-left: 24px;
  margin-bottom: 24px;
  font-size: 32px;
  font-weight: 600;
  color: #2b3245;
}

.section__title::before {
  content: ' ';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 32px;
  border-radius: 4px;
  background: linear-gradient(180deg, #5b7cfa, #8b5cf6);
}

/* 菜单卡片 */
.menu-card {
  padding: 32px 16px;
  background: #fff;
  border-radius: 32px;
  box-shadow: 0 12px 36px rgba(60, 74, 116, 0.08);
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 30px;
  box-shadow: 0 10px 22px rgba(60, 74, 116, 0.14);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.menu-icon:active {
  transform: scale(0.9);
  box-shadow: 0 4px 12px rgba(60, 74, 116, 0.12);
}

.menu-icon--coral {
  background: linear-gradient(135deg, #ff9a8b 0%, #ff6b6b 100%);
}

.menu-icon--teal {
  background: linear-gradient(135deg, #4fd6c9 0%, #1fae9c 100%);
}

.menu-icon--blue {
  background: linear-gradient(135deg, #6aa8f5 0%, #3b82f0 100%);
}

.menu-card .nut-grid-item__text {
  margin-top: 16px;
  font-size: 26px;
  color: #4a5264;
}

/* 登录弹窗 */
.login-head {
  padding: 44px 32px 6px;
}

.login-head__title {
  font-size: 42px;
  font-weight: 600;
  color: #2b3245;
}

.login-head__subtitle {
  margin-top: 12px;
  font-size: 24px;
  color: #9aa5b8;
}

.login-popup .form-wrapper {
  padding: 20px 32px 40px;
}

.login-popup .nut-form-item {
  background: #f7f8fa;
  border: 2px solid #eef0f4;
  border-radius: 20px;
  margin-bottom: 28px;
  padding: 8px 30px;
}

.verify-code-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.verify-code-input {
  flex: 1;
  min-width: 0;
}

.verify-code-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 60px;
  margin-left: 16px;
  border: 2px dashed #c4c9d4;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
}

.verify-code-image {
  display: block;
  width: 200px;
  height: 60px;
}

.verify-code-placeholder {
  font-size: 24px;
  color: #5b7cfa;
  text-align: center;
}

.login-button-wrapper {
  margin-top: 44px;
}

.login-popup .login-btn {
  background: linear-gradient(135deg, #5b7cfa 0%, #8b5cf6 100%);
  border: none;
  box-shadow: 0 12px 24px rgba(91, 124, 250, 0.32);
}

/* ===== 每周课表弹窗 ===== */
.schedule {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.schedule__header {
  flex-shrink: 0;
  padding: 40px 48px 0;
}

.schedule__title {
  font-size: 38px;
  font-weight: 600;
  color: #2b3245;
}

.schedule__title-row {
  display: flex;
  align-items: center;
}

/* 周导航（‹ 第N周 › + 回到本周）：独占一行，避开右上角关闭按钮 */
.schedule__week-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 16px;
}

.schedule__week-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 52px;
  font-size: 40px;
  line-height: 1;
  color: #5b7cfa;
}

.schedule__week-arrow--disabled {
  color: #c9cfda;
}

.schedule__week-nav-label {
  min-width: 130px;
  text-align: center;
  font-size: 26px;
  font-weight: 600;
  color: #2b3245;
}

.schedule__week-back {
  margin-left: 20px;
  padding: 8px 22px;
  border-radius: 12px;
  background: #f0f2f5;
  font-size: 22px;
  color: #9aa5b8;
}

.schedule__subtitle {
  margin-top: 8px;
  font-size: 24px;
  color: #9aa5b8;
}

.schedule__next {
  margin-top: 8px;
  font-size: 24px;
  color: #5b7cfa;
}

/* 自绘星期 tab 栏（替代 nut-tabs，避免小程序下 tab-pane 常驻 DOM 切换不生效） */
.schedule__tabs {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin: 24px 32px 8px;
  padding: 10px;
  background: #f5f7fb;
  border-radius: 24px;
  box-sizing: border-box;
}

.schedule__tab {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 0 16px;
  border-radius: 18px;
  color: #9aa5b8;
  transition: all 0.2s;
}

.schedule__tab--today {
  color: #5b7cfa;
}

.schedule__tab--active {
  background: linear-gradient(135deg, #5b7cfa 0%, #8b5cf6 100%);
  color: #ffffff;
  box-shadow: 0 8px 16px rgba(91, 124, 250, 0.28);
}

.schedule__tab-name {
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
}

.schedule__tab-date {
  margin-top: 6px;
  font-size: 20px;
  opacity: 0.72;
}

.schedule__tab-dot {
  position: absolute;
  top: 8px;
  right: 50%;
  margin-right: -34px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.schedule__tab--active .schedule__tab-dot {
  background: rgba(255, 255, 255, 0.9);
}

.schedule .schedule-list {
  flex: 1;
  min-height: 0;
}

.schedule-list {
  height: 100%;
  overflow-y: auto;
  padding: 20px 40px 48px;
  box-sizing: border-box;
}

/* 课程卡片 */
.course-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 22px 24px;
  background: #fff;
  border: 2px solid transparent;
  border-radius: 24px;
  box-shadow: 0 8px 24px rgba(60, 74, 116, 0.06);
}

.course-item--now {
  border-color: #5b7cfa;
  background: linear-gradient(135deg, #f3f6ff 0%, #ffffff 65%);
}

.course-item__time {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 104px;
  padding: 14px 4px;
  border-radius: 18px;
  background: #eef1ff;
}

.course-item--now .course-item__time {
  background: linear-gradient(135deg, #5b7cfa 0%, #8b5cf6 100%);
  box-shadow: 0 8px 20px rgba(91, 124, 250, 0.32);
}

.course-item__time-start {
  font-size: 28px;
  font-weight: 600;
  color: #5b7cfa;
}

.course-item--now .course-item__time-start {
  color: #fff;
}

.course-item__time-end {
  margin-top: 2px;
  font-size: 20px;
  color: #9aa5b8;
}

.course-item--now .course-item__time-end {
  color: rgba(255, 255, 255, 0.85);
}

.course-item__body {
  flex: 1;
  min-width: 0;
  margin-left: 24px;
}

.course-item__name {
  font-size: 30px;
  font-weight: 600;
  color: #2b3245;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-item__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 10px;
}

.course-item__meta-item {
  display: flex;
  align-items: center;
  margin-right: 24px;
  font-size: 22px;
  color: #6b7486;
}

.course-item__meta-item text {
  margin-left: 6px;
}

.course-item__weeks {
  padding: 4px 12px;
  border-radius: 10px;
  background: #f0f2f5;
  font-size: 20px;
  color: #9aa5b8;
}

.course-item--now .course-item__weeks {
  background: rgba(91, 124, 250, 0.12);
  color: #5b7cfa;
}

.course-item__progress {
  display: flex;
  align-items: center;
  margin-top: 14px;
}

.course-item__progress-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #eef1ff;
  overflow: hidden;
}

.course-item__progress-inner {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #5b7cfa 0%, #8b5cf6 100%);
  transition: width 0.8s ease;
}

.course-item__progress-text {
  flex-shrink: 0;
  margin-left: 12px;
  font-size: 20px;
  color: #5b7cfa;
}

/* 空状态 */
.schedule-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
}

.schedule-empty__info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.schedule-empty__hint {
  margin-top: 20px;
  font-size: 26px;
  color: #9aa5b8;
  text-align: center;
}

.schedule-empty__main {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 600;
  color: #2b3245;
  text-align: center;
  line-height: 1.5;
}
</style>
