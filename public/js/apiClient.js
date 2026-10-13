export async function getHealthStatus() {
  const response = await fetch("/api/health");

  if (!response.ok) {
    throw new Error("No se pudo contactar con el servidor");
  }

  return response.json();
}