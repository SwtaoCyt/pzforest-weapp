<template>
  <hello></hello>

  <nut-grid :column-num="2">
    <nut-grid-item text="路由跳转" to="/">
      <Home />
    </nut-grid-item>
    <nut-grid-item text="链接跳转" url="https://jd.com">
      <Search />
    </nut-grid-item>
  </nut-grid>

  <view class="index">
    {{ msg }} <Dongdong />
    <view class="btn">
      <nut-button type="success" @click="handleLogin()">授权登录</nut-button>
    </view>
    <nut-toast :msg="msg2" v-model:visible="show" :type="type" :cover="cover" />
  </view>
</template>

<script>
import { reactive, toRefs } from 'vue';
import { Dongdong } from '@nutui/icons-vue-taro';
import Hello from '@/components/hello.vue';
import Taro from '@tarojs/taro';
export default {
  name: 'Index',
  components: {
    Dongdong,
    Hello,

  },
  setup () {
    const state = reactive({
      msg: '不欢迎使用 NutUI4.0 开发小程序',
      msg2: '你成功了～123456',
      type: 'text',
      show: false,
      cover: false
    });
    const handleLogin = async () => {
      console.log("叼你老母")
      const { code } = await Taro.login()
      console.log(code);
    }
    const handleClick = (type, msg, cover = false) => {
      state.show = true;
      state.msg2 = msg;
      state.type = type;
      state.cover = cover;
    };

    return {
      ...toRefs(state),
      handleClick,
      handleLogin
    }
  }
}
</script>

<style lang="scss">
.index {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
