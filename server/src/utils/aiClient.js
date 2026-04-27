
import axios from 'axios';
const client = axios.create({ baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000', timeout: 120000 });
export async function verifyFace({ referenceImageUrl, candidateImageUrl }) {
  try {
    if (!referenceImageUrl || !candidateImageUrl) return { faceMatchScore: 0, aiConfidence: 0, provider: 'missing-images' };
    const { data } = await client.post('/face/verify', { reference_image_url: referenceImageUrl, candidate_image_url: candidateImageUrl });
    return data;
  } catch (error) {
    return { faceMatchScore: 0, aiConfidence: 0, provider: 'fallback', error: error.message };
  }
}
export async function analyzeText({ description, locationLabel }) {
  try {
    const { data } = await client.post('/risk/analyze', { description, location_label: locationLabel });
    return data;
  } catch {
    return { false_info_risk: 25, reasons: ['Service IA indisponible : fallback conservateur utilisé.'] };
  }
}
