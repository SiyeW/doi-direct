#!/usr/bin/env node
/* Prints one version's entry from CHANGELOG.md, for use as GitHub release notes.
 *
 *   node tools/release-notes.js          # the version in manifest.json
 *   node tools/release-notes.js 0.2.0
 *
 * Exits non-zero when the version has no entry, so a release cannot be published
 * without one.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const version = process.argv[2] || manifest.version;

const lines = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8').split('\n');
const start = lines.findIndex(function (line) { return line.indexOf('## [' + version + ']') === 0; });

if (start === -1) {
  console.error('CHANGELOG.md has no entry for ' + version + '.');
  process.exit(1);
}

let end = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (lines[i].indexOf('## ') === 0) { end = i; break; }
}

process.stdout.write(lines.slice(start + 1, end).join('\n').trim() + '\n');
