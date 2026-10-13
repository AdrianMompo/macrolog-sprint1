import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestContext } from "./helpers/testContext.js";

describe("GET /api/health", () => {
  it("responde con HTTP 200 y el estado de MacroLog", async () => {
    const { app } = await createTestContext();
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("MacroLog");
  });
});