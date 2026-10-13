# Portable rendering contract

Requirements: Node.js 20+, FFmpeg/FFprobe on PATH, and `@napi-rs/canvas`.
The package pins its tested Canvas version. Use a suitable installed font or
declare local font files in the manifest. Fonts and media are not downloaded
automatically. Pixel identity across machines also requires identical fonts and
rendering binaries.

```json
{
  "scene": "./scene.mjs",
  "width": 1920,
  "height": 1080,
  "fps": 50,
  "duration": 30,
  "posterTime": 28,
  "assets": {"hero": "./assets/hero.png"},
  "fonts": [],
  "audio": {"path": "./assets/score.m4a", "mode": "copy"}
}
```

Paths resolve relative to the manifest. `audio` may be omitted for intentional
silent output. `copy` requires AAC for the MP4 path; use `aac` to encode another
supported audio input. Audio must cover the full film. The script never silently
truncates picture to a short audio track.

The scene module exports `createScene({config, createCanvas, loadImage, snapshot})`.
It returns `{renderFrame(ctx, seconds)}`; initialization may be asynchronous.
`config.assets` contains resolved local paths. A scene is executable JavaScript:
run trusted scene modules, not code extracted from a downloaded reference.

```sh
node skills/reference-motion/scripts/render.mjs path/to/film.json runs/film/output.mp4
node skills/reference-motion/scripts/verify-media.mjs runs/film/output.mp4 path/to/film.json
```

Generated Canvas surfaces used as repeatedly transformed textures should be
converted with `await snapshot(canvas)`. This creates an immutable image and
avoids repeated native surface snapshots consuming memory during a long render.
`scripts/perspective.mjs` provides a small perspective-plane renderer. Its texture
triangles overlap within an outer clip to prevent antialiasing cracks.

Frame time is `frame / fps`, independent of rendering speed. The renderer streams
RGBA pixels to FFmpeg with backpressure, writes a `.pending.mp4`, verifies the full
frame count and audio, and renames it only after success. Failures remove the
pending file and preserve an existing final file.

For a new aspect ratio, recompose the scene and safe zones. Resizing a 16:9 layout
into a tall frame is not a responsive layout. Use local tools to review the actual
file at the intended display size, including text, first/last frames and sound.
