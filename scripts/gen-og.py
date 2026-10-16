#!/usr/bin/env python3
"""Generate public/og.png — 1200×630 Foundry Workbench share card."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (14, 15, 18)  # #0e0f12
INK = (236, 234, 228)  # #eceae4
BRASS = (196, 165, 116)  # #c4a574
# Brass at ~0.45 opacity over canvas (favicon stroke)
BRASS_HAIR = (96, 82, 62)
MUTED = (139, 147, 160)  # #8b93a0
ELEVATED = (22, 24, 29)  # #16181d

SANS = Path("/usr/share/fonts/truetype/macos/Inter-SemiBold.ttf")
MONO = Path("/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Medium.ttf")
OUT = Path(__file__).resolve().parents[1] / "public" / "og.png"


def hexagon(cx: float, cy: float, r: float) -> list[tuple[float, float]]:
    # Point-top chip, same silhouette as public/favicon.svg
    pts: list[tuple[float, float]] = []
    for i in range(6):
        a = math.radians(-90 + i * 60)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    margin = 40
    draw.rounded_rectangle(
        [margin, margin, W - margin, H - margin],
        radius=14,
        outline=BRASS_HAIR,
        width=2,
    )

    cx, cy, r = 280, 315, 118
    draw.polygon(hexagon(cx, cy, r), outline=BRASS, width=4)
    draw.polygon(hexagon(cx, cy, r - 22), outline=BRASS_HAIR, width=2)

    kicker = ImageFont.truetype(str(MONO), 18)
    title = ImageFont.truetype(str(SANS), 64)
    sub = ImageFont.truetype(str(MONO), 22)

    tx = 460
    draw.text((tx, 232), "AGENT INFRASTRUCTURE", font=kicker, fill=BRASS)
    draw.text((tx, 268), "Silicon Nexus", font=title, fill=INK)
    draw.line([(tx, 360), (tx + 280, 360)], fill=BRASS_HAIR, width=1)
    draw.text((tx, 380), "silinex.xyz", font=sub, fill=MUTED)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, format="PNG", optimize=True)
    size = OUT.stat().st_size
    if size > 200 * 1024:
        raise SystemExit(f"{OUT} is {size} bytes; keep under 200KB")
    print(f"wrote {OUT} ({size} bytes)")


if __name__ == "__main__":
    main()
