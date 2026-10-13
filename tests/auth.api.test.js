import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestContext } from "./helpers/testContext.js";

const USER_EMAIL = "persona@example.com";
const USER_PASSWORD = "Usuario1234";

describe("API de autenticación y usuarios", () => {
  it("registra un usuario sin exponer el hash", async () => {
    const { app } = await createTestContext();

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(USER_EMAIL);
    expect(response.body.user).not.toHaveProperty("passwordHash");
  });

  it("mantiene la sesión después del login", async () => {
    const { app } = await createTestContext();
    const agent = request.agent(app);

    await agent
      .post("/api/auth/register")
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD
      });

    const loginResponse = await agent
      .post("/api/auth/login")
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD
      });

    const sessionResponse = await agent.get("/api/auth/session");

    expect(loginResponse.status).toBe(200);
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.authenticated).toBe(true);
    expect(sessionResponse.body.user.email).toBe(USER_EMAIL);
  });

  it("rechaza credenciales incorrectas", async () => {
    const { app } = await createTestContext();

    await request(app)
      .post("/api/auth/register")
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: USER_EMAIL,
        password: "ContraseñaIncorrecta"
      });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rechaza rutas privadas sin una sesión", async () => {
    const { app } = await createTestContext();

    const response = await request(app).get("/api/users");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe(
      "AUTHENTICATION_REQUIRED"
    );
  });

  it("impide que un usuario normal liste usuarios", async () => {
    const { app } = await createTestContext();
    const agent = request.agent(app);

    await agent
      .post("/api/auth/register")
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD
      });

    await agent
      .post("/api/auth/login")
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD
      });

    const response = await agent.get("/api/users");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ADMIN_REQUIRED");
  });

  it("permite al administrador listar usuarios", async () => {
    const { app, adminCredentials } = await createTestContext();
    const agent = request.agent(app);

    await request(app)
      .post("/api/auth/register")
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD
      });

    await agent
      .post("/api/auth/login")
      .send(adminCredentials);

    const response = await agent.get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(2);
  });

  it("el logout invalida la sesión", async () => {
    const { app } = await createTestContext();
    const agent = request.agent(app);

    await agent
      .post("/api/auth/register")
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD
      });

    await agent
      .post("/api/auth/login")
      .send({
        email: USER_EMAIL,
        password: USER_PASSWORD
      });

    const logoutResponse = await agent.post("/api/auth/logout");
    const protectedResponse = await agent.get("/api/users");

    expect(logoutResponse.status).toBe(204);
    expect(protectedResponse.status).toBe(401);
  });
});