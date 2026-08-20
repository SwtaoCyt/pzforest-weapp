import Taro from "@tarojs/taro";
import { useUserStore } from '../stores/user';

// https://pzforest.com
export const  API_ROOT="https://pzforest.com"
export const cleanCache = ()=>{
  Taro.removeStorageSync('myClass');
  Taro.removeStorageSync('myClassDate');
  return requestWithAuth({
    url: `${API_ROOT}/class/cleanCache`,
    method: "GET",
  }).then((res) => res.data);
}

export const getLoginId = ()=>{
  return new Promise<string>((resolve,reject)=>{
    const loginId = Taro.getStorageSync("loginId");
    if(!loginId || loginId.length==0)
      {
        requestWithAuth({
          url:API_ROOT + "/user/getLoginIdAsString",
          method: "GET",
        }).then((res)=>{
            console.log(res);
            Taro.setStorageSync("loginId",res.data)
            resolve(res.data)
          })
          .catch((res)=>{
            reject(res && res.errMsg ? res.errMsg : res)
          })
      }
      else
      {
        resolve(loginId)
      }
    
  })
}
// services/api.ts
export const fetchData = async () => {
  // 小程序运行时没有 process.env（ReferenceError），这里不再读取构建环境变量
  console.log('API 地址：', API_ROOT);
};
export const getClassVerifyCode = ()=>{
  return new Promise<string>((resolve,reject)=>{
    Taro.request({
      url:API_ROOT + "/class/getClassVerifyCode",
      method: "GET",
      success:(res)=>{
        resolve(res.data)
      },
      fail:(res)=>{
        reject(res.errMsg)
      }
    })
  })
}
// 获取当前教学周（后端以学期/周次逻辑为准，与课表过滤一致）
export const getCurrentWeek = () => {
  return new Promise<{ week: number; semester: string }>((resolve, reject) => {
    Taro.request({
      url: API_ROOT + "/class/getCurrentWeek",
      method: "GET",
      success: (res) => {
        const data = res.data && res.data.data;
        if (data) {
          resolve({ week: data.week || 0, semester: data.semester || '' });
        } else {
          reject(new Error('获取当前教学周失败'));
        }
      },
      fail: (res) => reject(res.errMsg),
    });
  });
}
export const getHeader= ()=>{
  // 2、在发起ajax的地方，获取这两个值, 并组织到head里 
var tokenName = Taro.getStorageSync('tokenName');    // 从本地缓存读取tokenName值
var tokenValue = Taro.getStorageSync('tokenValue');    // 从本地缓存读取tokenValue值

var header = {
    
};
if (tokenName != undefined && tokenName != '') {
     header[tokenName] = tokenValue;
}
return header
}

/**
 * 统一鉴权请求封装。
 * - 自动带上 token 请求头（getHeader）；
 * - 命中后端 Result{code:401}（token 过期/失效）时，静默用微信 code 重新登录，
 *   拿到新 token 后重试原请求一次；重登失败则清登录态并 reject。
 * - 仅重试一次，避免死循环。
 */
let refreshing = false;
let refreshPromise: Promise<void> | null = null;

const doRefresh = (): Promise<void> => {
  if (!refreshing) {
    refreshing = true;
    const store = useUserStore();
    refreshPromise = (async () => {
      const { code } = await Taro.login();
      const res = await Taro.request({
        url: `${API_ROOT}/user/login`,
        method: 'POST',
        data: { code },
      });
      const data = res.data && res.data.data;
      if (data && data.tokenName && data.tokenValue) {
        store.login(data.tokenName, data.tokenValue);
      } else {
        throw new Error('微信重新登录失败');
      }
    })()
      .catch((e) => {
        store.logout();
        throw e;
      })
      .finally(() => {
        refreshing = false;
      });
  }
  return refreshPromise!;
};

export const requestWithAuth = (options: any, retried = false): Promise<any> => {
  return new Promise((resolve, reject) => {
    Taro.request({
      ...options,
      header: { ...(options.header || {}), ...getHeader() },
      success: async (res: any) => {
        const body = res.data;
        if (body && typeof body === 'object' && body.code === 401) {
          if (retried) {
            useUserStore().logout();
            reject(res);
            return;
          }
          try {
            await doRefresh();
            requestWithAuth(options, true)
              .then((r) => resolve(r))
              .catch((e) => {
                useUserStore().logout();
                reject(e);
              });
            return;
          } catch (e) {
            useUserStore().logout();
            reject(res);
            return;
          }
        }
        resolve(res);
      },
      fail: (err: any) => reject(err),
    });
  });
};

export const uploadWithAuth = (options: any, retried = false): Promise<any> => {
  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      ...options,
      header: { ...(options.header || {}), ...getHeader() },
      success: async (res: any) => {
        let body = res.data;
        if (typeof body === 'string') {
          try {
            body = JSON.parse(body);
          } catch {
            // 非 JSON，原样返回
          }
        }
        if (body && typeof body === 'object' && body.code === 401) {
          if (retried) {
            useUserStore().logout();
            reject(body);
            return;
          }
          try {
            await doRefresh();
            uploadWithAuth(options, true)
              .then((r) => resolve(r))
              .catch((e) => {
                useUserStore().logout();
                reject(e);
              });
            return;
          } catch (e) {
            useUserStore().logout();
            reject(body);
            return;
          }
        }
        resolve(body);
      },
      fail: (err: any) => reject(err),
    });
  });
};

export const loginToStudy=(userName,passWord,verifyCode)=>{
  const JSESSIONID =  Taro.getStorageSync("JSESSIONID");
  return requestWithAuth({
    url: API_ROOT + "/class/loginToStudy",
    method:"POST",
    data:{
      userName:userName,
      passWord:passWord,
      RANDOMCODE:verifyCode,
      JSESSIONID:JSESSIONID,
    },
  });
}

export const test = () => {
  console.log("hello");
};

// 提交问题反馈
// 对齐后端 /feedback/submit 契约：content 必填（≤1000），contact 选填；
// platform / appVersion / pagePath 由客户端自动补齐（后端会忽略任何伪造的 openid，故不再发送）。
export const submitFeedback = (content: string, contact: string) => {
  try {
    // 微信小程序运行时没有 process 对象（process.env 会 ReferenceError，历史事故），
    // 平台用 Taro.getEnv() 获取；版本号暂不注入（defineConstants 未配置），留空
    const platform = (Taro.getEnv() || 'WEAPP').toLowerCase();   // weapp / h5 / rn ...
    const appVersion = '';                                       // 构建时注入的版本号，缺失则留空
    const pages = Taro.getCurrentPages();
    const pagePath = pages.length ? pages[pages.length - 1].route || '' : ''; // 当前页面路径，便于后台定位
    return requestWithAuth({
      url: `${API_ROOT}/feedback/submit`,
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        content,
        contact,
        platform,
        appVersion,
        pagePath,
      },
    }).then((res) => res.data);
  } catch (e) {
    // 同步异常也转成 rejected promise，保证调用方 catch 能触发提示（避免"点了没反应"）
    console.error('submitFeedback 异常', e);
    return Promise.reject(e);
  }
};
export const getMyClass = () => {
  return requestWithAuth({
    url: API_ROOT + "/class/getMyClass",
    method: "GET",
  }).then((res) => res.data);
};
