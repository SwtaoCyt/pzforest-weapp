<template>
  <view class="feed">
    <!-- 搜索 -->
    <view class="feed__search">
      <nut-searchbar
        v-model="searchValue"
        background="linear-gradient(135deg, #5b7cfa, #8b5cf6)"
        input-background="#fff"
        placeholder="搜索校园动态"
        @search="search"
        @change="onSearchInput"
        @clear="onSearchClear"
      />
    </view>

    <!-- 动态列表 -->
    <nut-collapse v-model="activeNames.value" @change="onChange" :accordion="true">
      <nut-collapse-item
        v-for="item in StatusLists"
        :key="item.id"
        :name="item.id"
        :border="true"
      >
        <!-- 标题：帖子内容 + 元信息 -->
        <template v-slot:title>
          <view class="post">
            <view class="post__text">{{ item.text }}</view>
            <view class="post__meta">
              <text class="post__time">{{ formatTimeAgo(item.createTime) }}</text>
              <text class="post__count">评论 {{ item.commentsCount }}</text>
              <text v-if="item.image" class="post__img" @click.stop="previewImage(item.image)">查看图片</text>
            </view>
          </view>
        </template>

        <!-- 评论区 -->
        <view class="comments">
          <view v-if="commentsList[item.id] && commentsList[item.id].length" class="comments__list">
            <view
              v-for="comment in commentsList[item.id]"
              :key="comment.id"
              class="comment"
              @click="wantReply(comment.id, item.id, comment.text)"
            >
              <view class="comment__head">
                <text class="comment__name">{{ comment.name }}</text>
                <text class="comment__time">{{ formatTimeAgo(comment.createdAt) }}</text>
              </view>
              <text class="comment__text">{{ comment.text }}</text>
            </view>
          </view>
          <view v-else class="comments__empty">
            {{ commentsList[item.id] ? '还没有评论，快来抢沙发～' : '评论加载中…' }}
          </view>

          <view class="comments__input">
            <view class="comments__field">
              <nut-input v-model="commentValue" placeholder="说点什么…" :border="false" />
            </view>
            <nut-button size="small" type="primary" class="comments__send" @click="Comment(item.id, commentValue)">发送</nut-button>
          </view>
        </view>
      </nut-collapse-item>
    </nut-collapse>

    <view class="feed__pagination">
      <nut-pagination
        v-model="currentPage1"
        :page-count="maxpage"
        mode="multi"
        prev-text="‹"
        next-text="›"
        @change="pageChange"
      />
    </view>

    <!-- 回复弹窗 -->
    <nut-popup
      position="bottom"
      :style="{ height: '40%' }"
      :round="true"
      v-model:visible="showCommentpop"
      :closeable="true"
    >
      <view class="reply">
        <view class="reply__origin">{{ replyState.state.text }}</view>
        <view class="reply__field">
          <nut-input v-model="replyState.state.comment" placeholder="写下你的回复…" :border="false" />
        </view>
        <nut-button block type="primary" class="reply__send" @click="reply(replyState.state)">回复</nut-button>
      </view>
    </nut-popup>

    <nut-notify :key="notifyKey" v-model:visible="notifyshow" :msg="notifydesc" type="success" />
  </view>
</template>

<script>
import { onMounted, reactive, toRefs, nextTick } from 'vue';
import { getStatus, getComments, createComment, createReply } from "../services/weibo";
import { Message, Eye, Comment } from "@nutui/icons-vue-taro";
import Taro from "@tarojs/taro";

let searchTimer = null;

export default {
  components: {
    Message,
    Eye,
    Comment
  },
  setup () {
    const state = reactive({
      maxpage: 0,
      StatusLists: null,
      commentsList: {},
      showCommentpop: false,
      currentPage1: 1,
      searchValue: null,
      commentValue: "",
      notifyshow: false,
      notifydesc: "",
      notifyKey: 0
    });

    const replyState = {
      state: reactive({
        text: "",
        comment: "",
        cid: "",
        id: ""
      })
    };

    const fetchStatus = (text, page) => {
      getStatus(text, page, 10)
        .then(data => {
          state.StatusLists = data.statuses;
          state.maxpage = Math.ceil(data.count / 10);
        })
        .catch(error => {
          console.error(error);
        });
    };

    onMounted(() => {
      fetchStatus(null, 0);
    });

    const reply = async (replyData) => {
      let cid = replyData.cid;
      let id = replyData.id;
      let comment = replyData.comment;
      await createReply(cid, id, comment).then((res) => {
        state.showCommentpop = false;
        showNotify("回复成功");
      });
    };

    const search = (content) => {
      state.searchValue = content;
      state.currentPage1 = 1;
      fetchStatus(content || "", 0);
    };

    // 输入防抖，边输边搜，体验更平滑
    const onSearchInput = (value) => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.currentPage1 = 1;
        fetchStatus(value || "", 0);
      }, 300);
    };

    const onSearchClear = () => {
      if (searchTimer) clearTimeout(searchTimer);
      state.searchValue = "";
      state.currentPage1 = 1;
      fetchStatus("", 0);
    };

    const Comment = (id, content) => {
      createComment(id, content).then((res) => {
        showNotify("评论成功！");
        state.commentValue = "";
        // 评论成功后立刻刷新该帖评论，让新评论即时出现
        getComments("", id).then(res => {
          state.commentsList[id] = res;
        });
      });
    };

    // 通知统一走这里：先关再开（并重建组件清除旧计时器），保证连续触发也能弹出
    const showNotify = (desc) => {
      state.notifydesc = desc;
      state.notifyshow = false;
      state.notifyKey += 1;
      nextTick(() => {
        state.notifyshow = true;
      });
    };

    const wantReply = (cid, id, content) => {
      state.showCommentpop = true;
      replyState.state.cid = cid;
      replyState.state.id = id;
      replyState.state.text = content;
    };

    const activeNames = reactive(
      {
        value: ""
      }
    );

    const previewImage = (url) => {
      if (url === null) {
        return;
      }
      else
        Taro.previewImage({
          urls: [url.url],
        });
    };

    const formatTimeAgo = (time) => {
      if (!time) return '';
      const createTime = new Date(time);
      if (isNaN(createTime.getTime())) return '';

      const now = new Date();
      const timeDiff = now - createTime;

      const minutes = Math.floor(timeDiff / (1000 * 60));
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (days > 0) {
        return days + '天前';
      } else if (hours > 0) {
        return hours + '小时前';
      } else {
        return minutes + '分钟前';
      }
    };

    const onChange = (names) => {
      activeNames.value = names;
      if (names != null && names !== "" && state.commentsList[names] == null) {
        getComments("", names).then(res => {
          state.commentsList[names] = res;
        });
      }
    };

    const pageChange = (value) => {
      state.currentPage1 = value;
      fetchStatus(state.searchValue, (value - 1) * 10);
    };

    return {
      Message,
      Eye,
      activeNames,
      ...toRefs(state),
      wantReply,
      previewImage,
      onChange,
      formatTimeAgo,
      Comment,
      pageChange,
      search,
      onSearchInput,
      onSearchClear,
      replyState,
      reply
    };
  }
}
</script>

<style>
.feed {
  width: 100%;
}

/* 搜索栏 */
.feed__search {
  margin-bottom: 24px;
}

.feed__search .nut-searchbar {
  border-radius: 24px;
  box-shadow: 0 8px 20px rgba(91, 124, 250, 0.18);
}

/* 动态卡片 */
.feed .nut-collapse-item {
  background: #fff;
  border-radius: 20px;
  margin-bottom: 20px;
  overflow: hidden;
}

/* 帖子标题 */
.post {
  width: 100%;
}

.post__text {
  font-size: 30px;
  color: #2b3245;
  line-height: 1.5;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.post__meta {
  display: flex;
  align-items: center;
  margin-top: 14px;
  font-size: 22px;
  color: #9aa5b8;
}

.post__time {
  margin-right: 24px;
}

.post__count {
  margin-right: 24px;
}

.post__img {
  color: #5b7cfa;
}

/* 评论区 */
.comments {
  padding-top: 8px;
}

.comment {
  padding: 20px 0;
  border-bottom: 2px solid #f0f2f5;
}

.comment:last-child {
  border-bottom: none;
}

.comment__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment__name {
  font-size: 26px;
  font-weight: 600;
  color: #4a5264;
}

.comment__time {
  font-size: 22px;
  color: #9aa5b8;
}

.comment__text {
  display: block;
  font-size: 28px;
  color: #3a4152;
  line-height: 1.5;
  word-break: break-all;
}

.comments__empty {
  padding: 28px 0;
  font-size: 24px;
  color: #b0b6c0;
  text-align: center;
}

/* 评论输入 */
.comments__input {
  display: flex;
  align-items: center;
  padding: 16px 0 8px;
}

.comments__field {
  flex: 1;
  min-width: 0;
  background: #f5f6f8;
  border-radius: 24px;
  padding: 4px 24px;
}

.comments__send {
  flex-shrink: 0;
  margin-left: 16px;
  background: linear-gradient(135deg, #5b7cfa, #8b5cf6);
  border: none;
}

/* 分页 */
.feed__pagination {
  display: flex;
  justify-content: center;
  padding: 40px 24px 24px;
}

.feed__pagination .nut-pagination {
  display: flex;
  align-items: center;
}

.feed__pagination .nut-pagination-prev,
.feed__pagination .nut-pagination-next,
.feed__pagination .nut-pagination-item {
  height: 72px;
  min-width: 72px;
  flex-shrink: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 10px;
  padding: 0 20px;
  font-size: 28px;
  line-height: 1;
  color: #4a5264;
  background: #fff;
  border: 2px solid #e6e9f0;
  border-radius: 36px;
}

.feed__pagination .nut-pagination .active {
  color: #fff;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #5b7cfa, #8b5cf6);
  box-shadow: 0 8px 18px rgba(91, 124, 250, 0.28);
}

.feed__pagination .nut-pagination .disabled {
  color: #c6cbd6;
  background: #f5f6f8;
  border-color: #eef0f5;
  box-shadow: none;
}

/* 回复弹窗 */
.reply {
  padding: 48px 32px;
}

.reply__origin {
  font-size: 26px;
  color: #666;
  line-height: 1.5;
  word-break: break-all;
  margin-bottom: 24px;
}

.reply__field {
  background: #f5f6f8;
  border-radius: 20px;
  padding: 4px 24px;
  margin-bottom: 28px;
}

.reply__send {
  background: linear-gradient(135deg, #5b7cfa, #8b5cf6);
  border: none;
}
</style>
