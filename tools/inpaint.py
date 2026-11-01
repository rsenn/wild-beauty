#!/usr/bin/env python3
# Fill the hole a subject leaves behind (the "take out" of the magic wand, E119) with MI-GAN
# (Picsart, MIT; the pre-converted pipeline model, which crops around the hole, resizes, fills and
# blends by itself). The pipeline is fast at about 1 MP but does its blending on the whole input
# (105 s for a 12 MP photo), so it only ever sees a window around the hole scaled to WORK px; the
# filled window is scaled back and only the hole, feathered, goes into the full-size photo.
# About 0.4 s to load and 1 to 2 s to run on 8 cores, whatever the photo size.
#
#   inpaint.py --image PHOTO --cut CUT.png --out REST.jpg|png [--grow 0.008] [--work 1024] [--model FILE]
#   inpaint.py --image PHOTO --cut CUT.png --out REST.png --no-fill
#   inpaint.py --image PHOTO --cut - ...
#
# --cut - : start before the cut exists. The imports, the model and the photo are loaded (about
# 1.1 s), then the path of the cut is read from stdin; an empty line or the end of stdin quits.
# The server starts the script with the segment tool and so takes that time off the wait.
# The cut may be an RGBA picture or an 8-bit mask (the tool's --mask-out, which decodes in a
# fraction of the time of a 12 MP RGBA).
#
# The hole is the alpha of CUT.png (the soft-edged cut of the subject, same size as PHOTO after
# its EXIF turn), grown by --grow of the long edge so no fringe of the subject stays. Needs
# onnxruntime, numpy and pillow; WB_PYTHON of the server points at an interpreter that has them.
# --no-fill leaves the hole transparent instead: the alpha of REST.png is the exact complement of
# the cut's, not grown, so the cut laid over the rest gives the photo back. No model runs.
import argparse, os, sys, time
import numpy as np
from PIL import Image, ImageChops, ImageFilter, ImageOps

def modelsDir():
    return os.environ.get('WB_MODELS_DIR') or os.path.join(os.environ.get('XDG_DATA_HOME') or os.path.expanduser('~/.local/share'), 'opencv-imgproc/models')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--image', required=True)
    ap.add_argument('--cut', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--grow', type=float, default=0.008)
    ap.add_argument('--work', type=int, default=1024)
    ap.add_argument('--no-fill', action='store_true')
    ap.add_argument('--model', default=os.path.join(modelsDir(), 'migan_pipeline_v2.onnx'))
    a = ap.parse_args()

    net = None

    if not a.no_fill:
        if not os.path.exists(a.model):
            sys.exit('model missing: ' + a.model)

        import onnxruntime as ort

        opts = ort.SessionOptions()
        opts.log_severity_level = 3
        net = ort.InferenceSession(a.model, opts, providers=['CPUExecutionProvider'])

    image = ImageOps.exif_transpose(Image.open(a.image)).convert('RGB')
    image.load()
    path = a.cut

    if path == '-':
        path = sys.stdin.readline().strip()

        if not path:
            return

    t = time.time()
    cut = Image.open(path)
    cut = cut.split()[3] if cut.mode in ('RGBA', 'LA') else cut.convert('L')

    if cut.size != image.size:
        cut = cut.resize(image.size, Image.BILINEAR)

    if a.no_fill:
        image.putalpha(ImageChops.invert(cut))
        image.save(a.out, compress_level=1)
        print('{"ok":true,"ms":%d,"width":%d,"height":%d}' % ((time.time() - t) * 1000, image.width, image.height))
        return

    # the hole: where the cut has any alpha, grown by about `grow` px. A blur and a threshold grow it
    # (PIL's MaxFilter is a rank filter, 100 s with a 65 px kernel on a 12 MP photo), and only around
    # the cut: past 3 grow of it the blur is 0, so the result is the same as on the whole photo
    W, H = image.size
    grow = max(2, round(a.grow * max(image.size)))
    raw = cut.point(lambda v: 255 if v > 4 else 0)
    box = raw.getbbox()

    if box:
        m = 3 * grow
        near = (max(0, box[0] - m), max(0, box[1] - m), min(W, box[2] + m), min(H, box[3] + m))
        grown = raw.crop(near).filter(ImageFilter.GaussianBlur(grow / 2)).point(lambda v: 255 if v > 8 else 0)
        inner = grown.getbbox()
        box = inner and (inner[0] + near[0], inner[1] + near[1], inner[2] + near[0], inner[3] + near[1])

    if box:
        # the window: the hole and as much around it again (the model needs to see the surroundings)
        x0, y0, x1, y1 = box
        mx, my = max(64, (x1 - x0) // 2), max(64, (y1 - y0) // 2)
        win = (max(0, x0 - mx), max(0, y0 - my), min(W, x1 + mx), min(H, y1 + my))
        holePart = Image.new('L', (win[2] - win[0], win[3] - win[1]), 0)
        holePart.paste(grown, (near[0] - win[0], near[1] - win[1]))
        part = image.crop(win)
        k = min(1, a.work / max(part.size))
        size = (max(1, round(part.width * k)), max(1, round(part.height * k)))
        small, smallHole = part.resize(size, Image.LANCZOS), holePart.resize(size, Image.BILINEAR).point(lambda v: 255 if v > 0 else 0)

        rgb = np.asarray(small, dtype=np.uint8).transpose(2, 0, 1)[None].copy()
        known = (255 - np.asarray(smallHole, dtype=np.uint8))[None, None].copy()  # 255 known, 0 hole
        filled = Image.fromarray(np.ascontiguousarray(net.run(None, {'image': rgb, 'mask': known})[0][0].transpose(1, 2, 0)))

        # back to full size, only inside the hole, with a soft seam. The 3x3 maximum is taken with
        # numpy (edges repeated like PIL's MaxFilter(3), which took 0.3 s on a large window)
        h = np.pad(np.asarray(holePart), 1, mode='edge')
        hmax = np.max([h[dy:dy + holePart.height, dx:dx + holePart.width] for dy in range(3) for dx in range(3)], axis=0)
        feather = ImageChops.multiply(holePart.filter(ImageFilter.GaussianBlur(max(1, grow / 2))), Image.fromarray(hmax))
        image.paste(filled.resize(part.size, Image.BICUBIC), win[:2], feather)

    if a.out.lower().endswith(('.jpg', '.jpeg')):
        image.save(a.out, quality=92)
    else:
        image.save(a.out, compress_level=1)
    print('{"ok":true,"ms":%d,"width":%d,"height":%d}' % ((time.time() - t) * 1000, image.width, image.height))

main()
