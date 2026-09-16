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

  function makeRow(text, badgeText, badgeClass, mutedText, onRemove) {
    var row = document.createElement('div');
    row.className = 'row';
    var label = document.createElement('span');
    label.textContent = text;
    row.appendChild(label);
    if (badgeText) {
      var badge = document.createElement('span');
      badge.className = 'badge' + (badgeClass ? ' ' + badgeClass : '');
      badge.textContent = badgeText;
      row.appendChild(badge);
    }
    if (mutedText) {
      var muted = document.createElement('span');
      muted.className = 'muted';
      muted.textContent = mutedText;
      row.appendChild(muted);
    }
    if (onRemove) {
      var btn = document.createElement('button');
      btn.textContent = DOI18n.t('remove');
      btn.addEventListener('click', onRemove);
      row.appendChild(btn);
    }
    return row;
  }

  function renderEngines() {
    var box = el('engineList');
    box.textContent = '';
    var rules = EngineRules.builtIn();

    /* the "not verified" note only makes sense while something is unverified */
    el('notVerifiedHint').hidden = !rules.some(function (r) { return r.verified === false; });

    rules.forEach(function (rule) {
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
      if (rule.verified === false) {
        var badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = DOI18n.t('notVerified');
        row.appendChild(badge);
      }
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
      box.appendChild(makeRow(
        engine.name + '  ' + engine.host + engine.path + '?' + engine.param,
        null, null, null,
        function () {
          current.customEngines = current.customEngines.filter(function (e) { return e.id !== engine.id; });
          save(false);
        }
      ));
    });
  }

  function renderExceptions() {
    var box = el('exceptionList');
    box.textContent = '';
    if (!current.exceptions.length) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = DOI18n.t('noExceptions');
      box.appendChild(empty);
      return;
    }
    current.exceptions.forEach(function (pattern) {
      box.appendChild(makeRow(pattern, null, null, null, function () {
        current.exceptions = current.exceptions.filter(function (p) { return p !== pattern; });
        save(false);
      }));
    });
  }

  function renderLists() {
    renderEngines();
    renderCustom();
    renderExceptions();
  }

  /* ------------------------------------------------------- engine preview */

  function previewLine(box, key, value) {
    var row = document.createElement('div');
    if (key) {
      var k = document.createElement('span');
      k.className = 'k';
      k.textContent = key + ': ';
      row.appendChild(k);
    }
    var v = document.createElement('code');
    v.textContent = value;
    row.appendChild(v);
    box.appendChild(row);
  }

  function updateEnginePreview() {
    var box = el('enginePreview');
    box.textContent = '';

    var entry = Settings.normalizeCustomEngine({
      name: el('ceName').value,
      host: el('ceHost').value,
      path: el('cePath').value,
      param: el('ceParam').value
    });

    if (!entry) {
      var empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = DOI18n.t('invalidEngine');
      box.appendChild(empty);
      return;
    }

    previewLine(box, DOI18n.t('enginePreview'),
      entry.name + '  ' + entry.host + entry.path + '?' + entry.param);
    previewLine(box, DOI18n.t('enginePreviewPermission'), '*://*.' + entry.host + '/*');
    previewLine(box, DOI18n.t('enginePreviewExample'),
      'https://' + entry.host + entry.path + '?' + entry.param + '=' +
      encodeURIComponent(DOICore.EXAMPLES.accept[0]) + '  ->  https://doi.org/' + DOICore.EXAMPLES.accept[0]);
  }

  /* -------------------------------------------------------- pattern testing */

  function resultBadge(correct, known) {
    var badge = document.createElement('span');
    if (!known) {
      badge.className = 'badge unknown';
      badge.textContent = '?';
      return badge;
    }
    badge.className = 'badge ' + (correct ? 'ok' : 'bad');
    badge.textContent = correct ? '\u2713' : '\u2717';
    badge.title = DOI18n.t(correct ? 'exampleCorrect' : 'exampleWrong');
    return badge;
  }

  function renderExamples(box, list, shouldMatch, patternValid, pattern) {
    box.textContent = '';
    list.forEach(function (text) {
      var row = document.createElement('div');
      row.className = 'row';
      var code = document.createElement('code');
      code.textContent = text;
      row.appendChild(code);
      var matched = patternValid ? !!DOICore.parseDoi(text, pattern) : false;
      row.appendChild(resultBadge(matched === shouldMatch, patternValid));
      box.appendChild(row);
    });
  }

  function runPatternTests() {
    var pattern = el('doiPattern').value;
    var check = Settings.validatePattern(pattern);

    var msg = el('patternMsg');
    msg.textContent = check.ok ? '' : DOI18n.t('patternInvalid');
    msg.className = check.ok ? 'msg' : 'msg error';

    renderExamples(el('acceptExamples'), DOICore.EXAMPLES.accept, true, check.ok, pattern);
    renderExamples(el('rejectExamples'), DOICore.EXAMPLES.reject, false, check.ok, pattern);
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
    out.className = 'msg';
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

  el('addException').addEventListener('click', function () {
    var pattern = Settings.normalizeException(el('exInput').value);
    if (!pattern) return;
    if (current.exceptions.indexOf(pattern) === -1) current.exceptions.push(pattern);
    el('exInput').value = '';
    save(false);
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

  DOI18n.apply();
  Settings.load(function (loaded) {
    current = loaded;
    fillInputsFromSettings();
    renderLists();
    updateEnginePreview();
    runPatternTests();
  });
})();
