import Taro from "@tarojs/taro";

// https://pzforest.com
export const  API_ROOT="https://pzforest.com"
export const cleanCache = ()=>{
  const header = getHeader();
  const loginId = Taro.getStorageSync("loginId");
  Taro.removeStorageSync('myClass');
  Taro.removeStorageSync('myClassDate');
  return new Promise((resolve, reject) => {
    Taro.request({
      header: header,
      url: `${API_ROOT}/class/cleanCache`,
      method: "GET",
      data: {
      },
      success: (res) => {
        resolve(res.data);
      },
      fail: (res) => {
        reject(res.errMsg);
      }
    });
  });
}

export const getLoginId = ()=>{
  var header = getHeader();
  return new Promise<string>((resolve,reject)=>{
    const loginId = Taro.getStorageSync("loginId");
    if(!loginId || loginId.length==0)
      {
        Taro.request({
          header:header,
          url:API_ROOT + "/user/getLoginIdAsString",
          method: "GET",
          success:(res)=>{
            console.log(res);
            Taro.setStorageSync("loginId",res.data)
            resolve(res.data)
          },
          fail:(res)=>{
            reject(res.errMsg)
          }
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
  const apiRoot = process.env.API_ROOT || 'default-api-root';
  const debugMode = process.env.DEBUG || false;

  console.log('API 地址：', apiRoot);

  // 向 API 发送请求并处理响应
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

export const loginToStudy=(userName,passWord,verifyCode)=>{
  var header = getHeader()
  return new Promise((resolve,rejects)=>{
    const JSESSIONID =  Taro.getStorageSync("JSESSIONID");
    Taro.request({
      url: API_ROOT + "/class/loginToStudy",
      method:"POST",
      header:header,
      data:{
        userName:userName,
        passWord:passWord,
        RANDOMCODE:verifyCode,
        JSESSIONID:JSESSIONID,
      },
      success:(res)=>{
        resolve(res);
      }
    })
  })
}

export const test = () => {
  console.log("hello");
};

// 提交问题反馈
export const submitFeedback = (content: string, contact: string) => {
  const header = getHeader();
  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${API_ROOT}/feedback/submit`,
      method: 'POST',
      header: { ...header, 'content-type': 'application/json' },
      data: {
        openid: Taro.getStorageSync('loginId'),
        content,
        contact,
      },
      success: (res) => resolve(res.data),
      fail: (res) => reject(res.errMsg),
    });
  });
};
export const getMyClass = () => {
  var header = getHeader();
  return new Promise((resolve, reject) => {  // 修改为 reject
    Taro.request({
      url: API_ROOT + "/class/getMyClass",
      method: "GET",
      header: header,
      success: (res) => {
        resolve(res.data);
      },
      fail: (res) => {
        reject(res.errMsg);  // 修改为 reject
      }
    });
  });
};
