<template>
  <view class="page">
    <!-- 顶部个人信息 -->
    <view class="profile">
      <view class="profile__glow"></view>
      <view class="profile__content">
        <view class="profile__avatar">
          <image v-if="user?.avatarurl" :src="user.avatarurl" mode="aspectFill" class="profile__avatar-img" />
          <text v-else class="profile__avatar-text">{{ avatarInitial }}</text>
        </view>
        <view class="profile__info">
          <view class="profile__name">{{ user?.nikename || '同学' }}</view>
          <view class="profile__subtitle">账号与缓存设置</view>
        </view>
      </view>
    </view>

    <!-- 通用设置 -->
    <view class="section">
      <view class="section__title">通用设置</view>
      <view class="settings-card">
        <view class="setting-item" @click="openDialog()">
          <view class="setting-item__icon setting-item__icon--blue">
            <Edit color="#3b9df0" size="34px" />
          </view>
          <view class="setting-item__body">
            <view class="setting-item__title">更改用户名</view>
            <view class="setting-item__desc">{{ user?.nikename || '未设置' }}</view>
          </view>
          <ArrowRight2 class="setting-item__arrow" color="#c2c9d6" size="28px" />
        </view>

        <view class="setting-item" @click="handleUpdateSchedule">
          <view class="setting-item__icon setting-item__icon--teal">
            <Refresh color="#10b981" size="34px" />
          </view>
          <view class="setting-item__body">
            <view class="setting-item__title">更新课表</view>
            <view class="setting-item__desc">同步教务最新课表（免输入账号密码）</view>
          </view>
          <ArrowRight2 class="setting-item__arrow" color="#c2c9d6" size="28px" />
        </view>

        <view class="setting-item" @click="showCleanCacheDialog = true">
          <view class="setting-item__icon setting-item__icon--red">
            <Del color="#ff6b6b" size="34px" />
          </view>
          <view class="setting-item__body">
            <view class="setting-item__title">清除缓存（课表）</view>
            <view class="setting-item__desc">清除后需重新绑定课表</view>
          </view>
          <ArrowRight2 class="setting-item__arrow" color="#c2c9d6" size="28px" />
        </view>

        <view class="setting-item" @click="showFeedback = true">
          <view class="setting-item__icon setting-item__icon--orange">
            <Message color="#ff9f43" size="34px" />
          </view>
          <view class="setting-item__body">
            <view class="setting-item__title">问题反馈</view>
            <view class="setting-item__desc">遇到问题或建议，告诉我们</view>
          </view>
          <ArrowRight2 class="setting-item__arrow" color="#c2c9d6" size="28px" />
        </view>
      </view>
    </view>

    <!-- 弹窗 -->
    <nut-dialog
      v-model:visible="showDialog"
      title="请输入新的用户名"
      :content-style="{ padding: '20px' }"
      @ok="onConfirm()"
      @cancel="onCancel"
    >
      <nut-input v-model="inputValue" placeholder="新用户名" :label="false" />
    </nut-dialog>

    <nut-dialog
      v-model:visible="showCleanCacheDialog"
      title="清除课表缓存，清除后请重新绑定课表"
      :content-style="{ padding: '20px' }"
      @ok="onConfirmClean()"
      @cancel="onCancel"
    >
    </nut-dialog>

    <!-- 问题反馈弹窗 -->
    <nut-popup
      v-model:visible="showFeedback"
      position="bottom"
      closeable
      round
      :style="{ height: '72%' }"
      class="feedback-popup"
    >
      <view class="feedback">
        <view class="feedback__title">问题反馈</view>
        <view class="feedback__subtitle">请描述你遇到的问题或建议，我们会尽快处理</view>
        <view class="feedback__field">
          <nut-textarea
            v-model="feedbackContent"
            placeholder="请输入反馈内容…"
            :max-length="1000"
            class="feedback__textarea"
          />
        </view>
        <view class="feedback__field feedback__field--contact">
          <nut-input
            v-model="feedbackContact"
            placeholder="联系方式（选填，方便我们回复你）"
            :border="false"
          />
        </view>
        <nut-button
          block
          type="primary"
          class="feedback__submit"
          :loading="feedbackLoading"
          @click="onSubmitFeedback"
        >提交反馈</nut-button>
      </view>
    </nut-popup>

    <notify ref="notifyRef"></notify>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getUser, changeUserName } from "../../services/weibo";
import { cleanCache, submitFeedback, loginToStudyforUpdate, loginTaskStatus } from "../../services/api";
import { User } from '@/model/user';
// @ts-ignore
import notify from '../../components/notify.vue';
import { Edit, Del, ArrowRight2, Message, Refresh } from '@nutui/icons-vue-taro';
import Taro from '@tarojs/taro';

const showCleanCacheDialog = ref(false);
const user = ref<User | null>(null);
const inputValue = ref('');
const notifyRef = ref(null);
const showDialog = ref(false);

// 问题反馈
const showFeedback = ref(false);
const feedbackContent = ref('');
const feedbackContact = ref('');
const feedbackLoading = ref(false);

const avatarInitial = computed(() => (user.value?.nikename || '同').slice(0, 1));

const onConfirmClean = () => {
  cleanCache()
    .then(() => {
      triggerNotify("success", "清除成功！");
    })
    .catch(() => {
      triggerNotify("danger", "清除失败，请稍后重试");
    });
};

// 更新课表：提交 update 任务（后端复用最近一次成功登录的账号密码），轮询结果，成功后清本地课表缓存
const updateScheduleLoading = ref(false);
const handleUpdateSchedule = async (): Promise<void> => {
  if (updateScheduleLoading.value) return;
  updateScheduleLoading.value = true;
  try {
    const resp = await loginToStudyforUpdate();
    const taskId = resp?.data?.data?.taskId;
    if (!taskId) {
      if (resp?.data?.code === 409) {
        triggerNotify('warning', '已有任务处理中，请稍候');
      } else if (resp?.data?.code === 403) {
        triggerNotify('warning', resp?.data?.data || '未找到可复用的登录信息，请先绑定课表');
      } else {
        triggerNotify('danger', '提交失败，请重试');
      }
      return;
    }
    let finished = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      let st: any;
      try {
        st = await loginTaskStatus(taskId);
      } catch (e) {
        continue;
      }
      const stData = st?.data?.data;
      if (!stData) continue;
      if (stData.status === 'done') {
        finished = true;
        if (Number(stData.resultCode) === 200) {
          Taro.removeStorageSync('myClass');
          Taro.removeStorageSync('myClassDate');
          triggerNotify('success', '课表更新成功！');
        } else {
          triggerNotify('danger', stData.resultMsg || '更新失败，请重试');
        }
        break;
      }
      if (stData.status === 'failed') {
        finished = true;
        triggerNotify('danger', stData.error || '更新失败，请重试');
        break;
      }
    }
    if (!finished) {
      triggerNotify('danger', '更新超时，请稍后重试');
    }
  } catch (e) {
    console.error('更新课表失败:', e);
    triggerNotify('danger', '网络错误，请稍后重试');
  } finally {
    updateScheduleLoading.value = false;
  }
};

/**
 * 触发提醒
 * @param notifyClass
 */
const triggerNotify = (notifyClass, str) => {
  if (notifyRef.value) {
    // @ts-ignore
    notifyRef.value.show({ type: notifyClass, desc: str });
  }
};

const openDialog = () => {
  showDialog.value = true;
};

const onConfirm = () => {
  if (inputValue.value.length === 0) {
    triggerNotify("danger", "你都没有输入名字");
  } else {
    changeUserName(inputValue.value).then(res => {
      console.log(res);
      triggerNotify("success", res.message);
      // 同步本地昵称，避免界面还显示旧名字
      if (user.value) {
        user.value.nikename = inputValue.value;
      }
    });
  }
  showDialog.value = false;
};

const onCancel = () => {
  console.log('Cancelled');
  showDialog.value = false;
};

const onSubmitFeedback = () => {
  if (!feedbackContent.value.trim()) {
    triggerNotify('danger', '请先填写反馈内容');
    return;
  }
  feedbackLoading.value = true;
  submitFeedback(feedbackContent.value.trim(), feedbackContact.value.trim())
    .then((res: any) => {
      triggerNotify('success', (res && res.message) || '反馈已提交，谢谢！');
      feedbackContent.value = '';
      feedbackContact.value = '';
      showFeedback.value = false;
    })
    .catch(() => {
      triggerNotify('danger', '提交失败，请稍后重试');
    })
    .finally(() => {
      feedbackLoading.value = false;
    });
};

onMounted(() => {
  getUser().then(res => {
    user.value = res;
    console.log(user);
  });
});
</script>

<style>
.page {
  min-height: 100vh;
  padding: 48px 48px 80px;
  background: linear-gradient(180deg, #eef2ff 0%, #f6f7fb 45%);
  box-sizing: border-box;
}

/* 个人信息卡 */
.profile {
  position: relative;
  overflow: hidden;
  padding: 48px 40px;
  border-radius: 40px;
  background: linear-gradient(135deg, #5b7cfa 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 20px 48px rgba(91, 124, 250, 0.28);
}

.profile__glow {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
}

.profile__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
}

.profile__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
  flex-shrink: 0;
}

.profile__avatar-img {
  width: 100%;
  height: 100%;
}

.profile__avatar-text {
  font-size: 52px;
  font-weight: 600;
  color: #fff;
}

.profile__info {
  margin-left: 32px;
  min-width: 0;
}

.profile__name {
  font-size: 42px;
  font-weight: 600;
  letter-spacing: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile__subtitle {
  margin-top: 12px;
  font-size: 24px;
  opacity: 0.85;
}

/* 分区 */
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

/* 设置卡片 */
.settings-card {
  padding: 8px 32px;
  background: #fff;
  border-radius: 32px;
  box-shadow: 0 12px 36px rgba(60, 74, 116, 0.08);
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 32px 0;
}

.setting-item + .setting-item {
  border-top: 2px solid #f0f2f5;
}

.setting-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 24px;
  flex-shrink: 0;
}

.setting-item__icon--blue {
  background: #e3f2fd;
}

.setting-item__icon--red {
  background: #ffe9e7;
}

.setting-item__icon--orange {
  background: #fff3e0;
}

.setting-item__icon--teal {
  background: #e0f5ee;
}

.setting-item__body {
  flex: 1;
  min-width: 0;
  margin-left: 28px;
}

.setting-item__title {
  font-size: 30px;
  font-weight: 500;
  color: #2b3245;
}

.setting-item__desc {
  margin-top: 8px;
  font-size: 24px;
  color: #9aa5b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.setting-item__arrow {
  flex-shrink: 0;
  margin-left: 16px;
}

/* 问题反馈弹窗 */
.feedback {
  height: 100%;
  padding: 56px 40px 64px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.feedback__title {
  font-size: 36px;
  font-weight: 600;
  color: #2b3245;
}

.feedback__subtitle {
  margin-top: 12px;
  margin-bottom: 32px;
  font-size: 26px;
  color: #9aa5b8;
  line-height: 1.5;
}

.feedback__field {
  background: #f5f6f8;
  border-radius: 20px;
  padding: 8px 24px;
  margin-bottom: 24px;
}

.feedback__field--contact {
  margin-bottom: 40px;
}

.feedback__textarea {
  background: transparent;
}

.feedback__submit {
  margin-top: auto;
  background: linear-gradient(135deg, #5b7cfa, #8b5cf6);
  border: none;
}
</style>
