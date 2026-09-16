/* Fills elements carrying data-i18n / data-i18n-placeholder / data-i18n-title,
 * and stamps the document with the language and direction Chrome is running in.
 *
 * The lang attribute is what lets the browser choose fonts for the writing
 * system: the Chinese, Japanese and Korean forms of the same Han character are
 * picked from it, not from CSS. Nothing here needs to know which languages
 * exist, and no language-to-font table has to be maintained. */
(function () {
  'use strict';

  function applyDocumentLocale() {
    var root = document.documentElement;
    var ui = chrome.i18n.getUILanguage();
    if (ui) root.lang = ui;
    root.dir = chrome.i18n.getMessage('@@bidi_dir') || 'ltr';
  }
  function setText(sel, attr, target) {
    var nodes = document.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) {
      var msg = chrome.i18n.getMessage(nodes[i].getAttribute(attr));
      if (!msg) continue;
      if (target === 'text') nodes[i].textContent = msg;
      else nodes[i].setAttribute(target, msg);
    }
  }
  window.DOI18n = {
    apply: function () {
      applyDocumentLocale();
      setText('[data-i18n]', 'data-i18n', 'text');
      setText('[data-i18n-placeholder]', 'data-i18n-placeholder', 'placeholder');
      setText('[data-i18n-title]', 'data-i18n-title', 'title');
    },
    t: function (key) { return chrome.i18n.getMessage(key) || key; }
  };
})();
