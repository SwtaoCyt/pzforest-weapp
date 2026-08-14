import Taro from "@tarojs/taro";
import { rejects } from "assert";
import { resolve } from "path";
import { encodeInp } from "../utils/encode"
import { log } from "console";

// https://pzforest.com
export const  API_ROOT="https://pzforest.com"
export const WS_ROOT ="wss://pzforest.com"

export const searchShopByPrefix = (prefix) => {
  const header = getHeader();

  
  return new Promise((resolve, reject) => {
    Taro.request({
      header: header,
      url: `${API_ROOT}/shop/getShopListByNameOrISBN`,
      method: "GET",
      data: {
        name:prefix
      },
      success: (res) => {
        console.log("searchShop");
        console.log(res);
        
        
        resolve(res.data);
      },
      fail: (res) => {
        reject(res.errMsg);
      }
    });
  });
};


export const getSuggestListByPrefix = (prefix) => {
  const header = getHeader();

  
  return new Promise((resolve, reject) => {
    Taro.request({
      header: header,
      url: `${API_ROOT}/shop/getSuggestList`,
      method: "GET",
      data: {
        prefix:prefix
      },
      success: (res) => {
        console.log("getSuggestList");
        console.log(res);
        
        
        resolve(res.data);
      },
      fail: (res) => {
        reject(res.errMsg);
      }
    });
  });
};

export const getChatHistoryByBuySell = (productId,senderId, receiverId) => {
  const header = getHeader();

  
  return new Promise((resolve, reject) => {
    Taro.request({
      header: header,
      url: `${API_ROOT}/shop/getChatHistory`,
      method: "GET",
      data: {
        productId: productId,
        senderId: senderId,
        receiverId: receiverId
      },
      success: (res) => {
        console.log("Resss");
        console.log(res);
        
        
        resolve(res.data);
      },
      fail: (res) => {
        reject(res.errMsg);
      }
    });
  });
};

export const getChatHistory = (productId, receiverId) => {
  const header = getHeader();
  const loginId = Taro.getStorageSync("loginId");
  
  return new Promise((resolve, reject) => {
    Taro.request({
      header: header,
      url: `${API_ROOT}/shop/getChatHistory`,
      method: "GET",
      data: {
        productId: productId,
        senderId: loginId,
        receiverId: receiverId
      },
      success: (res) => {
        resolve(res.data);
      },
      fail: (res) => {
        reject(res.errMsg);
      }
    });
  });
};


export const getWeChatHistory = (pageNum = 1, pageSize = 5) => {
  const header = getHeader();
  return new Promise((resolve, reject) => {
    Taro.request({
      header: header,
      url: `${API_ROOT}/shop/getWeChatHistory`,
      method: "GET",
      data: {
        pageNum,
        pageSize,
      },
      success: (res) => {
        resolve(res.data);
      },
      fail: (res) => {
        reject(res.errMsg);
      }
    });
  });
};

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
          data:{
            "token":Taro.getStorageSync("toekn")
          },
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
export const getShopsByPageAndOpenid = (pageNum = 1, pageSize = 10) => {
  var header = getHeader();
  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${API_ROOT}/shop/getShopsByPageAndOpenid`,
      method: 'GET',
      header:header,
      data: {
        pageNum,
        pageSize,
      },
      success: (res) => {
  
        resolve(res.data);
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
};


export const getShopsByPage = (pageNum = 1, pageSize = 10) => {
  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${API_ROOT}/shop/getShopsByPage`,
      method: 'GET',
      data: {
        pageNum,
        pageSize,
      },
      success: (res) => {
        resolve(res.data);
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
};

export const getClassVerifyCode = ()=>{
  return new Promise<string>((resolve,reject)=>{
    Taro.request({
      url:API_ROOT + "/class/getClassVerifyCode",
      method: "GET",
      data:{
        "token":Taro.getStorageSync("toekn")
      },
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

// 定义禁用店铺的接口方法
export const disableShopById = (id) => {
  const header = getHeader();
  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${API_ROOT}/shop/disable/${id}`,
      method: "DELETE",
      header: header,
      success: (res) => {
        resolve(res.data);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

// 根据ID获取商品
export const getShopById = (id) => {
  const header = getHeader();
  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${API_ROOT}/shop/getShopById?id=`+id,
      method: "GET",
      header: header,
      success: (res) => {
        
        var reuslt = res.data.shop
    
            reuslt.sellerName = res.data.user
        
  
        console.log(reuslt);
        
        resolve(reuslt);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};


export const uploadProduct = (remark, sellerOpenid, location, price, bookIsbn, productName, imageUrls,id) => {
  var header = getHeader();
  header['Content-Type'] = 'application/x-www-form-urlencoded'; // 设置内容类型
  console.log();
  
  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${API_ROOT}/shop/uploadProduct`,
      method: "POST",
      header: header,
      data: {
        remark: remark,
        seller_openid: sellerOpenid,
        location: location,
        price: price,
        book_isbn: bookIsbn,
        product_name: productName,
        image_urls: imageUrls,
        id:id
      },
      success: (res) => {
        resolve(res);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
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
