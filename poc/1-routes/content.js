/* Route B: document_start content script.
 *
 * 1) It opens with a synchronous prefilter: anything that is not a supported search
 *    engine page returns immediately without reading storage, so ordinary browsing
 *    costs nothing.
 * 2) While the document is prerendering it does not act straight away. It waits for
 *    prerenderingchange and then re-reads location, because the location of a
 *    prerendered document at document_start is not necessarily its final one.
 * 3) It does not depend on the webRequest path: when the page never loads, this
 *    script never runs.
 */
(function () {
  'use strict';
  var SRC = 'B';

  if (window.top !== window) return;   /* top frame only */

  /* synchronous prefilter: anything else returns here */
  if (!DOICore.matchEngine(location.href)) return;

  var MODE = null;
  function log(msg, extra) { POCLog.log(SRC, msg, extra); }
  function bEnabled(m) { return m === 'B' || m === 'AB'; }

  var startHit = DOICore.resolveFromUrl(location.href, {});

  /* past this point it is a supported search engine page */
  log('content script start', {
    href: location.href,
    prerendering: (document.prerendering === true),
    visibilityState: document.visibilityState,
    DOI: startHit ? startHit.doi : null,
    urlHadDoiAtStart: !!startHit
  });

  function act(reason) {
    var hit = DOICore.resolveFromUrl(location.href, {});
    log('act(' + reason + ')', {
      href: location.href,
      prerendering: (document.prerendering === true),
      DOI: hit ? hit.doi : null,
      urlHadDoiAtStart: !!startHit
    });
    if (!hit) return;
    if (!bEnabled(MODE)) { log('mode=' + MODE + ' -> no action', { DOI: hit.doi }); return; }
    log('REDIRECT -> ' + hit.target, { t: Date.now(), DOI: hit.doi });
    location.replace(hit.target);
  }

  function decide() {
    if (document.prerendering) {
      log('prerender: waiting for prerenderingchange', { href: location.href });
      document.addEventListener('prerenderingchange', function () {
        log('prerenderingchange', { href: location.href });
        act('prerenderingchange');
      }, { once: true });
      return;
    }
    act('document_start');
  }

  chrome.storage.local.get({ mode: 'off' }, function (o) {
    MODE = o.mode || 'off';
    log('mode loaded', { mode: MODE });
    decide();
  });
})();
