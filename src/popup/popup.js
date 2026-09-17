/* Popup: master switch, a count, and a way into the options page. */
(function () {
  'use strict';

  var current = null;

  function el(id) { return document.getElementById(id); }

  function enabledEngineCount(settings) {
    var n = 0;
    EngineRules.builtIn().forEach(function (rule) {
      if (EngineRules.isEnabled(rule, settings)) n++;
    });
    (settings.customEngines || []).forEach(function (engine) {
      if (engine.enabled !== false) n++;
    });
    return n;
  }

  function render() {
    el('master').checked = current.enabled;
    el('status').textContent = DOI18n.t(current.enabled ? 'popupOn' : 'popupOff');
    el('count').textContent = String(enabledEngineCount(current));
  }

  el('master').addEventListener('change', function () {
    current.enabled = el('master').checked;
    Settings.save(current, function (normalized) {
      current = normalized;
      render();
    });
  });

  el('openOptions').addEventListener('click', function () {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  /* Every footer address is derived from homepage_url, so the manifest is the only
   * place to change one. */
  function fillFooter() {
    var manifest = chrome.runtime.getManifest();
    if (!manifest.homepage_url) return;
    el('repoLink').href = manifest.homepage_url;
    el('issuesLink').href = manifest.homepage_url + '/issues';
    el('licenseLink').href = manifest.homepage_url + '/blob/main/LICENSE';
    el('releasesLink').href = manifest.homepage_url + '/releases';
    el('releasesLink').textContent = manifest.version;
  }

  DOI18n.apply(function () {
    fillFooter();
    Settings.load(function (loaded) {
      current = loaded;
      render();
    });
  });
})();
