// router/index.js
import Taro from '@tarojs/taro'

export const navigateTo = (url, options) => {
  const fullUrl = "/pages/" + url + "/index";
  console.log(fullUrl);
  Taro.navigateTo({
    url: fullUrl,
    ...options
  });
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

