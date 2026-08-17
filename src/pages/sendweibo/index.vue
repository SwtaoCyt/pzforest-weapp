<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-head">
      <view class="page-head__title">发布微博</view>
      <view class="page-head__subtitle">分享校园里的新鲜事</view>
    </view>

    <!-- 图片卡片 -->
    <view class="card">
      <view class="card__title">图片</view>
      <view class="image-grid">
        <view
          v-for="(image, index) in formData.imageList"
          :key="index"
          class="image-item"
        >
          <image :src="image" class="image" mode="aspectFill" @click="previewImage(image)"></image>
          <view class="image-item__remove" @click="removeImage(index)">×</view>
        </view>
      </view>
      <view class="image-actions">
        <nut-button class="choose-btn" @click="chooseImages">选择图片</nut-button>
        <text class="image-count">{{ formData.imageList.length }}/{{ MAX_IMAGES }}</text>
      </view>
      <view v-if="formData.imageList.length > 1" class="stitch-hint">
        已选多图，上传时将自动拼接为长图（文字在顶部）
      </view>
    </view>

    <!-- 文字卡片 -->
    <view class="card">
      <view class="card__title">文字</view>
      <nut-textarea
        v-model="formData.text"
        limit-show
        :max-length="130"
        rows="4"
        placeholder="分享你的校园生活…"
      />
    </view>

    <!-- 拼接预览卡片（多图时显示） -->
    <view v-if="formData.imageList.length > 1" class="card">
      <view class="card__title">拼接预览</view>
      <nut-button class="preview-btn" :loading="isStitching" @click="previewLongImage">
        预览长图效果
      </nut-button>
      <image
        v-if="stitchedPath"
        :src="stitchedPath"
        class="preview-image"
        mode="widthFix"
        :show-menu-by-longpress="true"
        @click="previewImage(stitchedPath)"
      />
      <view v-if="stitchedPath" class="preview-tip">长按图片可保存到相册</view>
    </view>

    <!-- 上传 -->
    <nut-button
      block
      type="primary"
      class="upload-btn"
      :loading="isLoading"
      @click="uploadWeibo"
      >上传微博</nut-button
    >
  </view>

  <notify ref="notifyRef"></notify>

  <!-- 隐藏画布：多图拼接长图 -->
  <canvas
    canvas-id="stitchCanvas"
    class="stitch-canvas"
    :style="{ width: canvasSize.width + 'px', height: canvasSize.height + 'px' }"
  ></canvas>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { contribute } from "../../services/weibo"
  import Taro from '@tarojs/taro';
  // @ts-ignore
  import notify from '../../components/notify.vue'

  const MAX_IMAGES = 9
  const notifyRef = ref(null);
  const isLoading = ref(false);
  const isStitching = ref(false);
  const stitchedPath = ref('');
  const canvasSize = ref({ width: 750, height: 1000 });

  const formData = ref({
    text: "",
    defaultFileList: [],
    imageList: []
  });

  // 内容变化后，之前生成的预览图作废
  watch(formData, () => {
    stitchedPath.value = '';
  }, { deep: true });

  const chooseImages = async () => {
    const remaining = MAX_IMAGES - formData.value.imageList.length;
    if (remaining <= 0) {
      triggerNotify("warning", `最多上传 ${MAX_IMAGES} 张图片`);
      return;
    }
    const res = await Taro.chooseImage({
      count: remaining,
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
      fail: (res) => {
        console.log(res.errMsg);
      },
    });
    if (res.tempFilePaths && res.tempFilePaths.length) {
      formData.value.imageList = formData.value.imageList.concat(res.tempFilePaths);
    }
  };

  const removeImage = (index: number) => {
    formData.value.imageList.splice(index, 1);
  };

  const triggerNotify = (notifyClass, str) => {
    if (notifyRef.value) {
      // @ts-ignore
      notifyRef.value.show({ type: notifyClass, desc: str });
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const previewImage = (url) => {
    if (url == "") {
      return 0;
    }
    Taro.previewImage({
      current: url,
      urls: [url],
    });
  };

  /**
   * 多图拼接长图：文字放在顶部，图片依次竖排，返回生成图片的临时路径
   */
  const stitchLongImage = (text: string, images: string[]): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. 获取每张图片的宽高
        const infos: any[] = [];
        for (const src of images) {
          const info: any = await Taro.getImageInfo({ src });
          infos.push(info);
        }

        const canvasW = 750;
        const padding = 40;
        const contentW = canvasW - padding * 2;
        const fontSize = 32;
        const lineHeight = 52;
        const gap = 24;

        // 2. 计算文字换行（旧版 canvas 上下文 measureText 同步返回宽度）
        // @ts-ignore
        const measureCtx = Taro.createCanvasContext('stitchCanvas');
        measureCtx.setFontSize(fontSize);
        const lines: string[] = [];
        // 0文多图时没有文字，跳过文字区，只拼图片
        const trimmed = (text || '').trim();
        if (trimmed) {
          const paragraphs = trimmed.split('\n');
          paragraphs.forEach((para) => {
            let line = '';
            for (const ch of para) {
              const test = line + ch;
              const w = measureCtx.measureText(test).width;
              if (w > contentW && line) {
                lines.push(line);
                line = ch;
              } else {
                line = test;
              }
            }
            lines.push(line);
          });
        }

        const imgHs = infos.map((info) => Math.round((canvasW * info.height) / info.width));
        const imagesH = imgHs.reduce((a: number, b: number) => a + b, 0);
        const textH = lines.length * lineHeight;
        const hasBoth = lines.length > 0 && images.length > 0;
        const canvasH = padding + textH + (hasBoth ? gap : 0) + imagesH + padding;

        // 3. 更新画布尺寸并等待小程序渲染生效
        canvasSize.value = { width: canvasW, height: canvasH };
        await delay(150);

        // 4. 开始绘制
        // @ts-ignore
        const ctx = Taro.createCanvasContext('stitchCanvas');
        ctx.setFillStyle('#ffffff');
        ctx.fillRect(0, 0, canvasW, canvasH);

        if (lines.length) {
          ctx.setFontSize(fontSize);
          ctx.setFillStyle('#333333');
          let baseline = padding + fontSize;
          for (const l of lines) {
            ctx.fillText(l, padding, baseline);
            baseline += lineHeight;
          }
        }

        let y = padding + textH + (hasBoth ? gap : 0);
        for (let i = 0; i < images.length; i++) {
          ctx.drawImage(images[i], 0, y, canvasW, imgHs[i]);
          y += imgHs[i];
        }

        ctx.draw(false, () => {
          Taro.canvasToTempFilePath({
            canvasId: 'stitchCanvas',
            x: 0,
            y: 0,
            width: canvasW,
            height: canvasH,
            destWidth: canvasW,
            destHeight: canvasH,
            success: (res) => resolve(res.tempFilePath),
            fail: (err) => reject(err),
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  };

  // 生成长图（带缓存：内容未变时复用）
  const doStitch = async (): Promise<string> => {
    if (stitchedPath.value) return stitchedPath.value;
    isStitching.value = true;
    try {
      stitchedPath.value = await stitchLongImage(formData.value.text, formData.value.imageList);
      return stitchedPath.value;
    } finally {
      isStitching.value = false;
    }
  };

  const previewLongImage = async () => {
    try {
      await doStitch();
    } catch (e) {
      console.error(e);
      triggerNotify("danger", "图片拼接失败，请重试");
    }
  };

  const handleUploadResult = (res: any) => {
    // 2xx 视为成功；400 属于客户端/业务错误，不应误报成功
    const code = Number(res && res.code);
    const isSuccess = !isNaN(code) && code >= 200 && code < 300;
    // 后端 message 可能为空，这里兜底给一条可读文案，避免出现空通知条
    const message = (res && res.message) || (isSuccess ? "发布成功" : "发布失败，请重试");
    triggerNotify(isSuccess ? "success" : "danger", message);
    delay(3000).finally(() => {
      Taro.navigateBack();
    });
  };

  const uploadWeibo = async () => {
    const text = formData.value.text;
    const images = formData.value.imageList;

    // 只有「无图」时才要求文字；有图时文字可选（0文多图也要拼接）
    if (images.length === 0 && text.length <= 1) {
      triggerNotify("warning", "字数太少啦");
      return;
    }

    isLoading.value = true;
    try {
      if (images.length === 0) {
        // 纯文字
        const res: any = await contribute(undefined, text, 0);
        handleUploadResult(res);
      } else if (images.length === 1) {
        // 单图：不拼接，直接发微博
        const res: any = await contribute(images[0], text, 0);
        handleUploadResult(res);
      } else {
        // 多图：拼接长图（文字在顶部，文字可选）
        triggerNotify("primary", "正在生成长图…");
        const longImage = await doStitch();
        const res: any = await contribute(longImage, text, 0);
        handleUploadResult(res);
      }
    } catch (e) {
      console.error(e);
      triggerNotify("danger", "图片处理失败，请重试");
    } finally {
      isLoading.value = false;
    }
  };
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

/* 卡片 */
.card {
  background: #fff;
  border-radius: 32px;
  box-shadow: 0 12px 36px rgba(60, 74, 116, 0.08);
  padding: 32px;
  margin-bottom: 24px;
}

.card__title {
  font-size: 30px;
  font-weight: 600;
  color: #2b3245;
  margin-bottom: 24px;
}

/* 图片 */
.image-grid {
  display: flex;
  flex-wrap: wrap;
}

.image-item {
  position: relative;
  margin: 8px;
}

.image {
  width: 200px;
  height: 200px;
  border-radius: 16px;
  display: block;
}

.image-item__remove {
  position: absolute;
  top: 0;
  right: 0;
  width: 56px;
  height: 56px;
  line-height: 52px;
  text-align: center;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 36px;
  border-radius: 0 16px 0 16px;
}

.image-actions {
  display: flex;
  align-items: center;
  margin-top: 16px;
}

.choose-btn {
  margin-right: 20px;
  background: #eef1ff;
  color: #5b7cfa;
  border: none;
  border-radius: 40px;
  height: 64px;
  padding: 0 32px;
}

.image-count {
  font-size: 24px;
  color: #9aa5b8;
}

.stitch-hint {
  margin-top: 16px;
  font-size: 24px;
  color: #5b7cfa;
}

/* 预览 */
.preview-btn {
  width: 100%;
  background: #eef1ff;
  color: #5b7cfa;
  border: none;
  border-radius: 40px;
  height: 72px;
}

.preview-image {
  margin-top: 24px;
  width: 100%;
  border-radius: 16px;
  display: block;
}

.preview-tip {
  margin-top: 12px;
  font-size: 22px;
  color: #b0b6c0;
  text-align: center;
}

/* 上传按钮 */
.upload-btn {
  height: 88px;
  border-radius: 48px;
  font-size: 32px;
  background: linear-gradient(135deg, #5b7cfa 0%, #8b5cf6 100%);
  border: none;
  box-shadow: 0 12px 24px rgba(91, 124, 250, 0.32);
}

/* 隐藏画布 */
.stitch-canvas {
  position: fixed;
  left: -9999px;
  top: 0;
}
</style>
