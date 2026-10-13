# Delivery and provenance

Keep a receipt containing the final filename, SHA-256, dimensions, fps, duration,
frame count, audio source and mode, reference identity, product sources, and the
hosted URL returned by the upload provider. Never put credentials or bearer URLs
in a public receipt.

A local FFprobe check establishes media properties. A successful upload establishes
storage. Metadata readback establishes file identity and access information.
Browser Play and seeking establish playback in that tested environment. Report
only the evidence actually obtained; do not merge these into a blanket claim.

For direct MP4 hosting, support `Range` requests and return `206 Partial Content`.
Verify a nonzero seek and playback. For managed storage such as Drive, use its
observed file URL and verify the authenticated user's access. Processing may take
longer than the upload; do not invent a direct download URL when the provider did
not return one. A preview page's own download control can be the download route.

Open-source only the authorized package. Audit its tracked files and release
archive for private product material, credentials, account IDs, personal paths,
third-party recordings and font licenses. Code licensing does not grant rights
to external reference media. The included demo uses only original procedural
visuals and audio. Publishing the skill is separate from publishing a user's ad.
