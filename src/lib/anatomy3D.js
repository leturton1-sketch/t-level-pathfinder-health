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
  nervous:      { name: "Nervous System",   color: 0x6bbfe8, hex: "#6bbfe8", text: "text-sky-500", bg: "bg-sky-50", border: "border-sky-200" },
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
  // ── INTEGUMENTARY SYSTEM ──
  { id: "epidermis", name: "Epidermis", system: "integumentary", genders: "both", color: 0xf2b8a0,
    function: "Avascular stratified squamous epithelium forming the outermost protective layer. Keratinocytes mature outward from the basal layer; melanocytes deposit pigment for UV protection.",
    clinicalNote: "Inspect colour, integrity and moisture. Non-blanching erythema, blistering or abrasions indicate epidermal injury; track depth using the pressure ulcer grading tool." },
  { id: "dermis", name: "Dermis", system: "integumentary", genders: "both", color: 0xe8a08a,
    function: "Tough connective-tissue layer carrying blood vessels, nerve endings, hair follicles and glands. The papillary (superficial) and reticular (deep) regions give skin strength and elasticity.",
    clinicalNote: "Assess temperature, turgor and sensation. Reduced turgor suggests dehydration; loss of sensation over a pressure area demands offloading and pressure-relieving equipment." },
  { id: "hypodermis", name: "Hypodermis (Subcutis)", system: "integumentary", genders: "both", color: 0xf3c89a,
    function: "Subcutaneous fat and loose connective tissue anchoring skin to underlying fascia. It insulates, stores energy and cushions against mechanical stress.",
    clinicalNote: "Subcutaneous injections (insulin, LMWH) target this layer. Cachexia or a thin subcutis increases pressure injury risk over bony prominences." },
  { id: "hair", name: "Hair & Follicles", system: "integumentary", genders: "both", color: 0x6b4a2a,
    function: "Keratin filaments growing from follicles in the dermis, providing protection, warmth and sensory function. Distribution varies with sex and genetics.",
    clinicalNote: "Note hair loss, thinning or excess growth as markers of nutrition, endocrine change or chemotherapy. Avoid shaving before surgery where local policy permits." },
  { id: "nails", name: "Nails", system: "integumentary", genders: "both", color: 0xf3d9c8,
    function: "Keratin plates protecting the distal digits and aiding fine grasp and peripheral circulation assessment.",
    clinicalNote: "Inspect nail beds for colour, capillary refill and clubbing. Splinter haemorrhages, koilonychia or cyanosis signal systemic or vascular disease." },
  { id: "sweat_glands", name: "Sweat Glands", system: "integumentary", genders: "both", color: 0x9fd6e8,
    function: "Eccrine glands cool the body through thermoregulatory sweating across most of the skin; apocrine glands open into hair follicles in the axillae and groin.",
    clinicalNote: "Assess diaphoresis, dry skin and heat tolerance. Profuse sweating accompanies hypoglycaemia, sepsis, myocardial ischaemia and pain; dry skin suggests dehydration or hypothermia." },
  { id: "sebaceous_glands", name: "Sebaceous Glands", system: "integumentary", genders: "both", color: 0xf0d090,
    function: "Oil-producing glands opening into hair follicles that secrete sebum to lubricate skin and hair and support the acid mantle.",
    clinicalNote: "Excess sebum contributes to acne; reduced sebum causes dry, fragile skin in older adults. Gentle skin care and emollients protect the barrier." },
  { id: "sensory_receptors", name: "Sensory Receptors", system: "integumentary", genders: "both", color: 0xc9a0d6,
    function: "Meissner corpuscles detect light touch in the papillary dermis; Pacinian corpuscles sense deep pressure and vibration in the subcutis; free nerve endings signal pain and temperature.",
    clinicalNote: "Test sensation and proprioception in diabetes and neurological conditions. Loss of protective sensation over the foot drives foot-care education and pressure offloading." },

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
  // ── INTEGUMENTARY ── thin surface-conforming layers and appendages, kept
  // within the body envelope by keepGroupInsideBodyEnvelope.
  epidermis: { parts: [
    { shape: { type: "sphere", radius: 0.06 }, position: [0, 1.34, 0.108], scale: [1.7, 1.1, 0.16] },
    { shape: { type: "sphere", radius: 0.06 }, position: [0, 1.02, 0.10], scale: [1.6, 0.9, 0.16] },
    { shape: { type: "sphere", radius: 0.06 }, position: [0, 1.2, -0.078], scale: [1.6, 1.3, 0.16] },
    { shape: { type: "sphere", radius: 0.05 }, position: [0, 1.7, 0.0], scale: [1.4, 0.45, 1.05] },
    { shape: { type: "sphere", radius: 0.035 }, position: [0.21, 1.05, 0.02], scale: [1.0, 1.6, 0.28], rotation: [0, 0, -0.16] },
    { shape: { type: "sphere", radius: 0.035 }, position: [-0.21, 1.05, 0.02], scale: [1.0, 1.6, 0.28], rotation: [0, 0, 0.16] },
    { shape: { type: "sphere", radius: 0.04 }, position: [0.07, 0.5, 0.04], scale: [0.9, 1.5, 0.28] },
    { shape: { type: "sphere", radius: 0.04 }, position: [-0.07, 0.5, 0.04], scale: [0.9, 1.5, 0.28] },
  ] },
  dermis: { parts: [
    { shape: { type: "sphere", radius: 0.058 }, position: [0, 1.34, 0.092], scale: [1.6, 1.05, 0.18] },
    { shape: { type: "sphere", radius: 0.058 }, position: [0, 1.02, 0.086], scale: [1.5, 0.85, 0.18] },
    { shape: { type: "sphere", radius: 0.058 }, position: [0, 1.2, -0.064], scale: [1.5, 1.25, 0.18] },
    { shape: { type: "sphere", radius: 0.048 }, position: [0, 1.69, -0.01], scale: [1.32, 0.42, 1.0] },
    { shape: { type: "sphere", radius: 0.033 }, position: [0.21, 1.05, 0.005], scale: [0.95, 1.55, 0.32], rotation: [0, 0, -0.16] },
    { shape: { type: "sphere", radius: 0.033 }, position: [-0.21, 1.05, 0.005], scale: [0.95, 1.55, 0.32], rotation: [0, 0, 0.16] },
    { shape: { type: "sphere", radius: 0.038 }, position: [0.07, 0.5, 0.025], scale: [0.85, 1.45, 0.32] },
    { shape: { type: "sphere", radius: 0.038 }, position: [-0.07, 0.5, 0.025], scale: [0.85, 1.45, 0.32] },
  ] },
  hypodermis: { parts: [
    { shape: { type: "sphere", radius: 0.054 }, position: [0, 1.34, 0.072], scale: [1.45, 0.95, 0.2] },
    { shape: { type: "sphere", radius: 0.054 }, position: [0, 1.02, 0.068], scale: [1.35, 0.78, 0.2] },
    { shape: { type: "sphere", radius: 0.054 }, position: [0, 1.2, -0.046], scale: [1.35, 1.15, 0.2] },
    { shape: { type: "sphere", radius: 0.044 }, position: [0, 1.68, -0.025], scale: [1.2, 0.38, 0.9] },
    { shape: { type: "sphere", radius: 0.03 }, position: [0.2, 1.05, -0.012], scale: [0.85, 1.45, 0.36], rotation: [0, 0, -0.16] },
    { shape: { type: "sphere", radius: 0.03 }, position: [-0.2, 1.05, -0.012], scale: [0.85, 1.45, 0.36], rotation: [0, 0, 0.16] },
    { shape: { type: "sphere", radius: 0.034 }, position: [0.065, 0.5, 0.005], scale: [0.75, 1.3, 0.36] },
    { shape: { type: "sphere", radius: 0.034 }, position: [-0.065, 0.5, 0.005], scale: [0.75, 1.3, 0.36] },
  ] },
  hair: { parts: [
    { shape: { type: "capsule", radius: 0.0035, length: 0.05 }, position: [0.04, 1.72, 0.05], rotation: [0.3, 0, 0.1] },
    { shape: { type: "capsule", radius: 0.0035, length: 0.05 }, position: [-0.04, 1.72, 0.05], rotation: [0.3, 0, -0.1] },
    { shape: { type: "capsule", radius: 0.0035, length: 0.045 }, position: [0, 1.74, 0.0], rotation: [Math.PI / 2, 0, 0] },
    { shape: { type: "capsule", radius: 0.003, length: 0.03 }, position: [0.06, 1.68, 0.06], rotation: [0.4, 0, 0.2] },
    { shape: { type: "capsule", radius: 0.003, length: 0.03 }, position: [-0.06, 1.68, 0.06], rotation: [0.4, 0, -0.2] },
    { shape: { type: "capsule", radius: 0.0025, length: 0.025 }, position: [0.21, 1.0, 0.04], rotation: [0, 0, -0.16] },
    { shape: { type: "capsule", radius: 0.0025, length: 0.025 }, position: [-0.21, 1.0, 0.04], rotation: [0, 0, 0.16] },
  ] },
  nails: { parts: [
    { shape: { type: "sphere", radius: 0.012 }, position: [0.225, 0.85, 0.035], scale: [0.8, 0.5, 0.35] },
    { shape: { type: "sphere", radius: 0.012 }, position: [-0.225, 0.85, 0.035], scale: [0.8, 0.5, 0.35] },
    { shape: { type: "sphere", radius: 0.011 }, position: [0.075, 0.04, 0.05], scale: [0.85, 0.4, 0.4] },
    { shape: { type: "sphere", radius: 0.011 }, position: [-0.075, 0.04, 0.05], scale: [0.85, 0.4, 0.4] },
  ] },
  sweat_glands: { parts: [
    { shape: { type: "sphere", radius: 0.006 }, position: [0.22, 0.86, 0.04] },
    { shape: { type: "sphere", radius: 0.006 }, position: [0.2, 0.84, 0.05] },
    { shape: { type: "sphere", radius: 0.006 }, position: [-0.22, 0.86, 0.04] },
    { shape: { type: "sphere", radius: 0.006 }, position: [-0.2, 0.84, 0.05] },
    { shape: { type: "sphere", radius: 0.006 }, position: [0.07, 0.05, 0.06] },
    { shape: { type: "sphere", radius: 0.006 }, position: [0.05, 0.04, 0.07] },
    { shape: { type: "sphere", radius: 0.006 }, position: [-0.07, 0.05, 0.06] },
    { shape: { type: "sphere", radius: 0.006 }, position: [-0.05, 0.04, 0.07] },
    { shape: { type: "sphere", radius: 0.005 }, position: [0, 1.34, 0.12] },
    { shape: { type: "sphere", radius: 0.005 }, position: [0.06, 1.36, 0.115] },
    { shape: { type: "sphere", radius: 0.005 }, position: [-0.06, 1.36, 0.115] },
  ] },
  sebaceous_glands: { parts: [
    { shape: { type: "sphere", radius: 0.005 }, position: [0.04, 1.7, 0.06] },
    { shape: { type: "sphere", radius: 0.005 }, position: [-0.04, 1.7, 0.06] },
    { shape: { type: "sphere", radius: 0.005 }, position: [0, 1.72, 0.02] },
    { shape: { type: "sphere", radius: 0.005 }, position: [0.05, 1.62, 0.08] },
    { shape: { type: "sphere", radius: 0.005 }, position: [-0.05, 1.62, 0.08] },
    { shape: { type: "sphere", radius: 0.005 }, position: [0.06, 1.36, 0.118] },
    { shape: { type: "sphere", radius: 0.005 }, position: [-0.06, 1.36, 0.118] },
    { shape: { type: "sphere", radius: 0.004 }, position: [0.2, 1.02, 0.045] },
    { shape: { type: "sphere", radius: 0.004 }, position: [-0.2, 1.02, 0.045] },
  ] },
  sensory_receptors: { parts: [
    { shape: { type: "sphere", radius: 0.007 }, position: [0.225, 0.86, 0.03] },
    { shape: { type: "sphere", radius: 0.007 }, position: [-0.225, 0.86, 0.03] },
    { shape: { type: "sphere", radius: 0.006 }, position: [0.21, 0.9, 0.035] },
    { shape: { type: "sphere", radius: 0.006 }, position: [-0.21, 0.9, 0.035] },
    { shape: { type: "sphere", radius: 0.007 }, position: [0.075, 0.045, 0.055] },
    { shape: { type: "sphere", radius: 0.007 }, position: [-0.075, 0.045, 0.055] },
    { shape: { type: "sphere", radius: 0.006 }, position: [0.06, 1.34, 0.118] },
    { shape: { type: "sphere", radius: 0.006 }, position: [-0.06, 1.34, 0.118] },
  ] },

  trachea: { position: [0, 1.485, 0.025] },
  lungs: { parts: [
    { shape: { type: "sphere", radius: 0.071, scale: [0.78, 1.52, 0.88] }, position: [-0.092, 1.315, 0.012] },
    { shape: { type: "sphere", radius: 0.076, scale: [0.84, 1.58, 0.92] }, position: [0.094, 1.31, 0.012] },
  ] },
  diaphragm: { position: [0, 1.145, -0.005], scale: [1.2, 0.22, 0.85] },

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