/* Unit tests for the pure core. Node only, no browser required.
 * Run: node tests/core.test.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DOICore = require('../src/core/doi.js');
const EngineRules = require('../src/core/engines.js');
const Settings = require('../src/core/settings.js');
const Decide = require('../src/core/decide.js');

let pass = 0, fail = 0;
const failures = [];

function eq(actual, expected, label) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a === b) { pass++; return; }
  fail++;
  failures.push(label + '\n      expected: ' + b + '\n      actual:   ' + a);
}
function ok(cond, label) { eq(!!cond, true, label); }

/* ---------- DOI matching ---------- */

/* The shipped examples are asserted here too, so the options page and the test
 * suite can never disagree about what the pattern is supposed to do. */
DOICore.EXAMPLES.accept.forEach(s => ok(DOICore.parseDoi(s), 'shipped example should accept: ' + s));
DOICore.EXAMPLES.reject.forEach(s => eq(DOICore.parseDoi(s), null, 'shipped example should reject: ' + JSON.stringify(s)));

const ACCEPT = [
  '10.21/FQSQT4T3',                       /* a 2-digit registrant code really exists */
  '  10.1038/nature12373  ',              /* surrounding whitespace */
  '10.1002/1097-0142(195109)4:5<1036::aid-cncr2820040521>3.0.co;2-a',
  '10.1016/0014-5793(88)81340-1'
];
ACCEPT.forEach(s => ok(DOICore.parseDoi(s), 'should accept: ' + s));

const REJECT = [
  '10.1038/example abstract', 'what is 10.1038/example',
  'papers citing 10.1038/example', 'doi:', '', '   '
];
REJECT.forEach(s => eq(DOICore.parseDoi(s), null, 'should reject: ' + JSON.stringify(s)));

eq(DOICore.parseDoi('10.1038/' + 'x'.repeat(4000)), null, 'oversized input is rejected');
eq(DOICore.parseDoi('10.1038/x', '('), null, 'a broken pattern fails open');

/* ---------- encoding (DOI Handbook whitelist) ---------- */
eq(DOICore.encodeDoi('10.1000/res#test'), '10.1000/res%23test', 'must encode #');
eq(DOICore.encodeDoi('10.1000/a?b'), '10.1000/a%3Fb', 'must encode ?');
eq(DOICore.encodeDoi('10.1000/a b'), '10.1000/a%20b', 'must encode space');
eq(DOICore.encodeDoi('10.1000/100%'), '10.1000/100%25', 'must encode %');
eq(DOICore.encodeDoi('10.1000/a"b'), '10.1000/a%22b', 'must encode "');
eq(DOICore.encodeDoi('10.1000/a<b>c'), '10.1000/a%3Cb%3Ec', 'encodes < >');
eq(DOICore.encodeDoi('10.1000/a(b)c;d:e'), '10.1000/a(b)c;d:e', 'keeps ( ) ; : literal');
eq(DOICore.encodeDoi('10.1038/sub/dir'), '10.1038/sub/dir', 'keeps the slash literal');
eq(DOICore.encodeDoi('10.1000/a-b_c.d~e'), '10.1000/a-b_c.d~e', 'keeps - _ . ~ literal');
eq(DOICore.encodeDoi('10.1000/中文'), '10.1000/%E4%B8%AD%E6%96%87', 'non-ASCII goes through UTF-8');

/* ---------- resolver ---------- */
eq(DOICore.buildResolverUrl('https://doi.org/', '10.1038/x'), 'https://doi.org/10.1038/x', 'default base');
eq(DOICore.buildResolverUrl('https://doi.org', '10.1038/x'), 'https://doi.org/10.1038/x', 'adds the trailing slash');
eq(DOICore.buildResolverUrl('doi.org', '10.1038/x'), 'https://doi.org/10.1038/x', 'adds a scheme');
eq(DOICore.buildResolverUrl('https://lib.example.edu/resolve', '10.1038/x'),
   'https://lib.example.edu/resolve/10.1038/x', 'custom base');
eq(DOICore.buildResolverUrl('javascript:alert(1)', '10.1038/x'), null, 'rejects javascript:');
eq(DOICore.buildResolverUrl('data:text/html,x', '10.1038/x'), null, 'rejects data:');
eq(DOICore.buildResolverUrl('https://r.example.edu/?doi=', '10.1038/x'), null, 'rejects a query-carrying base');
eq(DOICore.buildResolverUrl('https://doi.org/', ''), null, 'rejects an empty DOI');

/* ---------- engine matching (URL shapes verified against the live engines) ---------- */
const S = Settings.DEFAULTS;
const MATCH = [
  ['https://www.google.com/search?q=10.1038%2Fx', 'google'],
  ['https://www.google.co.uk/search?q=10.1038%2Fx', 'google'],
  ['https://cn.bing.com/search?q=10.1038%2Fx&form=QBLH', 'bing'],
  ['https://www.baidu.com/s?wd=10.1038%2Fx&ie=utf-8', 'baidu'],
  ['https://duckduckgo.com/?q=10.1038%2Fx', 'duckduckgo'],
  ['https://www.sogou.com/web?query=10.1038%2Fx&ie=utf8', 'sogou'],
  ['https://www.so.com/s?q=10.1038%2Fx', 'so360'],
  ['https://search.brave.com/search?q=10.1038%2Fx', 'brave'],
  ['https://search.yahoo.com/search?p=10.1038%2Fx', 'yahoo'],
  /* the exact shape a real Ecosia search produced, extra parameters and all */
  ['https://www.ecosia.org/search?method=index&ar=1&q=10.1038%2Fx', 'ecosia']
];
MATCH.forEach(function (pair) {
  const url = pair[0], engine = pair[1];
  const r = Decide.attempt(url, S);
  eq(r && r.engine, engine, 'engine: ' + url);
  eq(r && r.doi, '10.1038/x', 'doi: ' + url);
  eq(r && r.target, 'https://doi.org/10.1038/x', 'target: ' + url);
});

const NO_MATCH = [
  'https://www.google.com/maps?q=10.1038%2Fx',
  'https://www.google.com/search?oq=10.1038%2Fx',
  'https://www.google.com/search?q=10.1038%2Fexample+pdf',
  'https://example.com/search?q=10.1038%2Fx',
  'https://www.google.com.evil.test/search?q=10.1038%2Fx',
  /* These two are not built in: both submit searches with POST and keep the
   * query out of the URL, so they can never be supported this way. */
  'https://www.startpage.com/sp/search?query=10.1038%2Fx',
  'https://html.duckduckgo.com/html/?q=10.1038%2Fx',
  'chrome://newtab/',
  'not a url'
];
NO_MATCH.forEach(u => eq(Decide.attempt(u, S), null, 'no redirect: ' + u));

eq(Decide.attempt('https://cn.bing.com/search?q=10.1038%2Fx', Settings.normalize({ engineStates: { bing: false } })),
   null, 'a disabled engine is skipped');
eq(Decide.attempt('https://www.google.com/search?q=10.1038%2Fx', Settings.normalize({ enabled: false })),
   null, 'master switch off');
const ge = Decide.attempt('https://www.google.com/search?q=10.1038%2Fx', Settings.normalize({ engineStates: { google: true } }));
eq(ge && ge.target, 'https://doi.org/10.1038/x', 'an explicitly enabled engine still works');

/* custom engine */
const custom = Settings.normalize({
  customEngines: [{ name: 'Library', host: 'search.example.edu', path: '/query', param: 'text' }]
});
const cr = Decide.attempt('https://search.example.edu/query?text=10.1038%2Fx', custom);
eq(cr && cr.doi, '10.1038/x', 'custom engine works');
eq(cr && cr.target, 'https://doi.org/10.1038/x', 'custom engine target');
eq(Decide.attempt('https://search.example.edu/other?text=10.1038%2Fx', custom), null, 'custom engine path is respected');

/* a custom engine can be switched off without deleting it */
const customOff = Settings.normalize({
  customEngines: [{ name: 'Library', host: 'search.example.edu', path: '/query', param: 'text', enabled: false }]
});
eq(customOff.customEngines[0].enabled, false, 'the off flag survives normalisation');
eq(Decide.attempt('https://search.example.edu/query?text=10.1038%2Fx', customOff), null,
   'a disabled custom engine is skipped');

/* ---------- settings normalisation ---------- */
const n1 = Settings.normalize(null);
eq(n1.enabled, true, 'defaults when empty');
eq(n1.doiPattern, DOICore.DEFAULT_PATTERN, 'default pattern');
eq(n1.resolverBase, DOICore.DEFAULT_RESOLVER_BASE, 'default resolver');
const n2 = Settings.normalize({
  enabled: 'yes', doiPattern: '(', resolverBase: 'javascript:x',
  customEngines: [{ host: '' }, { host: 'ok.edu', param: 'q' }]
});
eq(n2.enabled, true, 'a non-boolean enabled falls back');
eq(n2.doiPattern, DOICore.DEFAULT_PATTERN, 'a broken pattern falls back');
eq(n2.resolverBase, DOICore.DEFAULT_RESOLVER_BASE, 'an unsafe resolver falls back');
eq(n2.customEngines.length, 1, 'an invalid custom engine is dropped');
eq(Object.keys(n1).sort(),
   ['customEngines', 'doiPattern', 'enabled', 'engineStates', 'resolverBase'],
   'the settings shape has no stray keys');
eq(Settings.validatePattern('^a$').ok, true, 'a valid pattern is accepted');
eq(Settings.validatePattern('(').ok, false, 'an invalid pattern is rejected');
eq(Settings.validateResolverBase('https://r.example.edu/').ok, true, 'a valid resolver is accepted');
eq(Settings.validateResolverBase('https://r.example.edu/?doi=').ok, false, 'a query resolver is rejected');

/* ---------- manifest consistency ---------- */
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
const expected = EngineRules.hostPatterns().slice().sort();
eq((manifest.host_permissions || []).slice().sort(), expected, 'manifest host_permissions match the engine list');
eq((manifest.content_scripts[0].matches || []).slice().sort(), expected, 'content_scripts.matches match too');
ok(manifest.permissions.indexOf('tabs') === -1, 'the tabs permission is not requested');
ok(manifest.permissions.indexOf('webRequest') !== -1, 'webRequest is requested');
ok(!(manifest.host_permissions || []).some(p => p === '<all_urls>' || p === '*://*/*'),
   'no broad host permission is required up front');

/* ---------- locales ---------- */
/* These checks exist so that hand-editing a translation cannot silently break
 * the extension: a stray comma, a key that only exists in one language, or a
 * message referenced from the UI but missing from the catalogue all fail here. */
const LOCALE_ROOT = path.join(__dirname, '..', '_locales');
/* Discovered rather than listed, so adding a language is a matter of copying a
 * folder and nothing else. */
const LOCALES = fs.readdirSync(LOCALE_ROOT)
  .filter(function (name) { return fs.statSync(path.join(LOCALE_ROOT, name)).isDirectory(); })
  .sort();
const catalogues = {};
ok(LOCALES.indexOf('en') !== -1, 'an English catalogue exists');

LOCALES.forEach(function (loc) {
  const file = path.join(__dirname, '..', '_locales', loc, 'messages.json');
  let parsed = null;
  let err = null;
  try { parsed = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { err = e.message; }
  eq(err, null, 'locale file parses: ' + loc + (err ? '  (' + err + ')' : ''));
  catalogues[loc] = parsed || {};
});

const baseKeys = Object.keys(catalogues.en || {}).sort();
ok(baseKeys.length > 20, 'the English catalogue is populated');

LOCALES.forEach(function (loc) {
  eq(Object.keys(catalogues[loc]).sort(), baseKeys, 'same keys as English: ' + loc);
  baseKeys.forEach(function (key) {
    const entry = catalogues[loc][key];
    const text = entry && entry.message;
    ok(typeof text === 'string' && text.trim() !== '', 'non-empty message: ' + loc + '/' + key);
  });
});

/* the product name is a proper noun */
LOCALES.forEach(function (loc) {
  ok(String(catalogues[loc].extName.message).indexOf('DOI Direct') !== -1,
     'the product name survives translation: ' + loc);
});

/* Every message the UI asks for must exist. A key can be chosen by a ternary -
 * DOI18n.t(on ? 'popupOn' : 'popupOff') - so collect every quoted word inside
 * each call rather than only the plain t('key') form. */
function keysPassedToT(src) {
  const found = new Set();
  const marker = 'DOI18n.t(';
  let at = src.indexOf(marker);
  while (at !== -1) {
    let depth = 1;
    let i = at + marker.length;
    let args = '';
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      if (depth > 0) args += c;
      i++;
    }
    const re = /'([A-Za-z0-9_]+)'/g;
    let m;
    while ((m = re.exec(args)) !== null) found.add(m[1]);
    at = src.indexOf(marker, at + 1);
  }
  return found;
}

const referenced = new Set();
['src/options/options.js', 'src/popup/popup.js'].forEach(function (rel) {
  const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  keysPassedToT(src).forEach(function (k) { referenced.add(k); });
});
['src/options/options.html', 'src/popup/popup.html'].forEach(function (rel) {
  const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const re = /data-i18n(?:-placeholder|-title)?="([A-Za-z0-9_]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) referenced.add(m[1]);
});
eq(Array.from(referenced).filter(k => !catalogues.en[k]).sort(), [],
   'every message used by the UI exists in the catalogue');

/* The manifest pulls its name and description through __MSG_ too. */
const manifestRaw = fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8');
const msgRe = /__MSG_([A-Za-z0-9_]+)__/g;
let msgMatch;
while ((msgMatch = msgRe.exec(manifestRaw)) !== null) referenced.add(msgMatch[1]);
ok(referenced.has('extName') && referenced.has('extDescription'),
   'the manifest localises its name and description');

/* And nothing should be left in the catalogue that no longer has a caller. */
eq(baseKeys.filter(k => !referenced.has(k)).sort(), [], 'no unused message keys');

ok(LOCALES.indexOf(manifest.default_locale) !== -1, 'default_locale points at a shipped catalogue');

/* ---------- report ---------- */
console.log('');
console.log(pass + ' passed, ' + fail + ' failed');
if (fail) {
  console.log('');
  failures.forEach(f => console.log('  x ' + f));
  process.exitCode = 1;
} else {
  console.log('all good');
}
