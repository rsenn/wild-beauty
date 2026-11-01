#!/usr/bin/env python3
# Cut a photo along a polygon (the magnetic lasso, WAND.md 0): the same job the segment tool does
# for the magic wand, with the outline drawn by the user instead of found by a model. Writes the
# soft-edged cut (RGBA, the photo with the polygon as alpha, same size as the photo after its EXIF
# turn) and, with --mask-out, the 8-bit mask that tools/inpaint.py fills the hole from. Prints the
# same NDJSON `result` line as the segment tool, so server/api/segment.js reads both alike.
#
#   polycut.py --image PHOTO --polygon '[[x,y],...]' --out CUT.png [--mask-out MASK.png] [--feather 0.0008]
#
# --polygon: one outline, or a list of outlines (even-odd, so a hole is an outline inside one), as
# [x, y] in 0..1 of the whole photo. --feather: the blur of the edge, as a share of the long edge.
import argparse, json, sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--image', required=True)
    ap.add_argument('--polygon', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--mask-out')
    ap.add_argument('--feather', type=float, default=0.0008)
    a = ap.parse_args()

    shapes = json.loads(a.polygon)
    if shapes and isinstance(shapes[0][0], (int, float)):
        shapes = [shapes]

    image = ImageOps.exif_transpose(Image.open(a.image)).convert('RGB')
    w, h = image.size
    radius = max(0.5, a.feather * max(w, h))
    # only the box of the outline (and the reach of the blur) is drawn: a 12 MP photo with a
    # small subject must not cost a 12 MP mask at four times the size
    xs = [x * w for shape in shapes for x, _ in shape]
    ys = [y * h for shape in shapes for _, y in shape]
    pad = int(radius * 3) + 3
    x0, y0 = max(0, int(min(xs)) - pad), max(0, int(min(ys)) - pad)
    x1, y1 = min(w, int(max(xs)) + pad + 1), min(h, int(max(ys)) + pad + 1)
    bw, bh = max(1, x1 - x0), max(1, y1 - y0)
    # drawn larger, so the edge has no stairs before it is feathered; at most about 24 MP
    scale = max(1, min(4, int((24e6 / (bw * bh)) ** 0.5)))
    total = Image.new('L', (bw * scale, bh * scale), 0)

    # even-odd: every outline flips what it covers
    for shape in shapes:
        points = [((x * w - x0) * scale, (y * h - y0) * scale) for x, y in shape]
        layer = Image.new('L', total.size, 0)
        ImageDraw.Draw(layer).polygon(points, fill=255)
        total = ImageChops.difference(total, layer)

    part = total.resize((bw, bh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(radius))
    mask = Image.new('L', (w, h), 0)
    mask.paste(part, (x0, y0))

    if mask.getbbox() is None:
        print(json.dumps({'event': 'result', 'ok': False, 'error': 'empty'}))
        sys.exit(1)

    cut = image.convert('RGBA')
    cut.putalpha(mask)
    cut.save(a.out, compress_level=1)

    if a.mask_out:
        mask.save(a.mask_out)

    print(json.dumps({'event': 'result', 'ok': True, 'output': {'path': a.out, 'width': w, 'height': h}}), flush=True)

if __name__ == '__main__':
    main()
