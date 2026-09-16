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

  /* Exceptions are simple URL globs such as "example.com/*" or "google.com/special/*". */
  function globToRegExp(pattern) {
    var out = '';
    for (var i = 0; i < pattern.length; i++) {
      var c = pattern.charAt(i);
      if (c === '*') { out += '.*'; continue; }
      out += (REGEX_SPECIALS.indexOf(c) !== -1) ? ('\\' + c) : c;
    }
    return new RegExp('^' + out + '$', 'i');
  }

  function matchesException(url, exceptions) {
    if (!exceptions || !exceptions.length) return false;
    var stripped = String(url).replace(/^https?:\/\//i, '');
    for (var i = 0; i < exceptions.length; i++) {
      var pat = String(exceptions[i] || '').trim();
      if (!pat) continue;
      try { if (globToRegExp(pat).test(stripped)) return true; }
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
