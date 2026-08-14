// router/index.js
import Taro from '@tarojs/taro'

export const  navigateTo = (url, options)=> {

  url ="/pages/" + url +"/index",
  console.log(url);
  Taro.navigateTo({
   url,
    ...options
  })
}


export const   redirectTo =(url, options)=> {
    Taro.redirectTo({
      url,
      ...options
    })
  }

  export const  switchTab =(url, options)=> {
    Taro.switchTab({
      url,
      ...options
    })
  }


  export const   reLaunch =(url, options)=> {
    Taro.reLaunch({
      url,
      ...options
    })
  }

