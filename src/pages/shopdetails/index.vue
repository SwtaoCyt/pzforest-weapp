<template>
  <div class="shop-details">
    <div v-if="shop" class="shop-card">


      <div class="shop-header">

        <h2>{{ shop.productName }}</h2>
        <h2>用户: {{ shop.sellerName }}</h2>
        <nut-price :price="shop.price" position="after" symbol="RMB" class="shop-price" />
      </div>
     
       
    
  

      <nut-swiper :init-page="2" :auto-play="3000" pagination-visible pagination-color="#426543" pagination-unselected-color="#808080" class="shop-swiper">
        <nut-swiper-item v-for="(item, index) in shop.imageUrls.split(',')" :key="index" class="shop-swiper-item">
          <img :src="item" alt="商品图片" class="shop-image" @click="showPreviewNow(item)" />
        </nut-swiper-item>
      </nut-swiper>
      <p class="book-isbn">书名号: {{ shop.bookIsbn }}</p>
      <div class="shop-tags">
        <nut-tag v-for="(item, index) in shop.location.split(',')" :key="index" class="shop-tag">
          {{ item }}
        </nut-tag>
      </div>
      <div class="shop-remark">
        <nut-textarea readonly :model-value="shop.remark" />
      </div>
      <p class="shop-created-at">创建日期: {{ shop.createdAt }}</p>
      <div v-if="shop.sellerOpenid != Taro.getStorageSync('loginId')">
      <!-- <nut-button shape="square" type="primary" @click="triggerNotify('success','还没有空开发，再等一下')">申请交换联系方式</nut-button> -->
      <nut-button shape="square" type="info" @click="tryShowChatView(shop.id)">在线沟通</nut-button>
     </div>
     <div v-else>
      <nut-button shape="square" type="primary" @click="tryUpdateGoods()">编辑信息</nut-button>
      <nut-button shape="square" type="info">在线沟通</nut-button>
      <!-- <nut-button shape="square" type="info" color="#7232dd"  @click="triggerNotify('success','还没有空开发，再等一下')">查看请求</nut-button> -->
     </div>
    </div>

    <nut-popup v-model:visible="showChatView" :style="{ height: '80%' }" position="bottom">
      <div>
        
      
        <div v-for="(msg, index) in messages" :key="index" :class="{'right-message': isUserMessage(msg), 'left-message': !isUserMessage(msg)}">
          <p v-if="isUserMessage(msg)">{{ handleDate(msg.timestamp) }}&nbsp;我</p>
          <p v-else>对方 &nbsp;{{  handleDate(msg.timestamp) }}</p>
          <p>{{ msg.content }}</p>
        </div>

        <textarea v-model="message" placeholder="在这里输入信息" ></textarea>
        <nut-button @click="sendMessage" style="bottom: 0px;"  size="large"  type="info">发送</nut-button>
      </div>
    </nut-popup>
    <notify ref="notifyRef" />
  </div>


  <nut-popup v-model:visible="shopUpload" position="bottom" closeable round :style="{ height: '85%', }"  :model-value="formData">
    <nut-form  >
      <nut-form-item label="商品名" required style="padding-top: 10%;">
      <nut-input v-model="formData.name" placeholder="请输入商品名" type="text" />
    </nut-form-item>
    <nut-form>
    <nut-form-item label="商品品类">
      <nut-radio-group v-model="formData.radio" direction="horizontal" @change="changeGoodsType">
        <nut-radio label="1">生活用品</nut-radio>
        <nut-radio label="2">书</nut-radio>
      </nut-radio-group>
    </nut-form-item>


    <nut-form-item label="书名号" v-if="formData.radio === '2'">
      <nut-input v-model="formData.memo" placeholder="请输入书名号" type="text" />
    </nut-form-item>
  </nut-form>
  <nut-form-item label="详情">
    <nut-textarea v-model="formData.remarks"  limit-show :max-length="300" />
  </nut-form-item>
    <nut-form-item
      label="价格"
      prop="price"
      required
      :rules="[
        { required: true, message: '请填写价格' },
        { validator: customValidator, message: '必须输入数字' },
        { validator: customRulePropValidator, message: '必须输入数字', reg: /^\d+$/ },
        { regex: /^(\d{1,2}|1\d{2}|200)$/, message: '必须输入0-200区间' }
      ]"
    >
    <nut-input v-model="formData.price" placeholder="请输入价格" type="text" />
  </nut-form-item>

  <nut-form-item label="文件上传">
    <nut-uploader
      v-model:file-list="formData.defaultFileList"
      :url="uploadUrl"
      accept="image/*"
      maximum="3"
      multiple
      :headers="header"
      @success="handleUploadSuccess"
    >
    </nut-uploader>
  </nut-form-item>
  
  <nut-form-item label="活跃地址">
    <nut-checkbox-group v-model="formData.place">
      <nut-checkbox label="北区"> 北区 </nut-checkbox>
      <nut-checkbox label="中区"> 中区 </nut-checkbox>
      <nut-checkbox label="南区"> 南区</nut-checkbox>
      <nut-checkbox label="公寓"> 公寓 </nut-checkbox>
    </nut-checkbox-group>




  </nut-form-item>

  <nut-button size="large" type="primary" @click="uploadMyGoods">修改</nut-button>

    </nut-form>
 
  </nut-popup>
  
  
  <nut-popup v-model:visible="chatView" position="bottom" closeable round :style="{ height: '85%', }">

  </nut-popup>

  
</template>

<script setup lang="ts">
  // @ts-ignore
import notify from '../../components/notify.vue'
import { onMounted, ref } from 'vue';
import Taro from '@tarojs/taro';
import { getShopById, getChatHistory,API_ROOT,uploadProduct } from '../../services/api';
import connectWebSocket from '../../utils/connectWebSocket';
  // @ts-ignore
import { UploaderFileListItem } from '@nutui/nutui'
import { log } from 'console';
const shopUpload = ref(false)

const       uploadUrl= API_ROOT + "/shop/uploadPicture"  // 动态绑定 URL
const message = ref('');
const messages = ref([]);
const formData = ref({
    id:0,
    remarks:"",
    place:[],
    defaultFileList: [] as UploaderFileListItem[],
    imageList:[] as UploaderFileListItem[],
    radio: '1',
    price:0,
    name:"",
    memo:"",
  })
let socketTask;

const tryUpdateGoods = ()=>{
  console.log(shop);
    // @ts-ignore
  formData.value.id = shop.value.id
    // @ts-ignore
  formData.value.price =shop.value.price
    // @ts-ignore
  formData.value.name = shop.value.productName
    // @ts-ignore
  formData.value.memo  = shop.value.bookIsbn
    // @ts-ignore
  formData.value.remarks  = shop.value.remark
  // formData.value.place = shop.value.location
  shopUpload.value=true;
  
}
const notifyRef  =ref(null);
const triggerNotify = (notifyClass,str) => {
  if (notifyRef.value) {
    // @ts-ignore
    notifyRef.value.show({ type: notifyClass, desc: str });
  }
};
const sellerOpenid = ref('');
const showChatView = ref(false);
const shop = ref(null)
const uploadMyGoods = ()=>{

  const imagelist = formData.value.imageList.join(",")

  if(formData.value.name==null ||formData.value.name==undefined)
  {
    return triggerNotify('danger',"请输入商品名")
  }
  if(formData.value.price==0)
  {
    return triggerNotify('danger',"请输入价格")
  }
 
 
  uploadProduct(formData.value.remarks,"",formData.value.place,formData.value.price,formData.value.memo,formData.value.name,imagelist,formData.value.id).then(res=>{
    console.log(res);
    if(res.data.code>400)
    {
      triggerNotify('danger',res.data.message)
    }
    if(res.data.code>200 && res.data.code<300)
    {
      triggerNotify('success',res.data.message)
    }
    shopUpload.value= false
    formData.value
  })
}
const tryShowChatView = async (id) => {
  showChatView.value = true;
  await fetchChatHistory(id, sellerOpenid.value);
  connectWebSocket(id, sellerOpenid.value)
    .then((task) => {
      socketTask = task;
      console.log(socketTask);
      socketTask.onOpen(() => {
        console.log('WebSocket connected');
      });
      socketTask.onMessage((event) => {
        console.log('Received message:', event.data);
        const receivedMessage = JSON.parse(event.data);
        messages.value.push(receivedMessage);
      });
      socketTask.onError((err) => {
        console.error('WebSocket error', err);
      });
      socketTask.onClose(() => {
        console.log('WebSocket closed');
      });
    })
    .catch((err) => {
      console.error('Failed to connect WebSocket', err);
    });
};
const handleDate=(timestamp)=>
{
  if(timestamp== null || timestamp==undefined)
  {
    return new Date().getDate()
  }
  const date = new Date(timestamp);
   // 格式化日期和时间
   const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份从 0 开始，所以需要 +1
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    // 组合成你想要的格式
    const formattedDateStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // 设置格式化后的日期
    return formattedDateStr
}
const fetchChatHistory = async (id, receiverId) => {
  try {
    const chatHistory = await getChatHistory(id, receiverId);
    messages.value = chatHistory;
    console.log(message);
    
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
  }
};

const sendMessage = () => {
  if (message.value.trim()) {
    socketTask.send({
      data: JSON.stringify({ content: message.value, messageType: 'buyer' }) // Replace 'buyer' with actual user type
    });
    message.value = '';
  }
};
const handleUploadSuccess = (response: any) => {
      // 假设后端返回的文件链接在 response.data.url
      console.log();
      
      
      // 确保 formData.value.defaultFileList 是数组
      if (!Array.isArray(formData.value.imageList)) {
        formData.value.imageList = [];
      }
      console.log(formData.value);
      
      formData.value.imageList.push( response.data.data);
      console.log(formData.value.imageList);
      
    };
const imageUrl = ref([]);

const showPreview = ref(false);
const hideFn = () => {
  showPreview.value = false;
};
const showPreviewNow = (index) => {
  imageUrl.value.push({ src: index });
  showPreview.value = true;
};
const fetchShop = async (id) => {
  try {
    const res = await getShopById(id);
    shop.value = res;
    sellerOpenid.value = res.sellerOpenid;
    console.log("???");
    
    console.log(shop.value);
    
  } catch (error) {
    console.error('Failed to fetch shop:', error);
  }
};
const isUserMessage = (msg) => {
  
  const loginId = Taro.getStorageSync("loginId");
  if(msg.senderId === loginId){
   if(msg.messageType==="buyer")
  {
    return true
  }
  else
  {
    return false
  }
   
  }
  return true;
};

onMounted(() => {
  const instance = Taro.getCurrentInstance();
  const id = instance.router.params.id;
  fetchShop(id);
});
</script>

<style scoped>
/* 样式保持不变 */
</style>

  <style>
  .btn-upload {
    width: 100%;
    height: 80px;
    background: linear-gradient(to right, #ff6034, #ee0a24);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-manage {
    width: 100%;
    height: 80px;
    background: linear-gradient(to right, #00b09b, #96c93d);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .container {
  position: relative;
  min-height: 100vh;
  padding-bottom: 60px;
}

.pagination {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: #fff;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 10px 0;
  width: fit-content;
  text-align: center;  /* Ensure pagination is centered */
}
.card-tag-list {
  margin: 20px 0 1px;
  height: 15px;
  overflow: hidden;
}
.card-tag-list > .tag {
  float: left;
  padding: 0 5px;
  font-size: 10px;
  height: 15px;
  line-height: 15px;
  color: #999;
  background-color: #f2f2f7;
  margin-right: 5px;
}
html, body, #app, .shop-details {
  height: 100%;
}

.shop-details {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5;
  height: 20%; /* 调整页面高度为20% */
}

.shop-card {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-width: 800px;
  width: 100%;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.shop-header h2 {
  margin: 0;
  font-size: 28px; /* 增大字体 */
  color: #333;
}

.book-isbn {
  font-size: 25px; /* 增大字体 */
  color: #888;
  text-align: left; /* 居左 */
}

.shop-swiper {
  margin-bottom: 20px;
}

.shop-swiper-item {
  height: 250px; /* 增加高度 */
}

.shop-image {
  height: 100%;
  width: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.shop-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.shop-tag {
  background-color: #FA685D;
  color: #ffffff;
}

.shop-price {
  font-size: 24px; /* 增大字体 */
  color: #fa685d;
}

.shop-remark {
  margin-bottom: 20px;
}

.shop-created-at {
  font-size: 16px; /* 增大字体 */
  color: #888;
  text-align: left; /* 居左 */
}
.right-message {
  text-align: right;
  background-color: #dcf8c6;
  padding: 20px;
  border-radius: 10px;
  margin: 5px 0;
  align-self: flex-end;
}

.left-message {
  text-align: left;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  margin: 5px 0;
  align-self: flex-start;
}
  </style>