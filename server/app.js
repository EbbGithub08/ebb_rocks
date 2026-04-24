import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { apiRouter } from "./routes/api/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");

function parseCorsOrigins() {
  return String(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createApp() {
  const app = express();
  const allowedOrigins = parseCorsOrigins();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", apiRouter);
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.get("/admin", (_req, res) => {
    res.redirect(302, "/admin.html");
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(distDir, { index: false }));

    app.get("*", (req, res, next) => {
      if (req.method !== "GET") {
        return next();
      }
      const ext = path.extname(req.path);
      if (ext !== "") {
        return next();
      }
      res.sendFile(path.join(distDir, "index.html"), (err) => next(err));
    });

    app.use((_req, res) => {
      res.status(404).type("text/plain").send("Not found");
    });
  }

  return app;
}
