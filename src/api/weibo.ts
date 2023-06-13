import Taro from "@tarojs/taro"

export const getStatus = (text, page, limit) => {
    return new Promise((resolve, reject) => {
      Taro.request({
        url: 'http://localhost:8080/weibo/getStatusList?text=' + text + "&page=" + page + "&limit=" + limit,
        method: "GET",
        success: (res) => {
          resolve(res.data.data);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }
  
export const getComments = (accessToken,id)=>{
    return new Promise((resolve, reject) => {
        Taro.request({
          url: 'http://localhost:8080/weibo/getComments',
          data:{
            "access_token": undefined
            ,"id": id
          },
          method: "GET",
          success: (res) => {
     
            
            resolve(res.data.data);
          },
          fail: (error) => {
            reject(error);
          }
        });
      });
    }


export const contribute = (url,text,mode)=>{
    console.log(url);
    
    if(url!=undefined)
    {
        console.log("has url");
        
        Taro.uploadFile({
            url:'http://localhost:8080/weibo/sendStatus',
            filePath: url,
            name: 'file',
            formData :{
                accessToken:null,
                'sessionId': Taro.getStorageSync("session_key"),
                'openid':Taro.getStorageSync("openid"),
                'text':text,
                'mode':mode
            }
        })
    }
    else
    {
        console.log("no url");
        
        Taro.request({
            url: 'http://localhost:8080/weibo/sendStatusForText',
            method: 'POST',
            header: {
              'content-type': 'application/json'
            },
            data: {
              accessToken: undefined,
              sessionId: Taro.getStorageSync("session_key"),
              openid: Taro.getStorageSync("openid"),
              text: text,
              mode: mode
            }
          })
          
    }
   

}