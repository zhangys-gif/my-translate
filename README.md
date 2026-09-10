# GitHub Translator

一个面向 GitHub 网页的浏览器翻译扩展 MVP，目标是帮你更顺手地浏览 GitHub。

## 当前能力

1. 自动把 GitHub 常见界面元素翻译成中文。
2. 支持对 README、Issue、Pull Request、评论等正文区域做整段中文翻译。
3. 正文翻译走 OpenAI 兼容接口，你可以接自己的模型服务。

## 项目结构

- `manifest.json`: Chrome/Edge 扩展配置
- `content.js`: GitHub 页面内的 UI 翻译与正文翻译注入
- `background.js`: 调用大模型翻译接口
- `popup.html` / `popup.js` / `popup.css`: 扩展弹窗设置页

## 本地安装

1. 打开 Chrome 或 Edge。
2. 进入扩展管理页，例如 `chrome://extensions/`。
3. 打开“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择当前项目目录。

## 使用方法

1. 打开任意 GitHub 页面。
2. 点击扩展图标。
3. 勾选“启用 GitHub 界面翻译”。
4. 如果要翻译 README / Issue / PR 正文，填写：
   - `API Base URL`
   - `API Key`
   - `Model`
5. 点击“保存设置”。
6. 点击“翻译当前页正文”。

## 推荐接口格式

- OpenAI 官方：`https://api.openai.com/v1`
- OpenAI 兼容中转服务：填写服务根地址或 `v1` 地址都可以

## 下一步适合增强的方向

1. 增加更完整的 GitHub 术语词典。
2. 对代码块、表格、引用块做更细的保留处理。
3. 增加“悬浮显示原文/译文对照”模式。
4. 增加仓库首页自动翻译按钮，而不是每次手动点击弹窗。
