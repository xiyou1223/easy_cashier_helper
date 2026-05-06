/**
 * 本地存储封装 - 统一数据管理
 * 所有存储操作通过此模块进行，避免散落各处
 */

const KEYS = {
  GOODS_DB: 'goods_db',
  CART: 'cart',
  SETTINGS: 'settings'
};

// ==================== 商品库 ====================
function getGoodsDB() {
  return wx.getStorageSync(KEYS.GOODS_DB) || {
    version: '1.0',
    lastUpdate: Date.now(),
    goods: []
  };
}

function saveGoodsDB(db) {
  db.lastUpdate = Date.now();
  wx.setStorageSync(KEYS.GOODS_DB, db);
}

function getGoodsList() {
  return getGoodsDB().goods;
}

function saveGoodsList(goodsList) {
  saveGoodsDB({
    version: '1.0',
    goods: goodsList
  });
}

function findGoodsById(id) {
  return getGoodsList().find(function (g) { return g.id === id; });
}

function findGoodsByBarcode(barcode) {
  return getGoodsList().find(function (g) { return g.barcode === barcode; });
}

// ==================== 购物车 ====================
function getCart() {
  return wx.getStorageSync(KEYS.CART) || {
    items: [],
    totalPrice: 0,
    itemCount: 0
  };
}

function saveCart(cart) {
  wx.setStorageSync(KEYS.CART, cart);
}

function getCartItems() {
  return getCart().items || [];
}

function saveCartItems(items) {
  saveCart({
    items: items,
    totalPrice: items.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0),
    itemCount: items.reduce(function (sum, item) { return sum + item.quantity; }, 0)
  });
}

function clearCart() {
  wx.removeStorageSync(KEYS.CART);
}

// ==================== 配置 ====================
function getSettings() {
  return wx.getStorageSync(KEYS.SETTINGS) || {
    scanVibrate: true,
    autoClear: false
  };
}

function saveSettings(settings) {
  wx.setStorageSync(KEYS.SETTINGS, settings);
}

// ==================== 工具 ====================
function generateId() {
  return 'g_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

module.exports = {
  KEYS,
  getGoodsDB,
  saveGoodsDB,
  getGoodsList,
  saveGoodsList,
  findGoodsById,
  findGoodsByBarcode,
  getCart,
  saveCart,
  getCartItems,
  saveCartItems,
  clearCart,
  getSettings,
  saveSettings,
  generateId
};
