import { describe, expect, it } from "vitest";
import { getSystemStatus } from "../src/services/health.service.js";

describe("getSystemStatus", () => {
  it("devuelve el estado correcto del servicio", () => {
    const result = getSystemStatus();

    expect(result).toEqual({
      status: "ok",
      service: "MacroLog",
      version: "1.0.0"
    });
  });
});