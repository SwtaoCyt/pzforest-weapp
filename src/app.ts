import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './app.scss'
import '@nutui/icons-vue-taro/dist/style_iconfont.css';
import { Form, FormItem, Notify } from '@nutui/nutui-taro'
import { Tabs, TabPane } from '@nutui/nutui-taro'
import { Grid, GridItem } from '@nutui/nutui-taro'
import { Pagination, Popup, Collapse, CollapseItem, Button } from '@nutui/nutui-taro'
const App = createApp({
  onShow (options) {},
  // 入口组件不需要实现 render 方法，即使实现了也会被 taro 所覆盖
})
const pinia = createPinia()
App.use(Form)
App.use(FormItem)
App.use(Notify)
App.use(Tabs)
App.use(TabPane)
App.use(Grid).use(GridItem).use(Pagination).use(Popup).use(Collapse).use(CollapseItem).use(Button)
App.use(pinia)

export default App
