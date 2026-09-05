import * as THREE from "three";

/**
 * Spatial anchors normalised to the visible body envelope.
 * +X is the patient's left, +Y is superior and +Z is anterior.
 */
export const ANATOMICAL_LANDMARKS = {
  brain: { normalized: new THREE.Vector3(0.5, 0.94, 0.48), scaleRatio: 0.11, rotation: new THREE.Euler(0, 0, 0) },
  heart: {
    normalized: new THREE.Vector3(0.53, 0.72, 0.54),
    scaleRatio: 0.08,
    rotation: new THREE.Euler(THREE.MathUtils.degToRad(-15), THREE.MathUtils.degToRad(20), THREE.MathUtils.degToRad(-25)),
  },
  lungs: { normalized: new THREE.Vector3(0.5, 0.73, 0.49), scaleRatio: 0.18, rotation: new THREE.Euler(0, 0, 0) },
  liver: {
    normalized: new THREE.Vector3(0.43, 0.62, 0.52),
    scaleRatio: 0.12,
    rotation: new THREE.Euler(THREE.MathUtils.degToRad(5), 0, THREE.MathUtils.degToRad(8)),
  },
  stomach: {
    normalized: new THREE.Vector3(0.55, 0.61, 0.53),
    scaleRatio: 0.09,
    rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(10), THREE.MathUtils.degToRad(-12)),
  },
  leftKidney: {
    normalized: new THREE.Vector3(0.56, 0.58, 0.38),
    scaleRatio: 0.05,
    rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(-15), 0),
  },
  rightKidney: {
    normalized: new THREE.Vector3(0.44, 0.565, 0.38),
    scaleRatio: 0.05,
    rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(15), 0),
  },
  kidneys: {
    normalized: new THREE.Vector3(0.5, 0.5725, 0.38),
    scaleRatio: 0.12,
    rotation: new THREE.Euler(0, 0, 0),
  },
  bladder: { normalized: new THREE.Vector3(0.5, 0.46, 0.55), scaleRatio: 0.045, rotation: new THREE.Euler(0, 0, 0) },
};

export function getAnatomicalTargetTransform(bodyEnvelope, normalizedAnchor) {
  bodyEnvelope.updateWorldMatrix(true, true);
  const bbox = new THREE.Box3().setFromObject(bodyEnvelope);
  const size = bbox.getSize(new THREE.Vector3());
  const targetWorldPos = new THREE.Vector3(
    bbox.min.x + size.x * normalizedAnchor.x,
    bbox.min.y + size.y * normalizedAnchor.y,
    bbox.min.z + size.z * normalizedAnchor.z,
  );
  return { targetWorldPos, bodyHeight: size.y, bodyBounds: bbox };
}

/**
 * Aligns an already-parented procedural structure without disturbing the
 * relative placement of compound parts such as paired lungs or kidneys.
 */
export function alignAnatomicalGroupToBody(bodyEnvelope, organGroup, organKey, options = {}) {
  const config = ANATOMICAL_LANDMARKS[organKey];
  if (!config || !organGroup?.parent) return organGroup;

  if (options.applyRotation !== false) organGroup.rotation.copy(config.rotation);
  bodyEnvelope.updateWorldMatrix(true, true);
  organGroup.updateWorldMatrix(true, true);

  const { targetWorldPos, bodyHeight } = getAnatomicalTargetTransform(bodyEnvelope, config.normalized);
  const currentCenterWorld = new THREE.Box3().setFromObject(organGroup).getCenter(new THREE.Vector3());
  const localTarget = organGroup.parent.worldToLocal(targetWorldPos.clone());
  const localCurrentCenter = organGroup.parent.worldToLocal(currentCenterWorld.clone());
  organGroup.position.add(localTarget.sub(localCurrentCenter));

  if (options.applyScale) {
    const organSize = new THREE.Box3().setFromObject(organGroup).getSize(new THREE.Vector3());
    const maxDimension = Math.max(organSize.x, organSize.y, organSize.z);
    if (maxDimension > 0 && config.scaleRatio) {
      organGroup.scale.multiplyScalar((bodyHeight * config.scaleRatio) / maxDimension);
    }
  }

  organGroup.userData = {
    ...organGroup.userData,
    anatomicalId: organKey,
    isInternalOrgan: true,
    normalizedCoords: config.normalized.toArray(),
  };
  organGroup.updateWorldMatrix(true, true);
  return organGroup;
}

/**
 * Keeps a procedural system inside the loaded body's overall envelope.
 * Uniform scaling preserves anatomical proportions; translation only corrects
 * overshoot caused by legacy coordinates or a differently scaled body asset.
 */
export function keepGroupInsideBodyEnvelope(bodyEnvelope, group, padding = 0.985) {
  if (!bodyEnvelope || !group) return group;
  bodyEnvelope.updateWorldMatrix(true, true);
  group.updateWorldMatrix(true, true);

  const bodyBounds = new THREE.Box3().setFromObject(bodyEnvelope);
  const groupBounds = new THREE.Box3().setFromObject(group);
  if (bodyBounds.isEmpty() || groupBounds.isEmpty()) return group;

  const bodySize = bodyBounds.getSize(new THREE.Vector3()).multiplyScalar(padding);
  const groupSize = groupBounds.getSize(new THREE.Vector3());
  const ratios = [bodySize.x / groupSize.x, bodySize.y / groupSize.y, bodySize.z / groupSize.z]
    .filter((value) => Number.isFinite(value) && value > 0);
  const fitScale = Math.min(1, ...ratios);
  if (fitScale < 1) {
    group.scale.multiplyScalar(fitScale);
    group.updateWorldMatrix(true, true);
    groupBounds.setFromObject(group);
  }

  const inset = bodyBounds.clone();
  const margin = bodyBounds.getSize(new THREE.Vector3()).multiplyScalar((1 - padding) / 2);
  inset.min.add(margin);
  inset.max.sub(margin);
  const correction = new THREE.Vector3();
  for (const axis of ["x", "y", "z"]) {
    if (groupBounds.min[axis] < inset.min[axis]) correction[axis] += inset.min[axis] - groupBounds.min[axis];
    if (groupBounds.max[axis] > inset.max[axis]) correction[axis] -= groupBounds.max[axis] - inset.max[axis];
  }
  if (correction.lengthSq() > 0 && group.parent) {
    const originWorld = group.parent.localToWorld(new THREE.Vector3());
    const correctedWorld = originWorld.clone().add(correction);
    group.position.add(group.parent.worldToLocal(correctedWorld).sub(group.parent.worldToLocal(originWorld)));
  }
  group.updateWorldMatrix(true, true);
  return group;
}

/**
 * Maps procedural structures from the fallback mannequin envelope into the
 * loaded surface model envelope. Axis-specific scaling is intentional: the
 * supplied surface has a wider shoulder/arm span than the compact fallback.
 */
export function conformGroupsToBodyEnvelope(sourceEnvelope, targetEnvelope, groups, padding = 0.985) {
  if (!sourceEnvelope || !targetEnvelope || !groups?.length) return groups;
  sourceEnvelope.updateWorldMatrix(true, true);
  targetEnvelope.updateWorldMatrix(true, true);

  const sourceBounds = new THREE.Box3().setFromObject(sourceEnvelope);
  const targetBounds = new THREE.Box3().setFromObject(targetEnvelope);
  const sourceSize = sourceBounds.getSize(new THREE.Vector3());
  const targetSize = targetBounds.getSize(new THREE.Vector3()).multiplyScalar(padding);
  if (sourceBounds.isEmpty() || targetBounds.isEmpty() || sourceSize.x <= 0 || sourceSize.y <= 0 || sourceSize.z <= 0) return groups;

  const scale = new THREE.Vector3(
    targetSize.x / sourceSize.x,
    targetSize.y / sourceSize.y,
    targetSize.z / sourceSize.z,
  );
  const sourceMin = sourceBounds.min;
  const targetMin = targetBounds.min.clone().add(
    targetBounds.getSize(new THREE.Vector3()).sub(targetSize).multiplyScalar(0.5),
  );

  groups.forEach((group) => {
    if (!group?.parent) return;
    const worldPosition = group.parent.localToWorld(group.position.clone());
    const mappedWorldPosition = new THREE.Vector3(
      targetMin.x + (worldPosition.x - sourceMin.x) * scale.x,
      targetMin.y + (worldPosition.y - sourceMin.y) * scale.y,
      targetMin.z + (worldPosition.z - sourceMin.z) * scale.z,
    );
    group.position.copy(group.parent.worldToLocal(mappedWorldPosition));
    group.scale.multiply(scale);
    group.updateWorldMatrix(true, true);
    keepGroupInsideBodyEnvelope(targetEnvelope, group, padding);
  });

  return groups;
}

/**
 * Registers an imported organ model and aligns it to the body envelope.
 */
export function registerOrganToBody(bodyEnvelope, organMesh, organKey, options = {}) {
  const config = ANATOMICAL_LANDMARKS[organKey];
  if (!config) {
    console.warn(`No landmark definition found for organ key: ${organKey}`);
    return null;
  }

  if (organMesh.geometry) {
    organMesh.geometry.computeBoundingBox();
    organMesh.geometry.center();
  }

  const parent = options.parent ?? bodyEnvelope;
  parent.add(organMesh);
  return alignAnatomicalGroupToBody(bodyEnvelope, organMesh, organKey, {
    applyRotation: options.applyRotation,
    applyScale: options.applyScale !== false,
  });
}

/**
 * Applies the supplied light clinical translucent finish to one mesh or group.
 */
export function applyLightModeTranslucency(bodyObject) {
  const applyMaterial = (mesh) => {
    if (!mesh.isMesh) return;
    mesh.material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#F1F5F9"),
      roughness: 0.15,
      metalness: 0,
      transmission: 0.88,
      ior: 1.34,
      thickness: 1.2,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  };
  bodyObject.traverse?.(applyMaterial);
  if (bodyObject.isMesh) applyMaterial(bodyObject);
  return bodyObject;
}
