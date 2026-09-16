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

  DOI18n.apply(function () {
    Settings.load(function (loaded) {
      current = loaded;
      render();
    });
  });
})();
