/* 路线 B：document_start content script。
 *
 * 1) 开头有一个同步预筛：不是受支持的搜索引擎页面就直接返回，不读 storage，
 *    因此普通网页浏览完全不付代价。
 * 2) 文档处于 prerender 状态时不立即动作，等 prerenderingchange 之后再重读
 *    location —— prerender 文档在 document_start 时的 location 未必是最终值。
 * 3) 与 webRequest 路径互不依赖：页面没有加载出来时本脚本不会运行。
 */
(function () {
  'use strict';
  var SRC = 'B';

  if (window.top !== window) return;   /* 只看顶层 */

  /* 同步预筛：非目标站点直接返回 */
  if (!DOICore.matchEngine(location.href)) return;

  var MODE = null;
  function log(msg, extra) { POCLog.log(SRC, msg, extra); }
  function bEnabled(m) { return m === 'B' || m === 'AB'; }

  var startHit = DOICore.resolveFromUrl(location.href, {});

  /* 已确认是受支持的搜索引擎页面 */
  log('content script start', {
    href: location.href,
    prerendering: (document.prerendering === true),
    visibilityState: document.visibilityState,
    DOI: startHit ? startHit.doi : null,
    urlHadDoiAtStart: !!startHit
  });

  function act(reason) {
    var hit = DOICore.resolveFromUrl(location.href, {});
    log('act(' + reason + ')', {
      href: location.href,
      prerendering: (document.prerendering === true),
      DOI: hit ? hit.doi : null,
      urlHadDoiAtStart: !!startHit
    });
    if (!hit) return;
    if (!bEnabled(MODE)) { log('mode=' + MODE + ' -> no action', { DOI: hit.doi }); return; }
    log('REDIRECT -> ' + hit.target, { t: Date.now(), DOI: hit.doi });
    location.replace(hit.target);
  }

  function decide() {
    if (document.prerendering) {
      log('prerender: waiting for prerenderingchange', { href: location.href });
      document.addEventListener('prerenderingchange', function () {
        log('prerenderingchange', { href: location.href });
        act('prerenderingchange');
      }, { once: true });
      return;
    }
    act('document_start');
  }

  chrome.storage.local.get({ mode: 'off' }, function (o) {
    MODE = o.mode || 'off';
    log('mode loaded', { mode: MODE });
    decide();
  });
})();
