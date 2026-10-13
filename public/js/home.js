import { getHealthStatus } from "./apiClient.js";

const statusElement = document.querySelector("#api-status");

async function showServerStatus() {
  try {
    const result = await getHealthStatus();
    statusElement.textContent =
      result.status === "ok" ? "Servidor conectado" : "Estado desconocido";
    statusElement.classList.add("status-ok");
  } catch (error) {
    statusElement.textContent = "Servidor no disponible";
    statusElement.classList.add("status-error");
  }
}

showServerStatus();