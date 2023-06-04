import Taro from "@tarojs/taro"




export const contribute = (url,text)=>{

    if(url!=undefined)
    {
        Taro.uploadFile({
            url:'http://localhost:8080/weibo/sendStatus',
            filePath: url,
            name: "file",
            formData :{
                'accessToken':"2.00Cr7AhCFlne1D50224d9dadjIQdBE",
                'sessionId': Taro.getStorageSync("session_key"),
                'openid':Taro.getStorageSync("openid"),
                'text':text
            }
        })
    }
    else
    {
        Taro.request({
            url:'http://localhost:8080/weibo/sendStatus',
            method: 'POST',
            data:{
                'accessToken':"2.00Cr7AhCFlne1D50224d9dadjIQdBE",
                'sessionId': Taro.getStorageSync("session_key"),
                'text':text,
            }
            
        })
    }
   

}