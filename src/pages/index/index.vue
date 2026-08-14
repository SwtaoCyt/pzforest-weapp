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

    <!-- 下一节课卡片 -->
    <view
      class="course-card"
      :class="{ 'course-card--empty': !nextCourse }"
      @click="handleCourseCardClick"
    >
      <view class="course-card__icon" :class="{ 'course-card__icon--empty': !nextCourse }">
        <Clock v-if="nextCourse" color="#5b7cfa" size="36px" />
        <Tips v-else color="#ff9f43" size="36px" />
      </view>
      <view class="course-card__info">
        <view class="course-card__label">下一节课</view>
        <view class="course-card__name">{{ nextCourse ? nextCourse.name : '今天已经没有课程啦！' }}</view>
        <view class="course-card__meta">
          <template v-if="nextCourse">
            <view class="course-card__meta-item">
              <Location color="#9aa5b8" size="16px" />
              <text>{{ nextCourse.classroom }}</text>
            </view>
            <view class="course-card__meta-item">
              <Clock color="#9aa5b8" size="16px" />
              <text>{{ nextCourse.time }}</text>
            </view>
          </template>
          <text v-else class="course-card__tip">早点休息，养精蓄锐～</text>
        </view>
      </view>
      <ArrowRight v-if="nextCourse" class="course-card__arrow" color="#c2c9d6" size="28px" />
    </view>

    <!-- 常用功能 -->
    <view class="section">
      <view class="section__title">常用功能</view>
      <view class="menu-card">
        <nut-grid :gutter="8" :clickable="true" :column-num="3" :border="false">
          <nut-grid-item text="微博投稿" @click="navigateTo('sendweibo','')">
            <view class="menu-icon menu-icon--coral">
              <Photograph color="#ff6b6b" size="36px" />
            </view>
          </nut-grid-item>
          <nut-grid-item text="我的课表" @click="handleCheckMyClass">
            <view class="menu-icon menu-icon--teal">
              <Horizontal color="#2bb8a5" size="36px" />
            </view>
          </nut-grid-item>
          <nut-grid-item text="设置" @click="navigateTo('setting','')">
            <view class="menu-icon menu-icon--blue">
              <Setting color="#3b9df0" size="36px" />
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
      :style="{ height: '60%' }"
    >
      <div>
        <nut-tabs
          v-model="currentDay"
          type="smile"
          direction="vertical"
          title-scroll
          @click="handleTabClick"
          auto-height
        >
          <nut-tab-pane
            v-for="(day, index) in weekDays"
            :key="index"
            :title="day"
            :pane-key="String(index + 1)"
          >
            <nut-table
              :columns="tableColumns"
              :data="weekCourses"
              style="padding-top: 4%;"
            />
          </nut-tab-pane>
        </nut-tabs>
      </div>
    </nut-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue';
import { useDidShow } from '@tarojs/taro'
import Taro from '@tarojs/taro';
import {
  Horizontal, Photograph, Setting,
  Clock, Location, ArrowRight, Tips
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
  getLoginId
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
};

// 响应式数据
const schedules = ref<Schedule[]>([]);
const verifyCodeUrl = ref<string>('');
const verifyCodeView = ref(false);
const classView = ref(false);
const isLoading = ref(false);
const currentDay = ref(String(new Date().getDay()));
const weekCourses = ref<Schedule[]>([]);
const notifyRef = ref(null);

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

const tableColumns = ref([
  { title: '课程名', key: 'name' },
  { title: '教室', key: 'classroom' },
  { title: '时间', key: 'time' }
]);

// 工具函数
const getDayOfWeek = (day: number): string => WEEK_DAYS[day];

const isNewWeek = (): boolean => {
  try {
    const lastUpdateStr = Taro.getStorageSync(CACHE_KEYS.SCHEDULE_DATE);
    if (!lastUpdateStr) return true;

    const lastUpdate = new Date(lastUpdateStr);
    const now = new Date();

    const timeDiff = now.getTime() - lastUpdate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff > 7) return true;

    const nowWeekday = now.getDay();

    return nowWeekday === 1 && daysDiff > 0;
  } catch (error) {
    console.error('检查周期失败:', error);
    return true;
  }
};

const getTimeDifference = (courseTime: string): number => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  const [startTime] = courseTime.split("-");
  const [courseHour, courseMinute] = startTime.split(":").map(Number);

  return (courseHour * 60 + courseMinute) - (currentHour * 60 + currentMinute);
};

// 计算属性
const todayCourses = computed(() => {
  if (!schedules.value.length) return [];

  const currentTime = new Date();
  const currentDayOfWeek = getDayOfWeek(currentTime.getDay());

  return schedules.value.filter(course => course.dayofweek === currentDayOfWeek);
});

const nextCourse = computed(() => {
  const upcomingCourses = todayCourses.value
    .map(course => ({ ...course, timeDifference: getTimeDifference(course.time) }))
    .filter(course => course.timeDifference > 0)
    .sort((a, b) => a.timeDifference - b.timeDifference);

  return upcomingCourses.length > 0 ? upcomingCourses[0] : null;
});

// 问候语，根据当前时间动态变化
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

// 今天的日期文案，例如：8月14日 · 星期五
const todayText = computed(() => {
  const now = new Date();
  return `${now.getMonth() + 1}月${now.getDate()}日 · ${WEEK_DAYS[now.getDay()]}`;
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
    } catch (error) {
      console.error('清除缓存失败:', error);
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

    // 课表绑定状态以数据库为准，只要微信已登录就尝试拉取；
    // 拉到了就反向同步本地绑定标记，避免本地标记丢失后被误判为未绑定
    if (userStore.isWeChatLoggedIn) {
      const response = await getMyClass();

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const fetchedSchedules = response.data as Schedule[];
        schedules.value = fetchedSchedules;
        storage.setSchedules(fetchedSchedules);
        userStore.loginSchool();
      } else {
        userStore.logoutSchool();
      }
    }
  } catch (error) {
    console.error('加载课表失败:', error);
    triggerNotify('danger', '加载课表失败');
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
  if (nextCourse.value) {
    handleCheckMyClass();
  }
};

const handleCheckMyClass = async (): Promise<void> => {
  // 先尝试从数据库加载课表（loadSchedules 会反向同步绑定状态）
  if (!schedules.value || schedules.value.length === 0) {
    await loadSchedules();
  }

  if (schedules.value && schedules.value.length > 0) {
    const today = new Date().getDay();
    updateWeekCourses(String(today));
    currentDay.value = String(today);
    classView.value = true;
  } else if (userStore.isSchoolLoggedIn) {
    // 标记为已绑定但没拉到数据，多半是网络问题，提示重试而不是让重新绑定
    triggerNotify('warning', '课表加载失败，请稍后重试');
  } else {
    // 数据库里也没有课表，确实未绑定，弹出登录
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
});

useDidShow(() => {
  userStore.init();
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
  width: 96px;
  height: 96px;
  border-radius: 28px;
}

.menu-icon--coral {
  background: #ffe9e7;
}

.menu-icon--teal {
  background: #e0f7f5;
}

.menu-icon--blue {
  background: #e3f2fd;
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
</style>