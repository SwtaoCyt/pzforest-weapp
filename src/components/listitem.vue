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
            <view class="post__text">{{ filterPostText(item.text) }}</view>
            <!-- 图片直接显示在列表里，点击可全屏预览 -->
            <!-- 用 view 容器锁死宽高比，避免 widthFix 在页面重布局时高度被重算塌缩 -->
            <view
              v-if="item.image"
              class="post__image-wrap"
              :style="{ aspectRatio: imgRatios[item.id] || '16 / 9' }"
              @click.stop="previewImage(item.image)"
            >
              <image
                :src="getImageUrl(item.image)"
                class="post__image"
                mode="aspectFill"
                :show-menu-by-longpress="true"
                @load="onImageLoad($event, item)"
              />
            </view>
            <view class="post__meta">
              <text class="post__time">{{ formatTimeAgo(item.createdTime) }}</text>
              <text class="post__count">评论 {{ item.commentsCount || 0 }}</text>
            </view>
          </view>
        </template>

        <!-- 折叠箭头：有评论才显示，0 评论的帖子不显示箭头（没有可展开的内容） -->
        <template v-slot:icon>
          <view v-if="item.commentsCount > 0" class="post__arrow">
            <text class="post__arrow-glyph">▾</text>
          </view>
        </template>

        <!-- 评论区 -->
        <view class="comments">
          <view v-if="commentsList[item.id] && commentsList[item.id].length" class="comments__list">
            <view
              v-for="comment in commentsList[item.id]"
              :key="comment.id"
              class="comment"
              :class="{ 'comment--reply': isReply(comment) }"
              @click="wantReply(comment.id, item.id, comment.text)"
            >
              <view class="comment__head">
                <text v-if="isReply(comment)" class="comment__tag">回复</text>
                <text class="comment__name">{{ comment.name }}{{ comment.miniProgram ? '（小程序）' : '' }}</text>
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
        <view class="reply__title">回复评论</view>

        <!-- 原评论引用块 -->
        <view class="reply__quote">
          <text class="reply__quote-label">原评论</text>
          <text class="reply__quote-text">{{ replyState.state.text }}</text>
        </view>

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

    // 评论/回复成功后：刷新该帖评论区 + 评论数 +1（否则只有重进页面才更新）
    const refreshComments = (id) => {
      getComments(id).then(res => {
        state.commentsList[id] = res;
      });
      const item = (state.StatusLists || []).find(s => s.id == id);
      if (item) {
        item.commentsCount = (item.commentsCount || 0) + 1;
      }
    };

    const reply = async (replyData) => {
      let cid = replyData.cid;
      let id = replyData.id;
      let comment = replyData.comment;
      try {
        await createReply(cid, id, comment);
        state.showCommentpop = false;
        showNotify("回复成功");
        refreshComments(id);
      } catch (e) {
        showNotify("回复失败，请重试");
      }
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
      if (!content || !content.trim()) {
        showNotify("请输入评论内容");
        return;
      }
      createComment(id, content)
        .then(() => {
          showNotify("评论成功！");
          state.commentValue = "";
          // 评论成功后立刻刷新该帖评论 + 评论数 +1
          refreshComments(id);
        })
        .catch(() => {
          showNotify("评论失败，请重试");
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

    // 判断评论是否为"回复"：微博 API 中根评论 rootid 为空/等于自身，回复的 rootid 指向根评论
    const isReply = (comment) => {
      const rootid = comment && comment.rootid;
      if (!rootid) return false;
      const selfId = String(comment.id != null ? comment.id : comment.idstr);
      return String(rootid) !== selfId;
    };

    const activeNames = reactive(
      {
        value: ""
      }
    );

    // 兼容两种图片结构：对象 { url } 或纯字符串
    const getImageUrl = (img) => {
      if (!img) return '';
      return typeof img === 'string' ? img : (img.url || img.large || img.original || '');
    };

    // 过滤微博短链接如 http://t.cn/xxxxxx 或 https://t.cn/xxxxxx
    const filterPostText = (text) => {
      if (!text) return '';
      return text.replace(/https?:\/\/t\.cn\/[a-zA-Z0-9]+/g, '').trim();
    };

    // 记录每张图片的真实宽高比，用于锁死容器高度，避免 widthFix 重布局塌缩
    const imgRatios = reactive({});
    const onImageLoad = (e, item) => {
      const detail = e && e.detail;
      if (detail && detail.width && detail.height) {
        imgRatios[item.id] = `${detail.width} / ${detail.height}`;
      }
    };

    const previewImage = (url) => {
      const src = getImageUrl(url);
      if (!src) {
        return;
      }
      Taro.previewImage({
        current: src,
        urls: [src],
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
        // 点击总是拉取评论（不再按 commentsCount===0 跳过——该值是发帖时快照，可能为 0 但实际有评论）
        getComments(names)
          .then(res => {
            state.commentsList[names] = res;
          })
          .catch(() => {
            // 请求失败也回退为空列表，而不是一直停留在“评论加载中”
            state.commentsList[names] = [];
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
      isReply,
      previewImage,
      getImageUrl,
      filterPostText,
      onImageLoad,
      imgRatios,
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

/* 折叠箭头：浅色柔和圆，有评论才显示（模板里按 commentsCount 判断） */
.feed .post__arrow {
  width: 44px;
  height: 44px;
  margin-left: 16px;
  border-radius: 50%;
  background: #eef1ff;
  border: 2px solid rgba(91, 124, 250, 0.12);
  color: #5b7cfa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed .post__arrow-glyph {
  font-size: 24px;
  line-height: 1;
}

/* 帖子标题 */
.post {
  width: 100%;
}

.post__text {
  font-size: 30px;
  color: #2b3245;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
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

/* 列表内图片容器：用 aspect-ratio 锁死高度，重布局时不再塌缩 */
.post__image-wrap {
  width: 100%;
  margin-top: 16px;
  border-radius: 16px;
  overflow: hidden;
  background: #f5f6f8;
  will-change: transform;
  transform: translateZ(0);
}

/* 图片填满容器；容器宽高比即图片真实比例，aspectFill 不会变形 */
.post__image {
  display: block;
  width: 100%;
  height: 100%;
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

/* 回复样式：缩进 + 浅色背景，与根评论区分 */
.comment--reply {
  margin-left: 28px;
  padding-left: 20px;
  border-left: 4px solid #e6e9f0;
  background: #fafbfd;
  border-bottom-color: transparent;
}

.comment__tag {
  flex-shrink: 0;
  margin-right: 12px;
  padding: 2px 12px;
  font-size: 20px;
  line-height: 1.4;
  color: #8b5cf6;
  background: #f3edff;
  border-radius: 8px;
}

.comment__name {
  flex: 1;
  font-size: 26px;
  font-weight: 600;
  color: #4a5264;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  height: 100%;
  padding: 48px 40px 64px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.reply__title {
  font-size: 34px;
  font-weight: 600;
  color: #2b3245;
  margin-bottom: 28px;
}

/* 原评论引用块 */
.reply__quote {
  background: #f5f7ff;
  border-left: 6px solid #5b7cfa;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
}

.reply__quote-label {
  display: block;
  font-size: 22px;
  color: #5b7cfa;
  margin-bottom: 8px;
}

.reply__quote-text {
  display: block;
  font-size: 26px;
  color: #6a7284;
  line-height: 1.5;
  word-break: break-all;
  max-height: 120px;
  overflow: hidden;
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
  margin-top: auto;
}
</style>
