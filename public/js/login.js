import { loginUser } from "./apiClient.js";
import {
  destinationForUser,
  redirectIfAuthenticated
} from "./session.js";

const form = document.querySelector("#login-form");
const message = document.querySelector("#form-message");
const successMessage =
  document.querySelector("#success-message");
const submitButton = document.querySelector("#submit-button");

const parameters = new URLSearchParams(window.location.search);

if (parameters.get("registered") === "true") {
  successMessage.textContent =
    "Cuenta creada correctamente. Ya puedes iniciar sesión.";
}

redirectIfAuthenticated();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const email = formData.get("email");
  const password = formData.get("password");

  message.textContent = "";
  message.className = "form-message";
  submitButton.disabled = true;
  submitButton.textContent = "Iniciando sesión...";

  try {
    const result = await loginUser(email, password);
    window.location.replace(destinationForUser(result.user));
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("form-message-error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Iniciar sesión";
  }
});