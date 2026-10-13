import { Router } from "express";
import { getSystemStatus } from "../services/health.service.js";

const router = Router();

router.get("/", (request, response) => {
  response.status(200).json(getSystemStatus());
});

export default router;