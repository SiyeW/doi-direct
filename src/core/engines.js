/* DOI Direct - built-in search engine rules and URL matching.
 *
 * Pure data + pure functions, no chrome.* access, so this is unit testable.
 *
 * Every rule below was checked against the live site: the search URL was loaded
 * and the query came back in the result.
 *
 * Two engines are deliberately absent because they cannot work here at all.
 * Startpage and DuckDuckGo's no-JavaScript version (html.duckduckgo.com) both
 * submit searches with POST, so the query never appears in the URL and there is
 * nothing for this extension to read.
 *
 * Note for anyone re-verifying: curl does not use the Windows system proxy by
 * default while Invoke-WebRequest does, so testing with curl and no --proxy
 * gives false negatives for engines blocked on the local network.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.EngineRules = factory(); }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* Google's regional domains have to be listed one by one: a match pattern
   * cannot express "*.google.*", and each ccTLD is a separate site that stays on
   * its own domain. This is a curated subset covering the most used regions;
   * anything missing can be added as a custom search engine.
   *
   * Bing owns regional domains too (bing.de, bing.co.uk, ...) but they are only
   * redirectors: bing.de/search?q=x answers 301 to
   * www.bing.com/search?q=x&cc=de, so Bing folds every region back into one
   * site. Chrome ships www.bing.com, plus cn.bing.com for China, which is a
   * subdomain and therefore already covered by suffix matching. One entry is
   * enough - and even if a browser started at bing.de, the redirect would land
   * on www.bing.com where this rule does match. */
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

  /* Returns { rule, url } for the first rule that both matches the URL and is
   * switched on, or null.
   *
   * Two things decide which rule wins. A rule whose query parameter is absent has
   * nothing to read, so it is passed over rather than ending the search - that is
   * what lets two engines share a host and a path and differ only by parameter.
   * And a rule that is switched off is passed over too, so it cannot shadow
   * another rule that would have matched. */
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
