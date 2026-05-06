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

  findGoodsByBarcode(barcode) {
    return storage.findGoodsByBarcode(barcode);
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
