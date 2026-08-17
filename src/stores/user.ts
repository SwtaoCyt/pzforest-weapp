import { defineStore } from 'pinia';
import Taro from '@tarojs/taro';

const CACHE_KEYS = {
  TOKEN_NAME: 'tokenName',
  TOKEN_VALUE: 'tokenValue',
  SCHOOL_LOGIN: 'schoolLoginStatus'
};

export const useUserStore = defineStore('user', {
  state: () => ({
    tokenName: '' as string,
    tokenValue: '' as string,
    isWeChatLoggedIn: false as boolean,
    isSchoolLoggedIn: false as boolean,
  }),

  actions: {
    /**
     * Initializes the store from storage.
     */
    init() {
      try {
        const tokenName = Taro.getStorageSync(CACHE_KEYS.TOKEN_NAME);
        const tokenValue = Taro.getStorageSync(CACHE_KEYS.TOKEN_VALUE);
        const schoolLoginStatus = Taro.getStorageSync(CACHE_KEYS.SCHOOL_LOGIN);

        if (tokenName && tokenValue) {
          this.tokenName = tokenName;
          this.tokenValue = tokenValue;
          this.isWeChatLoggedIn = true;
        }
        if (schoolLoginStatus) {
          this.isSchoolLoggedIn = schoolLoginStatus;
        }
      } catch (error) {
        console.error('Failed to initialize user store from storage', error);
      }
    },

    /**
     * Logs the user in for the main application.
     * @param {string} tokenName - The name of the token header.
     * @param {string} tokenValue - The value of the token.
     */
    login(tokenName: string, tokenValue: string) {
      this.tokenName = tokenName;
      this.tokenValue = tokenValue;
      this.isWeChatLoggedIn = true;

      try {
        Taro.setStorageSync(CACHE_KEYS.TOKEN_NAME, tokenName);
        Taro.setStorageSync(CACHE_KEYS.TOKEN_VALUE, tokenValue);
      } catch (error) {
        console.error('Failed to save token to storage', error);
      }
    },

    /**
     * Logs the user out from the main application.
     */
    logout() {
      this.tokenName = '';
      this.tokenValue = '';
      this.isWeChatLoggedIn = false;
      this.isSchoolLoggedIn = false;

      try {
        Taro.removeStorageSync(CACHE_KEYS.TOKEN_NAME);
        Taro.removeStorageSync(CACHE_KEYS.TOKEN_VALUE);
        Taro.removeStorageSync(CACHE_KEYS.SCHOOL_LOGIN);
        // 清理 api.ts 里直接写入的身份 / 课表缓存，避免换账号后串数据
        Taro.removeStorageSync('loginId');
        Taro.removeStorageSync('JSESSIONID');
        Taro.removeStorageSync('myClass');
        Taro.removeStorageSync('myClassDate');
      } catch (error) {
        console.error('Failed to remove token from storage', error);
      }
    },

    /**
     * Sets the school login status to true.
     */
    loginSchool() {
      this.isSchoolLoggedIn = true;
      try {
        Taro.setStorageSync(CACHE_KEYS.SCHOOL_LOGIN, true);
      } catch (error) {
        console.error('Failed to save school login status to storage', error);
      }
    },

    /**
     * Sets the school login status to false.
     */
    logoutSchool() {
      this.isSchoolLoggedIn = false;
      try {
        Taro.removeStorageSync(CACHE_KEYS.SCHOOL_LOGIN);
      } catch (error) {
        console.error('Failed to remove school login status from storage', error);
      }
    },
  },
});
