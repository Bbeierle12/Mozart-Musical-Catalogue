# Work click-through: reach any piece by clicking it

**Date:** 2026-08-08
**Status:** Approved (modal destination chosen by owner)

## Problem

Nothing on the site links to a specific piece. Search result cards link only
to the top of a composer page; composer-page works tables are static HTML with
unclickable rows; `composer-common.js` contains a work-details modal that is
dead code (no page calls it, and it fetches `<id>-bwv-catalogue.json` — BWV
hardcoded for every composer — which only exists for Bach).

## Goal

Clicking a piece — in search results or in a composer-page table — lands on
that piece's detail modal, and every piece has a stable deep-link URL.

## Design

### 1. Work index + anchors (composer pages)

On DOMContentLoaded, `composer-common.js` reads `<body data-composer>` and,
for known composers, fetches the correct catalogue JSON:

| composer | file                        | catalog key |
|----------|-----------------------------|-------------|
| mozart   | mozart-kv-catalogue.json    | `kv`        |
| bach     | bach-bwv-catalogue.json     | `bwv`       |
| handel   | handel-hwv-catalogue.json   | `hwv`       |
| vivaldi  | vivaldi-rv-catalogue.json   | `rv`        |

It builds a slug → work index. Slug = catalogue number lowercased with
non-alphanumeric runs collapsed to `-` (`"K. 525"` → `k-525`,
`"BWV 1046"` → `bwv-1046`).

It then scans, **in document order**, both places a page names a work:

- `.works-table` rows — identified by their **first cell** ("K. 525")
- `.content-section h3` / `h4` headings — which wrap a number in prose
  ("Spring (La Primavera) - RV 269", "BWV 4: Christ lag...")

Headings matter: the most famous works (the Four Seasons, the Goldberg
Variations, the Brandenburg Concertos) are presented as a heading over a
movement table, never as a catalogue row — and Bach's `cantatas.html` and
`keyboard.html` are built entirely this way, so without heading support they
would have had zero clickable works.

A heading matches when a work's slug appears in it at token boundaries. A
slug followed by `-<digits>` denotes a **range** ("Brandenburg Concertos
(BWV 1046-1051)") and refers to a set rather than its first work, so it
matches nothing — unless the catalogue genuinely lists that range as one
work, which Bach's JSON does for "BWV 846-869" (Well-Tempered Clavier
Book I); that resolves through the exact-match path.

The first match wins; each element gets `id="<slug>"`, a `work-link` class,
`tabindex="0"`, and click/Enter/Space handlers. Everything that doesn't
resolve to a work is untouched — progressive enhancement only.

### 2. Detail modal

Reuses the existing modal markup/CSS (`.modal`, `.modal-content`, `.hidden`
in composer.css). Content, tolerant of per-composer fields: title, catalogue
number (via the composer's catalog key), category, key, year, movement count,
per-movement list when `movements_detail` (array) exists, duration,
instrumentation, description. The two `alert()` placeholder buttons are
replaced by one real link: **Search recordings →**
`../../search.html?q=<encoded catalogue number>`.

### 3. Deep links

On page load and `hashchange`: if `location.hash` matches a slug in the
index, scroll that row into view and open its modal. So
`composers/mozart/index.html#k-525` is the piece's address.

### 4. Search results link to the piece

In `search.js`, the work card title becomes a link to
`composers/<id>/index.html#<slug>`; the card keeps the secondary
"View catalogue →" link. `loadData()` already normalises `catalogNumber`.

### Supporting fixes

- `composers/bach/index.html` gains the missing `data-composer="bach"`.
- Bach subpages (cantatas.html, keyboard.html) already carry
  `data-composer="bach"` and the shared script, so they get row
  enhancement for free.
- Legacy `initializeComposer` keeps working for the template but its
  hardcoded `-bwv-` path is fixed via the same composer→file map.
- `composer-common.js` and `search.js` gain a guarded
  `module.exports` (CommonJS) so Jest can test the real files —
  the existing unit tests exercise private re-implementations pasted
  into the test file, not the shipped code.

## Error handling

If the JSON fetch fails or a composer is unknown, the page renders exactly
as today: static tables, no enhancement, one `console.warn`.

## Testing (TDD)

New Jest tests (`tests/unit/work-click-through.test.js`, 25 cases) load the
real modules:

- slugify: `"K. 525"`→`k-525`, `"BWV 1046"`→`bwv-1046`, `"RV 269"`→`rv-269`
- index building from catalogue JSON (fixture)
- row enhancement: matched row gets id/class/handler; unmatched row untouched
- heading enhancement: leading and trailing catalogue numbers; range
  headings rejected; near-miss rejected (BWV 4 must not match "BWV 40");
  a work named as both heading and row gets exactly one id
- click and hash-arrival open the modal with correct content
  (incl. `movements_detail` list and recordings link)
- `workCard` href format in search.js

Existing suite (incl. the legacy copies) must stay green. CI runs Jest on
push; Playwright e2e unchanged.

## Out of scope

Audio playback (mozart-fetch audio is rights-tagged `personal_use`, not
publishable), per-work standalone pages, rewriting the legacy test file.
