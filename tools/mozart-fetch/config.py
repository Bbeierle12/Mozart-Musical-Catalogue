"""Central configuration. No magic numbers live outside this file (Guardrail 6).

Every value documents its purpose and valid range.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Config:
    # --- Source ---------------------------------------------------------
    # Archive.org item identifier for the Brilliant Classics complete box.
    # Whole-CD FLAC images + per-CD .cue sheets.
    item_id: str = "MozartComplete9Vol44FullCD.Flac"
    # Rights tag stamped on every track sourced from this item. These are
    # commercial performances uploaded by a user: fine for personal/family
    # use, NOT cleared for redistribution. The catalogue reads this field.
    source_rights: str = "personal_use"

    # --- Cue / timecode -------------------------------------------------
    # CD-DA frames per second. Cue INDEX is MM:SS:FF; FF runs 0..74.
    cue_frames_per_second: int = 75

    # --- Audio output ---------------------------------------------------
    mp3_bitrate: str = "320k"        # CBR target for the derived MP3 tree
    flac_compression_level: int = 8  # 0..8; 8 = smallest, archival master
    ffmpeg_bin: str = "ffmpeg"

    # --- Filesystem layout ----------------------------------------------
    # Output root; FLAC masters under flac/, derived MP3 under mp3/.
    output_root: Path = Path("catalogue")
    flac_subdir: str = "flac"
    mp3_subdir: str = "mp3"
    manifest_name: str = "manifest.jsonl"
    download_cache: Path = Path("downloads")

    # --- Walking-skeleton target ----------------------------------------
    # We target the work by its NICKNAME, not its K-number, because this
    # disc mislabels two distinct works as "KV 525" (see README). The
    # nickname is the only reliable discriminator in the source metadata.
    skeleton_target_nickname: str = "Eine kleine Nachtmusik"


CONFIG = Config()
