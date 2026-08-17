import Taro from "@tarojs/taro"
import {API_ROOT,getHeader} from "../services/api"
import { User } from "src/model/user";


export const createReply = (cid,id,comment)=>{
  
    return new Promise((resolve,reject)=>{
        Taro.request({
          header:getHeader(),
            url: API_ROOT+"/weibo/reply",
            method:"POST",
            data:{
                "access_token": undefined,
                "id": id,
                "cid":cid,
                "openid": Taro.getStorageSync("loginId"),
                "comment":comment
            },
            success:(res)=>{
                resolve(res)
            }
            ,fail:(res)=>{
                reject(res)
            }
        })
    })
}

export const createComment = (id,comment)=>{
    return new Promise((resolve,reject)=>{
        Taro.request({
          header:getHeader(),
            url: API_ROOT+ "/weibo/createComment",
            method: "POST",
            data:{
                "access_token": undefined,
                "id": id,
                "openid": Taro.getStorageSync("loginId"),
                "comment":comment
            },
            success:(res)=>{
                resolve(res)
            }
            ,fail:(res)=>{
                reject(res)
            }
        })
    })
}
export const changeUserName=(nikename :string)=>{
  return new Promise((resolve, reject) => {
      Taro.request({
        header:getHeader(),
        url: API_ROOT+'/user/changeUserName',
        method: "POST",
        data:{
          "nikename":nikename
        },
        success: (res) => {
          console.log(res);
          
          resolve(res.data);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
}

export const getUser = (): Promise<User> => {
  return new Promise<User>((resolve, reject) => {
    Taro.request({
      header: getHeader(),
      url: `${API_ROOT}/user/getUser`,
      method: 'POST',
      success: (res) => {
        console.log(res);
        if (res.statusCode === 200 && res.data) {
          resolve(res.data as User);
        } else {
          reject(new Error('Failed to fetch user data'));
        }
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
};
/**
 * 获取微博内容1
 * @param text 
 * @param page 页数
 * @param limit 每页
 * @returns 
 */
export const getStatus = (text, page, limit) => {
    return new Promise((resolve, reject) => {
      // 兜底空文本 + 编码，避免把 null / 特殊字符直接拼进 URL
      const safeText = encodeURIComponent((text || '').trim());
      Taro.request({
        header:getHeader(),
        url:  API_ROOT + '/weibo/getStatusList?text=' + safeText + "&page=" + page + "&limit=" + limit,
        method: "GET",
        success: (res) => {
            console.log(res.data.data);
            
          resolve(res.data.data);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }
  /**
   * 根据贴文id获取评论
   * @param accessToken 暂未启用 
   * @param id 贴文id
   * @returns 
   */
export const getComments = (accessToken,id)=>{
    return new Promise((resolve, reject) => {
        Taro.request({
          header:getHeader(),
          url:  API_ROOT +'/weibo/getComments',
          data:{
            "access_token": undefined
            ,"id": id
          },
          method: "GET",
          success: (res) => {
            // 后端对空评论可能返回 null/空对象，统一规范成数组，
            // 避免前端把 null 当“未加载”，导致一直显示“评论加载中”
            const data = res.data && res.data.data;
            resolve(Array.isArray(data) ? data : []);
          },
          fail: (error) => {
            reject(error);
          }
        });
      });
    }

/**
 * 投稿
 * @param url 图片的本地位置
 * @param text 投稿的文本
 * @param mode 投稿类型
 * @returns 
 */
    export const contribute = (url, text, mode) => {
        return new Promise((resolve, reject) => {
          console.log(url);
      
          if (url !== undefined) {
            console.log("has url");
      
            Taro.uploadFile({
              header:getHeader(),
              url:  API_ROOT+'/weibo/sendStatus',
              filePath: url,
              name: 'file',
              formData: {
                accessToken: null,
                sessionId: Taro.getStorageSync("session_key"),
                openid: Taro.getStorageSync("loginId"),
                text: text,
                mode: mode
              },
              success: (res) => {
                console.log(res.data);
                // uploadFile 的 res.data 是字符串（响应原文），需手动 JSON 解析成对象，
                // 否则上层 handleUploadResult 读不到 res.code / res.message
                let data = res.data;
                if (typeof data === 'string') {
                  try {
                    data = JSON.parse(data);
                  } catch (e) {
                    data = res.data;
                  }
                }
                resolve(data); // Resolve with the response data
              },
              fail: (err) => {
                console.error(err);
                reject(err); // Reject with the error object
              }
            });
          } else {
            console.log("no url");
      
            Taro.request({
              
              url: API_ROOT+ '/weibo/sendStatusForText',
              method: 'POST',
              header: {
                ...getHeader(),
                'content-type': 'application/json'
              },
              data: {
                accessToken: undefined,
                sessionId: Taro.getStorageSync("session_key"),
                openid: Taro.getStorageSync("loginId"),
                text: text,
                mode: mode
              },
              success: (res) => {
                console.log(res.data);
                resolve(res.data); // Resolve with the response data
              },
              fail: (err) => {
                console.error(err);
                reject(err); // Reject with the error object
              }
            });
          }
        });
      };
      
      
   

