import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config.js";
import { prisma } from "./db/prisma.js";
import { asyncHandler } from "./middleware/async.js";
import { errorHandler, notFound } from "./middleware/error.js";
import authRouter from "./routes/auth.js";
import estoqueRouter from "./routes/estoque.js";
import farmaciaRouter from "./routes/farmacia.js";
import operacaoRouter from "./routes/operacao.js";
import paeRouter from "./routes/pae.js";
import popRouter from "./routes/pop.js";
import prontuariosRouter from "./routes/prontuarios.js";
import temperaturaRouter from "./routes/temperatura.js";
import usuariosRouter from "./routes/usuarios.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",") }));
app.use(express.json({ limit: "1mb" }));

if (config.env !== "test") {
  app.use("/api/auth/login", rateLimit({
    windowMs: 60_000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, res) {
      res.status(429).json({ error: { message: "Muitas tentativas. Aguarde um minuto." } });
    },
  }));
}

app.get("/", (_req, res) => {
  res.json({ name: "SISLAR API", institution: "Lar do Irmão Velho", health: "/api/health" });
});

app.get("/api/health", asyncHandler(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "up" });
}));

app.use("/api/auth", authRouter);
app.use("/api", usuariosRouter);
app.use("/api/prontuarios", prontuariosRouter);
app.use("/api/pae", paeRouter);
app.use("/api/pop", popRouter);
app.use("/api/farmacia", farmaciaRouter);
app.use("/api/estoque", estoqueRouter);
app.use("/api/temperatura", temperaturaRouter);
app.use("/api", operacaoRouter);
app.use(notFound);
app.use(errorHandler);
