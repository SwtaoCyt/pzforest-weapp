<template>
  <nut-collapse v-model="activeNames">
    <nut-collapse-item :name="1">
      <template v-slot:title>
        {{ title1 }}
      </template>
      NutUI是一套拥有京东风格的轻量级的 Vue 组件库
    </nut-collapse-item>
    <nut-collapse-item :title="title2" :name="2">
      在产品的功能、体验、易用性和灵活性等各个方面做了全面的升级！
    </nut-collapse-item>
    <nut-collapse-item :title="title3" :name="3" disabled> </nut-collapse-item>
  </nut-collapse>
</template>
<script>
import { reactive, toRefs } from 'vue';
export default {
  setup () {
    const activeNames = reactive([1, 2]);
    const title = reactive({
      title1: '标题1',
      title2: '标题2',
      title3: '标题3',
    })
    return {
      activeNames,
      ...toRefs(title)
    };
  }
}
</script>
