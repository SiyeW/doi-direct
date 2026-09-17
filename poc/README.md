# DOI Direct PoC

[English · en-US](#english) · [简体中文 · zh-CN](#%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87) · [繁體中文 · zh-TW](#%E7%B9%81%E9%AB%94%E4%B8%AD%E6%96%87) · [日本語 · ja-JP](#%E6%97%A5%E6%9C%AC%E8%AA%9E) · [한국어 · ko-KR](#%ED%95%9C%EA%B5%AD%EC%96%B4)

---

<div lang="en-US">

## English

### PoC harness

This is a standalone development tool for observing how Chromium reports navigations and requests, and for comparing two DOI-search interception routes. It is not the DOI Direct extension, and the extension does not depend on it.

### Layout

| Folder | Contents | Permissions |
| --- | --- | --- |
| `0-probe/` | Records navigation lifecycle events without intercepting or modifying requests. | `webNavigation`, `storage`; no site access |
| `1-routes/` | Contains two interception routes that can be switched from the popup. | `webRequest`, `webNavigation`, `storage`, plus the search-engine site access listed in each manifest |
| `shared/` | DOI matching, logging, and popup code shared by the PoC extensions. | — |
| `test/` | Unit tests for the matching core, run with Node.js. | — |
| `build/` | Copies `shared/` into the extension folders. | — |

### Loading

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Select **Load unpacked** and choose `poc/0-probe` or `poc/1-routes`.
4. Pin the extension and open its popup to view the log panel.

`1-routes` starts in `off` mode and does not intercept anything until a route is selected in the popup.

### Tests

```text
node poc/test/doi-core.test.js
```

`poc/test/live-resolve-check.js` prints the resolver URLs produced by the matching core for several DOI examples, which can be compared with doi.org.

### Editing

`shared/` is the common source used by the PoC extensions. After changing it, run:

```powershell
powershell -ExecutionPolicy Bypass -File poc/build/sync-shared.ps1
```

</div>

---

<div lang="zh-CN">

## 简体中文

### PoC 测量工具

这是一个独立的开发工具，用于观察 Chromium 如何报告导航和请求，并比较两种 DOI 搜索拦截路径。它不是 DOI Direct 扩展本身，扩展也不依赖它。

### 目录

| 目录 | 内容 | 权限 |
| --- | --- | --- |
| `0-probe/` | 记录导航生命周期事件，不拦截或修改请求。 | `webNavigation`、`storage`；无站点权限 |
| `1-routes/` | 包含两种拦截路径，可在弹窗中切换。 | `webRequest`、`webNavigation`、`storage`，以及各 manifest 中列出的搜索引擎站点权限 |
| `shared/` | PoC 扩展共用的 DOI 匹配、日志和弹窗代码。 | — |
| `test/` | 匹配核心的单元测试，通过 Node.js 运行。 | — |
| `build/` | 将 `shared/` 复制到各扩展目录。 | — |

### 加载

1. 打开 `chrome://extensions`。
2. 开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择 `poc/0-probe` 或 `poc/1-routes`。
4. 固定扩展，并打开弹窗查看日志面板。

`1-routes` 初始为 `off`，在弹窗中选择路径之前不会进行拦截。

### 测试

```text
node poc/test/doi-core.test.js
```

`poc/test/live-resolve-check.js` 会打印匹配核心为若干 DOI 示例生成的解析地址，可用于与 doi.org 的实际解析结果对照。

### 修改

`shared/` 是 PoC 扩展共用的代码来源。修改后运行：

```powershell
powershell -ExecutionPolicy Bypass -File poc/build/sync-shared.ps1
```

</div>

---

<div lang="zh-TW">

## 繁體中文

### PoC 測量工具

這是一個獨立的開發工具，用來觀察 Chromium 如何回報導覽與請求，並比較兩種 DOI 搜尋攔截路徑。它不是 DOI Direct 擴充功能本身，擴充功能也不依賴它。

### 目錄

| 目錄 | 內容 | 權限 |
| --- | --- | --- |
| `0-probe/` | 記錄導覽生命週期事件，不攔截或修改請求。 | `webNavigation`、`storage`；無網站權限 |
| `1-routes/` | 包含兩種攔截路徑，可從彈出視窗切換。 | `webRequest`、`webNavigation`、`storage`，以及各 manifest 中列出的搜尋引擎網站權限 |
| `shared/` | PoC 擴充功能共用的 DOI 比對、記錄與彈出視窗程式碼。 | — |
| `test/` | 比對核心的單元測試，透過 Node.js 執行。 | — |
| `build/` | 將 `shared/` 複製到各擴充功能目錄。 | — |

### 載入

1. 開啟 `chrome://extensions`。
2. 開啟「開發人員模式」。
3. 選擇「載入未封裝項目」，再選取 `poc/0-probe` 或 `poc/1-routes`。
4. 將擴充功能固定在工具列，並開啟彈出視窗查看記錄面板。

`1-routes` 初始為 `off`，在彈出視窗中選擇路徑前不會進行攔截。

### 測試

```text
node poc/test/doi-core.test.js
```

`poc/test/live-resolve-check.js` 會列出比對核心為數個 DOI 範例產生的解析網址，可用來與 doi.org 的實際解析結果對照。

### 修改

`shared/` 是 PoC 擴充功能共用的程式碼來源。修改後執行：

```powershell
powershell -ExecutionPolicy Bypass -File poc/build/sync-shared.ps1
```

</div>

---

<div lang="ja-JP">

## 日本語

### PoC 測定ツール

Chromium がナビゲーションとリクエストをどのように通知するかを確認し、DOI 検索を処理する 2 つの経路を比較するための独立した開発ツールです。DOI Direct 本体ではなく、本体からこのツールへの依存もありません。

### 構成

| フォルダー | 内容 | 権限 |
| --- | --- | --- |
| `0-probe/` | リクエストを遮断・変更せず、ナビゲーションのライフサイクルイベントだけを記録します。 | `webNavigation`、`storage`。サイトへのアクセス権限なし |
| `1-routes/` | ポップアップから切り替えられる 2 つの処理経路を収録しています。 | `webRequest`、`webNavigation`、`storage` と、各 manifest に記載された検索エンジンのサイトアクセス権限 |
| `shared/` | PoC 拡張機能で共有する DOI マッチング、ログ、ポップアップのコード。 | — |
| `test/` | マッチングコアの単体テスト。Node.js で実行します。 | — |
| `build/` | `shared/` を各拡張機能フォルダーへコピーします。 | — |

### 読み込み

1. `chrome://extensions` を開きます。
2. **デベロッパー モード**を有効にします。
3. **パッケージ化されていない拡張機能を読み込む**を選び、`poc/0-probe` または `poc/1-routes` を指定します。
4. 拡張機能をツールバーに固定し、ポップアップを開いてログパネルを確認します。

`1-routes` の初期状態は `off` です。ポップアップで経路を選択するまでは何も遮断しません。

### テスト

```text
node poc/test/doi-core.test.js
```

`poc/test/live-resolve-check.js` は、いくつかの DOI 例に対してマッチングコアが生成するリゾルバー URL を出力します。doi.org の実際の結果との比較に利用できます。

### 編集

`shared/` が PoC 拡張機能の共通ソースです。変更後に次を実行します。

```powershell
powershell -ExecutionPolicy Bypass -File poc/build/sync-shared.ps1
```

</div>

---

<div lang="ko-KR">

## 한국어

### PoC 측정 도구

Chromium이 탐색과 요청을 어떻게 보고하는지 확인하고, DOI 검색을 처리하는 두 가지 경로를 비교하기 위한 독립적인 개발 도구입니다. DOI Direct 확장 프로그램 자체가 아니며, 본 확장 프로그램도 이 도구에 의존하지 않습니다.

### 구성

| 폴더 | 내용 | 권한 |
| --- | --- | --- |
| `0-probe/` | 요청을 가로채거나 변경하지 않고 탐색 수명 주기 이벤트만 기록합니다. | `webNavigation`, `storage`; 사이트 접근 권한 없음 |
| `1-routes/` | 팝업에서 전환할 수 있는 두 가지 처리 경로를 포함합니다. | `webRequest`, `webNavigation`, `storage` 및 각 manifest에 명시된 검색 엔진 사이트 접근 권한 |
| `shared/` | PoC 확장 프로그램이 함께 사용하는 DOI 매칭, 로그, 팝업 코드입니다. | — |
| `test/` | 매칭 코어 단위 테스트입니다. Node.js에서 실행합니다. | — |
| `build/` | `shared/`를 각 확장 프로그램 폴더로 복사합니다. | — |

### 로드

1. `chrome://extensions`를 엽니다.
2. **개발자 모드**를 사용 설정합니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 선택하고 `poc/0-probe` 또는 `poc/1-routes`를 지정합니다.
4. 확장 프로그램을 툴바에 고정하고 팝업을 열어 로그 패널을 확인합니다.

`1-routes`의 초기 상태는 `off`입니다. 팝업에서 경로를 선택하기 전에는 요청을 가로채지 않습니다.

### 테스트

```text
node poc/test/doi-core.test.js
```

`poc/test/live-resolve-check.js`는 몇 가지 DOI 예시에 대해 매칭 코어가 만든 리졸버 URL을 출력합니다. doi.org의 실제 결과와 비교할 때 사용할 수 있습니다.

### 수정

`shared/`는 PoC 확장 프로그램이 함께 사용하는 공통 소스입니다. 변경한 뒤 다음 명령을 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File poc/build/sync-shared.ps1
```

</div>
