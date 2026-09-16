/* DOI Direct - built-in search engine rules and URL matching.
 *
 * Pure data + pure functions, no chrome.* access, so this is unit testable.
 *
 * "verified" records whether the URL shape was actually confirmed by loading the
 * engine and checking that the query comes back in the result. Listing an engine
 * is not the same as supporting it, so anything unconfirmed ships disabled until
 * someone re-checks it.
 *
 * Ecosia and Startpage are still unverified: Ecosia answers 403 through a proxy
 * and is hijacked to another engine without one, and Startpage's search endpoint
 * is a JavaScript app that redirects unauthorised GETs back to its home page.
 *
 * Note for anyone re-verifying: curl does NOT use the Windows system proxy by
 * default, while Invoke-WebRequest does. Testing with curl but no --proxy
 * produces false negatives for engines that are blocked on the local network.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.EngineRules = factory(); }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* Google's regional domains have to be listed one by one: a match pattern
   * cannot express "*.google.*". This is a curated subset covering the most
   * used regions; anything missing can be added as a custom search engine. */
  var GOOGLE_HOSTS = [
    'google.com', 'google.co.uk', 'google.de', 'google.fr', 'google.es',
    'google.it', 'google.nl', 'google.ca', 'google.com.au', 'google.co.jp',
    'google.co.in', 'google.com.br', 'google.com.tw', 'google.com.hk',
    'google.co.kr', 'google.ru', 'google.pl', 'google.com.mx'
  ];

  function builtIn() {
    return [
      { id: 'google', name: 'Google', enabled: true, verified: true,
        hosts: GOOGLE_HOSTS, path: '/search', param: 'q' },
      { id: 'bing', name: 'Bing', enabled: true, verified: true,
        hosts: ['bing.com'], path: '/search', param: 'q' },
      { id: 'baidu', name: 'Baidu', enabled: true, verified: true,
        hosts: ['baidu.com'], path: '/s', param: 'wd' },
      { id: 'duckduckgo', name: 'DuckDuckGo', enabled: true, verified: true,
        hosts: ['duckduckgo.com'], path: '/', param: 'q' },
      { id: 'duckduckgo-html', name: 'DuckDuckGo (HTML)', enabled: true, verified: true,
        hosts: ['html.duckduckgo.com'], path: '/html/', param: 'q' },
      { id: 'sogou', name: 'Sogou', enabled: true, verified: true,
        hosts: ['sogou.com'], path: '/web', param: 'query' },
      { id: 'so360', name: '360 Search', enabled: true, verified: true,
        hosts: ['so.com'], path: '/s', param: 'q' },
      { id: 'brave', name: 'Brave Search', enabled: true, verified: true,
        hosts: ['search.brave.com'], path: '/search', param: 'q' },
      { id: 'yahoo', name: 'Yahoo', enabled: true, verified: true,
        hosts: ['search.yahoo.com'], path: '/search', param: 'p' },
      { id: 'ecosia', name: 'Ecosia', enabled: false, verified: false,
        hosts: ['ecosia.org'], path: '/search', param: 'q' },
      { id: 'startpage', name: 'Startpage', enabled: false, verified: false,
        hosts: ['startpage.com'], path: '/sp/search', param: 'query' }
    ];
  }

  function hostMatches(hostname, host) {
    var h = hostname.toLowerCase();
    return h === host || (h.length > host.length && h.slice(-(host.length + 1)) === '.' + host);
  }

  /* Path comparison is exact by default; a rule may opt into a prefix match by
   * ending the path with '*'. */
  function pathMatches(pathname, rulePath) {
    if (!rulePath || rulePath === '/') return pathname === '/' || pathname === '';
    if (rulePath.charAt(rulePath.length - 1) === '*') {
      return pathname.indexOf(rulePath.slice(0, -1)) === 0;
    }
    return pathname === rulePath;
  }

  function allRules(settings) {
    var custom = (settings && settings.customEngines) || [];
    return builtIn().concat(custom);
  }

  function isEnabled(rule, settings) {
    var states = (settings && settings.engineStates) || {};
    if (Object.prototype.hasOwnProperty.call(states, rule.id)) return !!states[rule.id];
    return rule.enabled !== false;
  }

  /* Returns { rule, url, enabled } for the first matching rule, or null. */
  function match(url, settings) {
    var u;
    try { u = new URL(url); } catch (e) { return null; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    var rules = allRules(settings);
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var hosts = rule.hosts || (rule.host ? [rule.host] : []);
      var hit = false;
      for (var j = 0; j < hosts.length; j++) {
        if (hostMatches(u.hostname, hosts[j])) { hit = true; break; }
      }
      if (!hit) continue;
      if (!pathMatches(u.pathname, rule.path)) continue;
      return { rule: rule, url: u, enabled: isEnabled(rule, settings) };
    }
    return null;
  }

  /* Chrome match patterns for the built-in engines, used for host_permissions,
   * content_scripts.matches and the webRequest url filter. A test asserts that
   * manifest.json agrees with this list. */
  function hostPatterns() {
    var seen = Object.create(null);
    var out = [];
    var rules = builtIn();
    for (var i = 0; i < rules.length; i++) {
      var hosts = rules[i].hosts || [];
      for (var j = 0; j < hosts.length; j++) {
        var p = '*://*.' + hosts[j] + '/*';
        if (!seen[p]) { seen[p] = 1; out.push(p); }
      }
    }
    return out;
  }

  return {
    builtIn: builtIn,
    allRules: allRules,
    isEnabled: isEnabled,
    match: match,
    hostMatches: hostMatches,
    pathMatches: pathMatches,
    hostPatterns: hostPatterns
  };
});
