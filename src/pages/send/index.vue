<template>
  <view>
    <nut-tabs v-model="tab1value">
      <nut-tab-pane title="输入文字">
        <nut-textarea v-model="text" :rows="4" placeholder="在这里输入内容吧" />
      </nut-tab-pane>
      <nut-tab-pane title="选择图片">
        <view class="image-container">
          <view
            v-for="(image, index) in images"
            :key="index"
            @click="previewImage(image)"
            class="image-item"
          >
            <image :src="image" class="image"></image>
          </view>
        </view>

        <nut-button
          block
          bottom
          @click="chooseImages"
          style="margin-bottom: 5px"
          >选择图片</nut-button
        >
      </nut-tab-pane>
    </nut-tabs>
  </view>

  <view bottom class="step">
    <nut-button
      block
      bottom
      type="success"
      @click="drawImageOnCanvas"
      style="margin-bottom: 10px"
      >预览投稿效果</nut-button
    >
    <nut-steps :current="tab1value + 1">
      <nut-step title="输入文字">1</nut-step>
      <nut-step title="选择图片">2</nut-step>
      <nut-step title="提交">3</nut-step>
    </nut-steps>
  </view>
  <nut-tabbar
    bottom
    safe-area-inset-bottom
    placeholder
    @tab-switch="(index, title) => switchTab(index, title)"
  >
    <nut-tabbar-item tab-title="下一步" :icon="RectRight"> </nut-tabbar-item>
    <nut-tabbar-item
      tab-title="结束"
      :icon="Check"
      @click="summit()"
    ></nut-tabbar-item>
  </nut-tabbar>
  <canvas
    ref="canvasRef"
    type
    canvas-id="canvas"
    :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
    class="canvas"
  />
</template>
<script lang='ts'>
import { Canvas } from "@tarojs/components";
import { onMounted, reactive, ref, toRefs } from "vue";
import Taro from "@tarojs/taro";
import { Home, Category, Check, RectRight } from "@nutui/icons-vue-taro";
export default {
  components: { Canvas, Home, Category, Check, RectRight },
  setup() {
    onMounted(() => {});
    const submit = () => {
      console.log("哈哈哈");
    };
    const switchTab = (index, title) => {
      console.log(index);

      console.log(index.tabTitle);
      console.log(title);
      if (title == 0) {
        if (state.tab1value >= 1) state.tab1value = 0;
        else state.tab1value += 1;
      }
    };
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const canvasWidth = ref(0);
    const canvasHeight = ref(0);

    const drawImageOnCanvas = async () => {
      // 判断是否有图片再操作
      if (images.value[0] != undefined) {
        canvasWidth.value = 0;
        canvasHeight.value = 0;
        let maxWidth = 0;
        // 遍历图片信息，并且计算拉伸比例
        const promises = images.value.map((image) => {
          return new Promise((resolve, reject) => {
            Taro.getImageInfo({
              src: image,
              success: (res) => {
                canvasWidth.value = Math.max(canvasWidth.value, res.width);
                maxWidth = Math.max(maxWidth, res.width);
                resolve(res);
              },
              fail: (error) => {
                reject(error);
              },
            });
          });
        });

        const infos = await Promise.all(promises);
        for (let i = 0; i < infos.length; i++) {
          const info = infos[i];
          const w = info.width;
          const h = info.height;
          const scaleFactor = maxWidth / w;
          canvasHeight.value += h * scaleFactor;
        }
        canvasHeight.value = Math.floor(canvasHeight.value);
        const ctx = Taro.createCanvasContext("canvas");
        ctx?.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
        // 开始绘制
        let y = 0;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
        if (state.text !== "") {
          const textLines = state.text.split(/\r?\n/); // 使用正则表达式来匹配 Windows 和 Linux 下的换行符
          const fontSize = 20;
          const lineHeight = 60;
          const padding = 20;
          const textWidth = canvasWidth.value - padding * 2;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.setTextAlign("center");
          ctx.fillStyle = "#000";
          for (let i = 0; i < textLines.length; i++) {
            let textLine = textLines[i];
            const textHeight = lineHeight;
            let words = textLine.split(" ");
            console.log(words);

            let line = "";
            for (let n = 0; n < words.length; n++) {
              let testLine = line + words[n] + " ";
              let metrics = ctx.measureText(testLine);
              console.log(metrics);
              console.log(metrics.width);
              console.log(textWidth);

              let testWidth = metrics.width;
              if (testWidth > textWidth && n > 0) {
                console.log("哈哈哈");

                ctx.fillText(
                  line,
                  canvasWidth.value / 2,
                  y + padding + textHeight / 2
                );
                line = words[n] + " ";
                y += textHeight;
              } else {
                line = testLine;
              }
            }
            ctx.fillText(
              line,
              canvasWidth.value / 2,
              y + padding + textHeight / 2
            );
            y += textHeight;
          }
        }

        for (let i = 0; i < images.value.length; i++) {
          const image = images.value[i];
          const res = await Taro.getImageInfo({ src: image });
          const w = res.width;
          const h = res.height;
          const scaleFactor = maxWidth / w;
          ctx?.drawImage(image, 0, y, w * scaleFactor, h * scaleFactor);

          y += h * scaleFactor;
        }
        // 绘制后输出并预览
        ctx?.draw(false, () => {
          Taro.canvasToTempFilePath({
            canvasId: "canvas",
            success: (res) => {
              console.log(res.tempFilePath);
              Taro.previewImage({
                urls: [res.tempFilePath],
              });
            },
            fail: (err) => {
              console.log(err);
            },
          });
        });
      } else console.log("没图片啦丢你");
    };

    const images = ref<string[]>([]);
    const state = reactive({
      multSwitch: 0,
      showCanvas: false,
      tab1value: 0,
      text: "",
    });
    const previewImage = (url) => {
      console.log(url);

      Taro.previewImage({
        urls: images.value,
        current: url,
      });
    };
    const chooseImages = async () => {
      const res = await Taro.chooseImage({
        count: 9,
        sizeType: ["original", "compressed"],
        sourceType: ["album", "camera"],
        fail: (res) => {
          console.log(res.errMsg);
        },
      });
      console.log(res.tempFilePaths);
      images.value = res.tempFilePaths;
    };
    return {
      ...toRefs(state),
      submit,
      images,
      canvasWidth,
      canvasHeight,
      drawImageOnCanvas,
      chooseImages,
      previewImage,
      Home,
      Category,
      Check,
      RectRight,
      switchTab,
    };
  },
};
</script>
<style lang="scss">
.canvas {
  visibility: hidden;
}
.image-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
}
.image-item {
  width: calc(33.33% - 10px);
  padding: 2px;
  height: 250px;
  background-color: azure;
  border: 1px solid #ddd; /* 添加边框 */
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2); /* 添加阴影 */
}
.image {
  width: 100%;

  max-width: 100%;
  max-height: 100%;
}
.bottom {
  margin-bottom: 0%;
}
.bottom-button {
  cursor: pointer;
  width: 100%;
  height: 49%;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
.step {
  margin-top: 40%;
}
</style>
