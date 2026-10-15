import { Router } from "express";
import { calcularEstadoUsuario } from "../services/estadoUsuario.service.js";

const router = Router();

router.post("/estado", (request, response) => {
  const resultado = calcularEstadoUsuario(request.body);
  return response.status(200).json(resultado);
});

export default router;