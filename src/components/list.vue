<template>
  <div class="demo">
    <h2>基础用法</h2>

    <nut-list :height="50" :listData="count" @scroll-bottom="handleScroll">
      <template v-slot="{ item, index }">
        <div class="list-item">
          {{ index }}
        </div>
      </template>
    </nut-list>
  </div>
</template>
<script lang="ts">
import { onMounted, reactive, toRefs } from "vue";
export default {
  props: {},
  setup() {
    const state = reactive({
      count: new Array(100).fill(0),
    });

    const handleScroll = () => {
      let arr = new Array(100).fill(0);
      const len = state.count.length;
      state.count = state.count.concat(
        arr.map((item: number, index: number) => len + index + 1)
      );
    };

    onMounted(() => {
      state.count = state.count.map((item: number, index: number) => index + 1);
    });

    return { ...toRefs(state), handleScroll };
  },
};
</script>
<style lang="scss">
body {
  width: 100%;
  height: 100vh;
}
#app {
  width: 100%;
  height: 100%;
}
.demo {
  .nut-cell {
    height: 100%;
  }
  .nut-list-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 50px;
    margin-bottom: 10px;
    background-color: #f4a8b6;
    border-radius: 10px;
  }
}
</style>