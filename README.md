# DOI Direct

[English · en-US](#english) · [简体中文 · zh-CN](#%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87) · [繁體中文 · zh-TW](#%E7%B9%81%E9%AB%94%E4%B8%AD%E6%96%87) · [日本語 · ja-JP](#%E6%97%A5%E6%9C%AC%E8%AA%9E) · [한국어 · ko-KR](#%ED%95%9C%EA%B5%AD%EC%96%B4)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Chromium-4285F4?logo=googlechrome&logoColor=white)
[![CI](https://github.com/SiyeW/doi-direct/actions/workflows/ci.yml/badge.svg)](https://github.com/SiyeW/doi-direct/actions/workflows/ci.yml)

<p align="center">
  <img src="icons/icon_128.png" width="128" height="128" alt="DOI Direct">
</p>

---

<div lang="en-US">

## English

DOI Direct is a Chromium browser extension for searches consisting only of a DOI. When a supported search engine receives a query that is exactly a DOI, the current tab goes directly to the configured DOI resolver.

```text
10.1038/s41559-022-01925-6
            ↓
https://doi.org/10.1038/s41559-022-01925-6
```

Searches containing other text are left unchanged. For example, `10.1038/xxxxx pdf` remains a normal search.

### Features

- Built-in support for Google, Bing, Baidu, DuckDuckGo, Sogou, 360, Brave, Yahoo, and Ecosia
- Each built-in search engine can be enabled or disabled independently
- Custom search engines can be added, with site access requested only for the corresponding site
- The DOI resolver address is configurable and defaults to `https://doi.org/`
- The DOI matching rule is configurable, with live examples and a test input
- The interface is available in 23 languages and can either follow the browser language automatically or use a manually selected language

### Installation

DOI Direct is distributed through GitHub Releases.

1. Download `doi-direct-v*.zip` from [Releases](https://github.com/SiyeW/doi-direct/releases).
2. Extract the archive to a folder that will remain on the computer.
3. Open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Select **Load unpacked** and choose the extracted folder.

The extension targets Chrome 108 and later, as well as compatible Chromium-based browsers such as Edge. Because it is installed as an unpacked extension, the browser may display developer-mode notices.

To update, replace the existing files with the newer version and reload the extension from `chrome://extensions`.

### Known limitations

- Firefox is not currently supported.
- Search engines that submit queries with POST cannot be handled because the query does not appear in the URL. This includes Startpage and DuckDuckGo's no-JavaScript version, among others.
- Search flows that update results only through `history.pushState` cannot currently be handled.

### Development

Run the core tests:

```bash
node tests/core.test.js
```

Build a release archive:

```bash
node tools/build-release.js
```

The build script runs both test suites and creates:

```text
dist/doi-direct-v<version>.zip
```

An optional pre-commit hook is available at `tools/hooks/pre-commit`.

Pushing a `v*` tag causes GitHub Actions to create a GitHub Release automatically. The numeric version in the tag must match `manifest.json`; prerelease suffixes such as `-dev.1` are supported. The release body is taken from the corresponding entry in [`CHANGELOG.md`](CHANGELOG.md).

</div>

---

<div lang="zh-CN">

## 简体中文

DOI Direct 是一个用于处理纯 DOI 搜索的 Chromium 浏览器扩展。当受支持的搜索引擎收到一条内容仅为 DOI 的查询时，当前标签页会直接转向所设置的 DOI 解析地址。

```text
10.1038/s41559-022-01925-6
            ↓
https://doi.org/10.1038/s41559-022-01925-6
```

搜索内容中包含其他文字时不会触发跳转。例如，`10.1038/xxxxx pdf` 仍然作为普通搜索处理。

### 主要功能

- 内置 Google、Bing、百度、DuckDuckGo、搜狗、360、Brave、Yahoo 和 Ecosia
- 每个内置搜索引擎都可以单独启用或关闭
- 支持添加自定义搜索引擎，只为对应站点请求权限
- DOI 解析地址可以修改，默认为 `https://doi.org/`
- DOI 匹配规则可以修改，并提供实时示例和测试输入
- 界面包含 23 种语言，可自动跟随浏览器语言，也可以手动选择

### 安装

DOI Direct 通过 GitHub Releases 发布。

1. 在 [Releases](https://github.com/SiyeW/doi-direct/releases) 下载 `doi-direct-v*.zip`。
2. 将压缩包解压到一个长期保留的文件夹。
3. 打开 `chrome://extensions`。
4. 开启「开发者模式」。
5. 点击「加载已解压的扩展程序」，选择解压出的文件夹。

扩展面向 Chrome 108 及以上版本和 Edge 等兼容的 Chromium 内核浏览器。由于采用未打包扩展的方式安装，浏览器可能会显示开发者模式相关提示。

需要更新时，请用新版本替换原文件，然后在 `chrome://extensions` 中重新加载扩展即可。

### 已知限制

- 目前不支持 Firefox。
- 使用 POST 提交查询的搜索引擎无法处理，因为查询内容不会出现在 URL 中。受影响的搜索引擎包括 Startpage 和 DuckDuckGo 的免 JavaScript 版本等。
- 仅通过 `history.pushState` 更新搜索结果的流程目前无法处理。

### 开发

运行核心测试：

```bash
node tests/core.test.js
```

生成发布包：

```bash
node tools/build-release.js
```

构建脚本会运行两套测试，并生成：

```text
dist/doi-direct-v<版本>.zip
```

`tools/hooks/pre-commit` 提供了可选的 pre-commit hook。

推送 `v*` tag 后，GitHub Actions 会自动建立 GitHub Release。tag 的数字版本部分需要与 `manifest.json` 一致，支持 `-dev.1` 这类预发布后缀。Release 正文取自 [`CHANGELOG.md`](CHANGELOG.md) 中对应的版本条目。

</div>

---

<div lang="zh-TW">

## 繁體中文

DOI Direct 是一款用來處理純 DOI 搜尋的 Chromium 瀏覽器擴充功能。當支援的搜尋引擎收到內容只有 DOI 的查詢時，目前分頁會直接前往所設定的 DOI 解析網址。

```text
10.1038/s41559-022-01925-6
            ↓
https://doi.org/10.1038/s41559-022-01925-6
```

搜尋內容中包含其他文字時不會觸發重新導向。例如，`10.1038/xxxxx pdf` 仍會作為一般搜尋處理。

### 主要功能

- 內建 Google、Bing、百度、DuckDuckGo、搜狗、360、Brave、Yahoo 和 Ecosia
- 每個內建搜尋引擎都可以個別啟用或停用
- 支援新增自訂搜尋引擎，只會為對應網站要求存取權限
- DOI 解析網址可以修改，預設為 `https://doi.org/`
- DOI 比對規則可以修改，並提供即時範例與測試輸入
- 介面提供 23 種語言，可自動跟隨瀏覽器語言，也可以手動選擇

### 安裝

DOI Direct 透過 GitHub Releases 發布。

1. 在 [Releases](https://github.com/SiyeW/doi-direct/releases) 下載 `doi-direct-v*.zip`。
2. 將壓縮檔解壓縮到會長期保留的資料夾。
3. 開啟 `chrome://extensions`。
4. 開啟「開發人員模式」。
5. 選擇「載入未封裝項目」，再選取解壓縮後的資料夾。

擴充功能適用於 Chrome 108 以上版本，以及 Edge 等相容的 Chromium 瀏覽器。由於是以未封裝擴充功能的方式安裝，瀏覽器可能會顯示與開發人員模式相關的提示。

需要更新時，以新版本檔案取代原有檔案，再到 `chrome://extensions` 重新載入擴充功能即可。

### 已知限制

- 目前不支援 Firefox。
- 使用 POST 提交查詢的搜尋引擎目前無法處理，因為查詢內容不會出現在 URL 中。Startpage 和 DuckDuckGo 的免 JavaScript 版本等都會受到影響。
- 僅透過 `history.pushState` 更新搜尋結果的流程目前無法處理。

### 開發

執行核心測試：

```bash
node tests/core.test.js
```

產生發布套件：

```bash
node tools/build-release.js
```

建置腳本會執行兩套測試，並產生：

```text
dist/doi-direct-v<版本>.zip
```

`tools/hooks/pre-commit` 提供可選用的 pre-commit hook。

推送 `v*` tag 後，GitHub Actions 會自動建立 GitHub Release。tag 的數字版本部分需要與 `manifest.json` 一致，也支援 `-dev.1` 這類預發布後綴。Release 內容取自 [`CHANGELOG.md`](CHANGELOG.md) 中對應的版本條目。

</div>

---

<div lang="ja-JP">

## 日本語

DOI Direct は、DOI だけを検索したときに DOI リゾルバーへ直接移動する Chromium 向けブラウザー拡張機能です。対応している検索エンジンで検索内容が DOI のみの場合、現在のタブが設定済みの DOI リゾルバーへ移動します。

```text
10.1038/s41559-022-01925-6
            ↓
https://doi.org/10.1038/s41559-022-01925-6
```

ほかの文字を含む検索はリダイレクトしません。たとえば、`10.1038/xxxxx pdf` は通常の検索として扱われます。

### 主な機能

- Google、Bing、Baidu、DuckDuckGo、Sogou、360、Brave、Yahoo、Ecosia に標準対応
- 標準対応の検索エンジンは個別に有効・無効を切り替え可能
- カスタム検索エンジンを追加可能。サイトへのアクセス権限は追加したサイトに対してのみ要求
- DOI リゾルバーの URL を変更可能。既定値は `https://doi.org/`
- DOI のマッチングルールを変更可能。リアルタイムの例とテスト入力を用意
- 23 言語のインターフェースを収録。ブラウザーの言語に自動で合わせることも、手動で選択することも可能

### インストール

DOI Direct は GitHub Releases から配布しています。

1. [Releases](https://github.com/SiyeW/doi-direct/releases) から `doi-direct-v*.zip` をダウンロードします。
2. ZIP を、今後も残しておくフォルダーへ展開します。
3. `chrome://extensions` を開きます。
4. **デベロッパー モード**を有効にします。
5. **パッケージ化されていない拡張機能を読み込む**を選び、展開したフォルダーを指定します。

Chrome 108 以降、および Edge などの互換性のある Chromium 系ブラウザーを対象としています。パッケージ化されていない拡張機能としてインストールするため、ブラウザーにデベロッパーモード関連の通知が表示される場合があります。

更新時は、新しいバージョンのファイルで既存のファイルを置き換え、`chrome://extensions` から拡張機能を再読み込みします。

### 既知の制限

- 現在 Firefox には対応していません。
- POST で検索内容を送信する検索エンジンには対応できません。検索内容が URL に含まれないためです。Startpage や DuckDuckGo の JavaScript 不使用版などが該当します。
- `history.pushState` だけで検索結果を更新する検索フローには現在対応していません。

### 開発

コアテストを実行します。

```bash
node tests/core.test.js
```

リリース用 ZIP を生成します。

```bash
node tools/build-release.js
```

ビルドスクリプトは 2 つのテストスイートを実行し、次のファイルを生成します。

```text
dist/doi-direct-v<version>.zip
```

`tools/hooks/pre-commit` に任意で利用できる pre-commit hook があります。

`v*` tag を push すると、GitHub Actions が GitHub Release を自動作成します。tag の数値部分は `manifest.json` のバージョンと一致している必要があり、`-dev.1` のようなプレリリース用サフィックスにも対応しています。Release の本文には [`CHANGELOG.md`](CHANGELOG.md) の該当バージョンの内容が使われます。

</div>

---

<div lang="ko-KR">

## 한국어

DOI Direct는 검색어 전체가 DOI일 때 설정된 DOI 리졸버로 바로 이동하도록 하는 Chromium 기반 브라우저 확장 프로그램입니다. 지원되는 검색 엔진에서 DOI만 검색하면 현재 탭이 해당 DOI 리졸버로 이동합니다.

```text
10.1038/s41559-022-01925-6
            ↓
https://doi.org/10.1038/s41559-022-01925-6
```

검색어에 다른 내용이 함께 들어 있으면 리디렉션하지 않습니다. 예를 들어 `10.1038/xxxxx pdf`는 일반 검색으로 처리됩니다.

### 주요 기능

- Google, Bing, Baidu, DuckDuckGo, Sogou, 360, Brave, Yahoo, Ecosia 기본 지원
- 기본 제공 검색 엔진을 각각 켜거나 끌 수 있음
- 사용자 지정 검색 엔진 추가 지원. 사이트 접근 권한은 해당 사이트에 대해서만 요청
- DOI 리졸버 URL 변경 가능. 기본값은 `https://doi.org/`
- DOI 매칭 규칙 변경 가능. 실시간 예시와 테스트 입력 제공
- 23개 언어 인터페이스 제공. 브라우저 언어를 자동으로 따르거나 직접 선택 가능

### 설치

DOI Direct는 GitHub Releases를 통해 배포됩니다.

1. [Releases](https://github.com/SiyeW/doi-direct/releases)에서 `doi-direct-v*.zip`을 다운로드합니다.
2. 압축 파일을 계속 보관할 폴더에 풉니다.
3. `chrome://extensions`를 엽니다.
4. **개발자 모드**를 사용 설정합니다.
5. **압축해제된 확장 프로그램을 로드합니다**를 선택하고 압축을 푼 폴더를 지정합니다.

Chrome 108 이상과 Edge 등 호환되는 Chromium 기반 브라우저를 대상으로 합니다. 압축해제된 확장 프로그램으로 설치되므로 브라우저에서 개발자 모드 관련 안내가 표시될 수 있습니다.

업데이트할 때는 새 버전의 파일로 기존 파일을 교체한 뒤 `chrome://extensions`에서 확장 프로그램을 다시 로드하면 됩니다.

### 알려진 제한 사항

- 현재 Firefox는 지원하지 않습니다.
- POST 방식으로 검색어를 전송하는 검색 엔진은 처리할 수 없습니다. 검색어가 URL에 포함되지 않기 때문입니다. Startpage와 DuckDuckGo의 JavaScript 미사용 버전 등이 여기에 해당합니다.
- `history.pushState`만으로 검색 결과를 갱신하는 흐름은 현재 처리할 수 없습니다.

### 개발

핵심 테스트 실행:

```bash
node tests/core.test.js
```

릴리스 패키지 생성:

```bash
node tools/build-release.js
```

빌드 스크립트는 두 개의 테스트 스위트를 실행하고 다음 파일을 생성합니다.

```text
dist/doi-direct-v<version>.zip
```

`tools/hooks/pre-commit`에 선택적으로 사용할 수 있는 pre-commit hook이 있습니다.

`v*` tag를 push하면 GitHub Actions가 GitHub Release를 자동으로 생성합니다. tag의 숫자 버전 부분은 `manifest.json`과 일치해야 하며, `-dev.1` 같은 프리릴리스 접미사도 지원합니다. Release 본문은 [`CHANGELOG.md`](CHANGELOG.md)의 해당 버전 항목에서 가져옵니다.

</div>
