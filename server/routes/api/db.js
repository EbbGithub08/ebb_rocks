import { Router } from "express";
import { getPool } from "../../db/pool.js";

const router = Router();

router.get("/health", async (_req, res) => {
  const pool = getPool();
  if (!pool) {
    res.status(500).json({ ok: false, error: "Database is not configured" });
    return;
  }

  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    console.error("db health error", error);
    res.status(500).json({ ok: false, error: "Database connection failed" });
  }
});

export { router as dbRouter };
