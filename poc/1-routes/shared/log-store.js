/* DOI Direct PoC - shared log.
 *
 * 用 chrome.storage.local：storage.session 默认不暴露给 content script。
 *
 * 每条日志单独占一个 key，不做"读-改-写整份数组"。
 * 原因：同一个事件回调里连着写两条时，两次 get 会读到同一份快照，后一次写会覆盖前一条。
 */
(function (root) {
  'use strict';
  var PREFIX = 'L:';
  var seq = 0;

  function log(src, msg, extra) {
    var line = '[' + src + '] ' + msg;
    if (extra === undefined || extra === null) console.log(line);
    else console.log(line, extra);

    var t = Date.now();
    var entry = { t: t, src: src, msg: msg, extra: (extra === undefined) ? null : extra };
    var key = PREFIX + String(t).padStart(14, '0') + ':' +
              (++seq).toString(36).padStart(3, '0') + ':' +
              Math.random().toString(36).slice(2, 6);
    var obj = {};
    obj[key] = entry;
    try { chrome.storage.local.set(obj); } catch (e) { /* storage 不可用时只留 console */ }
    return entry;
  }

  function all(cb) {
    try {
      chrome.storage.local.get(null, function (o) {
        var out = [];
        for (var k in o) {
          if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
          if (k.indexOf(PREFIX) !== 0) continue;
          if (o[k] && typeof o[k].t === 'number') out.push(o[k]);
        }
        out.sort(function (a, b) { return a.t - b.t; });
        cb(out);
      });
    } catch (e) { cb([]); }
  }

  function clear(cb) {
    try {
      chrome.storage.local.get(null, function (o) {
        var keys = [];
        for (var k in o) {
          if (Object.prototype.hasOwnProperty.call(o, k) && k.indexOf(PREFIX) === 0) keys.push(k);
        }
        if (!keys.length) { if (cb) cb(); return; }
        chrome.storage.local.remove(keys, cb || function () {});
      });
    } catch (e) { if (cb) cb(); }
  }

  /* 把一次 webNavigation / webRequest 的 details 压成可读字段。
   * documentLifecycle / frameType 在旧版 Chrome 上可能不存在，一律如实记录。 */
  function pickDetails(d) {
    return {
      url: d.url,
      tabId: d.tabId,
      frameId: d.frameId,
      frameType: d.frameType,
      documentLifecycle: d.documentLifecycle,
      transitionType: d.transitionType,
      transitionQualifiers: d.transitionQualifiers,
      method: d.method,
      t: Math.round(d.timeStamp)
    };
  }

  root.POCLog = { log: log, clear: clear, all: all, pickDetails: pickDetails, PREFIX: PREFIX };
})(typeof self !== 'undefined' ? self : this);
