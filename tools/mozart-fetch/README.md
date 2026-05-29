# mozart-fetch — walking skeleton

> **Admin / internal tool — not part of the deployed catalogue.**
> This pipeline is run manually by a maintainer to gather audio; it is not
> served by the website and is excluded from the site deploy. Its generated
> `catalogue/` and `downloads/` directories are git-ignored.
>
> **Rights:** the Brilliant Classics box yields `rights: "personal_use"`
> audio — fine for private/family listening, **not** cleared to publish.
> To fill the *public* catalogue, point the fetch layer at a public-domain /
> CC source (Musopen, IMSLP) and retag rights accordingly (see FUTURE).

Pulls one work end-to-end from the Brilliant Classics *Complete Mozart* box
on Archive.org, splits it out of the whole-CD FLAC image, transcodes to MP3,
and writes a manifest row the catalogue can ingest.

Target work: **Eine kleine Nachtmusik, K.525**. Prove the pipeline on one
work, then scale.

## Pipeline

    resolve disc (FLAC+cue) -> download -> parse cue -> group into works
      -> select target by nickname -> cut FLAC masters -> transcode MP3
      -> append manifest.jsonl

FLAC is the source of truth; MP3 is derived from the FLAC master.

## Two things the source gets wrong (and how this handles them)

1. **One CD holds several works in a single FLAC image.** Tracks are defined
   only by the `.cue` sheet. "Download K.525" means finding the right tracks
   inside the image and cutting them by cue timecode — not grabbing a file.
2. **The embedded K-numbers are unreliable.** This disc labels *Ein
   musikalischer Spaß* (really K.522) as "KV 525", colliding with the actual
   K.525 serenade. So grouping keys on the **work text**, selection keys on
   the **nickname**, and `detect_k_collisions` flags any K shared by two
   works. The manifest carries `k_number_trusted: false` for those, so the
   catalogue never silently inherits the bad number. A real Köchel reference
   table is the fix for the full run (see FUTURE).

## Rights

Every row is tagged `rights: "personal_use"`. These are commercial
performances uploaded by a user — fine for a family catalogue, **not** cleared
for redistribution. Backfill the headline works from Musopen (public-domain /
CC) before anything goes public.

## Requirements

- Python 3.10+
- `pip install -r requirements.txt`  (just `internetarchive`)
- `ffmpeg` + `ffprobe` on PATH  (does both the split and the transcode; no
  shntool/flac/cuetools needed)

## Run

    PYTHONPATH=. python3 skeleton.py

Output:

    catalogue/
      flac/K525_Eine_kleine_Nachtmusik/01_Allegro.flac ...
      mp3/K525_Eine_kleine_Nachtmusik/01_Allegro.mp3   ...
      manifest.jsonl

Tests (pure logic, run offline against the real cue fixture):

    PYTHONPATH=. python3 -m pytest tests/ -q

## What's validated

- Pure logic: 18 tests, including the KV-525 collision and EOF-cut cases.
- Live resolver + download + cue parse: confirmed against the real item.
- ffmpeg split + transcode: confirmed on a synthetic FLAC.
- Not yet run on real bytes: the 221 MB FLAC cut (identical calls, just data).

## Known limitation (verified, must fix before scaling)

`parse_title` assumes every track title ends in `" - <movement>"`. Tracks
that are a whole single-movement work do not — e.g. the Marches disc has
`"March in D major KV62"` with no movement, which raises `WorkGroupingError`
and aborts that entire disc. K.525 is multi-movement so the skeleton is
unaffected, but the full run breaks on marches, overtures, arias, and songs.
Fix: make the movement suffix optional (movement = `None` / "(single)").

## FUTURE (do NOT build until the skeleton's full run is green)

- Harden `parse_title` for single-movement works (see limitation above).
- Iterate all 170 cues instead of matching one nickname by filename.
- Köchel reference table as the authority for K-numbers + canonical titles.
- Musopen backfill pass for public-domain versions of the headline works.
- Resume / idempotency across a full 170-disc run.
