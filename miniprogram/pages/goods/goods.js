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
