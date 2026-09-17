const ROLE_LABELS = {
  student: "student",
  tutor: "tutor",
  admin: "administrator",
  super_admin: "administrator",
  guest: "learner",
};

const STAFF_ROLES = new Set(["tutor", "admin", "super_admin"]);

export const PATHFINDER_AI_IDENTITY = {
  shortName: "PATHFINDER AI",
  fullName: "Pathfinder Clinical AI",
  title: "T Level Health clinical learning companion",
};

function normaliseIdentityText(user) {
  return [
    user?.full_name,
    user?.username,
    user?.email,
    user?.title,
    user?.department,
    user?.organisation,
    user?.organization,
  ].filter(Boolean).join(" ").toLowerCase();
}

function hasName(user, expected) {
  const firstName = user?.full_name?.trim().split(/\s+/)[0]?.toLowerCase();
  const username = user?.username?.trim().toLowerCase().split(/[.@_-]/)[0];
  return firstName === expected || username === expected;
}

/**
 * Recognition personalises the experience only. Authorisation continues to be
 * determined independently by the verified application role.
 */
export function getUserRecognition(user) {
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || "there";
  const role = user?.role || "student";
  const isStaff = STAFF_ROLES.has(role);
  const identityText = normaliseIdentityText(user);

  if (isStaff && hasName(user, "lee")) {
    return {
      key: "lee",
      firstName,
      roleTitle: "System Architect & Lead Clinical Educator",
      greeting: "Systems nominal. Welcome back, Lee. The digital ward is ready. Would you like to review the latest clinical simulation analytics or modify the current environment parameters?",
      focus: "simulation analytics, environment parameters and T Level Health curriculum deployment",
    };
  }
  if (isStaff && hasName(user, "jon")) {
    return {
      key: "jon",
      firstName,
      roleTitle: "T Level Curriculum Team Leader",
      greeting: "Good day, Jon. Welcome to the simulation suite. The current clinical scenarios are ready and aligned with our curriculum objectives. I can provide an overview of student progression and module outcomes.",
      focus: "student progression, curriculum alignment and module outcomes",
    };
  }
  if (isStaff && hasName(user, "sam")) {
    return {
      key: "sam",
      firstName,
      roleTitle: "Head of Curriculum & Deputy Head of Campus",
      greeting: "Welcome, Sam. The digital ward is fully operational and ready to facilitate hands-on practical skills assessment. I can provide a high-level summary of curriculum quality and departmental outcomes.",
      focus: "curriculum quality, campus operations and departmental outcomes",
    };
  }
  if (isStaff && hasName(user, "stacey")) {
    return {
      key: "stacey",
      firstName,
      roleTitle: "Head of Campus",
      greeting: "Good day, Stacey. Welcome to the clinical simulation suite. It is a pleasure to have you on the ward today. All systems are optimised and actively supporting our students' industry readiness.",
      focus: "operational excellence, learner outcomes and industry readiness",
    };
  }
  if (identityText.includes("ofsted")) {
    return {
      key: "ofsted",
      firstName,
      roleTitle: "Ofsted Inspector · Special Guest",
      greeting: "Welcome to our clinical simulation environment. I am the Pathfinder AI Clinical Educator. Here, we bridge classroom theory and real-world practice through hands-on clinical scenarios that support workplace readiness. Please feel free to observe the live learning environment, and I can demonstrate its educational capabilities.",
      focus: "quality of education, transparent observation and workplace readiness",
    };
  }

  const roleTitle = role === "student" ? "Student" : role === "tutor" ? "Tutor" : role === "guest" ? "Learner" : "Institution Administrator";
  return {
    key: "standard",
    firstName,
    roleTitle,
    greeting: `Welcome, ${firstName}. I'm the Pathfinder AI Clinical Educator. Your clinical learning environment is ready. I can help you prepare for your next task, practise a skill or explore a patient scenario.`,
    focus: "the user's upcoming clinical learning tasks",
  };
}

export function getAssistantIdentity(_prefs, user) {
  const recognition = getUserRecognition(user);
  const roleLabel = ROLE_LABELS[user?.role] || "student";
  const controls = "Tap the microphone for voice input, and use the mute or stop controls to manage speech.";
  return {
    ...PATHFINDER_AI_IDENTITY,
    ...recognition,
    roleLabel,
    intro: `${recognition.greeting} ${controls}`,
  };
}
