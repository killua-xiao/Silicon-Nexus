#!/usr/bin/env python3
"""Rasterize public/favicon.ico (+ PNG sizes) from the BrandMark geometry."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

BG = (0x11, 0x18, 0x20)
TEAL = (0x2D, 0xD4, 0xBF)
BORDER = (0x2D, 0xD4, 0xBF)


def write_png(width: int, height: int, rgba: bytes) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw.extend(rgba[y * stride : (y + 1) * stride])

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def write_ico(images: list[tuple[int, bytes]]) -> bytes:
    count = len(images)
    offset = 6 + 16 * count
    entries = bytearray()
    payload = bytearray()
    for size, blob in images:
        w = 0 if size >= 256 else size
        entries.extend(struct.pack("<BBBBHHII", w, w, 0, 0, 1, 32, len(blob), offset))
        payload.extend(blob)
        offset += len(blob)
    return struct.pack("<HHH", 0, 1, count) + bytes(entries) + bytes(payload)


def sd_round_box(px: float, py: float, size: float, radius: float) -> float:
    half = size * 0.5
    dx = abs(px - half) - (half - radius)
    dy = abs(py - half) - (half - radius)
    ox = max(dx, 0.0)
    oy = max(dy, 0.0)
    return math.hypot(ox, oy) + min(max(dx, dy), 0.0) - radius


def hex_vertices(cx: float, cy: float, radius: float) -> list[tuple[float, float]]:
    verts: list[tuple[float, float]] = []
    for i in range(6):
        angle = math.radians(-90 + i * 60)
        verts.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return verts


def sd_polygon(px: float, py: float, verts: list[tuple[float, float]]) -> float:
    n = len(verts)
    d = (px - verts[0][0]) ** 2 + (py - verts[0][1]) ** 2
    s = 1.0
    for i in range(n):
        j = (i - 1) % n
        ax, ay = verts[j]
        bx, by = verts[i]
        ex, ey = bx - ax, by - ay
        wx, wy = px - ax, py - ay
        denom = ex * ex + ey * ey
        t = 0.0 if denom == 0 else max(0.0, min(1.0, (wx * ex + wy * ey) / denom))
        dx, dy = wx - ex * t, wy - ey * t
        d = min(d, dx * dx + dy * dy)
        cond = ((py >= ay) != (py >= by)) and (wx * ey > wy * ex)
        if cond:
            s = -s
    return s * math.sqrt(d)


def cover(dist: float) -> float:
    return max(0.0, min(1.0, 0.5 - dist))


def mix(dst: tuple[int, int, int], src: tuple[int, int, int], a: float) -> tuple[int, int, int]:
    ia = 1.0 - a
    return (
        int(dst[0] * ia + src[0] * a + 0.5),
        int(dst[1] * ia + src[1] * a + 0.5),
        int(dst[2] * ia + src[2] * a + 0.5),
    )


def render_icon(size: int, *, padded: bool = False, samples: int = 4) -> bytes:
    big = size * samples
    center = big * 0.5
    pad = big * (0.16 if padded else 0.07)
    box_radius = (big - pad * 2) * 0.18
    hex_r = (big - pad * 2) * 0.36
    hex_stroke = max(1.35 * samples, big * 0.055)
    border_stroke = max(0.9 * samples, big * 0.035)
    verts = hex_vertices(center, center, hex_r)

    acc = [[0.0, 0.0, 0.0, 0.0] for _ in range(size * size)]
    for y in range(big):
        for x in range(big):
            px = x + 0.5
            py = y + 0.5
            box = sd_round_box(px, py, big, box_radius + pad * 0.15)
            # Inset the rounded plate so the border sits on the logo tile.
            plate = box + pad
            hex_d = sd_polygon(px, py, verts)

            rgb = (0, 0, 0)
            alpha = 0.0
            plate_a = cover(plate)
            if plate_a > 0:
                rgb = BG
                alpha = plate_a
                border_a = cover(abs(plate) - border_stroke * 0.5) * 0.40
                rgb = mix(rgb, BORDER, border_a)
                fill_a = cover(hex_d) * 0.12
                rgb = mix(rgb, TEAL, fill_a)
                stroke_a = cover(abs(hex_d) - hex_stroke * 0.5)
                rgb = mix(rgb, TEAL, stroke_a)

            ox = x // samples
            oy = y // samples
            cell = acc[oy * size + ox]
            cell[0] += rgb[0] * alpha
            cell[1] += rgb[1] * alpha
            cell[2] += rgb[2] * alpha
            cell[3] += alpha

    out = bytearray(size * size * 4)
    denom = float(samples * samples)
    for i, cell in enumerate(acc):
        a = cell[3] / denom
        if a <= 0:
            continue
        out[i * 4] = int(cell[0] / cell[3] + 0.5)
        out[i * 4 + 1] = int(cell[1] / cell[3] + 0.5)
        out[i * 4 + 2] = int(cell[2] / cell[3] + 0.5)
        out[i * 4 + 3] = int(a * 255 + 0.5)
    return bytes(out)


def flatten_on_bg(rgba: bytes, size: int, bg: tuple[int, int, int] = BG) -> bytes:
    out = bytearray(size * size * 4)
    for i in range(size * size):
        a = rgba[i * 4 + 3] / 255.0
        out[i * 4] = int(bg[0] * (1 - a) + rgba[i * 4] * a + 0.5)
        out[i * 4 + 1] = int(bg[1] * (1 - a) + rgba[i * 4 + 1] * a + 0.5)
        out[i * 4 + 2] = int(bg[2] * (1 - a) + rgba[i * 4 + 2] * a + 0.5)
        out[i * 4 + 3] = 255
    return bytes(out)


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)

    ico_pngs: list[tuple[int, bytes]] = []
    for size in (16, 32, 48):
        pixels = flatten_on_bg(render_icon(size), size)
        blob = write_png(size, size, pixels)
        ico_pngs.append((size, blob))
        if size == 32:
            (PUBLIC / "favicon-32x32.png").write_bytes(blob)

    (PUBLIC / "favicon.ico").write_bytes(write_ico(ico_pngs))

    apple = flatten_on_bg(render_icon(180, padded=True), 180)
    (PUBLIC / "apple-touch-icon.png").write_bytes(write_png(180, 180, apple))

    print("wrote", PUBLIC / "favicon.ico")
    print("wrote", PUBLIC / "favicon-32x32.png")
    print("wrote", PUBLIC / "apple-touch-icon.png")


if __name__ == "__main__":
    main()
