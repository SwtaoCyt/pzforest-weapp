import { createApp } from 'vue'
import './app.scss'
import {Grid, GridItem,Pagination,Sticky, Tabs, TabPane,Popup ,Collapse, CollapseItem,Notify ,List  ,Comment,Button   } from '@nutui/nutui-taro'

const App = createApp({
  onShow (options) {},
  // 入口组件不需要实现 render 方法，即使实现了也会被 taro 所覆盖
})
App.use(Grid).use(Button.).use(GridItem).use(Pagination).use(Sticky).use(Tabs).use(TabPane).use(Popup).use(Collapse).use(List).use(CollapseItem).use(Notify).use(Comment)
export default App
