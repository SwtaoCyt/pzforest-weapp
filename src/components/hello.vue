<template>
  <nut-swiper
    :init-page="page"
    :pagination-visible="true"
    pagination-color="#426543"
    auto-play="3000"
  >
    <nut-swiper-item v-for="item in list" :key="item">
      <img :src="item" alt="" />
    </nut-swiper-item>
  </nut-swiper>
</template>
<script lang="ts">
import { reactive, toRefs, onMounted } from "vue";
export default {
  setup() {
    const state = reactive({
      page: 2,
      list: [] as string[],
    });
    onMounted(() => {
      setTimeout(() => {
        state.list = [
          "https://storage.360buyimg.com/jdc-article/NutUItaro34.jpg",
          "https://storage.360buyimg.com/jdc-article/NutUItaro2.jpg",
          "https://storage.360buyimg.com/jdc-article/welcomenutui.jpg",
          "https://storage.360buyimg.com/jdc-article/fristfabu.jpg",
        ];
      }, 3000);
    });
    return { ...toRefs(state) };
  },
};
</script>
<style lang="scss" >
.nut-swiper-item {
  line-height: 300px;
  img {
    width: 100%;
    height: 100%;
  }
}
</style>