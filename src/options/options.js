/* Options page. Every change is written straight back to chrome.storage.local. */
(function () {
  'use strict';

  var current = null;
  var msgTimers = {};

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

  function save() {
    Settings.save(current, function (normalized) {
      current = normalized;
      render();
    });
  }

  function makeRow(text, badgeText, mutedText, onRemove) {
    var row = document.createElement('div');
    row.className = 'row';
    var label = document.createElement('span');
    label.textContent = text;
    row.appendChild(label);
    if (badgeText) {
      var badge = document.createElement('span');
      badge.className = 'badge';
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
    EngineRules.builtIn().forEach(function (rule) {
      var row = document.createElement('label');
      row.className = 'row';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = EngineRules.isEnabled(rule, current);
      cb.addEventListener('change', function () {
        current.engineStates[rule.id] = cb.checked;
        save();
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
        null, null,
        function () {
          current.customEngines = current.customEngines.filter(function (e) { return e.id !== engine.id; });
          save();
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
      box.appendChild(makeRow(pattern, null, null, function () {
        current.exceptions = current.exceptions.filter(function (p) { return p !== pattern; });
        save();
      }));
    });
  }

  function render() {
    el('master').checked = current.enabled;
    el('resolverBase').value = current.resolverBase;
    el('doiPattern').value = current.doiPattern;
    renderEngines();
    renderCustom();
    renderExceptions();
  }

  /* ------------------------------------------------------------- wiring */

  el('master').addEventListener('change', function () {
    current.enabled = el('master').checked;
    save();
  });

  el('addEngine').addEventListener('click', function () {
    var entry = Settings.normalizeCustomEngine({
      name: el('ceName').value,
      host: el('ceHost').value,
      path: el('cePath').value,
      param: el('ceParam').value
    });
    if (!entry) { flash('customMsg', DOI18n.t('invalidEngine'), true); return; }

    /* Permissions API has to be called from a user gesture, which this is. */
    chrome.permissions.request({ origins: ['*://*.' + entry.host + '/*'] }, function (granted) {
      void chrome.runtime.lastError;
      if (!granted) { flash('customMsg', DOI18n.t('permissionDenied'), true); return; }
      current.customEngines.push(entry);
      el('ceName').value = '';
      el('ceHost').value = '';
      el('cePath').value = '';
      el('ceParam').value = '';
      save();
    });
  });

  el('addException').addEventListener('click', function () {
    var pattern = Settings.normalizeException(el('exInput').value);
    if (!pattern) return;
    if (current.exceptions.indexOf(pattern) === -1) current.exceptions.push(pattern);
    el('exInput').value = '';
    save();
  });

  el('resolverBase').addEventListener('change', function () {
    var check = Settings.validateResolverBase(el('resolverBase').value);
    if (!check.ok) {
      flash('resolverMsg', DOI18n.t('resolverInvalid'), true);
      render();
      return;
    }
    current.resolverBase = check.value;
    save();
  });

  el('resetResolver').addEventListener('click', function () {
    current.resolverBase = Settings.DEFAULTS.resolverBase;
    save();
  });

  el('doiPattern').addEventListener('change', function () {
    var check = Settings.validatePattern(el('doiPattern').value);
    if (!check.ok) {
      flash('patternMsg', DOI18n.t('patternInvalid'), true);
      render();
      return;
    }
    current.doiPattern = el('doiPattern').value;
    save();
  });

  el('resetPattern').addEventListener('click', function () {
    current.doiPattern = Settings.DEFAULTS.doiPattern;
    save();
  });

  el('testPattern').addEventListener('click', function () {
    var doi = DOICore.parseDoi(el('testInput').value, current.doiPattern);
    var out = el('testResult');
    out.textContent = doi ? DOI18n.t('testMatch') : DOI18n.t('testNoMatch');
    out.className = doi ? 'msg' : 'msg error';
  });

  DOI18n.apply();
  Settings.load(function (loaded) {
    current = loaded;
    render();
  });
})();
