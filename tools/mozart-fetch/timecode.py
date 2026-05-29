"""Cue-sheet timecode arithmetic. Pure functions, no I/O.

Cue INDEX timecodes are MM:SS:FF where FF is CD frames (75 per second).
"""
from __future__ import annotations

from config import CONFIG


class TimecodeError(ValueError):
    """Raised when a cue timecode is malformed."""


def cue_timecode_to_seconds(timecode: str) -> float:
    """Convert a cue ``MM:SS:FF`` timecode to floating-point seconds.

    Fails loud (Guardrail 4): any malformed field raises TimecodeError with
    the offending input, never a silent default.

    >>> cue_timecode_to_seconds("00:05:00")
    5.0
    >>> round(cue_timecode_to_seconds("01:02:37"), 4)  # 37/75 = 0.4933...
    62.4933
    """
    parts = timecode.strip().split(":")
    if len(parts) != 3:
        raise TimecodeError(
            f"cue_timecode_to_seconds: expected MM:SS:FF, got {timecode!r}"
        )
    try:
        minutes, seconds, frames = (int(p) for p in parts)
    except ValueError as exc:
        raise TimecodeError(
            f"cue_timecode_to_seconds: non-integer field in {timecode!r}"
        ) from exc

    fps = CONFIG.cue_frames_per_second
    if not (0 <= frames < fps):
        raise TimecodeError(
            f"cue_timecode_to_seconds: frame {frames} out of range 0..{fps - 1} "
            f"in {timecode!r}"
        )
    if seconds < 0 or minutes < 0:
        raise TimecodeError(
            f"cue_timecode_to_seconds: negative field in {timecode!r}"
        )
    return minutes * 60 + seconds + frames / fps
