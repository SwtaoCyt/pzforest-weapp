import { API_ROOT, requestWithAuth } from "./api"
import { Article } from "src/model/article"

// 后端接口契约（假设，后端就绪后核对）：
//   GET /article/getArticleList?page=&limit= -> { data: { list: Article[], count: number } }
//   GET /article/getArticleDetail?id=        -> { data: Article }
//
// 后端目前还没上，先用 USE_MOCK 兜底让页面可跑通；
// 后端就绪后把 USE_MOCK 改为 false，并核对字段名即可，页面无需改动。
const USE_MOCK = true

const mockArticles: Article[] = [
  {
    id: '1',
    title: '关于图书馆暑期开放时间的通知',
    summary: '暑期图书馆开放时间调整，7月1日至8月31日每天 9:00-17:00 开放，周六日照常，请同学们合理安排借阅时间。',
    cover: '',
    contentHtml: '<p>各位同学：</p><p>为方便暑期留校同学的阅读与自习需求，图书馆暑期开放时间调整如下：</p><p><strong>开放时间：</strong>7月1日 - 8月31日，每天 9:00 - 17:00。</p><p>周六、周日正常开放，法定节假日另行通知。</p><img src="https://picsum.photos/640/320" /><p>祝大家假期愉快！</p>',
    pubTime: new Date(Date.now() - 3600 * 1000).toISOString(),
    source: '校图书馆'
  },
  {
    id: '2',
    title: '关于食堂暑期窗口调整的通知',
    summary: '暑期一食堂暂停营业，二食堂二楼正常供应，营业时间 7:30-19:30，请同学们相互转告。',
    cover: '',
    contentHtml: '<p>同学们：</p><p>暑期期间食堂窗口有所调整，具体如下：</p><ul><li>一食堂：暑期暂停营业，9月1日恢复。</li><li>二食堂二楼：正常供应，营业时间 7:30 - 19:30。</li></ul><p>由此带来的不便，敬请谅解。</p>',
    pubTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    source: '后勤管理处'
  },
  {
    id: '3',
    title: '2026年秋季学期选课通知',
    summary: '秋季学期选课将于 8月20日 开始，共两轮，请提前确认培养方案并按时选课。',
    cover: '',
    contentHtml: '<p>2026年秋季学期选课即将开始，请同学们做好准备：</p><p><strong>第一轮：</strong>8月20日 09:00 - 8月22日 17:00</p><p><strong>第二轮：</strong>8月25日 09:00 - 8月27日 17:00</p><p>选课前请先核对个人培养方案，逾期不再补选。</p>',
    pubTime: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    source: '教务处'
  }
]

export const getArticleList = (page = 0, limit = 10) => {
  if (USE_MOCK) {
    const start = page * limit
    const list = mockArticles.slice(start, start + limit)
    return Promise.resolve({ list, count: mockArticles.length })
  }
  return requestWithAuth({
    url: `${API_ROOT}/article/getArticleList?page=${page}&limit=${limit}`,
    method: 'GET',
  }).then((res) => res.data.data)
}

export const getArticleDetail = (id: string) => {
  if (USE_MOCK) {
    const found = mockArticles.find(a => a.id === id)
    if (found) {
      return Promise.resolve(found)
    }
    return Promise.reject(new Error('article not found'))
  }
  return requestWithAuth({
    url: `${API_ROOT}/article/getArticleDetail?id=${id}`,
    method: 'GET',
  }).then((res) => res.data.data)
}
