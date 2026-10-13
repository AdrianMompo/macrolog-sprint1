async function apiRequest(path, options = {}) {
  const requestOptions = {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  };

  const response = await fetch(path, requestOptions);

  const data =
    response.status === 204
      ? null
      : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ?? "No se pudo completar la operación"
    );

    error.code = data?.error?.code ?? "UNKNOWN_ERROR";
    error.status = response.status;

    throw error;
  }

  return data;
}

export function getHealthStatus() {
  return apiRequest("/api/health");
}

export function registerUser(email, password) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function loginUser(email, password) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function getSession() {
  return apiRequest("/api/auth/session");
}

export function logoutUser() {
  return apiRequest("/api/auth/logout", {
    method: "POST"
  });
}

export function getUsers() {
  return apiRequest("/api/users");
}

export function checkUserActive(userId) {
  return apiRequest(`/api/users/${userId}/active`);
}

export function deleteUser(userId) {
  return apiRequest(`/api/users/${userId}`, {
    method: "DELETE"
  });
}