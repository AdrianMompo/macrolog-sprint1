import { getSession } from "./apiClient.js";

export function destinationForUser(user) {
  return user.role === "admin"
    ? "/admin.html"
    : "/dashboard.html";
}

export async function redirectIfAuthenticated() {
  try {
    const session = await getSession();

    if (session.authenticated) {
      window.location.replace(destinationForUser(session.user));
    }
  } catch {
    // La página seguirá mostrándose si el servidor no está disponible.
  }
}

export async function requireUser(requiredRole = null) {
  try {
    const session = await getSession();

    if (!session.authenticated) {
      window.location.replace("/login.html");
      return null;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      window.location.replace("/dashboard.html");
      return null;
    }

    return session.user;
  } catch {
    window.location.replace("/login.html");
    return null;
  }
}