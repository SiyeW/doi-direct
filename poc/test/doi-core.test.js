/* Unit tests for the shared core. No browser involved: node poc/test/doi-core.test.js */
'use strict';
const C = require('../shared/doi-core.js');

let pass = 0, fail = 0;
const failures = [];

function eq(actual, expected, label) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a === b) { pass++; return; }
  fail++;
  failures.push(label + '\n    expected: ' + b + '\n    actual:   ' + a);
}
function ok(cond, label) { eq(!!cond, true, label); }

/* ---------- 1. DOI matching: what is accepted ---------- */
const ACCEPT = [
  '10.1038/s41559-022-01925-6',
  '10.1016/j.xgen.2025.100928',
  '10.21/FQSQT4T3',                                   // two-digit registrant code
  'DOI: 10.1126/sciadv.adh7912',                      // prefix stripped
  'doi:10.1002/example',
  '  10.1038/nature12373  ',                          // surrounding whitespace
  '10.1002/1097-0142(195109)4:5<1036::aid-cncr2820040521>3.0.co;2-a',   // a real DOI containing < >
  '10.1016/0014-5793(88)81340-1'
];
ACCEPT.forEach(s => ok(C.parseDoi(s), 'accepted: ' + s));

eq(C.parseDoi('DOI: 10.1126/sciadv.adh7912'), '10.1126/sciadv.adh7912', 'doi: prefix stripped');
eq(C.parseDoi('  doi:10.1002/x  '), '10.1002/x', 'doi: prefix and whitespace both handled');

/* ---------- 2. what is rejected ---------- */
const REJECT = [
  '10.1038/example pdf',
  '10.1038/example abstract',
  'what is 10.1038/example',
  'papers citing 10.1038/example',
  '10.1038',
  'doi please',
  'doi:',
  ''
];
REJECT.forEach(s => eq(C.parseDoi(s), null, 'rejected: ' + JSON.stringify(s)));

/* ---------- 3. engine query extraction ---------- */
const EX = [
  ['https://www.google.com/search?q=10.1038%2Fnature12373', 'google', '10.1038/nature12373'],
  ['https://www.google.com/search?q=10.1038/nature12373&oq=10.1038&sourceid=chrome', 'google', '10.1038/nature12373'],
  ['https://www.bing.com/search?q=10.1038%2Fnature12373&form=QBLH', 'bing', '10.1038/nature12373'],
  ['https://www.baidu.com/s?wd=10.1038%2Fnature12373&ie=utf-8', 'baidu', '10.1038/nature12373'],
  ['http://www.google.com/search?q=10.1038/x', 'google', '10.1038/x']
];
EX.forEach(([url, engine, q]) => {
  const r = C.extractQuery(url);
  eq(r && r.engine, engine, 'engine: ' + url);
  eq(r && r.query, q, 'query: ' + url);
});

const NULLS = [
  'https://www.google.com/maps?q=10.1038%2Fx',        // path is not /search, must not match
  'https://www.google.com/search?oq=10.1038%2Fx',     // no q
  'https://example.com/search?q=10.1038%2Fx',         // unknown site
  'https://search.yahoo.com/search?p=10.1038%2Fx',    // engine not listed
  'chrome://newtab/',
  'not a url'
];
NULLS.forEach(u => eq(C.extractQuery(u), null, 'not extracted: ' + u));

/* ---------- 4. encoding (DOI Handbook positive whitelist) ---------- */
eq(C.encodeDoi('10.1000/res#test'), '10.1000/res%23test', '  # must be encoded');
eq(C.encodeDoi('10.1000/a?b'), '10.1000/a%3Fb', '  ? must be encoded');
eq(C.encodeDoi('10.1000/a b'), '10.1000/a%20b', '  space must be encoded');
eq(C.encodeDoi('10.1000/100%'), '10.1000/100%25', '  % must be encoded');
eq(C.encodeDoi('10.1000/a"b'), '10.1000/a%22b', '  " must be encoded');
eq(C.encodeDoi('10.1000/a<b>c'), '10.1000/a%3Cb%3Ec', '  < > should be encoded');
eq(C.encodeDoi('10.1000/a{b}|c'), '10.1000/a%7Bb%7D%7Cc', '  { } | should be encoded');

eq(C.encodeDoi('10.1000/a(b)c;d:e'), '10.1000/a(b)c;d:e', '  ( ) ; : from the whitelist stay literal');
eq(C.encodeDoi('10.1038/sub/dir'), '10.1038/sub/dir', '  the slash stays literal');
eq(C.encodeDoi('10.1000/a-b_c.d~e'), '10.1000/a-b_c.d~e', '  - _ . ~ from the whitelist stay literal');
eq(C.encodeDoi('10.1000/中文'), '10.1000/%E4%B8%AD%E6%96%87', '  CJK encoded as UTF-8, three bytes per character');

/* A SICI DOI: only < > are encoded, everything else stays literal. */
const sici = '10.1002/1097-0142(195109)4:5<1036::aid-cncr2820040521>3.0.co;2-a';
const siciEnc = '10.1002/1097-0142(195109)4:5%3C1036::aid-cncr2820040521%3E3.0.co;2-a';
eq(C.encodeDoi(sici), siciEnc, 'encoded form of a real SICI DOI');

/* ---------- 5. resolver assembly ---------- */
eq(C.buildResolverUrl('https://doi.org/', '10.1038/x'), 'https://doi.org/10.1038/x', 'default base');
eq(C.buildResolverUrl('https://doi.org', '10.1038/x'), 'https://doi.org/10.1038/x', 'base gets a trailing slash');
eq(C.buildResolverUrl('doi.org', '10.1038/x'), 'https://doi.org/10.1038/x', 'base gets a scheme');
eq(C.buildResolverUrl('https://lib.example.edu/resolve', '10.1038/x'),
   'https://lib.example.edu/resolve/10.1038/x', 'custom base, path appended');
eq(C.buildResolverUrl('https://lib.example.edu/resolve/', '10.1038/x'),
   'https://lib.example.edu/resolve/10.1038/x', 'custom base that already ends in a slash');
eq(C.buildResolverUrl('javascript:alert(1)', '10.1038/x'), null, 'rejects javascript:');
eq(C.buildResolverUrl('data:text/html,x', '10.1038/x'), null, 'rejects data:');
eq(C.buildResolverUrl('https://r.example.edu/?doi=', '10.1038/x'), null, 'rejects a base carrying a query');

/* ---------- 6. end to end ---------- */
const r1 = C.resolveFromUrl('https://www.google.com/search?q=10.1038%2Fnature12373', {});
eq(r1.doi, '10.1038/nature12373', 'end to end: DOI');
eq(r1.target, 'https://doi.org/10.1038/nature12373', 'end to end: target');
eq(C.resolveFromUrl('https://www.google.com/search?q=10.1038%2Fexample+pdf', {}), null,
   'end to end: anything carrying natural language is left alone');
eq(C.resolveFromUrl('https://www.google.com/search?q=10.1038%2Fexample', { resolverBase: 'https://lib.example.edu/r' }).target,
   'https://lib.example.edu/r/10.1038/example', 'end to end: custom base');

/* ---------- summary ---------- */
console.log('');
console.log('passed ' + pass + ', failed ' + fail);
if (fail) {
  console.log('');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exitCode = 1;
} else {
  console.log('all good');
}
