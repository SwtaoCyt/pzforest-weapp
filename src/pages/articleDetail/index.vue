<template>
  <view class="page">
    <view v-if="article" class="detail">
      <view class="detail__title">{{ article.title }}</view>
      <view class="detail__meta">
        <text class="detail__source">{{ article.source }}</text>
        <text class="detail__time">{{ formatTime(article.pubTime) }}</text>
      </view>
      <rich-text class="detail__content" :nodes="normalizedHtml" />
    </view>
    <view v-else-if="loading" class="detail-state">加载中…</view>
    <view v-else class="detail-state">文章不存在或已删除</view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from '@tarojs/taro';
import { getArticleDetail } from '../../services/article';
import { Article } from '../../model/article';

const router = useRouter();
const article = ref<Article | null>(null);
const loading = ref(false);

// 后端 HTML 规范化：rich-text 不能靠页面 CSS 控制内部 img，
// 这里在渲染前给 img 补 max-width，并把懒加载 data-src 转成 src
const normalizedHtml = computed(() => {
  const html = article.value?.contentHtml || '';
  return html
    .replace(/<img\b(?![^>]*\bstyle=)[^>]*>/gi, (m) => {
      return m.replace('<img', '<img style="max-width:100%;height:auto;"');
    })
    .replace(/\bdata-src="([^"]*)"/gi, 'src="$1"');
});

const formatTime = (time: string) => {
  if (!time) return '';
  const d = new Date(time);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

onMounted(() => {
  const id = router.params?.id;
  if (!id) {
    loading.value = false;
    return;
  }
  loading.value = true;
  getArticleDetail(id)
    .then(data => {
      article.value = data;
    })
    .catch(err => {
      console.error(err);
    })
    .finally(() => {
      loading.value = false;
    });
});
</script>

<style>
.page {
  min-height: 100vh;
  background: #fff;
  box-sizing: border-box;
}

.detail {
  padding: 48px 40px 80px;
}

.detail__title {
  font-size: 40px;
  font-weight: 600;
  color: #2b3245;
  line-height: 1.45;
}

.detail__meta {
  display: flex;
  align-items: center;
  margin-top: 20px;
  padding-bottom: 32px;
  border-bottom: 2px solid #f0f2f5;
  font-size: 24px;
  color: #9aa5b8;
}

.detail__source {
  color: #5b7cfa;
  margin-right: 24px;
}

/* 正文 */
.detail__content {
  display: block;
  padding-top: 32px;
  font-size: 30px;
  color: #3a4152;
  line-height: 1.8;
  word-break: break-all;
}

.detail-state {
  padding: 160px 0;
  text-align: center;
  font-size: 28px;
  color: #b0b6c0;
}
</style>
