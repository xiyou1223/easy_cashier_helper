Page({
  data: {},

  onLoad() {},

  // 跳转到收银页面
  goToCashier() {
    wx.navigateTo({
      url: '/pages/cashier/cashier'
    });
  },

  // 跳转到商品管理页面
  goToGoods() {
    wx.navigateTo({
      url: '/pages/goods/goods'
    });
  }
});
