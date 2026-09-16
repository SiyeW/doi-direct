/* DOI Direct PoC - shared matching core.
 *
 * Loads as a classic script: content script, service worker importScripts, or a
 * script tag. It also works under Node, which is how the unit tests reach it.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.DOICore = factory(); }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  var DEFAULT_PATTERN = '^10\\.\\d+(?:\\.\\d+)*\\/\\S+$';
  var DEFAULT_RESOLVER_BASE = 'https://doi.org/';
  var MAX_QUERY_LEN = 2048;

  /* Three engines is enough for this experiment. The path here is compared
   * exactly; the extension also accepts a path prefix and covers regional
   * domains. */
  var ENGINES = [
    { id: 'google', host: 'google.com', path: '/search', param: 'q'  },
    { id: 'bing',   host: 'bing.com',   path: '/search', param: 'q'  },
    { id: 'baidu',  host: 'baidu.com',  path: '/s',      param: 'wd' }
  ];

  function matchEngine(url) {
    var u;
    try { u = new URL(url); } catch (e) { return null; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    var h = u.hostname.toLowerCase();
    for (var i = 0; i < ENGINES.length; i++) {
      var e = ENGINES[i];
      var isHost = (h === e.host) || (h.length > e.host.length && h.slice(-(e.host.length + 1)) === '.' + e.host);
      if (!isHost) continue;
      if (e.path && u.pathname !== e.path) continue;
      return { engine: e, url: u };
    }
    return null;
  }

  function extractQuery(url) {
    var m = matchEngine(url);
    if (!m) return null;
    var q = m.url.searchParams.get(m.engine.param);
    if (q === null) return null;
    return { engine: m.engine.id, query: q };
  }

  function parseDoi(query, pattern) {
    if (typeof query !== 'string') return null;
    var v = query.trim();
    if (v.length === 0 || v.length > MAX_QUERY_LEN) return null;
    v = v.replace(/^doi\s*:\s*/i, '');
    var re;
    try { re = new RegExp(pattern || DEFAULT_PATTERN); } catch (e) { return null; }
    return re.test(v) ? v : null;
  }

  /* The DOI Handbook positive whitelist: these characters stay literal in a URL
   * and everything else is percent-encoded as UTF-8. Note that % " # space and ?
   * are all absent - those are exactly the ones that have to be encoded. The slash
   * is the literal separator between prefix and suffix as the Handbook defines it,
   * so it is kept. */
  var KEEP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
             "-._~!$&'()*+;=:@/";

  function encodeDoi(doi) {
    var out = '';
    var enc = new TextEncoder();
    for (var i = 0; i < doi.length; i++) {
      var ch = doi[i];
      if (ch >= '\uD800' && ch <= '\uDBFF' && i + 1 < doi.length) { ch = doi.slice(i, i + 2); i++; }
      if (ch.length === 1 && KEEP.indexOf(ch) !== -1) { out += ch; continue; }
      var bytes = enc.encode(ch);
      for (var b = 0; b < bytes.length; b++) {
        out += '%' + bytes[b].toString(16).toUpperCase().padStart(2, '0');
      }
    }
    return out;
  }

  /* Only "append the DOI to the base URL's path" is supported. A base carrying a
   * query or hash, such as https://r.example.edu/?doi=, is rejected rather than
   * guessed at - that form needs a different set of encoding rules. */
  function buildResolverUrl(base, doi) {
    var b = (typeof base === 'string' && base.trim()) ? base.trim() : DEFAULT_RESOLVER_BASE;
    var u;
    try { u = new URL(b); }
    catch (e) { try { u = new URL('https://' + b); } catch (e2) { return null; } }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.search || u.hash) return null;
    var s = u.href;
    if (s.charAt(s.length - 1) !== '/') s += '/';
    return s + encodeDoi(doi);
  }

  function resolveFromUrl(url, opts) {
    opts = opts || {};
    var ex = extractQuery(url);
    if (!ex) return null;
    var doi = parseDoi(ex.query, opts.pattern);
    if (!doi) return null;
    var target = buildResolverUrl(opts.resolverBase, doi);
    if (!target) return null;
    return { engine: ex.engine, query: ex.query, doi: doi, target: target };
  }

  return {
    DEFAULT_PATTERN: DEFAULT_PATTERN,
    DEFAULT_RESOLVER_BASE: DEFAULT_RESOLVER_BASE,
    ENGINES: ENGINES,
    matchEngine: matchEngine,
    extractQuery: extractQuery,
    parseDoi: parseDoi,
    encodeDoi: encodeDoi,
    buildResolverUrl: buildResolverUrl,
    resolveFromUrl: resolveFromUrl
  };
});
