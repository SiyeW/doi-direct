/* Fills elements carrying data-i18n / data-i18n-placeholder / data-i18n-title. */
(function () {
  'use strict';
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
      setText('[data-i18n]', 'data-i18n', 'text');
      setText('[data-i18n-placeholder]', 'data-i18n-placeholder', 'placeholder');
      setText('[data-i18n-title]', 'data-i18n-title', 'title');
    },
    t: function (key) { return chrome.i18n.getMessage(key) || key; }
  };
})();
