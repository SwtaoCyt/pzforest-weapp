import { createApp } from 'vue'
import './app.scss'
import {Grid, GridItem } from '@nutui/nutui-taro'
import Taro from '@tarojs/taro';

const App = createApp({
  onShow (options) {},
  // 入口组件不需要实现 render 方法，即使实现了也会被 taro 所覆盖
})
App.use(Grid).use(GridItem)
export default App
