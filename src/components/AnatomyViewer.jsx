/* src/components/AnatomyViewer.jsx

A React + @react-three/fiber component that loads the ashemag/human-atlas atlas.json and
its binary chunk files, assembles per-system meshes, and displays a checkbox panel to
show/hide each anatomical system.

Note: this is a starter integration. For parity with the original viewer (selection,
exploded-layouts, GPU-packed state textures and optimized picking), reuse the ashemag
app/scene.tsx implementation. This component focuses on 360° viewing and system
visibility toggles (which is what you asked for).
*/

import React, { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { fetchAtlas, fetchChunkBuffer, resolveChunkUrl } from '../lib/atlasLoader';

export default function AnatomyViewer({ atlasUrl = 'https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/atlas.json' }) {
  const [atlas, setAtlas] = useState(null);
  const [systemMeshes, setSystemMeshes] = useState({});
  const [systemVisible, setSystemVisible] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const a = await fetchAtlas(atlasUrl);
        if (cancelled) return;
        setAtlas(a);

        // fetch chunks in parallel (for memory-sensitive apps consider lazy-loading by system)
        const chunkUrls = a.chunks.map(resolveChunkUrl);
        const buffers = [];
        for (let i = 0; i < chunkUrls.length; i++) {
          const buf = await fetchChunkBuffer(chunkUrls[i]);
          buffers.push(buf);
          setLoadingProgress(Math.round(((i + 1) / chunkUrls.length) * 100));
        }
        if (cancelled) return;

        const sysMap = new Map();

        // Build geometries for each part and bucket by system
        a.parts.forEach((p, idx) => {
          const buf = buffers[p.chunk];
          // the atlas uses byte offsets for positions/normals/indices
          const positions = new Float32Array(buf, p.positions, p.vertexCount * 3);

          // normals are stored as signed 16-bit integers in the atlas; normalize to [-1,1]
          const rawNormals = new Int16Array(buf, p.normals, p.vertexCount * 3);
          const normals = new Float32Array(p.vertexCount * 3);
          for (let i = 0; i < normals.length; i++) normals[i] = rawNormals[i] / 32767;

          const indices = new Uint32Array(buf, p.indices, p.indexCount);

          const geom = new THREE.BufferGeometry();
          geom.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
          geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
          geom.setIndex(new THREE.BufferAttribute(indices.slice(), 1));
          geom.computeBoundingSphere();

          const list = sysMap.get(p.system) || [];
          list.push(geom);
          sysMap.set(p.system, list);
        });

        // Merge per-system geometries, create meshes and materials
        const meshes = {};
        sysMap.forEach((geoms, system) => {
          let merged = geoms.length === 1 ? geoms[0] : mergeBufferGeometries(geoms, false);
          if (!merged) merged = geoms[0];
          const color = getSystemColor(system);
          const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.08 });
          const mesh = new THREE.Mesh(merged, mat);
          mesh.name = system;
          mesh.frustumCulled = false;
          meshes[system] = mesh;
        });

        if (!cancelled) {
          setSystemMeshes(meshes);
          const vis = {};
          Object.keys(meshes).forEach((k) => (vis[k] = true));
          setSystemVisible(vis);
        }
      } catch (err) {
        console.error('Anatomy load failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [atlasUrl]);

  const systemList = useMemo(() => Object.keys(systemMeshes), [systemMeshes]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 640, position: 'relative' }}>
      <Canvas camera={{ position: [0, 1.6, 3], fov: 40 }} style={{ background: '#f2f3f3' }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 10, 5]} intensity={1.4} />
        <Environment preset="city" />
        <OrbitControls enablePan={true} />
        {systemList.map((name) => (
          <primitive key={name} object={systemMeshes[name]} visible={!!systemVisible[name]} />
        ))}
      </Canvas>

      <div style={{ position: 'absolute', right: 12, top: 12, background: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 8, maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Systems</div>
        {systemList.map((s) => (
          <div key={s} style={{ marginBottom: 6 }}>
            <label style={{ cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={!!systemVisible[s]}
                onChange={(e) => setSystemVisible((prev) => ({ ...prev, [s]: e.target.checked }))}
              />{' '}
              {s}
            </label>
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 12, color: '#333' }}>Loading: {loadingProgress}%</div>
      </div>

      <div style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(255,255,255,0.95)', padding: 6, borderRadius: 6, fontSize: 12 }}>
        Data: BodyParts3D (CC BY 4.0). See docs/ANATOMY.md for attribution and usage notes.
      </div>
    </div>
  );
}

function getSystemColor(system) {
  const map = {
    skeletal: '#e2d9ba',
    muscular: '#a85b50',
    cardiac: '#b96760',
    sensory: '#b0c8ce',
    arterial: '#c05245',
    venous: '#527c9f',
    nervous: '#d8b565',
    respiratory: '#b98991',
    digestive: '#b8916b',
    urinary: '#b47961',
    lymphatic: '#879f7c',
    endocrine: '#c5a09a',
    reproductive: '#bda098',
    integumentary: '#ba9b7d',
    connective: '#aec3bb',
  };
  return map[system] ?? '#999999';
}
