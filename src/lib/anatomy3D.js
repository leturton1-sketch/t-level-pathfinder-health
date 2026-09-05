// 3D anatomy structure definitions — anatomically positioned segmented structures.
// Coordinate space: origin at feet, +Y up, body faces +Z (anatomical position).
// Each structure is independently toggleable / isolatable / reconstructable in 3D.

export const SYSTEM_META = {
  integumentary:{ name: "Integumentary",    color: 0xf2b8a0, hex: "#f2b8a0", text: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  muscular:     { name: "Muscular System",  color: 0xb85c68, hex: "#b85c68", text: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
  skeletal:     { name: "Skeletal System",  color: 0xeae0d2, hex: "#eae0d2", text: "text-stone-600", bg: "bg-stone-100", border: "border-stone-300" },
  cardiovascular: { name: "Cardiovascular", color: 0xc2334a, hex: "#c2334a", text: "text-rose-500",   bg: "bg-rose-50",   border: "border-rose-200" },
  respiratory:  { name: "Respiratory",      color: 0xe58a8a, hex: "#e58a8a", text: "text-sky-400",    bg: "bg-sky-50",    border: "border-sky-200" },
  digestive:    { name: "Digestive",        color: 0xc77b5a, hex: "#c77b5a", text: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-200" },
  urinary:      { name: "Urinary / Renal",  color: 0x8a5a8a, hex: "#8a5a8a", text: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-200" },
  endocrine:    { name: "Endocrine",        color: 0xf1c75b, hex: "#f1c75b", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  lymphatic:    { name: "Lymphatic / Immune", color: 0x64c7a2, hex: "#64c7a2", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  nervous:      { name: "Nervous System",   color: 0xe8a9c0, hex: "#e8a9c0", text: "text-violet-500", bg: "bg-violet-50", border: "border-violet-200" },
  reproductive: { name: "Reproductive",     color: 0xc77b8a, hex: "#c77b8a", text: "text-pink-400",   bg: "bg-pink-50",   border: "border-pink-200" },
};

export const SYSTEM_ORDER = ["integumentary","muscular","skeletal","nervous","cardiovascular","respiratory","digestive","urinary","endocrine","lymphatic","reproductive"];

// Translucent body shell ("cadaver" mannequin) — gender-variant silhouette.
export const BODY_SHELLS = {
  male: {
    parts: [
      { shape: { type: "sphere", radius: 0.09 }, position: [0, 1.64, 0] }, // head
      { shape: { type: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 0.08, radialSegments: 16 }, position: [0, 1.54, 0] }, // neck
      { shape: { type: "lathe", segments: 32, points: [[0.06,0.88],[0.1,0.92],[0.13,0.98],[0.12,1.05],[0.12,1.1],[0.14,1.18],[0.17,1.26],[0.2,1.36],[0.18,1.44],[0.1,1.5],[0.05,1.52]] }, position: [0,0,0] }, // torso
      { shape: { type: "capsule", radius: 0.05, length: 0.78 }, position: [0.07, 0.52, 0] }, // R leg
      { shape: { type: "capsule", radius: 0.05, length: 0.78 }, position: [-0.07, 0.52, 0] }, // L leg
      { shape: { type: "capsule", radius: 0.04, length: 0.6 }, position: [0.2, 1.18, 0], rotation: [0, 0, 0.18] }, // R arm
      { shape: { type: "capsule", radius: 0.04, length: 0.6 }, position: [-0.2, 1.18, 0], rotation: [0, 0, -0.18] }, // L arm
    ],
  },
  female: {
    parts: [
      { shape: { type: "sphere", radius: 0.085 }, position: [0, 1.64, 0] },
      { shape: { type: "cylinder", radiusTop: 0.045, radiusBottom: 0.045, height: 0.08, radialSegments: 16 }, position: [0, 1.54, 0] },
      { shape: { type: "lathe", segments: 32, points: [[0.06,0.88],[0.12,0.92],[0.15,0.98],[0.13,1.03],[0.1,1.08],[0.1,1.13],[0.13,1.2],[0.16,1.28],[0.17,1.36],[0.15,1.44],[0.08,1.5],[0.05,1.52]] }, position: [0,0,0] },
      { shape: { type: "capsule", radius: 0.05, length: 0.78 }, position: [0.08, 0.52, 0] },
      { shape: { type: "capsule", radius: 0.05, length: 0.78 }, position: [-0.08, 0.52, 0] },
      { shape: { type: "capsule", radius: 0.035, length: 0.56 }, position: [0.19, 1.2, 0], rotation: [0, 0, 0.15] },
      { shape: { type: "capsule", radius: 0.035, length: 0.56 }, position: [-0.19, 1.2, 0], rotation: [0, 0, -0.15] },
      { shape: { type: "sphere", radius: 0.05 }, position: [0.06, 1.34, 0.07] }, // R breast
      { shape: { type: "sphere", radius: 0.05 }, position: [-0.06, 1.34, 0.07] }, // L breast
    ],
  },
};

// Segmented anatomical structures. `genders`: 'both' | 'male' | 'female'.
const STRUCTURE_BLUEPRINTS = [
  // ── SKELETAL ──
  { id: "skull", name: "Skull / Cranium", system: "skeletal", genders: "both", shape: { type: "sphere", radius: 0.095 }, position: [0, 1.64, 0], scale: [1, 0.95, 1.05],
    function: "Protects the brain and forms the structure of the face. Comprises 22 bones divided into cranial and facial bones.",
    clinicalNote: "Head injury assessment checks for racoon eyes, Battle's sign, and CSF leakage indicating basal skull fracture. Apply cervical collar if suspected." },
  { id: "spine_bone", name: "Vertebral Column", system: "skeletal", genders: "both", shape: { type: "cylinder", radiusTop: 0.028, radiusBottom: 0.032, height: 0.6, radialSegments: 16 }, position: [0, 1.24, -0.075],
    function: "33 vertebrae protecting the spinal cord, providing structural support and flexible movement. Cervical, thoracic, lumbar, sacral, coccygeal regions.",
    clinicalNote: "Suspected spinal injury → immediate immobilisation, log-roll, and maintain neutral alignment. Check for sensory/motor deficits below injury level." },
  { id: "ribcage", name: "Rib Cage", system: "skeletal", genders: "both",
    parts: [
      { shape: { type: "torus", radius: 0.14, tube: 0.012, arc: Math.PI*0.78, radialSegments: 8, tubularSegments: 20 }, position: [0, 1.2, -0.02], rotation: [Math.PI/2, 0, -Math.PI/2 + 0.1] },
      { shape: { type: "torus", radius: 0.145, tube: 0.012, arc: Math.PI*0.78, radialSegments: 8, tubularSegments: 20 }, position: [0, 1.27, -0.02], rotation: [Math.PI/2, 0, -Math.PI/2 + 0.1] },
      { shape: { type: "torus", radius: 0.15, tube: 0.012, arc: Math.PI*0.78, radialSegments: 8, tubularSegments: 20 }, position: [0, 1.34, -0.02], rotation: [Math.PI/2, 0, -Math.PI/2 + 0.1] },
      { shape: { type: "torus", radius: 0.15, tube: 0.012, arc: Math.PI*0.78, radialSegments: 8, tubularSegments: 20 }, position: [0, 1.41, -0.02], rotation: [Math.PI/2, 0, -Math.PI/2 + 0.1] },
      { shape: { type: "torus", radius: 0.14, tube: 0.012, arc: Math.PI*0.78, radialSegments: 8, tubularSegments: 20 }, position: [0, 1.47, -0.02], rotation: [Math.PI/2, 0, -Math.PI/2 + 0.1] },
    ],
    function: "12 pairs of ribs forming a protective cage around the heart and lungs, expanding during respiration.",
    clinicalNote: "Flail chest (≥3 ribs fractured in ≥2 places) causes paradoxical movement — life-threatening. Monitor for pneumothorax and provide adequate analgesia." },
  { id: "pelvis", name: "Pelvis", system: "skeletal", genders: "both", shape: { type: "torus", radius: 0.1, tube: 0.035, radialSegments: 12, tubularSegments: 28 }, position: [0, 0.9, -0.01], rotation: [Math.PI/2, 0, 0],
    function: "Bowl-shaped bone transferring weight from spine to lower limbs, protecting pelvic organs. Sexually dimorphic (wider in females).",
    clinicalNote: "Pelvic fractures can cause life-threatening haemorrhage. Apply a pelvic binder and monitor for retroperitoneal bleeding and bladder injury." },
  { id: "femurs", name: "Major Limb Bones", system: "skeletal", genders: "both",
    parts: [
      { shape: { type: "capsule", radius: 0.026, length: 0.4 }, position: [0.06, 0.62, 0] },
      { shape: { type: "capsule", radius: 0.026, length: 0.4 }, position: [-0.06, 0.62, 0] },
    ],
    function: "The longest and strongest bones in the body, supporting the body's weight and enabling locomotion.",
    clinicalNote: "Femoral shaft fractures can cause 1–1.5L blood loss. Assess for hypovolaemic shock, immobilise with traction, and monitor neurovascular status distally." },

  // ── CARDIOVASCULAR ──
  { id: "heart", name: "The Heart", system: "cardiovascular", genders: "both",
    shape: { type: "lathe", segments: 32, points: [[0,0],[0.02,0.005],[0.035,0.02],[0.045,0.04],[0.05,0.065],[0.048,0.09],[0.04,0.11],[0.025,0.125],[0.01,0.13],[0,0.128]] },
    position: [-0.028, 1.255, 0.045], rotation: [0, 0, -0.15],
    function: "Four-chambered muscular pump. The right side pumps deoxygenated blood to the lungs; the muscular left side pumps oxygenated blood to the systemic circulation.",
    clinicalNote: "Assess via radial/apical pulses, BP, capillary refill, and ECG. Left-sided failure → pulmonary congestion; right-sided failure → peripheral oedema." },
  { id: "coronary_vessels", name: "Coronary Circulation", system: "cardiovascular", genders: "both", color: 0xd9485f,
    parts: [
      { shape: { type: "tube", radius: 0.0035, points: [[-0.015,1.35,0.075],[-0.05,1.31,0.088],[-0.055,1.25,0.075],[-0.035,1.21,0.06]] } },
      { shape: { type: "tube", radius: 0.003, points: [[-0.015,1.35,0.072],[0.012,1.31,0.084],[0.018,1.25,0.072],[0.0,1.22,0.06]] } },
    ],
    function: "The right and left coronary arteries supply oxygenated blood to the myocardium.",
    clinicalNote: "Coronary occlusion causes myocardial ischaemia and infarction. Assess chest pain promptly and obtain a 12-lead ECG." },
  { id: "aorta", name: "Aorta", system: "cardiovascular", genders: "both", color: 0xb42335,
    shape: { type: "tube", radius: 0.016, points: [[-0.02,1.2,0.02],[-0.02,1.33,0.02],[-0.005,1.42,0.0],[0.015,1.43,-0.01],[0.03,1.4,0.0],[0.03,1.2,0.0],[0.03,1.0,0.0]] },
    function: "The largest artery, conducting high-pressure oxygenated blood from the left ventricle to the systemic circulation. Its elastic walls absorb systolic recoil.",
    clinicalNote: "Aortic compliance diminishes with age/atherosclerosis → isolated systolic hypertension. Aortic aneurysm rupture is rapidly fatal — monitor back pain and pulse disparity." },
  { id: "vena_cava", name: "Vena Cava", system: "cardiovascular", genders: "both", color: 0x244b7a,
    shape: { type: "tube", radius: 0.02, points: [[0.025,1.42,-0.035],[0.025,1.24,-0.04],[0.025,1.0,-0.045],[0.01,0.88,-0.02]] },
    function: "The body's largest veins — superior and inferior vena cava — returning deoxygenated blood to the right atrium.",
    clinicalNote: "Central venous pressure reflects intravascular volume status. Distended neck veins (JVP) suggest right heart failure or tamponade." },
  { id: "arterial_tree", name: "Systemic Arterial Branches", system: "cardiovascular", genders: "both", color: 0xc62f3f,
    parts: [
      { shape: { type: "tube", radius: 0.008, points: [[0,1.42,0],[0.12,1.45,0],[0.18,1.32,0],[0.23,1.12,0]] } },
      { shape: { type: "tube", radius: 0.008, points: [[0,1.42,0],[-0.12,1.45,0],[-0.18,1.32,0],[-0.23,1.12,0]] } },
      { shape: { type: "tube", radius: 0.009, points: [[0.03,1.0,0],[0.08,0.82,0],[0.09,0.56,0],[0.08,0.18,0]] } },
      { shape: { type: "tube", radius: 0.009, points: [[0.03,1.0,0],[-0.08,0.82,0],[-0.09,0.56,0],[-0.08,0.18,0]] } },
      { shape: { type: "tube", radius: 0.005, points: [[0.01,1.42,0],[0.02,1.52,0],[0.01,1.6,0]] } }
    ],
    function: "Elastic and muscular arteries branch repeatedly to distribute oxygenated blood to tissues under pressure.",
    clinicalNote: "Assess pulse presence, symmetry, volume, capillary refill and distal perfusion." },
  { id: "venous_tree", name: "Systemic Venous Branches", system: "cardiovascular", genders: "both", color: 0x244b7a,
    parts: [
      { shape: { type: "tube", radius: 0.007, points: [[0.22,1.11,0.025],[0.17,1.31,0.025],[0.08,1.42,0.025],[0.03,1.38,0.025]] } },
      { shape: { type: "tube", radius: 0.007, points: [[-0.22,1.11,0.025],[-0.17,1.31,0.025],[-0.08,1.42,0.025],[0.03,1.38,0.025]] } },
      { shape: { type: "tube", radius: 0.008, points: [[0.08,0.18,0.025],[0.09,0.55,0.025],[0.06,0.84,0.025],[0.01,0.92,0.025]] } },
      { shape: { type: "tube", radius: 0.008, points: [[-0.08,0.18,0.025],[-0.09,0.55,0.025],[-0.06,0.84,0.025],[0.01,0.92,0.025]] } }
    ],
    function: "Low-pressure veins return deoxygenated blood to the heart and contain valves that support one-way flow.",
    clinicalNote: "Observe for venous congestion, oedema, varicosities and signs of deep-vein thrombosis." },

  // ── RESPIRATORY ──
  { id: "trachea", name: "Trachea", system: "respiratory", genders: "both", shape: { type: "cylinder", radiusTop: 0.018, radiusBottom: 0.018, height: 0.12, radialSegments: 16 }, position: [0, 1.5, 0.03],
    function: "Rigid airway lined with ciliated epithelium, reinforced with C-shaped cartilage rings, preventing collapse during inspiration.",
    clinicalNote: "Patent airway is the 'A' in ABCDE. Blockage via secretions, foreign body, or swelling is rapidly fatal. Suction and airway adjuncts maintain patency." },
  { id: "lungs", name: "Lungs & Alveoli", system: "respiratory", genders: "both",
    parts: [
      { shape: { type: "sphere", radius: 0.07, scale: [0.8,1.55,0.9] }, position: [-0.1, 1.3, 0.02] },
      { shape: { type: "sphere", radius: 0.075, scale: [0.85,1.6,0.95] }, position: [0.1, 1.3, 0.02] },
    ],
    function: "Spongy bilateral organs of millions of alveoli. Alveolar walls one cell thick allow rapid gas diffusion down partial-pressure gradients.",
    clinicalNote: "Assess via RR, chest expansion symmetry, SpO₂, and auscultation. Crackles = alveolar fluid; wheeze = bronchoconstriction." },
  { id: "diaphragm", name: "Diaphragm", system: "respiratory", genders: "both", shape: { type: "sphere", radius: 0.12, scale: [1.2,0.22,0.85] }, position: [0, 1.115, -0.005],
    function: "Dome-shaped primary muscle of respiration, separating thoracic and abdominal cavities. Contracts downward to draw air in.",
    clinicalNote: "Diaphragmatic breathing is assessed in COPD. Paradoxical movement suggests phrenic nerve injury or diaphragmatic fatigue." },

  // ── DIGESTIVE ──
  { id: "esophagus", name: "Oesophagus", system: "digestive", genders: "both", shape: { type: "cylinder", radiusTop: 0.013, radiusBottom: 0.014, height: 0.34, radialSegments: 12 }, position: [0, 1.36, -0.025],
    function: "Muscular tube transporting food from pharynx to stomach via peristaltic waves.",
    clinicalNote: "NG tube insertion passes through the oesophagus — confirm placement via pH testing before feeding to prevent aspiration pneumonia." },
  { id: "stomach", name: "The Stomach", system: "digestive", genders: "both",
    shape: { type: "lathe", segments: 28, points: [[0,0],[0.03,0.005],[0.045,0.02],[0.05,0.04],[0.045,0.06],[0.035,0.08],[0.025,0.1],[0.015,0.11],[0,0.108]] },
    position: [-0.07, 1.075, 0.025], rotation: [0, 0, 0.22],
    function: "Muscular J-shaped organ mixing food with HCl and pepsin to begin protein digestion. Pyloric sphincter controls chyme release.",
    clinicalNote: "Assess nausea/vomiting. NBM patients require IV fluids and regular mouth care. Monitor NG aspirate for signs of obstruction." },
  { id: "liver", name: "The Liver", system: "digestive", genders: "both",
    shape: { type: "lathe", segments: 30, points: [[0,0],[0.04,0.005],[0.07,0.015],[0.09,0.03],[0.1,0.045],[0.095,0.06],[0.07,0.075],[0.04,0.08],[0,0.078]] },
    position: [0.065, 1.105, 0.015], rotation: [0, 0, -0.08],
    function: "Largest internal organ — >500 functions including detoxification, bile production, glycogen storage, and protein synthesis.",
    clinicalNote: "Monitor LFTs. Observe jaundice, ascites, bruising — signs of impaired hepatic function. Administer drugs cautiously." },
  { id: "gallbladder", name: "Gallbladder", system: "digestive", genders: "both", shape: { type: "sphere", radius: 0.022, scale: [0.72,1.5,0.72] }, position: [0.095, 1.075, 0.035],
    function: "Stores and concentrates bile produced by the liver, releasing it into the duodenum to emulsify fats.",
    clinicalNote: "Biliary colic and cholecystitis present with RUQ pain (Murphy's sign). Monitor for obstructive jaundice if gallstones migrate." },
  { id: "pancreas", name: "Pancreas", system: "digestive", genders: "both", shape: { type: "capsule", radius: 0.016, length: 0.11 }, position: [-0.005, 1.075, -0.035], rotation: [0, 0, Math.PI/2],
    function: "Dual-function gland: exocrine (digestive enzymes) and endocrine (insulin and glucagon from islets of Langerhans).",
    clinicalNote: "Pancreatitis causes severe epigastric pain radiating to the back. Monitor blood glucose — pancreatic dysfunction causes diabetes." },
  { id: "spleen", name: "Spleen", system: "digestive", genders: "both", shape: { type: "sphere", radius: 0.032, scale: [0.72,1.35,0.72] }, position: [-0.12, 1.115, -0.025],
    function: "Largest lymphoid organ — filters blood, recycles old red cells, stores platelets, and supports immune function.",
    clinicalNote: "Ruptured spleen is a life-threatening cause of haemorrhage after trauma. Monitor for Kehr's sign (referred left shoulder pain)." },
  { id: "small_intestine", name: "Small Intestine", system: "digestive", genders: "both", shape: { type: "sphere", radius: 0.062, scale: [1.25,0.88,0.78] }, position: [0, 0.985, 0.035],
    function: "Coiled tube (duodenum, jejunum, ileum) where most nutrient absorption occurs via villi.",
    clinicalNote: "Monitor for ileus (absent bowel sounds) post-operatively. Nasogastric decompression relieves distension." },
  { id: "large_intestine", name: "Large Intestine (Colon)", system: "digestive", genders: "both",
    shape: { type: "tube", radius: 0.02, points: [[0.085,0.93,0.025],[0.085,1.095,0.025],[0.04,1.13,0.025],[-0.04,1.13,0.025],[-0.085,1.095,0.025],[-0.085,0.93,0.025],[-0.05,0.89,0.025],[0,0.87,0.025]] },
    function: "Frames the abdomen — absorbs water and electrolytes, forms and stores faeces. Caecum, ascending, transverse, descending, sigmoid.",
    clinicalNote: "Assess bowel function (auscultate bowel sounds, monitor output). Stoma care and colostomy management are key nursing skills." },

  // ── URINARY ──
  { id: "kidneys", name: "The Kidneys", system: "urinary", genders: "both",
    parts: [
      { shape: { type: "sphere", radius: 0.04, scale: [0.72,1.12,0.8] }, position: [-0.09, 1.065, -0.065] },
      { shape: { type: "sphere", radius: 0.04, scale: [0.72,1.12,0.8] }, position: [0.09, 1.035, -0.065] },
    ],
    function: "Bilateral bean-shaped organs containing nephrons that filter plasma, reabsorbing water/glucose and secreting wastes.",
    clinicalNote: "Monitor via Fluid Balance Charts and U&E. Urine output <0.5ml/kg/hr for 6 hours warns of Acute Kidney Injury (AKI)." },
  { id: "ureters", name: "Ureters", system: "urinary", genders: "both",
    parts: [
      { shape: { type: "tube", radius: 0.005, points: [[-0.09,1.03,-0.06],[-0.065,0.96,-0.045],[-0.025,0.885,0.0]] } },
      { shape: { type: "tube", radius: 0.005, points: [[0.09,1.0,-0.06],[0.065,0.95,-0.045],[0.025,0.885,0.0]] } },
    ],
    function: "Muscular tubes propelling urine from kidneys to bladder via peristalsis.",
    clinicalNote: "Ureteric stones cause severe colicky flank pain radiating to groin. Strain urine to catch calculi for analysis." },
  { id: "bladder", name: "The Bladder", system: "urinary", genders: "both", shape: { type: "sphere", radius: 0.05, scale: [1,0.8,0.9] }, position: [0, 0.875, 0.045],
    function: "Distensible muscular sac lined with transitional epithelium, storing urine prior to micturition.",
    clinicalNote: "Urinary retention is common post-op — assess with bladder scanner. Palpate for a distended bladder; monitor output." },

  // ── NERVOUS ──
  { id: "brain", name: "The Brain", system: "nervous", genders: "both", shape: { type: "sphere", radius: 0.085, scale: [1,0.88,1.1] }, position: [0, 1.64, 0.01],
    function: "Central organ of the nervous system. Cerebrum (cognition), cerebellum (coordination), brainstem (autonomic vital functions).",
    clinicalNote: "Assess with AVPU/GCS, pupil size & reactivity. Hypoglycaemia mimics stroke — always check blood glucose." },
  { id: "cerebellum", name: "Cerebellum", system: "nervous", genders: "both", shape: { type: "sphere", radius: 0.04 }, position: [0, 1.58, -0.03],
    function: "Coordinates balance, posture, and fine motor control, comparing intended movement with actual performance.",
    clinicalNote: "Cerebellar lesions cause ataxia, intention tremor, and dysmetria. Perform finger-nose and heel-shin tests." },
  { id: "spinal_cord", name: "Spinal Cord", system: "nervous", genders: "both", shape: { type: "cylinder", radiusTop: 0.012, radiusBottom: 0.01, height: 0.6, radialSegments: 12 }, position: [0, 1.24, -0.072],
    function: "Bundle of nerve fibres transmitting signals between brain and peripheral nervous system, protected by the vertebral column.",
    clinicalNote: "Spinal cord injury → immediate immobilisation and log-roll. Monitor for autonomic dysreflexia in injuries above T6." },
  { id: "peripheral_nerves", name: "Major Peripheral Nerves", system: "nervous", genders: "both", color: 0xf3c969,
    parts: [
      { shape: { type: "tube", radius: 0.004, points: [[0,1.47,-0.06],[0.08,1.40,-0.035],[0.145,1.30,-0.015],[0.18,1.12,0]] } },
      { shape: { type: "tube", radius: 0.004, points: [[0,1.47,-0.06],[-0.08,1.40,-0.035],[-0.145,1.30,-0.015],[-0.18,1.12,0]] } },
      { shape: { type: "tube", radius: 0.0045, points: [[0,1.05,-0.065],[0.055,0.88,-0.03],[0.065,0.66,0],[0.065,0.30,0]] } },
      { shape: { type: "tube", radius: 0.0045, points: [[0,1.05,-0.065],[-0.055,0.88,-0.03],[-0.065,0.66,0],[-0.065,0.30,0]] } },
    ],
    function: "Paired cranial, spinal and peripheral nerve pathways carry sensory input and motor commands between the central nervous system and the limbs.",
    clinicalNote: "Assess sensation, power, reflexes and symmetry. A new focal deficit requires urgent neurological escalation." },

  // ── REPRODUCTIVE (gender-specific) ──
  { id: "prostate", name: "Prostate Gland", system: "reproductive", genders: "male", shape: { type: "sphere", radius: 0.025, scale: [1,0.8,1] }, position: [0, 0.815, 0.025],
    function: "Walnut-sized gland surrounding the urethra, producing fluid that nourishes and transports sperm.",
    clinicalNote: "Benign prostatic hyperplasia causes urinary retention/hesitancy. PSA screening and digital rectal exam assess for malignancy." },
  { id: "testes", name: "Testes", system: "reproductive", genders: "male",
    parts: [
      { shape: { type: "sphere", radius: 0.026 }, position: [0.03, 0.66, 0.04] },
      { shape: { type: "sphere", radius: 0.026 }, position: [-0.03, 0.66, 0.04] },
    ],
    function: "Paired male gonads producing sperm and testosterone, housed in the scrotum outside the body for optimal temperature.",
    clinicalNote: "Testicular torsion is a surgical emergency — sudden severe scrotal pain. Teach young men testicular self-examination." },
  { id: "penis", name: "Penis", system: "reproductive", genders: "male", shape: { type: "capsule", radius: 0.02, length: 0.07 }, position: [0, 0.7, 0.06], rotation: [0.3, 0, 0],
    function: "Male organ of urination and copulation, containing erectile tissue and the urethra.",
    clinicalNote: "Assess for phimosis, priapism, and discharge. Condom catheters aid continence management in dependent patients." },
  { id: "ovaries", name: "Ovaries", system: "reproductive", genders: "female",
    parts: [
      { shape: { type: "sphere", radius: 0.02 }, position: [0.06, 0.91, 0] },
      { shape: { type: "sphere", radius: 0.02 }, position: [-0.06, 0.91, 0] },
    ],
    function: "Paired female gonads producing ova and the hormones oestrogen and progesterone, regulating the menstrual cycle.",
    clinicalNote: "Ovarian cysts and ectopic pregnancies are key differentials for lower abdominal pain in women of reproductive age." },
  { id: "uterus", name: "Uterus", system: "reproductive", genders: "female",
    shape: { type: "lathe", segments: 24, points: [[0,0],[0.015,0.005],[0.025,0.015],[0.03,0.03],[0.028,0.045],[0.02,0.055],[0.008,0.06],[0,0.058]] },
    position: [0, 0.86, 0],
    function: "Pear-shaped muscular organ where a fertilised ovum implants and the fetus develops during pregnancy.",
    clinicalNote: "Assess for fibroids, endometriosis, and abnormal bleeding. Post-partum, palpate fundus and monitor lochia for haemorrhage." },
  { id: "fallopian", name: "Fallopian Tubes", system: "reproductive", genders: "female",
    parts: [
      { shape: { type: "capsule", radius: 0.005, length: 0.08 }, position: [0.04, 0.9, 0.04], rotation: [0, 0, 0.4] },
      { shape: { type: "capsule", radius: 0.005, length: 0.08 }, position: [-0.04, 0.9, 0.04], rotation: [0, 0, -0.4] },
    ],
    function: "Paired tubes transporting ova from ovaries to uterus — the usual site of fertilisation.",
    clinicalNote: "Ectopic pregnancy most commonly implants here — ruptured ectopic is a life-threatening cause of shock in early pregnancy." },
  { id: "vagina", name: "Vagina", system: "reproductive", genders: "female", shape: { type: "cylinder", radiusTop: 0.018, radiusBottom: 0.022, height: 0.07, radialSegments: 12 }, position: [0, 0.77, 0.04],
    function: "Muscular canal connecting the uterus to the exterior, serving as the birth canal and receiving organ.",
    clinicalNote: "Maintain dignity and privacy during intimate examinations. Always offer a chaperone and document consent." },

  // OUTER AND REGULATORY LAYERS
  { id: "skin", name: "Skin", system: "integumentary", genders: "both", shape: { type: "sphere", radius: 0.13, scale: [1.55,3.3,0.9] }, position: [0,1.18,0],
    function: "The body's largest organ: a protective barrier supporting sensation, thermoregulation, vitamin D synthesis and fluid balance.",
    clinicalNote: "Inspect colour, temperature, moisture, integrity and pressure areas. Non-blanching erythema indicates pressure damage." },
  // ── MUSCULAR ──
  // Separate selectable groups form a recognisable superficial muscle layer
  // from the front, side and back while preserving the 360° peel-away view.
  { id: "pectoralis_major", name: "Pectoralis Major", system: "muscular", genders: "both", color: 0xb8454f,
    parts: [
      { shape: { type: "sphere", radius: 0.071, scale: [1.12,0.56,0.34] }, position: [-0.072,1.365,0.087], rotation: [0.04,0,-0.12] },
      { shape: { type: "sphere", radius: 0.071, scale: [1.12,0.56,0.34] }, position: [0.072,1.365,0.087], rotation: [0.04,0,0.12] }
    ],
    function: "Broad paired chest muscles that flex, adduct and medially rotate the humerus and assist forceful inspiration when the upper limbs are fixed.",
    clinicalNote: "Assess symmetry, pain and power during resisted shoulder adduction. Chest-wall strain can mimic cardiac pain, so use a full clinical assessment." },
  { id: "deltoids", name: "Deltoid Muscles", system: "muscular", genders: "both", color: 0xc5545d,
    parts: [
      { shape: { type: "sphere", radius: 0.055, scale: [0.78,1.12,0.82] }, position: [-0.184,1.405,0.012], rotation: [0,0,-0.22] },
      { shape: { type: "sphere", radius: 0.055, scale: [0.78,1.12,0.82] }, position: [0.184,1.405,0.012], rotation: [0,0,0.22] }
    ],
    function: "The deltoid forms the shoulder contour and is the principal abductor of the arm, with anterior and posterior fibres assisting flexion and extension.",
    clinicalNote: "The central deltoid is a common intramuscular injection site. Locate landmarks carefully and assess axillary nerve function after shoulder injury." },
  { id: "upper_arm_muscles", name: "Biceps & Triceps", system: "muscular", genders: "both", color: 0xad3f49,
    parts: [
      { shape: { type: "capsule", radius: 0.033, length: 0.20 }, position: [-0.208,1.25,0.036], rotation: [0,0,-0.18] },
      { shape: { type: "capsule", radius: 0.033, length: 0.20 }, position: [0.208,1.25,0.036], rotation: [0,0,0.18] },
      { shape: { type: "capsule", radius: 0.029, length: 0.21 }, position: [-0.208,1.25,-0.038], rotation: [0,0,-0.18] },
      { shape: { type: "capsule", radius: 0.029, length: 0.21 }, position: [0.208,1.25,-0.038], rotation: [0,0,0.18] }
    ],
    function: "Biceps flexes the elbow and supinates the forearm; triceps extends the elbow. Together they provide controlled upper-limb movement.",
    clinicalNote: "Compare power bilaterally, assess tendon integrity after injury and monitor for weakness associated with peripheral nerve damage." },
  { id: "abdominal_wall", name: "Abdominal Wall", system: "muscular", genders: "both", color: 0xc65b58,
    parts: [
      { shape: { type: "capsule", radius: 0.031, length: 0.255 }, position: [-0.038,1.115,0.092] },
      { shape: { type: "capsule", radius: 0.031, length: 0.255 }, position: [0.038,1.115,0.092] },
      { shape: { type: "sphere", radius: 0.077, scale: [0.55,1.42,0.28] }, position: [-0.112,1.105,0.052], rotation: [0,0,-0.08] },
      { shape: { type: "sphere", radius: 0.077, scale: [0.55,1.42,0.28] }, position: [0.112,1.105,0.052], rotation: [0,0,0.08] }
    ],
    function: "Rectus abdominis and the obliques flex and rotate the trunk, support abdominal organs and raise intra-abdominal pressure.",
    clinicalNote: "Guarding or rigidity can indicate peritoneal irritation. Observe abdominal movement and avoid repeated deep palpation when acute pathology is suspected." },
  { id: "posterior_trunk_muscles", name: "Trapezius & Latissimus Dorsi", system: "muscular", genders: "both", color: 0x9f3544,
    parts: [
      { shape: { type: "sphere", radius: 0.105, scale: [1.42,0.78,0.22] }, position: [0,1.405,-0.088] },
      { shape: { type: "sphere", radius: 0.105, scale: [1.16,1.38,0.2] }, position: [0,1.215,-0.091] }
    ],
    function: "Trapezius stabilises and rotates the scapula; latissimus dorsi extends, adducts and medially rotates the upper limb.",
    clinicalNote: "Inspect scapular symmetry and posture. Weakness, wasting or winging may indicate accessory, thoracodorsal or long thoracic nerve dysfunction." },
  { id: "gluteals", name: "Gluteal Muscles", system: "muscular", genders: "both", color: 0xb94b57,
    parts: [
      { shape: { type: "sphere", radius: 0.075, scale: [0.86,1.02,0.62] }, position: [-0.07,0.875,-0.072] },
      { shape: { type: "sphere", radius: 0.075, scale: [0.86,1.02,0.62] }, position: [0.07,0.875,-0.072] }
    ],
    function: "The gluteal group extends, abducts and rotates the hip while stabilising the pelvis during standing and walking.",
    clinicalNote: "Assess gait and hip abductor strength. Ventrogluteal landmarks provide a safer intramuscular injection site than the dorsogluteal region." },
  { id: "thigh_muscles", name: "Quadriceps & Hamstrings", system: "muscular", genders: "both", color: 0xb34450,
    parts: [
      { shape: { type: "capsule", radius: 0.049, length: 0.29 }, position: [-0.074,0.655,0.047] },
      { shape: { type: "capsule", radius: 0.049, length: 0.29 }, position: [0.074,0.655,0.047] },
      { shape: { type: "capsule", radius: 0.043, length: 0.29 }, position: [-0.074,0.655,-0.045] },
      { shape: { type: "capsule", radius: 0.043, length: 0.29 }, position: [0.074,0.655,-0.045] }
    ],
    function: "Quadriceps extend the knee; hamstrings flex the knee and extend the hip. Both groups are essential for gait, transfers and balance.",
    clinicalNote: "Assess lower-limb power, pain and range of movement. Sudden swelling or tenderness requires evaluation for injury or venous thrombosis." },
  { id: "lower_leg_muscles", name: "Calf & Anterior Leg Muscles", system: "muscular", genders: "both", color: 0xa53b47,
    parts: [
      { shape: { type: "capsule", radius: 0.038, length: 0.255 }, position: [-0.073,0.315,-0.035] },
      { shape: { type: "capsule", radius: 0.038, length: 0.255 }, position: [0.073,0.315,-0.035] },
      { shape: { type: "capsule", radius: 0.025, length: 0.255 }, position: [-0.073,0.315,0.038] },
      { shape: { type: "capsule", radius: 0.025, length: 0.255 }, position: [0.073,0.315,0.038] }
    ],
    function: "Gastrocnemius and soleus plantar-flex the ankle and support venous return; anterior muscles dorsiflex the foot during gait.",
    clinicalNote: "Assess calf pain, swelling and symmetry alongside circulation and sensation. Do not massage a calf when deep-vein thrombosis is suspected." },
  { id: "thyroid", name: "Thyroid Gland", system: "endocrine", genders: "both", shape: { type: "torus", radius: 0.025, tube: 0.009 }, position: [0,1.5,0.035],
    function: "Produces thyroid hormones that regulate metabolic rate, growth and heat production.",
    clinicalNote: "Observe for altered heart rate, weight, temperature tolerance and neck swelling." },
  { id: "pancreas_endocrine", name: "Pancreatic Islets", system: "endocrine", genders: "both", shape: { type: "capsule", radius: 0.015, length: 0.095 }, position: [-0.005,1.075,-0.03], rotation: [0,0,Math.PI/2],
    function: "Islets release insulin and glucagon to maintain blood glucose within a safe range.",
    clinicalNote: "Check capillary glucose and ketones when clinically indicated; recognise hypoglycaemia and hyperglycaemia." },
  { id: "adrenal_glands", name: "Adrenal Glands", system: "endocrine", genders: "both",
    parts: [{ shape: { type: "sphere", radius: 0.018 }, position: [-0.09,1.115,-0.06] },{ shape: { type: "sphere", radius: 0.018 }, position: [0.09,1.085,-0.06] }],
    function: "Produce cortisol, aldosterone and catecholamines central to stress, blood pressure and electrolyte regulation.",
    clinicalNote: "Adrenal crisis can cause profound hypotension, vomiting and electrolyte disturbance and requires urgent escalation." },
  { id: "lymph_nodes", name: "Lymph Nodes", system: "lymphatic", genders: "both", color: 0xd6aa58,
    parts: [
      { shape: { type: "sphere", radius: 0.016 }, position: [-0.07,1.48,0.04] }, { shape: { type: "sphere", radius: 0.016 }, position: [0.07,1.48,0.04] },
      { shape: { type: "sphere", radius: 0.018 }, position: [-0.14,1.34,0.03] }, { shape: { type: "sphere", radius: 0.018 }, position: [0.14,1.34,0.03] },
      { shape: { type: "sphere", radius: 0.018 }, position: [-0.08,0.9,0.03] }, { shape: { type: "sphere", radius: 0.018 }, position: [0.08,0.9,0.03] }
    ],
    function: "Filter lymph and coordinate immune-cell activation against pathogens and abnormal cells.",
    clinicalNote: "Assess lymphadenopathy for site, size, tenderness, mobility and duration; combine with infection and malignancy red flags." },
  { id: "lymph_vessels", name: "Lymphatic Vessels", system: "lymphatic", genders: "both", color: 0xd6aa58,
    parts: [
      { shape: { type: "tube", radius: 0.0045, points: [[0,0.88,0.05],[0.02,1.08,0.05],[0.01,1.3,0.05],[0,1.5,0.05]] } },
      { shape: { type: "tube", radius: 0.0035, points: [[0.08,0.22,0.05],[0.08,0.62,0.05],[0.06,0.88,0.05],[0,1.02,0.05]] } },
      { shape: { type: "tube", radius: 0.0035, points: [[-0.08,0.22,0.05],[-0.08,0.62,0.05],[-0.06,0.88,0.05],[0,1.02,0.05]] } },
      { shape: { type: "tube", radius: 0.0035, points: [[0.22,1.12,0.05],[0.15,1.33,0.05],[0.06,1.42,0.05],[0,1.45,0.05]] } },
      { shape: { type: "tube", radius: 0.0035, points: [[-0.22,1.12,0.05],[-0.15,1.33,0.05],[-0.06,1.42,0.05],[0,1.45,0.05]] } }
    ],
    function: "A one-way translucent vessel network returns interstitial fluid to the circulation and transports immune cells.",
    clinicalNote: "Impaired drainage causes lymphoedema; assess swelling, skin integrity, infection and limb measurements." },
];

// Canonical placement atlas. Every visible body part is regenerated from this
// shared coordinate system so systems remain aligned when layers are toggled.
// Coordinates use anatomical position: patient-left = -X, superior = +Y,
// anterior = +Z. The right kidney sits lower than the left because of the liver.
const ANATOMICAL_ATLAS = {
  skull: { position: [0, 1.64, 0], scale: [0.9, 0.9, 0.94] },
  spine_bone: { position: [0, 1.235, -0.06] },
  ribcage: { parts: [
    { shape: { type: "torus", radius: 0.125, tube: 0.009, arc: Math.PI * 0.82, radialSegments: 8, tubularSegments: 24 }, position: [0, 1.20, -0.018], rotation: [Math.PI / 2, 0, -Math.PI / 2 + 0.08] },
    { shape: { type: "torus", radius: 0.138, tube: 0.009, arc: Math.PI * 0.82, radialSegments: 8, tubularSegments: 24 }, position: [0, 1.26, -0.018], rotation: [Math.PI / 2, 0, -Math.PI / 2 + 0.08] },
    { shape: { type: "torus", radius: 0.148, tube: 0.009, arc: Math.PI * 0.82, radialSegments: 8, tubularSegments: 24 }, position: [0, 1.32, -0.018], rotation: [Math.PI / 2, 0, -Math.PI / 2 + 0.08] },
    { shape: { type: "torus", radius: 0.15, tube: 0.009, arc: Math.PI * 0.82, radialSegments: 8, tubularSegments: 24 }, position: [0, 1.38, -0.018], rotation: [Math.PI / 2, 0, -Math.PI / 2 + 0.08] },
    { shape: { type: "torus", radius: 0.142, tube: 0.009, arc: Math.PI * 0.82, radialSegments: 8, tubularSegments: 24 }, position: [0, 1.44, -0.018], rotation: [Math.PI / 2, 0, -Math.PI / 2 + 0.08] },
  ] },
  pelvis: { shape: { type: "torus", radius: 0.058, tube: 0.026, radialSegments: 12, tubularSegments: 28 }, position: [0, 0.895, -0.015], rotation: [Math.PI / 2, 0, 0] },
  femurs: { parts: [
    // Femora and tibiae/fibulae follow the centres of the two leg shells.
    { shape: { type: "capsule", radius: 0.023, length: 0.34 }, position: [-0.065, 0.66, -0.005] },
    { shape: { type: "capsule", radius: 0.023, length: 0.34 }, position: [0.065, 0.66, -0.005] },
    { shape: { type: "capsule", radius: 0.018, length: 0.32 }, position: [-0.065, 0.30, -0.005] },
    { shape: { type: "capsule", radius: 0.018, length: 0.32 }, position: [0.065, 0.30, -0.005] },
    // Humeri and forearm bones remain centred inside the angled arm shells.
    { shape: { type: "capsule", radius: 0.015, length: 0.25 }, position: [-0.185, 1.29, -0.005], rotation: [0,0,-0.16] },
    { shape: { type: "capsule", radius: 0.015, length: 0.25 }, position: [0.185, 1.29, -0.005], rotation: [0,0,0.16] },
    { shape: { type: "capsule", radius: 0.012, length: 0.22 }, position: [-0.215, 1.05, -0.005], rotation: [0,0,-0.16] },
    { shape: { type: "capsule", radius: 0.012, length: 0.22 }, position: [0.215, 1.05, -0.005], rotation: [0,0,0.16] },
  ] },

  brain: { position: [0, 1.642, 0], scale: [0.92, 0.85, 0.92] },
  cerebellum: { position: [0, 1.595, -0.035] },
  spinal_cord: { position: [0, 1.235, -0.078] },
  peripheral_nerves: { parts: [
    { shape: { type: "tube", radius: 0.0035, points: [[0,1.47,-0.06],[0.075,1.40,-0.035],[0.14,1.30,-0.015],[0.18,1.12,0]] } },
    { shape: { type: "tube", radius: 0.0035, points: [[0,1.47,-0.06],[-0.075,1.40,-0.035],[-0.14,1.30,-0.015],[-0.18,1.12,0]] } },
    { shape: { type: "tube", radius: 0.004, points: [[0,1.05,-0.065],[0.05,0.88,-0.03],[0.062,0.66,0],[0.062,0.30,0]] } },
    { shape: { type: "tube", radius: 0.004, points: [[0,1.05,-0.065],[-0.05,0.88,-0.03],[-0.062,0.66,0],[-0.062,0.30,0]] } },
  ] },

  trachea: { position: [0, 1.485, 0.025] },
  lungs: { parts: [
    { shape: { type: "sphere", radius: 0.071, scale: [0.78, 1.52, 0.88] }, position: [-0.092, 1.315, 0.012] },
    { shape: { type: "sphere", radius: 0.076, scale: [0.84, 1.58, 0.92] }, position: [0.094, 1.31, 0.012] },
  ] },
  diaphragm: { position: [0, 1.145, -0.005], scale: [1.2, 0.22, 0.85] },

  heart: { position: [-0.032, 1.285, 0.052], rotation: [0, 0, -0.18], scale: [0.9, 1, 0.76] },
  coronary_vessels: { parts: [
    { shape: { type: "tube", radius: 0.0032, points: [[-0.015,1.35,0.075],[-0.05,1.31,0.088],[-0.055,1.25,0.075],[-0.035,1.21,0.06]] } },
    { shape: { type: "tube", radius: 0.0028, points: [[-0.015,1.35,0.072],[0.012,1.31,0.084],[0.018,1.25,0.072],[0.0,1.22,0.06]] } },
  ] },
  aorta: { shape: { type: "tube", radius: 0.014, points: [[-0.02,1.27,0.03],[-0.015,1.37,0.015],[0.0,1.415,-0.01],[0.02,1.405,-0.025],[0.025,1.33,-0.035],[0.025,1.16,-0.04],[0.022,0.95,-0.038]] } },
  vena_cava: { shape: { type: "tube", radius: 0.016, points: [[0.025,1.46,-0.035],[0.025,1.30,-0.035],[0.026,1.16,-0.04],[0.022,0.95,-0.035],[0.01,0.88,-0.02]] } },
  arterial_tree: { parts: [
    // Subclavian/axillary arteries — to shoulder only, within deltoid/upper arm
    { shape: { type: "tube", radius: 0.007, points: [[0,1.41,-0.01],[0.05,1.39,0],[0.09,1.35,0],[0.12,1.30,0],[0.13,1.25,0]] } },
    { shape: { type: "tube", radius: 0.007, points: [[0,1.41,-0.01],[-0.05,1.39,0],[-0.09,1.35,0],[-0.12,1.30,0],[-0.13,1.25,0]] } },
    // Common iliac / femoral arteries — down medial thigh, stop mid-thigh
    { shape: { type: "tube", radius: 0.008, points: [[0.022,0.95,-0.038],[0.045,0.84,0],[0.05,0.70,0],[0.045,0.55,0],[0.04,0.5,0]] } },
    { shape: { type: "tube", radius: 0.008, points: [[0.022,0.95,-0.038],[-0.045,0.84,0],[-0.05,0.70,0],[-0.045,0.55,0],[-0.04,0.5,0]] } },
    // Pulmonary arteries — from pulmonary trunk into each lung hilum
    { shape: { type: "tube", radius: 0.006, points: [[-0.005,1.29,0.045],[0.03,1.295,0.035],[0.07,1.31,0.025],[0.085,1.315,0.018]] } },
    { shape: { type: "tube", radius: 0.006, points: [[-0.005,1.29,0.045],[-0.03,1.295,0.035],[-0.07,1.31,0.025],[-0.082,1.315,0.018]] } },
    // Carotid arteries — neck to head
    { shape: { type: "tube", radius: 0.0045, points: [[0,1.41,-0.01],[0,1.52,0],[0,1.58,0]] } },
  ] },
  venous_tree: { parts: [
    // Subclavian/axillary veins — from shoulder to superior vena cava
    { shape: { type: "tube", radius: 0.0065, points: [[0.13,1.25,0.02],[0.10,1.31,0.015],[0.06,1.38,-0.005],[0.025,1.4,-0.03]] } },
    { shape: { type: "tube", radius: 0.0065, points: [[-0.13,1.25,0.02],[-0.10,1.31,0.015],[-0.06,1.38,-0.005],[0.025,1.4,-0.03]] } },
    // Femoral veins — up medial thigh to iliac/IVC
    { shape: { type: "tube", radius: 0.0075, points: [[0.04,0.5,0.02],[0.045,0.55,0.015],[0.05,0.70,0.01],[0.045,0.84,-0.005],[0.022,0.95,-0.035]] } },
    { shape: { type: "tube", radius: 0.0075, points: [[-0.04,0.5,0.02],[-0.045,0.55,0.015],[-0.05,0.70,0.01],[-0.045,0.84,-0.005],[0.022,0.95,-0.035]] } },
    // Pulmonary veins — from each lung hilum back to left atrium
    { shape: { type: "tube", radius: 0.0055, points: [[0.085,1.315,0.018],[0.05,1.305,0.03],[0.0,1.29,0.045]] } },
    { shape: { type: "tube", radius: 0.0055, points: [[-0.082,1.315,0.018],[-0.05,1.305,0.03],[0.0,1.29,0.045]] } },
  ] },

  esophagus: { position: [0, 1.34, -0.052] },
  stomach: { position: [-0.065, 1.085, 0.015], rotation: [0, 0, 0.25] },
  liver: { position: [0.055, 1.115, 0.018], rotation: [0, 0, -0.08], scale: [0.82, 0.9, 0.82] },
  gallbladder: { position: [0.092, 1.075, 0.035] },
  pancreas: { position: [-0.005, 1.065, -0.045], rotation: [0, 0, Math.PI / 2] },
  spleen: { position: [-0.098, 1.115, -0.03], scale: [0.68, 1.2, 0.68] },
  small_intestine: { position: [0, 0.97, 0.018], scale: [1.25, 0.88, 0.78] },
  large_intestine: { shape: { type: "tube", radius: 0.018, points: [[0.09,0.9,0.02],[0.09,1.06,0.02],[0.05,1.105,0.02],[-0.05,1.105,0.02],[-0.09,1.06,0.02],[-0.09,0.9,0.02],[-0.05,0.865,0.015],[0,0.85,0.01]] } },

  kidneys: { parts: [
    { shape: { type: "sphere", radius: 0.04, scale: [0.72,1.12,0.8] }, position: [-0.09, 1.055, -0.075] },
    { shape: { type: "sphere", radius: 0.04, scale: [0.72,1.12,0.8] }, position: [0.09, 1.025, -0.075] },
  ] },
  ureters: { parts: [
    { shape: { type: "tube", radius: 0.0045, points: [[-0.09,1.02,-0.07],[-0.065,0.95,-0.055],[-0.025,0.875,0.005]] } },
    { shape: { type: "tube", radius: 0.0045, points: [[0.09,0.99,-0.07],[0.065,0.94,-0.055],[0.025,0.875,0.005]] } },
  ] },
  bladder: { position: [0, 0.855, 0.035] },

  thyroid: { position: [0, 1.505, 0.032] },
  pancreas_endocrine: { position: [-0.005, 1.065, -0.042], rotation: [0, 0, Math.PI / 2] },
  adrenal_glands: { parts: [
    { shape: { type: "sphere", radius: 0.016, scale: [1,0.65,0.8] }, position: [-0.09,1.105,-0.07] },
    { shape: { type: "sphere", radius: 0.016, scale: [1,0.65,0.8] }, position: [0.09,1.075,-0.07] },
  ] },

  prostate: { position: [0, 0.805, 0.018] },
  testes: { parts: [
    { shape: { type: "sphere", radius: 0.024 }, position: [-0.025, 0.69, 0.045] },
    { shape: { type: "sphere", radius: 0.024 }, position: [0.025, 0.69, 0.045] },
  ] },
  penis: { position: [0, 0.73, 0.06], rotation: [0.3, 0, 0] },
  ovaries: { parts: [
    { shape: { type: "sphere", radius: 0.018, scale: [1.15,0.72,0.9] }, position: [-0.06, 0.89, -0.005] },
    { shape: { type: "sphere", radius: 0.018, scale: [1.15,0.72,0.9] }, position: [0.06, 0.89, -0.005] },
  ] },
  uterus: { position: [0, 0.855, -0.005] },
  fallopian: { parts: [
    { shape: { type: "capsule", radius: 0.0045, length: 0.075 }, position: [-0.038, 0.89, -0.005], rotation: [0, 0, -0.48] },
    { shape: { type: "capsule", radius: 0.0045, length: 0.075 }, position: [0.038, 0.89, -0.005], rotation: [0, 0, 0.48] },
  ] },
  vagina: { position: [0, 0.78, 0.015] },

  skin: { position: [0, 1.18, 0], scale: [1.55, 3.3, 0.9] },
  major_muscles: { parts: [
    // Pectoralis major — anterior chest, kept inside the torso silhouette
    { shape: { type: "sphere", radius: 0.07, scale: [1.0,0.55,0.32] }, position: [-0.06,1.345,0.115] },
    { shape: { type: "sphere", radius: 0.07, scale: [1.0,0.55,0.32] }, position: [0.06,1.345,0.115] },
    // Deltoids — shoulder contour, pulled inboard so the cap stays within the arm shell
    { shape: { type: "sphere", radius: 0.046, scale: [1.0,0.85,0.85] }, position: [-0.15,1.395,0.01] },
    { shape: { type: "sphere", radius: 0.046, scale: [1.0,0.85,0.85] }, position: [0.15,1.395,0.01] },
    // Rectus abdominis — anterior abdominal wall, tucked behind the torso surface
    { shape: { type: "capsule", radius: 0.034, length: 0.26 }, position: [0,1.12,0.072] },
    // External obliques — flanks, narrowed to the waist radius
    { shape: { type: "sphere", radius: 0.05, scale: [0.7,0.95,0.5] }, position: [-0.078,1.12,0.055] },
    { shape: { type: "sphere", radius: 0.05, scale: [0.7,0.95,0.5] }, position: [0.078,1.12,0.055] },
    // Quadriceps — anterior thigh, centred in the leg envelope
    { shape: { type: "capsule", radius: 0.043, length: 0.5 }, position: [-0.062,0.55,0.0] },
    { shape: { type: "capsule", radius: 0.043, length: 0.5 }, position: [0.062,0.55,0.0] },
    // Hamstring/calf groups — centred within each leg envelope
    { shape: { type: "capsule", radius: 0.035, length: 0.28 }, position: [-0.062,0.28,0.0] },
    { shape: { type: "capsule", radius: 0.035, length: 0.28 }, position: [0.062,0.28,0.0] },
    // Biceps and forearm flexor groups — aligned to the arm shells
    { shape: { type: "capsule", radius: 0.028, length: 0.24 }, position: [-0.185,1.29,0.005], rotation: [0,0,-0.16] },
    { shape: { type: "capsule", radius: 0.028, length: 0.24 }, position: [0.185,1.29,0.005], rotation: [0,0,0.16] },
    { shape: { type: "capsule", radius: 0.022, length: 0.20 }, position: [-0.215,1.06,0.005], rotation: [0,0,-0.16] },
    { shape: { type: "capsule", radius: 0.022, length: 0.20 }, position: [0.215,1.06,0.005], rotation: [0,0,0.16] },
  ] },

  lymph_nodes: { parts: [
    { shape: { type: "sphere", radius: 0.012 }, position: [-0.055,1.48,0.02] },
    { shape: { type: "sphere", radius: 0.012 }, position: [0.055,1.48,0.02] },
    { shape: { type: "sphere", radius: 0.014 }, position: [-0.135,1.36,0.02] },
    { shape: { type: "sphere", radius: 0.014 }, position: [0.135,1.36,0.02] },
    { shape: { type: "sphere", radius: 0.014 }, position: [-0.075,0.89,0.015] },
    { shape: { type: "sphere", radius: 0.014 }, position: [0.075,0.89,0.015] },
  ] },
  lymph_vessels: { parts: [
    { shape: { type: "tube", radius: 0.004, points: [[0,0.87,0.025],[0.015,1.08,0.015],[0.01,1.31,0.01],[0,1.49,0.01]] } },
    { shape: { type: "tube", radius: 0.003, points: [[0.075,0.2,0.025],[0.075,0.62,0.02],[0.055,0.87,0.02],[0,1.0,0.02]] } },
    { shape: { type: "tube", radius: 0.003, points: [[-0.075,0.2,0.025],[-0.075,0.62,0.02],[-0.055,0.87,0.02],[0,1.0,0.02]] } },
    { shape: { type: "tube", radius: 0.003, points: [[0.31,1.12,0.03],[0.22,1.29,0.025],[0.12,1.4,0.02],[0,1.45,0.015]] } },
    { shape: { type: "tube", radius: 0.003, points: [[-0.31,1.12,0.03],[-0.22,1.29,0.025],[-0.12,1.4,0.02],[0,1.45,0.015]] } },
  ] },
};

const clonePart = (part) => ({
  ...part,
  shape: part.shape ? { ...part.shape, points: part.shape.points?.map((point) => [...point]) } : undefined,
  position: part.position ? [...part.position] : undefined,
  rotation: part.rotation ? [...part.rotation] : undefined,
  // Some legacy primitives stored scale inside shape; promote it so the
  // renderer applies it consistently to every regenerated mesh.
  scale: part.scale ? [...part.scale] : part.shape?.scale ? [...part.shape.scale] : undefined,
});

function regenerateStructure(blueprint) {
  const placement = ANATOMICAL_ATLAS[blueprint.id];
  if (!placement) throw new Error(`Missing canonical anatomical placement for ${blueprint.id}`);
  const regenerated = {
    ...blueprint,
    ...placement,
    shape: placement.shape ? clonePart({ shape: placement.shape }).shape : blueprint.shape ? clonePart({ shape: blueprint.shape }).shape : undefined,
    parts: placement.parts ? placement.parts.map(clonePart) : undefined,
    position: placement.position ? [...placement.position] : undefined,
    rotation: placement.rotation ? [...placement.rotation] : undefined,
    scale: placement.scale ? [...placement.scale] : blueprint.scale ? [...blueprint.scale] : undefined,
  };
  return regenerated;
}

export const ANATOMY_STRUCTURES = STRUCTURE_BLUEPRINTS.map(regenerateStructure);