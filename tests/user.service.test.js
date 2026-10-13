import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUserRepository } from "../src/repositories/inMemoryUser.repository.js";
import { UserService } from "../src/services/user.service.js";

const ADMIN_PASSWORD = "Admin1234";
const USER_PASSWORD = "Usuario1234";

describe("UserService", () => {
  let repository;
  let service;
  let admin;

  beforeEach(async () => {
    repository = new InMemoryUserRepository();
    service = new UserService(repository, {
      passwordRounds: 4,
      requireEmailConfirmation: false
    });

    admin = await service.createAdmin({
      email: "admin@macrolog.es",
      password: ADMIN_PASSWORD
    });
  });

  it("registra un usuario normalizando el email y protegiendo la contraseña", async () => {
    const user = await service.register({
      email: "  PERSONA@Example.com ",
      password: USER_PASSWORD
    });

    const storedUser = await repository.findById(user.id);

    expect(user.email).toBe("persona@example.com");
    expect(user.role).toBe("user");
    expect(user.active).toBe(true);
    expect(storedUser.passwordHash).not.toBe(USER_PASSWORD);
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("rechaza el registro de un email existente", async () => {
    await service.register({
      email: "persona@example.com",
      password: USER_PASSWORD
    });

    await expect(
      service.register({
        email: "PERSONA@example.com",
        password: USER_PASSWORD
      })
    ).rejects.toMatchObject({
      code: "EMAIL_ALREADY_EXISTS",
      statusCode: 409
    });
  });

  it("rechaza las contraseñas de menos de ocho caracteres", async () => {
    await expect(
      service.register({
        email: "persona@example.com",
        password: "123"
      })
    ).rejects.toMatchObject({
      code: "WEAK_PASSWORD",
      statusCode: 400
    });
  });

  it("impide iniciar sesión con una cuenta pendiente", async () => {
    const pendingService = new UserService(repository, {
      passwordRounds: 4,
      requireEmailConfirmation: true
    });

    await pendingService.register({
      email: "pendiente@example.com",
      password: USER_PASSWORD
    });

    await expect(
      pendingService.authenticate({
        email: "pendiente@example.com",
        password: USER_PASSWORD
      })
    ).rejects.toMatchObject({
      code: "ACCOUNT_PENDING",
      statusCode: 403
    });
  });

  it("permite iniciar sesión con credenciales válidas", async () => {
    await service.register({
      email: "persona@example.com",
      password: USER_PASSWORD
    });

    const user = await service.authenticate({
      email: "persona@example.com",
      password: USER_PASSWORD
    });

    expect(user.email).toBe("persona@example.com");
    expect(user.active).toBe(true);
  });

  it("permite al administrador listar usuarios sin mostrar hashes", async () => {
    await service.register({
      email: "persona@example.com",
      password: USER_PASSWORD
    });

    const users = await service.listUsers(admin.id);

    expect(users).toHaveLength(2);
    expect(users[0]).not.toHaveProperty("passwordHash");
    expect(users[1]).not.toHaveProperty("passwordHash");
  });

  it("impide que un usuario normal liste usuarios", async () => {
    const user = await service.register({
      email: "persona@example.com",
      password: USER_PASSWORD
    });

    await expect(service.listUsers(user.id)).rejects.toMatchObject({
      code: "ADMIN_REQUIRED",
      statusCode: 403
    });
  });

  it("impide que un usuario normal elimine a otro", async () => {
    const firstUser = await service.register({
      email: "primero@example.com",
      password: USER_PASSWORD
    });

    const secondUser = await service.register({
      email: "segundo@example.com",
      password: USER_PASSWORD
    });

    await expect(
      service.deleteUser(firstUser.id, secondUser.id)
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403
    });
  });

  it("permite a un usuario eliminar su propia cuenta", async () => {
    const user = await service.register({
      email: "persona@example.com",
      password: USER_PASSWORD
    });

    const deletedUser = await service.deleteUser(user.id, user.id);

    expect(deletedUser.status).toBe("deleted");
    expect(deletedUser.active).toBe(false);
  });

  it("permite al administrador consultar y eliminar usuarios", async () => {
    const user = await service.register({
      email: "persona@example.com",
      password: USER_PASSWORD
    });

    expect(await service.isUserActive(admin.id, user.id)).toBe(true);

    await service.deleteUser(admin.id, user.id);

    expect(await service.isUserActive(admin.id, user.id)).toBe(false);
  });
});