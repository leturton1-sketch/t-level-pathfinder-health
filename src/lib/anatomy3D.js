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
export const ANATOMY_STRUCTURES = [
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
  { id: "femurs", name: "Femurs", system: "skeletal", genders: "both",
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
  { id: "major_muscles", name: "Major Torso & Leg Muscle Groups", system: "muscular", genders: "both",
    parts: [
      { shape: { type: "sphere", radius: 0.075, scale: [1.15,0.62,0.42] }, position: [0.075,1.36,0.055] },
      { shape: { type: "sphere", radius: 0.075, scale: [1.15,0.62,0.42] }, position: [-0.075,1.36,0.055] },
      { shape: { type: "capsule", radius: 0.048, length: 0.24 }, position: [0,1.135,0.045] },
      { shape: { type: "capsule", radius: 0.052, length: 0.59 }, position: [0.075,0.52,0] },
      { shape: { type: "capsule", radius: 0.052, length: 0.59 }, position: [-0.075,0.52,0] }
    ],
    function: "Skeletal muscles generate movement, stabilise joints, maintain posture and produce heat through contraction.",
    clinicalNote: "Assess strength, tone, range of movement and pain. Immobility rapidly causes deconditioning and venous stasis." },
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