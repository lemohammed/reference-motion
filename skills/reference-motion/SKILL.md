---
name: reference-motion
description: Create or improve a short product film from a motion-design reference, adapting its camera moves, typography, edit rhythm and permitted audio to the user's actual product. Use for reference-led promotional videos and deterministic motion graphics, not general websites or a request to copy the reference's subject.
---

# Reference Motion

Deliver a finished film and editable source. The reference supplies a visual and
audio grammar; the user's product supplies the subject and claims.

## Ground the two inputs

Inspect the actual reference video, including representative frames around cuts
and camera changes. A thumbnail or a list of named effects is insufficient.
For a local reference, use `scripts/inspect-reference.mjs` to make a contact sheet
and retain timing metadata in a project output directory.

Read current product materials before writing copy: the named repository, recent
brief, existing site, and accepted brand assets. Record a compact product brief
with verified capabilities, current stage, audience, and claims to avoid. Prefer
available source context to asking the user to repeat it.

Separate **reference mechanics** from **reference subject**. Fashion portraits,
travel footage, or another company's UI do not belong in the new film merely
because they occur in the reference. Preserve relevant composition and motion;
replace the subject with the product. See [reference translation](references/translation.md).

## Build the edit

Create a timed shot map before expensive generation. Track framing, focal point,
camera path, transition, typography, audio cue, and the corresponding product
message. Keep factual claims tied to product evidence. A proposal or simulated
visualization should not be presented as a measured result.

Choose the appropriate material for each shot: an actual product capture,
generated photographic asset, original illustration, or code-drawn graphic.
Use an available image-generation tool for photographic assets. Composite exact
copy, logos and UI deterministically. Inspect supplied and generated imagery in
the crop used by the film.

For the portable Canvas workflow, read [rendering](references/rendering.md).
The included starter scene is an original, runnable example, not a mandatory
look or template for every product. Assets, fonts, audio and timing are manifest
inputs. No provider credentials are required by the renderer.

When improving an accepted film, preserve its approved subject, direction and
audio unless the request changes them. Make an identifiable creative improvement:
camera continuity, clearer hierarchy, readable holds, stronger staging or a
better ending. Keep the accepted master available. Additional encodings alone
are not a creative improvement.

## Review picture and sound

Compare representative output frames directly with the reference. Check the
relationship of image scale, white space, typography and camera motion, not just
palette. Watch the transitions at speed and inspect text during movement.
Avoid changing a card's identity while it moves through a continuous shot.

Review with audio. If the user requests the reference audio and its use is
appropriate for the task, retain and document that source; do not silently
substitute a synthesized score. Otherwise use suitable supplied, licensed or
original audio and time cues to the finished picture. Do not include third-party
reference audio in an open-source package under the code's license.

Render once the picture is coherent. Validate the actual exported video, not only
the scene code or preview frames. `scripts/verify-media.mjs` checks dimensions,
frame count, duration, decoding and expected audio. A technically valid file does
not establish that the creative meets the brief or that the user accepted it.

## Deliver the result

Use an available authenticated upload or hosting capability when the user needs
cross-device access. Verify the hosted file identity, size and access. Return an
observed watch/download URL; a local path or localhost player is supplemental.
Follow [delivery and provenance](references/delivery.md) for the bounded checks.

Keep media, source, reviews and receipts in named project directories. Honor the
project's artifact-index conventions. This skill does not authorize unrelated
publishing, purchases, messages, account changes, or background agents.
