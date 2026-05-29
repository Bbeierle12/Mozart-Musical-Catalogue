"""Structured JSON logging from day one. No bare prints in the pipeline."""
from __future__ import annotations

import json
import sys
import time
from typing import Any


def _emit(level: str, msg: str, **data: Any) -> None:
    record = {"level": level, "msg": msg, "ts": round(time.time(), 3), **data}
    stream = sys.stderr if level in ("warn", "error") else sys.stdout
    print(json.dumps(record, ensure_ascii=False), file=stream)


class _Log:
    def info(self, msg: str, **data: Any) -> None:
        _emit("info", msg, **data)

    def warn(self, msg: str, **data: Any) -> None:
        _emit("warn", msg, **data)

    def error(self, msg: str, **data: Any) -> None:
        _emit("error", msg, **data)


log = _Log()
