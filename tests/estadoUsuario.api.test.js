import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestContext } from "./helpers/testContext.js";

describe("POST /api/prueba/estado", () => {
  it("variante6: responde al ejemplo sin iniciar sesión", async () => {
    const { app } = await createTestContext();

    const response = await request(app)
      .post("/api/prueba/estado")
      .send({
        proveedor: "local",
        confirmado: false,
        eliminado: false
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      estado: "pendiente",
      puedeIniciarSesion: false
    });
  });

  it("variante6: permite oauth y da prioridad a eliminado", async () => {
    const { app } = await createTestContext();

    const activo = await request(app)
      .post("/api/prueba/estado")
      .send({
        proveedor: "oauth",
        confirmado: false,
        eliminado: false
      });

    expect(activo.status).toBe(200);
    expect(activo.body).toEqual({
      estado: "activo",
      puedeIniciarSesion: true
    });

    const eliminado = await request(app)
      .post("/api/prueba/estado")
      .send({
        proveedor: "oauth",
        confirmado: true,
        eliminado: true
      });

    expect(eliminado.status).toBe(200);
    expect(eliminado.body).toEqual({
      estado: "eliminado",
      puedeIniciarSesion: false
    });
  });

  it("variante6: devuelve error plano 400 para datos inválidos", async () => {
    const { app } = await createTestContext();

    for (const datos of [
      { proveedor: "google", confirmado: true, eliminado: false },
      { proveedor: "local", confirmado: "true", eliminado: false },
      { proveedor: "local", confirmado: true }
    ]) {
      const response = await request(app)
        .post("/api/prueba/estado")
        .send(datos);

      expect(response.status).toBe(400);
      expect(typeof response.body.error).toBe("string");
      expect(response.body.error.length).toBeGreaterThan(0);
    }
  });
});