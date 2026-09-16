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

  /* settings.enabled is the master switch. Callers check it as early as they
   * can so path A can bail out before waking up for nothing. Turning a single
   * engine off is the per-engine switch in the engine list, not a rule here. */
  function attempt(url, settings) {
    try {
      if (!settings || settings.enabled === false) return null;
      var m = EngineRules.match(url, settings);
      if (!m || !m.enabled) return null;
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

  return { attempt: attempt };
});
