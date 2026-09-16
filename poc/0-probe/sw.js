/* 探针：只有 webNavigation + storage，零 host 权限。
 * 只做记录，不拦截、不修改任何请求。记录所有外层帧导航事件的完整字段。 */
importScripts('shared/doi-core.js', 'shared/log-store.js');

var SRC = 'probe';
var mf = chrome.runtime.getManifest();

POCLog.log(SRC, 'service worker up', {
  t: Date.now(),
  name: mf.name,
  permissions: (mf.permissions || []).join(','),
  hostPermissions: (mf.host_permissions || []).join(',') || '(none)',
  ua: self.navigator.userAgent
});

function shortUrl(u) {
  var s = String(u).replace(/^https?:\/\//, '');
  return s.length > 96 ? (s.slice(0, 96) + '…') : s;
}

function isOutermost(d) {
  if (typeof d.frameType === 'string') return d.frameType === 'outermost_frame';
  return d.frameId === 0;   /* 旧版 Chrome 回退 */
}

/* 标记出与 DOI 形状相关的导航 */
function classify(url) {
  var out = {};
  var dec = '';
  try { dec = decodeURIComponent(url); } catch (e) { dec = url; }

  var hit = DOICore.resolveFromUrl(url, {});
  if (hit) { out.ENGINE = hit.engine; out.DOI = hit.doi; out.WOULD_GO_TO = hit.target; }

  if (/10\.\d{2,}\./.test(dec)) out.CANDIDATE = 1;          /* 解码后含 DOI 前缀形状 */
  try {
    var h = new URL(url).hostname;
    if (/^10\.\d+\.\d+\.\d+$/.test(h)) out.IPV4_NAVIGATION = h;  /* 被当成 IPv4 了 */
  } catch (e) {}
  return out;
}

function handler(name) {
  return function (d) {
    if (!isOutermost(d)) return;
    var det = POCLog.pickDetails(d);
    det.event = name;
    var cls = classify(d.url);
    for (var k in cls) det[k] = cls[k];

    var msg = name;
    if (cls.IPV4_NAVIGATION) msg = 'IPV4_NAVIGATION  <-- 被解析成了 IPv4 主机名';
    else if (cls.CANDIDATE && !cls.DOI) msg = name + '  [CANDIDATE 未通过 DOI 匹配]';
    else if (cls.DOI) msg = name + '  [DOI]';
    else msg = name + '  ' + shortUrl(d.url);

    POCLog.log(SRC, msg, det);

    /* 搜索页成为可见页 */
    if (name === 'onCommitted' && cls.DOI &&
        (!d.documentLifecycle || d.documentLifecycle === 'active')) {
      POCLog.log(SRC, 'SEARCH_PAGE_ACTIVE  <-- 搜索页成为可见页',
                 { url: d.url, t: Math.round(d.timeStamp) });
    }
  };
}

['onBeforeNavigate', 'onCommitted', 'onDOMContentLoaded', 'onCompleted',
 'onHistoryStateUpdated', 'onReferenceFragmentUpdated', 'onErrorOccurred',
 'onCreatedNavigationTarget'].forEach(function (name) {
  if (chrome.webNavigation[name]) chrome.webNavigation[name].addListener(handler(name));
});
