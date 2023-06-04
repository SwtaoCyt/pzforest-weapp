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
      @click="drawImageOnCanvas(1)"
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
    <nut-tabbar-item tab-title="提交" :icon="Check"></nut-tabbar-item>
  </nut-tabbar>
  <canvas
    ref="canvasRef"
    type
    canvas-id="canvas"
    :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
    class="canvas"
  />

  <nut-popup
    position="bottom"
    closeable
    round
    :style="{ height: '50%' }"
    v-model:visible="showBasic"
  >
    <view style="padding: 10%">
      <a style="text-align: center; margin-bottom: 2rem"
        >请确认是否是你要投稿的内容</a
      >

      <nut-collapse v-model="activeName" :accordion="true">
        <nut-collapse-item :title="title1" :name="1">
          {{ iwanttext }}
        </nut-collapse-item>
        <nut-collapse-item :title="title2" :name="2">
          <a @click="previewImage(pic)" style="font-color: red">{{
            iwantpreview
          }}</a>
        </nut-collapse-item>
      </nut-collapse>

      <nut-button
        bottom
        block
        type="info"
        @click="submit()"
        style="margin-bottom: 10px"
        >确认</nut-button
      >
    </view>
  </nut-popup>
</template>
<script lang='ts'>
import { onMounted, reactive, ref, toRefs } from "vue";
import { Canvas } from "@tarojs/components";
import { contribute } from "../../api/weibo";
import Taro from "@tarojs/taro";
import { Home, Category, Check, RectRight } from "@nutui/icons-vue-taro";
import { Notify } from "@nutui/nutui-taro";
export default {
  components: { Canvas, Home, Category, Check, RectRight, Notify },
  setup() {
    onMounted(() => {});
    const submit = () => {
      //多张图片且有文字(默认文字已经写进图片，所以不会将文字独立出来)
      if (images.value.length > 1 && state.text != "") {
        drawImageOnCanvas(0).finally(() => {
          contribute(state.pic, "");
        });
      }

      //仅有一张图片和文字
      if (images.value.length == 1 && state.text != "") {
        Taro.getImageInfo({
          src: images.value[0],
          success: (res) => {
            contribute(res.path, state.text);
          },
        });
      }
      //如果仅有文字
      if (images.value.length == 0 && state.text != "") {
        contribute(undefined, state.text);
      }
      if (images.value.length == 1 && state.text == "") {
        Taro.getImageInfo({
          src: images.value[0],
          success: (res) => {
            contribute(res.path, "");
          },
        });
      }
      console.log("提交成功！");
    };
    const switchTab = (index, title) => {
      //如果点击的是下一步，那么切换视图
      if (title == 0) {
        if (state.tab1value >= 1) state.tab1value = 0;
        else state.tab1value += 1;
      }
      //如果他点了提交
      if (title == 1) {
        console.log(index);
        if (state.text == "" && images.value.length == 0) {
          Taro.showToast({
            title: "还没有图文啊！",
            icon: "error",
            duration: 2000,
          });
        } else {
          if (images.value.length != 0) {
            drawImageOnCanvas(0);
            state.iwantpreview = "点击预览图片";
          }
          if (state.text != "") {
            state.iwanttext = state.text;
          }
          state.showBasic = true;
        }
      }
    };
    // const canvasWidth = ref(300);
    // const canvasHeight = ref(300);
    const activeName = ref(1);
    const drawImageOnCanvas = async (mode) => {
      // 判断是否有图片再操作
      if (images.value[0] != undefined) {
        state.canvasWidth = 0;
        state.canvasHeight = 0;
        let maxWidth = 0;

        // 遍历图片信息，并且计算拉伸比例
        const promises = images.value.map((image) => {
          return new Promise((resolve, reject) => {
            Taro.getImageInfo({
              src: image,
              success: (res) => {
                state.canvasWidth = Math.max(state.canvasWidth, res.width);
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
          state.canvasHeight += h * scaleFactor;
        }
        state.canvasHeight = Math.floor(state.canvasHeight);
        const ctx = Taro.createCanvasContext("canvas");
        ctx?.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
        // 开始绘制
        let y = 0;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

        if (state.text !== "") {
          const textLines = state.text.split(/\r?\n/); // 使用正则表达式来匹配 Windows 和 Linux 下的换行符
          const fontSize = 20;
          const lineHeight = 60;
          const padding = 20;
          const textWidth = state.canvasWidth - padding * 2;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.setTextAlign("center");
          ctx.fillStyle = "#000";

          // 统计文字行数和行高
          let totalLines = 0;
          let textHeight = 0;

          // 遍历数组，并绘制
          for (let i = 0; i < textLines.length; i++) {
            let line = textLines[i];
            let lineWidth = ctx.measureText(line).width;

            if (lineWidth <= textWidth) {
              // 如果该行文字宽度小于画布宽度，直接绘制
              ctx.fillText(
                line,
                state.canvasWidth / 2,
                y + padding + textHeight + fontSize
              );
              y += lineHeight;
              totalLines += 1;
            } else {
              // 如果该行文字宽度大于画布宽度，拆分为多行绘制
              let words = line.split("");
              let currLine = "";
              for (let n = 0; n < words.length; n++) {
                let testLine = currLine + words[n];
                let testWidth = ctx.measureText(testLine).width;
                if (testWidth > textWidth) {
                  ctx.fillText(
                    currLine,
                    state.canvasWidth / 2,
                    y + padding + textHeight + fontSize
                  );
                  y += lineHeight;
                  currLine = words[n];
                  totalLines += 1;
                } else {
                  currLine = testLine;
                }
              }
              // 绘制剩余部分
              ctx.fillText(
                currLine,
                state.canvasWidth / 2,
                y + padding + textHeight + fontSize
              );
              y += lineHeight;
              totalLines += 1;
            }
          }

          // 更新 state.canvasHeight
          state.canvasHeight += totalLines * lineHeight;
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
              state.pic = res.tempFilePath;
              console.log(res.tempFilePath);
              if (mode == 1) {
                Taro.previewImage({
                  urls: [res.tempFilePath],
                });
              }
              if (mode == 0) {
                return;
              }
            },
            fail: (err) => {
              console.log(err);
            },
          });
        });
      }

      if (images.value[0] == undefined && state.text.length > 150) {
        const ctx = Taro.createCanvasContext("canvas");

        // 计算绘制文字所需的参数
        const fontSize = 20;
        const lineHeight = 60;
        const padding = 20;
        const textLines = state.text.split(/\r?\n/);

        // 绘制文字
        ctx.font = `${fontSize}px sans-serif`;
        ctx.setTextAlign("center");
        ctx.fillStyle = "#000";

        let lineCount = 0;

        for (let i = 0; i < textLines.length; i++) {
          let line = textLines[i];

          while (line.length > 0) {
            let lineWidth = ctx.measureText(line).width;

            if (lineWidth > state.canvasWidth - padding * 2) {
              // 如果该行文字宽度超过画布宽度，需要进行换行处理
              let startIndex = 0;
              let endIndex = findBreakIndex(
                line,
                state.canvasWidth - padding * 2
              );

              if (endIndex === -1) {
                endIndex = line.length;
              }

              let lineText = line.substring(startIndex, endIndex);
              ctx.fillText(
                lineText,
                state.canvasWidth / 2,
                padding + (lineCount + 1) * lineHeight
              );
              line = line.substring(endIndex);
            } else {
              // 如果该行文字宽度未超过画布宽度，直接绘制
              ctx.fillText(
                line,
                state.canvasWidth / 2,
                padding + (lineCount + 1) * lineHeight
              );
              line = "";
            }

            lineCount++;
          }
        }

        // 调整画布高度
        const contentHeight = lineCount * lineHeight;
        state.canvasHeight = padding * 2 + contentHeight + lineHeight;

        ctx.draw(false, () => {
          // 清空画布
          ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);

          // 绘制白色背景
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

          // 绘制文字
          ctx.font = `${fontSize}px sans-serif`;
          ctx.setTextAlign("center");
          ctx.fillStyle = "#000";

          lineCount = 0;
          for (let i = 0; i < textLines.length; i++) {
            let line = textLines[i];

            while (line.length > 0) {
              let lineWidth = ctx.measureText(line).width;

              if (lineWidth > state.canvasWidth - padding * 2) {
                // 如果该行文字宽度超过画布宽度，需要进行换行处理
                let startIndex = 0;
                let endIndex = findBreakIndex(
                  line,
                  state.canvasWidth - padding * 2
                );

                if (endIndex === -1) {
                  endIndex = line.length;
                }

                let lineText = line.substring(startIndex, endIndex);
                ctx.fillText(
                  lineText,
                  state.canvasWidth / 2,
                  padding + (lineCount + 1) * lineHeight
                );
                line = line.substring(endIndex);
              } else {
                // 如果该行文字宽度未超过画布宽度，直接绘制
                ctx.fillText(
                  line,
                  state.canvasWidth / 2,
                  padding + (lineCount + 1) * lineHeight
                );
                line = "";
              }

              lineCount++;
            }
          }
          console.log("Canvas Height", state.canvasHeight);

          ctx.draw(false, () => {
            Taro.canvasToTempFilePath({
              canvasId: "canvas",
              success: (res) => {
                state.pic = res.tempFilePath;
                console.log(res.tempFilePath);
              },
              fail: (err) => {
                console.log(err);
              },
            });
          });
        });

        // 辅助函数：查找换行位置
        function findBreakIndex(line, maxWidth) {
          let index = -1;
          let lineWidth = 0;

          for (let i = 0; i < line.length; i++) {
            let charWidth = ctx.measureText(line[i]).width;

            if (lineWidth + charWidth > maxWidth) {
              index = i;
              break;
            }

            lineWidth += charWidth;
          }

          return index;
        }
      }
    };
    let subTitle = "有";
    const images = ref<string[]>([]);
    const state = reactive({
      canvasWidth: 600,
      canvasHeight: 10,
      iwantpreview: "无图片",
      iwanttext: "无文字",
      multSwitch: 0,
      showCanvas: false,
      tab1value: 0,
      text: "",
      showBasic: false,
      title1: "文字",
      title2: "图片",
      activeName,
      pic: "",
    });
    const previewImage = (url) => {
      if (url == "") {
        return 0;
      }
      Taro.previewImage({
        current: url,
        urls: [url],
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

      drawImageOnCanvas,
      chooseImages,
      previewImage,
      Home,
      Category,
      Check,
      RectRight,
      switchTab,
      subTitle,
      Notify,
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
