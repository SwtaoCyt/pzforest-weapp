
<template>
  <!-- <hello></hello> -->

  <nut-grid :column-num="2">
    <nut-grid-item text="投稿" @click="sendWeibo()">
      <Home />
    </nut-grid-item>
    <nut-grid-item text="链接跳转" url="https://jd.com">
      <Search />
    </nut-grid-item>
  </nut-grid>

  <view class="index">
    <!-- {{ msg }} <Dongdong /> -->
    <!-- <view class="btn">
      <button type="primary" @click="handleLogin()">授权登录</button>
      <button type="success" @click="handleGet()">获取用户信息</button>
      <button open-type="getPhoneNumber" @getphonenumber="getphonenumber">
        获取用户手机
      </button>
    </view> -->
    <nut-toast :msg="msg2" v-model:visible="show" :type="type" :cover="cover" />
  </view>

  <listitem></listitem>
</template>

<script >
import { onMounted, reactive, toRefs } from "vue";
import { Dongdong, Home, Search } from "@nutui/icons-vue-taro";
import Hello from "@/components/hello.vue";

import Taro from "@tarojs/taro";
import { base64ToArrayBuffer } from '@tarojs/taro';
import CryptoJS from 'crypto-js';


import Listitem from '@/components/listitem.vue';
export default {
  name: "Index",
  components: {
    Dongdong,
    Hello,
    Home,
    Search,

    Listitem
  },
  setup () {
    onMounted(() => {
      handleLogin()

    });
    const sendWeibo = () => {
      console.log("hahaah");
      Taro.navigateTo({ url: '/pages/send/index' })
    }
    const state = reactive({
      msg: "不欢迎使用 NutUI4.0 开发小程序",
      msg2: "你成功了～123456",
      type: "text",
      show: false,
      cover: false,
    });
    const getphonenumber = async (e) => {
      const { encryptedData, iv } = e.detail;
      const sessionKey = Taro.getStorageSync('session_key')
      console.log(e);
      const res = await Taro.request({
        url: 'http://localhost:8080/weapp/phone',
        method: 'POST',
        data: {
          encryptedData,
          iv,
          sessionKey
        }

      })
    }
    const handleGet = () => {
      Taro.getUserProfile({
        desc: "用于完善用户信息", // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
        success: (res) => {
          // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
          var encryptedData = res.encryptedData;
          var iv = res.iv;
          var session_key = Taro.getStorageSync("session_key");
          const decryptedData = decryptData(session_key, encryptedData, iv);
          console.log(decryptedData);

        },
      });
    };
    const decryptData = function (sessionKey, encryptedData, iv) {
      console.log("当前sessionkey" + sessionKey);
      console.log("当前encryptedData" + encryptedData);
      console.log("当前iv" + iv);
      // 将密钥转成16字节长度的数组
      const key = CryptoJS.enc.Base64.parse(sessionKey);
      // 将iv转成16字节长度的数组
      const ivBytes = CryptoJS.enc.Base64.parse(iv);
      // 将加密的数据转成字节数组
      const ciphertextBytes = CryptoJS.enc.Base64.parse(encryptedData);

      // 解密
      const decryptedData = CryptoJS.AES.decrypt(
        { ciphertext: ciphertextBytes },
        key,
        { iv: ivBytes, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      );

      // 将解密后的数据转成字符串
      const decryptedStr = decryptedData.toString(CryptoJS.enc.Utf8);

      // 返回解密后的数据
      return decryptedStr;
    }
    const handleLogin = async () => {
      const { code } = await Taro.login();

      const { data } = await Taro.request({
        url: "http://localhost:8080/user/login",
        method: "POST",
        data: {
          code,
        },
      });

      console.log(data.data.openid);
      //将登录后获取的openid和session_key保存
      Taro.clearStorageSync("openid")
      Taro.clearStorageSync("session_key")
      Taro.setStorageSync("openid", data.data.openid)

      Taro.setStorageSync("session_key", data.data.session_key);
    };
    const handleClick = (type, msg, cover = false) => {
      state.show = true;
      state.msg2 = msg;
      state.type = type;
      state.cover = cover;
    };

    return {
      ...toRefs(state),
      handleClick,
      handleLogin,
      handleGet,
      getphonenumber,
      sendWeibo
    };
  },
};
</script>

<style lang="scss">
.index {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>