"""Build the manifest — the single artifact the catalogue ingest reads.

One JSON object per movement (JSONL). Records both the embedded K-number and
whether it is trustworthy, so the catalogue never silently inherits the
source's KV-525 mislabelling.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path

from config import CONFIG
from works import WorkSegment, work_slug


@dataclass(frozen=True)
class ManifestRow:
    k_number: str
    k_number_trusted: bool   # False when this K is shared by >1 work on the disc
    work_title: str
    nickname: str | None
    movement: str
    track_in_work: int
    duration_seconds: float
    flac_path: str
    mp3_path: str
    source_item: str
    rights: str


def build_row(
    seg: WorkSegment,
    *,
    duration_seconds: float,
    flac_path: Path,
    mp3_path: Path,
    k_trusted: bool,
) -> ManifestRow:
    return ManifestRow(
        k_number=seg.k_number,
        k_number_trusted=k_trusted,
        work_title=seg.work_text,
        nickname=seg.nickname,
        movement=seg.movement,
        track_in_work=seg.track_in_work,
        duration_seconds=round(duration_seconds, 3),
        flac_path=str(flac_path),
        mp3_path=str(mp3_path),
        source_item=CONFIG.item_id,
        rights=CONFIG.source_rights,
    )


def append_rows(rows: list[ManifestRow], manifest_path: Path) -> None:
    """Append rows as JSONL. Fails loud if given nothing to write."""
    if not rows:
        raise ValueError("append_rows: refusing to write an empty manifest")
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with manifest_path.open("a", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(asdict(row), ensure_ascii=False) + "\n")
