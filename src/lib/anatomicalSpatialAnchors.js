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

  bodyEnvelope.updateWorldMatrix(true, true);
  organGroup.updateWorldMatrix(true, true);

  const { targetWorldPos, bodyHeight } = getAnatomicalTargetTransform(bodyEnvelope, config.normalized);
  const currentCenterWorld = new THREE.Box3().setFromObject(organGroup).getCenter(new THREE.Vector3());
  const localTarget = organGroup.parent.worldToLocal(targetWorldPos.clone());
  const localCurrentCenter = organGroup.parent.worldToLocal(currentCenterWorld.clone());
  organGroup.position.add(localTarget.sub(localCurrentCenter));

  if (options.applyRotation !== false) organGroup.rotation.copy(config.rotation);

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
