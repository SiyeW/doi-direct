/* Probe: webNavigation and storage only, no host permissions.
 * It records and does nothing else - it never intercepts or modifies a request.
 * Every outermost-frame navigation is logged with all of its fields. */
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
  return d.frameId === 0;   /* fallback for older Chrome */
}

/* Flags navigations that have anything to do with DOI-shaped input. */
function classify(url) {
  var out = {};
  var dec = '';
  try { dec = decodeURIComponent(url); } catch (e) { dec = url; }

  var hit = DOICore.resolveFromUrl(url, {});
  if (hit) { out.ENGINE = hit.engine; out.DOI = hit.doi; out.WOULD_GO_TO = hit.target; }

  if (/10\.\d{2,}\./.test(dec)) out.CANDIDATE = 1;          /* decoded form starts like a DOI prefix */
  try {
    var h = new URL(url).hostname;
    if (/^10\.\d+\.\d+\.\d+$/.test(h)) out.IPV4_NAVIGATION = h;  /* read as an IPv4 host instead */
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
    if (cls.IPV4_NAVIGATION) msg = 'IPV4_NAVIGATION  <-- read as an IPv4 hostname';
    else if (cls.CANDIDATE && !cls.DOI) msg = name + '  [CANDIDATE, not a DOI]';
    else if (cls.DOI) msg = name + '  [DOI]';
    else msg = name + '  ' + shortUrl(d.url);

    POCLog.log(SRC, msg, det);

    /* the search page became the visible page */
    if (name === 'onCommitted' && cls.DOI &&
        (!d.documentLifecycle || d.documentLifecycle === 'active')) {
      POCLog.log(SRC, 'SEARCH_PAGE_ACTIVE  <-- search page became visible',
                 { url: d.url, t: Math.round(d.timeStamp) });
    }
  };
}

['onBeforeNavigate', 'onCommitted', 'onDOMContentLoaded', 'onCompleted',
 'onHistoryStateUpdated', 'onReferenceFragmentUpdated', 'onErrorOccurred',
 'onCreatedNavigationTarget'].forEach(function (name) {
  if (chrome.webNavigation[name]) chrome.webNavigation[name].addListener(handler(name));
});
