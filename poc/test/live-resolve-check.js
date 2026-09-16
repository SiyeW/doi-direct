/* Prints the resolver URLs the core builds for a few DOIs, so a person or a script
 * can check them against doi.org afterwards.
 * Usage: node poc/test/live-resolve-check.js
 * One line per DOI: <DOI> <TAB> <URL> */
'use strict';
const C = require('../shared/doi-core.js');

const DOIS = [
  '10.1038/s41559-022-01925-6',
  '10.1016/j.xgen.2025.100928',
  '10.1126/sciadv.adh7912',
  '10.21/example',
  '10.1000/res#test'
];

DOIS.forEach(function (doi) {
  const url = C.buildResolverUrl('https://doi.org/', doi);
  console.log(doi + '\t' + url);
});
