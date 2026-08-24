# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [Unreleased]

#### Features
* **Firefox 适配**：`manifest.json` 新增 `browser_specific_settings.gecko`（Firefox 发布必需，Chrome 会自动忽略），固定扩展 ID 为 `timeror@qq.com`，`strict_min_version` 设为 `109.0`。插件本身已采用 Manifest V3 及 `chrome.*` 兼容 API，Firefox 109+ 可直接上架，无需改动业务代码。
* **构建/发布脚本**：`package.json` 新增 `pack:firefox`（`web-ext build`）与 `lint:firefox`（`web-ext lint`）脚本，并加入 `web-ext` 开发依赖，便于本地打包与 AMO 上架前自检。

#### Bug Fixes
* **孔夫子价格取价逻辑**：调整 `fetchKongfzPrice` 的均价计算方式——在按价格升序排序后，跳过最低价（`skipLowest`，默认 1 条），再取其后 `sampleCount`（本次设为 2）条结果求平均，即取**第 2、第 3 条结果的平均值**作为最终价格。修复此前取价可能受异常最低价干扰的问题；返回数据中恢复 `sampleCount` / `skipLowest` 字段以便追溯取样范围。`content.js` 的 `CONFIG` 同步将 `sampleCount` 调整为 `2`、`skipLowest` 保持 `1`。
* **Firefox 上架校验修复（data_collection_permissions）**：`manifest.json` 的 `browser_specific_settings.gecko` 新增 `data_collection_permissions`（`data_collection: true`，并声明 `extensions_tos_url` / `extensions_privacy_policy_url`）。原因：AMO 对所有新 Firefox 扩展强制要求该字段；插件将用户浏览的书的 ISBN 发往第三方书商 API 查价，属于向第三方传输数据，故如实声明。注意：两个 URL 当前为占位（`douban-books-plus.pages.dev/privacy.html`），需替换为真实可访问的隐私政策页面以满足人工审核。
* **Firefox 上架校验修复**：
  - `manifest.json` 的 `background` 由 `service_worker` 改为 `scripts: ["background.js"]`。原因：Firefox MV3 的 addons-linter 不支持 `background.service_worker` 字段（报 `MANIFEST_FIELD_UNSUPPORTED` 硬错），而 Chrome MV3 同样接受 `background.scripts`，故改为双平台通用写法。
  - `content.js` 中 4 处 `innerHTML` 模板拼接（多抓鱼价格链接、小谷吖/多抓鱼/漫游鲸二维码弹窗）改为 `document.createElement` + `textContent`/`setAttribute` 的安全构造，消除 `UNSAFE_VAR_ASSIGNMENT` 警告。本地 `web-ext lint` 现已 `errors/warnings/notices` 全为 0。

### [1.0.9](https://github.com/DoubanBooks/extension/compare/v1.0.8...v1.0.9) (2026-06-02)

### [1.0.8](https://github.com/DoubanBooks/extension/compare/v1.0.7...v1.0.8) (2026-06-02)

### [1.0.7](https://github.com/DoubanBooks/extension/compare/v1.0.6...v1.0.7) (2026-06-02)

### [1.0.6](https://github.com/DoubanBooks/extension/compare/v1.0.5...v1.0.6) (2026-06-02)

### [1.0.5](https://github.com/DoubanBooks/extension/compare/v1.0.4...v1.0.5) (2026-06-02)


### Bug Fixes

* 修复漫游鲸价格显示和链接问题 ([42d3d87](https://github.com/DoubanBooks/extension/commit/42d3d87726e93a0b3a04e99b33ea7bf7919b4734))
* handle each price source independently to avoid blocking ([2c77a43](https://github.com/DoubanBooks/extension/commit/2c77a4376db8ac41c80df2b23ad39859a3347e05))

### [1.0.4](https://github.com/DoubanBooks/extension/compare/v1.0.3...v1.0.4) (2026-06-02)

### [1.0.3](https://github.com/DoubanBooks/extension/compare/v1.0.2...v1.0.3) (2026-06-02)

### [1.0.2](https://github.com/DoubanBooks/extension/compare/v1.0.1...v1.0.2) (2026-06-02)

### 1.0.1 (2026-06-02)
