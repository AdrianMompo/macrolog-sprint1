import { AppError } from "../utils/appError.js";

export function calcularEstadoUsuario(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    throw new AppError("El cuerpo debe ser un objeto JSON", 400);
  }

  const { proveedor, confirmado, eliminado } = datos;

  if (proveedor !== "local" && proveedor !== "oauth") {
    throw new AppError("El proveedor debe ser local u oauth", 400);
  }

  if (typeof confirmado !== "boolean") {
    throw new AppError("El campo confirmado debe ser booleano", 400);
  }

  if (typeof eliminado !== "boolean") {
    throw new AppError("El campo eliminado debe ser booleano", 400);
  }

  let estado;

  if (eliminado) {
    estado = "eliminado";
  } else if (proveedor === "oauth" || confirmado) {
    estado = "activo";
  } else {
    estado = "pendiente";
  }

  return {
    estado,
    puedeIniciarSesion: estado === "activo"
  };
}