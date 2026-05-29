"""Archive.org resolution and download. I/O layer.

The internetarchive library handles node selection, redirects, retries and
checksum verification, so we lean on it rather than hand-rolling HTTP.
"""
from __future__ import annotations

from pathlib import Path

from internetarchive import get_item

from config import CONFIG
from logging_setup import log


class FetchError(RuntimeError):
    """Raised when the required disc files cannot be located or downloaded."""


def _item_file_names(item_id: str) -> list[str]:
    item = get_item(item_id)
    names = [f.name for f in item.get_files()]
    if not names:
        raise FetchError(f"_item_file_names: item {item_id!r} exposes no files")
    return names


def resolve_disc_for_nickname(item_id: str, nickname: str) -> tuple[str, str]:
    """Find the (flac_name, cue_name) for the disc containing ``nickname``.

    The skeleton matches the nickname against the disc FILENAME. The full
    run would instead download every cue and parse it; that lives in FUTURE.
    """
    target = nickname.casefold()
    flacs = [n for n in _item_file_names(item_id)
             if n.lower().endswith(".flac") and target in n.casefold()]
    if not flacs:
        raise FetchError(
            f"resolve_disc_for_nickname: no FLAC names mention {nickname!r}"
        )
    if len(flacs) > 1:
        raise FetchError(
            f"resolve_disc_for_nickname: {len(flacs)} discs mention "
            f"{nickname!r}; expected exactly one: {flacs}"
        )
    flac_name = flacs[0]
    cue_name = flac_name[: -len(".flac")] + ".cue"
    return flac_name, cue_name


def download_files(item_id: str, names: list[str], dest: Path) -> dict[str, Path]:
    """Download ``names`` from ``item_id`` into ``dest``; return name->path.

    Verifies each file landed and is non-empty (Guardrail 4: fail loud).
    """
    dest.mkdir(parents=True, exist_ok=True)
    item = get_item(item_id)
    log.info("download.start", item=item_id, files=len(names))
    item.download(
        files=names, destdir=str(dest), no_directory=False,
        ignore_existing=True, retries=5, checksum=True,
    )
    resolved: dict[str, Path] = {}
    for name in names:
        path = dest / item_id / name
        if not path.exists() or path.stat().st_size == 0:
            raise FetchError(
                f"download_files: {name!r} missing or empty at {path}"
            )
        resolved[name] = path
        log.info("download.ok", file=name, mb=round(path.stat().st_size / 1e6, 1))
    return resolved
