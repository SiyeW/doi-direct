/* DOI Direct - settings shape, defaults, normalisation and validation.
 *
 * normalize() and the validators are pure and unit tested. load()/save() wrap
 * chrome.storage.local and are no-ops outside an extension context.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./doi.js'));
  } else {
    root.Settings = factory(root.DOICore);
  }
})(typeof self !== 'undefined' ? self : globalThis, function (DOICore) {
  'use strict';

  var KEY = 'settings';

  var DEFAULTS = {
    enabled: true,
    doiPattern: DOICore.DEFAULT_PATTERN,
    resolverBase: DOICore.DEFAULT_RESOLVER_BASE,
    engineStates: {},   /* engine id -> boolean; absent means "use the rule default" */
    customEngines: [],  /* { id, name, host, path, param, enabled } */
    exceptions: []      /* URL globs, e.g. "example.com/*" */
  };

  function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }

  function validatePattern(pattern) {
    if (typeof pattern !== 'string' || pattern.trim() === '') {
      return { ok: false, error: 'Pattern is empty.' };
    }
    if (pattern.length > 512) {
      return { ok: false, error: 'Pattern is too long (max 512 characters).' };
    }
    try { new RegExp(pattern); }
    catch (e) { return { ok: false, error: e.message }; }
    return { ok: true };
  }

  function validateResolverBase(input) {
    if (typeof input !== 'string' || input.trim() === '') {
      return { ok: false, error: 'Resolver base is empty.' };
    }
    var build = DOICore.buildResolverUrl(input, '10.1000/x');
    if (!build) {
      return { ok: false, error: 'Must be an http(s) URL with no query string or fragment.' };
    }
    /* store the normalised form so the user sees what will actually be used */
    return { ok: true, value: build.slice(0, build.length - '10.1000/x'.length) };
  }

  /* A bare host means "everything on that host". */
  function normalizeException(input) {
    var s = String(input == null ? '' : input).trim();
    if (!s) return null;
    s = s.replace(/^https?:\/\//i, '');
    if (s.indexOf('/') === -1) s += '/*';
    return s;
  }

  function normalizeCustomEngine(raw, index) {
    if (!isPlainObject(raw)) return null;
    var host = String(raw.host || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    var path = String(raw.path || '/').trim();
    var param = String(raw.param || '').trim();
    if (!host || !/^[a-z0-9.-]+$/.test(host)) return null;
    if (!param || !/^[A-Za-z0-9_.\-\[\]]+$/.test(param)) return null;
    if (path.charAt(0) !== '/') path = '/' + path;
    return {
      id: raw.id || ('custom:' + host + path),
      name: String(raw.name || host).trim().slice(0, 60),
      host: host,
      path: path,
      param: param,
      enabled: raw.enabled !== false,
      builtIn: false
    };
  }

  function normalize(raw) {
    var out = {
      enabled: DEFAULTS.enabled,
      doiPattern: DEFAULTS.doiPattern,
      resolverBase: DEFAULTS.resolverBase,
      engineStates: {},
      customEngines: [],
      exceptions: []
    };
    if (!isPlainObject(raw)) return out;

    if (typeof raw.enabled === 'boolean') out.enabled = raw.enabled;

    var p = validatePattern(raw.doiPattern);
    if (p.ok) out.doiPattern = String(raw.doiPattern);

    var r = validateResolverBase(raw.resolverBase);
    if (r.ok) out.resolverBase = r.value;

    if (isPlainObject(raw.engineStates)) {
      Object.keys(raw.engineStates).forEach(function (k) {
        if (typeof raw.engineStates[k] === 'boolean') out.engineStates[k] = raw.engineStates[k];
      });
    }

    if (Array.isArray(raw.customEngines)) {
      raw.customEngines.forEach(function (e, i) {
        var n = normalizeCustomEngine(e, i);
        if (n) out.customEngines.push(n);
      });
    }

    if (Array.isArray(raw.exceptions)) {
      raw.exceptions.forEach(function (e) {
        var n = normalizeException(e);
        if (n && out.exceptions.indexOf(n) === -1) out.exceptions.push(n);
      });
    }
    return out;
  }

  function load(cb) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      cb(normalize(null));
      return;
    }
    chrome.storage.local.get(KEY, function (o) {
      cb(normalize(o && o[KEY]));
    });
  }

  function save(value, cb) {
    var n = normalize(value);
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      if (cb) cb(n);
      return;
    }
    var patch = {};
    patch[KEY] = n;
    chrome.storage.local.set(patch, function () { if (cb) cb(n); });
  }

  return {
    KEY: KEY,
    DEFAULTS: DEFAULTS,
    normalize: normalize,
    validatePattern: validatePattern,
    validateResolverBase: validateResolverBase,
    normalizeException: normalizeException,
    normalizeCustomEngine: normalizeCustomEngine,
    load: load,
    save: save
  };
});
