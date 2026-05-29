"""Walking skeleton: take ONE work (Eine kleine Nachtmusik, K.525) all the
way through the pipeline. Prove every leg works end-to-end before scaling
to 170 discs.

    fetch disc FLAC+cue -> parse cue -> group works -> select target
    -> cut FLAC masters -> transcode MP3 -> write manifest

Run:  PYTHONPATH=. python3 skeleton.py
"""
from __future__ import annotations

from pathlib import Path

from config import CONFIG
from logging_setup import log
from fetch import resolve_disc_for_nickname, download_files
from cue import parse_cue
from works import (
    group_tracks_into_segments,
    detect_k_collisions,
    select_by_nickname,
    work_slug,
)
from audio import cut_flac_master, transcode_to_mp3, probe_duration
from manifest import build_row, append_rows, ManifestRow


def run() -> list[ManifestRow]:
    nickname = CONFIG.skeleton_target_nickname

    # 1. Resolve + download the one disc that holds the target work.
    flac_name, cue_name = resolve_disc_for_nickname(CONFIG.item_id, nickname)
    files = download_files(CONFIG.item_id, [flac_name, cue_name], CONFIG.download_cache)
    disc_flac, disc_cue = files[flac_name], files[cue_name]

    # 2. Parse the cue and group its tracks into works.
    segments = group_tracks_into_segments(parse_cue(disc_cue.read_text(encoding="utf-8")))

    # 3. Flag unreliable K-numbers LOUDLY rather than trusting them.
    collisions = detect_k_collisions(segments)
    collided_k = set(collisions)
    if collided_k:
        log.warn("kochel.collision", detail={k: sorted(v) for k, v in collisions.items()})

    # 4. Select the target by NICKNAME (the only reliable discriminator here).
    target = select_by_nickname(segments, nickname)
    slug = work_slug(target[0])
    flac_dir = CONFIG.output_root / CONFIG.flac_subdir / slug
    mp3_dir = CONFIG.output_root / CONFIG.mp3_subdir / slug

    # 5. Cut each movement to a FLAC master, then derive the MP3.
    rows: list[ManifestRow] = []
    for seg in target:
        master = cut_flac_master(disc_flac, seg, flac_dir)
        mp3 = transcode_to_mp3(master, seg, mp3_dir)
        rows.append(build_row(
            seg,
            duration_seconds=probe_duration(master),
            flac_path=master, mp3_path=mp3,
            k_trusted=seg.k_number not in collided_k,
        ))
        log.info("movement.done", k=seg.k_number, movement=seg.movement,
                 track=seg.track_in_work, trusted=seg.k_number not in collided_k)

    # 6. Write the manifest the catalogue will ingest.
    append_rows(rows, CONFIG.output_root / CONFIG.manifest_name)
    log.info("skeleton.done", work=slug, movements=len(rows))
    return rows


if __name__ == "__main__":
    run()
