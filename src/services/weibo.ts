import Taro from "@tarojs/taro"
import {API_ROOT,requestWithAuth,uploadWithAuth} from "../services/api"
import { User } from "src/model/user";


export const createReply = (cid,id,comment)=>{
  return requestWithAuth({
    url: API_ROOT+"/weibo/reply",
    method:"POST",
    data:{
      "id": id,
      "cid":cid,
      "comment":comment
    },
  });
}

export const createComment = (id,comment)=>{
    return requestWithAuth({
      url: API_ROOT+ "/weibo/createComment",
      method: "POST",
      data:{
        "id": id,
        "comment":comment
      },
    });
}
export const changeUserName=(nikename :string)=>{
  return requestWithAuth({
    url: API_ROOT+'/user/changeUserName',
    method: "POST",
    data:{
      "nikename":nikename
    },
  }).then((res)=>{
    console.log(res);
    return res.data;
  });
}

export const getUser = (): Promise<User> => {
  return requestWithAuth({
    url: `${API_ROOT}/user/getUser`,
    method: 'POST',
  }).then((res) => {
    console.log(res);
    if (res.statusCode === 200 && res.data) {
      return res.data as User;
    }
    throw new Error('Failed to fetch user data');
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
    // 兜底空文本 + 编码，避免把 null / 特殊字符直接拼进 URL
    const safeText = encodeURIComponent((text || '').trim());
    return requestWithAuth({
      url:  API_ROOT + '/weibo/getStatusList?text=' + safeText + "&page=" + page + "&limit=" + limit,
      method: "GET",
    }).then((res) => {
      console.log(res.data.data);
      return res.data.data;
    });
  }
  /**
   * 根据贴文id获取评论
   * @param id 贴文id
   * @returns 
   */
export const getComments = (id)=>{
    return requestWithAuth({
      url:  API_ROOT +'/weibo/getComments',
      data:{
        "id": id
      },
      method: "GET",
    }).then((res) => {
      // 后端对空评论可能返回 null/空对象，统一规范成数组，
      // 避免前端把 null 当“未加载”，导致一直显示“评论加载中”
      const data = res.data && res.data.data;
      return Array.isArray(data) ? data : [];
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
            // uploadWithAuth 已处理 JSON 解析与 401 自动重登
            uploadWithAuth({
              url:  API_ROOT+'/weibo/sendStatus',
              filePath: url,
              name: 'file',
              formData: {
                text: text,
                mode: mode
              },
            }).then(resolve).catch((err) => {
              console.error(err);
              reject(err);
            });
          } else {
            console.log("no url");
            requestWithAuth({
              url: API_ROOT+ '/weibo/sendStatusForText',
              method: 'POST',
              header: {
                'content-type': 'application/json'
              },
              data: {
                text: text,
                mode: mode
              },
            }).then((res) => {
              console.log(res.data);
              resolve(res.data);
            }).catch((err) => {
              console.error(err);
              reject(err);
            });
          }
        });
      };
      
      
   

