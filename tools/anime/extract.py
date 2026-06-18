# /// script
# requires-python = "==3.12.*"
# dependencies = ["Pillow>=10.4"]
# ///
"""Unzip the WhatsApp frames and re-index them to a contiguous sequence.

The source zip numbers frames with gaps (frame_001, frame_003, ...). We sort by
the numeric suffix and rename to frame_001..frame_NNN with no gaps.
"""
import re
import sys
import zipfile
from pathlib import Path

ZIP = Path.home() / "Downloads" / "WhatsApp_Video_2026-06-18_at_2_21_37_PM_frames.zip"
OUT = Path(__file__).parent / "work" / "frames_src"


def main() -> int:
    if not ZIP.exists():
        print(f"ERROR: zip not found: {ZIP}", file=sys.stderr)
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    for p in OUT.glob("*.png"):
        p.unlink()

    with zipfile.ZipFile(ZIP) as zf:
        names = [n for n in zf.namelist() if n.lower().endswith(".png")]

        def key(n: str) -> int:
            m = re.search(r"frame_(\d+)\.png$", n)
            return int(m.group(1)) if m else 0

        names.sort(key=key)
        for i, name in enumerate(names, start=1):
            data = zf.read(name)
            dest = OUT / f"frame_{i:03d}.png"
            dest.write_bytes(data)

    count = len(list(OUT.glob("*.png")))
    print(f"Extracted {count} frames -> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
