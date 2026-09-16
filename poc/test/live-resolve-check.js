/* 打印内核为真实 DOI 生成的 resolver URL，供人工/脚本再去 doi.org 验证。
 * 用法: node poc/test/live-resolve-check.js
 * 输出每行: <DOI> <TAB> <URL> */
'use strict';
const C = require('../shared/doi-core.js');

const DOIS = [
  '10.1038/nature12373',
  '10.21/FQSQT4T3',
  '10.1016/0014-5793(88)81340-1',
  '10.1002/1097-0142(195109)4:5<1036::aid-cncr2820040521>3.0.co;2-a',
  '10.1002/(sici)1098-2760(20000205)24:3<191::aid-mop14>3.3.co;2-v',
  '10.1000/res#test'
];

DOIS.forEach(function (doi) {
  const url = C.buildResolverUrl('https://doi.org/', doi);
  console.log(doi + '\t' + url);
});
