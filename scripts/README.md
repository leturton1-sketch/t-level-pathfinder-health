# Download atlas assets

This script fetches atlas.json and the chunk binary files from the ashemag/human-atlas
repository and saves them into public/models/. Use this if you want to host the
BodyParts3D assets locally instead of referencing the remote raw URLs.

Requirements:
- Node 18+ (fetch is available globally)

Run:

  node scripts/download-atlas.mjs

Optional: pass a custom atlas.json URL as the first argument:

  node scripts/download-atlas.mjs https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/atlas.json

After running, the following files will exist under public/models/:
- atlas.json
- body-*.bin
- body-*.bin.gz (if present)

Note: the total download is ~30–35 MB compressed. Committing these files will increase
repo size. The recommended workflow is to run this script during CI or on developer
machines rather than checking binaries into git unless you explicitly want them in
the repository.
