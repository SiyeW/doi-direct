/* Options page.
 *
 * Everything previews as you type: the custom engine block shows the entry it
 * would create (and the permission it would ask for), and the DOI pattern block
 * evaluates the shipped examples plus whatever you type, live. Nothing has to be
 * submitted to find out what it does.
 *
 * Saving itself is debounced for the pattern field and immediate elsewhere.
 */
(function () {
  'use strict';

  var current = null;
  var msgTimers = {};
  var saveTimer = null;

  function el(id) { return document.getElementById(id); }

  function flash(id, text, isError) {
    var node = el(id);
    node.textContent = text || '';
    node.className = isError ? 'msg error' : 'msg';
    if (msgTimers[id]) clearTimeout(msgTimers[id]);
    if (text) {
      msgTimers[id] = setTimeout(function () {
        node.textContent = '';
        node.className = 'msg';
      }, 4000);
    }
  }

  function fillInputsFromSettings() {
    el('master').checked = current.enabled;
    el('resolverBase').value = current.resolverBase;
    el('doiPattern').value = current.doiPattern;
  }

  /* fillInputs is false when the change came from typing in a field, so that
   * re-rendering never moves the caret out from under the user. */
  function save(fillInputs) {
    Settings.save(current, function (normalized) {
      current = normalized;
      if (fillInputs) fillInputsFromSettings();
      renderLists();
      updateEnginePreview();
      runPatternTests();
    });
  }

  /* ------------------------------------------------------------- rendering */

  function renderEngines() {
    var box = el('engineList');
    box.textContent = '';
    EngineRules.builtIn().forEach(function (rule) {
      var row = document.createElement('label');
      row.className = 'row';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = EngineRules.isEnabled(rule, current);
      cb.addEventListener('change', function () {
        current.engineStates[rule.id] = cb.checked;
        save(false);
      });
      row.appendChild(cb);
      var name = document.createElement('span');
      name.textContent = rule.name;
      row.appendChild(name);
      var hosts = document.createElement('span');
      hosts.className = 'muted';
      hosts.textContent = rule.hosts.join(', ');
      row.appendChild(hosts);
      box.appendChild(row);
    });
  }

  function renderCustom() {
    var box = el('customList');
    box.textContent = '';
    if (!current.customEngines.length) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = DOI18n.t('noCustom');
      box.appendChild(empty);
      return;
    }
    current.customEngines.forEach(function (engine) {
      var row = document.createElement('div');
      row.className = 'row';

      /* The checkbox and the label sit in their own <label> so that the Remove
       * button next to them is not part of the click target. */
      var toggle = document.createElement('label');
      toggle.className = 'row-main';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = engine.enabled !== false;
      cb.addEventListener('change', function () {
        engine.enabled = cb.checked;
        save(false);
      });
      toggle.appendChild(cb);
      var name = document.createElement('span');
      name.textContent = engine.name + '  ' + engine.host + engine.path + '?' + engine.param;
      toggle.appendChild(name);
      row.appendChild(toggle);

      var btn = document.createElement('button');
      btn.textContent = DOI18n.t('remove');
      btn.addEventListener('click', function () {
        current.customEngines = current.customEngines.filter(function (e) { return e.id !== engine.id; });
        save(false);
      });
      row.appendChild(btn);

      box.appendChild(row);
    });
  }

  function renderLists() {
    renderEngines();
    renderCustom();
  }

  /* ------------------------------------------------------- engine preview */

  /* Shows nothing at all until the fields describe a usable engine. An empty box
   * reads better than an error message parked inside a preview area. */
  function updateEnginePreview() {
    var box = el('enginePreview');
    box.textContent = '';

    var entry = Settings.normalizeCustomEngine({
      name: el('ceName').value,
      host: el('ceHost').value,
      path: el('cePath').value,
      param: el('ceParam').value
    });

    if (!entry) { box.hidden = true; return; }

    box.hidden = false;
    var code = document.createElement('code');
    code.textContent = entry.name + '  ' + entry.host + entry.path + '?' + entry.param;
    box.appendChild(code);
  }

  /* -------------------------------------------------------- pattern testing */

  /* Shows what the pattern actually did - matched or did not - with no
   * interpretation layered on top. Green means it matched, red means it did not. */
  function resultBadge(matched, known) {
    var badge = document.createElement('span');
    if (!known) {
      badge.className = 'badge unknown';
      badge.textContent = '?';
      badge.title = DOI18n.t('patternInvalid');
      return badge;
    }
    badge.className = 'badge ' + (matched ? 'ok' : 'bad');
    badge.textContent = (matched ? '\u2713 ' : '\u2717 ') + DOI18n.t(matched ? 'testMatch' : 'testNoMatch');
    return badge;
  }

  function renderExamples(box, list, patternValid, pattern) {
    box.textContent = '';
    list.forEach(function (text) {
      var row = document.createElement('div');
      row.className = 'row';
      var code = document.createElement('code');
      code.textContent = text;
      row.appendChild(code);
      var matched = patternValid ? !!DOICore.parseDoi(text, pattern) : false;
      row.appendChild(resultBadge(matched, patternValid));
      box.appendChild(row);
    });
  }

  function runPatternTests() {
    var pattern = el('doiPattern').value;
    var check = Settings.validatePattern(pattern);

    var msg = el('patternMsg');
    msg.textContent = check.ok ? '' : DOI18n.t('patternInvalid');
    msg.className = check.ok ? 'msg' : 'msg error';

    renderExamples(el('acceptExamples'), DOICore.EXAMPLES.accept, check.ok, pattern);
    renderExamples(el('rejectExamples'), DOICore.EXAMPLES.reject, check.ok, pattern);
    runTestInput();
  }

  function runTestInput() {
    var out = el('testResult');
    var typed = el('testInput').value;
    var pattern = el('doiPattern').value;
    if (!typed || !Settings.validatePattern(pattern).ok) {
      out.textContent = '';
      out.className = 'msg';
      return;
    }
    var doi = DOICore.parseDoi(typed, pattern);
    out.textContent = (doi ? '\u2713 ' : '\u2717 ') + DOI18n.t(doi ? 'testMatch' : 'testNoMatch');
    out.className = doi ? 'msg' : 'msg error';
  }

  /* ---------------------------------------------------------------- wiring */

  el('master').addEventListener('change', function () {
    current.enabled = el('master').checked;
    save(true);
  });

  ['ceName', 'ceHost', 'cePath', 'ceParam'].forEach(function (id) {
    el(id).addEventListener('input', updateEnginePreview);
  });

  el('addEngine').addEventListener('click', function () {
    var entry = Settings.normalizeCustomEngine({
      name: el('ceName').value,
      host: el('ceHost').value,
      path: el('cePath').value,
      param: el('ceParam').value
    });
    if (!entry) { flash('customMsg', DOI18n.t('invalidEngine'), true); return; }

    /* The permissions API has to be called from a user gesture, which this is. */
    chrome.permissions.request({ origins: ['*://*.' + entry.host + '/*'] }, function (granted) {
      void chrome.runtime.lastError;
      if (!granted) { flash('customMsg', DOI18n.t('permissionDenied'), true); return; }
      current.customEngines.push(entry);
      el('ceName').value = '';
      el('ceHost').value = '';
      el('cePath').value = '';
      el('ceParam').value = '';
      save(false);
      updateEnginePreview();
    });
  });

  el('resolverBase').addEventListener('change', function () {
    var check = Settings.validateResolverBase(el('resolverBase').value);
    if (!check.ok) {
      flash('resolverMsg', DOI18n.t('resolverInvalid'), true);
      fillInputsFromSettings();
      return;
    }
    current.resolverBase = check.value;
    save(true);
  });

  el('resetResolver').addEventListener('click', function () {
    current.resolverBase = Settings.DEFAULTS.resolverBase;
    save(true);
  });

  el('doiPattern').addEventListener('input', function () {
    runPatternTests();                       /* live feedback while typing */
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var value = el('doiPattern').value;
      if (!Settings.validatePattern(value).ok) return;
      if (value === current.doiPattern) return;
      current.doiPattern = value;
      save(false);
    }, 400);
  });

  el('doiPattern').addEventListener('change', function () {
    if (!Settings.validatePattern(el('doiPattern').value).ok) fillInputsFromSettings();
  });

  el('testInput').addEventListener('input', runTestInput);

  el('resetPattern').addEventListener('click', function () {
    current.doiPattern = Settings.DEFAULTS.doiPattern;
    save(true);
  });

  /* Debugging aid: previews a catalogue without changing the browser's language.
   * Its own wording is deliberately not translated, and no catalogue carries a
   * string for it. */
  function fillLocalePicker() {
    var select = el('previewLocale');
    select.textContent = '';

    var auto = document.createElement('option');
    auto.value = DOI18n.AUTO;
    auto.textContent = 'Automatic';
    select.appendChild(auto);

    DOI18n.CATALOGUES.forEach(function (entry) {
      var option = document.createElement('option');
      option.value = entry[0];
      option.textContent = entry[1];
      select.appendChild(option);
    });

    DOI18n.previewLocale(function (locale) { select.value = locale; });
    select.addEventListener('change', function () {
      DOI18n.setPreviewLocale(select.value, function () { location.reload(); });
    });
  }

  fillLocalePicker();

  /* Rendering happens inside the callback: the strings it produces have to come
   * from the catalogue that was actually loaded. */
  DOI18n.apply(function () {
    Settings.load(function (loaded) {
      current = loaded;
      fillInputsFromSettings();
      renderLists();
      updateEnginePreview();
      runPatternTests();
    });
  });
})();
