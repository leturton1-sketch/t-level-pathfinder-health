#!/usr/bin/env node
// scripts/download-atlas.mjs
// Download atlas.json and chunk binary files from ashemag/human-atlas into public/models
// Usage: node scripts/download-atlas.mjs [atlasUrl]

import fs from 'fs/promises';
import path from 'path';

const atlasUrl = process.argv[2] || 'https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/atlas.json';
const outDir = path.join(process.cwd(), 'public', 'models');

async function ensureDir(dir){
  try{ await fs.mkdir(dir, { recursive: true }); } catch(e){/* ignore */}
}

async function download(url, dest){
  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const ab = await res.arrayBuffer();
    await fs.writeFile(dest, Buffer.from(ab));
    console.log(`Saved ${dest} (${(ab.byteLength/1024).toFixed(1)} KB)`);
  }catch(err){
    console.warn(`Failed to download ${url}: ${err.message}`);
  }
}

function resolveChunkUrl(rawUrl){
  if(!rawUrl) return null;
  if(/^https?:\/\//.test(rawUrl)) return rawUrl;
  // assume filename under public/models in ashemag repo
  const name = rawUrl.replace(/^.*\//, '');
  return `https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/${name}`;
}

async function main(){
  console.log('Downloading atlas.json from', atlasUrl);
  await ensureDir(outDir);
  const res = await fetch(atlasUrl);
  if(!res.ok) throw new Error(`Could not fetch atlas.json: ${res.status}`);
  const atlas = await res.json();
  const atlasPath = path.join(outDir, 'atlas.json');
  await fs.writeFile(atlasPath, JSON.stringify(atlas, null, 2));
  console.log('Saved atlas.json');

  if(!Array.isArray(atlas.chunks) || atlas.chunks.length===0){
    console.log('No chunks found in atlas.json');
    return;
  }

  for(let i=0;i<atlas.chunks.length;i++){
    const chunk = atlas.chunks[i];
    // prefer chunk.url and chunk.gzip if present
    const candidates = [];
    if(chunk.url) candidates.push(chunk.url);
    if(chunk.gzip) candidates.push(chunk.gzip);
    for(const c of candidates){
      const url = resolveChunkUrl(c);
      if(!url) continue;
      const fname = url.split('/').pop();
      const dest = path.join(outDir, fname);
      // skip if file already exists and size matches (best-effort)
      try{
        const st = await fs.stat(dest);
        console.log(`Skipping existing ${fname} (${Math.round(st.size/1024)} KB)`);
        continue;
      }catch(e){/* not exists */}
      console.log(`Downloading chunk ${i+1}/${atlas.chunks.length}: ${fname}`);
      await download(url, dest);
    }
  }
  console.log('Done. Files saved to', outDir);
}

main().catch(err=>{console.error(err); process.exit(1);});
