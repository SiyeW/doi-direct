/* DOI Direct - content script.
 *
 * Runs at document_start on the search engine hosts and reloads the tab with
 * location.replace. This is the path that still works when the service worker was
 * too slow to start. */
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
