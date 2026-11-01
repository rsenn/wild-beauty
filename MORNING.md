# Morning checklist (written 2026-11-01 for when you wake up)

One entry point. In order, about 30 minutes for the first part. Everything here was prepared while
you slept; **nothing below has run on your hardware, a phone, or with your real `opencv-imgproc`**.
Where I could, I ran it here in a headless Chromium with a 12 MP photo and a stand-in tool; each
item says what was and was not checked.

## 0. What changed since you last pulled

| Commit | What |
|---|---|
| `738433a` | Lasso follows the server's edge map (`GET /api/edges/<hash>`, `opencv-imgproc edgemap`); chip row says "Kanten: OpenCV" or "Kanten: einfach" |
| `4b233e4` | Lasso hardened: bad cost maps cannot loop, selection dropped when its photo changes (Undo), 250 anchor limit, guarded handlers |
| `efdb92f` | Benchmark library + tests |
| this commit | `tools/lasso-bench.js` (the benchmark command), `WB_CUTPOLY` switch for the lasso cut, this file |

qjs-opencv (`rsenn/qjs-opencv`, branch `claude/affectionate-mendel-2oniyf`, head `a73202a` when this was
written): your two failing tests fixed, `cutpoly --refine guided` (soft edge like the wand), the `edgemap`
flag contract (`--clahe-clip 0` = CLAHE off, unknown flags rejected, `provider` and `timings` in the result).
Its own checklist: `doc/morning-2026-11-01.md` in that repo (requested; see section 6 if it is not there).

## 1. wild-beauty on the desktop (10 min)

```bash
git checkout master && git pull
```

```bash
bun test
```

Expect all tests to pass except one that already failed before: `POST /api/nodes > a photo-less node ... server-rendered tile (E82)`
(probably fonts or Inkscape on this host; not caused by the lasso).

```bash
sudo sv restart wild-beauty
```

Then in the editor (Brave, desktop), with a photo that has a clear edge:
1. Tool column: the wand slot has a corner mark. Press `L` (lasso). Right-click or long-press the slot to see the group (wand, lasso, remove background).
2. Click along an edge. The line should snap to the contour and follow it **as far as you move the pointer**.
3. Look at the chip row: it says `Kanten: einfach` for the first moment, then `Kanten: OpenCV` if the server has the tool installed. **That is how you know CLAHE + Sobel + Canny are in use.** If it stays `einfach` with the tool installed, send me the last lines of `/var/service/wild-beauty/log/main/current` (the `/api/edges/` request).
4. Close with Enter or by clicking the first (bigger) dot. Try Cut out, Take out, Erase, with and without "Lücke füllen". Undo each once.
5. While an outline is open press Ctrl+Z until the photo is gone: the selection must disappear, no error.

Known gaps, not bugs to report: no live line on touch before a tap; no way to draw a hole (second outline); cuts are hard-edged until `cutpoly --refine guided` is on (section 3); no add/subtract with the wand.

## 2. The phone (10 min)

Same site, `/de/new`. Upload a photo from the phone, add it to a work, choose the lasso (long-press the wand slot).
- Tap anchors along an edge. On touch there is no hover, so the line appears **after each tap** (and follows while you drag). The loupe should show above your finger.
- Does the first anchor snap where you meant? Is the corner mark / long-press easy to hit? Does closing (tap the first dot, or the Close chip) work with a finger?
- Try Take out on a photo from the phone's camera (large): how long does it take? (It was 9 s on a 12 MP photo before the speed-up, about 2 s for the cut now.)
- **Failures are worth more than successes: screenshot every wrong edge.** Send me the screenshot and what you did.

## 3. The qjs-opencv tool and the soft edge (10 min)

Follow `doc/morning-2026-11-01.md` in qjs-opencv (merge, build, run the tests, install). Then, to try the new cut in the editor, set the switch for the server:

- `WB_CUTPOLY=guided`: the lasso cut uses `opencv-imgproc cutpoly --refine guided` (soft matte edge)
- `WB_CUTPOLY=none`: `cutpoly` without the refinement (a feathered polygon)
- unset: the Python stand-in `tools/polycut.py` (what runs now)

Put `export WB_CUTPOLY=guided` into the `run` script of the runit service (`/var/service/wild-beauty/run`) and
`sudo sv restart wild-beauty`. Compare a cut of the same outline with the switch on and off, especially on
petals, hair, fur. If `guided` is good, tell me and I delete `polycut.py` and make it the default.

## 4. The benchmark: lasso on AIM-500 and the flower photos (when you have time, runs by itself)

```bash
bun tools/lasso-bench.js --images AIM-500/original --masks AIM-500/mask --limit 100 --split tune --radius 100 --variant local --variant clahe3='--clahe-clip 3' --variant noclahe='--clahe-clip 0 --smooth none' --json lasso-tune.json
```

It simulates a user who clicks along the true outline every 20, 40 and 80 px with 3 px of aiming error and prints, per edge-map variant:
IoU, share of photos above 90 %, boundary F, and the same for a plain polygon through the same clicks (what the snapping buys).
Use `--split tune` to decide, `--split test` to confirm (the rule of WAND.md Part D: no default changes without a run on a held-out half).
For the flower photos there is no ground truth, so use the sheet mode, which writes one image per photo (the photo and every edge map side by side):

```bash
bun tools/lasso-bench.js --images flowers --variant local --variant clahe3='--clahe-clip 3' --variant noclahe='--clahe-clip 0 --smooth none' --sheet flower-sheets
```

(With `--sheet` and no `--masks` it only draws the sheets: no numbers.)
The AIM-500 folder names above are my guess (`original` and `mask`): the command only needs two folders with matching base names.

## 5. Waiting for you

- **GPU models** (the qjs-opencv session is waiting): which detector export (HED or DexiNed, ONNX) and which venv; the SAM encoder timings from your machine; installing cuDNN for the OpenCV CUDA build, or the ONNX Runtime GPU helper instead.
- **Decide**: should `cutpoly --refine guided` become the default for the lasso (after you compared)?
- **Decide**: next for the lasso: add / subtract with the wand, holes, touch dragging, or the benchmark first?

## 6. What to send me back

1. The output of `bun test` (just the failing lines) and of the qjs-opencv tests.
2. What the label says (`Kanten: ...`) and whether snapping is better with it.
3. Screenshots of wrong edges (phone and desktop), with the photo if you can.
4. The benchmark table (copy the printed lines), and the sheets for a few flowers.
5. Anything that froze or was slow: what you were doing, how many anchors, and the browser's task manager (Shift+Esc in Brave) if it hung.

If `doc/morning-2026-11-01.md` is not in the qjs-opencv branch yet, the other session has been asked to write it;
ask it directly (session "Magnetic lasso contour tracing").
