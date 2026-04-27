function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

export function computeCompletenessScore(payload = {}) {
  const keys = [
    "childName",
    "age",
    "gender",
    "heightCm",
    "weightKg",
    "eyeColor",
    "hairColor",
    "clothesTop",
    "clothesBottom",
    "shoes",
    "description",
    "lastSeenLocation",
    "latitude",
    "longitude",
    "missingSince",
    "photoUrl",
  ];

  const filled = keys.filter((k) => String(payload[k] ?? "").trim() !== "").length;
  return clamp((filled / keys.length) * 100);
}

export function computeFalseInfoScore(payload = {}) {
  let risk = 45;
  const textLen = String(payload.description || "").trim().length;

  if (textLen > 60) risk -= 12;
  if (payload.photoUrl) risk -= 10;
  if (payload.latitude && payload.longitude) risk -= 8;
  if (payload.heightCm && payload.weightKg) risk -= 6;
  if (payload.distinctiveSigns) risk -= 4;

  if (payload.missingSince) {
    const mins = (Date.now() - new Date(payload.missingSince).getTime()) / 60000;
    if (mins < 30) risk += 8;
    else if (mins < 180) risk += 3;
  }

  return clamp(risk);
}

export function computePriorityScore(payload = {}) {
  const mins = payload.missingSince
    ? (Date.now() - new Date(payload.missingSince).getTime()) / 60000
    : 120;

  let score = 50;
  const age = Number(payload.age || 10);

  if (age <= 6) score += 18;
  else if (age <= 12) score += 12;
  else score += 6;

  if (mins <= 60) score += 18;
  else if (mins <= 180) score += 14;
  else if (mins <= 720) score += 9;

  score += Number(payload.radius || 2500) <= 1500 ? 8 : 4;
  score += computeCompletenessScore(payload) * 0.12;
  score -= computeFalseInfoScore(payload) * 0.12;

  return clamp(score);
}

export function explainScores(payload = {}) {
  return {
    priority:
      "La priorité augmente quand la disparition est récente, que la personne est jeune, que la localisation est précise et que le dossier est complet.",
    falseInfo:
      "Le risque de mauvaise information baisse quand il y a photo, GPS, description détaillée, taille/poids, signes distinctifs et un historique cohérent.",
    faceRecognition:
      "La reconnaissance faciale compare la photo de référence aux photos des signalements via le service IA FastAPI. Le score retourné n'est qu'une aide à la décision et doit être revu par un humain.",
  };
}