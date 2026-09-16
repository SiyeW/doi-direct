/* DOI Direct - built-in search engine rules and URL matching.
 *
 * Pure data and pure functions, no chrome.* access, so this is unit testable.
 *
 * Startpage and DuckDuckGo's no-JavaScript version are absent on purpose: both
 * submit searches with POST, so the query never appears in the URL.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.EngineRules = factory(); }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* Google's regional domains are separate sites, and a match pattern cannot express
   * "*.google.*", so they are listed one by one. Anything missing can be added as a
   * custom search engine. Bing needs one entry: its regional domains only redirect
   * back to www.bing.com. */
  var GOOGLE_HOSTS = [
    'google.com', 'google.co.uk', 'google.de', 'google.fr', 'google.es',
    'google.it', 'google.nl', 'google.ca', 'google.com.au', 'google.co.jp',
    'google.co.in', 'google.com.br', 'google.com.tw', 'google.com.hk',
    'google.co.kr', 'google.ru', 'google.pl', 'google.com.mx'
  ];

  function builtIn() {
    return [
      { id: 'google', name: 'Google', hosts: GOOGLE_HOSTS, path: '/search', param: 'q' },
      { id: 'bing', name: 'Bing', hosts: ['bing.com'], path: '/search', param: 'q' },
      { id: 'baidu', name: 'Baidu', hosts: ['baidu.com'], path: '/s', param: 'wd' },
      { id: 'duckduckgo', name: 'DuckDuckGo', hosts: ['duckduckgo.com'], path: '/', param: 'q' },
      { id: 'sogou', name: 'Sogou', hosts: ['sogou.com'], path: '/web', param: 'query' },
      { id: 'so360', name: '360 Search', hosts: ['so.com'], path: '/s', param: 'q' },
      { id: 'brave', name: 'Brave Search', hosts: ['search.brave.com'], path: '/search', param: 'q' },
      { id: 'yahoo', name: 'Yahoo', hosts: ['search.yahoo.com'], path: '/search', param: 'p' },
      { id: 'ecosia', name: 'Ecosia', hosts: ['ecosia.org'], path: '/search', param: 'q' }
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

  /* Returns { rule, url } for the first rule that matches the URL and is switched on,
   * or null. A rule whose query parameter is absent is passed over, which is what lets
   * two engines share a host and path and differ only by parameter; a rule that is
   * switched off is passed over too, so it cannot shadow another. */
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
      if (rule.param && u.searchParams.get(rule.param) === null) continue;
      if (!isEnabled(rule, settings)) continue;
      return { rule: rule, url: u };
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
    isEnabled: isEnabled,
    match: match,
    hostPatterns: hostPatterns
  };
});
