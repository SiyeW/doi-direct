/* 路线 A：webRequest.onBeforeRequest（非阻塞，只观察）+ chrome.tabs.update 跳转。
 * 未申请 "tabs" 权限；tabs.update 不需要它。
 *
 * 模式：
 *   off  什么都不做
 *   A    仅使用本文件的重定向路径
 *   B    仅使用 content script（本文件只做记录）
 *   AB   两者同时启用
 *
 * 另外记录所有外层帧导航（每条一行 nav），并在被唤醒后的第一个事件上打
 * FIRST-EVENT-AFTER-BOOT 标记，便于对照生命周期。
 */
importScripts('shared/doi-core.js', 'shared/log-store.js');

var SRC = 'A';
var mf = chrome.runtime.getManifest();
var bootAt = Date.now();
var firstEventAfterBoot = true;

POCLog.log(SRC, 'service worker up', {
  t: bootAt,
  permissions: (mf.permissions || []).join(','),
  hostPermissions: (mf.host_permissions || []).join(','),
  hasTabsPermission: (mf.permissions || []).indexOf('tabs') !== -1,
  ua: self.navigator.userAgent
});

function tag() {
  var s = firstEventAfterBoot ? 'FIRST-EVENT-AFTER-BOOT  ' : '';
  firstEventAfterBoot = false;
  return s;
}

/* ---------- 模式：同步 listener 必须在顶层注册，模式值可能还没读回来 ---------- */
var MODE = null;
var waiters = [];
function readMode(cb) {
  if (MODE !== null) { cb(MODE); return; }
  waiters.push(cb);
  if (waiters.length > 1) return;
  chrome.storage.local.get({ mode: 'off' }, function (o) {
    MODE = o.mode || 'off';
    var ws = waiters; waiters = [];
    for (var i = 0; i < ws.length; i++) ws[i](MODE);
  });
}
chrome.storage.onChanged.addListener(function (ch, area) {
  if (area === 'local' && ch.mode) MODE = ch.mode.newValue || 'off';
});
readMode(function (m) { POCLog.log(SRC, 'mode loaded', { mode: m }); });

function aEnabled(m) { return m === 'A' || m === 'AB'; }

/* ---------- 测量用：webNavigation ---------- */
function shortUrl(u) {
  var s = String(u).replace(/^https?:\/\//, '');
  return s.length > 96 ? (s.slice(0, 96) + '…') : s;
}
function isOutermost(d) {
  if (typeof d.frameType === 'string') return d.frameType === 'outermost_frame';
  return d.frameId === 0;
}
function classify(url) {
  var out = {};
  var hit = DOICore.resolveFromUrl(url, {});
  if (hit) { out.ENGINE = hit.engine; out.DOI = hit.doi; out.WOULD_GO_TO = hit.target; }
  if (/^https?:\/\/(dx\.)?doi\.org\//.test(url)) out.IS_RESOLVER = 1;
  try {
    var h = new URL(url).hostname;
    if (/^10\.\d+\.\d+\.\d+$/.test(h)) out.IPV4_NAVIGATION = h;
  } catch (e) {}
  return out;
}

var lastUpdateAt = 0;

function navHandler(name) {
  return function (d) {
    if (!isOutermost(d)) return;
    var det = POCLog.pickDetails(d);
    det.event = name;
    if (d.error) det.error = d.error;
    var cls = classify(d.url);
    for (var k in cls) det[k] = cls[k];

    var msg = null;
    if (cls.IS_RESOLVER) {
      det.sinceUpdateMs = lastUpdateAt ? (Date.now() - lastUpdateAt) : null;
      msg = 'RESOLVER  ' + name + '  ' + shortUrl(d.url);
    } else if (cls.IPV4_NAVIGATION) {
      msg = 'IPV4_NAVIGATION  <-- 被解析成了 IPv4 主机名';
    } else if (cls.DOI) {
      msg = name + '  ' + shortUrl(d.url);
    } else if (name === 'onCommitted') {
      msg = 'nav  ' + shortUrl(d.url);   /* 普通页面也记一行，便于对照 */
    }
    if (msg) POCLog.log(SRC, tag() + msg, det);

    if (name === 'onCommitted' && cls.DOI &&
        (!d.documentLifecycle || d.documentLifecycle === 'active')) {
      POCLog.log(SRC, 'SEARCH_PAGE_ACTIVE  <-- 搜索页成为可见页',
                 { url: d.url, t: Math.round(d.timeStamp) });
    }
  };
}
['onBeforeNavigate', 'onCommitted', 'onDOMContentLoaded', 'onCompleted',
 'onHistoryStateUpdated', 'onErrorOccurred'].forEach(function (name) {
  if (chrome.webNavigation[name]) chrome.webNavigation[name].addListener(navHandler(name));
});

/* ---------- 路线 A 本体 ---------- */
var HOSTS = ['*://*.google.com/*', '*://*.bing.com/*', '*://*.baidu.com/*'];

chrome.webRequest.onBeforeRequest.addListener(function (d) {
  var outer = (typeof d.frameType === 'string') ? (d.frameType === 'outermost_frame') : (d.frameId === 0);
  if (!outer) return;

  var det = POCLog.pickDetails(d);
  det.type = d.type;
  det.frameTypeMissing = (typeof d.frameType !== 'string');
  det.documentLifecycleMissing = (typeof d.documentLifecycle !== 'string');
  det.deltaMs = Math.round(Date.now() - d.timeStamp);   /* 事件时间戳 -> 处理时刻 */
  det.sinceBootMs = Date.now() - bootAt;

  var hit = DOICore.resolveFromUrl(d.url, {});
  if (hit) { det.ENGINE = hit.engine; det.DOI = hit.doi; det.TARGET = hit.target; }

  /* 无论当前是什么模式，都完整记录 onBeforeRequest 的字段 */
  POCLog.log(SRC, tag() + 'onBeforeRequest  ' + shortUrl(d.url), det);
  if (!hit) return;

  if (d.documentLifecycle === 'prerender') {
    POCLog.log(SRC, 'SKIP  prerender 请求', { url: d.url, DOI: hit.doi });
    return;
  }
  if (typeof d.tabId !== 'number' || d.tabId < 0) {
    POCLog.log(SRC, 'SKIP  tabId=' + d.tabId, { url: d.url, DOI: hit.doi });
    return;
  }

  readMode(function (mode) {
    if (!aEnabled(mode)) {
      POCLog.log(SRC, 'mode=' + mode + ' -> no action', { DOI: hit.doi });
      return;
    }
    var deltaMs = Math.round(Date.now() - d.timeStamp);
    POCLog.log(SRC, 'UPDATE tab ' + d.tabId + ' -> ' + hit.target,
               { deltaMs: deltaMs, sinceBootMs: Date.now() - bootAt, DOI: hit.doi });
    try {
      chrome.tabs.update(d.tabId, { url: hit.target }, function (tab) {
        var err = chrome.runtime.lastError;
        lastUpdateAt = Date.now();
        POCLog.log(SRC, err ? ('tabs.update FAILED: ' + err.message) : 'tabs.update ok',
                   { deltaMsAfterCall: lastUpdateAt - d.timeStamp });
      });
    } catch (e) {
      POCLog.log(SRC, 'tabs.update threw: ' + e.message, null);
    }
  });
}, { urls: HOSTS, types: ['main_frame'] });
