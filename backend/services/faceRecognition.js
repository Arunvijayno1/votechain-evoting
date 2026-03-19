/**
 * Face Recognition Service
 * 
 * Uses face-api.js (TensorFlow.js backend) for:
 * - Generating 128-dimensional face embedding vectors
 * - Comparing embeddings using cosine similarity
 * 
 * IMPORTANT: Raw images are NEVER stored. Only the embedding vector is persisted.
 * 
 * For production: run face-api.js in a separate Node.js process or use a Python
 * microservice with DeepFace/OpenCV for better accuracy.
 */

const SIMILARITY_THRESHOLD = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD) || 0.6;

/**
 * Compute cosine similarity between two embedding vectors.
 * 
 * Cosine similarity ranges from -1 to 1:
 *   1.0  = identical face
 *   >0.6 = same person (configurable threshold)
 *   <0.6 = different person
 * 
 * @param {number[]} embeddingA - 128-d vector
 * @param {number[]} embeddingB - 128-d vector
 * @returns {number} similarity score between 0 and 1
 */
function cosineSimilarity(embeddingA, embeddingB) {
  if (!embeddingA || !embeddingB || embeddingA.length !== embeddingB.length) {
    throw new Error('Invalid embeddings for comparison');
  }

  let dotProduct  = 0;
  let normA       = 0;
  let normB       = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    normA      += embeddingA[i] * embeddingA[i];
    normB      += embeddingB[i] * embeddingB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Verify if a live face embedding matches the stored embedding.
 * 
 * @param {number[]} storedEmbedding   - from MongoDB Voter record
 * @param {number[]} capturedEmbedding - from current webcam capture
 * @returns {{ verified: boolean, similarity: number, threshold: number }}
 */
function verifyFace(storedEmbedding, capturedEmbedding) {
  const similarity = cosineSimilarity(storedEmbedding, capturedEmbedding);
  return {
    verified   : similarity >= SIMILARITY_THRESHOLD,
    similarity : parseFloat(similarity.toFixed(4)),
    threshold  : SIMILARITY_THRESHOLD,
  };
}

/**
 * Validate that an embedding vector is structurally correct.
 * face-api.js produces 128-dimensional Float32 arrays.
 */
function validateEmbedding(embedding) {
  if (!Array.isArray(embedding)) return false;
  if (embedding.length !== 128) return false;
  if (!embedding.every(v => typeof v === 'number' && isFinite(v))) return false;
  return true;
}

/**
 * Instructions for the frontend face-api.js pipeline:
 * 
 * 1. Load models:
 *    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
 *    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
 *    await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
 * 
 * 2. Detect and embed from video element:
 *    const detections = await faceapi
 *      .detectSingleFace(videoEl)
 *      .withFaceLandmarks()
 *      .withFaceDescriptor()
 *    const embedding = Array.from(detections.descriptor) // 128-d Float32Array → Array
 * 
 * 3. Send embedding (not image) to backend API.
 */

module.exports = { cosineSimilarity, verifyFace, validateEmbedding, SIMILARITY_THRESHOLD };
