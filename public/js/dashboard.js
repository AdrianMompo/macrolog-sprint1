import {
  deleteUser,
  logoutUser
} from "./apiClient.js";
import { requireUser } from "./session.js";

const emailElement = document.querySelector("#user-email");
const adminLink = document.querySelector("#admin-link");
const logoutButton = document.querySelector("#logout-button");
const deleteAccountButton =
  document.querySelector("#delete-account-button");
const pageMessage = document.querySelector("#page-message");

let currentUser = null;

async function loadDashboard() {
  currentUser = await requireUser();

  if (!currentUser) {
    return;
  }

  emailElement.textContent = currentUser.email;

  if (currentUser.role === "admin") {
    adminLink.classList.remove("hidden");
  }
}

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    await logoutUser();
    window.location.replace("/");
  } catch (error) {
    pageMessage.textContent = error.message;
    pageMessage.className =
      "form-message form-message-error";
    logoutButton.disabled = false;
  }
});

deleteAccountButton.addEventListener("click", async () => {
  if (!currentUser) {
    return;
  }

  const confirmed = window.confirm(
    "¿Seguro que quieres eliminar tu cuenta?"
  );

  if (!confirmed) {
    return;
  }

  deleteAccountButton.disabled = true;

  try {
    await deleteUser(currentUser.id);
    await logoutUser();
    window.location.replace("/");
  } catch (error) {
    pageMessage.textContent = error.message;
    pageMessage.className =
      "form-message form-message-error";
    deleteAccountButton.disabled = false;
  }
});

loadDashboard();