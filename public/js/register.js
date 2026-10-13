import { registerUser } from "./apiClient.js";
import { redirectIfAuthenticated } from "./session.js";

const form = document.querySelector("#register-form");
const message = document.querySelector("#form-message");
const submitButton = document.querySelector("#submit-button");

redirectIfAuthenticated();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const email = formData.get("email");
  const password = formData.get("password");
  const passwordConfirmation =
    formData.get("passwordConfirmation");

  message.textContent = "";
  message.className = "form-message";

  if (password !== passwordConfirmation) {
    message.textContent = "Las contraseñas no coinciden.";
    message.classList.add("form-message-error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Creando cuenta...";

  try {
    await registerUser(email, password);
    window.location.replace("/login.html?registered=true");
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("form-message-error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Crear cuenta";
  }
});