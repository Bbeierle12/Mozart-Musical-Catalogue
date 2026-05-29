"""Turn flat cue tracks into grouped works with split ranges. Pure, no I/O.

This is where the source data fights back:
  * One disc holds several works; tracks must be grouped by work identity.
  * K-numbers embedded in titles are UNRELIABLE — this disc labels two
    different works "KV 525". So grouping keys on the work text (description
    + nickname), never on the K-number alone, and we flag K collisions loud.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from cue import CueTrack

# Title shape: "<work desc> KV <k> ['<nickname>'] - <movement>"
#   e.g. "Serenade in G major KV 525 'Eine kleine Nachtmusik' - Allegro"
#   e.g. "Notturno for four orchestras in D major KV 286 - Andante"
_TITLE_RE = re.compile(
    r"^(?P<work>.*?\bKV\s*(?P<k>\d+[A-Za-z]?)(?:\s*'(?P<nick>[^']*)')?)"
    r"\s*-\s*(?P<movement>.+)$"
)
_SLUG_STRIP_RE = re.compile(r"[^A-Za-z0-9]+")
_TRAILING_ELLIPSIS_RE = re.compile(r"\s*\.{2,}\s*$")  # ripper truncation "..."


class WorkGroupingError(ValueError):
    """Raised when a track title cannot be parsed into a work + movement."""


@dataclass(frozen=True)
class ParsedTitle:
    work_text: str   # everything up to and including KV/nickname (group key)
    k_number: str    # as written in the source (may be wrong — see module doc)
    nickname: str | None
    movement: str


@dataclass(frozen=True)
class WorkSegment:
    """One playable movement, ready to cut from the disc image."""
    k_number: str
    nickname: str | None
    work_text: str
    movement: str
    track_in_work: int        # 1-based position within the work
    start_seconds: float
    end_seconds: float | None  # None => cut to end of file (last disc track)


def parse_title(title: str) -> ParsedTitle:
    """Split a cue track title into work identity + movement. Fails loud."""
    m = _TITLE_RE.match(title)
    if not m:
        raise WorkGroupingError(
            f"parse_title: no 'KV <n> ... - <movement>' shape in {title!r}"
        )
    movement = _TRAILING_ELLIPSIS_RE.sub("", m.group("movement")).strip()
    return ParsedTitle(
        work_text=m.group("work").strip(),
        k_number=m.group("k"),
        nickname=(m.group("nick").strip() if m.group("nick") else None),
        movement=movement,
    )


def slugify(text: str) -> str:
    """ASCII, underscore-joined slug suitable for a folder/file name."""
    ascii_text = (
        unicodedata.normalize("NFKD", text)
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    slug = _SLUG_STRIP_RE.sub("_", ascii_text).strip("_")
    if not slug:
        raise WorkGroupingError(f"slugify: produced empty slug from {text!r}")
    return slug


def work_slug(seg: WorkSegment) -> str:
    """Folder name for a work, e.g. 'K525_Eine_kleine_Nachtmusik'."""
    label = seg.nickname or seg.work_text
    return f"K{seg.k_number}_{slugify(label)}"


def group_tracks_into_segments(
    tracks: list[CueTrack],
) -> list[WorkSegment]:
    """Group consecutive tracks sharing a work_text into ordered segments.

    end_seconds of each segment is the start of the next disc track; the
    final track on the disc has end_seconds=None (cut to EOF).
    """
    parsed = [(t, parse_title(t.title)) for t in tracks]
    segments: list[WorkSegment] = []
    track_in_work = 0
    prev_work_text: str | None = None

    for i, (track, p) in enumerate(parsed):
        track_in_work = track_in_work + 1 if p.work_text == prev_work_text else 1
        end = parsed[i + 1][0].start_seconds if i + 1 < len(parsed) else None
        if end is not None and end <= track.start_seconds:
            raise WorkGroupingError(
                f"group_tracks_into_segments: non-increasing time at track "
                f"{track.number}: start={track.start_seconds} end={end}"
            )
        segments.append(
            WorkSegment(
                k_number=p.k_number,
                nickname=p.nickname,
                work_text=p.work_text,
                movement=p.movement,
                track_in_work=track_in_work,
                start_seconds=track.start_seconds,
                end_seconds=end,
            )
        )
        prev_work_text = p.work_text
    return segments


def detect_k_collisions(segments: list[WorkSegment]) -> dict[str, set[str]]:
    """Return {k_number: {work_text, ...}} for any K shared by >1 work.

    A non-empty result means the source K-numbers are unreliable for those
    works — the caller should warn loudly rather than trust them.
    """
    by_k: dict[str, set[str]] = {}
    for seg in segments:
        by_k.setdefault(seg.k_number, set()).add(seg.work_text)
    return {k: works for k, works in by_k.items() if len(works) > 1}


def select_by_nickname(
    segments: list[WorkSegment], nickname: str
) -> list[WorkSegment]:
    """All segments whose nickname matches (case-insensitive). Fails loud if none."""
    target = nickname.casefold()
    hits = [s for s in segments if s.nickname and s.nickname.casefold() == target]
    if not hits:
        raise WorkGroupingError(
            f"select_by_nickname: no segment with nickname {nickname!r}"
        )
    return hits
