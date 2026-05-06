# 小卖部快速扫码计价器 - AI 开发文档 v1.0

> **文档用途**：本文档专为 AI 开发工具（OpenCode、Claude Code、Cursor 等）设计，请严格按照当前代码库中的实际实现为准。
>
> **核心要求**：完全免费、纯本地存储、入口导航页面、扫码即用。

---

## 一、项目元信息

```yaml
项目名称: 便利收银助手
技术栈: 微信小程序原生框架 + 本地存储
存储方式: wx.setStorageSync（完全免费，无需云开发）
代码结构: 3 页面 + 1 工具模块，页面隔离
兼容性: iOS 12.0+, Android 7.0+, 微信 8.0+
appid: wx7af63a5bbe6626f3
libVersion: 3.5.0
```

---

## 二、目录结构（必须严格遵守）

```
miniprogram/
├── app.js
├── app.json
├── app.wxss
├── project.config.json
├── project.private.config.json
├── sitemap.json
├── .gitignore
├── images/                      # 空目录
├── utils/
│   └── storage.js               # 存储封装（唯一数据层）
└── pages/
    ├── index/                   # 入口导航页（首页）
    │   ├── index.wxml
    │   ├── index.wxss
    │   ├── index.js
    │   └── index.json
    ├── cashier/                 # 收银计价页
    │   ├── cashier.wxml
    │   ├── cashier.wxss
    │   ├── cashier.js
    │   └── cashier.json
    └── goods/                   # 商品管理页
        ├── goods.wxml
        ├── goods.wxss
        ├── goods.js
        └── goods.json
```

**注意**：
- 无 `components/` 目录（购物车组件内联实现）
- 无 `utils/helper.js` 文件
- `images/` 为空（无需 tabBar 图标）
- 首个页面是 `pages/index/index`（导航页），非收银页

---

## 三、全局文件规格

### 3.1 app.json - 页面路由与配置

```json
{
  "pages": [
    "pages/index/index",
    "pages/cashier/cashier",
    "pages/goods/goods"
  ],
  "window": {
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTitleText": "便利收银助手",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f5f5",
    "backgroundTextStyle": "dark"
  },
  "sitemapLocation": "sitemap.json",
  "style": "v2",
  "lazyCodeLoading": "requiredComponents"
}
```

**要点**：
- 3 个页面，`index` 是入口（首页）
- **无 tabBar** — 页面间使用 `wx.navigateTo` / `<navigator>` 跳转
- 全局导航栏标题 "便利收银助手"

### 3.2 app.js - 全局生命周期

```javascript
const storage = require('./utils/storage');

App({
  onLaunch() {
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
```

**要点**：
- 引入 `utils/storage` 模块，通过其 API 操作存储，**不直接调用** `wx.getStorageSync` / `wx.setStorageSync`
- 使用 `storage.getGoodsList().length` 判断是否已初始化
- 配置项通过 `storage.getSettings()` + `storage.saveSettings()` 确保默认值写入

### 3.3 app.wxss - 全局样式

```css
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 全局容器 */
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

/* 全局按钮重置 */
button {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  line-height: 1;
}

button::after {
  border: none;
}

/* 全局卡片样式 */
.card {
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
}

/* 全局文本截断 */
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

## 四、入口导航页（pages/index/）

导航页作为应用首页，提供两个大入口按钮跳转到收银页和商品管理页。

### 4.1 index.wxml - 布局

```html
<view class="container">
  <view class="header">
    <text class="title">便利收银助手</text>
    <text class="subtitle">快速扫码，轻松收银</text>
  </view>
  <view class="entry-buttons">
    <view class="entry-btn cashier-btn" bindtap="goToCashier" hover-class="btn-hover">
      <view class="btn-icon">🛒</view>
      <text class="btn-text">收银计价</text>
      <text class="btn-desc">扫码添加商品，快速结算</text>
    </view>
    <view class="entry-btn goods-btn" bindtap="goToGoods" hover-class="btn-hover">
      <view class="btn-icon">📦</view>
      <text class="btn-text">商品管理</text>
      <text class="btn-desc">管理商品信息，导入导出数据</text>
    </view>
  </view>
  <view class="footer">
    <text class="footer-text">纯本地存储 · 完全免费 · 即开即用</text>
  </view>
</view>
```

### 4.2 index.wxss - 样式

```css
@import '/app.wxss';

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
}

.header {
  padding: 80rpx 40rpx 40rpx;
  text-align: center;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #ff6b35;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #999;
}

.entry-buttons {
  flex: 1;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  justify-content: center;
}

.entry-btn {
  background-color: white;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.btn-hover {
  transform: scale(0.96);
  opacity: 0.9;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.cashier-btn {
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%);
  box-shadow: 0 8rpx 32rpx rgba(255, 107, 53, 0.3);
}

.cashier-btn .btn-icon,
.cashier-btn .btn-text,
.cashier-btn .btn-desc {
  color: white;
}

.goods-btn {
  border: 2rpx solid #ff6b35;
}

.goods-btn .btn-icon {
  color: #ff6b35;
}

.goods-btn .btn-text {
  color: #333;
}

.goods-btn .btn-desc {
  color: #666;
}

.btn-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.btn-text {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.btn-desc {
  font-size: 26rpx;
  opacity: 0.8;
}

.footer {
  padding: 40rpx;
  text-align: center;
}

.footer-text {
  font-size: 24rpx;
  color: #ccc;
}
```

### 4.3 index.js - 逻辑

```javascript
Page({
  data: {},

  onLoad() {},

  goToCashier() {
    wx.navigateTo({
      url: '/pages/cashier/cashier'
    });
  },

  goToGoods() {
    wx.navigateTo({
      url: '/pages/goods/goods'
    });
  }
});
```

### 4.4 index.json

```json
{
  "navigationBarBackgroundColor": "#ffffff",
  "navigationBarTitleText": "便利收银助手",
  "navigationBarTextStyle": "black",
  "backgroundColor": "#f5f5f5",
  "enablePullDownRefresh": false
}
```

---

## 五、收银页面（核心 - 底部大按钮版）

### 5.1 cashier.wxml - 布局

```html
<view class="container">
  <!-- 顶部栏 -->
  <view class="header">
    <text class="title">收银计价</text>
    <navigator url="/pages/goods/goods" class="manage-btn">商品管理</navigator>
  </view>

  <!-- 购物车统计 -->
  <view class="stats-bar">
    <text class="stats-text">共 {{itemCount}} 件商品</text>
    <text class="stats-tip">扫码即加，自动累算</text>
  </view>

  <!-- 购物车列表（可滚动） -->
  <scroll-view class="cart-list" scroll-y enhanced show-scrollbar="{{true}}">
    <!-- 购物车条目 -->
    <view wx:for="{{cartItems}}" wx:key="barcode" class="cart-item">
      <view class="item-info">
        <text class="item-name">{{item.name}}</text>
        <text class="item-barcode">{{item.barcode}}</text>
        <text class="item-price">¥{{item.price}}</text>
      </view>
      <view class="item-controls">
        <view class="quantity-btn minus" bindtap="updateQuantity" data-barcode="{{item.barcode}}" data-delta="-1">-</view>
        <text class="quantity">{{item.quantity}}</text>
        <view class="quantity-btn plus" bindtap="updateQuantity" data-barcode="{{item.barcode}}" data-delta="1">+</view>
        <view class="delete-btn" bindtap="removeItem" data-barcode="{{item.barcode}}">🗑️</view>
      </view>
    </view>

    <!-- 空状态 -->
    <view wx:if="{{cartItems.length === 0}}" class="empty-cart">
      <text class="empty-icon">🛒</text>
      <text class="empty-text">购物车空空如也</text>
      <text class="empty-tip">点击底部按钮扫码添加商品</text>
    </view>
  </scroll-view>

  <!-- 底部总价栏 -->
  <view class="footer-bar">
    <view class="total-info">
      <text class="total-label">合计</text>
      <text class="total-price">{{totalPriceText}}</text>
    </view>
    <view class="action-buttons">
      <button class="action-btn clear-btn" bindtap="clearCart" hover-class="btn-hover">清空</button>
      <button class="action-btn round-btn" bindtap="roundDown" hover-class="btn-hover">抹零</button>
    </view>
  </view>

  <!-- 🎯 底部固定扫码区域（重点优化） -->
  <view class="scan-area" bindtap="onScanTap" hover-class="scan-hover">
    <view class="scan-button">
      <text class="scan-icon">📷</text>
      <text class="scan-text">扫码添加商品</text>
    </view>
  </view>
</view>
```

**注意**：总价使用 `{{totalPriceText}}`（预格式化字符串 `"¥X.XX"`），非 `{{totalPrice.toFixed(2)}}`。

### 5.2 cashier.wxss - 样式（包含底部按钮优化）

```css
@import '/app.wxss';

/* 顶部栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 32rpx;
  background-color: white;
  border-bottom: 1rpx solid #e9e9e9;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff6b35;
}

.manage-btn {
  font-size: 28rpx;
  color: #666;
  padding: 12rpx 24rpx;
  background-color: #f5f5f5;
  border-radius: 30rpx;
  text-decoration: none;
}

/* 统计栏 */
.stats-bar {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  padding: 20rpx 32rpx;
  background-color: white;
  margin-top: 2rpx;
}

.stats-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.stats-tip {
  font-size: 24rpx;
  color: #999;
}

/* 购物车列表 */
.cart-list {
  flex: 1;
  padding: 20rpx 32rpx;
  box-sizing: border-box;
}

.cart-item {
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.item-barcode {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.item-price {
  font-size: 28rpx;
  color: #ff6b35;
  font-weight: bold;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.quantity-btn {
  width: 60rpx;
  height: 60rpx;
  background-color: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: bold;
  transition: all 0.2s;
}

.quantity-btn.minus {
  color: #ff6b35;
}

.quantity-btn.plus {
  color: #ff6b35;
}

.delete-btn {
  font-size: 36rpx;
  color: #ff4444;
  padding: 10rpx;
}

.quantity {
  font-size: 32rpx;
  font-weight: bold;
  min-width: 60rpx;
  text-align: center;
}

/* 空状态 */
.empty-cart {
  text-align: center;
  padding: 160rpx 0;
  color: #999;
}

.empty-icon {
  font-size: 120rpx;
  display: block;
  margin-bottom: 30rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  display: block;
  margin-bottom: 16rpx;
  color: #666;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
}

/* 底部总价栏 */
.footer-bar {
  background-color: white;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #e9e9e9;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.total-info {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 16rpx;
}

.total-label {
  font-size: 28rpx;
  color: #666;
}

.total-price {
  font-size: 48rpx;
  font-weight: bold;
  color: #ff6b35;
  letter-spacing: 1rpx;
}

.action-buttons {
  display: flex;
  flex-shrink: 0;
  gap: 20rpx;
  width: 300rpx;
}

.action-btn {
  font-size: 28rpx;
  padding: 16rpx 10rpx;
  border-radius: 44rpx;
  background-color: #f5f5f5;
}

.clear-btn {
  color: #999;
}

.round-btn {
  background-color: #fff5f0;
  color: #ff6b35;
}

.btn-hover {
  opacity: 0.7;
}

/* 🎯 底部扫码区域 */
.scan-area {
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%);
  padding: 28rpx 32rpx;
  margin: 20rpx 32rpx 40rpx;
  border-radius: 80rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.35);
  transition: all 0.2s ease;
}

.scan-hover {
  transform: scale(0.96);
  opacity: 0.9;
}

.scan-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}

.scan-icon {
  font-size: 52rpx;
  color: white;
}

.scan-text {
  font-size: 34rpx;
  font-weight: bold;
  color: white;
  letter-spacing: 2rpx;
}
```

### 5.3 cashier.js - 核心逻辑

```javascript
const storage = require('../../utils/storage');

Page({
  data: {
    cartItems: [],
    totalPrice: 0,
    totalPriceText: '¥0.00',
    itemCount: 0
  },

  onShow() {
    this.loadCartFromStorage();
  },

  loadCartFromStorage() {
    const cart = storage.getCart();
    const items = cart.items || [];
    const totalPrice = this.calcTotalPrice(items);
    const itemCount = items.reduce(function (sum, item) { return sum + item.quantity; }, 0);

    this.setData({
      cartItems: items,
      totalPrice: totalPrice,
      totalPriceText: '¥' + totalPrice.toFixed(2),
      itemCount: itemCount
    });
  },

  saveCartToStorage() {
    storage.saveCartItems(this.data.cartItems);
  },

  async onScanTap() {
    try {
      const scanRes = await wx.scanCode({
        onlyFromCamera: true,
        scanType: ['barCode', 'qrCode']
      });

      const barcode = scanRes.result;
      const goods = storage.findGoodsByBarcode(barcode);

      if (goods) {
        this.addToCart(goods);
        this.scanFeedback(true);
      } else {
        this.showCreateGoodsModal(barcode);
      }

    } catch (err) {
      if (err.errMsg !== 'scanCode:fail cancel') {
        wx.showToast({ title: '扫码失败', icon: 'error' });
      }
    }
  },

  addToCart(goods) {
    const existingIndex = this.data.cartItems.findIndex(
      function (item) { return item.barcode === goods.barcode; }
    );

    let newCartItems = this.data.cartItems.slice();

    if (existingIndex >= 0) {
      newCartItems[existingIndex] = {
        ...newCartItems[existingIndex],
        quantity: newCartItems[existingIndex].quantity + 1
      };
    } else {
      newCartItems.push({
        barcode: goods.barcode,
        name: goods.name,
        price: goods.price,
        quantity: 1,
        addedAt: Date.now()
      });
    }

    const totalPrice = this.calcTotalPrice(newCartItems);
    const itemCount = newCartItems.reduce(function (sum, item) { return sum + item.quantity; }, 0);

    this.setData({
      cartItems: newCartItems,
      totalPrice: totalPrice,
      totalPriceText: '¥' + totalPrice.toFixed(2),
      itemCount: itemCount
    });

    this.saveCartToStorage();
    wx.showToast({ title: '已添加', icon: 'success' });
  },

  showCreateGoodsModal(barcode) {
    wx.showModal({
      title: '发现新商品',
      content: '是否立即添加？',
      confirmText: '添加',
      cancelText: '暂不',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/goods/goods?action=add&barcode=' + encodeURIComponent(barcode)
          });
        }
      }
    });
  },

  updateQuantity(e) {
    const barcode = e.currentTarget.dataset.barcode;
    const delta = parseInt(e.currentTarget.dataset.delta);
    let newCartItems = this.data.cartItems.slice();
    const index = newCartItems.findIndex(function (item) { return item.barcode === barcode; });

    if (index >= 0) {
      const newQuantity = newCartItems[index].quantity + delta;

      if (newQuantity <= 0) {
        newCartItems.splice(index, 1);
      } else {
        newCartItems[index] = {
          ...newCartItems[index],
          quantity: newQuantity
        };
      }

      const totalPrice = this.calcTotalPrice(newCartItems);
      const itemCount = newCartItems.reduce(function (sum, item) { return sum + item.quantity; }, 0);

      this.setData({
        cartItems: newCartItems,
        totalPrice: totalPrice,
        totalPriceText: '¥' + totalPrice.toFixed(2),
        itemCount: itemCount
      });

      this.saveCartToStorage();
    }
  },

  removeItem(e) {
    const barcode = e.currentTarget.dataset.barcode;
    const newCartItems = this.data.cartItems.filter(function (item) { return item.barcode !== barcode; });
    const totalPrice = this.calcTotalPrice(newCartItems);
    const itemCount = newCartItems.reduce(function (sum, item) { return sum + item.quantity; }, 0);

    this.setData({
      cartItems: newCartItems,
      totalPrice: totalPrice,
      totalPriceText: '¥' + totalPrice.toFixed(2),
      itemCount: itemCount
    });

    this.saveCartToStorage();
    wx.showToast({ title: '已删除', icon: 'success' });
  },

  clearCart() {
    if (this.data.cartItems.length === 0) {
      wx.showToast({ title: '购物车已空', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有商品吗？',
      confirmColor: '#ff6b35',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            cartItems: [],
            totalPrice: 0,
            totalPriceText: '¥0.00',
            itemCount: 0
          });
          storage.clearCart();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  roundDown() {
    if (this.data.totalPrice === 0) {
      wx.showToast({ title: '没有需要抹零的商品', icon: 'none' });
      return;
    }

    const rounded = Math.floor(this.data.totalPrice);
    const saved = this.data.totalPrice - rounded;

    wx.showModal({
      title: '抹零确认',
      content: '原价 ¥' + this.data.totalPrice.toFixed(2) + '\n抹零后实收 ¥' + rounded.toFixed(2) + '\n为顾客节省 ¥' + saved.toFixed(2),
      confirmText: '确认收款',
      confirmColor: '#ff6b35',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '应收 ¥' + rounded.toFixed(2) + ' 元', icon: 'success' });
          const settings = storage.getSettings();
          if (settings && settings.autoClear) {
            setTimeout(() => {
              this.clearCart();
            }, 1500);
          }
        }
      }
    });
  },

  calcTotalPrice(items) {
    return items.reduce(function (sum, item) { return sum + (item.price * item.quantity); }, 0);
  },

  scanFeedback(success) {
    if (success) {
      const settings = storage.getSettings();
      if (settings && settings.scanVibrate !== false) {
        wx.vibrateShort({ type: 'light' });
      }
    }
  }
});
```

**要点**：
- 必须通过 `require('../../utils/storage')` 引入存储模块
- `data` 包含 `totalPriceText`（字符串 `"¥X.XX"`），非直接模板计算
- 扫码取消时需捕获 `scanCode:fail cancel` 错误，静默处理
- 购物车项以 `barcode` 为键，同条码累加数量，无独立 `id`
- 数据变更后调用 `storage.saveCartItems()` 持久化，非直接 `wx.setStorageSync`
- `clearCart()` 使用 `storage.clearCart()` 而非 `wx.removeStorageSync`
- 无独立的 `showToast` 辅助方法，直接调用 `wx.showToast`

### 5.4 cashier.json

```json
{
  "navigationBarBackgroundColor": "#ffffff",
  "navigationBarTitleText": "收银计价",
  "navigationBarTextStyle": "black",
  "backgroundColor": "#f5f5f5",
  "enablePullDownRefresh": false
}
```

---

## 六、商品管理页面

### 6.1 goods.wxml - 布局

```html
<view class="container">
  <!-- 顶部操作栏 -->
  <view class="action-bar">
    <view class="action-box">
      <button class="action-btn add-btn" bindtap="addGoods" hover-class="btn-hover">
        <text class="btn-icon">➕</text>
        <text>新增</text>
      </button>
    </view>
    <view class="search-box">
      <text class="search-icon">🔍</text>
      <input class="search-input" placeholder="搜索商品名称或条码" bindinput="onSearchInput" />
    </view>
    <view class="action-box">
      <button class="action-btn more-btn" bindtap="showMoreMenu" hover-class="btn-hover">
        <text class="btn-icon">⋯</text>
      </button>
    </view>
  </view>

  <!-- 统计信息 -->
  <view class="stats-bar">
    <text class="stats-text">共 {{goodsList.length}} 件商品</text>
    <text class="stats-tip">长按商品可编辑</text>
  </view>

  <!-- 商品列表 -->
  <scroll-view class="goods-list" scroll-y enhanced>
    <view wx:for="{{goodsList}}" wx:key="id" class="goods-item card" 
          bindlongpress="editGoods" data-goods="{{item}}">
      <view class="goods-info">
        <text class="goods-name">{{item.name}}</text>
        <text class="goods-barcode">{{item.barcode || '无条码'}}</text>
      </view>
      <view class="goods-right">
        <text class="goods-price">¥{{item.price}}</text>
        <view class="delete-icon" catchtap="deleteGoods" data-id="{{item.id}}" data-name="{{item.name}}">
          🗑️
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view wx:if="{{goodsList.length === 0}}" class="empty-goods">
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无商品</text>
      <text class="empty-tip">点击右上角「新增商品」添加</text>
    </view>
  </scroll-view>
</view>

<!-- 新增/编辑商品弹窗 -->
<view class="modal-mask" wx:if="{{showModal}}" bindtap="closeModal">
  <view class="modal-container" catchtap="preventClose">
    <view class="modal-title">{{modalTitle}}</view>

    <!-- 条码输入 -->
    <view class="form-item">
      <text class="form-label">商品条码</text>
      <view class="barcode-input">
        <input class="form-input" placeholder="扫码或手动输入" value="{{formData.barcode}}" bindinput="onFormInput" data-field="barcode" />
        <button class="scan-barcode-btn" bindtap="scanBarcodeForForm" size="mini">扫码</button>
      </view>
    </view>

    <!-- 名称输入 -->
    <view class="form-item">
      <text class="form-label">商品名称 *</text>
      <input class="form-input" placeholder="例：可口可乐 500ml" value="{{formData.name}}" bindinput="onFormInput" data-field="name" />
    </view>

    <!-- 价格输入 -->
    <view class="form-item">
      <text class="form-label">售价（元）*</text>
      <input class="form-input" type="digit" placeholder="0.00" value="{{formData.price}}" bindinput="onFormInput" data-field="price" />
    </view>

    <!-- 按钮组 -->
    <view class="modal-buttons">
      <button class="modal-btn cancel-btn" bindtap="closeModal">取消</button>
      <button class="modal-btn confirm-btn" bindtap="saveGoods">保存</button>
    </view>
  </view>
</view>
```

### 6.2 goods.wxss - 样式

```css
@import '/app.wxss';

/* 操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 32rpx;
  background-color: white;
  border-bottom: 1rpx solid #e9e9e9;
  box-sizing: border-box;
}

.action-btn {
  display: inline;
  gap: 8rpx;
  padding: 16rpx 20rpx;
  background-color: #f5f5f5;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1;
}

.btn-icon {
  font-size: 32rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 40rpx;
  padding: 12rpx 24rpx;
  gap: 12rpx;
  flex: 1;
}

.search-icon {
  font-size: 28rpx;
  color: #999;
}

.search-input {
  font-size: 28rpx;
  background: transparent;
}

/* 统计栏 */
.stats-bar {
  padding: 20rpx 32rpx;
  background-color: white;
  margin-top: 2rpx;
  display: flex;
  justify-content: space-between;
}

.stats-text {
  font-size: 26rpx;
  color: #666;
}

.stats-tip {
  font-size: 22rpx;
  color: #999;
}

/* 商品列表 */
.goods-list {
  flex: 1;
  padding: 20rpx 32rpx;
  box-sizing: border-box;
}

.goods-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.goods-info {
  flex: 1;
}

.goods-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.goods-barcode {
  font-size: 22rpx;
  color: #999;
}

.goods-right {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.goods-price {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff6b35;
}

.delete-icon {
  font-size: 40rpx;
  color: #ff4444;
  padding: 10rpx;
  opacity: 0.6;
}

/* 空状态 */
.empty-goods {
  text-align: center;
  padding: 180rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  display: block;
  margin-bottom: 30rpx;
  opacity: 0.4;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 80%;
  background-color: white;
  border-radius: 32rpx;
  padding: 40rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.form-input {
  width: 100%;
  padding: 0 20rpx;
  background-color: #f5f5f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  height: 80rpx;
  line-height: 80rpx;
  box-sizing: border-box;
}

.barcode-input {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.barcode-input .form-input {
  flex: 1;
}

.scan-barcode-btn {
  background-color: #ff6b35;
  color: white;
  font-size: 24rpx;
  padding: 16rpx 24rpx;
  border-radius: 40rpx;
  line-height: 1;
  width: auto;
}

.modal-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.modal-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 44rpx;
  font-size: 28rpx;
  text-align: center;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background-color: #ff6b35;
  color: white;
}
```

### 6.3 goods.js - 逻辑

```javascript
const storage = require('../../utils/storage');

Page({
  data: {
    goodsList: [],
    searchKeyword: '',
    showModal: false,
    modalTitle: '新增商品',
    formData: {
      id: '',
      barcode: '',
      name: '',
      price: ''
    },
    isEdit: false
  },

  onLoad(options) {
    this.loadGoodsList();

    if (options.action === 'add' && options.barcode) {
      this.setData({
        showModal: true,
        'formData.barcode': decodeURIComponent(options.barcode)
      });
    }
  },

  onShow() {
    this.loadGoodsList();
  },

  loadGoodsList() {
    const goodsList = storage.getGoodsList();
    this.setData({ goodsList: goodsList || [] });
  },

  saveGoodsDB(goodsList) {
    storage.saveGoodsList(goodsList);
    this.loadGoodsList();
  },

  addGoods() {
    this.setData({
      showModal: true,
      modalTitle: '新增商品',
      isEdit: false,
      formData: {
        id: '',
        barcode: '',
        name: '',
        price: ''
      }
    });
  },

  editGoods(e) {
    const goods = e.currentTarget.dataset.goods;
    this.setData({
      showModal: true,
      modalTitle: '编辑商品',
      isEdit: true,
      formData: {
        id: goods.id,
        barcode: goods.barcode,
        name: goods.name,
        price: goods.price.toString()
      }
    });
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const data = {};
    data['formData.' + field] = e.detail.value;
    this.setData(data);
  },

  async scanBarcodeForForm() {
    try {
      const scanRes = await wx.scanCode({
        onlyFromCamera: true,
        scanType: ['barCode']
      });
      this.setData({
        'formData.barcode': scanRes.result
      });
    } catch (err) {
      if (err.errMsg !== 'scanCode:fail cancel') {
        wx.showToast({ title: '扫码失败', icon: 'error' });
      }
    }
  },

  saveGoods() {
    const id = this.data.formData.id;
    const barcode = this.data.formData.barcode;
    const name = this.data.formData.name;
    const price = this.data.formData.price;

    if (!name.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }

    const newGoods = {
      id: this.data.isEdit ? id : storage.generateId(),
      barcode: barcode.trim(),
      name: name.trim(),
      price: parseFloat(price),
      createTime: this.data.isEdit
        ? (storage.findGoodsById(id) || {}).createTime || Date.now()
        : Date.now(),
      updateTime: Date.now()
    };

    let newGoodsList;
    if (this.data.isEdit) {
      newGoodsList = this.data.goodsList.map(function (g) {
        return g.id === id ? newGoods : g;
      });
    } else {
      const exists = this.data.goodsList.some(function (g) { return g.barcode === barcode; });
      if (exists) {
        wx.showToast({ title: '条码已存在', icon: 'error' });
        return;
      }
      newGoodsList = [newGoods].concat(this.data.goodsList);
    }

    this.saveGoodsDB(newGoodsList);
    this.closeModal();
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  deleteGoods(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除「' + name + '」吗？',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          const newGoodsList = this.data.goodsList.filter(function (g) { return g.id !== id; });
          this.saveGoodsDB(newGoodsList);
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  onSearchInput(e) {
    const keyword = e.detail.value.toLowerCase();
    this.setData({ searchKeyword: keyword });

    if (!keyword) {
      this.loadGoodsList();
      return;
    }

    const allGoods = storage.getGoodsList();
    const filtered = allGoods.filter(function (g) {
      return g.name.toLowerCase().includes(keyword) || (g.barcode && g.barcode.includes(keyword));
    });
    this.setData({ goodsList: filtered });
  },

  showMoreMenu() {
    wx.showActionSheet({
      itemList: ['导出数据（备份）', '导入数据（恢复）', '重置为演示数据'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0: this.exportData(); break;
          case 1: this.importData(); break;
          case 2: this.resetToDemo(); break;
        }
      }
    });
  },

  exportData() {
    const goodsDB = storage.getGoodsDB();
    const dataStr = JSON.stringify(goodsDB, null, 2);

    wx.setClipboardData({
      data: dataStr,
      success: () => {
        wx.showToast({ title: '数据已复制', icon: 'success' });
        wx.showModal({
          title: '备份提示',
          content: '数据已复制到剪贴板。请打开备忘录或文件 App 粘贴保存，换手机时可导入恢复。',
          showCancel: false
        });
      }
    });
  },

  importData() {
    wx.showModal({
      title: '导入数据',
      content: '请粘贴之前备份的 JSON 数据',
      editable: true,
      placeholderText: '粘贴 JSON 数据...',
      success: (res) => {
        if (res.confirm && res.content) {
          try {
            const importedDB = JSON.parse(res.content);
            if (importedDB.goods && Array.isArray(importedDB.goods)) {
              storage.saveGoodsList(importedDB.goods);
              this.loadGoodsList();
              wx.showToast({ title: '导入成功', icon: 'success' });
            } else {
              throw new Error('格式错误');
            }
          } catch (err) {
            wx.showToast({ title: '数据格式错误', icon: 'error' });
          }
        }
      }
    });
  },

  resetToDemo() {
    wx.showModal({
      title: '重置数据',
      content: '这将清空所有商品，恢复为演示数据。确定吗？',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          const demoGoods = [
            { id: 'g_001', barcode: '6901234567890', name: '可口可乐 500ml', price: 3.00, createTime: Date.now(), updateTime: Date.now() },
            { id: 'g_002', barcode: '6912345678901', name: '康师傅方便面', price: 2.50, createTime: Date.now(), updateTime: Date.now() },
            { id: 'g_003', barcode: '6923456789012', name: '农夫山泉 550ml', price: 1.50, createTime: Date.now(), updateTime: Date.now() },
            { id: 'g_004', barcode: '6934567890123', name: '双汇火腿肠', price: 1.00, createTime: Date.now(), updateTime: Date.now() },
            { id: 'g_005', barcode: '6945678901234', name: '中华牙膏', price: 3.50, createTime: Date.now(), updateTime: Date.now() }
          ];
          storage.saveGoodsList(demoGoods);
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  },

  closeModal() {
    this.setData({ showModal: false });
  },

  preventClose() { }
});
```

**要点**：
- 通过 `require('../../utils/storage')` 引入存储模块
- 收银页跳转过来的 `barcode` 参数需用 `decodeURIComponent` 解码
- 编辑时保留原 `createTime` 通过 `storage.findGoodsById()`
- 使用 `storage.generateId()` 生成 ID（格式：`g_` + 时间戳 + `_` + 6 位随机 base36）
- 新商品使用 `.concat()` 方式头部插入
- 搜索时使用 `storage.getGoodsList()`，非直接 `wx.getStorageSync`

### 6.4 goods.json

```json
{
  "navigationBarBackgroundColor": "#ffffff",
  "navigationBarTitleText": "商品管理",
  "navigationBarTextStyle": "black",
  "backgroundColor": "#f5f5f5"
}
```

---

## 七、工具函数（utils/storage.js）

```javascript
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
```

**要点**：
- 使用独立函数导出（非对象方式），方便按需引入
- 所有函数使用 ES5 `function` 关键字（非箭头函数）
- `saveCartItems` 自动计算 `totalPrice` 和 `itemCount`
- `generateId` 使用 `substring(2, 8)`（非已弃用的 `substr`）

---

## 八、project.config.json

```json
{
  "description": "便利收银助手 - 小卖部快速扫码计价工具",
  "packOptions": {
    "ignore": [],
    "include": []
  },
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": false,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "enableEngineNative": false,
    "useIsolateContext": true,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "showES6CompileOption": false,
    "condition": false,
    "compileWorklet": false,
    "minifyWXML": true,
    "localPlugins": false,
    "disableUseStrict": false,
    "useCompilerPlugins": false,
    "swc": false,
    "disableSWC": true
  },
  "compileType": "miniprogram",
  "libVersion": "3.5.0",
  "appid": "wx7af63a5bbe6626f3",
  "projectname": "convenience-cashier",
  "condition": {},
  "editorSetting": {
    "tabIndent": "insertSpaces",
    "tabSize": 2
  },
  "simulatorPluginLibVersion": {}
}
```

---

## 九、sitemap.json

```json
{
  "desc": "关于本文件的更多信息，请参考文档 https://developers.weixin.qq.com/miniprogram/dev/framework/sitemap.html",
  "rules": [{
    "action": "allow",
    "page": "*"
  }]
}
```

---

## 十、project.private.config.json（开发覆盖）

```json
{
  "libVersion": "3.5.0",
  "projectname": "miniprogram",
  "condition": {},
  "setting": {
    "urlCheck": false,
    "coverView": true,
    "lazyloadPlaceholderEnable": false,
    "skylineRenderEnable": false,
    "preloadBackgroundData": false,
    "autoAudits": false,
    "useApiHook": true,
    "showShadowRootInWxmlPanel": true,
    "useStaticServer": false,
    "useLanDebug": false,
    "showES6CompileOption": false,
    "compileHotReLoad": true,
    "checkInvalidKey": true,
    "ignoreDevUnusedFiles": true,
    "bigPackageSizeSupport": false,
    "useIsolateContext": true
  }
}
```

---

## 十一、样式与设计规范

- **主色调**: `#ff6b35`（橙色），渐变使用 `#ff6b35 → #ff8c5a`
- **CSS 单位**: 统一使用 `rpx`，不使用 `px`
- **设计风格**: 卡片式（`border-radius: 20rpx`，`box-shadow: 0 2rpx 10rpx`），白底，圆角按钮
- **弹窗确认按钮颜色**: 普通操作为 `#ff6b35`，危险操作为 `#ff4444`

---

## 十二、导航与数据流规范

### 页面路由
- `index`（首页）→ `wx.navigateTo` → `cashier` 或 `goods`
- `cashier` → `<navigator>` → `goods`；或扫码未找到 → `wx.navigateTo` → `goods?action=add&barcode=...`
- 无 tabBar，所有页面跳转使用 `wx.navigateTo`

### 购物车数据流
1. `onShow()` 从 storage 重新加载购物车
2. 每次增删改操作后调用 `saveCartItems()` 持久化
3. `setData` 同时更新 `totalPrice`（Number）和 `totalPriceText`（String `"¥X.XX"`）
4. 必须更新 `cartItems` + `totalPrice` + `totalPriceText` + `itemCount` 四个字段

### 商品 ID 格式
- `g_` + `Date.now()` + `_` + 6 位随机 base36 字符
- 示例：`g_1715000000000_a1b2c3`

### 扫码交互
- `wx.scanCode({ onlyFromCamera: true, scanType: ['barCode', 'qrCode'] })`
- 用户取消扫码时捕获 `scanCode:fail cancel` 错误，静默处理
- 扫码成功：条码存在于商品库 → 加入购物车；不存在 → 弹窗引导跳转商品页新增

### 购物车身份
- 购物车项以 `barcode` 为唯一键，同条码累加 `quantity`
- 购物车项不存储 `id` 字段

---

## 十三、本地存储结构

```
goods_db: {
  version: "1.0",
  lastUpdate: number,
  goods: [{ id, barcode, name, price, createTime, updateTime }]
}

cart: {
  items: [{ barcode, name, price, quantity, addedAt }],
  totalPrice: number,
  itemCount: number,
  lastUpdate: number
}

settings: {
  scanVibrate: boolean,
  autoClear: boolean
}
```

---

## 十四、AI 开发注意事项

1. **完全免费**：不使用云开发、云函数、后端服务，所有数据仅用 `wx.setStorageSync`
2. **存储必须通过 `utils/storage.js`**：页面代码不得直接调用 `wx.getStorageSync` / `wx.setStorageSync`
3. **3 个页面**：`index`（入口导航）→ `cashier`（收银计价）→ `goods`（商品管理），无 tabBar
4. **收银页底部固定扫码按钮**：大圆角橙色渐变按钮，点击调起扫码
5. **购物车操作**：扫码加商品、数量增删、删除、清空确认、抹零（向下取整）
6. **商品管理**：增删改查、搜索过滤、长按编辑、导入导出数据备份、重置演示数据
7. **扫码反馈**：成功时震动（`wx.vibrateShort({ type: 'light' })`），受设置控制
8. **JS 风格**：`utils/storage.js` 使用 ES5 `function`，页面代码使用 `const`/箭头函数/`async/await`（两者均可）
9. **无 UI 组件库 / npm 依赖**：纯原生开发
10. **调试**：需在微信开发者工具中运行，不支持 Node.js CLI 调试

---

**文档结束** | 版本 1.0 | 已根据实际代码库同步更新
