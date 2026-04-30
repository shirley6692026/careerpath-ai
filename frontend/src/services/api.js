const API_BASE = 'http://localhost:8000';

export async function callApi(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function jdTranslate(jdText) {
  return callApi('/api/jd-translate-structured', { jd_text: jdText });
}

export async function skillRadar(skills, targetJob) {
  return callApi('/api/skill-radar-structured', { skills, target_job: targetJob });
}
