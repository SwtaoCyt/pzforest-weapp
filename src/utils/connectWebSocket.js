import Taro from '@tarojs/taro';
import { WS_ROOT, getHeader } from "../services/api";
const header = getHeader();

const connectWebSocket = (id, sellerOpenid) => {
  const loginId = Taro.getStorageSync("loginId");
  const url = `${WS_ROOT}/chat/${id}/${sellerOpenid}/${loginId}`;
  console.log(url);
  return Taro.connectSocket({
    url: url,
    success: function () {
      console.log('connect success');
    },
    fail: function (err) {
      console.error('connect fail', err);
    }
  }).then(task => {
    // Ensure the task is correctly returned
    return {
      onOpen: task.onOpen.bind(task),
      onMessage: task.onMessage.bind(task),
      onError: task.onError.bind(task),
      onClose: task.onClose.bind(task),
      send: task.send.bind(task),
      close: task.close.bind(task)
    };
  });
};

export default connectWebSocket;
