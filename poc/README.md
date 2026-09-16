# PoC harness

A small harness for observing how Chromium reports navigations and requests, and for
comparing two ways of intercepting a DOI search. It is not the extension, and the
extension does not depend on it.

| Folder | What it is | Permissions |
|---|---|---|
| `0-probe/` | Records navigation lifecycle events only. It never intercepts or modifies anything. | `webNavigation`, `storage`. No host permissions. |
| `1-routes/` | Two interception strategies, switchable from the popup at runtime. | `webRequest`, `webNavigation`, `storage` + host permissions for the search engines listed in its manifest. |
| `shared/` | DOI matching core, shared logging, shared popup UI. | — |
| `test/` | Unit tests for the matching core. Runs in Node, no browser needed. | — |
| `build/` | Copies `shared/` into each extension folder. | — |

## Loading an extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select `poc/0-probe` or `poc/1-routes`
4. Pin the extension to the toolbar, then click its icon to open the log panel

`1-routes` starts in `off` mode and does nothing until you pick a strategy in the
popup. That is deliberate.

## Tests

```text
node poc/test/doi-core.test.js
```

`poc/test/live-resolve-check.js` prints the resolver URLs the core builds for a set of
real DOIs, so they can be checked against doi.org by hand.

## Editing

`shared/` is the single source of truth. After changing anything there, run:

```powershell
powershell -ExecutionPolicy Bypass -File poc/build/sync-shared.ps1
```
