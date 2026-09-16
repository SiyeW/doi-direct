/* Shared popup: one timeline merging everything the components write into
 * chrome.storage.local. Expects shared/log-store.js alongside it, which writes one
 * key per entry so entries cannot clobber each other. The mode switcher only
 * appears in the extension that has the webRequest permission. */
(function () {
  'use strict';

  var listEl = document.getElementById('log');
  var sumEl = document.getElementById('summary');
  var modesEl = document.getElementById('modes');
  var lastCount = -1;

  document.getElementById('subtitle').textContent =
    chrome.runtime.getManifest().name.replace('DOI Direct PoC - ', '');

  var isRoutes = (chrome.runtime.getManifest().permissions || []).indexOf('webRequest') !== -1;
  if (isRoutes) {
    modesEl.hidden = false;
    chrome.storage.local.get({ mode: 'off' }, function (o) {
      var r = document.querySelector('input[name=mode][value="' + (o.mode || 'off') + '"]');
      if (r) r.checked = true;
    });
    modesEl.addEventListener('change', function (ev) {
      if (ev.target.name !== 'mode') return;
      chrome.storage.local.set({ mode: ev.target.value }, function () {
        POCLog.log('popup', 'mode -> ' + ev.target.value, null);
      });
    });
  }

  function fmt(o) {
    var parts = [];
    for (var k in o) {
      if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
      var v = o[k];
      if (v === undefined || v === null || v === '') continue;
      if (typeof v === 'object') v = JSON.stringify(v);
      parts.push(k + '=' + v);
    }
    return parts.join('  ');
  }

  function render() {
    POCLog.all(function (arr) {
      if (arr.length === lastCount) return;
      lastCount = arr.length;

      var atBottom = listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 20;
      listEl.textContent = '';
      var base = arr.length ? arr[0].t : 0;

      for (var i = 0; i < arr.length; i++) {
        var e = arr[i];
        var li = document.createElement('li');
        var m = e.msg || '';

        if (m.indexOf('SEARCH_PAGE_ACTIVE') !== -1) li.className = 'warn';
        else if (/prerender/i.test(m)) li.className = 'pre';
        else if (/REDIRECT|UPDATE tab|tabs.update ok/.test(m)) li.className = 'hi';

        var t = document.createElement('span');
        t.className = 't';
        var off = e.t - base;
        t.textContent = '+' + (off < 1000 ? (off + 'ms') : ((off / 1000).toFixed(2) + 's'));

        var s = document.createElement('span');
        s.className = 's';
        s.textContent = e.src || '';

        var msg = document.createElement('span');
        msg.className = 'm';
        msg.textContent = m;

        li.appendChild(t); li.appendChild(s); li.appendChild(msg);

        if (e.extra) {
          var pre = document.createElement('pre');
          pre.textContent = fmt(e.extra);
          li.appendChild(pre);
        }
        listEl.appendChild(li);
      }

      var n = function (re) {
        var c = 0;
        for (var j = 0; j < arr.length; j++) if (re.test(arr[j].msg || '')) c++;
        return c;
      };
      sumEl.textContent = '';
      var lines = [
        ['SEARCH_PAGE_ACTIVE (search page became visible)', n(/SEARCH_PAGE_ACTIVE/)],
        ['prerender events', n(/prerender/i)],
        ['redirects actually taken', n(/REDIRECT|UPDATE tab/)],
        ['skipped', n(/SKIP/)],
        ['events total', arr.length]
      ];
      for (var k = 0; k < lines.length; k++) {
        var d = document.createElement('div');
        d.textContent = lines[k][0] + ': ';
        var b = document.createElement('b');
        b.textContent = lines[k][1];
        d.appendChild(b);
        sumEl.appendChild(d);
      }

      if (atBottom) listEl.scrollTop = listEl.scrollHeight;
    });
  }

  document.getElementById('mark').addEventListener('click', function () {
    POCLog.log('popup', '===== MARK =====', null);
  });
  document.getElementById('clear').addEventListener('click', function () {
    lastCount = -1;
    POCLog.clear(render);
  });
  document.getElementById('copy').addEventListener('click', function () {
    POCLog.all(function (arr) {
      var base = arr.length ? arr[0].t : 0;
      var txt = arr.map(function (e) {
        return '+' + (e.t - base) + 'ms  [' + e.src + '] ' + e.msg +
               (e.extra ? ('  ' + fmt(e.extra)) : '');
      }).join('\n');
      navigator.clipboard.writeText(txt);
    });
  });

  render();
  setInterval(render, 700);
})();
