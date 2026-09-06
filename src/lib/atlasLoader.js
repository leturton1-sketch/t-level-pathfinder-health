// src/lib/atlasLoader.js
// Minimal atlas loader for the ashemag/human-atlas format (BodyParts3D packed atlas).
// Exposes functions to fetch atlas.json and chunk ArrayBuffers.

export async function fetchAtlas(atlasUrl) {
  const res = await fetch(atlasUrl);
  if (!res.ok) throw new Error(`Could not fetch atlas.json: ${res.status}`);
  const atlas = await res.json();
  return atlas;
}

export async function fetchChunkBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch chunk: ${url}`);
  return res.arrayBuffer();
}

// Resolve a chunk url relative to the ashemag repo raw path when necessary.
export function resolveChunkUrl(chunk) {
  if (!chunk) return null;
  // If chunk.url is already absolute, return it. Otherwise assume it is the filename under public/models/.
  if (chunk.url && /^https?:\/\//.test(chunk.url)) return chunk.url;
  return `https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/${chunk.url.replace(/^.*\//, '')}`;
}
