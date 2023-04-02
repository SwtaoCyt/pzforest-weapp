export default defineAppConfig({
  pages: [
    'pages/index/index'
  ],
  permission:{
    'scope.userInfo': {
        desc: '获取用户信息'
  }
}
  ,
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  }
})
