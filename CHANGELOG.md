# Changelog

This project follows Semantic Versioning. Versions below `1.0.0` may include
incompatible changes.

## [Unreleased]

## [0.1.0] - 2026-09-17

<div lang="en-US">

### English

- A search whose whole query is a DOI goes to the DOI resolver instead of a page of search results.
- Watches Google, Bing, Baidu, DuckDuckGo, Sogou, 360, Brave, Yahoo, and Ecosia. Each engine can be switched off on its own.
- Additional search engines can be added. Only that site is requested, and the permission is returned when the engine is removed.
- The resolver address and the DOI matching pattern can both be changed, and the pattern is checked against the shipped examples as it is typed.
- The interface is available in 23 languages.
- Matching happens in the browser. Nothing is collected or transmitted.

</div>

<div lang="zh-CN">

### 中文

- 查询内容整体是一个 DOI 时，直接前往解析地址，不再经过搜索结果页。
- 监视 Google、Bing、百度、DuckDuckGo、搜狗、360、Brave、Yahoo 和 Ecosia，每个搜索引擎可以单独关闭。
- 可以添加其他搜索引擎。只为所填站点请求权限，删除该引擎时归还。
- 解析地址和 DOI 匹配规则都可以修改，匹配规则会随输入对照内置示例检查。
- 界面支持 23 种语言。
- 匹配在浏览器内完成，不收集也不发送任何数据。

</div>
