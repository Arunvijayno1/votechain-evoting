const COSINE_THRESHOLD    = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD) || 0.75;
const EUCLIDEAN_THRESHOLD = parseFloat(process.env.FACE_EUCLIDEAN_THRESHOLD)  || 0.5;

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  const m = Math.sqrt(na) * Math.sqrt(nb);
  return m === 0 ? 0 : dot / m;
}

function euclideanDistance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.pow(a[i]-b[i], 2);
  return Math.sqrt(s);
}

/** Dual-gate: both cosine AND euclidean must pass */
function verifyFace(stored, captured) {
  const cos  = cosineSimilarity(stored, captured);
  const euc  = euclideanDistance(stored, captured);
  const verified = cos >= COSINE_THRESHOLD && euc <= EUCLIDEAN_THRESHOLD;
  return {
    verified,
    similarity: parseFloat(cos.toFixed(4)),
    euclidean:  parseFloat(euc.toFixed(4)),
    threshold:  COSINE_THRESHOLD,
    reason: verified ? 'Match' :
      cos < COSINE_THRESHOLD
        ? `Similarity ${(cos*100).toFixed(1)}% < ${COSINE_THRESHOLD*100}% required`
        : `Distance ${euc.toFixed(2)} > ${EUCLIDEAN_THRESHOLD} limit`,
  };
}

/** Check if new face already belongs to another account */
function findDuplicateFace(newEmb, voters) {
  for (const v of voters) {
    if (!v.faceEmbedding || !v.faceRegistered) continue;
    const cos = cosineSimilarity(newEmb, v.faceEmbedding);
    const euc = euclideanDistance(newEmb, v.faceEmbedding);
    if (cos >= 0.82 && euc <= 0.35) return { duplicate: true, voter: v };
  }
  return { duplicate: false };
}

function validateEmbedding(e) {
  return Array.isArray(e) && e.length === 128 && e.every(v => typeof v === 'number' && isFinite(v));
}

module.exports = { verifyFace, findDuplicateFace, validateEmbedding, COSINE_THRESHOLD };
