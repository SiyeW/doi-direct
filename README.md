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

Early development. The repository currently contains `poc/`, a harness used to compare
interception strategies in Chromium. The extension itself is not written yet.

## Repository layout

```text
poc/0-probe/    navigation lifecycle recorder (no host permissions)
poc/1-routes/   two interception strategies, switchable at runtime
poc/shared/     DOI matching core and shared UI
poc/test/       unit tests for the matching core
```

## Requirements

- Chromium-based browser (Chrome, Edge, and similar)
- Node.js, only for running the tests

## Development

Load `poc/0-probe` or `poc/1-routes` as an unpacked extension from
`chrome://extensions` with Developer mode enabled. See `poc/README.md` for details.

Run the unit tests:

```text
node poc/test/doi-core.test.js
```

## Privacy

DOI Direct performs all matching locally in the browser. It does not collect or
transmit anything, and it has no analytics.

## License

MIT
