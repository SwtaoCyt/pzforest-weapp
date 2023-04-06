// router/index.js
import Taro from '@tarojs/taro'

export default {
  navigateTo (url, options) {
    Taro.navigateTo({
      url,
      ...options
    })
  },

  redirectTo (url, options) {
    Taro.redirectTo({
      url,
      ...options
    })
  },

  switchTab (url, options) {
    Taro.switchTab({
      url,
      ...options
    })
  },

  reLaunch (url, options) {
    Taro.reLaunch({
      url,
      ...options
    })
  }
}
