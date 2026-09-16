/* 共享内核的单元测试。不碰浏览器，直接 node poc/test/doi-core.test.js */
'use strict';
const C = require('../shared/doi-core.js');

let pass = 0, fail = 0;
const failures = [];

function eq(actual, expected, label) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a === b) { pass++; return; }
  fail++;
  failures.push(label + '\n    期望: ' + b + '\n    实际: ' + a);
}
function ok(cond, label) { eq(!!cond, true, label); }

/* ---------- 1. DOI 匹配：应当接受 ---------- */
const ACCEPT = [
  '10.1038/s41559-022-01925-6',
  '10.1016/j.xgen.2025.100928',
  '10.21/FQSQT4T3',                                   // 2 位注册码
  'DOI: 10.1126/sciadv.adh7912',                      // 前缀剥离
  'doi:10.1002/example',
  '  10.1038/nature12373  ',                          // 首尾空白
  '10.1002/1097-0142(195109)4:5<1036::aid-cncr2820040521>3.0.co;2-a',   // 含 < > 的真实 DOI
  '10.1016/0014-5793(88)81340-1'
];
ACCEPT.forEach(s => ok(C.parseDoi(s), '应当接受: ' + s));

eq(C.parseDoi('DOI: 10.1126/sciadv.adh7912'), '10.1126/sciadv.adh7912', 'doi: 前缀被剥离');
eq(C.parseDoi('  doi:10.1002/x  '), '10.1002/x', 'doi: 前缀 + 空白都处理');

/* ---------- 2. 应当拒绝 ---------- */
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
REJECT.forEach(s => eq(C.parseDoi(s), null, '应当拒绝: ' + JSON.stringify(s)));

/* ---------- 3. 搜索引擎参数提取 ---------- */
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
  'https://www.google.com/maps?q=10.1038%2Fx',        // 路径不是 /search，不能误伤
  'https://www.google.com/search?oq=10.1038%2Fx',     // 没有 q
  'https://example.com/search?q=10.1038%2Fx',         // 未知站点
  'https://search.yahoo.com/search?p=10.1038%2Fx',    // 未列出的引擎
  'chrome://newtab/',
  'not a url'
];
NULLS.forEach(u => eq(C.extractQuery(u), null, '不应提取: ' + u));

/* ---------- 4. 编码（DOI Handbook 正向白名单） ---------- */
eq(C.encodeDoi('10.1000/res#test'), '10.1000/res%23test', '  必须编码 #');
eq(C.encodeDoi('10.1000/a?b'), '10.1000/a%3Fb', '  必须编码 ?');
eq(C.encodeDoi('10.1000/a b'), '10.1000/a%20b', '  必须编码 空格');
eq(C.encodeDoi('10.1000/100%'), '10.1000/100%25', '  必须编码 %');
eq(C.encodeDoi('10.1000/a"b'), '10.1000/a%22b', '  必须编码 "');
eq(C.encodeDoi('10.1000/a<b>c'), '10.1000/a%3Cb%3Ec', '  建议编码 < >');
eq(C.encodeDoi('10.1000/a{b}|c'), '10.1000/a%7Bb%7D%7Cc', '  建议编码 { } |');

eq(C.encodeDoi('10.1000/a(b)c;d:e'), '10.1000/a(b)c;d:e', '  白名单内的 ( ) ; : 保持字面');
eq(C.encodeDoi('10.1038/sub/dir'), '10.1038/sub/dir', '  斜杠保持字面');
eq(C.encodeDoi('10.1000/a-b_c.d~e'), '10.1000/a-b_c.d~e', '  白名单内的 - _ . ~ 保持字面');
eq(C.encodeDoi('10.1000/中文'), '10.1000/%E4%B8%AD%E6%96%87', '  非 ASCII 按 UTF-8 编码');

/* SICI DOI：只有 < > 被编码，其余保持字面 */
const sici = '10.1002/1097-0142(195109)4:5<1036::aid-cncr2820040521>3.0.co;2-a';
const siciEnc = '10.1002/1097-0142(195109)4:5%3C1036::aid-cncr2820040521%3E3.0.co;2-a';
eq(C.encodeDoi(sici), siciEnc, '真实 SICI DOI 的编码结果');

/* ---------- 5. resolver 拼接 ---------- */
eq(C.buildResolverUrl('https://doi.org/', '10.1038/x'), 'https://doi.org/10.1038/x', '默认 base');
eq(C.buildResolverUrl('https://doi.org', '10.1038/x'), 'https://doi.org/10.1038/x', 'base 补斜杠');
eq(C.buildResolverUrl('doi.org', '10.1038/x'), 'https://doi.org/10.1038/x', 'base 补 scheme');
eq(C.buildResolverUrl('https://lib.example.edu/resolve', '10.1038/x'),
   'https://lib.example.edu/resolve/10.1038/x', '自定义 base 追加 path');
eq(C.buildResolverUrl('https://lib.example.edu/resolve/', '10.1038/x'),
   'https://lib.example.edu/resolve/10.1038/x', '自定义 base（已带斜杠）');
eq(C.buildResolverUrl('javascript:alert(1)', '10.1038/x'), null, '拒绝 javascript:');
eq(C.buildResolverUrl('data:text/html,x', '10.1038/x'), null, '拒绝 data:');
eq(C.buildResolverUrl('https://r.example.edu/?doi=', '10.1038/x'), null, '拒绝 query 形式的 base');

/* ---------- 6. 端到端 ---------- */
const r1 = C.resolveFromUrl('https://www.google.com/search?q=10.1038%2Fnature12373', {});
eq(r1.doi, '10.1038/nature12373', '端到端 DOI');
eq(r1.target, 'https://doi.org/10.1038/nature12373', '端到端目标');
eq(C.resolveFromUrl('https://www.google.com/search?q=10.1038%2Fexample+pdf', {}), null,
   '端到端：带自然语言的一律不跳');
eq(C.resolveFromUrl('https://www.google.com/search?q=10.1038%2Fexample', { resolverBase: 'https://lib.example.edu/r' }).target,
   'https://lib.example.edu/r/10.1038/example', '端到端：自定义 base');

/* ---------- 汇总 ---------- */
console.log('');
console.log('通过 ' + pass + ' 项，失败 ' + fail + ' 项');
if (fail) {
  console.log('');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exitCode = 1;
} else {
  console.log('全部通过');
}
