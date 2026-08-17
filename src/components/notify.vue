<template>
  <view
    v-if="state.show"
    :key="state.key"
    class="notify"
    :class="'notify--' + state.type"
  >
    <view class="notify__icon">
      <text class="notify__glyph">{{ icon }}</text>
    </view>
    <text class="notify__text">{{ state.desc }}</text>
  </view>
</template>

<script setup>
import { reactive, computed } from 'vue';

// 每种类型对应一个图形符号，配合底色形成轻量图标，避免额外引入图标库
const ICONS = {
  primary: 'i',
  success: '✓',
  danger: '✕',
  warning: '!'
};

const state = reactive({
  show: false,
  desc: '',
  type: 'primary',
  duration: 3000, // 默认展示时长
  key: 0
});

let timer = null;

const icon = computed(() => ICONS[state.type] || ICONS.primary);

const show = (options) => {
  // 先清掉上一个未到期的自动关闭计时器，避免旧通知提前把新通知关掉
  if (timer) clearTimeout(timer);
  state.type = options.type || 'primary';
  state.desc = options.desc || '';
  state.duration = options.duration || 3000;
  // key 变化会强制重建元素，重新触发滑入动画，连续触发也能正常弹出
  state.key += 1;
  state.show = true;
  if (state.duration > 0) {
    timer = setTimeout(() => {
      state.show = false;
    }, state.duration);
  }
};

defineExpose({
  show
});
</script>

<style>
/* 顶部浮动通知条：渐变底色 + 圆形图标 + 滑入动画 */
.notify {
  position: fixed;
  top: 32px;
  left: 32px;
  right: 32px;
  z-index: 9999;
  display: flex;
  align-items: center;
  padding: 24px 28px;
  border-radius: 24px;
  color: #fff;
  box-shadow: 0 12px 32px rgba(31, 38, 55, 0.18);
  animation: notify-in 0.28s cubic-bezier(0.22, 0.9, 0.35, 1.12);
}

.notify__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  margin-right: 16px;
  flex-shrink: 0;
}

.notify__glyph {
  font-size: 28px;
  line-height: 1;
  font-weight: 700;
}

.notify__text {
  flex: 1;
  min-width: 0;
  font-size: 28px;
  line-height: 1.4;
  word-break: break-all;
}

/* 各类型配色：与全站主题渐变色保持一致 */
.notify--primary {
  background: linear-gradient(135deg, #5b7cfa 0%, #8b5cf6 100%);
}

.notify--success {
  background: linear-gradient(135deg, #2bb8a5 0%, #34c77b 100%);
}

.notify--danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #f4566b 100%);
}

.notify--warning {
  background: linear-gradient(135deg, #ffb020 0%, #ff9f43 100%);
}

@keyframes notify-in {
  from {
    opacity: 0;
    transform: translateY(-48px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
