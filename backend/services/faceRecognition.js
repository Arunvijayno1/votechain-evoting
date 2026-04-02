/**
 * Face Recognition Service — STRICT MODE
 * 
 * Problem fixed: threshold raised to 0.75 (was 0.6 — too permissive, any similar face passed)
 * Euclidean distance used alongside cosine similarity for double-check
 * One face registration per verified email — duplicate face detection
 */

const COSINE_THRESHOLD   = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD) || 0.75;
const EUCLIDEAN_THRESHOLD = parseFloat(process.env.FACE_EUCLIDEAN_THRESHOLD)  || 0.5;

/** Cosine similarity — higher = more similar */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) throw new Error('Invalid embeddings');
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  const mag = Math.sqrt(na) * Math.sqrt(nb);
  return mag === 0 ? 0 : dot / mag;
}

/** Euclidean distance — lower = more similar */
function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) throw new Error('Invalid embeddings');
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.pow(a[i] - b[i], 2);
  return Math.sqrt(sum);
}

/**
 * Strict face verification — BOTH cosine AND euclidean must pass
 * This prevents different-person matches that cosine alone allows
 */
function verifyFace(storedEmbedding, capturedEmbedding) {
  const cosine    = cosineSimilarity(storedEmbedding, capturedEmbedding);
  const euclidean = euclideanDistance(storedEmbedding, capturedEmbedding);

  // BOTH checks must pass — dual-gate security
  const cosinePass    = cosine    >= COSINE_THRESHOLD;
  const euclideanPass = euclidean <= EUCLIDEAN_THRESHOLD;
  const verified      = cosinePass && euclideanPass;

  return {
    verified,
    cosine:     parseFloat(cosine.toFixed(4)),
    euclidean:  parseFloat(euclidean.toFixed(4)),
    similarity: parseFloat(cosine.toFixed(4)), // alias for API compat
    threshold:  COSINE_THRESHOLD,
    reason:     !verified
      ? !cosinePass
        ? `Cosine similarity ${cosine.toFixed(3)} < ${COSINE_THRESHOLD} threshold`
        : `Euclidean distance ${euclidean.toFixed(3)} > ${EUCLIDEAN_THRESHOLD} threshold`
      : 'Match',
  };
}

/**
 * Check if a new face is TOO SIMILAR to any existing registered face.
 * Prevents creating multiple accounts with the same face.
 * Returns the matching voter if duplicate found.
 */
function findDuplicateFace(newEmbedding, existingVoters) {
  for (const voter of existingVoters) {
    if (!voter.faceEmbedding || !voter.faceRegistered) continue;
    const cosine    = cosineSimilarity(newEmbedding, voter.faceEmbedding);
    const euclidean = euclideanDistance(newEmbedding, voter.faceEmbedding);
    if (cosine >= 0.82 && euclidean <= 0.35) {
      return { duplicate: true, voter, cosine, euclidean };
    }
  }
  return { duplicate: false };
}

function validateEmbedding(embedding) {
  if (!Array.isArray(embedding))                                     return false;
  if (embedding.length !== 128)                                      return false;
  if (!embedding.every(v => typeof v === 'number' && isFinite(v))) return false;
  return true;
}

module.exports = {
  cosineSimilarity, euclideanDistance, verifyFace,
  findDuplicateFace, validateEmbedding,
  COSINE_THRESHOLD, EUCLIDEAN_THRESHOLD,
};
