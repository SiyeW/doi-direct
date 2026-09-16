/* DOI Direct - service worker (interception path A).
 *
 * Observes main-frame navigation requests with webRequest.onBeforeRequest and
 * sends the tab to the resolver with chrome.tabs.update. The request may
 * already be on its way by the time this runs; path B in content.js is the
 * fallback for exactly that case.
 *
 * Notes that matter:
 *  - The tabs permission is deliberately NOT requested: tabs.update does not need it.
 *  - Listeners are registered synchronously at the top level so a sleeping
 *    service worker is woken by them.
 *  - Settings are read once and cached; if an event arrives before the read
 *    completes, the decision waits for it rather than guessing.
 */
importScripts('/src/core/doi.js', '/src/core/engines.js', '/src/core/settings.js', '/src/core/decide.js');

var BASE_FILTER = EngineRules.hostPatterns();
var CONTENT_SCRIPT_ID = 'doi-direct-custom';
var CONTENT_FILES = [
  '/src/core/doi.js',
  '/src/core/engines.js',
  '/src/core/settings.js',
  '/src/core/decide.js',
  '/src/content.js'
];

/* ---------------------------------------------------------------- settings */

var settingsCache = null;
var waiting = [];

function withSettings(cb) {
  if (settingsCache) { cb(settingsCache); return; }
  waiting.push(cb);
  if (waiting.length > 1) return;
  Settings.load(function (s) {
    settingsCache = s;
    var queued = waiting;
    waiting = [];
    for (var i = 0; i < queued.length; i++) queued[i](settingsCache);
  });
}

/* --------------------------------------------------------------- path A */

function isOutermost(details) {
  /* Prefer frameType: a prerendered page's outermost frame does not have frameId 0. */
  if (typeof details.frameType === 'string') return details.frameType === 'outermost_frame';
  return details.frameId === 0;
}

function onBeforeRequest(details) {
  if (details.method && details.method !== 'GET') return;
  if (!isOutermost(details)) return;
  if (details.documentLifecycle === 'prerender') return;
  if (typeof details.tabId !== 'number' || details.tabId < 0) return;

  withSettings(function (settings) {
    var hit = Decide.attempt(details.url, settings);
    if (!hit) return;
    try {
      chrome.tabs.update(details.tabId, { url: hit.target }, function () {
        void chrome.runtime.lastError;   /* a failed redirect must not break anything */
      });
    } catch (e) { /* fail open */ }
  });
}

function filterFor(settings) {
  var urls = BASE_FILTER.slice();
  var custom = (settings && settings.customEngines) || [];
  for (var i = 0; i < custom.length; i++) {
    if (custom[i] && custom[i].host) urls.push('*://*.' + custom[i].host + '/*');
  }
  return urls;
}

var currentFilter = null;

function applyFilter(settings) {
  var next = filterFor(settings);
  if (currentFilter && next.join('|') === currentFilter.join('|')) return;
  try { chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest); } catch (e) {}
  chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, { urls: next, types: ['main_frame'] });
  currentFilter = next;
}

/* ------------------------------------------------- path B, custom engines */

/* Built-in engines are covered by the static content_scripts entry in the
 * manifest. Custom engines are only known at runtime, so they are registered
 * dynamically here - and removed again when the last one goes away. */
function syncContentScripts(settings) {
  if (!chrome.scripting || !chrome.scripting.registerContentScripts) return;
  var custom = ((settings && settings.customEngines) || []).filter(function (e) { return e && e.host; });
  var matches = custom.map(function (e) { return '*://*.' + e.host + '/*'; });

  var done = function () {};
  var unregister = chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  if (unregister && unregister.catch) unregister = unregister.catch(done);

  Promise.resolve(unregister).then(function () {
    if (!matches.length) return;
    return chrome.scripting.registerContentScripts([{
      id: CONTENT_SCRIPT_ID,
      matches: matches,
      js: CONTENT_FILES,
      runAt: 'document_start',
      allFrames: false,
      persistAcrossSessions: true
    }]);
  }).catch(function () {
    /* Losing the custom-engine fallback is not fatal: path A still works there. */
  });
}

/* ------------------------------------------------------------------ wiring */

chrome.storage.onChanged.addListener(function (changes, area) {
  if (area !== 'local' || !changes[Settings.KEY]) return;
  settingsCache = Settings.normalize(changes[Settings.KEY].newValue);
  var queued = waiting;
  waiting = [];
  for (var i = 0; i < queued.length; i++) queued[i](settingsCache);
  applyFilter(settingsCache);
  syncContentScripts(settingsCache);
});

function boot() {
  withSettings(function (settings) {
    applyFilter(settings);
    syncContentScripts(settings);
  });
}

chrome.runtime.onInstalled.addListener(boot);
chrome.runtime.onStartup.addListener(boot);
boot();
