import * as THREE from "three";

// Keep the original coordinate system for existing saved layouts.
export function captureTransform(group) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3();
  group.traverse((mesh) => {
    if (!mesh.isMesh) return;
    mesh.geometry.computeBoundingBox();
    const matrix = group.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
    box.union(mesh.geometry.boundingBox.clone().applyMatrix4(matrix));
  });
  group.userData.transformBase = {
    position: group.position.clone(), rotation: group.rotation.clone(),
    scale: group.scale.clone(), pivot: box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3()),
  };
}

export function applyTransform(group, override = {}) {
  const base = group.userData.transformBase;
  if (!base) return;
  group.position.copy(base.position);
  group.rotation.copy(base.rotation);
  group.scale.copy(base.scale);
  if (override.position) group.position.fromArray(override.position);
  if (override.rotation) group.rotation.fromArray(override.rotation);
  const size = Number.isFinite(override.size) ? Math.max(0.1, Math.min(3, override.size)) : 1;
  group.scale.multiplyScalar(size);
  // Rotation and resizing keep the structure's own centre fixed.
  const before = base.pivot.clone().multiply(base.scale).applyEuler(base.rotation);
  const after = base.pivot.clone().multiply(group.scale).applyEuler(group.rotation);
  group.userData.pivotOffset = before.sub(after);
  group.position.add(group.userData.pivotOffset);
}
