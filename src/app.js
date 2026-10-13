import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import healthRoutes from "./api/health.routes.js";

const app = express();
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const publicDirectory = path.join(currentDirectory, "..", "public");

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/health", healthRoutes);
app.use(express.static(publicDirectory));

app.use((request, response) => {
  if (request.path.startsWith("/api/")) {
    return response.status(404).json({
      error: "Ruta de la API no encontrada"
    });
  }

  return response.sendFile(path.join(publicDirectory, "index.html"));
});

export default app;