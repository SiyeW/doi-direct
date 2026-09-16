/* DOI Direct - the interception decision.
 *
 * Both interception paths call this exact function, so path A (webRequest) and
 * path B (content script) can never drift apart in behaviour. Pure: no chrome.*
 * access, so it is unit tested.
 *
 * Anything unexpected returns null, which means "leave the navigation alone".
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./doi.js'), require('./engines.js'));
  } else {
    root.Decide = factory(root.DOICore, root.EngineRules);
  }
})(typeof self !== 'undefined' ? self : globalThis, function (DOICore, EngineRules) {
  'use strict';

  var REGEX_SPECIALS = '\\^$.|?*+()[]{}';

  /* Path globs: "*" stands for any run of characters. */
  function globToRegExp(pattern) {
    var out = '';
    for (var i = 0; i < pattern.length; i++) {
      var c = pattern.charAt(i);
      if (c === '*') { out += '.*'; continue; }
      out += (REGEX_SPECIALS.indexOf(c) !== -1) ? ('\\' + c) : c;
    }
    return new RegExp('^' + out + '$', 'i');
  }

  /* An exception is a host, optionally followed by a path: "google.com" or
   * "google.com/maps". Three rules, all of them chosen to match what a reader
   * expects rather than what is easiest to implement:
   *
   *  - A host on its own covers every path on it, and covers its subdomains too.
   *    That is the same treatment engine hosts get, so "google.com" behaves the
   *    same whether it appears in the engine list or in the exception list.
   *  - The query string and the fragment take no part in matching, so
   *    "google.com/search" covers "google.com/search?q=..." - which, on a search
   *    engine, is the only URL that ever occurs.
   *  - A path is compared exactly, so "google.com/maps" does not cover
   *    "google.com/maps/place/x". Add a "*" when a prefix is wanted. */
  function matchesException(url, exceptions) {
    if (!exceptions || !exceptions.length) return false;
    var u;
    try { u = new URL(url); } catch (e) { return false; }
    var host = u.hostname.toLowerCase();
    var path = u.pathname || '/';

    for (var i = 0; i < exceptions.length; i++) {
      var pattern = String(exceptions[i] || '').trim();
      if (!pattern) continue;

      var cut = pattern.indexOf('/');
      var patternHost = cut === -1 ? pattern : pattern.slice(0, cut);
      var patternPath = cut === -1 ? '/*' : pattern.slice(cut);
      if (patternHost.slice(0, 2) === '*.') patternHost = patternHost.slice(2);
      if (!patternHost) continue;

      if (!EngineRules.hostMatches(host, patternHost)) continue;
      try { if (globToRegExp(patternPath).test(path)) return true; }
      catch (e) { /* a broken exception must not block anything */ }
    }
    return false;
  }

  /* settings.enabled is the master switch. Callers check it as early as they
   * can so path A can bail out before waking up for nothing. */
  function attempt(url, settings) {
    try {
      if (!settings || settings.enabled === false) return null;
      var m = EngineRules.match(url, settings);
      if (!m || !m.enabled) return null;
      if (matchesException(url, settings.exceptions)) return null;
      var q = m.url.searchParams.get(m.rule.param);
      if (q === null) return null;
      var doi = DOICore.parseDoi(q, settings.doiPattern);
      if (!doi) return null;
      var target = DOICore.buildResolverUrl(settings.resolverBase, doi);
      if (!target) return null;
      return { engine: m.rule.id, engineName: m.rule.name, doi: doi, target: target };
    } catch (e) {
      return null;
    }
  }

  return {
    globToRegExp: globToRegExp,
    matchesException: matchesException,
    attempt: attempt
  };
});
