import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './app.scss'
import '@nutui/icons-vue-taro/dist/style_iconfont.css';
import { Backtop, Form, FormItem, Notify } from '@nutui/nutui-taro'
import { Tabs, TabPane } from '@nutui/nutui-taro'
import { Address } from '@nutui/nutui-taro'
import { Card } from '@nutui/nutui-taro'
import { Swiper, SwiperItem } from '@nutui/nutui-taro'
import { Navbar,Grid, GridItem,Pagination,Sticky,  Popup ,Collapse, CollapseItem ,List  ,Comment,Button } from '@nutui/nutui-taro'
import { Sku } from '@nutui/nutui-taro'
const App = createApp({
  onShow (options) {},
  // 入口组件不需要实现 render 方法，即使实现了也会被 taro 所覆盖
})
const pinia = createPinia()
App.use(Backtop)
App.use(Form)
App.use(FormItem)
App.use(Notify)
App.use(Tabs)
App.use(TabPane)
App.use(Address)
App.use(Card)
App.use(Swiper)
App.use(SwiperItem)
App.use(Navbar)
App.use(Sku).use(Grid).use(GridItem).use(Pagination).use(Sticky).use(Popup).use(Collapse).use(CollapseItem).use(List).use(Comment).use(Button)
App.use(pinia)

export default App
