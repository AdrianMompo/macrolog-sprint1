import {
  checkUserActive,
  deleteUser,
  getUsers,
  logoutUser
} from "./apiClient.js";
import { requireUser } from "./session.js";

const emailElement = document.querySelector("#user-email");
const logoutButton = document.querySelector("#logout-button");
const tableBody = document.querySelector("#users-table-body");
const pageMessage = document.querySelector("#page-message");

let currentUser = null;

const statusLabels = {
  active: "Activo",
  pending: "Pendiente",
  deleted: "Eliminado"
};

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function showMessage(text, type = "error") {
  pageMessage.textContent = text;
  pageMessage.className =
    type === "success"
      ? "form-message form-message-success"
      : "form-message form-message-error";
}

function createUserRow(user) {
  const row = document.createElement("tr");

  row.append(createCell(user.email));
  row.append(createCell(user.role === "admin" ? "Administrador" : "Usuario"));

  const statusCell = createCell(
    statusLabels[user.status] ?? user.status
  );

  statusCell.classList.add(`status-${user.status}`);
  row.append(statusCell);

  const checkCell = document.createElement("td");
  const checkButton = document.createElement("button");

  checkButton.type = "button";
  checkButton.className = "table-button";
  checkButton.textContent = "Comprobar";
  checkButton.disabled = user.status === "deleted";

  checkButton.addEventListener("click", async () => {
    checkButton.disabled = true;

    try {
      const result = await checkUserActive(user.id);

      showMessage(
        result.active
          ? `${user.email} está activo.`
          : `${user.email} no está activo.`,
        "success"
      );
    } catch (error) {
      showMessage(error.message);
    } finally {
      checkButton.disabled = user.status === "deleted";
    }
  });

  checkCell.append(checkButton);
  row.append(checkCell);

  const actionsCell = document.createElement("td");
  const deleteButton = document.createElement("button");

  deleteButton.type = "button";
  deleteButton.className = "table-button table-button-danger";
  deleteButton.textContent = "Eliminar";
  deleteButton.disabled = user.status === "deleted";

  deleteButton.addEventListener("click", async () => {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar a ${user.email}?`
    );

    if (!confirmed) {
      return;
    }

    deleteButton.disabled = true;

    try {
      await deleteUser(user.id);

      if (user.id === currentUser.id) {
        await logoutUser();
        window.location.replace("/");
        return;
      }

      showMessage("Usuario eliminado correctamente.", "success");
      await loadUsers();
    } catch (error) {
      showMessage(error.message);
      deleteButton.disabled = false;
    }
  });

  actionsCell.append(deleteButton);
  row.append(actionsCell);

  return row;
}

async function loadUsers() {
  try {
    const result = await getUsers();
    tableBody.replaceChildren();

    result.users.forEach((user) => {
      tableBody.append(createUserRow(user));
    });
  } catch (error) {
    showMessage(error.message);
  }
}

async function loadAdminPage() {
  currentUser = await requireUser("admin");

  if (!currentUser) {
    return;
  }

  emailElement.textContent = currentUser.email;
  await loadUsers();
}

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    await logoutUser();
    window.location.replace("/");
  } catch (error) {
    showMessage(error.message);
    logoutButton.disabled = false;
  }
});

loadAdminPage();