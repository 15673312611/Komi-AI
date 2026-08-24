export interface CannedResponse {
  id: string
  category: string
  title: string
  shortcut?: string
  content: string
}

export const CANNED_RESPONSES: CannedResponse[] = [
  {
    id: 'cr-1',
    category: '问候语',
    title: '标准客服欢迎语',
    shortcut: '/hello',
    content: '您好，{{customer_name}}！我是您的专属客服顾问，请问有什么可以为您效劳的吗？'
  },
  {
    id: 'cr-2',
    category: '物流查询',
    title: '订单发货与轨迹提示',
    shortcut: '/shipping',
    content: '您的订单 {{order_number}} 已经安排顺丰速运发出，正在飞速运往您的收货地址，通常预计 1-3 个工作日送达，您可以随时在订单中心查看最新轨迹。'
  },
  {
    id: 'cr-3',
    category: '退换货',
    title: '无忧退换货指引',
    shortcut: '/return',
    content: '我们支持 7 天无理由退换货保障。如果您收到的商品有任何不合身或不满意的地方，请保持商品包装与吊牌完好，随时联系我们为您办理极速退换。'
  },
  {
    id: 'cr-4',
    category: '支付优惠',
    title: '店铺优惠券指引',
    shortcut: '/coupon',
    content: '亲，当前店铺正在进行限时满减活动，您可以在商品结算页直接领取叠加优惠券，享受折上折优惠哦！'
  },
  {
    id: 'cr-5',
    category: '结束语',
    title: '客服服务致谢与道别',
    shortcut: '/bye',
    content: '感谢您的咨询与支持！祝您购物愉快，生活顺心。如果后续还有任何问题，随时欢迎再次联系我们！'
  }
]
