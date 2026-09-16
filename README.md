# DOI Direct

A browser extension that resolves a DOI the moment you search for it.

Type or paste a DOI into the address bar and press Enter, and DOI Direct sends you
straight to the resolver instead of a page of search results:

```text
Ctrl+L
paste  10.1038/s41586-026-xxxxx
Enter
->     https://doi.org/10.1038/s41586-026-xxxxx
```

It only acts when the **entire** query is a DOI. `10.1038/xxxxx pdf` is left alone.

## Status

Early but working. The extension loads and runs, and every built-in search engine
has had its URL shape confirmed against the live site.

## Install (unpacked)

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked** and select the root of this repository
4. Pin the extension, then open its settings to choose which search engines to watch

Chromium-based browsers only (Chrome, Edge, and similar).

## How it works

Two independent interception paths, both driven by the same decision function in
`src/core/decide.js`, so they can never disagree:

| Path | Trigger | Behaviour |
|---|---|---|
| **A** | `webRequest.onBeforeRequest` | Sends the tab to the resolver with `chrome.tabs.update`. Fires while the request is about to go out, so it works even when the search engine is unreachable. |
| **B** | `document_start` content script | Runs on the search page itself and calls `location.replace`. Covers the case where path A reacted too late because the service worker had to wake up first. |

Only one of them ever acts: if path A redirects in time the search page is never
loaded, and path B never runs.

## Repository layout

```text
manifest.json
src/core/          matching, encoding, engine rules, settings - pure and unit tested
src/background.js  interception path A (service worker)
src/content.js     interception path B (content script)
src/options/       settings page
src/popup/         toolbar popup
_locales/          English and Simplified Chinese UI strings
tests/             unit tests for src/core
poc/               an earlier measurement harness, kept for reference
```

## Tests

```text
node tests/core.test.js
```

No browser needed. The suite covers DOI matching, the percent-encoding rules, the
resolver URL, engine URL matching, exceptions, settings normalisation, and a check
that `manifest.json` stays in sync with the built-in engine list.

## Permissions

- `webRequest` - to see main-frame navigation requests
- `storage` - to keep your settings
- `scripting` - to add a content script for search engines you add yourself
- Host permissions for the built-in search engines only

The `tabs` permission is deliberately not requested, and neither is broad access
to all sites. A custom search engine asks for exactly that one host when you add it.

## Privacy

All matching happens locally in the browser. DOI Direct does not collect or
transmit anything, and it has no analytics.

Note that it does not stop the search request from reaching the search engine: the
request is usually already on its way by the time the extension reacts. What it
saves you is the page of search results.

## Limitations

- **Address-bar support depends on browser behaviour.** Chromium currently treats
  input like `10.1038/xxx` as a search query rather than a hostname. That is
  browser behaviour, not something an extension can rely on as a contract.
- **Firefox is not supported.** Its URL handling differs and would need its own
  verification.
- **Search engines that submit with POST cannot be supported**, because the query
  never reaches the URL. Startpage is one of those. A quick way to check any
  engine: search for something and look at the address bar - if there is no query
  parameter there, this extension has nothing to read.
- Search engines that update results without reloading the page (`history.pushState`)
  are not covered.

## License

MIT
