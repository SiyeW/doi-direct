### [English](#english) | [中文](#%E4%B8%AD%E6%96%87)

---

<div lang="en-US">

## English

### PoC harness

A standalone tool for observing how Chromium reports navigations and requests, and for comparing two ways of intercepting a DOI search. It is not the extension, and the extension does not depend on it.

### Layout

| Folder | Contents | Permissions |
|---|---|---|
| `0-probe/` | Records navigation lifecycle events only. It neither intercepts nor modifies a request. | `webNavigation`, `storage`. No site access. |
| `1-routes/` | Two interception strategies, switchable from the popup at any time. | `webRequest`, `webNavigation`, `storage`, plus site access for the search engines listed in each manifest. |
| `shared/` | DOI matching, logging, and the popup interface. | — |
| `test/` | Unit tests for the matching core, run in Node. | — |
| `build/` | Copies `shared/` into each extension folder. | — |

### Loading

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Select **Load unpacked** and choose `poc/0-probe` or `poc/1-routes`
4. Pin the extension, then click its icon to open the log panel

`1-routes` starts in `off` and does nothing until a strategy is selected in the popup.

### Tests

```text
node poc/test/doi-core.test.js
```

`poc/test/live-resolve-check.js` prints the resolver addresses the matching core builds from a few DOIs, for checking against doi.org.

### Editing

`shared/` is the single source. After changing it, run:

```powershell
powershell -ExecutionPolicy Bypass -File poc/build/sync-shared.ps1
```


</div>

---

<div lang="zh-CN">

## 中文

### PoC 测量工具

一个独立的小工具，用于观察 Chromium 如何报告导航和请求，并比较两种拦截 DOI 搜索的方式。它不是扩展本身，扩展也不依赖它。

### 目录

| 目录 | 内容 | 权限 |
|---|---|---|
| `0-probe/` | 只记录导航生命周期事件，不拦截也不修改任何请求。 | `webNavigation`、`storage`，无站点权限。 |
| `1-routes/` | 两种拦截方式，可在弹窗中随时切换。 | `webRequest`、`webNavigation`、`storage`，以及其 manifest 中列出的搜索引擎站点权限。 |
| `shared/` | DOI 匹配核心、日志、弹窗界面。 | — |
| `test/` | 匹配核心的单元测试，在 Node 中运行。 | — |
| `build/` | 把 `shared/` 复制到各个扩展目录。 | — |

### 加载

1. 打开 `chrome://extensions`
2. 打开「开发者模式」
3. 点击「加载已解压的扩展程序」，选择 `poc/0-probe` 或 `poc/1-routes`
4. 固定扩展，点击图标打开日志面板

`1-routes` 初始为 `off`，在弹窗中选择方式之前不做任何事。

### 测试

```text
node poc/test/doi-core.test.js
```

`poc/test/live-resolve-check.js` 打印匹配核心为若干 DOI 生成的解析地址，便于对照 doi.org 检查。

### 修改

`shared/` 是唯一来源。改动之后运行：

```powershell
powershell -ExecutionPolicy Bypass -File poc/build/sync-shared.ps1
```


</div>
