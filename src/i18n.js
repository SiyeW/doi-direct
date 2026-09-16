/* Localisation and page environment for extension pages.
 *
 * Chrome chooses the catalogue from the browser's UI language and offers no way
 * to override that at runtime, so the language picker at the top of the settings
 * page loads a catalogue itself and this module prefers it while one is loaded.
 *
 * The default stays chrome.i18n, and the picker's own strings come from the
 * catalogues like every other string in the interface.
 */
(function () {
  'use strict';

  var PREVIEW_KEY = 'previewLocale';
  var AUTO = 'auto';

  /* Every language without a region is written left to right. The preview needs
   * to know this because Chrome's @@bidi_dir describes the browser's language,
   * not the one being previewed. */
  var RTL = ['ar', 'fa', 'he', 'ur'];

  /* Mirrors the _locales directory, paired with each language's own name, which
   * is what a language picker should show. A test keeps this list and the
   * directory in step. */
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

  /* Chrome injects its own font size into every extension page, and this reads it
   * back into --measured so the interface can follow the browser instead of a
   * number chosen here.
   *
   * The order matters. The stylesheets leave body's font-size alone, because
   * anything set there would be what this read returns instead of Chrome's value.
   * So the interface's own size goes on afterwards, inline, once the read is
   * done. Without it every element that carries no size of its own - the engine
   * rows, the buttons, the inputs, plain text - would keep Chrome's value while
   * the headings followed --base, and the page would come out both small and
   * inconsistent. */
  function applyBaseFontSize() {
    var body = document.body;
    var measured = getComputedStyle(body).fontSize;
    if (measured) document.documentElement.style.setProperty('--measured', measured);
    body.style.fontSize = 'var(--base)';
  }

  function paint() {
    applyBaseFontSize();
    applyDocumentLocale();
    setText('[data-i18n]', 'data-i18n', 'text');
    setText('[data-i18n-placeholder]', 'data-i18n-placeholder', 'placeholder');
    setText('[data-i18n-title]', 'data-i18n-title', 'title');
  }

  /* Reads the stored preview locale, loads that catalogue if there is one, then
   * paints and calls back. Callers must render inside the callback, not before
   * it, or their dynamic strings would come out in the browser's language. */
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
