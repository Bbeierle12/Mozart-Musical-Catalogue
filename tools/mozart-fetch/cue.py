"""Parse a single-FILE cue sheet into structured tracks. Pure, no I/O.

These disc images put one whole CD in one FLAC, with a cue sheet defining
track boundaries. We extract per-track TITLE + the audio-start INDEX (01).
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from timecode import cue_timecode_to_seconds

# A TRACK line: `  TRACK 08 AUDIO`
_TRACK_RE = re.compile(r"^\s*TRACK\s+(\d+)\s+AUDIO\s*$", re.IGNORECASE)
# A TITLE line: `    TITLE "..."`
_TITLE_RE = re.compile(r'^\s*TITLE\s+"(.*)"\s*$', re.IGNORECASE)
# An INDEX line: `    INDEX 01 00:00:00`
_INDEX_RE = re.compile(r"^\s*INDEX\s+(\d+)\s+(\d+:\d+:\d+)\s*$", re.IGNORECASE)
# Cue audio-start index number (INDEX 01); INDEX 00 is the pregap.
_AUDIO_INDEX = 1


class CueParseError(ValueError):
    """Raised when the cue sheet cannot be parsed into usable tracks."""


@dataclass(frozen=True)
class CueTrack:
    """One track within the disc image."""
    number: int          # 1-based track number on the disc
    title: str           # raw TITLE text from the cue
    start_seconds: float  # audio start (INDEX 01) in seconds


def parse_cue(text: str) -> list[CueTrack]:
    """Parse cue ``text`` into an ordered list of CueTrack.

    Uses INDEX 01 (audio start) as each track's start, ignoring INDEX 00
    pregaps. Fails loud if a track lacks a title or an audio index.
    """
    tracks: list[CueTrack] = []
    cur_number: int | None = None
    cur_title: str | None = None
    cur_start: float | None = None

    def flush() -> None:
        if cur_number is None:
            return
        if cur_title is None or cur_start is None:
            raise CueParseError(
                f"parse_cue: track {cur_number} missing "
                f"{'title' if cur_title is None else 'INDEX 01'}"
            )
        tracks.append(CueTrack(cur_number, cur_title, cur_start))

    for line in text.splitlines():
        m_track = _TRACK_RE.match(line)
        if m_track:
            flush()
            cur_number = int(m_track.group(1))
            cur_title = None
            cur_start = None
            continue
        if cur_number is None:
            continue  # header lines before the first TRACK
        m_title = _TITLE_RE.match(line)
        if m_title:
            cur_title = m_title.group(1).strip()
            continue
        m_index = _INDEX_RE.match(line)
        if m_index and int(m_index.group(1)) == _AUDIO_INDEX:
            cur_start = cue_timecode_to_seconds(m_index.group(2))

    flush()
    if not tracks:
        raise CueParseError("parse_cue: no AUDIO tracks found in cue sheet")
    return tracks
