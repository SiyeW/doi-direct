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

  /* A throwaway DOI, fed to buildResolverUrl only to normalise a resolver base.
   * It is never resolved and is not registered. */
  var PROBE_DOI = '10.1000/x';

  var DEFAULTS = {
    enabled: true,
    doiPattern: DOICore.DEFAULT_PATTERN,
    resolverBase: DOICore.DEFAULT_RESOLVER_BASE,
    engineStates: {},   /* engine id -> boolean; absent means "use the rule default" */
    customEngines: []   /* { id, name, host, path, param, enabled } */
  };

  function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }

  /* Both validators answer yes or no. The page shows its own translated wording,
   * so there is nothing here for it to read but the verdict. */
  function validatePattern(pattern) {
    if (typeof pattern !== 'string' || pattern.trim() === '') return { ok: false };
    if (pattern.length > 512) return { ok: false };
    try { new RegExp(pattern); }
    catch (e) { return { ok: false }; }
    return { ok: true };
  }

  function validateResolverBase(input) {
    if (typeof input !== 'string' || input.trim() === '') return { ok: false };
    var build = DOICore.buildResolverUrl(input, PROBE_DOI);
    if (!build) return { ok: false };
    /* hand back the normalised form, so the user sees what will actually be used */
    return { ok: true, value: build.slice(0, build.length - PROBE_DOI.length) };
  }

  function normalizeCustomEngine(raw) {
    if (!isPlainObject(raw)) return null;
    var host = String(raw.host || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    var path = String(raw.path || '/').trim();
    var param = String(raw.param || '').trim();
    if (!host || !/^[a-z0-9.-]+$/.test(host)) return null;
    if (!param || !/^[A-Za-z0-9_.\-\[\]]+$/.test(param)) return null;
    if (path.charAt(0) !== '/') path = '/' + path;
    /* Derived, never stored: two engines can share a host and path and differ only in
     * their query parameter, and an id from host and path alone would make them one
     * engine, so removing either would remove both. */
    return {
      id: 'custom:' + host + path + '?' + param,
      name: String(raw.name || host).trim().slice(0, 60),
      host: host,
      path: path,
      param: param,
      enabled: raw.enabled !== false
    };
  }

  function normalize(raw) {
    var out = {
      enabled: DEFAULTS.enabled,
      doiPattern: DEFAULTS.doiPattern,
      resolverBase: DEFAULTS.resolverBase,
      engineStates: {},
      customEngines: []
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
      var seen = Object.create(null);
      raw.customEngines.forEach(function (e) {
        var n = normalizeCustomEngine(e);
        if (!n || seen[n.id]) return;   /* the same engine twice is still one engine */
        seen[n.id] = 1;
        out.customEngines.push(n);
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
    normalizeCustomEngine: normalizeCustomEngine,
    load: load,
    save: save
  };
});
