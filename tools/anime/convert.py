# /// script
# requires-python = "==3.12.*"
# dependencies = ["torch>=2.2", "torchvision>=0.17", "Pillow>=10.4", "numpy>=1.26"]
# ///
"""Convert re-indexed frames to anime style with AnimeGANv2, then web-optimize.

Usage:
  uv run tools/anime/convert.py --preview            # render frame_001 in all styles
  uv run tools/anime/convert.py --style paprika      # full batch -> public/anime
  uv run tools/anime/convert.py --style paprika --rotate -90   # rotate upright (CW)

The source video was filmed portrait but exported as landscape frames, so the
people lie on their side. --rotate <deg> spins each frame before web-optimizing
(-90 = clockwise, the value that stands this video's couple upright).
"""
import argparse
import sys
from pathlib import Path

import torch
from PIL import Image

SRC = Path(__file__).parent / "work" / "frames_src"
PREVIEW_DIR = Path(__file__).parent / "work" / "preview"
OUT = Path(__file__).resolve().parents[2] / "public" / "anime"
STYLES = ["paprika", "celeba_distill", "face_paint_512_v2"]
OUT_WIDTH = 960
WEBP_QUALITY = 80


def device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def load_model(style: str, dev: torch.device):
    return torch.hub.load(
        "bryandlee/animegan2-pytorch:main", "generator",
        pretrained=style, device=dev, progress=True, trust_repo=True,
    ).eval()


def to_tensor(img: Image.Image, dev: torch.device) -> torch.Tensor:
    import numpy as np
    arr = np.asarray(img.convert("RGB"), dtype="float32") / 127.5 - 1.0
    t = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)
    return t.to(dev)


def to_image(t: torch.Tensor) -> Image.Image:
    import numpy as np
    out = t.squeeze(0).permute(1, 2, 0).clamp(-1, 1).cpu().numpy()
    out = ((out + 1.0) * 127.5).astype("uint8")
    return Image.fromarray(out, "RGB")


@torch.no_grad()
def stylize(model, img: Image.Image, dev: torch.device) -> Image.Image:
    return to_image(model(to_tensor(img, dev)))


def web_optimize(img: Image.Image, rotate: int = 0) -> Image.Image:
    if rotate:
        img = img.rotate(rotate, expand=True)
    w, h = img.size
    nh = round(h * OUT_WIDTH / w)
    return img.resize((OUT_WIDTH, nh), Image.LANCZOS)


def preview(dev: torch.device, rotate: int = 0) -> int:
    src = SRC / "frame_001.png"
    if not src.exists():
        print("ERROR: run extract.py first (frame_001.png missing)", file=sys.stderr)
        return 1
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.open(src)
    for style in STYLES:
        model = load_model(style, dev)
        out = web_optimize(stylize(model, img, dev), rotate)
        dest = PREVIEW_DIR / f"preview_{style}.webp"
        out.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
        print(f"  wrote {dest}")
    print(f"Previews in {PREVIEW_DIR} — open them and pick a --style.")
    return 0


def batch(style: str, dev: torch.device, rotate: int = 0) -> int:
    frames = sorted(SRC.glob("frame_*.png"))
    if not frames:
        print("ERROR: no source frames (run extract.py)", file=sys.stderr)
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    for p in OUT.glob("*.webp"):
        p.unlink()
    model = load_model(style, dev)
    for i, p in enumerate(frames, start=1):
        out = web_optimize(stylize(model, Image.open(p), dev), rotate)
        dest = OUT / f"frame_{i:04d}.webp"
        out.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
        if i % 10 == 0 or i == len(frames):
            print(f"  {i}/{len(frames)}")
    print(f"Wrote {len(frames)} frames -> {OUT}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--style", choices=STYLES, default="paprika")
    ap.add_argument("--rotate", type=int, default=0,
                    help="degrees to rotate each frame (-90 = clockwise)")
    args = ap.parse_args()
    dev = device()
    print(f"device: {dev}")
    return (preview(dev, args.rotate) if args.preview
            else batch(args.style, dev, args.rotate))


if __name__ == "__main__":
    raise SystemExit(main())
