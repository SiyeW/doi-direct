/* DOI Direct - content script (interception path B).
 *
 * Runs at document_start on the search engine hosts. This is the fallback for
 * the case path A could not win: a cold service worker takes long enough that
 * the search page may already be loading by the time it reacts.
 *
 * Two details that are easy to get wrong:
 *  - Settings live in chrome.storage and reading them is asynchronous, so the
 *    decision is made in a callback rather than synchronously.
 *  - A prerendered document has to wait for prerenderingchange before acting,
 *    otherwise the tab would be hijacked while the user is still typing.
 */
(function () {
  'use strict';

  if (window.top !== window) return;
  if (window.__doiDirectRan) return;   /* a static and a dynamic registration can both match */
  window.__doiDirectRan = true;

  function redirect() {
    Settings.load(function (settings) {
      var hit = Decide.attempt(location.href, settings);
      if (!hit) return;
      if (window.__doiDirectRedirected) return;
      window.__doiDirectRedirected = true;
      location.replace(hit.target);
    });
  }

  if (document.prerendering) {
    document.addEventListener('prerenderingchange', redirect, { once: true });
    return;
  }
  redirect();
})();
