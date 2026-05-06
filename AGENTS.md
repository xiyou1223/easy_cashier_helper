# AGENTS.md — 便利收银助手 (WeChat Mini-Program)

## Project Overview

WeChat mini-program for barcode-scanning checkout in convenience stores. Pure local storage (no cloud services). 3 pages, 1 shared utility module.

## Tech Stack

- **Framework**: WeChat mini-program native (app.js/app.json/app.wxss)
- **Storage**: `wx.setStorageSync` only — no cloud, no backend, no npm
- **Base lib**: 3.5.0+ (`libVersion`)
- **Compatibility**: iOS 12.0+, Android 7.0+, WeChat 8.0+
- **Editor**: `tabSize: 2`, `insertSpaces`

## Repo Layout

```
├── AGENTS.md                          # This file
├── 小卖部快速扫码计价器 - AI 开发文档 v1.0.md  # Original spec doc (reference only — actual code may diverge)
└── miniprogram/
    ├── app.js                         # Global lifecycle, storage init, demo data seeding
    ├── app.json                       # Page routes, window config (NO tabBar)
    ├── app.wxss                       # Global styles (container, card, ellipsis, button reset)
    ├── project.config.json            # WeChat project config (appid: wx7af63a5bbe6626f3)
    ├── project.private.config.json    # Local dev overrides
    ├── sitemap.json
    ├── .gitignore
    ├── images/                        # Empty — add tabBar/tool icons here when needed
    ├── utils/
    │   └── storage.js                 # Centralized storage wrapper — THE data layer
    └── pages/
        ├── index/                     # Landing / navigation hub (first page)
        ├── cashier/                   # Main scanner + checkout page
        └── goods/                     # Product CRUD + search + import/export
```

## Critical Architecture Rules

### 1. Storage must go through `utils/storage.js`

Every page imports storage via `require('../../utils/storage')`. NEVER call `wx.setStorageSync` / `wx.getStorageSync` directly in page code. The module exports:

| Export | Purpose |
|--------|---------|
| `KEYS` | Storage key constants |
| `getGoodsDB()` / `saveGoodsDB()` | Full goods DB (version + goods array) |
| `getGoodsList()` / `saveGoodsList()` | Just the goods array |
| `findGoodsById()` / `findGoodsByBarcode()` | Lookup helpers |
| `getCart()` / `saveCart()` / `getCartItems()` / `saveCartItems()` / `clearCart()` | Cart operations |
| `getSettings()` / `saveSettings()` | User settings |
| `generateId()` | Generate unique ID (`g_` + timestamp + random) |

### 2. Storage keys (DO NOT change without migration)

- `goods_db` — `{ version, lastUpdate, goods: [...] }`
- `cart` — `{ items: [...], totalPrice, itemCount, lastUpdate }`
- `settings` — `{ scanVibrate: bool, autoClear: bool }`

### 3. Page routes — no tabBar

`app.json` lists 3 pages in order: `index` → `cashier` → `goods`. There is NO `tabBar` configured — navigation uses `wx.navigateTo` / `<navigator>`. **index** is the entry page redirecting to cashier/goods.

### 4. Cart item identity

Items in the cart are keyed by **barcode** (not by ID). Same barcode = same item, quantity increments. Goods DB items have an `id` field, but cart items do not store `id`.

### 5. Scanner handling

`wx.scanCode` is called with `onlyFromCamera: true`, `scanType: ['barCode', 'qrCode']`. When user cancels scan, error `scanCode:fail cancel` MUST be caught silently. On scan success: if barcode exists in DB, add to cart (increment quantity); if not, show modal → navigate to goods page with `?action=add&barcode=...`.

## Conventions

- **Primary color**: `#ff6b35` (orange) — gradients use `#ff6b35 → #ff8c5a`
- **CSS units**: `rpx` everywhere — never `px`
- **Design**: Card-style (`border-radius: 20rpx`, `box-shadow: 0 2rpx 10rpx`), white backgrounds, rounded buttons
- **JS style**: mixed — `utils/storage.js` uses ES5 `function`; page code uses `const`, arrow functions, and `async/await`. Both are acceptable (`es6: true` in config).
- **Cart data flow**: `onShow()` reloads from storage, every mutation calls `saveCartItems()` + refreshes `totalPrice`/`itemCount`/`totalPriceText` via `setData`
- **Toast helper**: `wx.showToast({ icon: 'error' | 'success' | 'none' })` used directly (no wrapper)
- **Modal confirm color**: `confirmColor: '#ff6b35'` for normal, `'#ff4444'` for destructive actions
- **Goods ID format**: `g_` + `Date.now()` + `_` + 6-char random base36

## Commands & Workflow

- **No build system** — code is run directly by WeChat dev tools
- **No test framework** — manual testing in WeChat dev tools / real device
- **No npm** — `node_modules/` is gitignored; `project.config.json` has `nodeModules: false`
- **Hot reload**: `compileHotReLoad: true` in private config (dev tools)
- **Git**: single initial commit; no branch conventions documented
- **Debugging**: Use WeChat DevTools, not Node.js CLI

## Things Agents Often Get Wrong

1. **Don't add a tabBar** — the spec doc describes one but the actual code uses an index landing page with `navigateTo`. Adding a tabBar would break the current navigation pattern.
2. **Don't add cloud services** — the app is purely local storage. No `wx.cloud`, no server endpoints.
3. **`helper.js` doesn't exist** — the spec mentions a `utils/helper.js` but it was never created. Don't `require` it.
4. **`components/` doesn't exist** — cart-item component from the spec was never extracted.
5. **`images/` is empty** — tabBar icons were never added (the spec mentions them but they don't exist).
6. **Index page is the entry**, not cashier — `app.json` lists `pages/index/index` first.
7. **Cart total is stored as a formatted string** (`totalPriceText`) — not just a number. Always update both `totalPrice` (Number) and `totalPriceText` (String `'¥X.XX'`).
8. **Storage module uses `function` not arrow** — keep consistent when adding utilities there.
