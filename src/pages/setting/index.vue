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

    <notify ref="notifyRef"></notify>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getUser, changeUserName } from "../../services/weibo";
import { cleanCache } from "../../services/api";
import { User } from '@/model/user';
// @ts-ignore
import notify from '../../components/notify.vue';
import { Edit, Del, ArrowRight2 } from '@nutui/icons-vue-taro';

const showCleanCacheDialog = ref(false);
const user = ref<User | null>(null);
const inputValue = ref('');
const notifyRef = ref(null);
const showDialog = ref(false);

const avatarInitial = computed(() => (user.value?.nikename || '同').slice(0, 1));

const onConfirmClean = () => {
  cleanCache();
  triggerNotify("success", "清除成功！");
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
    });
  }
  showDialog.value = false;
};

const onCancel = () => {
  console.log('Cancelled');
  showDialog.value = false;
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
</style>
