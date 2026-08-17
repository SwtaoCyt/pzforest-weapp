<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-head">
      <view class="page-head__title">文章通知</view>
      <view class="page-head__subtitle">校园通知与最新文章</view>
    </view>

    <!-- 文章列表 -->
    <view v-if="articleList && articleList.length" class="article-list">
      <view
        v-for="item in articleList"
        :key="item.id"
        class="article-card"
        @click="goDetail(item.id)"
      >
        <image
          v-if="item.cover"
          :src="item.cover"
          class="article-card__cover"
          mode="aspectFill"
        />
        <view class="article-card__body">
          <view class="article-card__title">{{ item.title }}</view>
          <view class="article-card__summary">{{ item.summary }}</view>
          <view class="article-card__meta">
            <text class="article-card__source">{{ item.source }}</text>
            <text class="article-card__time">{{ formatTimeAgo(item.pubTime) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="loading" class="article-empty">加载中…</view>
    <view v-else class="article-empty">暂时还没有文章～</view>

    <!-- 分页 -->
    <view v-if="maxpage > 1" class="article-pagination">
      <nut-pagination
        v-model="currentPage"
        :page-count="maxpage"
        mode="multi"
        prev-text="‹"
        next-text="›"
        @change="pageChange"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Taro from '@tarojs/taro';
import { getArticleList } from '../../services/article';
import { Article } from '../../model/article';

const articleList = ref<Article[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const maxpage = ref(0);
const PAGE_SIZE = 10;

const fetchArticles = (page: number) => {
  loading.value = true;
  getArticleList(page, PAGE_SIZE)
    .then(data => {
      articleList.value = data.list;
      maxpage.value = Math.ceil(data.count / PAGE_SIZE);
    })
    .catch(err => {
      console.error(err);
    })
    .finally(() => {
      loading.value = false;
    });
};

const pageChange = (value: number) => {
  currentPage.value = value;
  fetchArticles(value - 1);
};

const goDetail = (id: string) => {
  Taro.navigateTo({
    url: '/pages/articleDetail/index?id=' + id,
  });
};

const formatTimeAgo = (time: string) => {
  if (!time) return '';
  const createTime = new Date(time);
  if (isNaN(createTime.getTime())) return '';

  const now = new Date();
  const diff = now.getTime() - createTime.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return days + '天前';
  } else if (hours > 0) {
    return hours + '小时前';
  } else {
    return minutes + '分钟前';
  }
};

onMounted(() => {
  fetchArticles(0);
});
</script>

<style>
.page {
  min-height: 100vh;
  padding: 40px 32px 80px;
  background: linear-gradient(180deg, #eef2ff 0%, #f6f7fb 45%);
  box-sizing: border-box;
}

/* 顶部标题 */
.page-head {
  padding: 8px 8px 32px;
}

.page-head__title {
  font-size: 44px;
  font-weight: 600;
  color: #2b3245;
}

.page-head__subtitle {
  margin-top: 8px;
  font-size: 24px;
  color: #9aa5b8;
}

/* 文章卡片 */
.article-card {
  display: flex;
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 12px 36px rgba(60, 74, 116, 0.08);
  padding: 28px;
  margin-bottom: 24px;
  overflow: hidden;
}

.article-card__cover {
  width: 180px;
  height: 180px;
  border-radius: 16px;
  flex-shrink: 0;
  margin-right: 24px;
  background: #eef1ff;
}

.article-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.article-card__title {
  font-size: 32px;
  font-weight: 600;
  color: #2b3245;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.article-card__summary {
  margin-top: 12px;
  font-size: 26px;
  color: #6b7486;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  flex: 1;
}

.article-card__meta {
  display: flex;
  align-items: center;
  margin-top: 16px;
  font-size: 22px;
  color: #9aa5b8;
}

.article-card__source {
  color: #5b7cfa;
  margin-right: 24px;
}

.article-card__time {
  color: #9aa5b8;
}

/* 空态 / 加载 */
.article-empty {
  padding: 80px 0;
  font-size: 26px;
  color: #b0b6c0;
  text-align: center;
}

/* 分页 */
.article-pagination {
  display: flex;
  justify-content: center;
  padding: 40px 24px 24px;
}
</style>
