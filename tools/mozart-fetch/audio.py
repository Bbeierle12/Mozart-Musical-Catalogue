"""Cut movements out of a disc-image FLAC and transcode to MP3 via ffmpeg.

ffmpeg alone covers both jobs, so shntool/flac/cuetools are not required.
Splitting re-encodes (accurate seek), which is correct for lossless cuts.
"""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

from config import CONFIG
from logging_setup import log
from works import WorkSegment, work_slug


class AudioError(RuntimeError):
    """Raised when an ffmpeg/ffprobe invocation fails or output is missing."""


def _run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise AudioError(
            f"_run: command failed ({proc.returncode}): {' '.join(cmd[:3])} ... "
            f"\nstderr: {proc.stderr.strip()[:400]}"
        )


def probe_duration(path: Path) -> float:
    """Return media duration in seconds via ffprobe. Fails loud."""
    cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "json", str(path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise AudioError(f"probe_duration: ffprobe failed for {path}")
    return float(json.loads(proc.stdout)["format"]["duration"])


def _trim_args(seg: WorkSegment) -> list[str]:
    args = ["-ss", f"{seg.start_seconds:.3f}"]
    if seg.end_seconds is not None:
        args += ["-to", f"{seg.end_seconds:.3f}"]
    return args


def cut_flac_master(disc_flac: Path, seg: WorkSegment, out_dir: Path) -> Path:
    """Cut one movement from the disc image into a FLAC master."""
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{seg.track_in_work:02d}_{_movement_slug(seg)}.flac"
    cmd = [
        CONFIG.ffmpeg_bin, "-y", "-i", str(disc_flac), *_trim_args(seg),
        "-c:a", "flac", "-compression_level", str(CONFIG.flac_compression_level),
        str(out),
    ]
    _run(cmd)
    if not out.exists() or out.stat().st_size == 0:
        raise AudioError(f"cut_flac_master: empty output {out}")
    return out


def transcode_to_mp3(flac_master: Path, seg: WorkSegment, out_dir: Path) -> Path:
    """Derive a tagged MP3 from a FLAC master (FLAC stays source of truth)."""
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{seg.track_in_work:02d}_{_movement_slug(seg)}.mp3"
    title = f"{seg.nickname or seg.work_text} - {seg.movement}"
    cmd = [
        CONFIG.ffmpeg_bin, "-y", "-i", str(flac_master),
        "-c:a", "libmp3lame", "-b:a", CONFIG.mp3_bitrate,
        "-metadata", f"title={title}",
        "-metadata", "artist=Wolfgang Amadeus Mozart",
        "-metadata", f"track={seg.track_in_work}",
        str(out),
    ]
    _run(cmd)
    if not out.exists() or out.stat().st_size == 0:
        raise AudioError(f"transcode_to_mp3: empty output {out}")
    return out


def _movement_slug(seg: WorkSegment) -> str:
    from works import slugify
    return slugify(seg.movement)
