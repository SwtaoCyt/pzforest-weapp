<template>
  <nut-collapse v-model="activeNames" @change="onChange" :accordion="true">
    <nut-collapse-item
      v-for="item in StatusLists"
      :key="item.id"
      :title="item.text"
      :icon="Message"
      :name="item.id"
      :border="true"
    >
      <template v-slot:extra>
        <nut-row>
          <nut-col :span="12">
            <nut-cell
              title="评论数"
              :icon="Message"
              :desc="item.commentsCount"
            ></nut-cell>
            <!-- <div class="flex-content">评论数: {{ item.commentsCount }}</div> -->
          </nut-col>
          <nut-col :span="12">
            <!-- <div class="display: flex; align-items: center;">
              <Eye></Eye>
              &nbsp; 查看图片
            </div> -->
            <nut-cell
              title="图片"
              :desc="item.image ? '查看' : '无'"
              @click="
                item.image ? previewImage(item.image) : previewImage(null)
              "
            ></nut-cell>
          </nut-col>
        </nut-row>
      </template>
    </nut-collapse-item>
  </nut-collapse>
</template>
<script>
import { onMounted, reactive, toRefs } from 'vue';
import { getStatus, getComments } from "../api/weibo.ts";
import { IconFont } from '@nutui/nutui'
import { Message, Eye } from "@nutui/icons-vue-taro";
import Taro from "@tarojs/taro";
export default {
  components: {
    Message,
    Eye
  },
  setup () {
    onMounted(() => {
      getStatus(null, 0, 10)
        .then(data => {
          // 在这里处理返回的数据
          console.log(data);
          state.StatusLists = data;
        })
        .catch(error => {
          // 处理错误
          console.error(error);
        });




    });
    const activeNames = reactive("");
    const previewImage = (url) => {
      if (url === null) {
        console.log("no url");
        return
      }
      else
        Taro.previewImage({
          urls: [url.url],

        })
    }
    const onChange = (names) => {
      //   this.activeNames = names; // 更新展开的项
      getComments("", names).then(res => {
        console.log(res);
      })
      console.log('展开项：', names);
    }
    const state = reactive({
      StatusLists: null
    })
    return {
      Message,
      activeNames,
      ...toRefs(state),
      Eye,
      previewImage,
      onChange
    };
  }
}
</script>
