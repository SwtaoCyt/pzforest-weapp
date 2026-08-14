<template>



          <nut-searchbar v-model="search.searchText"  @search="searchShop(search.searchText)" @change="getSuggestList"  >
  
            <template #rightin>
              <Search2 />
            </template>
          </nut-searchbar>
      
          <p v-for="(suggestion,index) in search.suggestList" :key="index" style="padding: 20px" @click="searchShop(suggestion)">

            {{  suggestion }}
          </p>

   

   
    <!-- <div v-if="showSuggestions" class="suggestions">
      <ul>
        <li v-for="(suggestion, index) in filteredSuggestions" :key="index" @click="selectSuggestion(suggestion)">
          {{ suggestion }}
        </li>
      </ul>
    </div> -->
    <nut-row>
    <nut-col :span="12">
      <div class="content"> <nut-button size="large" type="primary" color="linear-gradient(to right, #ff6034, #ee0a24)" class="btn-upload" shape="square" @click="uploadGoods(undefined)">上架</nut-button></div>
    </nut-col>
    <nut-col :span="12">
  <div class="content"> <nut-button size="large" type="success" color="linear-gradient(to right, #00b09b, #96c93d);" class="btn-manage" shape="square" @click="manageGoods()">管理</nut-button></div>
    </nut-col>
  </nut-row>
  <nut-row>
    <nut-col :span="12">
      <div class="content"> <nut-button size="large" type="primary" color="linear-gradient(to right, #00c6ff, #0072ff)" class="btn-upload" shape="square" @click="checkMyTalk()">沟通历史</nut-button></div>
    </nut-col>
    <nut-col :span="12">
  <div class="content"> <nut-button size="large" type="success" color="linear-gradient(to right, #ff7e5f, #feb47b)" class="btn-manage" shape="square" >这个按钮还没想好干嘛</nut-button></div>
    </nut-col>
  </nut-row>

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

  <nut-button size="large" type="primary" @click="uploadMyGoods">上架</nut-button>

    </nut-form>
 
  </nut-popup>
  <notify ref="notifyRef"></notify>

  <view class="container" style="padding-top: 20px;">
    <nut-card
      v-for="shop in shops"
      :key="shop.id"
      :img-url="shop.imageUrls.split(',')[0]"  
      :title="shop.productName"
      :price="shop.price.toString()"
       :vip-price="shop.price.toString()"
      :shop-desc="'闲置'"
      :shop-name="shop.bookIsbn"
      @click="Taro.navigateTo({url:'/pages/shopdetails/index?id='+ shop.id})"
    >
    <template #prolist>
      <div class="card-tag-list">
          <span class="tag" v-for="(tag, index) in shop.location.split(',')" :key="index">{{ tag }}</span>
        </div>
    </template></nut-card>
    <nut-pagination
    mode="simple"
      :total-items="totalItems"
      :page-size="maxPage"
      :page-count="pagecount"
      v-model="currentPage"
      class="pagination"
      @change="handlePageChange"
    />
  </view>
  
   <!-- 侧边视图 -->
  <nut-popup v-model:visible="rightView" position="right" style="width: 90%; height: 100%">
    <view v-for="shop in myGoodsList" :key="shop.id">
    <nut-card
      
      
      :img-url="shop.imageUrls.split(',')[0]"  
      :title="shop.productName"
      :price="shop.price.toString()"
       :vip-price="shop.price.toString()"
      :shop-desc="'闲置'"
      :shop-name="shop.bookIsbn"
      @click="Taro.navigateTo({url:'/pages/shopdetails/index?id='+ shop.id})"
    >
    
  </nut-card>
  <nut-row>
    <nut-col :span="12">
      <div class="content"> <nut-button size="large" type="primary" color="linear-gradient(to right, #ff6034, #ee0a24)" class="btn-upload" shape="square" @click="uploadGoods(shop)">修改</nut-button></div>
    </nut-col>
    <nut-col :span="12">
  <div class="content"> <nut-button size="large" type="success" color="linear-gradient(to right, #00b09b, #96c93d);" class="btn-manage" shape="square" @click="cancelGoods(shop.id)">下架</nut-button></div>
    </nut-col>
   </nut-row>
</view>
  <nut-pagination v-model="rightViewPage" :page-count="rightViewMaxPage" mode="simple" @change="changeRightView" style="padding-left: 15%" />
  </nut-popup>


  <nut-dialog content="确认要下架该商品吗？" v-model:visible="cancelConfirm"  @ok="confirmCancel(cancelId)" />

  <!-- 左视图 -->
  <nut-popup v-model:visible="showLeft" position="left" :style="{ width: '90%', height: '100%' }">


    <view class="container" style="padding-top: 20px;">
      <div v-for="shop in shopWeChat" :key="shop.id">
        <div v-if="shop.sellerOpenid ==  openid"> <nut-cell title="我是卖家" ></nut-cell></div>
        <div v-else> <nut-cell title="我是买家"></nut-cell> </div>
    <nut-card
      :img-url="shop.imageUrls.split(',')[0]"  
      :title="shop.productName"
      :price="shop.price.toString()"
       :vip-price="shop.price.toString()"
      :shop-desc="'闲置'"
      :shop-name="shop.bookIsbn"
      @click="tryShowChatView(shop.id,shop.buyerOpenid,shop.sellerOpenid)"
    >
    <template #prolist>
      <div class="card-tag-list">
          <span class="tag" v-for="(tag, index) in shop.location.split(',')" :key="index">{{ tag }}</span>
        </div>
    </template></nut-card></div>
 
  </view>


  <nut-pagination
    mode="simple"
      :total-items="leftItem.totalItems"
      :page-size="leftItem.maxPage"
      :page-count="leftItem.pagecount"
      v-model="leftItem.currentPage"
      class="pagination"
      @change="handleLeftPageChange"
    />
  </nut-popup>


  <nut-popup v-model:visible="showChatView" :style="{ height: '80%' }" position="bottom" @close="closeTask()">
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



  
</template>

  <script setup lang="ts">
  // @ts-ignore
import notify from '../../components/notify.vue'
  import { onMounted, reactive, ref } from 'vue'
  import Taro from '@tarojs/taro';
  import { navigateTo } from '../../router/index'
  import { Search2 } from '@nutui/icons-vue-taro'

  // @ts-ignore
import { Uploader,Minus} from '@nutui/icons-vue-taro'
  import { API_ROOT,getHeader,uploadProduct,getShopsByPage,getShopsByPageAndOpenid ,disableShopById,getLoginId,getWeChatHistory,getChatHistory,getChatHistoryByBuySell,searchShopByPrefix,getSuggestListByPrefix } from "../../services/api"
import { UploaderFileListItem } from '@nutui/nutui'
import connectWebSocket from '../../utils/connectWebSocket';
import { Shop } from '@/model/shopAndUser';


const searchShop=(prefix)=>{
  search.suggestList = null
  searchShopByPrefix(prefix).then(res=>{
    shops.value  =res
  })
}

const getSuggestList = async (prefix) => {
  if (prefix.length >= 3) {
    try {
      const res = await getSuggestListByPrefix(prefix);
      console.log(res);

     
      search.suggestList = res
      console.log(search.suggestList);
      search.suggestListShow = true;
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }
  else
  {
    search.suggestList= null
  }
};

const closeTask=()=>{
  console.log("closeNow");
  Taro.closeSocket()
}
const sendMessage = () => {
  if (message.value.trim()) {
    socketTask.send({
      data: JSON.stringify({ content: message.value, messageType: 'buyer' }) // Replace 'buyer' with actual user type
    });
    message.value = '';
  }
};
    const message =ref("")
    const messages = ref([]);
    const rightViewPage =ref(1)
    const rightViewMaxPage=ref(0)
    const rightView = ref(false)
    const cancelConfirm = ref(false)
    const cancelId=ref(0)
    const showLeft = ref(false)
    const shopWeChat= ref<Shop[]>([])
    const openid =ref('')
    const showChatView = ref(false);
    let socketTask;
    const fetchChatHistory = async (id,senderId, receiverId) => {
  try {
    const chatHistory = await getChatHistoryByBuySell(id,senderId, receiverId);
    console.log("history");
    console.log(chatHistory);
    
    
    messages.value = chatHistory;
    console.log(message);
    
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
  }
};

    const tryShowChatView = async (id,buyerOpenid,sellerOpenid) => {
      
  showChatView.value = true;
  await fetchChatHistory(id,buyerOpenid, sellerOpenid);
  connectWebSocket(id, sellerOpenid)
    .then((task) => {
      socketTask = task;
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
const handleDate = (timestamp) => {
  let date;
  
  if (timestamp == null || timestamp == undefined) {
    date = new Date();  // 使用当前时间
  } else {
    date = new Date(timestamp);
  }

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
  return formattedDateStr;
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

    const checkMyTalk= ()=>{
      showLeft.value =true
      getWeChatHistory().then(res=>{
   
   
        for(var i=0;i<=res.shops.length-1;i++)
        {   
         
          
          res.shops[i].buyerOpenid =res.pages.records[i].senderId
          
        }
        console.log(res.shops);
        
        shopWeChat.value  = res.shops as Shop[];      
      
     
        
      })
    }
    const confirmCancel= (id)=>
    {
      disableShopById(id).then(
        res=>
        {
          if(res.code==200)
          {
            triggerNotify('success',res.message)
          }
        }
        
      )
      rightView.value=false
    }
    const cancelGoods =(id)=>{
      console.log("id");
      
      console.log(id);
      
      cancelId.value = id;
      cancelConfirm.value=true
    }
    const changeRightView = (page)=>{
      rightViewPage.value = page
      getShopsByPageAndOpenid(page,10).then(
        res=>{
          console.log(res);
          myGoodsList.value = res.records
          console.log(myGoodsList.value );
          rightViewMaxPage.value =res.pages
         
        }
      )
    }
    const manageGoods = ()=>{
      getShopsByPageAndOpenid().then(
        res=>{
          console.log(res);
          myGoodsList.value = res.records
          console.log(myGoodsList.value );
          rightViewMaxPage.value =res.pages
         
        }
      )
      rightView.value =true
    }

    const myGoodsList = ref()
    const viewShopDetails = (shop) => {
      checkMyTalk()
        };
    const shops = ref([]);
    const totalItems = ref(0);
    const leftItem = reactive(
      {
        totalItems:0,
        maxPage:0,
        pagecount:0,
        currentPage:1
      }
    )
    const pageSize = ref(10);
    const maxPage = ref(10)
    const currentPage = ref(1);
    const pagecount  = ref(0)
    const fetchShops = async (pageNum, pageSize) => {
      try {
        const res = await getShopsByPage(pageNum, pageSize);
        console.log(res);
        
        maxPage.value  =res.size
        shops.value = res.records; // 假设返回的数据中包含记录
        totalItems.value = res.total; // 假设返回的数据中包含总条数
      } catch (err) {
        console.error('Failed to fetch shops:', err);
      }
    };


    
    const handlePageChange = (page) => {

      currentPage.value = page;
      fetchShops(page, pageSize.value);
    };


    const fetchLeftShops = async (pageNum, pageSize) => {
      try {
        const res = await getWeChatHistory(pageNum, pageSize);
        leftItem.maxPage  =res.pages.size
        shopWeChat.value  = res.shops as Shop[]; // 假设返回的数据中包含记录
        
        
        leftItem.totalItems = res.pages.total; // 假设返回的数据中包含总条数

        
      } catch (err) {
        console.error('Failed to fetch shops:', err);
      }
    };

    const handleLeftPageChange = (page) => {
      console.log("当前页:"+page);
      
      leftItem.currentPage = page;
      fetchLeftShops(page, pageSize.value);
      };
      onMounted(()=>{
    header= getHeader
        getLoginId().then(res=>{
          openid.value = res
        })
    fetchShops(currentPage.value, pageSize.value)
    fetchLeftShops(1,10)
    })


const uploadMyGoods = ()=>{
  console.log(formData.value.imageList.join(","));
  const imagelist = formData.value.imageList.join(",")
  console.log("imagelist:"+ imagelist);
  
  if(formData.value.name==null ||formData.value.name==undefined)
  {
    return triggerNotify('danger',"请输入商品名")
  }
  if(formData.value.price==0)
  {
    return triggerNotify('danger',"请输入价格")
  }
 if( formData.value.id === undefined)
 {
  uploadProduct(formData.value.remarks,"",formData.value.place,formData.value.price,formData.value.memo,formData.value.name,imagelist,"").then(res=>{
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
   
  })
 }else{
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
   
  })
 }
  
 
}
const search = reactive({
  searchText:"",
  prefix:"",
  suggestList:[],
  suggestListShow:false
})
  var header ={}
const       uploadUrl= API_ROOT + "/shop/uploadPicture"  // 动态绑定 URL
  // import { computed } from 'vue';
  // 函数校验
const customValidator = (val) => {
  if (/^\d+$/.test(val)) {
    return Promise.resolve()
  } else {
    return Promise.reject('必须输入数字')
  }
}

// 处理 tab 点击事件


const changeGoodsType = (newVal) => {
  console.log('选中的商品品类:', newVal);
};
const customRulePropValidator = (val, rule) => {
  if (rule.reg.test(val)) {
    return Promise.resolve()
  } else {
    return Promise.reject('必须输入数字')
  }
}
  const val = ref('')
  const formData = ref({
    id:undefined,
    remarks:"",
    place:[],
    defaultFileList: [] as UploaderFileListItem[],
    imageList:[] as UploaderFileListItem[],
    radio: '1',
    price:0,
    name:"",
    memo:"",
  })
  const notifyRef  =ref(null);
  /**
 * 触发提醒
 * @param notifyClass 
 */
const triggerNotify = (notifyClass,str) => {
  if (notifyRef.value) {
    // @ts-ignore
    notifyRef.value.show({ type: notifyClass, desc: str });
  }
};
  const shopUpload = ref(false)
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
  const uploadGoods=(shop)=>{
    if(shop!=undefined)
    {
      console.log(shop);
    console.log(formData)
    formData.value.id= shop.id
    formData.value.remarks = shop.remark
    formData.value.price = shop.price
    formData.value.memo = shop.bookIsbn
    formData.value.name = shop.productName
    
    }
    shopUpload.value= true
  }
  </script>
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