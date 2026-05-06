const storage = require('./utils/storage');

App({
  onLaunch() {
    // 初始化本地存储结构
    this.initStorage();
  },

  initStorage() {
    // 检查并初始化商品库
    if (!storage.getGoodsList().length) {
      const demoGoods = this.getDemoGoods();
      storage.saveGoodsList(demoGoods);
    }

    // 检查并初始化配置
    const settings = storage.getSettings();
    storage.saveSettings(settings); // 确保写入默认值
  },

  getDemoGoods() {
    const now = Date.now();
    return [
      { id: 'g_001', barcode: '6901234567890', name: '可口可乐 500ml', price: 3.00, createTime: now, updateTime: now },
      { id: 'g_002', barcode: '6912345678901', name: '康师傅方便面', price: 2.50, createTime: now, updateTime: now },
      { id: 'g_003', barcode: '6923456789012', name: '农夫山泉 550ml', price: 1.50, createTime: now, updateTime: now },
      { id: 'g_004', barcode: '6934567890123', name: '双汇火腿肠', price: 1.00, createTime: now, updateTime: now },
      { id: 'g_005', barcode: '6945678901234', name: '中华牙膏', price: 3.50, createTime: now, updateTime: now }
    ];
  }
});
