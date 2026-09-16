/* Localisation and page environment for extension pages.
 *
 * Chrome chooses the catalogue from the browser's UI language with no runtime
 * override, so the language picker loads a catalogue itself and this module prefers
 * it while one is loaded. The default stays chrome.i18n.
 */
(function () {
  'use strict';

  var PREVIEW_KEY = 'previewLocale';
  var AUTO = 'auto';

  /* The preview needs this because Chrome's @@bidi_dir describes the browser's
   * language, not the one being previewed. */
  var RTL = ['ar', 'fa', 'he', 'ur'];

  /* Mirrors the _locales directory. A test keeps the two in step. */
  var CATALOGUES = [
    ['ar', 'العربية'],
    ['de', 'Deutsch'],
    ['en', 'English'],
    ['es', 'Español'],
    ['fa', 'فارسی'],
    ['fr', 'Français'],
    ['he', 'עברית'],
    ['hi', 'हिन्दी'],
    ['id', 'Bahasa Indonesia'],
    ['it', 'Italiano'],
    ['ja', '日本語'],
    ['ko', '한국어'],
    ['nl', 'Nederlands'],
    ['pl', 'Polski'],
    ['pt_BR', 'Português (Brasil)'],
    ['pt_PT', 'Português (Portugal)'],
    ['ru', 'Русский'],
    ['th', 'ไทย'],
    ['tr', 'Türkçe'],
    ['uk', 'Українська'],
    ['vi', 'Tiếng Việt'],
    ['zh_CN', '简体中文'],
    ['zh_TW', '繁體中文']
  ];

  var preview = null;   /* { locale, messages } while a preview catalogue is loaded */

  function t(key) {
    if (preview && preview.messages[key]) return preview.messages[key].message;
    return chrome.i18n.getMessage(key) || key;
  }

  function setText(selector, attr, target) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      var message = t(nodes[i].getAttribute(attr));
      if (!message) continue;
      if (target === 'text') nodes[i].textContent = message;
      else nodes[i].setAttribute(target, message);
    }
  }

  /* lang is what lets the browser choose fonts for the writing system, so it
   * follows the previewed language rather than the browser's. */
  function applyDocumentLocale() {
    var root = document.documentElement;
    if (preview) {
      root.lang = preview.locale.replace('_', '-');
      root.dir = RTL.indexOf(preview.locale) !== -1 ? 'rtl' : 'ltr';
    } else {
      root.lang = chrome.i18n.getUILanguage() || 'en';
      root.dir = chrome.i18n.getMessage('@@bidi_dir') || 'ltr';
    }
  }

  function paint() {
    applyDocumentLocale();
    setText('[data-i18n]', 'data-i18n', 'text');
    setText('[data-i18n-placeholder]', 'data-i18n-placeholder', 'placeholder');
    setText('[data-i18n-title]', 'data-i18n-title', 'title');
  }

  /* Callers must render inside the callback: their dynamic strings come from the
   * catalogue that was loaded. */
  function apply(cb) {
    chrome.storage.local.get(PREVIEW_KEY, function (stored) {
      var locale = stored && stored[PREVIEW_KEY];
      if (!locale || locale === AUTO) {
        preview = null;
        paint();
        if (cb) cb();
        return;
      }
      fetch(chrome.runtime.getURL('_locales/' + locale + '/messages.json'))
        .then(function (response) { return response.json(); })
        .then(function (messages) { preview = { locale: locale, messages: messages }; })
        .catch(function () { preview = null; })
        .then(function () { paint(); if (cb) cb(); });
    });
  }

  function setPreviewLocale(locale, cb) {
    var patch = {};
    patch[PREVIEW_KEY] = locale || AUTO;
    chrome.storage.local.set(patch, function () { if (cb) cb(); });
  }

  function previewLocale(cb) {
    chrome.storage.local.get(PREVIEW_KEY, function (stored) {
      cb((stored && stored[PREVIEW_KEY]) || AUTO);
    });
  }

  window.DOI18n = {
    AUTO: AUTO,
    CATALOGUES: CATALOGUES,
    apply: apply,
    t: t,
    setPreviewLocale: setPreviewLocale,
    previewLocale: previewLocale
  };
})();
