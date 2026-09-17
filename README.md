### [English](#english) | [中文](#%E4%B8%AD%E6%96%87)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Chromium-4285F4?logo=googlechrome&logoColor=white)
[![CI](https://github.com/SiyeW/doi-direct/actions/workflows/ci.yml/badge.svg)](https://github.com/SiyeW/doi-direct/actions/workflows/ci.yml)

<p align="center">
  <img src="icons/icon_128.png" width="128" height="128" alt="DOI Direct">
</p>

---

<div lang="en-US">

## English

### DOI Direct

A browser extension that goes straight to a DOI's resolver when you search for a DOI, instead of a page of search results.

```text
Ctrl+L
paste  10.1038/s41586-026-xxxxx
Enter
->     https://doi.org/10.1038/s41586-026-xxxxx
```

It acts only when the whole query is a DOI. `10.1038/xxxxx pdf` is left alone.

### Main features

- Resolve DOI-only searches from the address bar
- Built-in support for Google, Bing, Baidu, DuckDuckGo, Sogou, 360, Brave, Yahoo, and Ecosia, each switchable on its own
- Add your own search engine; only that one site is requested
- Point at a different resolver; the DOI is appended to it as a path
- Change the DOI matching pattern, with the shipped examples and your own input checked as you type
- Interface available in 23 languages: follow the browser, or pick one in the settings

### Installation

DOI Direct is distributed through GitHub Releases.

1. Download `doi-direct-v*.zip` from [Releases](https://github.com/SiyeW/doi-direct/releases/latest).
2. Extract it to a folder that will stay on the computer.
3. Open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Select **Load unpacked** and choose the extracted folder.
6. Pin the extension, then choose which search engines to watch in its settings.

Chrome 108 and later, and other Chromium-based browsers such as Edge.

An extension installed this way counts as a developer extension: the browser says so at startup. To update, replace the files in that folder with a newer release and reload the extension from `chrome://extensions`.

### Use

- **On/off:** Turning it off stops the redirection. No other setting changes.
- **Search engines:** Switch each built-in engine on or off. An engine you do not watch does not redirect.
- **Custom search engines:** Enter a name, host, path, and query parameter. The entry that would be created is shown first, and adding it asks for permission for that site alone.
- **Resolver:** `https://doi.org/` by default. Point it at a library or another resolver; the DOI is appended to that address as a path.
- **Matching pattern:** The default matches a query that starts with `10.` and contains a slash. The examples that should and should not match are listed below it, and a text box checks anything you type.

### Permissions

- `webRequest` - read main-frame navigation requests
- `storage` - keep your settings
- `scripting` - register a content script for search engines you add yourself
- Site access for the built-in search engines only

The `tabs` permission and access to all sites are not requested. A custom search engine asks for exactly one site, and that permission is given back when you remove it.

### Privacy

All matching happens locally. The extension collects and transmits nothing.

It does not stop the search request from reaching the search engine: by the time it reacts, the request has usually been sent already. What it saves you is the page of search results.

### Known limitations

- **Address-bar behaviour depends on the browser.** Chromium currently treats input like `10.1038/xxx` as a search query rather than a hostname. That is browser behaviour, not a contract an extension can rely on.
- **Firefox is not supported.**
- **Engines that submit searches with POST cannot be supported**, because the query never reaches the URL. Startpage and DuckDuckGo's no-JavaScript version are both like that.
- **Engines that swap results with `history.pushState` are not covered.**

### Development

The project is still under development, and the interface and workflows may change.

```text
node tests/core.test.js
```

A pre-commit hook that runs both suites lives in `tools/hooks/pre-commit`:

```powershell
Copy-Item tools/hooks/pre-commit .git/hooks/pre-commit
```

`node tools/build-release.js` runs both suites and writes `dist/doi-direct-v<version>.zip`. Pushing a `v*` tag builds that archive and creates the release; the tag has to match the version in `manifest.json`, and the release notes come from the matching entry in `CHANGELOG.md`.

```text
manifest.json
icons/             toolbar and extension-list icons
src/core/          matching, encoding, search engine rules, settings
src/background.js  service worker
src/content.js     content script
src/options/       settings page
src/popup/         toolbar popup
_locales/          interface text in 23 languages
tests/             unit tests for src/core
tools/             pre-commit hook and the release build
poc/               an earlier measurement harness
```

`poc/` is a separate tool; the extension does not depend on it. See [poc/README.md](poc/README.md).

### License

MIT


</div>

---

<div lang="zh-CN">

## 中文

### DOI Direct

一款浏览器扩展：在地址栏搜索纯 DOI 时直接前往解析地址，而不是先经过一页搜索结果。

```text
Ctrl+L
粘贴  10.1038/s41586-026-xxxxx
回车
→     https://doi.org/10.1038/s41586-026-xxxxx
```

只有整个搜索内容都是 DOI 时才跳转。`10.1038/xxxxx pdf` 保持原样。

### 主要功能

- 地址栏搜索纯 DOI 时直接跳转
- 内置 Google、Bing、百度、DuckDuckGo、搜狗、360、Brave、Yahoo、Ecosia，可以逐个开关
- 可以添加自定义搜索引擎，只为所填站点请求一次权限
- 可以改用其他解析地址，DOI 作为路径追加在其后
- 可以调整 DOI 匹配规则，示例和自填内容会实时显示匹配结果
- 界面支持 23 种语言，默认跟随浏览器，也可以在设置页指定

### 安装

DOI Direct 通过 GitHub Releases 分发。

1. 前往 [Releases](https://github.com/SiyeW/doi-direct/releases/latest) 下载 `doi-direct-v*.zip`。
2. 解压到一个会长期保留的文件夹。
3. 打开 `chrome://extensions`。
4. 打开「开发者模式」。
5. 点击「加载已解压的扩展程序」，选择解压出的文件夹。
6. 固定扩展，然后在设置页选择要监视的搜索引擎。

需要 Chrome 108 及以上，以及其他 Chromium 内核浏览器（如 Edge）。

这样安装的扩展会被 Chrome 当作开发者扩展，启动时会提示。更新时把该文件夹里的文件换成新版本，再到 `chrome://extensions` 重新加载扩展。

### 使用

- **开关：** 关闭后不再跳转，其余设置不变。
- **搜索引擎：** 在内置列表中逐个开关，不监视的引擎不会触发跳转。
- **自定义搜索引擎：** 填写名称、域名、路径和查询参数，页面先显示将要生成的条目。添加时浏览器为该站点请求一次权限。
- **解析地址：** 默认为 `https://doi.org/`，可以换成图书馆或其他解析服务。DOI 作为路径追加到该地址之后。
- **匹配规则：** 默认规则匹配以 `10.` 开头并含斜杠的搜索内容。规则下方列出应匹配和不应匹配的示例，另有输入框可以试验任意内容。

### 权限

- `webRequest`：读取主框架导航请求
- `storage`：保存设置
- `scripting`：为自行添加的搜索引擎注册内容脚本
- 仅内置搜索引擎的站点权限

不申请 `tabs` 权限，也不申请所有网站的访问权限。添加自定义搜索引擎时只为该站点请求权限，删除后归还。

### 隐私

匹配全部在本地完成，不收集也不发送任何数据。

扩展不阻止搜索请求到达搜索引擎：等到它响应时，请求通常已经发出。省掉的是搜索结果页。

### 已知限制

- **地址栏的行为取决于浏览器。** Chromium 目前把 `10.1038/xxx` 这类输入当作搜索内容而非主机名。这是浏览器行为，不是扩展可以依赖的约定。
- **不支持 Firefox。**
- **以 POST 提交搜索的引擎无法支持**，查询内容不会出现在地址里。Startpage 和 DuckDuckGo 的免 JavaScript 版本都属于此类。
- **不覆盖用 `history.pushState` 换页的搜索引擎。**

### 开发

目前仍在开发中，界面和操作可能调整。

```text
node tests/core.test.js
```

`tools/hooks/pre-commit` 在提交时运行两套测试：

```powershell
Copy-Item tools/hooks/pre-commit .git/hooks/pre-commit
```

`node tools/build-release.js` 会跑两套测试并生成 `dist/doi-direct-v<版本>.zip`。推送 `v*` tag 会用这个包建立 Release；tag 必须与 `manifest.json` 里的版本一致，Release 正文取自 `CHANGELOG.md` 中对应的条目。

```text
manifest.json
icons/             工具栏和扩展列表图标
src/core/          匹配、编码、搜索引擎规则、设置
src/background.js  服务进程
src/content.js     内容脚本
src/options/       设置页
src/popup/         工具栏弹窗
_locales/          23 种语言的界面文案
tests/             src/core 的单元测试
tools/             提交钩子和发布打包
poc/               早期测量工具
```

`poc/` 是独立工具，扩展不依赖它，说明见 [poc/README.md](poc/README.md)。

### 许可证

MIT


</div>
