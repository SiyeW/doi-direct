/* DOI Direct - DOI matching, encoding and resolver URL construction.
 *
 * Pure functions only: this file must never touch chrome.* so it can be unit
 * tested in Node. Loaded as a classic script everywhere (service worker via
 * importScripts, content script via the manifest, pages via a script tag).
 *
 * UMD wrapper: attaches to the global in a browser, exports under Node.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.DOICore = factory(); }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* A redirect matching pattern, NOT a DOI syntax validator.
   * Deliberately conservative: it would rather miss an exotic but legal DOI
   * than hijack "10.1038/foo pdf". Note that spaces are legal inside a DOI
   * suffix, which is exactly why \S+ is used here. */
  var DEFAULT_PATTERN = '^10\\.\\d+(?:\\.\\d+)*\\/\\S+$';

  var DEFAULT_RESOLVER_BASE = 'https://doi.org/';
  var MAX_QUERY_LEN = 2048;
  var MAX_DOI_LEN = 2048;

  /* Example queries shown in the options page and asserted by the test suite,
   * so the two can never drift apart.
   *
   * The accepted ones sit under reserved prefixes rather than naming real
   * articles: 10.1000 is the prefix the DOI Handbook uses for its own examples,
   * and 10.5555 is reserved for testing. Inventing a plausible suffix under a
   * publisher prefix is worse than an obvious example, because it eventually
   * lands on somebody's actual paper. The rejected ones contain no DOI at all,
   * which cannot collide with anything. */
  var EXAMPLES = {
    accept: [
      '10.1000/182',
      '10.5555/12345678',
      'DOI: 10.1000/182',
      'doi:10.1002/example'
    ],
    reject: [
      '10.1038/example pdf',
      'read 10.1038/example',
      'doi please',
      '10.1038'
    ]
  };

  /* Characters that stay literal in a DOI URL, per the DOI Handbook.
   * Everything else is UTF-8 percent-encoded, which is why % " # space and ?
   * are always encoded - they are not in this list.
   * The slash is the prefix/suffix separator and stays literal. */
  var KEEP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
             "-._~!$&'()*+;=:@/";

  function parseDoi(query, pattern) {
    if (typeof query !== 'string') return null;
    var v = query.trim();
    if (v.length === 0 || v.length > MAX_QUERY_LEN) return null;
    v = v.replace(/^doi\s*:\s*/i, '');
    if (v.length === 0 || v.length > MAX_DOI_LEN) return null;
    var re;
    try { re = new RegExp(pattern || DEFAULT_PATTERN); } catch (e) { return null; }
    return re.test(v) ? v : null;
  }

  function encodeDoi(doi) {
    var out = '';
    var enc = new TextEncoder();
    for (var i = 0; i < doi.length; i++) {
      var ch = doi[i];
      /* keep surrogate pairs together so TextEncoder sees a whole code point */
      if (ch >= '\uD800' && ch <= '\uDBFF' && i + 1 < doi.length) { ch = doi.slice(i, i + 2); i++; }
      if (ch.length === 1 && KEEP.indexOf(ch) !== -1) { out += ch; continue; }
      var bytes = enc.encode(ch);
      for (var b = 0; b < bytes.length; b++) {
        out += '%' + bytes[b].toString(16).toUpperCase().padStart(2, '0');
      }
    }
    return out;
  }

  /* Only "base URL with the DOI appended as a path" is supported.
   * A base carrying a query or fragment is rejected outright rather than
   * guessed at, because appending a DOI there needs a different encoding
   * rule. Returning null means "do not redirect" (fail open). */
  function buildResolverUrl(base, doi) {
    if (typeof doi !== 'string' || doi.length === 0) return null;
    var b = (typeof base === 'string' && base.trim()) ? base.trim() : DEFAULT_RESOLVER_BASE;
    var u;
    try { u = new URL(b); }
    catch (e) {
      try { u = new URL('https://' + b); } catch (e2) { return null; }
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.search || u.hash) return null;
    var s = u.href;
    if (s.charAt(s.length - 1) !== '/') s += '/';
    return s + encodeDoi(doi);
  }

  return {
    DEFAULT_PATTERN: DEFAULT_PATTERN,
    DEFAULT_RESOLVER_BASE: DEFAULT_RESOLVER_BASE,
    MAX_QUERY_LEN: MAX_QUERY_LEN,
    KEEP: KEEP,
    EXAMPLES: EXAMPLES,
    parseDoi: parseDoi,
    encodeDoi: encodeDoi,
    buildResolverUrl: buildResolverUrl
  };
});
