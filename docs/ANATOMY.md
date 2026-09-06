# Anatomy integration (anatomy-viewer branch)

This folder contains a starter React + @react-three/fiber integration that loads the
ashemag/human-atlas (BodyParts3D 4.0) atlas remotely and renders a 360° anatomy model
with per-system visibility toggles.

Files added
- src/lib/atlasLoader.js — small helpers to fetch atlas.json and chunk ArrayBuffers
- src/components/AnatomyViewer.jsx — React component (r3f) that assembles per-system meshes and provides checkboxes to toggle them

Quick start (developer)
1. Install dependencies in your app (from repo root):

   npm install three @react-three/fiber @react-three/drei

   If your bundler does not provide access to three/examples imports automatically,
   you may need to install `three-stdlib` or adjust imports. The component imports
   BufferGeometryUtils from `three/examples/jsm/utils/BufferGeometryUtils.js`.

2. Import and use the component in your React app:

   import AnatomyViewer from './src/components/AnatomyViewer';

   function Page() {
     return <AnatomyViewer />; // defaults to the ashemag/human-atlas raw atlas.json
   }

3. Build/run your app as usual.

Notes & recommendations
- Current implementation loads all binary chunks (approx ~33MB compressed in the original)
  in parallel. For bandwidth- and memory-sensitive deployments, adapt the loader to lazy-load
  chunks only when a system is toggled on, or load lower-detail LODs for mobile.

- The ashemag/human-atlas viewer contains a fully-featured implementation with selection,
  exploded layouts, optimized GPU per-part state textures, and accurate picking. If you want
  feature parity (tap-to-select, isolate, search) I can port the original scene.tsx shader
  logic into this repo instead of the simplified approach used here.

Attribution (required by BodyParts3D CC BY 4.0)
- The anatomy data used by this feature is BodyParts3D 4.0, licensed CC BY 4.0. You must
  include attribution when redistributing. The ashemag repository includes a suitable
  attribution file at public/ATTRIBUTION.md and the original license details.

- Suggested short attribution in UI or docs: "Anatomy data: BodyParts3D 4.0 (CC BY 4.0). See docs/ANATOMY.md for full attribution."  

If you want me to:
- Add the files into a runnable page in this repository (create an app route or static page) I can commit additional glue (please tell me where your React app mounts pages).  
- Copy the atlas assets (atlas.json + body-*.bin) into this repo so the viewer serves assets locally — confirm and I will add them (note: ~30+ MB).  
- Port the full ashemag selection/picking/explode shader logic for identical UX — this is the next step if you want full feature parity.
