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
              <text>{{ nextCourse.time }}</text>
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
            <view class="schedule__title">本周课表</view>
            <view v-if="currentWeek > 0" class="schedule__week-tag">第{{ currentWeek }}周</view>
          </view>
          <view class="schedule__subtitle">{{ currentDayText }}</view>
          <view v-if="todayNextText" class="schedule__next">{{ todayNextText }}</view>
        </view>
        <nut-tabs
          v-model="currentDay"
          type="smile"
          title-scroll
          @click="handleTabClick"
          class="schedule__tabs"
        >
          <nut-tab-pane
            v-for="(day, index) in weekDays"
            :key="index"
            :title="day"
            :pane-key="String(index + 1)"
          >
            <view class="schedule-list">
              <view
                v-for="course in weekCourses"
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
              <view v-if="!weekCourses.length" class="schedule-empty">
                <Tips color="#c2c9d6" size="60px" />
                <view v-if="currentDay === todayIndex() && nextClassSummary" class="schedule-empty__info">
                  <text class="schedule-empty__hint">今天没课，下次上课</text>
                  <text class="schedule-empty__main">{{ nextClassSummary.day }} {{ nextClassSummary.start }} · {{ nextClassSummary.name }}</text>
                </view>
                <text v-else class="schedule-empty__hint">这天没有课程，好好休息～</text>
              </view>
            </view>
          </nut-tab-pane>
        </nut-tabs>
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
import { getCoursesByDay } from '../../utils/utils.js';
import { navigateTo } from '../../router/index';
import {
  API_ROOT,
  getClassVerifyCode,
  loginToStudy,
  getMyClass,
  getLoginId,
  getCurrentWeek
} from "../../services/api";

// 类型定义
interface Schedule {
  classroom: string;
  dayofweek: string;
  id: number;
  name: string;
  semester: string;
  studentid: string;
  teacher: string;
  time: string;
  weeks: number;
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
  // 未绑定课表（后端返回空）的本地标记，避免 useDidShow 每显示一次首页就打一次后端
  NO_SCHEDULE_TS: 'noScheduleTs',
};

// 未绑定时本地标记的保鲜时间（分钟）：过期后才会再次尝试拉取
const NO_SCHEDULE_TTL_MIN = 30;

// 放假区间（MM-DD），命中期间禁止课表绑定，避免拉到错误的教务数据。
// 寒假：春节前后 ~ 2月底；暑假：7月初 ~ 8月底。可按学校实际校历调整。
const HOLIDAY_RANGES: Array<[string, string]> = [
  ['01-20', '02-28'], // 寒假
  ['07-01', '08-31'], // 暑假
];

// 响应式数据
const schedules = ref<Schedule[]>([]);
const verifyCodeUrl = ref<string>('');
const verifyCodeView = ref(false);
const classView = ref(false);
const isLoading = ref(false);
const currentDay = ref(String(new Date().getDay() === 0 ? 7 : new Date().getDay()));
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
const verifyNotice = ref("请登录您的教务系统以获取课表");
const weekDays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];

// 工具函数
const getDayOfWeek = (day: number): string => WEEK_DAYS[day === 7 ? 0 : day];

// 今天的 tab 索引（周一=1 … 周日=7）
const todayIndex = (): string => String(new Date().getDay() === 0 ? 7 : new Date().getDay());

// "08:00-09:40" -> 分钟数
const parseMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const courseStart = (time: string): string => (time ? time.split('-')[0].trim() : '');
const courseEnd = (time: string): string => (time ? (time.split('-')[1] || '').trim() : '');

// 课程是否正在上课（仅当天生效）
const isNowCourse = (course: Schedule): boolean => {
  if (currentDay.value !== todayIndex()) return false;
  const start = courseStart(course.time);
  const end = courseEnd(course.time);
  if (!start || !end) return false;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= parseMinutes(start) && nowMin < parseMinutes(end);
};

// 周次 bitmask -> 可读文案，如 "第1-16周" / "第1-8、10-16周"
const formatWeeks = (mask: number): string => {
  if (!mask) return '';
  const weeks: number[] = [];
  for (let i = 0; i < 25; i++) {
    if (mask & (1 << i)) weeks.push(i + 1);
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

const isNewWeek = (): boolean => {
  try {
    const lastUpdateStr = Taro.getStorageSync(CACHE_KEYS.SCHEDULE_DATE);
    if (!lastUpdateStr) return true;

    const lastUpdate = new Date(lastUpdateStr);
    const now = new Date();

    const timeDiff = now.getTime() - lastUpdate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff >= 7) return true;

    const nowWeekday = now.getDay();

    return nowWeekday === 1 && daysDiff > 0;
  } catch (error) {
    console.error('检查周期失败:', error);
    return true;
  }
};

// 是否处于放假区间：当前月日落在任一 HOLIDAY_RANGES 区间内即视为假期
const isHoliday = (): boolean => {
  const now = new Date();
  const md = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return HOLIDAY_RANGES.some(([start, end]) => md >= start && md <= end);
};

// 计算属性
const todayCourses = computed(() => {
  if (!schedules.value.length) return [];

  const currentDayOfWeek = getDayOfWeek(new Date(nowTick.value).getDay());

  return schedules.value.filter(course => course.dayofweek === currentDayOfWeek);
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
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

// 今天的日期文案，例如：8月14日 · 星期五 · 第2周
const todayText = computed(() => {
  const now = new Date();
  const base = `${now.getMonth() + 1}月${now.getDate()}日 · ${WEEK_DAYS[now.getDay()]}`;
  return currentWeek.value > 0 ? `${base} · 第${currentWeek.value}周` : base;
});

// 课表弹窗副标题：当前选中日 + 是否今天
const currentDayText = computed(() => {
  const idx = Number(currentDay.value) - 1;
  const day = weekDays[idx] || '';
  return day + (currentDay.value === todayIndex() ? ' · 今天' : '');
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
  tickTimer = setInterval(() => { nowTick.value = Date.now(); }, 30000);
};
const stopTick = (): void => {
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
};
onMounted(() => { startTick(); });
onUnmounted(stopTick);

// 星期映射（文案 -> 数字，0=周日）
const DAY_INDEX: Record<string, number> = {
  '星期日': 0, '星期一': 1, '星期二': 2, '星期三': 3,
  '星期四': 4, '星期五': 5, '星期六': 6,
};
const DAY_NAME: Record<number, string> = { 0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六' };

// 全周范围内“下一节”课（先比天数，再比开始时间；今天已结束的课视为下周同一天）
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
    const cDay = DAY_INDEX[c.dayofweek];
    if (cDay === undefined) continue;
    const cStart = parseMinutes(start);
    let dist = (cDay - nowDay + 7) % 7;
    if (dist === 0 && cStart <= nowMin) dist = 7;
    const key = dist * 10000 + cStart;
    if (key < bestKey) { bestKey = key; best = c; }
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
  const cDay = DAY_INDEX[nc.dayofweek];
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
  if (currentDay.value !== todayIndex()) return '';
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

// 存储管理 (仅保留课表相关)
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
      // 成功写入真实课表后，清除“未绑定”标记
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

  // 最近一次拉取结果为空（未绑定）且仍在保鲜期内
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
      triggerNotify("success", "登陆成功！");
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

    // 近期已确认未绑定（后端返回空），在保鲜期内直接跳过网络请求，避免每次首页显示都打后端
    if (storage.hasRecentEmpty()) {
      schedules.value = [];
      return;
    }

    // 课表绑定状态以数据库为准，只要微信已登录就尝试拉取；
    // 拉到了就反向同步本地绑定标记，避免本地标记丢失后被误判为未绑定
    if (userStore.isWeChatLoggedIn) {
      const response = await getMyClass();

      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const fetchedSchedules = response.data as Schedule[];
        schedules.value = fetchedSchedules;
        storage.setSchedules(fetchedSchedules);
        userStore.loginSchool();
      } else {
        schedules.value = [];
        userStore.logoutSchool();
        // 标记“未绑定”，保鲜期内不再反复请求
        storage.markEmpty();
      }
    }
  } catch (error) {
    console.warn('静默获取课表未成功（可能未绑定或网络波动）:', error);
    // 静默失败，不打扰未绑定用户或后台同步中的用户
    schedules.value = [];
    storage.markEmpty();
  }
};

// 拉取当前教学周（失败静默，不影响主流程）
const loadCurrentWeek = async (): Promise<void> => {
  // 已成功加载过则不再重复请求（useDidShow 每次首页显示都会调用）
  if (currentWeek.value && currentWeek.value > 0) return;
  try {
    const data = await getCurrentWeek();
    currentWeek.value = data.week || 0;
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
  // 无论卡片展示的是正在上课 / 下一节 / 下次上课，点击都进入课表
  handleCheckMyClass();
};

const handleCheckMyClass = async (): Promise<void> => {
  // 先尝试从数据库加载课表（loadSchedules 会反向同步绑定状态）
  if (!schedules.value || schedules.value.length === 0) {
    await loadSchedules();
  }

  if (schedules.value && schedules.value.length > 0) {
    const today = new Date().getDay();
    const paneKey = String(today === 0 ? 7 : today);
    updateWeekCourses(paneKey);
    currentDay.value = paneKey;
    classView.value = true;
  } else if (userStore.isSchoolLoggedIn) {
    // 标记为已绑定但没拉到数据，多半是网络问题，提示重试而不是让重新绑定
    triggerNotify('warning', '课表加载失败，请稍后重试');
  } else {
    // 数据库里也没有课表，确实未绑定
    // 放假期间禁止绑定：避免拉到错误的教务课表数据
    if (isHoliday()) {
      triggerNotify('warning', '放假期间暂不开放课表绑定，开学后再来绑定吧~');
      return;
    }
    // 非假期，弹出登录绑定
    verifyCodeView.value = true;
    await updateVerifyCode();
  }
};

const updateWeekCourses = (dayKey: string): void => {
  const dayOfWeek = getDayOfWeek(parseInt(dayKey, 10));
  weekCourses.value = getCoursesByDay(schedules.value, dayOfWeek);
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
  if (!userStore.isWeChatLoggedIn) {
    await handleWeChatLogin();
  } else {
    await loadSchedules();
  }
  loadCurrentWeek();
});

useDidShow(() => {
  userStore.init();
  if (userStore.isWeChatLoggedIn && (!schedules.value || schedules.value.length === 0)) {
    loadSchedules();
  }
  loadCurrentWeek();
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

.schedule__week-tag {
  margin-left: 16px;
  padding: 6px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #5b7cfa 0%, #8b5cf6 100%);
  font-size: 22px;
  color: #fff;
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

.schedule .nut-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  --nut-tabs-titles-background-color: #f5f7fb;
  --nut-tabs-titles-item-color: #9aa5b8;
  --nut-tabs-titles-item-active-color: #5b7cfa;
  --nut-tabs-tab-smile-color: #5b7cfa;
  --nut-tabs-horizontal-tab-line-color: #5b7cfa;
}

.schedule .nut-tabs__titles {
  flex-shrink: 0;
  margin: 20px 40px 8px;
  border-radius: 20px;
}

.schedule .nut-tabs__content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
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
