import { describe, expect, it } from "vitest";
import { calcularEstadoUsuario } from "../src/services/estadoUsuario.service.js";

describe("calcularEstadoUsuario", () => {
  it("variante6: deja pendiente al usuario local sin confirmar", () => {
    expect(
      calcularEstadoUsuario({
        proveedor: "local",
        confirmado: false,
        eliminado: false
      })
    ).toEqual({
      estado: "pendiente",
      puedeIniciarSesion: false
    });
  });

  it("variante6: activa al usuario local confirmado", () => {
    expect(
      calcularEstadoUsuario({
        proveedor: "local",
        confirmado: true,
        eliminado: false
      })
    ).toEqual({
      estado: "activo",
      puedeIniciarSesion: true
    });
  });

  it("variante6: activa al usuario oauth aunque confirmado sea false", () => {
    expect(
      calcularEstadoUsuario({
        proveedor: "oauth",
        confirmado: false,
        eliminado: false
      })
    ).toEqual({
      estado: "activo",
      puedeIniciarSesion: true
    });
  });

  it("variante6: eliminado prevalece sobre los demás datos", () => {
    expect(
      calcularEstadoUsuario({
        proveedor: "oauth",
        confirmado: true,
        eliminado: true
      })
    ).toEqual({
      estado: "eliminado",
      puedeIniciarSesion: false
    });
  });

  it("variante6: rechaza un proveedor desconocido", () => {
    expect(() =>
      calcularEstadoUsuario({
        proveedor: "google",
        confirmado: true,
        eliminado: false
      })
    ).toThrow("El proveedor debe ser local u oauth");
  });

  it("variante6: rechaza booleanos incorrectos o ausentes", () => {
    expect(() =>
      calcularEstadoUsuario({
        proveedor: "local",
        confirmado: "false",
        eliminado: false
      })
    ).toThrow("El campo confirmado debe ser booleano");

    expect(() =>
      calcularEstadoUsuario({
        proveedor: "local",
        confirmado: true
      })
    ).toThrow("El campo eliminado debe ser booleano");
  });
});