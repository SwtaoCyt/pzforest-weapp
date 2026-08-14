<template>
    <nut-notify
      :key="state.key"
      @click="onClick"
      @closed="onClosed"
      :type="state.type"
      v-model:visible="state.show"
      :msg="state.desc"
      :duration="state.duration"
    />
  </template>
  <script setup>
  import { reactive } from 'vue';

  const onClosed = () => console.log('closed');
  const onClick = () => console.log('click');

  const state = reactive({
    show: false,
    desc: '',
    type: 'primary',
    duration: 3000, // 默认时长
    key: 0
  });

  const show = (options) => {
    // 关键修复：先关闭并重建组件，保证 visible 每次都经历 false -> true 的变化。
    // 否则上一次通知还在 3s 自动关闭窗口内时，state.show 已经是 true，
    // 再设 true 不触发 watch，新的通知就不会弹出（“有时候不显示”的根因）。
    // 重建组件同时会清除上一个尚未到期的自动关闭计时器。
    state.show = false;
    state.key += 1;
    state.type = options.type || 'primary';
    state.desc = options.desc || '';
    state.duration = options.duration || 3000;
    // 小程序里不要用 nextTick：key 变化会触发组件异步销毁重建（走 setData），
    // nextTick 是微任务，可能赶在重建完成前就执行，导致新实例 watch 到的 visible
    // 仍是 false，通知就不会弹出（“有时候不显示”的根因）。
    // 改用 setTimeout（宏任务），确保重建完成后再把 visible 置回 true。
    setTimeout(() => {
      state.show = true;
    }, 0);
  };

  // Expose the show method to the parent component
  defineExpose({
    show
  });
  </script>
