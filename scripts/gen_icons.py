import struct
import zlib
from pathlib import Path


def png(size: int, pixel):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(pixel(x, y, size))
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")


def color(x, y, size):
    cx, cy = size * 0.52, size * 0.48
    dx, dy = x - cx, y - cy
    bg = (11, 16, 32, 255)
    gold = (245, 193, 108, 255)
    mint = (125, 255, 194, 255)
    if (x - size * 0.75) ** 2 + (y - size * 0.22) ** 2 < (size * 0.06) ** 2:
        return mint
    # crude plane triangle
    if abs(dy) < size * 0.08 and -size * 0.32 < dx < size * 0.28:
        return gold
    if -size * 0.04 < dx < size * 0.12 and -size * 0.22 < dy < size * 0.04:
        return gold
    return bg


out = Path("/workspace/public")
for n in (192, 512):
    (out / f"icon-{n}.png").write_bytes(png(n, color))
(out / "apple-touch-icon.png").write_bytes(png(180, color))
print("icons ok")
