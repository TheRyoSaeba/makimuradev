"""Build public/images/cast-mask.png: full-body silhouettes of both leads,
in background space (R = Ryo, G = Kaori).

The cutout PNGs are pixel-exact crops of bg.png, but each is clipped where the
two characters overlap (Ryo on his right, Kaori on her left) and at Ryo's gun
tip. Inside those strips we don't know who is who, so we let a watershed on the
art's colour gradient decide: cel line-art makes the boundaries sharp, and the
known pixels on either side seed each region.

    pip install pillow numpy scipy scikit-image
    python scripts/build_cast_mask.py
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.filters import sobel
from skimage.segmentation import watershed

ROOT = Path(__file__).resolve().parents[1] / 'public' / 'images'
# Left edge of each cutout inside bg.png (measured: zero pixel error at these offsets).
CAST = {'man': 666, 'woman': 1821}
OUT_SCALE = 0.5
# Hand-placed fixes for spots where the line art has a break and the sky would
# otherwise flood in: grow from a seed through pixels within `tol` (RGB, 0-255)
# of the seed's colour, inside a bounding box. Ryo's shoulder behind Kaori's head
# melts into a lit window with no ink line between them.
COLOR_FILLS = [
    # (character, seed x, seed y, (x0, y0, x1, y1), tol)
    ('man', 1830, 770, (1746, 690, 1870, 800), 28),
]

bg = np.asarray(Image.open(ROOT / 'bg.png').convert('RGB')).astype(np.float32) / 255
H, W = bg.shape[:2]

alpha = {}
for name, x0 in CAST.items():
    a = np.asarray(Image.open(ROOT / f'{name}.png'))[..., 3].astype(np.float32) / 255
    full = np.zeros((H, W), np.float32)
    full[:, x0:x0 + a.shape[1]] = a
    alpha[name] = full

man_x1 = CAST['man'] + Image.open(ROOT / 'man.png').width
woman_x0 = CAST['woman']

BG, MAN, WOMAN = 1, 2, 3
markers = np.full((H, W), BG, np.int32)
markers[alpha['man'] > 0.5] = MAN
markers[alpha['woman'] > 0.5] = WOMAN

# Unknown: the strip between the two crops, a margin either side of it where the
# local cutout says "not me", and the clipped revolver tip.
margin = 14
markers[:, man_x1:woman_x0] = 0
side = markers[:, man_x1 - margin:man_x1]
side[side != MAN] = 0
side = markers[:, woman_x0:woman_x0 + margin]
side[side != WOMAN] = 0
gun = markers[1660:1760, CAST['man'] - 30:CAST['man'] + 10]
gun[gun != MAN] = 0

# Wherever a cutout is authoritative we keep its antialiased alpha as-is.
known = markers != 0

for name, sx, sy, (bx0, by0, bx1, by1), tol in COLOR_FILLS:
    box = bg[by0:by1, bx0:bx1] * 255
    close = np.linalg.norm(box - box[sy - by0, sx - bx0], axis=-1) < tol
    comps, _ = ndi.label(close)
    fill = comps == comps[sy - by0, sx - bx0]
    markers[by0:by1, bx0:bx1][fill] = MAN if name == 'man' else WOMAN

smooth = ndi.gaussian_filter(bg, sigma=(0.6, 0.6, 0))
elevation = np.max([sobel(smooth[..., c]) for c in range(3)], axis=0)
labels = watershed(elevation, markers)

out = np.zeros((H, W, 3), np.float32)
for ch, lab in ((0, MAN), (1, WOMAN)):
    region = ndi.binary_fill_holes(labels == lab)
    region = ndi.binary_opening(region, iterations=2)
    # Keep the original antialiased edges wherever the cutout was authoritative.
    name = 'man' if lab == MAN else 'woman'
    soft = ndi.gaussian_filter(region.astype(np.float32), 0.8)
    out[..., ch] = np.where(known, alpha[name], soft)

img = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))
img = img.resize((int(W * OUT_SCALE), int(H * OUT_SCALE)), Image.LANCZOS)
img.save(ROOT / 'cast-mask.png', optimize=True)
print('wrote', ROOT / 'cast-mask.png', img.size)
