#!/usr/bin/env node
/* Builds the release archive: reads the version from manifest.json, runs both test
 * suites, stages the files the extension needs, and writes
 * dist/doi-direct-v<version>.zip with those files at the archive root.
 *
 *   node tools/build-release.js
 */

'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SHIPPED = ['manifest.json', 'src', '_locales', 'LICENSE', 'README.md'];
const SUITES = ['tests/core.test.js', 'poc/test/doi-core.test.js'];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(rel) {
  console.log('> node ' + rel);
  const r = spawnSync(process.execPath, [rel], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) fail('tests failed: ' + rel);
}

function collect(abs, rel, out) {
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(abs).sort()) {
      collect(path.join(abs, name), rel + '/' + name, out);
    }
    return;
  }
  out.push({ name: rel, data: fs.readFileSync(abs) });
}

/* Minimal ZIP writer: deflate plus a central directory. Entries carry a fixed
 * 1980-01-01 timestamp so the same input always produces the same archive. */
const CRC_TABLE = (function () {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function zip(entries) {
  const parts = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const crc = crc32(entry.data);
    const deflated = zlib.deflateRawSync(entry.data, { level: 9 });
    const stored = deflated.length >= entry.data.length;
    const body = stored ? entry.data : deflated;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034B50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(stored ? 0 : 8, 8);
    local.writeUInt16LE(0x0021, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, body);

    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014B50, 0);
    head.writeUInt16LE(20, 4);
    head.writeUInt16LE(20, 6);
    head.writeUInt16LE(0x0800, 8);
    head.writeUInt16LE(stored ? 0 : 8, 10);
    head.writeUInt16LE(0x0021, 14);
    head.writeUInt32LE(crc, 16);
    head.writeUInt32LE(body.length, 20);
    head.writeUInt32LE(entry.data.length, 24);
    head.writeUInt16LE(name.length, 28);
    head.writeUInt32LE(offset, 42);
    central.push(head, name);

    offset += local.length + name.length + body.length;
  }

  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054B50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat(parts.concat([directory, end]));
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
if (!/^\d+(\.\d+){1,3}$/.test(String(manifest.version))) {
  fail('manifest version is not a Chrome version: ' + manifest.version);
}
/* Chrome accepts only a numeric version, so a pre-release carries its suffix in the
 * archive name and the git tag instead. */
const version = process.argv[2] || manifest.version;

for (const suite of SUITES) run(suite);

const entries = [];
for (const rel of SHIPPED) collect(path.join(ROOT, rel), rel, entries);
if (!entries.some(function (e) { return e.name === 'manifest.json'; })) fail('manifest.json missing from the archive');

const dist = path.join(ROOT, 'dist');
fs.mkdirSync(dist, { recursive: true });
const archive = path.join(dist, 'doi-direct-v' + version + '.zip');
fs.writeFileSync(archive, zip(entries));

const kb = (fs.statSync(archive).size / 1024).toFixed(1);
console.log('');
console.log(entries.length + ' files -> dist/' + path.basename(archive) + '  (' + kb + ' KB, ' + version + ')');
