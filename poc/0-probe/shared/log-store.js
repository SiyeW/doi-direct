/* DOI Direct PoC - shared log.
 *
 * Uses chrome.storage.local, because storage.session is not exposed to content
 * scripts by default.
 *
 * Each entry takes a key of its own rather than read-modify-writing one array:
 * without that, two writes in the same event callback would both read the same
 * snapshot and the later one would drop the earlier entry.
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
    try { chrome.storage.local.set(obj); } catch (e) { /* with no storage, console is all there is */ }
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

  /* Flattens the details of one webNavigation / webRequest event into readable
   * fields. documentLifecycle and frameType may be absent on older Chrome and are
   * recorded exactly as they come. */
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
