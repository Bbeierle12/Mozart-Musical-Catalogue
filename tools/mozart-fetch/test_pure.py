"""Tests for the pure parsing/grouping logic.

The fixture is the REAL cue sheet for Volume 3 (CD02) of the Brilliant box,
the disc that contains Eine kleine Nachtmusik. It deliberately exercises the
nasty cases: three works on one disc, a ripper typo ("Eini"), and two
distinct works both labelled "KV 525".
"""
import math

import pytest

from cue import parse_cue, CueParseError
from timecode import cue_timecode_to_seconds, TimecodeError
from works import (
    parse_title,
    slugify,
    work_slug,
    group_tracks_into_segments,
    detect_k_collisions,
    select_by_nickname,
    WorkGroupingError,
)

REAL_CUE = """REM GENRE Classical
REM DATE 2002
PERFORMER "Mozart (complete works)"
TITLE "Volume 3(CD02) Eine kleine Nachtmusik KV 525, ..."
FILE "Volume 3(CD02) ... Notturno KV 286.flac" WAVE
  TRACK 01 AUDIO
    TITLE "Notturno for four orchestras in D major KV 286 - Andante"
    INDEX 01 00:00:00
  TRACK 02 AUDIO
    TITLE "Notturno for four orchestras in D major KV 286 - Allegretto grazioso"
    INDEX 01 05:18:34
  TRACK 03 AUDIO
    TITLE "Notturno for four orchestras in D major KV 286 - Menuetto"
    INDEX 01 07:38:49
  TRACK 04 AUDIO
    TITLE "Eini musikalischer Spass in F major KV 525 'Dorfmusikanten-Sextett' - Allegro"
    INDEX 00 12:47:40
    INDEX 01 12:52:40
  TRACK 05 AUDIO
    TITLE "Eini musikalischer Spass in F major KV 525 'Dorfmusikanten-Sextett' - Menuetto"
    INDEX 01 16:38:73
  TRACK 06 AUDIO
    TITLE "Eini musikalischer Spass in F major KV 525 'Dorfmusikanten-Sextett' - Adagio ..."
    INDEX 01 21:40:26
  TRACK 07 AUDIO
    TITLE "Eini musikalischer Spass in F major KV 525 'Dorfmusikanten-Sextett' - Presto"
    INDEX 01 27:46:43
  TRACK 08 AUDIO
    TITLE "Serenade in G major KV 525 'Eine kleine Nachtmusik' - Allegro"
    INDEX 00 31:42:63
    INDEX 01 31:47:63
  TRACK 09 AUDIO
    TITLE "Serenade in G major KV 525 'Eine kleine Nachtmusik' - Romance, andante"
    INDEX 01 37:04:11
  TRACK 10 AUDIO
    TITLE "Serenade in G major KV 525 'Eine kleine Nachtmusik' - Menuetto"
    INDEX 01 41:40:35
  TRACK 11 AUDIO
    TITLE "Serenade in G major KV 525 'Eine kleine Nachtmusik' - Rondo, allegro"
    INDEX 01 43:22:24
"""


# --- timecode -----------------------------------------------------------
def test_timecode_basic():
    assert cue_timecode_to_seconds("00:05:00") == 5.0
    assert cue_timecode_to_seconds("01:00:00") == 60.0


def test_timecode_frames():
    # 31:47:63 -> 31*60 + 47 + 63/75
    assert math.isclose(cue_timecode_to_seconds("31:47:63"), 1907.84, rel_tol=0, abs_tol=1e-9)


def test_timecode_rejects_bad_frame():
    with pytest.raises(TimecodeError):
        cue_timecode_to_seconds("00:00:75")  # frame must be 0..74


def test_timecode_rejects_shape():
    with pytest.raises(TimecodeError):
        cue_timecode_to_seconds("1:2")


# --- cue parsing --------------------------------------------------------
def test_parse_cue_track_count():
    tracks = parse_cue(REAL_CUE)
    assert len(tracks) == 11
    assert tracks[0].number == 1
    assert tracks[0].start_seconds == 0.0


def test_parse_cue_uses_index01_not_pregap():
    tracks = parse_cue(REAL_CUE)
    # Track 8 has INDEX 00 31:42:63 and INDEX 01 31:47:63 -> must use 01.
    t8 = next(t for t in tracks if t.number == 8)
    assert math.isclose(t8.start_seconds, 1907.84, abs_tol=1e-9)


def test_parse_cue_empty_fails_loud():
    with pytest.raises(CueParseError):
        parse_cue("REM nothing here")


# --- title parsing ------------------------------------------------------
def test_parse_title_with_nickname():
    p = parse_title("Serenade in G major KV 525 'Eine kleine Nachtmusik' - Allegro")
    assert p.k_number == "525"
    assert p.nickname == "Eine kleine Nachtmusik"
    assert p.movement == "Allegro"


def test_parse_title_without_nickname():
    p = parse_title("Notturno for four orchestras in D major KV 286 - Andante")
    assert p.k_number == "286"
    assert p.nickname is None
    assert p.movement == "Andante"


def test_parse_title_strips_ripper_ellipsis():
    p = parse_title("... KV 525 'Dorfmusikanten-Sextett' - Adagio ...")
    assert p.movement == "Adagio"


def test_parse_title_fails_loud_on_garbage():
    with pytest.raises(WorkGroupingError):
        parse_title("just some text with no kochel number")


# --- slug ---------------------------------------------------------------
def test_slugify():
    assert slugify("Eine kleine Nachtmusik") == "Eine_kleine_Nachtmusik"
    assert slugify("Dorfmusikanten-Sextett") == "Dorfmusikanten_Sextett"


# --- grouping (the crux) ------------------------------------------------
def test_grouping_separates_three_works():
    segs = group_tracks_into_segments(parse_cue(REAL_CUE))
    work_texts = {s.work_text for s in segs}
    assert len(work_texts) == 3  # Notturno, Spass, Serenade


def test_two_kv525_works_are_not_merged():
    segs = group_tracks_into_segments(parse_cue(REAL_CUE))
    spass = [s for s in segs if "Spass" in s.work_text]
    serenade = [s for s in segs if "Serenade" in s.work_text]
    assert len(spass) == 4 and len(serenade) == 4
    # track_in_work must restart at 1 for the serenade despite same K-number
    assert serenade[0].track_in_work == 1


def test_k_collision_detected():
    segs = group_tracks_into_segments(parse_cue(REAL_CUE))
    collisions = detect_k_collisions(segs)
    assert "525" in collisions
    assert len(collisions["525"]) == 2  # two different works claim KV 525


def test_select_eine_kleine_nachtmusik():
    segs = group_tracks_into_segments(parse_cue(REAL_CUE))
    hits = select_by_nickname(segs, "Eine kleine Nachtmusik")
    assert len(hits) == 4
    assert work_slug(hits[0]) == "K525_Eine_kleine_Nachtmusik"
    assert [h.movement for h in hits] == [
        "Allegro", "Romance, andante", "Menuetto", "Rondo, allegro",
    ]


def test_last_segment_cuts_to_eof():
    segs = group_tracks_into_segments(parse_cue(REAL_CUE))
    assert segs[-1].end_seconds is None


def test_select_unknown_nickname_fails_loud():
    segs = group_tracks_into_segments(parse_cue(REAL_CUE))
    with pytest.raises(WorkGroupingError):
        select_by_nickname(segs, "Symphony of a Thousand")
