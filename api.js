const API_URL = "https://backend-ibl0.onrender.com";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Error HTTP ${response.status}`);
  }

  return data;
}

export async function loginTeacher(email, password) {
  return request("/teacher/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function getTeacher(token) {
  return request("/teacher/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getQuestions(token) {
  return request("/questions", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function createRoom(token) {
  return request("/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getRooms(token) {
  return request("/rooms", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getRoom(code) {
  return request(`/rooms/${encodeURIComponent(code)}`);
}

export async function joinRoom(code, name) {
  return request(`/rooms/${encodeURIComponent(code)}/join`, {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export async function getRoomQuestions(code, token) {
  return request(`/rooms/${encodeURIComponent(code)}/questions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function submitAnswer(code, token, questionId, selectedIndex) {
  return request(`/rooms/${encodeURIComponent(code)}/answer`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ questionId, selectedIndex })
  });
}

export async function getLeaderboard(code, token) {
  return request(`/rooms/${encodeURIComponent(code)}/leaderboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function closeRoom(code, token) {
  return request(`/rooms/${encodeURIComponent(code)}/close`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
}
