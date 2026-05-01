export const API_BASE = 'http://localhost:8000';

export async function callApi(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function jdTranslate(jdText) {
  // The main /api/jd-translate now returns structured JSON
  return callApi('/api/jd-translate', { jd_text: jdText });
}

export async function skillRadar(skills, targetJob) {
  return callApi('/api/skill-radar', { skills, target_job: targetJob });
}

export async function jdFromImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/jd-from-image`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}
